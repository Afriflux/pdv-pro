'use client'

// ─── app/dashboard/wallet/WithdrawForm.tsx ────────────────────────────────────
// Composant client — Formulaire de demande de retrait simplifié
// Montant + boutons rapides + récapitulatif compte (readonly)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WithdrawFormProps {
  balance:          number
  withdrawalMethod: string
  withdrawalNumber: string
  withdrawalName:   string
  storeId:          string
}

const METHOD_LABELS: Record<string, string> = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  bank:         'Virement bancaire',
}

const METHOD_ICONS: Record<string, string> = {
  wave:         '🌊',
  orange_money: '🟠',
  bank:         '🏦',
}

const MIN_AMOUNT = 5000

// ─── Composant principal ──────────────────────────────────────────────────────

export default function WithdrawForm({
  balance,
  withdrawalMethod,
  withdrawalNumber,
  withdrawalName,
  storeId,
}: WithdrawFormProps) {
  const router = useRouter()

  const [amount,     setAmount]     = useState<number>(MIN_AMOUNT)
  const [loading,    setLoading]    = useState(false)
  const [inputValue, setInputValue] = useState(String(MIN_AMOUNT))

  const methodLabel = METHOD_LABELS[withdrawalMethod] ?? 'Wave'
  const methodIcon  = METHOD_ICONS[withdrawalMethod]  ?? '💸'

  const isAmountValid = amount >= MIN_AMOUNT && amount <= balance

  // ── Boutons rapides ───────────────────────────────────────────────────────

  const QUICK_AMOUNTS = [5000, 10000, 25000, balance]
  const QUICK_LABELS  = ['5K', '10K', '25K', 'Max']

  function selectQuick(val: number) {
    const clamped = Math.max(MIN_AMOUNT, Math.min(val, balance))
    setAmount(clamped)
    setInputValue(String(clamped))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    setInputValue(raw)
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) setAmount(parsed)
    else setAmount(0)
  }

  // ── Soumission ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isAmountValid) {
      if (amount < MIN_AMOUNT) {
        toast.error(`Montant minimum : ${MIN_AMOUNT.toLocaleString('fr-FR')} FCFA`)
      } else {
        toast.error(`Montant supérieur au solde disponible (${balance.toLocaleString('fr-FR')} FCFA)`)
      }
      return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/wallet/withdraw', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount, storeId }),
      })
      const data = await res.json() as { success?: boolean; message?: string; error?: string }

      if (res.ok && data.success) {
        toast.success(
          `✅ Retrait de ${amount.toLocaleString('fr-FR')} FCFA en cours de traitement !`
        )
        // Remettre le form à zéro
        setAmount(MIN_AMOUNT)
        setInputValue(String(MIN_AMOUNT))
        // Rafraîchir le Server Component pour mettre à jour le solde
        router.refresh()
      } else {
        throw new Error(data.error ?? data.message ?? 'Erreur lors du retrait')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
    } finally {
      setLoading(false)
    }
  }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Saisie du montant ── */}
      <div>
        <label htmlFor="withdraw-amount" className="block text-xs font-bold text-gray-600 mb-1.5">
          Montant du retrait (FCFA)
        </label>
        <div className="relative">
          <input
            id="withdraw-amount"
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={String(MIN_AMOUNT)}
            className={`w-full px-4 py-3.5 text-lg font-black text-[#1A1A1A] bg-[#FAFAF7]
              border rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2
              transition-all pr-16
              ${!isAmountValid && amount > 0
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#0F7A60]/30 focus:border-[#0F7A60]'
              }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
            FCFA
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <p className={`text-[11px] font-medium ${
            amount < MIN_AMOUNT && amount > 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            Min : {MIN_AMOUNT.toLocaleString('fr-FR')} FCFA
          </p>
          <p className={`text-[11px] font-medium ${
            amount > balance ? 'text-red-400' : 'text-gray-400'
          }`}>
            Disponible : <strong>{balance.toLocaleString('fr-FR')} FCFA</strong>
          </p>
        </div>
      </div>

      {/* ── Boutons rapides ── */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Montants rapides
        </p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((val, i) => {
            const isDisabled = val > balance
            const isActive   = amount === val && !isDisabled
            return (
              <button
                key={QUICK_LABELS[i]}
                type="button"
                onClick={() => !isDisabled && selectQuick(val)}
                disabled={isDisabled}
                className={`py-2 rounded-xl text-xs font-bold border-2 transition-all
                  ${isActive
                    ? 'border-[#0F7A60] bg-[#0F7A60] text-white'
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'border-gray-200 bg-[#FAFAF7] text-[#1A1A1A] hover:border-[#0F7A60]/40'
                  }`}
              >
                {QUICK_LABELS[i]}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Compte de destination (readonly) ── */}
      <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Compte de destination
          </p>
          <a
            href="/dashboard/settings#retrait"
            className="text-[11px] font-bold text-[#0F7A60] hover:underline"
          >
            Modifier →
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl">{methodIcon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1A1A1A]">{methodLabel}</p>
            <p className="text-xs text-gray-500 font-mono truncate">{withdrawalNumber}</p>
            {withdrawalName && (
              <p className="text-xs text-gray-400 mt-0.5">
                Au nom de : <strong>{withdrawalName}</strong>
              </p>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 italic">
          Non modifiable ici — modifier dans les Paramètres
        </p>
      </div>

      {/* ── Bouton soumettre ── */}
      <button
        type="submit"
        disabled={!isAmountValid || loading}
        className="w-full py-3.5 text-sm font-bold text-white bg-[#0F7A60] hover:bg-[#0D6B53]
          rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed
          transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg><span>Traitement en cours...</span></>
        ) : (
          `💸 Confirmer le retrait de ${isAmountValid ? amount.toLocaleString('fr-FR') : '—'} FCFA`
        )}
      </button>

    </form>
  )
}
