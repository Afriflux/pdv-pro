/* eslint-disable react/forbid-dom-props */
'use client'

// ─── Widget Stock Limité ───────────────────────────────────────────────────────
// Affiche une alerte visuelle quand le stock est faible ou épuisé.

interface StockCountdownProps {
  stock: number        // Stock actuel disponible
  threshold?: number   // Seuil d'alerte (défaut : 10)
  productName?: string // Nom du produit (pour accessibilité)
}

export default function StockCountdown({
  stock,
  threshold = 10,
  productName,
}: StockCountdownProps) {
  // Stock suffisant → widget invisible
  if (stock >= threshold) return null

  // ── Rupture totale ─────────────────────────────────────────────
  if (stock === 0) {
    return (
      <div
        role="status"
        aria-label={`${productName ?? 'Produit'} en rupture de stock`}
        className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
      >
        <span
          className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"
          aria-hidden="true"
        />
        <span className="text-sm font-black text-red-600 uppercase tracking-wide">
          Rupture de stock
        </span>
      </div>
    )
  }

  // ── Stock faible ───────────────────────────────────────────────
  // Calcul du pourcentage pour la barre de progression
  // On considère que `threshold` représente le "plein" pour la barre
  const progressPercent = Math.round((stock / threshold) * 100)

  // Couleur de la barre selon l'urgence
  const barColor =
    stock <= 3
      ? 'bg-red-500'
      : stock <= 5
      ? 'bg-orange-500'
      : 'bg-amber-400'

  const bgClass =
    stock <= 3
      ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
      : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'

  const textClass = stock <= 3 ? 'text-red-700' : 'text-amber-800'

  return (
    <div
      role="status"
      aria-label={`Plus que ${stock} en stock`}
      className={`border rounded-xl px-4 py-3 space-y-2 ${bgClass}`}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden="true">🔥</span>
        <p className={`text-sm font-black ${textClass}`}>
          Plus que{' '}
          <span className="underline decoration-dotted">
            {stock} exemplaire{stock > 1 ? 's' : ''}
          </span>{' '}
          en stock !
        </p>
      </div>

      {/* Barre de progression */}
      <div
        className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden"
        {...({ role: 'progressbar', 'aria-valuenow': stock, 'aria-valuemin': 0, 'aria-valuemax': threshold } as React.HTMLAttributes<HTMLDivElement>)}
        aria-label="Niveau de stock"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Message d'urgence */}
      <p className={`text-xs font-medium ${textClass} opacity-80`}>
        Commandez vite avant la rupture !
      </p>
    </div>
  )
}
