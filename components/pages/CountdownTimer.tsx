'use client'

import { useState, useEffect } from 'react'

/**
 * CountdownTimer — Timer dynamique réel (plus de valeurs hardcodées)
 * Utilisé dans les pages de vente pour créer un sentiment d'urgence.
 * Démarre à une durée aléatoire entre 1h30 et 3h30 basée sur la session.
 */
export function CountdownTimer({ durationSeconds }: { durationSeconds?: number }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    // Durée aléatoire mais stable pour la session (basée sur le jour)
    if (durationSeconds) return durationSeconds
    const seed = new Date().getDate() + new Date().getHours()
    return 5400 + (seed * 397) % 7200 // Entre 1h30 et 3h30
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0')
  const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')
  const s = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="flex justify-center gap-3 md:gap-4 pt-4">
      <div className="bg-white px-5 py-4 rounded-[24px] shadow-sm border border-red-50 min-w-[80px]">
        <span className="block text-4xl font-black text-red-600">{h}</span>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Heures</span>
      </div>
      <div className="text-4xl font-black text-red-200 py-4">:</div>
      <div className="bg-white px-5 py-4 rounded-[24px] shadow-sm border border-red-50 min-w-[80px]">
        <span className="block text-4xl font-black text-red-600">{m}</span>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Minutes</span>
      </div>
      <div className="text-4xl font-black text-red-200 py-4">:</div>
      <div className="bg-white px-5 py-4 rounded-[24px] shadow-sm border border-red-50 min-w-[80px]">
        <span className="block text-4xl font-black text-red-600">{s}</span>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Secondes</span>
      </div>
    </div>
  )
}
