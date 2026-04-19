'use client'

import React from 'react'
import Image from 'next/image'
import { ShoppingCart, CheckCircle, Star, Shield, ArrowRight, Zap } from 'lucide-react'

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

export function FunnelCinematic({ product, store }: FunnelProps) {
  const displayName = store.store_name || store.name

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* Urgency Bar */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-center py-2.5 text-sm font-black tracking-wide flex items-center justify-center gap-2">
        <Zap size={16} className="animate-pulse" />
        OFFRE FLASH — Plus que quelques unités disponibles !
        <Zap size={16} className="animate-pulse" />
      </div>

      {/* Cinematic Hero */}
      <div className="relative min-h-[60vh] flex items-center">
        {product.images?.[0] && (
          <>
            <Image src={product.images[0]} alt={product.name} fill className="object-cover opacity-30" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20 w-full">
          <div className="max-w-2xl">
            <span className="text-emerald-400 font-mono text-sm uppercase tracking-widest font-bold">{displayName}</span>
            <h1 className="text-5xl md:text-7xl font-black mt-4 leading-none tracking-tighter">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-xl text-white/60 mt-6 leading-relaxed max-w-lg">{product.description}</p>
            )}

            {/* Price */}
            <div className="mt-8 flex items-baseline gap-4">
              <span className="text-6xl font-black text-emerald-400">{product.price.toLocaleString('fr-FR')} F</span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-2xl text-white/30 line-through">{product.compare_price.toLocaleString('fr-FR')} F</span>
              )}
            </div>

            {/* CTA */}
            <button className="mt-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xl font-black py-5 px-12 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-all flex items-center gap-3 group">
              <ShoppingCart size={24} />
              Commander Maintenant
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Paiement Sécurisé', desc: 'Vos données sont protégées' },
            { icon: CheckCircle, title: 'Livraison Rapide', desc: 'Recevez en 24-72h' },
            { icon: Star, title: 'Satisfait ou Remboursé', desc: 'Garantie totale' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm">
              <Icon size={32} className="text-emerald-400 mx-auto mb-3" />
              <h3 className="font-bold text-white text-lg">{title}</h3>
              <p className="text-white/50 text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery */}
      {product.images && product.images.length > 1 && (
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10">
                <Image src={img} alt="" width={400} height={400} className="object-cover w-full h-full hover:scale-105 transition-transform duration-500" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
