'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Sparkles, ArrowRight, Eye } from 'lucide-react'

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

export function StorefrontCinematic({ store, products }: StorefrontProps) {
  const displayName = store.store_name || store.name

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* Cinematic Hero */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {store.banner_url ? (
          <Image src={store.banner_url} alt={displayName} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-[#0A1F1A] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            {store.logo_url ? (
              <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden">
                <Image src={store.logo_url} alt="" width={56} height={56} className="object-cover w-full h-full" unoptimized />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-emerald-500/50 bg-emerald-900/50 flex items-center justify-center">
                <Sparkles size={24} className="text-emerald-400" />
              </div>
            )}
            {store.category && (
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
                {store.category}
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            {displayName}
          </h1>
          {store.description && (
            <p className="text-lg text-white/60 max-w-xl leading-relaxed">{store.description}</p>
          )}
        </div>
      </div>

      {/* Products Cinematic Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Collection</h2>
          <span className="text-white/40 text-sm font-mono">{products.length} articles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link key={product.id} href={`/produit/${product.slug}`} className="group relative">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 border border-white/5">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <ShoppingBag size={48} />
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Price Badge */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-sm font-black text-emerald-400">{product.price.toLocaleString('fr-FR')} F</span>
                </div>

                {product.compare_price && product.compare_price > product.price && (
                  <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <span className="text-xs font-black text-white">-{Math.round((1 - product.price / product.compare_price) * 100)}%</span>
                  </div>
                )}

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Eye size={16} /> Voir le produit <ArrowRight size={14} />
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
