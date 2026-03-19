'use client'

// ─── app/admin/kyc/KYCAdminActions.tsx ───────────────────────────────────────
// Composant client — Boutons Valider / Rejeter un dossier KYC
// Appelé depuis la page Server Component admin/kyc/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface KYCAdminActionsProps {
  storeId:   string
  storeName: string
}

export default function KYCAdminActions({ storeId, storeName }: KYCAdminActionsProps) {
  const router = useRouter()

  const [loading,          setLoading]          = useState<'validate' | 'reject' | null>(null)
  const [showRejectForm,   setShowRejectForm]   = useState(false)
  const [rejectionReason,  setRejectionReason]  = useState('')

  // ── Valider le dossier ────────────────────────────────────────────────────

  async function handleValidate() {
    setLoading('validate')
    try {
      const res  = await fetch(`/api/admin/kyc/${storeId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        toast.success(`✅ KYC de "${storeName}" validé avec succès !`)
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la validation')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
    } finally {
      setLoading(null)
    }
  }

  // ── Rejeter le dossier ────────────────────────────────────────────────────

  async function handleReject() {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer une raison de rejet.')
      return
    }

    setLoading('reject')
    try {
      const res  = await fetch(`/api/admin/kyc/${storeId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'reject', reason: rejectionReason.trim() }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        toast.success(`❌ KYC de "${storeName}" rejeté.`)
        setShowRejectForm(false)
        setRejectionReason('')
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors du rejet')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
    } finally {
      setLoading(null)
    }
  }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Boutons principaux */}
      {!showRejectForm && (
        <div className="flex gap-3 flex-wrap">
          {/* Valider */}
          <button
            type="button"
            onClick={handleValidate}
            disabled={loading !== null}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white
              bg-[#0F7A60] hover:bg-[#0D6B53] rounded-xl shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === 'validate' ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg><span>Validation...</span></>
            ) : '✅ Valider le dossier'}
          </button>

          {/* Rejeter */}
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={loading !== null}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-600
              bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ❌ Rejeter le dossier
          </button>
        </div>
      )}

      {/* Formulaire de rejet */}
      {showRejectForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-red-700">
            ❌ Motif de rejet pour &ldquo;{storeName}&rdquo;
          </p>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Ex : Photo floue, document expiré, noms ne correspondent pas..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2.5 text-sm text-[#1A1A1A] bg-white border border-red-200
              rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2
              focus:ring-red-300 focus:border-red-400 resize-none transition-all"
          />
          <p className="text-[11px] text-gray-400 text-right">{rejectionReason.length}/500</p>
          <div className="flex gap-2">
            {/* Confirmer le rejet */}
            <button
              type="button"
              onClick={handleReject}
              disabled={loading !== null || !rejectionReason.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white
                bg-red-600 hover:bg-red-700 rounded-xl
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading === 'reject' ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg><span>Rejet en cours...</span></>
              ) : 'Confirmer le rejet'}
            </button>
            {/* Annuler */}
            <button
              type="button"
              onClick={() => { setShowRejectForm(false); setRejectionReason('') }}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100
                hover:bg-gray-200 rounded-xl disabled:opacity-50 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
