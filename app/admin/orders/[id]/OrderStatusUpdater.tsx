'use client'

// ─── app/admin/orders/[id]/OrderStatusUpdater.tsx ────────────────────────────
// Composant client — Changer le statut d'une commande (admin)

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { X, ShieldAlert } from 'lucide-react'

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

  const [reason,   setReason]   = useState('')
  const [showModal, setShowModal] = useState(false)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasChanged = selected !== currentStatus
  const needsReason = ['cancelled', 'refunded'].includes(selected)

  function initiateUpdate() {
    if (!hasChanged || loading) return
    if (needsReason) {
      setShowModal(true)
    } else {
      executeUpdate()
    }
  }

  async function executeUpdate() {
    if (needsReason && !reason.trim()) {
      toast.error('Veuillez fournir un motif.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: selected, reason: reason.trim() || undefined }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        toast.success(`✅ Statut mis à jour : ${ALL_STATUSES.find(s => s.value === selected)?.label}`)
        setShowModal(false)
        setReason('')
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
    <>
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
        onClick={initiateUpdate}
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

    {/* Modale de justification avec Portal pour échapper aux conteneurs masqués */}
    {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Action sensible</span>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                aria-label="Fermer" 
                title="Fermer" 
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-2">Motif obligatoire</h3>
            <p className="text-sm text-gray-500 mb-6">
              Veuillez expliquer pourquoi cette commande passe en statut <strong>{ALL_STATUSES.find(s => s.value === selected)?.label}</strong>. Ce motif sera consigné dans le registre d'Audit de Yayyam.
            </p>

            <div className="space-y-4">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Demande client, Produit en rupture..."
                className="w-full h-24 p-4 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
              />
              <button
                onClick={executeUpdate}
                disabled={!reason.trim() || loading}
                className="w-full flex justify-center items-center py-3 px-4 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmer et Journaliser'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
