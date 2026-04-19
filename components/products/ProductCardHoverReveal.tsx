'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Eye, ArrowRight } from 'lucide-react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    compare_price?: number | null
    images: string[]
    slug: string
    description?: string | null
  }
}

export function ProductCardHoverReveal({ product }: ProductCardProps) {
  return (
    <Link href={`/produit/${product.slug}`} className="group relative block">
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gray-900 border border-white/5 shadow-lg">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 bg-gradient-to-br from-gray-800 to-gray-900">
            <ShoppingBag size={48} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-sm font-black text-emerald-400">{product.price.toLocaleString('fr-FR')} F</span>
        </div>

        {/* Discount Badge */}
        {product.compare_price && product.compare_price > product.price && (
          <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full">
            <span className="text-xs font-black text-white">-{Math.round((1 - product.price / product.compare_price) * 100)}%</span>
          </div>
        )}

        {/* Bottom Reveal Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{product.name}</h3>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-sm text-white/40 line-through mr-2">{product.compare_price.toLocaleString('fr-FR')} F</span>
          )}
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            <Eye size={16} /> Voir le produit <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  )
}
