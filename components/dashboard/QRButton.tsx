'use client'

import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { QRCodeModal } from '@/components/dashboard/QRCodeModal'

interface QRButtonProps {
  productId: string
  productName: string
}

export function QRButton({ productId, productName }: QRButtonProps) {
  const [showQR, setShowQR] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className="flex items-center gap-2 bg-white border border-line px-3 py-1.5 rounded-lg text-xs font-bold text-ink hover:bg-emerald/5 hover:text-emerald hover:border-emerald/30 transition-all shadow-sm"
        title="Voir le QR Code"
      >
        <QrCode size={14} />
        <span>QR Code</span>
      </button>

      {showQR && (
        <QRCodeModal
          productId={productId}
          productName={productName}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  )
}
