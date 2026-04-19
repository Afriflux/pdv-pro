'use client'

import React from 'react'
import Image from 'next/image'
import { ShoppingCart, CheckCircle, Star, Shield, ArrowRight } from 'lucide-react'

interface FunnelProps {
  product: {
    name: string
    price: number
    compare_price?: number | null
    images: string[]
    description?: string | null
    slug: string
  }
  store: {
    name: string
    store_name?: string | null
    logo_url?: string | null
  }
}

export function FunnelSplit({ product, store }: FunnelProps) {
  const displayName = store.store_name || store.name

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans">
      {/* Top Bar */}
      <div className="bg-emerald-700 text-white text-center py-2 text-sm font-bold tracking-wide">
        🔥 OFFRE LIMITÉE — Livraison GRATUITE aujourd&apos;hui seulement !
      </div>

      {/* Split Layout */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
              {product.images?.[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingCart size={64} />
                </div>
              )}
              {product.compare_price && product.compare_price > product.price && (
                <div className="absolute top-4 left-4 bg-red-500 text-white font-black text-lg px-4 py-2 rounded-2xl shadow-xl">
                  -{Math.round((1 - product.price / product.compare_price) * 100)}%
                </div>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-3">
              {product.images?.slice(0, 4).map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-colors cursor-pointer">
                  <Image src={img} alt="" width={80} height={80} className="object-cover w-full h-full" unoptimized />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-8">
            <div>
              <span className="text-emerald-700 font-bold text-sm uppercase tracking-widest">{displayName}</span>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-2 leading-tight">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-black text-emerald-700">{product.price.toLocaleString('fr-FR')} F</span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-2xl text-gray-400 line-through">{product.compare_price.toLocaleString('fr-FR')} F</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-lg text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Shield, text: 'Paiement Sécurisé' },
                { icon: CheckCircle, text: 'Livraison Rapide' },
                { icon: Star, text: 'Satisfaction Garantie' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-sm font-bold">
                  <Icon size={16} /> {text}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 group">
              <ShoppingCart size={24} />
              Commander Maintenant
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
