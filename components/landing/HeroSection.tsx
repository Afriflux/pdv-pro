'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { HeroStats } from '../../app/components/HeroStats'

interface HeroSectionProps {
  badge: string;
  h1L1: string;
  h1L2: string;
  h1L3: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  isLoggedIn: boolean;
  dashboardUrl: string;
}

export function HeroSection({
  badge, h1L1, h1L2, h1L3, subtitle, ctaPrimary, ctaSecondary, isLoggedIn, dashboardUrl
}: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const opacityFade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={containerRef} className="relative pt-32 pb-40 overflow-hidden px-6 bg-[#FAFAF7]">
      {/* Background glowing gradient tailored for Yayyam (Emerald + Gold touches) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0D5C4A]/10 via-[#C9A84C]/5 to-transparent blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0ABFAA]/5 via-transparent to-transparent blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
        
        {/* Texts */}
        <motion.div style={{ y: textY, opacity: opacityFade }} className="w-full lg:w-[55%] text-left space-y-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-md border border-[#0A1F1A]/10 rounded-full px-5 py-2 mb-2 shadow-sm"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A9E7A] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0D5C4A]" />
            </span>
            <span className="text-sm font-bold text-[#0D5C4A] tracking-wide">
              {badge || "🚀 Nouvelle Ère : Accès à l'App Store et au Coach IA"}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="text-[3.5rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-display font-black tracking-tighter text-[#0A1F1A] leading-[1.02]"
          >
            {h1L1}<br />
            {h1L2}<br />
            <span className="text-[#0D5C4A] relative">
              {h1L3}
              <span className="absolute bottom-1 left-0 w-full h-[0.15em] bg-[#C9A84C]/30 -z-10 -rotate-1 rounded-sm"></span>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-xl md:text-2xl text-[#4A6B5E] font-medium max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-start gap-5 pt-4"
          >
            <Link suppressHydrationWarning href={isLoggedIn ? dashboardUrl : "/register"} className="w-full sm:w-auto px-10 py-5 bg-[#0A1F1A] hover:bg-[#0D5C4A] text-white font-bold rounded-full text-lg transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(10,31,26,0.6)] hover:shadow-[0_20px_40px_-10px_rgba(13,92,74,0.6)] flex items-center justify-center gap-2 hover:-translate-y-1 transform">
              <span suppressHydrationWarning>{isLoggedIn ? "Mon espace" : ctaPrimary}</span> 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <Link href="/vendeurs" className="w-full sm:w-auto px-10 py-5 bg-white border border-[#0A1F1A]/10 text-[#0A1F1A] hover:bg-[#FAFAF7] hover:border-[#0A1F1A]/30 rounded-full font-bold text-lg transition-all flex items-center justify-center shadow-sm hover:-translate-y-1">
              {ctaSecondary}
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
            className="pt-10 mt-6 border-t border-[#0A1F1A]/5 w-fit pr-10"
          >
            <HeroStats />
          </motion.div>
        </motion.div>

        {/* Visuals */}
        <div className="w-full lg:w-[45%] relative h-full hidden md:block">
          {/* Framer Parallax Container */}
          <motion.div style={{ y: imageY, opacity: opacityFade }} className="relative w-full aspect-square xl:aspect-[4/5] perspective-[1200px]">
            {/* Pulsing Backglow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#0D5C4A]/20 to-[#0ABFAA]/20 blur-[100px] rounded-full animate-pulse-slow"></div>
            
            {/* Main Phone Mockup */}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, -1, 0.5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full rounded-[3rem] border-[1px] border-white/80 shadow-[0_40px_100px_-20px_rgba(13,92,74,0.3)] bg-white/50 backdrop-blur-2xl p-4 overflow-hidden group"
            >
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-white/50 shadow-inner">
                <Image 
                  src="/landing/hero_mockup.png" 
                  alt="Plateforme Yayyam E-commerce Dashboard Mobile" 
                  fill 
                  className="object-cover md:object-contain object-center scale-[1.02] group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  priority
                />
              </div>
            </motion.div>

            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-12 top-32 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/40 flex items-center gap-4 z-20"
            >
               <div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center shadow-sm">W</div>
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Retrait Instantané</p>
                  <p className="text-xl font-black text-[#0A1F1A]">+45.000 <span className="text-sm">FCFA</span></p>
               </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -right-8 bottom-40 bg-[#0A1F1A] rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center gap-4 z-20"
            >
               <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 font-black rounded-xl flex items-center justify-center">🛍️</div>
               <div>
                  <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Vente générée</p>
                  <p className="text-lg font-black text-white">Parfum Dubai XL</p>
               </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
