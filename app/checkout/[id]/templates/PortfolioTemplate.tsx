'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ChevronRight, BadgeCheck, X, ChevronLeft } from 'lucide-react'

/**
 * PortfolioTemplate — Template galerie masonry
 * Images en grille asymétrique avec lightbox, fond blanc, typo élégante
 * Couleurs 100% dynamiques via `accent` (store.primary_color)
 * Idéal pour : Photographes, artistes, designers, artisans, créateurs
 */
export function PortfolioTemplate({ 
  product, 
  accent,
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode: _imageGalleryNode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  const images = product.images ?? []
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* ── Navigation ultra-thin ──────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-50">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href={`/${product.store.slug}`} className="text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href={`/${product.store.slug}`} className="text-xs font-black text-gray-900 tracking-[0.15em] uppercase flex items-center gap-1.5">
            {product.store.name}
            {product.store.kyc_status === 'verified' && <BadgeCheck className="w-3.5 h-3.5" {...{ style: { color: accent } }} />}
          </Link>
          <Lock className="w-3.5 h-3.5 text-gray-300" />
        </div>
      </header>

      {/* ── Titre centré ───────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-20 pb-8 text-center">
        {product.category && (
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" {...{ style: { color: accent } }}>{product.category}</p>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">{product.name}</h1>
        {product.description && (
          <p className="mt-6 text-gray-500 font-medium text-lg leading-relaxed max-w-lg mx-auto">
            {product.description.split('\n')[0]}
          </p>
        )}
      </div>

      {/* ── Galerie Masonry ─────────────────────────────────────── */}
      {images.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="columns-2 md:columns-3 gap-3 md:gap-4">
            {images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="block w-full mb-3 md:mb-4 rounded-xl md:rounded-2xl overflow-hidden group cursor-zoom-in relative break-inside-avoid"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${product.name} — ${i + 1}`}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Section achat ──────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <span className="text-3xl font-black" {...{ style: { color: accent } }}>
            {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} <span className="text-base text-gray-400">FCFA</span>
          </span>
          {product.price !== basePrice && (
            <span className="ml-3 text-lg text-gray-400 line-through font-medium">
              {product.price.toLocaleString('fr-FR')} F
            </span>
          )}
        </div>

        {!showForm ? (
          <div className="space-y-3">
            <button 
              onClick={() => handleOpenForm('online')}
              className="w-full flex items-center justify-between text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
              {...{ style: { backgroundColor: accent, boxShadow: `0 8px 30px ${accent}30` } }}
            >
              <span>Acheter</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            {product.cash_on_delivery && (
              <button 
                onClick={() => handleOpenForm('cod')}
                className="w-full py-3.5 rounded-xl text-sm font-bold border-2 transition-all hover:opacity-80"
                {...{ style: { borderColor: accent + '40', color: accent } }}
              >
                Payer à la livraison
              </button>
            )}
          </div>
        ) : (
          <div id="checkout-form-section" className="bg-gray-50 rounded-2xl border border-gray-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-800">Vos informations</h2>
              <button type="button" onClick={() => handleOpenForm(null)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            {checkoutFormNode}
          </div>
        )}

        {/* Description complète */}
        {product.description && product.description.split('\n').length > 1 && (
          <div className="border-t border-gray-100 pt-8 text-gray-600 text-sm leading-relaxed">
            {product.description.split('\n').map((line: string, i: number) =>
              line.trim() ? <p key={i} className="mb-3">{line}</p> : <br key={i} />
            )}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-8 text-center border-t border-gray-50">
        <p className="text-gray-300 text-xs font-medium">
          Propulsé par <span className="text-gray-400 font-bold">Yayyam</span>
        </p>
      </footer>

      {/* ── Lightbox ───────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} title="Fermer la lightbox" aria-label="Fermer la lightbox" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i === 0 ? images.length - 1 : i - 1) : 0) }} title="Image précédente" aria-label="Image précédente" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i === images.length - 1 ? 0 : i + 1) : 0) }} title="Image suivante" aria-label="Image suivante" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          <div className="max-w-4xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex]}
              alt={`${product.name} — ${lightboxIndex + 1}/${images.length}`}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-white/50 text-xs text-center mt-4 font-medium">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
