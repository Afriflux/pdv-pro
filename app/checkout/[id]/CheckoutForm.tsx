/* eslint-disable react/forbid-dom-props */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { PromotionData } from '@/lib/promotions/promotionType'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Variant {
  id: string
  dimension_1: string | null
  value_1: string | null
  dimension_2: string | null
  value_2: string | null
  stock: number
  price_adjust: number
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  type: string
  images: string[]
  cash_on_delivery: boolean
  store: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string | null
    vendor_type: 'digital' | 'physical' | 'hybrid' | null
  }
}

interface CheckoutFormProps {
  product: Product
  variants: Variant[]
  computedPrice: {
    originalPrice: number
    finalPrice: number
    hasDiscount: boolean
    activePromo: PromotionData | null
  }
  vendorPlan?: 'gratuit' | 'pro'
  deliveryZones?: { id: string; name: string; fee: number; delay: string | null; active: boolean }[]
  coachingSlots?: any[]
  // Props optionnelles pour pré-remplir depuis ProductPage
  defaultUseCOD?: boolean
  defaultVariantId?: string | null
  defaultQuantity?: number
}

// ----------------------------------------------------------------
// Composant
// ----------------------------------------------------------------
export function CheckoutForm({
  product,
  variants,
  computedPrice,
  vendorPlan = 'gratuit',
  defaultUseCOD = false,
  defaultVariantId,
  defaultQuantity,
  deliveryZones = [],
  coachingSlots = [],
}: CheckoutFormProps) {
  const router = useRouter()
  const accent = product.store.primary_color || '#0F7A60'

  // ── États formulaire ──────────────────────────────────────────
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [address, setAddress]     = useState('')
  const [locating, setLocating]   = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    defaultVariantId !== undefined
      ? defaultVariantId
      : variants.length > 0 ? variants[0].id : null
  )
  const [quantity, setQuantity]   = useState(defaultQuantity ?? 1)
  const [useCOD, setUseCOD]       = useState(defaultUseCOD)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')

  const showCOD = product.type === 'physical' 
    && product.cash_on_delivery === true 
    && (product.store.vendor_type === 'physical' || product.store.vendor_type === 'hybrid')

  // ── États codes promo ─────────────────────────────────────────
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; discount: number; code: string } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  // ── États Coaching ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlotStr, setSelectedSlotStr] = useState<string>('')

  // ── États flow 2 étapes ───────────────────────────────────────
  type CheckoutStep = 'form' | 'payment'
  const [step, setStep]                   = useState<CheckoutStep>('form')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  // ── Calculs prix ──────────────────────────────────────────────
  const baseProductPrice = computedPrice.hasDiscount ? computedPrice.finalPrice : product.price
  const variant = variants.find(v => v.id === selectedVariant)
  const basePrice = baseProductPrice + (variant?.price_adjust ?? 0)

  const grossSubtotal      = basePrice * quantity
  const promoDiscountAmount = appliedPromo?.discount ?? 0
  const subtotal           = Math.max(0, grossSubtotal - promoDiscountAmount)

  const commissionRate = vendorPlan === 'pro' ? 0.05 : 0.07
  const platformFee    = Math.round(subtotal * commissionRate)
  
  const selectedZone   = deliveryZones?.find(z => z.id === selectedZoneId)
  const deliveryFee    = selectedZone?.fee ?? 0

  const vendorAmount   = (subtotal - platformFee) + deliveryFee
  const total          = subtotal + deliveryFee

  // ── Géolocalisation ───────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json() as {
            address?: {
              road?: string
              suburb?: string
              city?: string
              town?: string
              country?: string
            }
          }
          const addr = [
            data.address?.road,
            data.address?.suburb,
            data.address?.city ?? data.address?.town,
            data.address?.country
          ].filter(Boolean).join(', ')
          setAddress(addr)
          setLocationDetected(true)
        } catch {
          setLocating(false)
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false)
    )
  }

  // ── Code promo ─────────────────────────────────────────────────
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return
    setPromoError(null)
    setPromoLoading(true)

    if (computedPrice.hasDiscount) {
      setPromoError("Les codes promo ne sont pas cumulables avec les offres en cours.")
      setPromoLoading(false)
      return
    }

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput,
          storeId: product.store.id,
          subtotal: grossSubtotal,
          productId: product.id
        })
      })

      const data = await res.json() as { error?: string; promo_id?: string; discount_amount?: number }

      if (!res.ok) {
        setPromoError(data.error || "Code invalide.")
        setAppliedPromo(null)
      } else {
        setAppliedPromo({
          id: data.promo_id ?? '',
          discount: data.discount_amount ?? 0,
          code: promoCodeInput.trim().toUpperCase()
        })
        setPromoCodeInput('')
      }
    } catch {
      setPromoError("Erreur lors de la validation du code.")
    }

    setPromoLoading(false)
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoError(null)
  }

  // ── Étape 1 : Création de la commande ────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    if (!phone.trim()) {
      setError('Le numéro de téléphone est obligatoire.')
      return
    }
    if (product.type === 'coaching') {
      if (!selectedDate || !selectedSlotStr) {
        setError('Veuillez sélectionner une date et une heure pour votre coaching.')
        return
      }
    }
    if (product.type === 'physical') {
      if ((deliveryZones?.length ?? 0) > 0 && !selectedZoneId) {
        setError('Veuillez sélectionner une zone de livraison.')
        return
      }
      if (!address.trim() && !useCOD) {
        setError('Adresse de livraison obligatoire.')
        return
      }
    }

    setLoading(true)

    try {
      const body = {
        product_id:       product.id,
        store_id:         product.store.id,
        variant_id:       selectedVariant,
        quantity,
        buyer_name:       name.trim(),
        buyer_email:      email.trim() || undefined,
        buyer_phone:      phone.trim(),
        delivery_address: address.trim() || null,
        delivery_zone_id: selectedZoneId || null,
        delivery_fee:     deliveryFee,
        // Pour COD → 'cod', pour paiement en ligne → 'pending' (sera mis à jour par /api/payments/initiate)
        payment_method:   useCOD ? 'cod' : 'pending',
        subtotal:         grossSubtotal,
        promo_discount:   promoDiscountAmount,
        platform_fee:     platformFee,
        vendor_amount:    vendorAmount,
        total,
        applied_promo_id: appliedPromo?.id || null,
        booking_date:     selectedDate || null,
        booking_start_time: selectedSlotStr ? selectedSlotStr.split('-')[0] : null,
        booking_end_time:   selectedSlotStr ? selectedSlotStr.split('-')[1] : null,
      }

      const res = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json() as {
        error?: string
        order_id?: string
        simulated?: boolean
      }

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la commande.')
        setLoading(false)
        return
      }

      // COD → confirmation directe
      if (useCOD) {
        router.push(`/checkout/success?order=${data.order_id}&cod=true`)
        return
      }

      // Paiement en ligne → passer à l'étape 2
      setCreatedOrderId(data.order_id ?? null)
      setStep('payment')
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ── onSuccess PaymentMethodSelector ──────────────────────────
  const handlePaymentSuccess = (checkoutUrl: string) => {
    window.location.href = checkoutUrl
  }

  // ================================================================
  // ÉTAPE 2 — Sélection du moyen de paiement
  // ================================================================
  if (step === 'payment' && createdOrderId) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          {product.store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.store.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: `${accent}11`, color: accent }}>
              {product.store.name[0]}
            </div>
          )}
          <p className="text-sm font-medium text-gray-700">{product.store.name}</p>
        </div>

        {/* Récapitulatif commande */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Récapitulatif</p>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{product.name} × {quantity}</span>
            <span>{grossSubtotal.toLocaleString('fr-FR')} F</span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between text-sm font-bold pt-1" style={{ color: accent }}>
              <span>PROMO ({appliedPromo.code})</span>
              <span>-{appliedPromo.discount.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600 pt-1">
              <span>Livraison ({selectedZone?.name})</span>
              <span>{deliveryFee.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-black">
            <span className="text-gray-700">Total</span>
            <span style={{ color: accent }}>{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        {/* Titre étape */}
        <div>
          <h2 className="text-lg font-black text-gray-900">Choisissez votre moyen de paiement</h2>
          <p className="text-xs text-gray-400 mt-0.5">Sélectionnez la méthode et procédez au paiement.</p>
        </div>

        {/* Sélecteur de paiement */}
        <PaymentMethodSelector
          amount={total}
          orderId={createdOrderId}
          onSuccess={handlePaymentSuccess}
        />

        {/* Retour étape 1 */}
        <button
          type="button"
          onClick={() => setStep('form')}
          className="w-full text-gray-400 text-xs font-bold hover:text-gray-600 transition py-2"
        >
          ← Modifier mes informations
        </button>

        <p className="text-center text-[10px] text-gray-400 pb-2 uppercase tracking-widest font-bold">
          🔒 Sécurisé par PDV PRO
        </p>
      </div>
    )
  }

  // ================================================================
  // ÉTAPE 1 — Formulaire informations acheteur
  // ================================================================
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        {product.store.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.store.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: `${accent}11`, color: accent }}>
            {product.store.name[0]}
          </div>
        )}
        <p className="text-sm font-medium text-gray-700">{product.store.name}</p>
      </div>

      {/* Produit */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} className="w-full h-44 object-cover" />
        )}

        <div className="p-4 space-y-1">
          <h1 className="font-bold text-gray-800 text-lg">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
          )}

          {computedPrice.hasDiscount && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${accent}11`, color: accent }}>
                Offre spéciale
              </span>
              <span className="text-sm text-gray-400 line-through">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          )}

          <p className="text-2xl font-extrabold pt-1" style={{ color: accent }}>
            {baseProductPrice.toLocaleString('fr-FR')} <span className="text-base font-medium opacity-60">FCFA</span>
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Variantes */}
        {variants.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm italic">Options disponibles</h2>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => (
                <button
                  key={v.id} type="button"
                  onClick={() => setSelectedVariant(v.id)}
                  disabled={v.stock === 0}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition"
                  style={selectedVariant === v.id ? {
                    borderColor: accent,
                    backgroundColor: `${accent}08`,
                    color: accent
                  } : v.stock === 0 ? {
                    borderColor: '#f1f1f1',
                    backgroundColor: '#fafaf7',
                    color: '#ccc',
                    cursor: 'not-allowed'
                  } : {
                    borderColor: '#eee',
                    color: '#666'
                  }}
                >
                  {v.value_1}{v.value_2 ? ` / ${v.value_2}` : ''}
                  {v.price_adjust !== 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      {v.price_adjust > 0 ? `+${v.price_adjust}` : v.price_adjust}
                    </span>
                  )}
                  {v.stock === 0 && <span className="ml-1 text-xs">(épuisé)</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Quantité */}
        {product.type === 'physical' && (
          <section className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Quantité</h2>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 transition">−</button>
              <span className="text-lg font-bold text-gray-800 min-w-[2rem] text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 transition">+</button>
            </div>
          </section>
        )}

        {/* Coaching : Choix du créneau */}
        {product.type === 'coaching' && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Réserver votre session</h2>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sélectionnez une date <span className="text-red-500">*</span></label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedSlotStr('') // reset time
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition appearance-none"
                style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Créneaux horaires disponibles <span className="text-red-500">*</span></label>
                {(() => {
                  const dateObj = new Date(selectedDate)
                  // getDay(): 0=Dimanche, 1=Lundi -> Notre DB: 0=Lundi, 6=Dimanche
                  const dayOfWeek = (dateObj.getDay() + 6) % 7
                  const availableSlots = coachingSlots.filter(s => s.day_of_week === dayOfWeek && s.active)

                  if (availableSlots.length === 0) {
                    return <p className="text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-xl text-center">Aucune disponibilité pour ce jour.</p>
                  }

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot, i) => {
                        const slotValue = `${slot.start_time}-${slot.end_time}`
                        const isSelected = selectedSlotStr === slotValue
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedSlotStr(slotValue)}
                            className="py-2.5 px-2 rounded-xl border text-sm font-bold transition flex items-center justify-center"
                            style={isSelected ? {
                              backgroundColor: accent,
                              borderColor: accent,
                              color: '#fff'
                            } : {
                              borderColor: '#e5e7eb',
                              color: '#374151'
                            }}
                          >
                            {slot.start_time} - {slot.end_time}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </section>
        )}

        {/* Coordonnées */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4 border border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Vos coordonnées</h2>

          {product.type !== 'digital' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom complet</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition"
                style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Adresse email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="votre@email.com (pour recevoir le reçu)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition"
                style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Téléphone WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              placeholder="+221 77 ..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition"
              style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
            />
          </div>

          {product.type === 'physical' && (
            <div className="space-y-4">
              {deliveryZones && deliveryZones.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">
                    Zone de livraison <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-800 focus:ring-2 outline-none text-sm transition appearance-none"
                    style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
                  >
                    <option value="" disabled>Sélectionnez votre zone</option>
                    {deliveryZones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} — (+{z.fee.toLocaleString('fr-FR')} FCFA) {z.delay ? `(${z.delay})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">
                  Détails de l'adresse (Quartier, Rue...) {!useCOD && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier, ville..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-28 text-gray-800 placeholder:text-gray-400 focus:ring-2 outline-none text-sm transition"
                  style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 font-bold italic"
                  style={{ backgroundColor: `${accent}11`, color: accent, border: `1px solid ${accent}22` }}
                >
                  {locating ? (
                    <span className="animate-pulse">LOC...</span>
                  ) : locationDetected ? (
                    <span>✓ PRÊT</span>
                  ) : (
                    <span>📍 LOCALISER</span>
                  )}
                </button>
              </div>
            </div>
            </div>
          )}
        </section>

        {/* Code Promo */}
        {!computedPrice.hasDiscount && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Code promo ?</h2>

            {appliedPromo ? (
              <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: `${accent}05`, borderColor: `${accent}11` }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: accent }}>{appliedPromo.code}</p>
                  <p className="text-[10px] opacity-70">Réduction active : -{appliedPromo.discount.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <button type="button" onClick={removePromo} className="opacity-40 hover:opacity-100 p-1">✕</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CODE"
                  value={promoCodeInput}
                  onChange={e => setPromoCodeInput(e.target.value)}
                  className="flex-1 uppercase font-mono px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition"
                  style={{ '--tw-ring-color': `${accent}33` } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCodeInput.trim()}
                  className="text-white px-4 rounded-xl text-sm font-black transition disabled:opacity-30"
                  style={{ backgroundColor: accent }}
                >
                  {promoLoading ? '...' : 'OK'}
                </button>
              </div>
            )}
            {promoError && <p className="text-xs text-red-500">{promoError}</p>}
          </section>
        )}

        {/* COD */}
        {showCOD && (
          <section className="rounded-2xl border p-4" style={{ backgroundColor: `${accent}05`, borderColor: `${accent}11` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">💵 Paiement à la livraison</p>
                <p className="text-[10px] text-gray-500">Payez une fois le colis reçu</p>
              </div>
              <div
                onClick={() => setUseCOD(v => !v)}
                className="w-12 h-7 rounded-full transition-colors cursor-pointer relative"
                style={{ backgroundColor: useCOD ? accent : '#eee' }}
              >
                <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useCOD ? 'left-7' : 'left-1.5'}`} />
              </div>
            </div>
          </section>
        )}

        {/* Récapitulatif */}
        <section className="bg-gray-50 rounded-2xl shadow-sm p-5 space-y-3 border-2 border-dashed border-gray-200">
          <h2 className="font-extrabold text-gray-800 text-lg mb-4 text-center">Récapitulatif de votre commande</h2>
          
          <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
            <span>Détails</span>
            <span>Prix</span>
          </div>
          <div className="flex justify-between text-base font-medium text-gray-700">
            <span>{product.name} × {quantity}</span>
            <span>{grossSubtotal.toLocaleString('fr-FR')} F</span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between text-sm font-bold pt-1" style={{ color: accent }}>
              <span>PROMO ({appliedPromo.code})</span>
              <span>-{appliedPromo.discount.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600 pt-1">
              <span>Livraison ({selectedZone?.name})</span>
              <span>{deliveryFee.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-end font-black">
            <span className="text-gray-900">Total à payer</span>
            <span className="text-xl" style={{ color: accent }}>{total.toLocaleString('fr-FR')} <span className="text-xs opacity-50">FCFA</span></span>
          </div>
        </section>

        {/* Boutons */}
        <button
          type="submit" disabled={loading}
          className="w-full text-white font-black py-4 rounded-2xl transition text-base shadow-xl"
          style={{ backgroundColor: accent, opacity: loading ? 0.5 : 1 }}
        >
          {loading
            ? 'CHARGEMENT...'
            : useCOD
              ? 'COMMANDER SANS PAYER'
              : `CONTINUER → PAIEMENT`}
        </button>

        <p className="text-center text-[10px] text-gray-400 pb-2 uppercase tracking-widest font-bold">
          🔒 Sécurisé par PDV PRO
        </p>
      </form>
    </div>
  )
}
