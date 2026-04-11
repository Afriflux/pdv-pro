'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ChevronRight, ChevronDown, ShieldCheck, Truck, MessageCircle, BadgeCheck, Star, RotateCcw } from 'lucide-react'

/**
 * EleganceTemplate — Template produit premium immersif
 * Split-screen : Image hero à gauche, contenu d'achat à droite
 * Couleurs 100% dynamiques via `accent` (store.primary_color)
 * Idéal pour : Parfumerie, luxe, joaillerie, mode haut de gamme
 */
export function EleganceTemplate({ 
  product, 
  accent,
  bunnyVideoId: _bunnyVideoId, 
  bunnyLibraryId: _bunnyLibraryId,
  groupedVariants: _groupedVariants,
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode
}: any) {
  const coverImage = product.images?.[0]
  const secondaryImages = (product.images ?? []).slice(1, 4)

  // Générer une teinte plus claire pour les fonds
  const accentLight = accent + '15' // 15 = 8% opacity en hex
  const accentMedium = accent + '30'

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-gray-900 relative">
      
      {/* ── Header discret ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${product.store.slug}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" />
            {product.store.name}
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-400">Paiement sécurisé</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* ── Layout Split-Screen ───────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
          
          {/* ─ Colonne Gauche : Galerie Immersive ─ */}
          <div className="lg:w-[55%] lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] flex flex-col">
            {/* Image principale */}
            <div className="flex-1 relative bg-gray-50 overflow-hidden">
              {imageGalleryNode}
              
              {/* Badge catégorie */}
              {product.category && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-black text-gray-700 shadow-sm border border-gray-100/50 z-10">
                  {product.category}
                </div>
              )}
            </div>

            {/* Miniatures secondaires (desktop only) */}
            {secondaryImages.length > 0 && (
              <div className="hidden lg:flex gap-2 p-3 bg-white border-t border-gray-100">
                {secondaryImages.map((img: string, i: number) => (
                  <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─ Colonne Droite : Achat ─ */}
          <div className="lg:w-[45%] p-6 md:p-10 lg:p-12 lg:overflow-y-auto">
            <div className="max-w-lg mx-auto space-y-8">
              
              {/* Titre & Prix */}
              <div>
                {product.store.kyc_status === 'verified' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-4" {...{ style: { backgroundColor: accentLight, color: accent } }}>
                    <BadgeCheck className="w-3.5 h-3.5" /> Vendeur vérifié
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-[1.1] tracking-tight">{product.name}</h1>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-black" {...{ style: { color: accent } }}>
                    {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} <span className="text-lg opacity-70">FCFA</span>
                  </span>
                  {product.price !== basePrice && (
                    <span className="text-lg text-gray-400 line-through font-bold">
                      {product.price.toLocaleString('fr-FR')} F
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="text-gray-600 text-[15px] leading-relaxed font-medium">
                  {product.description.split('\n').slice(0, 4).map((line: string, i: number) =>
                    line.trim() ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
                  )}
                  {product.description.split('\n').length > 4 && (
                    <details className="mt-2">
                      <summary className="text-sm font-bold cursor-pointer" {...{ style: { color: accent } }}>Lire la suite →</summary>
                      <div className="mt-3">
                        {product.description.split('\n').slice(4).map((line: string, i: number) =>
                          line.trim() ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Badges de confiance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-600">Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <Truck className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-600">Livraison suivie</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-600">Satisfait ou remboursé</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-600">Support WhatsApp</span>
                </div>
              </div>

              {/* Section CTA */}
              {!showForm ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => handleOpenForm('online')}
                    className="w-full flex items-center justify-between text-white font-black uppercase tracking-wider px-8 py-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl active:scale-[0.98] text-base"
                    {...{ style: { backgroundColor: accent, boxShadow: `0 10px 40px ${accent}40` } }}
                  >
                    <span>Acheter maintenant</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {product.cash_on_delivery && (
                    <button 
                      onClick={() => handleOpenForm('cod')}
                      className="w-full border-2 font-bold flex items-center justify-center gap-2 px-8 py-4 rounded-2xl transition-all hover:shadow-md text-sm"
                      {...{ style: { borderColor: accentMedium, color: accent } }}
                    >
                      💵 Payer à la livraison
                    </button>
                  )}
                </div>
              ) : (
                <div id="checkout-form-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-sm font-black text-gray-800">📋 Vos informations</h2>
                    <button type="button" onClick={() => handleOpenForm(null)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">✕ Fermer</button>
                  </div>
                  {checkoutFormNode}
                </div>
              )}

              {/* Politique de retour + Avis (accordions) */}
              <div className="space-y-3">
                <details className="bg-white rounded-2xl border border-gray-100 shadow-sm [&_summary::-webkit-details-marker]:hidden group">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-gray-800 select-none text-sm">
                    <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-gray-400" /> Politique de retour</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                    Retour accepté sous 7 jours après réception. Le produit doit être dans son état d&apos;origine. Contactez le vendeur via WhatsApp pour initier un retour.
                  </div>
                </details>

                <details className="bg-white rounded-2xl border border-gray-100 shadow-sm [&_summary::-webkit-details-marker]:hidden group">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-gray-800 select-none text-sm">
                    <span className="flex items-center gap-2"><Star className="w-4 h-4 text-gray-400" /> Avis clients</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                    <p className="text-sm text-gray-500">Les avis seront bientôt disponibles pour ce produit.</p>
                  </div>
                </details>
              </div>

              {/* Section vendeur */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
                {product.store.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.store.logo_url} alt={product.store.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg" {...{ style: { backgroundColor: accent } }}>
                    {product.store.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 flex items-center gap-1.5 text-sm">
                    {product.store.name}
                    {product.store.kyc_status === 'verified' && <BadgeCheck className="w-4 h-4" {...{ style: { color: accent } }} />}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{product.store.productsCount} produits</p>
                </div>
                <Link href={`/${product.store.slug}`} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap">
                  Voir la boutique
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
