'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Theme, THEME_MAP } from './PageRenderers'

// ─── AnnouncementBar — Configurable (plus de hardcodé) ──────────────────────
export function AnnouncementBar({ theme, text, durationSeconds }: { theme: Theme; text?: string; durationSeconds?: number }) {
  const defaultDuration = durationSeconds ?? 3 * 3600 // 3h par défaut
  const [timeLeft, setTimeLeft] = useState(defaultDuration)
  
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000)
    return () => clearInterval(timer)
  }, [])

  const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0')
  const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')
  const s = (timeLeft % 60).toString().padStart(2, '0')
  
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange

  // Ne rien afficher si pas de texte configuré
  if (!text) return null

  return (
    <div className={`w-full py-2.5 px-4 text-center text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 ${colors.bgPrimary}`}>
      <span>{text}</span>
      {timeLeft > 0 && (
        <span className="bg-black/20 px-2 py-0.5 rounded font-mono">{h}:{m}:{s}</span>
      )}
    </div>
  )
}

// ─── StickyMobileCTA ────────────────────────────────────────────────────────
export function StickyMobileCTA({ productId, price, theme }: { productId: string, price: number, theme: Theme }) {
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const colors = THEME_MAP[theme.color] || THEME_MAP.orange

  if (!visible) return null

  return (
    <div className="fixed bottom-6 lg:bottom-10 inset-x-0 w-full flex justify-center z-40 px-4 pointer-events-none animate-in slide-in-from-bottom-24 duration-700 fade-in">
      <div className="bg-white/70 backdrop-blur-3xl border border-white/80 p-2 lg:p-2.5 rounded-[100px] shadow-2xl shadow-[rgba(0,0,0,0.08)] flex items-center gap-4 w-full max-w-sm lg:max-w-md pointer-events-auto transition-transform hover:scale-[1.02]">
        <div className="flex-1 pl-5">
          <p className="text-xs lg:text-xs font-black text-gray-400 text-opacity-80 uppercase tracking-widest leading-none mb-0.5">Total à payer</p>
          <p className="text-xl lg:text-2xl font-black text-gray-900 leading-tight tracking-tight">{price.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
        </div>
        <Link 
          href={`?checkout=${productId}`} 
          scroll={false} 
          className={`flex items-center justify-center ${colors.bgPrimary} ${colors.bgHover} text-white font-bold px-8 lg:px-10 py-4 lg:py-5 rounded-full shadow-lg ${colors.shadow} transition-all duration-300 hover:shadow-xl active:scale-95 whitespace-nowrap text-lg tracking-wide`}
        >
          Commander
        </Link>
      </div>
    </div>
  )
}

// ─── SalesPops — Configurable (noms/villes en props optionnels) ─────────────
const DEFAULT_NAMES = ['Amina', 'Fatou', 'Moussa', 'Oumar', 'Awa', 'Seydou', 'Khadija', 'Cheikh', 'Marie', 'Ibrahim', 'Aïssatou', 'Mamadou']
const DEFAULT_CITIES = ['Dakar', 'Abidjan', 'Bamako', 'Conakry', 'Douala', 'Ouagadougou', 'Libreville', 'Lomé', 'Niamey', 'Cotonou']

export function SalesPops({ names, cities, productName }: { names?: string[]; cities?: string[]; productName?: string }) {
  const [pop, setPop] = useState<{name: string, city: string, time: string} | null>(null)
  
  useEffect(() => {
    const nameList = names && names.length > 0 ? names : DEFAULT_NAMES
    const cityList = cities && cities.length > 0 ? cities : DEFAULT_CITIES
    let timeoutId: NodeJS.Timeout
    
    const showRandomPop = () => {
      const name = nameList[Math.floor(Math.random() * nameList.length)]
      const city = cityList[Math.floor(Math.random() * cityList.length)]
      const mins = Math.floor(Math.random() * 59) + 1
      
      setPop({ name, city, time: `Il y a ${mins} min` })
      
      timeoutId = setTimeout(() => {
        setPop(null)
        timeoutId = setTimeout(showRandomPop, Math.random() * 15000 + 10000)
      }, 6000)
    }

    timeoutId = setTimeout(showRandomPop, 6000)
    return () => clearTimeout(timeoutId)
  }, [names, cities])

  if (!pop) return null

  return (
    <div className="fixed bottom-28 md:bottom-8 left-4 md:left-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-3.5 flex items-center gap-3 pr-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold flex-shrink-0 text-lg">
          ✓
        </div>
        <div>
          <p className="text-sm text-gray-900 font-medium"><span className="font-extrabold">{pop.name}</span> ({pop.city})</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {productName ? `Vient d'acheter "${productName}"` : "Vient d'acheter ce produit"} • {pop.time}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── ExitIntentPopup — Code promo et % dynamiques ──────────────────────────
export function ExitIntentPopup({ productId, theme, promoCode, promoPercent }: { productId?: string; theme: Theme; promoCode?: string; promoPercent?: number }) {
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const colors = THEME_MAP[theme.color] || THEME_MAP.orange

  const code = promoCode || 'PROMO10'
  const percent = promoPercent || 10

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 0 && !hasShown) {
        setShow(true)
        setHasShown(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    
    // Also trigger on fast scroll up on mobile (heuristic)
    let lastScrollY = window.scrollY
    let fastScrollCount = 0
    const handleScroll = () => {
      if (window.scrollY < lastScrollY - 30) {
        fastScrollCount++
        if (fastScrollCount > 2 && window.scrollY < 400 && !hasShown) {
          setShow(true)
          setHasShown(true)
        }
      } else {
        fastScrollCount = 0
      }
      lastScrollY = window.scrollY
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasShown])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-300">
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full font-bold transition-colors">✕</button>
        
        <div className="text-center space-y-4 pt-4">
          <div className="text-6xl mb-6">🎁</div>
          <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">Attendez !</h2>
          <p className="text-gray-600 font-medium text-lg px-4 leading-relaxed">
            Prenez <span className={`font-bold ${colors.textPrimary}`}>-{percent}% supplémentaires</span> si vous finalisez votre commande maintenant.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 font-mono font-bold text-2xl py-4 rounded-xl mt-6 mb-8 tracking-widest border-dashed">
            {code}
          </div>
          
          {productId ? (
            <Link href={`?checkout=${productId}`} onClick={() => setShow(false)} scroll={false} className={`block w-full ${colors.bgPrimary} ${colors.bgHover} text-white font-bold py-4 rounded-2xl shadow-xl ${colors.shadow} text-lg transition-transform active:scale-95`}>
              Profiter des -{percent}% 🎉
            </Link>
          ) : (
            <button onClick={() => setShow(false)} className={`block w-full ${colors.bgPrimary} ${colors.bgHover} text-white font-bold py-4 rounded-2xl shadow-xl flex-1 text-lg`}>
              Profiter des -{percent}% 🎉
            </button>
          )}
          <button onClick={() => setShow(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600 underline pt-4 block w-full">
            Non merci, je refuse l&apos;offre
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ScrollReveal ──────────────────────────────────────────────────────────
export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
           setIsVisible(true)
           if (domRef.current) observer.unobserve(domRef.current)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
    
    if (domRef.current) observer.observe(domRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={domRef} className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      {children}
    </div>
  )
}
