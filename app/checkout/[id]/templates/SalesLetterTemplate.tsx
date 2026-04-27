'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Star, CheckCircle, ChevronDown, ShieldCheck, Zap, Users, Award, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * SalesLetterTemplate — Template long-form persuasif (Amazon / ClickFunnels style)
 * Style copywriting : header impact → storytelling → social proof → CTA
 * Inclus : Sticky Buy Bar (mobile/desktop) pour conversion maximale
 * Couleurs dynamiques via product.store.primary_color
 * Idéal pour : Formations, coaching, programmes, mono-produits
 */
export function SalesLetterTemplate({ 
  product, 
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode: _imageGalleryNode
}: any) {
  const coverImage = product.images?.[0]
  const accent = product.store?.primary_color || '#0F7A60'
  const accentLight = accent + '15'
  
  const [showStickyBar, setShowStickyBar] = useState(false)

  // Gérer l'apparition de la Sticky Buy Bar au scroll
  useEffect(() => {
    const handleScroll = () => {
      const ctaSection = document.getElementById('main-cta')
      if (ctaSection) {
        const rect = ctaSection.getBoundingClientRect()
        // Si le CTA principal est passé hors de l'écran ou qu'on scrolle beaucoup
        setShowStickyBar(rect.top < 0 && !showForm)
      } else {
        setShowStickyBar(window.scrollY > 400 && !showForm)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showForm])

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  }

  const pulseAnimation = {
    scale: [1, 1.03, 1],
    boxShadow: [
      `0 0 0 0 ${accent}40`,
      `0 0 0 15px ${accent}00`,
      `0 0 0 0 ${accent}00`
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 pb-32">
      
      {/* ── Cover : Header impact ─────────────────────────────────── */}
      <div className="relative overflow-hidden" {...{ style: { backgroundColor: accent } }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-30 blur-[120px]" {...{ style: { backgroundColor: accent } }} />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 md:py-32 text-center text-white">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href={`/${product.store.slug}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-10 text-xs uppercase tracking-[0.2em] font-black bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              <ArrowLeft className="w-4 h-4" />
              {product.store.name}
            </Link>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-8 tracking-tighter drop-shadow-xl"
          >
            {product.name}
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-10"
          >
            <div className="bg-white/20 backdrop-blur-xl px-8 py-3 rounded-full inline-flex items-center gap-3 border border-white/30 shadow-2xl">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-md" />
              <span className="font-black text-xl md:text-2xl">{typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} <span className="text-sm opacity-80">FCFA</span></span>
            </div>
          </motion.div>

          {/* Social proof rapide (Amazon Style) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/80 text-xs font-bold uppercase tracking-widest"
          >
            <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-md"><Users className="w-4 h-4 text-green-400" /> Bestseller</span>
            <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-md"><Award className="w-4 h-4 text-blue-400" /> Top Qualité</span>
            <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-md"><ShieldCheck className="w-4 h-4 text-yellow-400" /> 100% Sécurisé</span>
          </motion.div>
        </div>
      </div>

      {/* ── Corps principal ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100"
        >
          
          {/* Image cover si dispo */}
          {coverImage && (
            <div className="w-full aspect-[16/9] md:aspect-[21/9] relative overflow-hidden bg-gray-50 border-b border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          )}

          <div className="p-8 md:p-14">
            
            {/* Description avec parsing intelligent (Copywriting layout) */}
            <div className="prose prose-lg md:prose-xl prose-gray max-w-none text-gray-700 leading-relaxed font-medium">
              {product.description ? (
                product.description.split('\n').map((line: string, i: number) => {
                  const trimmed = line.trim()
                  if (trimmed.startsWith('✨') || trimmed.startsWith('##') || trimmed.startsWith('**')) {
                    return <h3 key={i} className="font-black text-gray-900 text-2xl md:text-3xl mt-14 mb-6 tracking-tight leading-tight">{trimmed.replace(/[✨#*]/g, '').trim()}</h3>
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    return (
                      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} key={i} className="flex gap-4 my-5 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                        <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" {...{ style: { color: accent } }} />
                        <span className="font-bold text-gray-800">{trimmed.substring(2)}</span>
                      </motion.div>
                    )
                  }
                  if (trimmed === '') return <div key={i} className="h-6" />
                  return <p key={i} className="my-5 text-[17px] md:text-[19px] leading-[1.8] text-gray-600">{trimmed}</p>
                })
              ) : (
                <p className="text-xl text-gray-500 italic text-center font-bold">Découvrez comment transformer votre quotidien avec cette offre exclusive.</p>
              )}
            </div>

            {/* ── Bandeau garantie (Amazon Trust Style) ──────────────── */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="my-16 rounded-[2rem] p-8 flex flex-col md:flex-row items-center md:items-start gap-6 border-2 shadow-sm text-center md:text-left" {...{ style: { backgroundColor: accentLight, borderColor: accent + '30' } }}>
              <div className="p-4 bg-white rounded-full shadow-md shrink-0">
                <ShieldCheck className="w-12 h-12" {...{ style: { color: accent } }} />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-xl mb-2">Garantie 100% Blindée</h4>
                <p className="text-base text-gray-700 leading-relaxed font-medium">Si ce produit ne correspond pas exactement à ce que nous avons promis, contactez le vendeur sous 7 jours pour un remboursement complet. Aucun risque pour vous.</p>
              </div>
            </motion.div>

            <div className="my-16 border-t border-gray-100" />

            {/* ── Section CTA Principal ──────────────────────────────────────── */}
            <div id="main-cta">
              {!showForm ? (
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="space-y-6 max-w-xl mx-auto text-center">
                  <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">Prêt à obtenir des résultats ?</h3>
                  
                  <motion.button 
                    onClick={() => handleOpenForm('online')}
                    animate={pulseAnimation}
                    className="relative w-full text-white font-black uppercase tracking-widest px-8 py-6 rounded-2xl flex flex-col items-center gap-1.5 text-xl overflow-hidden group"
                    {...{ style: { backgroundColor: accent } }}
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 skew-x-12 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                    <span className="relative z-10 flex items-center gap-2"><Zap className="w-6 h-6 fill-white" /> Accéder immédiatement</span>
                    <span className="relative z-10 text-sm font-bold opacity-90 normal-case tracking-normal bg-black/20 px-4 py-1 rounded-full mt-1">
                      Paiement unique de {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA
                    </span>
                  </motion.button>
                  
                  {product.cash_on_delivery && (
                    <button 
                      onClick={() => handleOpenForm('cod')}
                      className="mt-6 font-bold hover:opacity-70 text-sm transition-opacity bg-gray-100 px-6 py-3 rounded-full"
                      {...{ style: { color: accent } }}
                    >
                      💵 Ou je préfère payer à la livraison
                    </button>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-gray-400 text-xs font-bold mt-8 bg-gray-50 py-4 rounded-xl">
                    <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> 100% Sécurisé</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Garanti</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  id="checkout-form-section" 
                  className="bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100 shadow-xl"
                >
                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm">
                    {checkoutFormNode}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── FAQ rapide ──────────────────────────────────────── */}
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="mt-20 space-y-4">
              <h3 className="text-2xl font-black text-gray-900 mb-8 text-center tracking-tight">Questions Fréquentes</h3>
              {[
                { q: 'Comment accéder au produit après achat ?', a: 'Vous recevrez un email et/ou une notification WhatsApp avec les détails d\'accès immédiatement après le paiement. C\'est instantané.' },
                { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Wave, Orange Money, Free Money, cartes bancaires et paiement à la livraison (si activé par le vendeur).' },
                { q: 'Puis-je obtenir un remboursement ?', a: 'Absolument. Nous offrons une garantie satisfait ou remboursé sous 7 jours.' },
              ].map((faq, i) => (
                <details key={i} className="bg-white rounded-2xl border border-gray-200 [&_summary::-webkit-details-marker]:hidden group shadow-sm hover:shadow-md transition-shadow">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-gray-900 select-none text-base">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4 bg-gray-50 rounded-full p-0.5" />
                  </summary>
                  <div className="px-6 pb-6 text-base text-gray-600 leading-relaxed pt-2">
                    {faq.a}
                  </div>
                </details>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Footer minimal ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 mt-16 text-center pb-20">
        <div className="w-16 h-1 bg-gray-200 mx-auto rounded-full mb-8" />
        <p className="text-gray-400 text-xs font-medium">
          Propulsé par <span className="text-gray-600 font-black">Yayyam</span>
          {product.store?.name && <span className="opacity-50"> · {product.store.name}</span>}
        </p>
      </div>

      {/* ── STICKY BUY BAR (Chariow / Easysell Style) ──────────────────────── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe pointer-events-none"
          >
            <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-[2rem] p-3 flex items-center justify-between pointer-events-auto gap-4">
              <div className="hidden sm:block flex-1 min-w-0 pl-3">
                <p className="font-black text-gray-900 text-sm truncate">{product.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm" {...{ style: { color: accent } }}>{typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA</span>
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <button 
                  onClick={() => {
                    handleOpenForm('online')
                    window.scrollTo({ top: document.getElementById('main-cta')?.offsetTop || 0, behavior: 'smooth' })
                  }}
                  className="w-full sm:w-auto text-white font-black uppercase tracking-wider px-8 py-3.5 rounded-[1.5rem] flex items-center justify-center gap-2 text-sm transition-transform active:scale-95 shadow-lg"
                  {...{ style: { backgroundColor: accent } }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Commander
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
