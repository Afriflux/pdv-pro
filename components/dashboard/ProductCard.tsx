'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CopyButton from '@/components/dashboard/CopyButton'
import ProductImageViewer from '@/components/dashboard/ProductImageViewer'
import { toggleProductStatus, duplicateProduct } from '@/app/actions/products'
import { toast } from '@/lib/toast'
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

  const aspectClass = 'aspect-[4/3]' // Reduced from aspect-square to make the design less vertical

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white hover:border-[#0F7A60]/30 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 flex flex-col group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* IMAGE */}
      <div className={`relative ${aspectClass} w-full overflow-hidden bg-gray-50/50`}>

        <Link href={`/dashboard/products/${product.id}/edit`} className="absolute inset-0 z-0 flex flex-col items-center justify-center cursor-pointer">
          {!(product.images && product.images.length > 0) && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-dust">
              <span className="text-4xl">📦</span>
              <span className="text-xs font-bold text-gray-400">Aucune image</span>
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
            <span className="block w-fit text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md shadow-sm text-white bg-[#D97706]">
              COD
            </span>
          )}
          {product.type === 'digital' && (
            <span className="block w-fit text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md shadow-sm text-white bg-[#1D4ED8]">
              DIGITAL
            </span>
          )}
          {product.type === 'coaching' && (
            <span className="block w-fit text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md shadow-sm text-white bg-[#7C3AED]">
              COACHING
            </span>
          )}
          {product.type === 'course' && (
            <span className="block w-fit text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md shadow-sm text-white bg-indigo-600">
              ACADÉMIE
            </span>
          )}
        </div>

        {/* Badge statut cliquable (droite) */}
        <button
          onClick={handleToggle}
          disabled={pending}
          title={product.active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
          className={`absolute top-2 right-2 z-20 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md shadow-sm transition-all flex items-center justify-center uppercase ${
            pending
              ? 'opacity-50 cursor-wait bg-gray-200 text-gray-400'
              : product.active
              ? 'bg-[#0F7A60] text-white hover:bg-red-500 cursor-pointer'
              : 'bg-[#6B7280] text-white hover:bg-[#0F7A60] cursor-pointer'
          }`}
        >
          {pending ? '...' : product.active ? 'Actif' : 'Inactif'}
        </button>
      </div>

      {/* INFOS PRODUIT */}
      <div className="p-3 flex flex-col flex-1">

        <Link href={`/dashboard/products/${product.id}/edit`} className="group/name">
          <h3 className="font-display text-ink font-semibold text-[15px] leading-snug mb-1 line-clamp-2 min-h-[40px] group-hover/name:text-emerald transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-dust mb-1 truncate">{product.category}</p>
        )}

        <div className="mt-auto relative z-10">
          <p className="font-display text-[#0F7A60] font-black text-lg leading-none flex items-baseline gap-1 mt-2">
            {product.price.toLocaleString('fr-FR')}
            <span className="text-[10px] text-gray-400 font-sans font-black tracking-widest uppercase">FCFA</span>
          </p>
          
          <div className="flex items-center gap-1.5 mt-2 mb-3">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-[2px] rounded-md shadow-sm">
              <Eye size={12} />
              <span>{(product.views || 0).toLocaleString()} vues</span>
            </div>
          </div>

          <div className="border-t border-gray-100/50 my-2" />

          {/* LIEN + ACTIONS */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 min-w-0 flex items-center h-9">
              <p className="text-xs text-emerald font-mono truncate font-medium">
                /pay/{product.id.slice(0, 8)}...
              </p>
            </div>
            <div className="h-9">
               <CopyButton url={`${baseUrl}/pay/${product.id}`} compact />
            </div>
            <Link
              href={`/pay/${product.id}`}
              className="text-[11px] uppercase font-black tracking-widest bg-[#0F7A60] text-white px-3 min-w-16 h-9 rounded-lg hover:bg-emerald-800 shadow-sm shadow-[#0F7A60]/20 transition flex-shrink-0 flex items-center justify-center cursor-pointer"
            >
              Voir
            </Link>
          </div>

          <div className="flex gap-1.5 mt-2 relative z-10">
            {product.type === 'course' ? (
              <Link
                href={`/dashboard/products/${product.id}/course`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl py-2 h-9 hover:bg-indigo-100 transition-all duration-300 shadow-sm"
              >
                🎓 Gérer
              </Link>
            ) : (
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#1A1A1A] bg-white border border-gray-200 rounded-lg py-2 h-9 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-sm"
              >
                ✏️ Modifier
              </Link>
            )}
            <button
              onClick={handleDuplicate}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg py-2 h-9 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-sm disabled:opacity-50"
            >
              {pending ? '...' : '👯 Dupliquer'}
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 text-gray-500 border border-gray-200 bg-white rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-sm"
              title="Afficher le QR Code"
            >
              <QrCode size={14} />
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
