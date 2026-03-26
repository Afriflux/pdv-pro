'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  UserCheck, 
  Loader2,
  ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'

interface VendorActionsProps {
  vendorId: string
  kycStatus: string | null
  isActive: boolean
}

export default function VendorActions({ vendorId, kycStatus, isActive }: VendorActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [actionConfirm, setActionConfirm] = useState<'verify' | 'reject' | 'suspend' | 'activate' | null>(null)
  const [reason, setReason] = useState('')
  const router = useRouter()

  const executeAction = async () => {
    if (!actionConfirm) return
    if (!reason.trim()) {
      toast.error("Veuillez saisir un motif pour cette action.")
      return
    }

    setLoading(actionConfirm)
    try {
      const res = await fetch(`/api/admin/vendeurs/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionConfirm, reason: reason.trim() })
      })

      if (!res.ok) throw new Error('Erreur lors de l\'action')

      toast.success(
        actionConfirm === 'verify' ? 'KYC validé !' :
        actionConfirm === 'reject' ? 'KYC rejeté !' :
        actionConfirm === 'suspend' ? 'Compte suspendu !' : 'Compte réactivé !'
      )
      setActionConfirm(null)
      setReason('')
      router.refresh()
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(null)
    }
  }

  const getActionLabel = () => {
    switch (actionConfirm) {
      case 'verify': return 'Valider KYC'
      case 'reject': return 'Rejeter KYC'
      case 'suspend': return 'Suspendre le vendeur'
      case 'activate': return 'Réactiver le vendeur'
      default: return 'Confirmer'
    }
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex flex-wrap gap-3">
        {/* ACTIONS KYC */}
        {kycStatus === 'pending' && (
          <>
            <button
              onClick={() => { setActionConfirm('verify'); setReason(''); }}
              disabled={!!loading || !!actionConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              {loading === 'verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Valider KYC
            </button>
            <button
              onClick={() => { setActionConfirm('reject'); setReason(''); }}
              disabled={!!loading || !!actionConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
            >
              {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Rejeter KYC
            </button>
          </>
        )}

        {/* ACTIONS COMPTE */}
        {isActive ? (
          <button
            onClick={() => { setActionConfirm('suspend'); setReason(''); }}
            disabled={!!loading || !!actionConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600/30 text-orange-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
          >
            {loading === 'suspend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            Suspendre
          </button>
        ) : (
          <button
            onClick={() => { setActionConfirm('activate'); setReason(''); }}
            disabled={!!loading || !!actionConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
          >
            {loading === 'activate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Réactiver
          </button>
        )}
      </div>

      {/* FORMULAIRE MOTIF (Apparaît si on clique sur un bouton) */}
      {actionConfirm && (
        <div className="bg-[#1A1A1A] border-t border-gray-800 pt-4 mt-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-bold text-gray-400 mb-2">Veuillez justifier cette action <span className="text-red-500">*</span></p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Fraude détectée, absence de réponse, documents flous..."
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all"
          />
          <div className="flex items-center gap-3 justify-end mt-3">
            <button
              onClick={() => { setActionConfirm(null); setReason(''); }}
              disabled={!!loading}
              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={executeAction}
              disabled={!!loading || !reason.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {getActionLabel()}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
