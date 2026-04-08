'use client'

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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

/* ─── Simple fade-in animation via CSS + IntersectionObserver ─── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Lightweight floating animation via CSS keyframes ─── */
function FloatingDiv({ children, className = '', duration = 8 }: { children: React.ReactNode; className?: string; duration?: number }) {
  return (
    <div className={className} style={{ animation: `yayyamFloat ${duration}s ease-in-out infinite` }}>
      {children}
    </div>
  )
}

/* ─── Hero Stats (inlined to avoid cross-directory import issues) ─── */
function useCountUp(end: number, start: number = 0, duration: number = 2000) {
  const [count, setCount] = useState(start)
  useEffect(() => {
    let startTime: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const pct = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 4)
      setCount(Math.floor(start + (end - start) * ease))
      if (pct < 1) { raf = requestAnimationFrame(step) } else { setCount(end) }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, start, duration])
  return count
}

function HeroStatsInline() {
  const stat1 = useCountUp(1, 10, 2000)
  const stat2 = useCountUp(0, 50000, 2500)
  const stat3Start = useCountUp(8, 0, 1500)
  const stat3End = useCountUp(5, 0, 1500)

  return (
    <div className="pt-16 max-w-4xl mx-auto border-t border-line mt-16 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
      <div className="flex flex-col items-center text-center gap-2 min-w-[140px]">
        <div className="font-display font-black text-4xl text-charcoal">J-{stat1}</div>
        <div className="text-sm font-bold text-slate uppercase tracking-wider">Votre boutique<br/>est en ligne</div>
      </div>
      <div className="h-10 w-px bg-line hidden md:block"></div>
      <div className="flex flex-col items-center text-center gap-2 min-w-[200px]">
        <div className="font-display font-black text-4xl text-charcoal">{stat2} F</div>
        <div className="text-sm font-bold text-slate uppercase tracking-wider">d&apos;abonnement<br/>pour démarrer</div>
      </div>
      <div className="h-10 w-px bg-line hidden md:block"></div>
      <div className="flex flex-col items-center text-center gap-2 min-w-[200px]">
        <div className="font-display font-black text-4xl text-charcoal">{stat3Start}% &rarr; {stat3End}%</div>
        <div className="text-sm font-bold text-slate uppercase tracking-wider">commission<br/>selon votre CA</div>
      </div>
    </div>
  )
}

export function HeroSection({
  badge, h1L1, h1L2, h1L3, subtitle, ctaPrimary, ctaSecondary, isLoggedIn, dashboardUrl
}: HeroSectionProps) {
  return (
    <>
      {/* CSS keyframes for floating animation */}
      <style>{`
        @keyframes yayyamFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-16px) rotate(-0.8deg); }
          50% { transform: translateY(-8px) rotate(0.4deg); }
          75% { transform: translateY(-20px) rotate(0deg); }
        }
        @keyframes yayyamFloatAlt {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(12px); }
        }
        @keyframes yayyamFloatAlt2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <section className="relative pt-32 pb-40 overflow-hidden px-6 bg-[#FAFAF7]">
        {/* Background glowing gradient */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0D5C4A]/10 via-[#C9A84C]/5 to-transparent blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0ABFAA]/5 via-transparent to-transparent blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
          
          {/* Texts */}
          <div className="w-full lg:w-[55%] text-left space-y-10">
            
            <FadeIn delay={0}>
              <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-md border border-[#0A1F1A]/10 rounded-full px-5 py-2 mb-2 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A9E7A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0D5C4A]" />
                </span>
                <span className="text-sm font-bold text-[#0D5C4A] tracking-wide">
                  {badge || "🚀 Nouvelle Ère : Accès à l'App Store et au Coach IA"}
                </span>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="text-[3.5rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-display font-black tracking-tighter text-[#0A1F1A] leading-[1.02]">
                {h1L1}<br />
                {h1L2}<br />
                <span className="text-[#0D5C4A] relative">
                  {h1L3}
                  <span className="absolute bottom-1 left-0 w-full h-[0.15em] bg-[#C9A84C]/30 -z-10 -rotate-1 rounded-sm"></span>
                </span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-xl md:text-2xl text-[#4A6B5E] font-medium max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-start gap-5 pt-4">
                <Link suppressHydrationWarning href={isLoggedIn ? dashboardUrl : "/register"} className="w-full sm:w-auto px-10 py-5 bg-[#0A1F1A] hover:bg-[#0D5C4A] text-white font-bold rounded-full text-lg transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(10,31,26,0.6)] hover:shadow-[0_20px_40px_-10px_rgba(13,92,74,0.6)] flex items-center justify-center gap-2 hover:-translate-y-1 transform">
                  <span suppressHydrationWarning>{isLoggedIn ? "Mon espace" : ctaPrimary}</span> 
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
                <Link href="/vendeurs" className="w-full sm:w-auto px-10 py-5 bg-white border border-[#0A1F1A]/10 text-[#0A1F1A] hover:bg-[#FAFAF7] hover:border-[#0A1F1A]/30 rounded-full font-bold text-lg transition-all flex items-center justify-center shadow-sm hover:-translate-y-1">
                  {ctaSecondary}
                </Link>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.6} className="pt-10 mt-6 border-t border-[#0A1F1A]/5 w-fit pr-10">
              <HeroStatsInline />
            </FadeIn>
          </div>

          {/* Visuals */}
          <div className="w-full lg:w-[45%] relative h-full">
            <div className="relative w-full aspect-square xl:aspect-[4/5]">
              {/* Pulsing Backglow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#0D5C4A]/20 to-[#0ABFAA]/20 blur-[100px] rounded-full animate-pulse-slow"></div>
              
              {/* Main Phone Mockup */}
              <FloatingDiv duration={8} className="relative w-full h-full rounded-[3rem] border-[1px] border-white/80 shadow-[0_40px_100px_-20px_rgba(13,92,74,0.3)] bg-white/50 backdrop-blur-2xl p-4 overflow-hidden group">
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-white/50 shadow-inner">
                  <Image 
                    src="/landing/hero_mockup.png" 
                    alt="Plateforme Yayyam E-commerce Dashboard Mobile" 
                    fill 
                    className="object-cover md:object-contain object-center scale-[1.02] group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                    priority
                  />
                </div>
              </FloatingDiv>

              {/* Floating Badges */}
              <div 
                className="absolute -left-2 md:-left-12 top-16 md:top-32 scale-75 md:scale-100 origin-left bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/40 flex items-center gap-4 z-20"
                style={{ animation: 'yayyamFloatAlt 6s ease-in-out infinite 1s' }}
              >
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center shadow-sm">W</div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Retrait Instantané</p>
                    <p className="text-xl font-black text-[#0A1F1A]">+45.000 <span className="text-sm">FCFA</span></p>
                 </div>
              </div>

              <div 
                className="absolute -right-2 md:-right-8 bottom-16 md:bottom-40 scale-75 md:scale-100 origin-right bg-[#0A1F1A] rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center gap-4 z-20"
                style={{ animation: 'yayyamFloatAlt2 5s ease-in-out infinite 2s' }}
              >
                 <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 font-black rounded-xl flex items-center justify-center">🛍️</div>
                 <div>
                    <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Vente générée</p>
                    <p className="text-lg font-black text-white">Parfum Dubai XL</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
