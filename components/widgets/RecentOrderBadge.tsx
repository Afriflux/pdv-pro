// ─── Widget Dernière Commande ──────────────────────────────────────────────────
// Server Component — affiche la dernière commande récente pour renforcer la
// preuve sociale sur les pages produit et vitrine.

import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2 } from 'lucide-react'

interface RecentOrderBadgeProps {
  storeId: string
  productId?: string  // Réservé pour usage futur (filtre par produit)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Masque le nom complet : "Moussa Diallo" → "Moussa D."
function maskName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

// Formate le temps écoulé en texte lisible
function formatTimeAgo(createdAt: string): string {
  const diffMs      = Date.now() - new Date(createdAt).getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours   = Math.floor(diffMinutes / 60)

  if (diffMinutes < 1)  return 'à l\'instant'
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`
  return `il y a ${diffHours}h`
}

// ─── Composant principal (Server Component) ───────────────────────────────────

export default async function RecentOrderBadge({
  storeId,
  productId: _productId,
}: RecentOrderBadgeProps) {
  const supabase = createAdminClient()

  // Charger la dernière commande confirmée de la boutique
  const { data: order } = await supabase
    .from('Order')
    .select('created_at, buyer_name, total')
    .eq('store_id', storeId)
    .in('status', ['confirmed', 'completed', 'paid'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Aucune commande → widget invisible
  if (!order) return null

  // Commande vieille de plus de 24h → widget invisible
  const diffMs = Date.now() - new Date(order.created_at as string).getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours >= 24) return null

  const orderRow = order as { created_at: string; buyer_name: string | null; total: number }

  const timeAgo   = formatTimeAgo(orderRow.created_at)
  const buyerName = orderRow.buyer_name ? maskName(orderRow.buyer_name) : null

  return (
    <div
      role="status"
      aria-label={`Dernière commande ${timeAgo}`}
      className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5"
    >
      {/* Icône checkmark */}
      <CheckCircle2
        className="w-4 h-4 text-green-600 flex-shrink-0"
        aria-hidden="true"
      />

      {/* Texte */}
      <p className="text-sm text-green-700 font-medium leading-snug">
        <span className="font-black">Dernière commande</span>{' '}
        {timeAgo}
        {buyerName && (
          <span className="text-green-600 font-normal">
            {' '}· par <span className="font-semibold">{buyerName}</span>
          </span>
        )}
      </p>
    </div>
  )
}
