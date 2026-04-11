'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Play, ChevronRight, ShieldCheck, Star, CheckCircle, Users } from 'lucide-react'

/**
 * VideoFirstTemplate — Template vidéo-centré
 * Video hero plein écran avec overlay, contenu en dessous
 * Couleurs 100% dynamiques via `accent` (store.primary_color)
 * Idéal pour : Formations, masterclass, démo produit, coaching
 */
export function VideoFirstTemplate({ 
  product, 
  accent,
  bunnyVideoId,
  bunnyLibraryId,
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode: _imageGalleryNode
}: any) {
  const coverImage = product.images?.[0]
  const accentLight = accent + '15'
  const hasVideo = bunnyVideoId && bunnyLibraryId

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      
      {/* ── Video Hero Section ─────────────────────────────────── */}
      <div className="relative w-full aspect-video md:aspect-[21/9] max-h-[70vh] overflow-hidden bg-black">
        {hasVideo ? (
          <iframe
            src={`https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}?autoplay=true&loop=true&muted=true&preload=true`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={product.name}
          />
        ) : coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:scale-110 transition-transform cursor-pointer">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" {...{ style: { background: `linear-gradient(135deg, ${accent}40, ${accent}10)` } }}>
            <Play className="w-16 h-16 text-white/40" />
          </div>
        )}
        
        {/* Gradient overlay (bottom) */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
        
        {/* Navigation */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
          <Link href={`/${product.store.slug}`} className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold bg-black/30 backdrop-blur-md px-4 py-2 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            {product.store.name}
          </Link>
          <div className="flex items-center gap-2 text-white/50 text-xs font-bold bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
            <Lock className="w-3.5 h-3.5" /> Sécurisé
          </div>
        </div>
      </div>

      {/* ── Contenu principal ──────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-10 relative z-10 -mt-12">
        
        {/* Titre & Prix */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6">{product.name}</h1>
          <div className="flex items-center justify-center gap-4">
            <span className="text-3xl font-black" {...{ style: { color: accent } }}>
              {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA
            </span>
            {product.price !== basePrice && (
              <span className="text-lg text-gray-500 line-through font-medium">
                {product.price.toLocaleString('fr-FR')} F
              </span>
            )}
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400" />
          </div>
          <span className="text-gray-400 text-sm font-bold">Recommandé par nos clients</span>
        </div>

        {/* Description intelligente */}
        {product.description && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 md:p-10">
            {product.description.split('\n').map((line: string, i: number) => {
              const trimmed = line.trim()
              if (trimmed.startsWith('✨') || trimmed.startsWith('##')) {
                return <h3 key={i} className="font-black text-white text-xl mt-8 mb-4 first:mt-0">{trimmed.replace(/[✨#]/g, '').trim()}</h3>
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                return (
                  <div key={i} className="flex gap-3 my-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" {...{ style: { color: accent } }} />
                    <span className="text-gray-300 font-medium">{trimmed.substring(2)}</span>
                  </div>
                )
              }
              if (trimmed === '') return <div key={i} className="h-3" />
              return <p key={i} className="text-gray-400 leading-relaxed my-3">{trimmed}</p>
            })}
          </div>
        )}

        {/* CTA centré */}
        {!showForm ? (
          <div className="space-y-4 text-center">
            <button 
              onClick={() => handleOpenForm('online')}
              className="w-full max-w-md mx-auto flex items-center justify-between text-white font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-base"
              {...{ style: { backgroundColor: accent, boxShadow: `0 10px 40px ${accent}50` } }}
            >
              <span>Accéder maintenant</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            {product.cash_on_delivery && (
              <button 
                onClick={() => handleOpenForm('cod')}
                className="text-sm font-bold hover:underline"
                {...{ style: { color: accent } }}
              >
                Ou payer à la livraison
              </button>
            )}
            <p className="text-gray-500 text-xs font-medium flex items-center justify-center gap-2 mt-4">
              <Lock className="w-3.5 h-3.5" /> Transaction sécurisée · Paiement unique
            </p>
          </div>
        ) : (
          <div id="checkout-form-section" className="bg-white text-gray-900 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-800">📋 Vos informations</h2>
              <button type="button" onClick={() => handleOpenForm(null)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            {checkoutFormNode}
          </div>
        )}

        {/* Garanties */}
        <div className="grid grid-cols-3 gap-3 pt-6">
          <div className="text-center p-4 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <ShieldCheck className="w-6 h-6 mx-auto mb-2" {...{ style: { color: accent } }} />
            <p className="text-xs font-bold text-gray-400">Satisfait ou remboursé</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <Lock className="w-6 h-6 mx-auto mb-2" {...{ style: { color: accent } }} />
            <p className="text-xs font-bold text-gray-400">Paiement sécurisé</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <Users className="w-6 h-6 mx-auto mb-2" {...{ style: { color: accent } }} />
            <p className="text-xs font-bold text-gray-400">Support réactif</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-gray-600 text-xs font-medium">
            Propulsé par <span className="text-gray-400 font-bold">Yayyam</span>
            {product.store?.name && <span className="opacity-50"> · {product.store.name}</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
