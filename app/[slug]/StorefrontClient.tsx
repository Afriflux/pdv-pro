/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Star, ShoppingBag, ExternalLink, Activity, Compass, Home, Store, Sun, Moon, Share2 } from 'lucide-react'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import NewsletterWidget from '@/components/brevo/NewsletterWidget'
import WhatsAppFloat from '@/components/storefront/WhatsAppFloat'
import StoreSocialLinks from '@/components/storefront/StoreSocialLinks'
import { PixelTracker } from '@/components/tracking/PixelTracker'
import { SocialProofWidget } from '@/components/shared/storefront/SocialProofWidget'
import { HelpdeskWidget } from '@/components/shared/storefront/HelpdeskWidget'
import { trackViewContent } from '@/lib/tracking/pixel-events'
import { ReactNode, useState, useEffect } from 'react'

interface StorefrontClientProps {
  store: any
  products: any[]
  pages: any[]
  promotions: any[]
  salesCount: number
  avgRating: number
  reviewCount: number
  waPhone: string
  socialLinks: Record<string, string> | null
  accent: string
  socialProofSlot?: ReactNode
  recentReviews?: any[]
}

export function StorefrontClient({
  store,
  products,
  pages,
  promotions,
  salesCount,
  avgRating,
  reviewCount,
  waPhone,
  socialLinks,
  accent,
  socialProofSlot,
  recentReviews = [],
}: StorefrontClientProps) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  }

  // Dark mode
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('yayyam_dark_mode')
    if (saved === 'true') setIsDark(true)
  }, [])
  const toggleDark = () => {
    setIsDark(prev => {
      localStorage.setItem('yayyam_dark_mode', String(!prev))
      return !prev
    })
  }

  // Pixel: fire ViewContent for the first product on mount
  useEffect(() => {
    if (products.length > 0) {
      trackViewContent({
        content_name: products[0].name,
        content_id: products[0].id,
        value: products[0].price,
        currency: 'XOF',
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`min-h-screen relative overflow-hidden font-body transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-[#FDFDFD] text-gray-900'}`}>
      {/* Bandeau d'annonce configurable par le vendeur */}
      {store.announcement_active && store.announcement_text && (
        <div 
          className="w-full py-2.5 px-4 text-center text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2"
          {...{ style: { backgroundColor: store.announcement_bg_color || accent } }}
        >
          <span>{store.announcement_text}</span>
        </div>
      )}
      {/* FLOATING NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:top-6 md:bottom-auto md:left-6 md:translate-x-0 z-[100]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-3xl border border-white p-2 rounded-[100px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center gap-1.5"
        >
          <div className="relative group">
            <Link href="/" className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-emerald-600 transition-all font-bold" aria-label="Accueil">
              <Home size={22} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Accueil
            </span>
          </div>
          
          <div className="relative group">
            <Link href="/vendeurs" className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-emerald-600 transition-all font-bold" aria-label="Marketplace">
               <Compass size={22} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Marketplace
            </span>
          </div>

          <div className="relative group">
            <Link href="/track" className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-blue-600 transition-all font-bold" aria-label="Suivre ma commande">
               <ShoppingBag size={22} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Suivi commande
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1.5"></div>

          <div className="relative group">
            <Link href="/dashboard" className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-gray-900 transition-all font-bold" aria-label="Mon Espace">
               <Store size={22} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Espace Yayyam
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1.5"></div>

          {/* Dark Mode Toggle */}
          <div className="relative group">
            <button 
              onClick={toggleDark}
              className={`min-w-[44px] min-h-[44px] w-12 h-12 rounded-full flex items-center justify-center transition-all font-bold ${isDark ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-500 hover:bg-white hover:shadow-md hover:text-gray-900'}`}
              aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <Sun size={22} strokeWidth={2.5} /> : <Moon size={22} strokeWidth={2.5} />}
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              {isDark ? 'Mode clair' : 'Mode sombre'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tracker Pixel */}
      <PixelTracker metaId={store.meta_pixel_id} tiktokId={store.tiktok_pixel_id} googleId={store.google_tag_id} storeName={store.store_name || store.name} />

      {/* Arrière-plan "Aurora / Glow" dynamique */}
      <div className="fixed top-0 inset-x-0 h-[600px] pointer-events-none z-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--accent)_12%,transparent)] to-transparent" />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full motion-safe:blur-[100px] opacity-30 pointer-events-none z-0 bg-[var(--accent)]" />
      <div className="fixed top-40 -left-20 w-[300px] h-[300px] rounded-full motion-safe:blur-[100px] opacity-20 pointer-events-none z-0 bg-[var(--accent)]" />

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-24 space-y-12"
      >
        {/* =========================================
            1. BENTO GRID HERO SECTION
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Box */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 backdrop-blur-3xl rounded-[32px] p-8 md:p-10 shadow-2xl shadow-[rgba(0,0,0,0.03)] border border-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-32 md:h-40 opacity-80 bg-cover bg-center" {...{ style: { backgroundImage: store.banner_url ? `url(${store.banner_url})` : `linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, transparent))` } }} />
             <div className="absolute top-0 left-0 w-full h-32 md:h-40 bg-gradient-to-b from-transparent to-white/60 backdrop-blur-[2px]" />
             
             <div className="relative pt-12 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                <div className="w-16 h-16 md:w-36 md:h-36 rounded-full border-4 md:border-[6px] border-white shadow-xl bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {store.logo_url ? (
                    <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={store.logo_url} alt={store.store_name || store.name} width={144} height={144} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-2xl md:text-4xl font-black text-[var(--accent)]">{(store.store_name || store.name)[0]}</span>
                  )}
                </div>
                <div className="flex-1 pb-2">
                   <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex flex-col md:flex-row items-center md:justify-start gap-3">
                     {store.store_name || store.name}
                     {store.kyc_status === 'verified' && (
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest mt-2 md:mt-0 shadow-sm border border-green-100">
                         <BadgeCheck className="w-4 h-4 shrink-0" /> Vérifié
                       </span>
                     )}
                   </h1>
                   {store.category && (
                     <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
                       {store.category}
                     </p>
                   )}
                </div>
             </div>

             {store.description && (
               <div className="mt-8 relative">
                 <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-[var(--accent)]" />
                 <p className="pl-5 text-gray-600 font-medium leading-relaxed max-w-2xl text-[15px]">
                   {store.description}
                 </p>
               </div>
             )}
          </motion.div>

          {/* Side Bento Boxes */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-6">
            
            <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl shadow-[rgba(0,0,0,0.03)] border border-white flex flex-col items-center justify-center text-center group transition hover:-translate-y-1">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 text-amber-500 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <p className="text-3xl font-black text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{reviewCount > 0 ? `${reviewCount} avis` : 'Nouveau'}</p>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl shadow-[rgba(0,0,0,0.03)] border border-white flex flex-col items-center justify-center text-center group transition hover:-translate-y-1">
               <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-gray-900">{salesCount ?? 0}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Ventes réalisées</p>
            </div>

          </motion.div>
        </div>

        {/* Social Links Bar */}
        {(socialLinks && Object.keys(socialLinks).length > 0) && (
          <motion.div variants={itemVariants} className="flex flex-col items-center">
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-full px-6 py-2 shadow-xl shadow-[rgba(0,0,0,0.03)] inline-flex">
               <StoreSocialLinks socialLinks={socialLinks} />
            </div>

            {/* Bouton Partager WhatsApp natif */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ${store.store_name || store.name} sur Yayyam 👇\nhttps://yayyam.com/${store.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold bg-[#25D366] text-white hover:bg-[#1ebe57] transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.462-1.494A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.99-1.952l-.418-.312-2.65.887.888-2.649-.313-.418A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                Partager
              </a>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: store.store_name || store.name, url: `https://yayyam.com/${store.slug}` })
                  } else {
                    navigator.clipboard.writeText(`https://yayyam.com/${store.slug}`)
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all active:scale-95 min-h-[44px]"
              >
                <Share2 size={14} />
                Copier le lien
              </button>
            </div>
          </motion.div>
        )}

        {/* Share buttons en standalone si pas de socialLinks */}
        {(!socialLinks || Object.keys(socialLinks).length === 0) && (
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Découvrez ${store.store_name || store.name} sur Yayyam 👇\nhttps://yayyam.com/${store.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold bg-[#25D366] text-white hover:bg-[#1ebe57] transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.462-1.494A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.99-1.952l-.418-.312-2.65.887.888-2.649-.313-.418A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
              Partager
            </a>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: store.store_name || store.name, url: `https://yayyam.com/${store.slug}` })
                } else {
                  navigator.clipboard.writeText(`https://yayyam.com/${store.slug}`)
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-3.5 min-h-[44px] rounded-full text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all active:scale-95"
            >
              <Share2 size={14} />
              Copier le lien
            </button>
          </motion.div>
        )}

        {/* =========================================
            2. LANDING PAGES (Bento Collections)
            ========================================= */}
        {pages.length > 0 && (
          <motion.section variants={itemVariants} className="pt-6">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Expériences Spéciales</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pages.map(page => (
                <Link key={page.id} href={`/p/${page.slug}`}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-[24px] shadow-xl shadow-[rgba(0,0,0,0.03)] overflow-hidden group border border-gray-100/50 flex flex-col h-full"
                  >
                    {page.cover_url ? (
                        <div className="relative w-full aspect-video overflow-hidden">
                          <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={page.cover_url} alt={page.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center text-4xl bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
                          ✨
                        </div>
                      )}
                    <div className="p-5 flex items-center justify-between">
                      <p className="font-bold text-gray-900 break-words line-clamp-1 flex-1">{page.title}</p>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-900 transition-colors ml-3 shrink-0">
                        <ExternalLink size={14} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* =========================================
            3. COLLECTION PRODUITS (Boutique classique)
            ========================================= */}
        {products.length > 0 && (
          <motion.section variants={itemVariants} className="pt-6">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Le Catalogue</h2>
              <span className="bg-gray-100 text-gray-600 font-black text-xs px-2.5 py-1 rounded-full">{products.length}</span>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
            </div>

            {products[0] && socialProofSlot && (
              <div className="mb-8">
                {socialProofSlot}
              </div>
            )}

            <ProductGrid products={products} promotions={promotions} accent={accent} />
          </motion.section>
        )}

        {/* =========================================
            4. SMART REVIEWS (Témoignages)
            ========================================= */}
        {recentReviews.length > 0 && (
          <motion.section variants={itemVariants} className="pt-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Que disent nos clients ?</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
            </div>
            
            <div className="flex overflow-x-auto pb-8 gap-6 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
              {recentReviews.slice(0, 8).map(review => (
                <div key={review.id} className="min-w-[300px] shrink-0 bg-white/60 backdrop-blur-xl border border-white p-6 rounded-[24px] shadow-2xl shadow-[rgba(0,0,0,0.02)] snap-center flex flex-col justify-between">
                   <div>
                      <div className="flex gap-1 mb-3">
                         {Array.from({length: 5}).map((_, i) => (
                           <Star key={i} size={16} className={i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} />
                         ))}
                      </div>
                      <p className="text-gray-700 italic font-medium leading-relaxed">"{review.comment}"</p>
                   </div>
                   <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                     <span className="font-black text-gray-900">{review.buyer_name}</span>
                     {review.verified && (
                       <span className="flex items-center gap-1 text-xs uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                         <BadgeCheck size={12} /> Achat Vérifié
                       </span>
                     )}
                   </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* EMPTY STATE */}
        {(products.length === 0 && pages.length === 0) && (
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-2xl rounded-[40px] p-16 text-center shadow-2xl shadow-[rgba(0,0,0,0.03)] border border-white max-w-lg mx-auto relative overflow-hidden">
            <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl shadow-[rgba(0,0,0,0.05)] border border-white bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
              🏗️
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Bientôt disponible</h3>
            <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
              La boutique prépare actuellement ses rayons. Revenez nous voir très bientôt !
            </p>
          </motion.div>
        )}

        {/* WIDGETS DE FIN */}
        <motion.div variants={itemVariants} className="max-w-2xl mx-auto pt-16">
          <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[32px] shadow-2xl shadow-[rgba(0,0,0,0.03)]">
            <NewsletterWidget storeId={store.id} storeName={store.name} />
          </div>
        </motion.div>

        {/* FOOTER CTA VENDEUR */}
        <motion.div variants={itemVariants} className="pt-24 pb-8">
          <div className="bg-charcoal rounded-[40px] p-10 md:p-14 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
            {/* Éclat lumineux */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-emerald-light rounded-full motion-safe:blur-[140px] opacity-20 pointer-events-none" />
            
            <div className="absolute -bottom-20 -right-10 opacity-10 pointer-events-none transform -rotate-12">
              <ShoppingBag className="w-72 h-72 text-white" />
            </div>
            
            <div className="relative z-10 flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                Vendez comme un Pro.
              </h2>
              <p className="text-gray-300 font-medium md:text-lg max-w-xl">
                Ouvrez votre espace de vente sur Yayyam en 2 minutes. Pas de limite technique, tout est optimisé pour maximiser vos revenus.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-auto shrink-0 flex flex-col items-center">
              <Link href="/register" className="w-full text-center bg-white text-ink font-black py-5 px-10 rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg shadow-2xl min-h-[44px]">
                Créer ma boutique
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
           <PoweredByBadge />
        </motion.div>

        <WhatsAppFloat phone={waPhone} storeName={store.name} />
        <SocialProofWidget storeId={store.id} />
        <HelpdeskWidget storeId={store.id} accentColor={accent} />
      </motion.div>
    </div>
  )
}
