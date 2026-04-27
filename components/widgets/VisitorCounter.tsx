'use client'

// ─── Widget Compteur de visiteurs ─────────────────────────────────────────────
// Affiche un compteur qui fluctue légèrement pour simuler du trafic en temps réel.

import { useEffect, useState } from 'react'

interface VisitorCounterProps {
  productId: string   // Identifiant du produit (pour isolation future)
  baseCount?: number  // Nombre initial (défaut : aléatoire 3-12)
}

export default function VisitorCounter({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  productId: _productId, 
  baseCount 
}: VisitorCounterProps) {
  // Initialiser avec baseCount ou un nombre fixe pour le SSR afin d'éviter les erreurs d'hydratation.
  const [count, setCount] = useState<number>(baseCount ?? 5)
  const [mounted, setMounted] = useState(false)
  // État pour déclencher l'animation fade lors d'un changement
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!baseCount) {
      setCount(Math.floor(Math.random() * 10) + 3)
    }

    // Intervalle aléatoire entre 8 000ms et 15 000ms
    const delay = Math.random() * 7000 + 8000

    const interval = setInterval(() => {
      setCount((prev) => {
        // Variation aléatoire : +1 ou -1
        const delta = Math.random() > 0.5 ? 1 : -1
        // Clamp entre 2 et 20
        return Math.min(20, Math.max(2, prev + delta))
      })
      // Déclencher l'animation fade
      setAnimating(true)
      setTimeout(() => setAnimating(false), 600)
    }, delay)

    return () => clearInterval(interval)
  }, [baseCount]) // Intervalle fixé au montage

  if (!mounted) return null // Évite l'erreur d'hydratation

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${count} personnes regardent ce produit en ce moment`}
      className="flex items-center gap-2 bg-emerald-50/50 backdrop-blur-md border border-emerald-100 rounded-2xl px-4 py-3 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] transition-all hover:scale-[1.02]"
    >
      {/* Point vert "en temps réel" God-Tier */}
      <span
        className="relative flex h-3 w-3 flex-shrink-0"
        aria-hidden="true"
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
      </span>

      {/* Message avec animation fade sur le nombre */}
      <p className="text-sm text-emerald-900 font-medium tracking-tight">
        <span
          className={`font-black text-emerald-700 transition-all duration-300 ${
            animating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          }`}
        >
          {count}
        </span>{' '}
        personne{count > 1 ? 's' : ''} regardent ce produit
      </p>
    </div>
  )
}
