'use client'

import { useState, useEffect } from 'react'
import { trackPromotionView } from '@/lib/promotions/promotionActions'

interface FlashCountdownProps {
  promoId: string
  endsAt: string
  title: string
}

export function FlashCountdown({ promoId, endsAt, title }: FlashCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  
  // Tracking unique de vue d'une promotion
  useEffect(() => {
    trackPromotionView(promoId).catch(console.error)
    // Only fire once on mount for this promo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const end = new Date(endsAt).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = end - now

      if (distance < 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
        return
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }

    updateTimer() // initial tick
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endsAt])

  if (!timeLeft) return null // évite l'hydratation error
  if (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0) return null

  const format = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="bg-red-500 text-white rounded-lg p-2 text-center shadow-sm w-full animate-pulse-slow">
      <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">{title}</p>
      <div className="flex justify-center gap-2 text-sm font-black font-mono">
        {timeLeft.d > 0 && <span>{timeLeft.d}j</span>}
        <span>{format(timeLeft.h)}h</span>
        <span>:</span>
        <span>{format(timeLeft.m)}m</span>
        <span>:</span>
        <span className="text-red-200">{format(timeLeft.s)}s</span>
      </div>
    </div>
  )
}
