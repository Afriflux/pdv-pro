'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { X, Download, Share2, Loader2 } from 'lucide-react'

interface QRCodeModalProps {
  productId: string
  productName: string
  onClose: () => void
}

export function QRCodeModal({ productId, productName, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const payUrl = `https://yayyam.com/pay/${productId}`

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(payUrl, {
          width: 512,
          margin: 2,
          color: {
            dark: '#0D5C4A', // Émeraude profond
            light: '#FFFFFF'
          }
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error('Failed to generate QR Code:', err)
      } finally {
        setLoading(false)
      }
    }
    generateQR()
  }, [payUrl])

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Achetez ${productName} ici : ${payUrl}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden relative border border-line animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <h3 className="text-xl font-black text-ink">QR Code Produit</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-dust hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 flex flex-col items-center">
          
          {/* QR Display */}
          <div className="relative aspect-square w-full max-w-[280px] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden">
            {loading ? (
              <Loader2 className="animate-spin text-emerald" size={32} />
            ) : qrDataUrl ? (
              <div className="absolute inset-0 p-4">
                <Image src={qrDataUrl} alt={`QR Code for ${productName}`} fill sizes="280px" className="object-contain p-4" />
              </div>
            ) : null}
          </div>

          <div className="text-center space-y-1">
            <p className="font-bold text-ink truncate w-full px-4">{productName}</p>
            <p className="text-xs text-dust">Scannez pour acheter directement</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <a 
              href={qrDataUrl} 
              download={`QR_${productName.replace(/\s+/g, '_')}.png`}
              className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-ink font-black py-4 rounded-2xl transition-all text-sm"
            >
              <Download size={18} />
              PNG
            </a>
            <button 
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5c] text-white font-black py-4 rounded-2xl transition-all text-sm shadow-lg shadow-green-100"
            >
              <Share2 size={18} />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-gray-50 border-t border-line text-center">
          <p className="text-[10px] text-dust font-bold uppercase tracking-widest">Généré par Yayyam</p>
        </div>
      </div>
    </div>
  )
}
