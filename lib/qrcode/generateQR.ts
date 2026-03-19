/**
 * lib/qrcode/generateQR.ts
 * Utilitaires pour la génération de QR Codes.
 * Renvoie une Data URL base64 (image/png) exploitable
 * directement dans une balise <img src="..." /> ou pour le téléchargement.
 */

import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Génère un QR Code sous forme de Data URL (PNG) pour une chaîne donnée.
 * Utile pour transformer un lien court en image scannable.
 */
export async function generateQrDataUrl(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      width: options.width ?? 400,
      margin: options.margin ?? 2,
      color: {
        dark: options.color?.dark ?? '#111827', // Noir profond
        light: options.color?.light ?? '#ffffff', // Blanc
      },
      errorCorrectionLevel: 'H', // High error correction
    }

    return await QRCode.toDataURL(text, defaultOptions)
  } catch (error) {
    console.error('[generateQrDataUrl] Erreur:', error)
    return ''
  }
}

/**
 * Génère un QR Code (PNG Data URL) avec le texte "PDV" au centre.
 * Utilise un Canvas pour fusionner le QR et le logo afin qu'il soit présent au téléchargement.
 */
export async function generateQrWithLogo(
  text: string,
  _storeName: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const width = options.width ?? 600
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = width

    // 1. Générer le QR Code sur le canvas
    await QRCode.toCanvas(canvas, text, {
      width: width,
      margin: options.margin ?? 2,
      color: {
        dark: options.color?.dark ?? '#111827',
        light: options.color?.light ?? '#ffffff',
      },
      errorCorrectionLevel: 'H', // Obligatoire pour pouvoir couvrir le centre
    })

    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas.toDataURL()

    // 2. Dessiner le logo au centre
    const center = width / 2
    const logoSize = width * 0.22 // Taille du logo (environ 22% du QR)
    
    // Fond blanc arrondi pour le logo
    ctx.fillStyle = '#ffffff'
    const padding = 10
    const rectSize = logoSize + padding
    
    // Dessiner le rectangle blanc arrondi
    const x = center - rectSize / 2
    const y = center - rectSize / 2
    const r = 8 // border radius
    
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + rectSize - r, y)
    ctx.quadraticCurveTo(x + rectSize, y, x + rectSize, y + r)
    ctx.lineTo(x + rectSize, y + rectSize - r)
    ctx.quadraticCurveTo(x + rectSize, y + rectSize, x + rectSize - r, y + rectSize)
    ctx.lineTo(x + r, y + rectSize)
    ctx.quadraticCurveTo(x, y + rectSize, x, y + rectSize - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()

    // 3. Texte "PDV"
    ctx.fillStyle = options.color?.dark ?? '#f97316' // Orange PDV par défaut si spécifié
    ctx.font = `black ${Math.floor(logoSize * 0.45)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PDV', center, center)

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('[generateQrWithLogo] Erreur:', error)
    return ''
  }
}
