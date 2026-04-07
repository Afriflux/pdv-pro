'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Timer, ArrowRight } from 'lucide-react'

interface BannerProps {
  active: boolean;
  dateStr: string;
  text: string;
}

export function CountdownBanner({ config }: { config?: BannerProps }) {
  const [mounted, setMounted] = useState(false)
  
  const isActive = config?.active ?? true;
  const targetDateStr = config?.dateStr || '2026-04-01T00:00:00Z';
  const textMsg = config?.text || 'Lancement officiel le 1er Avril 2026';
  
  const LAUNCH_DATE = new Date(targetDateStr);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    setMounted(true)
    const TARGET_DATE = new Date(targetDateStr).getTime()
    
    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = TARGET_DATE - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [targetDateStr])

  if (!mounted || !isActive) return null
  if (new Date() >= LAUNCH_DATE) return null

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md relative z-[60]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Texte principal */}
        <div className="flex items-center gap-2 text-center md:text-left text-sm font-medium">
          <span className="bg-white/20 p-1.5 rounded-full animate-pulse">
            <Timer size={16} />
          </span>
          <span className="font-bold">{textMsg}</span>
          <span className="hidden md:inline">— Inscrivez-vous maintenant et soyez parmi les premiers vendeurs !</span>
        </div>

        {/* Compteur & CTA */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono font-black text-sm bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[8px] uppercase font-sans font-bold opacity-70">Jours</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[8px] uppercase font-sans font-bold opacity-70">Heures</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[8px] uppercase font-sans font-bold opacity-70">Min</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[8px] uppercase font-sans font-bold opacity-70">Sec</span>
            </div>
          </div>
          
          <Link 
            href="/register" 
            className="hidden sm:flex items-center gap-1.5 bg-white text-red-600 font-bold px-4 py-2 rounded-lg text-xs hover:bg-red-50 hover:scale-105 transition-all shadow-lg"
          >
            S'inscrire gratuitement <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  )
}
