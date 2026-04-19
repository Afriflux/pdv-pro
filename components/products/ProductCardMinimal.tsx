'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, ArrowRight, Eye } from 'lucide-react'

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

export function ProductCardMinimal({ product }: ProductCardProps) {
  return (
    <Link href={`/produit/${product.slug}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        <div className="aspect-square relative overflow-hidden bg-gray-50">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingBag size={40} />
            </div>
          )}
          {product.compare_price && product.compare_price > product.price && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              -{Math.round((1 - product.price / product.compare_price) * 100)}%
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-emerald-700">
              {product.price.toLocaleString('fr-FR')} F
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {product.compare_price.toLocaleString('fr-FR')} F
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
