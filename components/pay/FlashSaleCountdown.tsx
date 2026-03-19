'use client'

import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

interface FlashSaleCountdownProps {
  endsAt: string | Date
}

export default function FlashSaleCountdown({ endsAt }: FlashSaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ h: number, m: number, s: number } | null>(null)

  useEffect(() => {
    const target = new Date(endsAt).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft(null)
        return
      }

      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ h, m, s })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endsAt])

  if (!timeLeft) return null

  return (
    <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <Timer size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-red-800/60 leading-none mb-1">Offre expire dans</span>
        <div className="flex items-center gap-1 font-mono text-lg font-black text-red-600">
          <span>{String(timeLeft.h).padStart(2, '0')}h</span>
          <span className="opacity-30">:</span>
          <span>{String(timeLeft.m).padStart(2, '0')}m</span>
          <span className="opacity-30">:</span>
          <span>{String(timeLeft.s).padStart(2, '0')}s</span>
        </div>
      </div>
    </div>
  )
}
