// ─── Bannière de preuve sociale combinée ──────────────────────────────────────
// Server Component — combine StockCountdown, VisitorCounter et RecentOrderBadge
// dans un stack vertical pour maximiser la conversion.

import StockCountdown from './StockCountdown'
import VisitorCounter from './VisitorCounter'
import RecentOrderBadge from './RecentOrderBadge'

interface SocialProofBannerProps {
  storeId: string
  productId: string
  stock: number
  stockThreshold?: number      // Seuil d'alerte stock (défaut : 10)
  baseVisitorCount?: number    // Nombre initial de visiteurs (défaut : aléatoire)
}

export default function SocialProofBanner({
  storeId,
  productId,
  stock,
  stockThreshold,
  baseVisitorCount,
}: SocialProofBannerProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* 1. Stock limité — visible uniquement si stock faible */}
      <StockCountdown
        stock={stock}
        threshold={stockThreshold}
      />

      {/* 2. Compteur de visiteurs — toujours visible */}
      <VisitorCounter
        productId={productId}
        baseCount={baseVisitorCount}
      />

      {/* 3. Dernière commande récente — visible si < 24h */}
      <RecentOrderBadge
        storeId={storeId}
        productId={productId}
      />
    </div>
  )
}
