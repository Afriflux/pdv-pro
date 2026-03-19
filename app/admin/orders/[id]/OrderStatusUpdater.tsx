'use client'

// ─── app/admin/orders/[id]/OrderStatusUpdater.tsx ────────────────────────────
// Composant client — Changer le statut d'une commande (admin)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  orderId:       string
  currentStatus: string
}

const ALL_STATUSES = [
  { value: 'pending',         label: 'En attente' },
  { value: 'pending_payment', label: 'Attente paiement' },
  { value: 'paid',            label: 'Payé' },
  { value: 'processing',      label: 'En traitement' },
  { value: 'shipped',         label: 'Expédié' },
  { value: 'delivered',       label: 'Livré' },
  { value: 'completed',       label: 'Complété' },
  { value: 'cancelled',       label: 'Annulé' },
  { value: 'refunded',        label: 'Remboursé' },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentStatus)
  const [loading,  setLoading]  = useState(false)

  const hasChanged = selected !== currentStatus

  async function handleUpdate() {
    if (!hasChanged || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: selected }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        toast.success(`✅ Statut mis à jour : ${ALL_STATUSES.find(s => s.value === selected)?.label}`)
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la mise à jour')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <select
        aria-label="Statut de la commande"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 px-4 py-2.5 text-sm font-medium text-[#1A1A1A] bg-[#FAFAF7]
          border border-gray-200 rounded-xl focus:outline-none focus:ring-2
          focus:ring-[#0F7A60]/30 focus:border-[#0F7A60] transition-all"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={!hasChanged || loading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F7A60] hover:bg-[#0D6B53]
          rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all
          flex items-center gap-2 whitespace-nowrap"
      >
        {loading ? (
          <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg><span>Mise à jour...</span></>
        ) : (
          'Mettre à jour le statut'
        )}
      </button>
    </div>
  )
}
