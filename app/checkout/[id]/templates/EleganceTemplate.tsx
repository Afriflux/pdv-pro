'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ChevronRight, ChevronDown, ShieldCheck, Truck, MessageCircle, BadgeCheck, Star, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const secondaryImages = (product.images ?? []).slice(1, 4)

  // Générer une teinte plus claire pour les fonds
  const accentLight = accent + '15' // 15 = 8% opacity en hex
  const accentMedium = accent + '30'

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-gray-900 relative">
      
      {/* ── Header discret ──────────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm"
      >
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
      </motion.header>

      <div className="max-w-7xl mx-auto">
        {/* ── Layout Split-Screen ───────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
          
          {/* ─ Colonne Gauche : Galerie Immersive ─ */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:w-[55%] lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] flex flex-col"
          >
            {/* Image principale */}
            <div className="flex-1 relative bg-gray-50 overflow-hidden w-full m-0 p-0 border-b lg:border-b-0 lg:border-r border-gray-100">
              {imageGalleryNode}
              
              {/* Badge catégorie */}
              {product.category && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-black text-gray-700 shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white z-10"
                >
                  {product.category}
                </motion.div>
              )}
            </div>

            {/* Miniatures secondaires (desktop only) */}
            {secondaryImages.length > 0 && (
              <div className="hidden lg:flex gap-2 p-3 bg-white border-t border-gray-100">
                {secondaryImages.map((img: string, i: number) => (
                  <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ─ Colonne Droite : Achat ─ */}
          <div className="lg:w-[45%] p-6 md:p-10 lg:p-12 lg:overflow-y-auto">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-lg mx-auto space-y-8"
            >
              
              {/* Titre & Prix */}
              <motion.div variants={fadeUp}>
                {product.store.kyc_status === 'verified' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-4 shadow-sm" {...{ style: { backgroundColor: accentLight, color: accent } }}>
                    <BadgeCheck className="w-3.5 h-3.5" /> Vendeur vérifié
                  </div>
                )}
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-[1.05] tracking-tight">{product.name}</h1>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-4xl md:text-5xl font-black drop-shadow-sm" {...{ style: { color: accent } }}>
                    {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} <span className="text-xl opacity-70">FCFA</span>
                  </span>
                  {product.price !== basePrice && (
                    <span className="text-xl text-gray-400 line-through font-bold">
                      {product.price.toLocaleString('fr-FR')} F
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Description */}
              {product.description && (
                <motion.div variants={fadeUp} className="text-gray-600 text-[15px] leading-relaxed font-medium">
                  {product.description.split('\n').slice(0, 4).map((line: string, i: number) =>
                    line.trim() ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
                  )}
                  {product.description.split('\n').length > 4 && (
                    <details className="mt-2 group">
                      <summary className="text-sm font-bold cursor-pointer transition-opacity hover:opacity-80" {...{ style: { color: accent } }}>Lire la suite <ChevronDown className="inline w-4 h-4 group-open:rotate-180 transition-transform" /></summary>
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {product.description.split('\n').slice(4).map((line: string, i: number) =>
                          line.trim() ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
                        )}
                      </div>
                    </details>
                  )}
                </motion.div>
              )}

              {/* Badges de confiance (Amazon Style) */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <Lock className="w-5 h-5 flex-shrink-0" {...{ style: { color: accent } }} />
                  <span className="text-xs font-bold text-gray-700">Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <Truck className="w-5 h-5 flex-shrink-0" {...{ style: { color: accent } }} />
                  <span className="text-xs font-bold text-gray-700">Livraison suivie</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" {...{ style: { color: accent } }} />
                  <span className="text-xs font-bold text-gray-700">Satisfait ou remboursé</span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <MessageCircle className="w-5 h-5 flex-shrink-0" {...{ style: { color: accent } }} />
                  <span className="text-xs font-bold text-gray-700">Support pro 24/7</span>
                </div>
              </motion.div>

              {/* Section CTA (Easysell / Shopify Plus Style) */}
              {!showForm ? (
                <motion.div variants={fadeUp} className="space-y-4">
                  <button 
                    onClick={() => handleOpenForm('online')}
                    className="relative w-full flex items-center justify-between text-white font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-[0_10px_40px_rgba(0,0,0,0.15)] active:scale-[0.98] text-base overflow-hidden group border border-white/20"
                    {...{ style: { backgroundColor: accent, boxShadow: `0 15px 40px -10px ${accent}` } }}
                  >
                    <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Lock className="w-4 h-4 opacity-80" />
                      Acheter maintenant
                    </span>
                    <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                  {product.cash_on_delivery && (
                    <button 
                      onClick={() => handleOpenForm('cod')}
                      className="w-full bg-white border-2 font-black flex items-center justify-center gap-2 px-8 py-4 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 text-sm uppercase tracking-wide"
                      {...{ style: { borderColor: accentLight, color: accent } }}
                    >
                      💵 Payer à la livraison
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="checkout-form-section" 
                  className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden"
                >
                  <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100/50">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">📋 Finaliser la commande</h2>
                    <button type="button" onClick={() => handleOpenForm(null)} className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 font-bold transition-colors">✕ Fermer</button>
                  </div>
                  {checkoutFormNode}
                </motion.div>
              )}

              {/* Politique de retour + Avis (accordions) */}
              <motion.div variants={fadeUp} className="space-y-3">
                <details className="bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm [&_summary::-webkit-details-marker]:hidden group transition-all hover:shadow-md">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-gray-800 select-none text-sm">
                    <span className="flex items-center gap-3"><RotateCcw className="w-5 h-5" {...{ style: { color: accent } }} /> Politique de retour (Garantie)</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100/50 pt-4">
                    Retour sans tracas accepté sous 7 jours après réception. Le produit doit être dans son état d&apos;origine. Contactez le vendeur via WhatsApp pour initier un retour rapide et gratuit.
                  </div>
                </details>

                <details className="bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm [&_summary::-webkit-details-marker]:hidden group transition-all hover:shadow-md">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-gray-800 select-none text-sm">
                    <span className="flex items-center gap-3"><Star className="w-5 h-5" {...{ style: { color: accent } }} /> Avis vérifiés (0)</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 border-t border-gray-100/50 pt-4">
                    <p className="text-sm text-gray-500 italic">Soyez le premier à laisser un avis après votre achat !</p>
                  </div>
                </details>
              </motion.div>

              {/* Section vendeur (Etsy Style) */}
              <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white p-6 flex items-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {product.store.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.store.logo_url} alt={product.store.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-white" {...{ style: { backgroundColor: accent } }}>
                    {product.store.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-0.5">Vendu par</p>
                  <h3 className="font-black text-gray-900 flex items-center gap-1.5 text-base truncate">
                    {product.store.name}
                    {product.store.kyc_status === 'verified' && <BadgeCheck className="w-4 h-4" {...{ style: { color: accent } }} />}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">{product.store.productsCount} articles de qualité</p>
                </div>
                <Link href={`/${product.store.slug}`} className="px-5 py-2.5 bg-gray-900 rounded-xl text-xs font-bold text-white hover:bg-gray-800 transition-colors whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Visiter
                </Link>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
