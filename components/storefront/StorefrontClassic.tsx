'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingBag, Award, ArrowRight } from 'lucide-react'

interface StorefrontProps {
  store: {
    name: string
    store_name?: string | null
    logo_url?: string | null
    banner_url?: string | null
    description?: string | null
    category?: string | null
    slug: string
    social_links?: Record<string, string> | null
  }
  products: Array<{
    id: string
    name: string
    price: number
    compare_price?: number | null
    images: string[]
    slug: string
  }>
}

export function StorefrontClassic({ store, products }: StorefrontProps) {
  const displayName = store.store_name || store.name

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#0A1F1A] to-[#143D30] overflow-hidden">
        {store.banner_url && (
          <Image src={store.banner_url} alt={displayName} fill className="object-cover opacity-40" unoptimized />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex items-end gap-6">
          {store.logo_url ? (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
              <Image src={store.logo_url} alt={displayName} width={96} height={96} className="object-cover w-full h-full" unoptimized />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-xl bg-emerald-700 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={36} className="text-white" />
            </div>
          )}
          <div className="text-white">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{displayName}</h1>
            {store.category && (
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {store.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {store.description && (
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <p className="text-lg text-gray-600 leading-relaxed">{store.description}</p>
        </div>
      )}

      {/* Separator */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gray-200" />
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Award size={24} className="text-emerald-600" />
          Nos Produits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/produit/${product.slug}`} className="group">
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
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
          ))}
        </div>
      </div>
    </div>
  )
}
