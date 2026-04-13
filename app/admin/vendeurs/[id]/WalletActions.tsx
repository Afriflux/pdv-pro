'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Loader2, X } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function WalletActions({ storeId, currentBalance }: { storeId: string; currentBalance: number }) {
  const [modal, setModal] = useState<'credit' | 'debit' | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAction = async () => {
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      toast.error('Montant invalide')
      return
    }

    if (modal === 'debit' && numAmount > currentBalance) {
      toast.error(`Solde insuffisant (${currentBalance.toLocaleString('fr-FR')} FCFA)`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/vendeurs/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modal === 'credit' ? 'credit_wallet' : 'debit_wallet',
          amount: numAmount,
          reason: reason.trim() || undefined,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }

      const data = await res.json()
      toast.success(`${modal === 'credit' ? '✅ Crédité' : '✅ Débité'} — Nouveau solde : ${data.new_balance?.toLocaleString('fr-FR')} FCFA`)
      setModal(null)
      setAmount('')
      setReason('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 mt-4">
        <button
          onClick={(e) => { e.preventDefault(); setModal('credit') }}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Créditer
        </button>
        <button
          onClick={(e) => { e.preventDefault(); setModal('debit') }}
          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
          Débiter
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A2E22]/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-6 py-5 border-b flex items-center justify-between ${modal === 'credit' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <h3 className={`text-sm font-black ${modal === 'credit' ? 'text-emerald-800' : 'text-red-800'}`}>
                {modal === 'credit' ? '💰 Créditer le Wallet' : '💸 Débiter le Wallet'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-white/50 rounded-lg transition-colors" title="Fermer">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Solde actuel</p>
                <p className="text-lg font-black text-[#1A1A1A]">{currentBalance.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Montant (FCFA)</label>
                <input
                  autoFocus
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ex: 5000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-800 outline-none focus:border-[#0F7A60] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Motif (optionnel)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ex: Compensation service, Correction erreur..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-[#0F7A60] transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handleAction}
                  disabled={loading || !amount}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white rounded-xl transition-all disabled:opacity-50 ${
                    modal === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {modal === 'credit' ? 'Confirmer le crédit' : 'Confirmer le débit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
