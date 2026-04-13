'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2, X, AlertTriangle } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function RefundButton({ storeId, orderId, totalAmount }: {
  storeId: string
  orderId: string
  totalAmount: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmAmount, setConfirmAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRefund = async () => {
    if (Number(confirmAmount) !== totalAmount) {
      toast.error(`Le montant saisi (${confirmAmount}) ne correspond pas au total (${totalAmount.toLocaleString('fr-FR')})`)
      return
    }

    if (!reason.trim()) {
      toast.error('Veuillez indiquer un motif de remboursement')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/vendeurs/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund_order',
          orderId,
          reason: reason.trim(),
          confirmAmount: Number(confirmAmount),
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors du remboursement')
      }

      toast.success(`✅ Commande remboursée — ${totalAmount.toLocaleString('fr-FR')} FCFA restitués`)
      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true) }}
        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-black rounded-lg transition-all flex items-center gap-1 shrink-0"
        title="Rembourser"
      >
        <RotateCcw className="w-3 h-3" />
        Rembourser
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-[#0A2E22]/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-800">Remboursement Intégral</h3>
                  <p className="text-xs text-red-600 font-medium">Action irréversible — tous les fonds seront restitués.</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/50 rounded-lg transition-colors" title="Fermer">
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Montant total */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Montant Total de la Commande</p>
                <p className="text-2xl font-black text-[#1A1A1A]">{totalAmount.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">#{orderId.slice(-8).toUpperCase()}</p>
              </div>

              {/* Ce qui sera restitué */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-black text-amber-700 mb-1">⚠️ Cette action va :</p>
                <ul className="text-xs text-amber-600 space-y-0.5 font-medium">
                  <li>• Retirer le montant vendeur du wallet vendeur</li>
                  <li>• Annuler la commission plateforme</li>
                  <li>• Retirer la commission closer (si applicable)</li>
                  <li>• Annuler les gains affilié (si applicable)</li>
                  <li>• Marquer la commande comme &quot;Remboursée&quot;</li>
                </ul>
              </div>

              {/* Motif */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                  Motif du remboursement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ex: Produit non conforme, client insatisfait..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-red-400 transition-all"
                />
              </div>

              {/* Double validation */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                  Saisissez le montant exact pour confirmer <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.value)}
                  placeholder={totalAmount.toString()}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-800 outline-none focus:border-red-400 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handleRefund}
                  disabled={loading || !reason.trim() || Number(confirmAmount) !== totalAmount}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Confirmer le remboursement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
