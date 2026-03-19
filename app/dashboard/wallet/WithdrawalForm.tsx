'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const METHODS = [
  { id: 'wave',          label: 'Wave',          icon: '🌊', placeholder: 'Ex: +221 77 000 00 00' },
  { id: 'orange_money',  label: 'Orange Money',  icon: '🟠', placeholder: 'Ex: +221 77 000 00 00' },
  { id: 'free_money',    label: 'Free Money',    icon: '🟢', placeholder: 'Ex: +221 76 000 00 00' },
] as const

type Method = typeof METHODS[number]['id']

interface WithdrawalFormProps {
  walletId: string
  availableBalance: number
}

export function WithdrawalForm({ walletId, availableBalance }: WithdrawalFormProps) {
  const router   = useRouter()
  const [amount, setAmount]     = useState('')
  const [method, setMethod]     = useState<Method>('wave')
  const [phone, setPhone]       = useState('')
  const [pin, setPin]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const numAmount = parseFloat(amount) || 0
  const isValid   = numAmount >= 1000 && numAmount <= availableBalance && phone.trim().length >= 8 && pin.length === 4

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_id: walletId, amount: numAmount, payment_method: method, phone, pin }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Erreur lors de la demande.'); return }

    setSuccess(true)
    setAmount('')
    setPhone('')
    setPin('')
    router.refresh()
  }

  if (success) {
    return (
      <div className="bg-[#F5FAF8] border border-[#0F7A60]/10 rounded-2xl p-6 text-center space-y-2">
        <div className="text-4xl">✅</div>
        <p className="font-display font-black text-[#0F7A60]">Demande envoyée !</p>
        <p className="text-sm text-[#0F7A60]/70 leading-relaxed text-slate">Votre retrait sera traité dans les 24-48h.</p>
        <button onClick={() => setSuccess(false)} className="text-xs text-[#0F7A60] font-bold underline underline-offset-4 hover:text-[#0D5C4A] transition-colors">
          Faire une autre demande
        </button>
      </div>
    )
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
      <h2 className="font-semibold text-ink">Demander un retrait</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Montant */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Montant à retirer (min 1 000 FCFA)
          </label>
          <div className="relative">
            <input
              type="number" min={1000} max={availableBalance} step={5}
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Ex: 25000"
              className="w-full px-4 py-3 rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold text-sm transition pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">FCFA</span>
          </div>
          {numAmount > availableBalance && (
            <p className="text-xs text-red-500 mt-1">Montant supérieur au solde disponible.</p>
          )}
          {numAmount > 0 && numAmount < 1000 && (
            <p className="text-xs text-red-500 mt-1">Minimum 1 000 FCFA.</p>
          )}
          {/* Raccourcis */}
          <div className="flex gap-2 mt-2">
            {[5000, 10000, 25000].map(v => (
              v <= availableBalance && (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className="text-xs px-3 py-1.5 rounded-lg border border-line text-slate hover:border-gold hover:text-gold transition">
                  {(v / 1000).toFixed(0)}k
                </button>
              )
            ))}
            <button type="button" onClick={() => setAmount(String(Math.floor(availableBalance / 5) * 5))}
              className="text-xs px-3 py-1.5 rounded-lg border border-gold text-gold hover:bg-gold/5 transition">
              Tout
            </button>
          </div>
        </div>

        {/* Méthode */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Méthode</label>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(m => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center p-3 rounded-xl border transition ${
                  method === m.id ? 'border-gold bg-gold/5' : 'border-line hover:border-gray-300'
                }`}>
                <span className="text-xl">{m.icon}</span>
                <span className="text-xs font-medium text-gray-700 mt-1">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Numéro de réception */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Numéro de réception ({METHODS.find(m => m.id === method)?.label})
          </label>
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder={METHODS.find(m => m.id === method)?.placeholder ?? ''}
            className="w-full px-4 py-3 rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
          />
        </div>

        {/* Code PIN */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            🔒 Code PIN de sécurité
          </label>
          <input
            type="password" maxLength={4}
            value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="****"
            className="w-full px-4 py-3 rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold font-mono tracking-[0.5em] text-sm transition placeholder:tracking-normal"
          />
        </div>

        {/* Récapitulatif */}
        {numAmount >= 1000 && numAmount <= availableBalance && (
          <div className="bg-cream rounded-xl p-3 space-y-1 text-sm mt-4">
            <div className="flex justify-between text-gray-500">
              <span>Montant demandé</span>
              <span>{numAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between font-bold text-ink pt-1 border-t border-line">
              <span>Solde restant</span>
              <span className="text-gold">
                {(availableBalance - numAmount).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        )}

        <button type="submit" disabled={!isValid || loading}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition text-sm shadow-lg shadow-gold/20 mt-2">
          {loading ? 'Traitement…' : '💸 Demander le retrait'}
        </button>
      </form>
    </section>
  )
}
