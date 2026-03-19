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
  // Initialiser avec baseCount ou un nombre aléatoire entre 3 et 12
  const [count, setCount] = useState<number>(
    () => baseCount ?? Math.floor(Math.random() * 10) + 3
  )
  // État pour déclencher l'animation fade lors d'un changement
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
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
  }, []) // Intervalle fixé au montage

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${count} personnes regardent ce produit en ce moment`}
      className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5"
    >
      {/* Point vert "en temps réel" */}
      <span
        className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"
        aria-hidden="true"
      />

      {/* Message avec animation fade sur le nombre */}
      <p className="text-sm text-gray-500 font-medium">
        <span aria-hidden="true">👀</span>{' '}
        <span
          className={`font-black text-gray-700 transition-opacity duration-300 ${
            animating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {count}
        </span>{' '}
        personne{count > 1 ? 's' : ''} regardent ce produit
      </p>
    </div>
  )
}
