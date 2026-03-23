'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CopyButton from '@/components/dashboard/CopyButton'
import ProductImageViewer from '@/components/dashboard/ProductImageViewer'
import { toggleProductStatus, duplicateProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import { QrCode, Eye } from 'lucide-react'
import { QRCodeModal } from '@/components/dashboard/QRCodeModal'

interface ProductCardProps {
  product: {
    id: string
    name: string
    category: string | null
    price: number
    active: boolean
    cash_on_delivery: boolean
    type: string
    images: string[] | null
    views?: number
  }
  baseUrl: string
  displayMode?: 'grid3' | 'grid4'
}

export default function ProductCard({ product, baseUrl }: ProductCardProps) {
  const [pending, startTransition] = useTransition()
  const [showQR, setShowQR] = React.useState(false)

  const handleToggle = () => {
    startTransition(() => {
      toggleProductStatus(product.id, product.active)
    })
  }

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        await duplicateProduct(product.id)
        toast.success("Produit dupliqué ✅")
      } catch {
        toast.error("Erreur lors de la duplication")
      }
    })
  }

  const aspectClass = 'aspect-square'

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white hover:border-[#0F7A60]/30 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 flex flex-col group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* IMAGE */}
      <div className={`relative ${aspectClass} w-full overflow-hidden bg-gray-50/50`}>

        <Link href={`/dashboard/products/${product.id}/edit`} className="absolute inset-0 z-0 flex flex-col items-center justify-center cursor-pointer">
          {!(product.images && product.images.length > 0) && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-dust">
              <span className="text-5xl">📦</span>
              <span className="text-xs">Aucune image</span>
            </div>
          )}
        </Link>

        {product.images && product.images.length > 0 && (
          <>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <ProductImageViewer images={product.images} productName={product.name} />
          </>
        )}

        {/* Badges type (gauche) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-20">
          {product.cash_on_delivery && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#D97706] shadow-sm">
              COD
            </span>
          )}
          {product.type === 'digital' && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#1D4ED8] shadow-sm">
              Digital
            </span>
          )}
          {product.type === 'coaching' && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#7C3AED] shadow-sm">
              Coaching
            </span>
          )}
        </div>

        {/* Badge statut cliquable (droite) */}
        <button
          onClick={handleToggle}
          disabled={pending}
          title={product.active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
          className={`absolute top-2 right-2 z-20 text-xs font-semibold px-2 py-1 rounded-full shadow-sm transition-all ${
            pending
              ? 'opacity-50 cursor-wait bg-gray-200 text-gray-400'
              : product.active
              ? 'bg-[#0D5C4A] text-white hover:bg-red-500 cursor-pointer'
              : 'bg-[#6B7280] text-white hover:bg-[#0D5C4A] cursor-pointer'
          }`}
        >
          {pending ? '...' : product.active ? 'Actif' : 'Inactif'}
        </button>
      </div>

      {/* INFOS PRODUIT */}
      <div className="p-3 flex flex-col flex-1">

        <Link href={`/dashboard/products/${product.id}/edit`} className="group/name">
          <h3 className="font-display text-ink font-semibold text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5rem] group-hover/name:text-emerald transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-[11px] text-dust mb-2 truncate">{product.category}</p>
        )}

        <div className="mt-auto relative z-10">
          <p className="font-display text-[#0F7A60] font-black text-xl leading-none flex items-baseline gap-1 mt-3">
            {product.price.toLocaleString('fr-FR')}
            <span className="text-[10px] text-gray-400 font-sans font-bold uppercase">FCFA</span>
          </p>
          
          <div className="flex items-center gap-1.5 mt-2 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">
              <Eye size={10} />
              <span>{(product.views || 0).toLocaleString()} vues</span>
            </div>
          </div>

          <div className="border-t border-gray-100/50 my-2.5" />

          {/* LIEN + ACTIONS */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-cream rounded-lg px-2 py-1.5 min-w-0">
              <p className="text-[10px] text-emerald font-mono truncate">
                /pay/{product.id.slice(0, 8)}...
              </p>
            </div>
            <CopyButton url={`${baseUrl}/pay/${product.id}`} compact />
            <Link
              href={`/pay/${product.id}`}
              className="text-[11px] bg-emerald text-white px-2.5 py-1.5 rounded-lg hover:bg-emerald-rich transition font-medium flex-shrink-0"
            >
              Voir
            </Link>
          </div>

          <div className="flex gap-2 mt-2 relative z-10">
            <Link
              href={`/dashboard/products/${product.id}/edit`}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-xl py-2 hover:text-[#0F7A60] hover:border-[#0F7A60]/30 hover:bg-[#0F7A60]/5 transition-all duration-300 shadow-sm"
            >
              ✏️ Modifier
            </Link>
            <button
              onClick={handleDuplicate}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate border border-line rounded-lg py-1.5 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition disabled:opacity-50"
            >
              {pending ? '...' : '👯 Dupliquer'}
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 text-slate border border-line rounded-lg hover:text-emerald hover:border-emerald/30 hover:bg-emerald/5 transition"
              title="Afficher le QR Code"
            >
              <QrCode size={16} />
            </button>
          </div>

          {showQR && (
            <QRCodeModal 
              productId={product.id} 
              productName={product.name} 
              onClose={() => setShowQR(false)} 
            />
          )}
        </div>
      </div>
    </div>
  )
}
