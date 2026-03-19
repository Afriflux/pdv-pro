/**
 * lib/digital/generateDownloadToken.ts
 * Génère un lien de téléchargement sécurisé pour les produits digitaux.
 * - Token UUID aléatoire (cryptographiquement sûr)
 * - Expiration configurable (défaut : 72h)
 * - Limite de téléchargements (défaut : 3)
 * - Stocké dans la table DownloadToken
 */
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

interface GenerateTokenParams {
  orderId: string
  productId: string
  fileUrl: string       // URL du fichier dans Supabase Storage (privé) ou lien externe
  expiresInHours?: number
  maxDownloads?: number
}

interface DownloadTokenResult {
  token: string
  downloadUrl: string  // URL publique → /dl/[token]
  expiresAt: Date
}

export async function generateDownloadToken(
  params: GenerateTokenParams
): Promise<DownloadTokenResult> {
  const supabase      = await createClient()
  const token         = randomUUID()
  const expiresInHours = params.expiresInHours ?? 72
  const maxDownloads  = params.maxDownloads ?? 3
  const expiresAt     = new Date(Date.now() + expiresInHours * 3_600_000)

  const { error } = await supabase.from('DownloadToken').insert({
    token,
    order_id:      params.orderId,
    product_id:    params.productId,
    file_url:      params.fileUrl,
    expires_at:    expiresAt.toISOString(),
    max_downloads: maxDownloads,
    download_count: 0,
  })

  if (error) throw new Error('Erreur création token: ' + error.message)

  const baseUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const downloadUrl = `${baseUrl}/dl/${token}`

  return { token, downloadUrl, expiresAt }
}
