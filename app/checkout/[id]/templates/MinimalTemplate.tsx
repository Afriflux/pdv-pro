'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ShieldCheck, Truck, ChevronDown, Star, RotateCcw, BadgeCheck } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * MinimalTemplate — Template épuré style Apple Store / Easysell
 * Focus sur l'image, typographie massive, minimal chrome
 * Couleurs dynamiques via `accent` (store.primary_color)
 * Idéal pour : Tech, accessoires, parfums, beauté, lifestyle
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

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-900 selection:text-white relative">
      
      {/* ── Barre de navigation ultra-minimale ──────────────────── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/50"
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${product.store.slug}`} className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href={`/${product.store.slug}`} className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            {product.store.name}
            {product.store.kyc_status === 'verified' && <BadgeCheck className="w-4 h-4" {...{ style: { color: accent } }} />}
          </Link>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </motion.header>

      {/* ── Hero Image pleine largeur (Edge-to-Edge) ──────────── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-5xl mx-auto"
      >
        <div className="aspect-[4/5] md:aspect-[16/9] relative overflow-hidden bg-gray-50 md:rounded-[2rem] md:mt-6 md:shadow-2xl md:border border-gray-100">
          {imageGalleryNode}
          
          {product.category && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm z-10">
              {product.category}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Contenu centré (Apple Style) ───────────────────────── */}
      <div className="max-w-xl mx-auto px-6 py-12 md:py-16 space-y-10">
        
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-10">
          
          {/* Nom & Prix */}
          <motion.div variants={fadeUp} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.05]">
              {product.name}
            </h1>
            
            <div className="flex items-center justify-center gap-4 pt-2">
              <span className="text-3xl font-black tracking-tight" {...{ style: { color: accent } }}>
                {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} <span className="text-lg opacity-60">FCFA</span>
              </span>
              {product.price !== basePrice && (
                <span className="text-lg text-gray-300 line-through font-bold">
                  {product.price.toLocaleString('fr-FR')} F
                </span>
              )}
            </div>
          </motion.div>

          {/* Description courte */}
          {product.description && (
            <motion.div variants={fadeUp} className="text-center">
              <p className="text-gray-500 font-medium leading-relaxed text-base md:text-lg max-w-md mx-auto">
                {product.description.split('\n')[0]}
              </p>
            </motion.div>
          )}

          {/* CTA principal (Glow effect) */}
          <motion.div variants={fadeUp}>
            {!showForm ? (
              <div className="space-y-4">
                <div className="relative group">
                  {/* Glow Layer */}
                  <div className="absolute -inset-1 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500" {...{ style: { backgroundColor: accent } }}></div>
                  <button 
                    onClick={() => handleOpenForm('online')}
                    className="relative w-full text-white font-black py-5 rounded-full text-sm uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
                    {...{ style: { backgroundColor: accent } }}
                  >
                    Ajouter au panier — {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA
                  </button>
                </div>
                
                {product.cash_on_delivery && (
                  <button 
                    onClick={() => handleOpenForm('cod')}
                    className="w-full py-4 rounded-full text-sm font-bold border-2 transition-all hover:bg-gray-50 active:bg-gray-100"
                    {...{ style: { borderColor: accentLight, color: accent } }}
                  >
                    💵 Payer à la livraison
                  </button>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                id="checkout-form-section" 
                className="bg-gray-50/80 backdrop-blur-xl rounded-[2rem] border border-gray-100/50 p-2 overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between px-6 py-4">
                  <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Vos informations</h2>
                  <button type="button" onClick={() => handleOpenForm(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:text-gray-900 font-bold transition-colors">✕</button>
                </div>
                <div className="bg-white rounded-[1.5rem] p-4 shadow-sm">
                  {checkoutFormNode}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Détails produit (accordéon) */}
          {product.description && product.description.split('\n').length > 1 && (
            <motion.div variants={fadeUp}>
              <details className="border-t border-gray-100 pt-6 [&_summary::-webkit-details-marker]:hidden group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-black text-gray-900 select-none text-lg pb-2 hover:opacity-70 transition-opacity">
                  Aperçu complet
                  <ChevronDown className="w-5 h-5 text-gray-300 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-6 text-base text-gray-600 leading-relaxed space-y-4">
                  {product.description.split('\n').map((line: string, i: number) =>
                    line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                  )}
                </div>
              </details>
            </motion.div>
          )}

          {/* Micro badges Apple Style */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-xs font-bold uppercase tracking-widest pt-8 border-t border-gray-100">
            <span className="flex flex-col items-center gap-2"><Lock className="w-5 h-5 text-gray-300" /> Sécurisé</span>
            <span className="flex flex-col items-center gap-2"><Truck className="w-5 h-5 text-gray-300" /> Livraison</span>
            <span className="flex flex-col items-center gap-2"><ShieldCheck className="w-5 h-5 text-gray-300" /> Garanti</span>
          </motion.div>

          {/* Section vendeur minimaliste */}
          <motion.div variants={fadeUp} className="border-t border-gray-100 pt-8 pb-4 flex items-center gap-4">
            {product.store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.store.logo_url} alt={product.store.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg" {...{ style: { backgroundColor: accent } }}>
                {product.store.name[0]}
              </div>
            )}
            <div className="flex-1">
              <p className="font-black text-gray-900 text-base">{product.store.name}</p>
              <p className="text-sm text-gray-500 font-medium">{product.store.productsCount} articles</p>
            </div>
            <Link href={`/${product.store.slug}`} className="px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-80" {...{ style: { backgroundColor: accentLight, color: accent } }}>
              Découvrir
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
