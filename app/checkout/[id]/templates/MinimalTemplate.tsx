'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ShieldCheck, Truck, ChevronDown, Star, RotateCcw, BadgeCheck } from 'lucide-react'

/**
 * MinimalTemplate — Template épuré style Apple Store
 * Focus sur l'image, typographie serrée, minimal chrome
 * Couleurs dynamiques via `accent` (store.primary_color)
 * Idéal pour : Mode, accessoires, parfums, beauté, lifestyle
 */
export function MinimalTemplate({ 
  product, 
  accent,
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode
}: any) {
  const accentLight = accent + '15'

  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* ── Barre de navigation ultra-minimale ──────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-50">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href={`/${product.store.slug}`} className="text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href={`/${product.store.slug}`} className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
            {product.store.name}
            {product.store.kyc_status === 'verified' && <BadgeCheck className="w-3.5 h-3.5" {...{ style: { color: accent } }} />}
          </Link>
          <Lock className="w-3.5 h-3.5 text-gray-300" />
        </div>
      </header>

      {/* ── Hero Image pleine largeur ──────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="aspect-[4/5] md:aspect-[16/10] relative overflow-hidden bg-gray-50">
          {imageGalleryNode}
        </div>
      </div>

      {/* ── Contenu centré ─────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-6 py-12 md:py-16 space-y-10">
        
        {/* Nom & Prix */}
        <div className="text-center">
          {product.category && (
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{product.category}</p>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-[1.15]">
            {product.name}
          </h1>
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="text-2xl font-black" {...{ style: { color: accent } }}>
              {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA
            </span>
            {product.price !== basePrice && (
              <span className="text-base text-gray-400 line-through font-medium">
                {product.price.toLocaleString('fr-FR')} F
              </span>
            )}
          </div>
        </div>

        {/* Description courte */}
        {product.description && (
          <p className="text-center text-gray-500 font-medium leading-relaxed text-[15px] max-w-md mx-auto">
            {product.description.split('\n')[0]}
          </p>
        )}

        {/* CTA principal */}
        {!showForm ? (
          <div className="space-y-3">
            <button 
              onClick={() => handleOpenForm('online')}
              className="w-full text-white font-black py-4 rounded-full text-sm uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              {...{ style: { backgroundColor: accent, boxShadow: `0 8px 30px ${accent}35` } }}
            >
              Ajouter au panier — {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA
            </button>
            {product.cash_on_delivery && (
              <button 
                onClick={() => handleOpenForm('cod')}
                className="w-full py-3.5 rounded-full text-sm font-bold border-2 transition-all hover:opacity-80"
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

        {/* Détails produit (accordéon) */}
        {product.description && product.description.split('\n').length > 1 && (
          <details className="border-t border-gray-100 pt-6 [&_summary::-webkit-details-marker]:hidden group">
            <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-gray-900 select-none text-sm pb-2">
              Description complète
              <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-4 text-sm text-gray-600 leading-relaxed">
              {product.description.split('\n').map((line: string, i: number) =>
                line.trim() ? <p key={i} className="mb-3">{line}</p> : <br key={i} />
              )}
            </div>
          </details>
        )}

        {/* Micro badges */}
        <div className="flex items-center justify-center gap-6 text-gray-400 text-[11px] font-bold uppercase tracking-widest pt-4">
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Sécurisé</span>
          <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Livraison</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Garanti 7j</span>
        </div>

        {/* Section vendeur */}
        <div className="border-t border-gray-100 pt-8 flex items-center gap-4">
          {product.store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.store.logo_url} alt={product.store.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm" {...{ style: { backgroundColor: accent } }}>
              {product.store.name[0]}
            </div>
          )}
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{product.store.name}</p>
            <p className="text-xs text-gray-500">{product.store.productsCount} produits</p>
          </div>
          <Link href={`/${product.store.slug}`} className="text-xs font-bold hover:underline" {...{ style: { color: accent } }}>
            Voir tout →
          </Link>
        </div>
      </div>

      {/* Footer discret */}
      <footer className="py-8 text-center">
        <p className="text-gray-300 text-xs font-medium">
          Propulsé par <span className="text-gray-400 font-bold">Yayyam</span>
        </p>
      </footer>
    </div>
  )
}
