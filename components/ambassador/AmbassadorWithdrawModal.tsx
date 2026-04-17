'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Banknote, Phone, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

interface AmbassadorWithdrawModalProps {
  ambassadorId: string
  balance: number
}

type WithdrawMethod = 'wave' | 'orange_money'

export default function AmbassadorWithdrawModal({ ambassadorId, balance }: AmbassadorWithdrawModalProps) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<WithdrawMethod>('wave')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState<number>(balance)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const minAmount = 5000
  const isValid = phone.trim().length >= 8 && amount >= minAmount && amount <= balance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    try {
      const res = await fetch('/api/ambassador/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambassadorId, method, phone: phone.trim(), amount }),
      })

      const data = await res.json() as { error?: string; message?: string }

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la demande de retrait.')
      } else {
        toast.success(`Retrait de ${amount.toLocaleString('fr-FR')} FCFA initié ✅`)
        setOpen(false)
        setPhone('')
        setAmount(balance)
        // Recharger la page pour refléter le nouveau solde
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#0F7A60] hover:bg-[#0D5C4A] text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#0F7A60]/20 text-sm"
      >
        <Banknote className="w-4 h-4" />
        Retirer {balance.toLocaleString('fr-FR')} FCFA
      </button>

      {/* Overlay modal */}
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900">Retrait de commissions</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Solde disponible : <strong>{balance.toLocaleString('fr-FR')} FCFA</strong>
                </p>
              </div>
              <button
                aria-label="Fermer"
                title="Fermer"
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Choix méthode */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Méthode de paiement
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'wave', label: 'Wave', emoji: '📱' },
                    { id: 'orange_money', label: 'Orange Money', emoji: '🟠' },
                  ] as { id: WithdrawMethod; label: string; emoji: string }[]).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        method === m.id
                          ? 'border-[#0F7A60] bg-[#0F7A60]/5 text-[#0F7A60]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numéro de téléphone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Numéro {method === 'wave' ? 'Wave' : 'Orange Money'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/15 text-sm transition"
                  />
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Montant à retirer
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    aria-label="Montant"
                    title="Montant"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={minAmount}
                    max={balance}
                    step={500}
                    required
                    className="w-full pl-9 pr-16 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/15 text-sm transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    FCFA
                  </span>
                </div>
                {amount > balance && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">
                    Montant supérieur au solde disponible.
                  </p>
                )}
                {amount < minAmount && amount > 0 && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">
                    Montant minimum : {minAmount.toLocaleString('fr-FR')} FCFA
                  </p>
                )}
              </div>

              {/* Bouton confirmation */}
              <button
                type="submit"
                disabled={!isValid || loading}
                className={`w-full py-4 rounded-xl font-black text-white transition-all text-sm ${
                  isValid && !loading
                    ? 'bg-[#0F7A60] hover:bg-[#0D5C4A] shadow-lg shadow-[#0F7A60]/20'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  `Confirmer le retrait de ${amount.toLocaleString('fr-FR')} FCFA`
                )}
              </button>

              <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold">
                🔒 Sécurisé par YAYYAM
              </p>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
