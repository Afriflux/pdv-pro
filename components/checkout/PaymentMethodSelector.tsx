'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, Shield } from 'lucide-react'
import { toast } from '@/lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableMethod {
  id: string
  label: string
  subtitle: string
  color: string
  icon: string
}

interface PaymentMethodSelectorProps {
  amount: number
  orderId: string
  onSuccess: (checkoutUrl: string) => void
  clientProfile?: {
    client_payment_method?: string | null
    client_payment_number?: string | null
    [key: string]: unknown
  } | null
  buyerPhone?: string
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PaymentMethodSelector({
  amount,
  orderId,
  onSuccess,
  clientProfile,
  buyerPhone,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<AvailableMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [customerPhone, setCustomerPhone] = useState(clientProfile?.client_payment_number || '')
  const [loading, setLoading] = useState(false)
  const [payingLabel, setPayingLabel] = useState('')

  // Fetch available methods from the API (reads IntegrationKey)
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/payments/available')
        const data = await res.json() as { methods: AvailableMethod[] }
        let fetchedMethods = data.methods || []

        // GEO-ROUTING PAIEMENTS: Restreindre les passerelles SN (Wave, PayTech) si acheteur hors SN 
        if (buyerPhone && buyerPhone.startsWith('+') && !buyerPhone.startsWith('+221')) {
           fetchedMethods = fetchedMethods.filter((m: AvailableMethod) => m.id !== 'wave' && m.id !== 'paytech')
        }

        setMethods(fetchedMethods)

        // Auto-select if client had a previous preference
        if (clientProfile?.client_payment_method) {
          const match = data.methods?.find((m: AvailableMethod) => m.id === clientProfile.client_payment_method)
          if (match) setSelectedMethod(match.id)
        }
      } catch {
        toast.error('Impossible de charger les moyens de paiement.')
      } finally {
        setLoadingMethods(false)
      }
    }
    fetchMethods()
  }, [clientProfile?.client_payment_method, buyerPhone])

  const needsPhone = selectedMethod === 'wave'

  const canSubmit =
    selectedMethod !== null &&
    (!needsPhone || customerPhone.trim().length >= 8)

  const handlePay = async () => {
    if (!selectedMethod) return
    setLoading(true)
    const method = methods.find(m => m.id === selectedMethod)
    setPayingLabel(method?.label || '')

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          method: selectedMethod,
          customerPhone: needsPhone ? customerPhone.trim() : undefined,
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
      setPayingLabel('')
    }
  }

  // ── Loading skeleton ──
  if (loadingMethods) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="h-12 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  // ── No methods available ──
  if (methods.length === 0) {
    return (
      <div role="alert" className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
        <p className="text-sm font-bold text-red-800 mb-1">Paiement indisponible</p>
        <p className="text-xs text-red-600">
          Aucun processeur de paiement n&apos;est configuré pour le moment. Contactez le support.
        </p>
      </div>
    )
  }

  // ── Redirect loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 animate-[fade-in_0.3s_ease-out]">
        <div className="w-14 h-14 rounded-full bg-[#0F7A60]/10 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[#0F7A60] animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-700">
          Redirection vers {payingLabel}…
        </p>
        <p className="text-xs text-gray-400">Ne fermez pas cette page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* ── Amount display ── */}
      <div className="text-center pb-1">
        <p className="text-xs text-gray-400 font-medium">Vous payez</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {amount.toLocaleString('fr-FR')} <span className="text-base font-bold text-gray-500">FCFA</span>
        </p>
      </div>

      {/* ── Method buttons ── */}
      <div className="space-y-2.5">
        {methods.map((method, index) => {
          const isSelected = selectedMethod === method.id
          const isFirst = index === 0

          return (
            // eslint-disable-next-line
            <button
              key={method.id}
              type="button"
              {...({ 'aria-pressed': isSelected } as any)}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0F7A60] focus-visible:ring-offset-2 outline-none ${
                isSelected
                  ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-md'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gray-50"
              >
                {method.icon.startsWith('/') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={method.icon} alt={method.label} className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xl">{method.icon}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${isSelected ? 'text-[#0F7A60]' : 'text-gray-900'}`}>
                    {method.label}
                  </span>
                  {isFirst && (
                    <span className="text-xs font-black uppercase tracking-wider text-[#0F7A60] bg-[#0F7A60]/10 px-1.5 py-0.5 rounded-md">
                      Recommandé
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{method.subtitle}</p>
              </div>

              {/* Check */}
              {isSelected ? (
                <CheckCircle2 className="w-5 h-5 text-[#0F7A60] shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Phone input for Wave ── */}
      {needsPhone && (
        <div className="animate-[fade-slice-down_0.2s_ease-out]">
          <label className="block text-xs font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-wider">
            Numéro Wave
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

      {/* ── Pay button ── */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          !canSubmit
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#0F7A60] hover:bg-[#0D5C4A] shadow-lg shadow-[#0F7A60]/20'
        }`}
      >
        Payer {amount.toLocaleString('fr-FR')} FCFA
      </button>

      {/* ── Security badge ── */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <Shield className="w-3 h-3 text-gray-300" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Paiement sécurisé
        </p>
      </div>
    </div>
  )
}
