/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Star, ShoppingBag, ExternalLink, Activity, Compass, Home, Store } from 'lucide-react'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import NewsletterWidget from '@/components/brevo/NewsletterWidget'
import WhatsAppFloat from '@/components/storefront/WhatsAppFloat'
import StoreSocialLinks from '@/components/storefront/StoreSocialLinks'
import { PixelTracker } from '@/components/tracking/PixelTracker'
import { ReactNode } from 'react'

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

  // Couleurs dynamiques pour le Glassmorphism
  const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `${r}, ${g}, ${b}`;
  }
  const accentRgb = hexToRgb(accent)

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 relative overflow-hidden font-body">
      {/* FLOATING NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:top-6 md:bottom-auto md:left-6 md:translate-x-0 z-[100]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-3xl border border-white p-1.5 rounded-[100px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center gap-1.5"
        >
          <div className="relative group">
            <Link href="/" className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-emerald-600 transition-all font-bold" aria-label="Accueil">
              <Home size={20} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Accueil
            </span>
          </div>
          
          <div className="relative group">
            <Link href="/vendeurs" className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-emerald-600 transition-all font-bold" aria-label="Marketplace">
               <Compass size={20} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Marketplace
            </span>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1.5"></div>

          <div className="relative group">
            <Link href="/dashboard" className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-gray-900 transition-all font-bold" aria-label="Mon Espace">
               <Store size={20} strokeWidth={2.5} />
            </Link>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
              Espace Yayyam
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tracker Pixel */}
      <PixelTracker metaId={store.meta_pixel_id} tiktokId={store.tiktok_pixel_id} googleId={store.google_tag_id} storeName={store.name} />

      {/* Arrière-plan "Aurora / Glow" dynamique */}
      <div className="fixed top-0 inset-x-0 h-[600px] pointer-events-none z-0" style={{ background: `linear-gradient(to bottom, rgba(${accentRgb}, 0.12), transparent)`}} />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" style={{ backgroundColor: accent }} />
      <div className="fixed top-40 -left-20 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none z-0" style={{ backgroundColor: accent }} />

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
             <div className="absolute top-0 left-0 w-full h-32 md:h-40 opacity-80" style={{ backgroundImage: store.banner_url ? `url(${store.banner_url})` : `linear-gradient(135deg, ${accent}, rgba(${accentRgb}, 0.5))`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
             <div className="absolute top-0 left-0 w-full h-32 md:h-40 bg-gradient-to-b from-transparent to-white/60 backdrop-blur-[2px]" />
             
             <div className="relative pt-12 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-[6px] border-white shadow-xl bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {store.logo_url ? (
                    <Image src={store.logo_url} alt={store.name} width={144} height={144} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-4xl font-black" style={{ color: accent }}>{store.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 pb-2">
                   <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex flex-col md:flex-row items-center md:justify-start gap-3">
                     {store.name}
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
                 <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full" style={{ backgroundColor: accent }} />
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
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">{reviewCount > 0 ? `${reviewCount} avis` : 'Nouveau'}</p>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl shadow-[rgba(0,0,0,0.03)] border border-white flex flex-col items-center justify-center text-center group transition hover:-translate-y-1">
               <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: `rgba(${accentRgb}, 0.1)`, color: accent }}>
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-gray-900">{salesCount ?? 0}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ventes réalisées</p>
            </div>

          </motion.div>
        </div>

        {/* Social Links Bar */}
        {(socialLinks && Object.keys(socialLinks).length > 0) && (
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-full px-6 py-2 shadow-xl shadow-[rgba(0,0,0,0.03)] inline-flex">
               <StoreSocialLinks socialLinks={socialLinks} />
            </div>
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
                          <Image src={page.cover_url} alt={page.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center text-4xl" style={{ backgroundColor: `rgba(${accentRgb}, 0.05)` }}>
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

        {/* EMPTY STATE */}
        {(products.length === 0 && pages.length === 0) && (
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-2xl rounded-[40px] p-16 text-center shadow-2xl shadow-[rgba(0,0,0,0.03)] border border-white max-w-lg mx-auto relative overflow-hidden">
            <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl shadow-[rgba(0,0,0,0.05)] border border-white" style={{ backgroundColor: `rgba(${accentRgb}, 0.05)` }}>
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
            <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-emerald-light rounded-full blur-[140px] opacity-20 pointer-events-none" />
            
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
              <Link href="/register" className="w-full text-center bg-white text-ink font-black py-5 px-10 rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg shadow-2xl">
                Créer ma boutique
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
           <PoweredByBadge />
        </motion.div>

        <WhatsAppFloat phone={waPhone} storeName={store.name} />
      </motion.div>
    </div>
  )
}
