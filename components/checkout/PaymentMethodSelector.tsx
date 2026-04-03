'use client'

import { useState, useEffect } from 'react'
import { Loader2, Smartphone, CreditCard, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'wave' | 'orange_money' | 'card_cinetpay' | 'card_paytech'

interface PaymentMethodSelectorProps {
  amount: number
  orderId: string
  onSuccess: (checkoutUrl: string) => void
  clientProfile?: any
}

// ─── Helpers frais ─────────────────────────────────────────────────────────────

function computeFees(amount: number, method: PaymentMethod): number {
  return method === 'wave' || method === 'orange_money'
    ? Math.round(amount * 0.01)
    : Math.round(amount * 0.03)
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PaymentMethodSelector({
  amount,
  orderId,
  onSuccess,
  clientProfile,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(() => {
    if (clientProfile?.client_payment_method) {
      if (['wave', 'orange_money', 'card_cinetpay', 'card_paytech'].includes(clientProfile.client_payment_method)) {
        return clientProfile.client_payment_method as PaymentMethod
      }
    }
    return null
  })
  const [customerPhone, setCustomerPhone] = useState(clientProfile?.client_payment_number || '')
  const [loading, setLoading] = useState(false)
  const [displayFees, setDisplayFees] = useState(0)

  // Recalculer les frais en temps réel quand la méthode change
  useEffect(() => {
    if (!selectedMethod) {
      setDisplayFees(0)
      return
    }
    setDisplayFees(computeFees(amount, selectedMethod))
  }, [selectedMethod, amount])

  const isMobileMoney =
    selectedMethod === 'wave' || selectedMethod === 'orange_money'

  const canSubmit =
    selectedMethod !== null &&
    (!isMobileMoney || customerPhone.trim().length >= 8)

  const handlePay = async () => {
    if (!selectedMethod) return
    setLoading(true)

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          method: selectedMethod,
          customerPhone: isMobileMoney ? customerPhone.trim() : undefined,
        }),
      })

      const data = (await res.json()) as {
        checkoutUrl?: string
        error?: string
      }

      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error ?? `Erreur lors de l'initiation du paiement`)
        return
      }

      onSuccess(data.checkoutUrl)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur réseau. Réessayez.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // ── Bouton méthode générique ─────────────────────────────────────────────────
  const MethodButton = ({
    id,
    label,
    emoji,
    subtitle,
  }: {
    id: PaymentMethod
    label: string
    emoji: string
    subtitle?: string
  }) => {
    const isSelected = selectedMethod === id
    return (
      <button
        type="button"
        onClick={() => setSelectedMethod(id)}
        className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-150 ${
          isSelected
            ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm'
            : 'border-gray-100 bg-white hover:border-gray-200'
        }`}
      >
        <span className="text-2xl">{emoji}</span>
        <span
          className={`text-xs font-black uppercase tracking-wide ${
            isSelected ? 'text-[#0F7A60]' : 'text-gray-600'
          }`}
        >
          {label}
        </span>
        {subtitle && (
          <span className="text-[10px] text-gray-400 font-medium">{subtitle}</span>
        )}
        {isSelected && (
          <CheckCircle2 className="w-4 h-4 text-[#0F7A60] mt-0.5" />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Section Mobile Money ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0F7A60]/5 border-b border-[#0F7A60]/10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0F7A60]" />
            <span className="text-sm font-black text-gray-800">Mobile Money</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F7A60] bg-[#0F7A60]/10 px-2 py-0.5 rounded-full">
              Recommandé
            </span>
            <span className="text-[10px] font-bold text-gray-400">Frais : 1%</span>
          </div>
        </div>

        {/* Boutons Wave + Orange */}
        <div className="flex gap-3 p-3">
          <MethodButton id="wave" label="Wave" emoji="🌊" subtitle="Wave Sénégal" />
          <MethodButton
            id="orange_money"
            label="Orange Money"
            emoji="🟠"
            subtitle="Orange Money"
          />
        </div>

        {/* Champ téléphone (visible si méthode mobile) */}
        {isMobileMoney && (
          <div className="px-3 pb-3">
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">
              {selectedMethod === 'wave'
                ? 'Numéro Wave'
                : 'Numéro Orange Money'}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ex: 77 123 45 67"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-[#0F7A60] focus:bg-white outline-none transition-all placeholder:text-gray-300"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* ── Section Carte Bancaire ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-black text-gray-800">Carte Bancaire</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400">Frais : 3%</span>
        </div>

        {/* Boutons CinetPay + PayTech */}
        <div className="flex gap-3 p-3">
          <MethodButton
            id="card_cinetpay"
            label="CinetPay"
            emoji="💳"
            subtitle="Visa / Mastercard"
          />
          <MethodButton
            id="card_paytech"
            label="PayTech"
            emoji="🏦"
            subtitle="Mobile + Carte"
          />
        </div>
      </div>

      {/* ── Récapitulatif frais ── */}
      {selectedMethod && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Montant commande</span>
            <span className="font-bold text-gray-700">
              {amount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>
              Frais passerelle (
              {isMobileMoney ? '1%' : '3%'})
            </span>
            <span className="font-bold text-gray-700">
              {displayFees.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
            <span>Vous payez</span>
            <span className="text-[#0F7A60]">
              {amount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <p className="text-[10px] text-gray-400 text-center font-medium pt-1">
            Les frais passerelle sont à la charge du vendeur.
          </p>
        </div>
      )}

      {/* ── Bouton Payer ── */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!canSubmit || loading}
        className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] ${
          !canSubmit || loading
            ? 'bg-gray-300 shadow-none cursor-not-allowed'
            : 'bg-[#0F7A60] hover:bg-[#0D5C4A] shadow-[#0F7A60]/20'
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          `Payer ${amount.toLocaleString('fr-FR')} FCFA`
        )}
      </button>

      {!selectedMethod && (
        <p className="text-[10px] text-center text-gray-400 font-medium uppercase tracking-wider">
          Sélectionnez un moyen de paiement pour continuer.
        </p>
      )}
    </div>
  )
}
