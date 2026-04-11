/* eslint-disable react/forbid-dom-props */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Trophy, Home, Briefcase, MapPinned } from 'lucide-react'
import { PromotionData } from '@/lib/promotions/promotionType'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import LocalPaymentBadges from '@/components/widgets/LocalPaymentBadges'

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
  payment_type?: string | null
  recurring_interval?: string | null
  cash_on_delivery: boolean
  coaching_type?: 'individual' | 'group' | null
  max_participants?: number | null
  coaching_durations?: number[] | null
  coaching_is_pack?: boolean | null
  coaching_pack_count?: number | null
  bump_active?: boolean | null
  bump_offer_text?: string | null
  bump_product_id?: string | null
  store: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string | null
    vendor_type: 'digital' | 'physical' | 'hybrid' | null
    coaching_max_per_day?: number | null
    coaching_min_notice?: number | null
    volume_discounts_active?: boolean
    volume_discounts_config?: unknown
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
  coachingSlots?: { day_of_week: number, start_time: string, end_time: string, active: boolean, [key: string]: unknown }[]
  blockedDates?: { date: string | Date, start_time?: string | null, end_time?: string | null, [key: string]: unknown }[]
  bookedSlots?: Record<string, number>
  // Props optionnelles pour pré-remplir depuis ProductPage
  defaultUseCOD?: boolean
  defaultVariantId?: string | null
  defaultQuantity?: number
  bumpProduct?: {
    id: string
    name: string
    price: number
    images: string[]
    type: string
  } | null
  clientProfile?: {
    name?: string | null
    email?: string | null
    phone?: string | null
    client_payment_method?: string | null
    client_payment_number?: string | null
  } | null
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
  blockedDates = [],
  bookedSlots = {},
  bumpProduct,
  clientProfile,
}: CheckoutFormProps) {
  const router = useRouter()

  const getIntervalSuffix = (interval?: string | null) => {
    switch(interval) {
      case 'weekly': return ' / sem'
      case 'monthly': return ' / mois'
      case 'quarterly': return ' / trim'
      case 'yearly': return ' / an'
      default: return ''
    }
  }

  // ── États formulaire ──────────────────────────────────────────
  const [name, setName]           = useState(clientProfile?.name || '')
  const [email, setEmail]         = useState(clientProfile?.email || '')
  const [phone, setPhone]         = useState(clientProfile?.phone || '')
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

  // ── Adresses sauvegardées (lookup checkout) ──────────────────────
  type SavedAddr = { label: string; name: string; phone: string; address: string; city: string | null; delivery_notes: string | null; latitude: number | null; longitude: number | null; is_default: boolean }
  const [savedAddresses, setSavedAddresses] = useState<SavedAddr[]>([])
  const [selectedSavedAddr, setSelectedSavedAddr] = useState<string | null>(null)

  useEffect(() => {
    if (product.type !== 'physical') return
    if (!email || email.trim().length < 5) {
      setSavedAddresses([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (email.trim()) params.set('email', email.trim())
        const res = await fetch(`/api/checkout/addresses?${params.toString()}`)
        const data = await res.json() as { addresses: SavedAddr[] }
        setSavedAddresses(data.addresses || [])
        // Auto-select the default address
        const defaultAddr = data.addresses?.find((a: SavedAddr) => a.is_default)
        if (defaultAddr && !address) {
          setSelectedSavedAddr(defaultAddr.label)
          setName(defaultAddr.name)
          setPhone(defaultAddr.phone)
          setAddress(defaultAddr.address + (defaultAddr.delivery_notes ? ` — ${defaultAddr.delivery_notes}` : ''))
          setLocationDetected(true)
        }
      } catch { /* silent */ }
    }, 600)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, product.type])

  const handleSelectSavedAddress = (addr: SavedAddr) => {
    if (selectedSavedAddr === addr.label) {
      // Désélectionner
      setSelectedSavedAddr(null)
      setAddress('')
      setLocationDetected(false)
      return
    }
    setSelectedSavedAddr(addr.label)
    setName(addr.name)
    setPhone(addr.phone)
    setAddress(addr.address + (addr.delivery_notes ? ` — ${addr.delivery_notes}` : ''))
    setLocationDetected(true)
  }

  // ── Anti-Fraude COD ────────────────────────────────────────────
  const [codBlocked, setCodBlocked] = useState(false)
  const [codWarning, setCodWarning] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setCodChecking] = useState(false)

  const showCOD = product.type === 'physical' 
    && product.cash_on_delivery === true 
    && (product.store.vendor_type === 'physical' || product.store.vendor_type === 'hybrid')
    && !codBlocked

  // Check buyer COD eligibility when phone changes
  useEffect(() => {
    if (!phone || phone.trim().length < 8 || !product.cash_on_delivery) return
    const timer = setTimeout(async () => {
      setCodChecking(true)
      try {
        const res = await fetch('/api/checkout/buyer-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim(), storeId: product.store.id }),
        })
        const data = await res.json() as { allowed: boolean; message: string | null; riskLevel: string }
        if (!data.allowed) {
          setCodBlocked(true)
          setUseCOD(false)
          setCodWarning(data.message)
        } else {
          setCodBlocked(false)
          if (data.riskLevel === 'warning') {
            setCodWarning(data.message)
          } else {
            setCodWarning(null)
          }
        }
      } catch { /* silent */ }
      setCodChecking(false)
    }, 800) // debounce
    return () => clearTimeout(timer)
  }, [phone, product.cash_on_delivery, product.store.id])

  // ── Fidélité (Points) ─────────────────────────────────────────
  const [loyaltyData, setLoyaltyData] = useState<{ enabled: boolean, config?: { maxPerc: number, [key: string]: unknown }, account: { balance: number, tier: string, [key: string]: unknown } | null } | null>(null)
  const [redeemPoints, setRedeemPoints] = useState<number>(0)

  useEffect(() => {
    if (!phone || phone.trim().length < 8) {
      setLoyaltyData(null)
      setRedeemPoints(0)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const { checkLoyaltyAccount } = await import('@/app/actions/loyalty')
        const data = await checkLoyaltyAccount(phone.trim(), product.store.id)
        if (data && data.enabled) {
          setLoyaltyData(data as { enabled: boolean, config?: { maxPerc: number, [key: string]: unknown }, account: { balance: number, tier: string, [key: string]: unknown } | null })
          setRedeemPoints(0)
        } else {
          setLoyaltyData(null)
        }
      } catch { /* silent */ }
    }, 800)
    return () => clearTimeout(timer)
  }, [phone, product.store.id])

  // ── États codes promo ─────────────────────────────────────────
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; discount: number; code: string } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  // ── États Coaching ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDuration, setSelectedDuration] = useState<number>(() => {
    if (product.coaching_durations && product.coaching_durations.length > 0) {
      return product.coaching_durations[0]
    }
    return 60
  })
  const [selectedSlotStr, setSelectedSlotStr] = useState<string>('')
  const [userTz, setUserTz] = useState<string>('')
  useEffect(() => {
    setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  // ── États flow 2 étapes ───────────────────────────────────────
  type CheckoutStep = 'form' | 'payment'
  const [step, setStep]                   = useState<CheckoutStep>('form')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  // ── État Order Bump ───────────────────────────────────────────
  const [bumpAccepted, setBumpAccepted] = useState(false)

  // ── États Scarcity ──────────────────────────────────────────────
  const [activeViewers, setActiveViewers] = useState(12)
  useEffect(() => {
    setActiveViewers(Math.floor(Math.random() * 35) + 12)
  }, [])

  // ── Calculs prix ──────────────────────────────────────────────
  const baseProductPrice = computedPrice.hasDiscount ? computedPrice.finalPrice : product.price
  const variant = variants.find(v => v.id === selectedVariant)
  const basePrice = baseProductPrice + (variant?.price_adjust ?? 0)

  // ── Volume Discounts Logic (B2B) ──────────────────────────────
  let volumeDiscountAmount = 0
  
  if (product.store.volume_discounts_active && product.store.volume_discounts_config) {
    const config = typeof product.store.volume_discounts_config === 'string' 
      ? JSON.parse(product.store.volume_discounts_config) 
      : product.store.volume_discounts_config
      
    if (config?.rules && Array.isArray(config.rules)) {
      // Find the highest rule where quantity >= rule.quantity
      const sortedRules = [...config.rules].sort((a, b) => b.quantity - a.quantity)
      const validRule = sortedRules.find(r => quantity >= r.quantity)
      if (validRule) {
        if (validRule.discountType === 'percentage') {
          volumeDiscountAmount = (basePrice * quantity) * (validRule.value / 100)
        } else if (validRule.discountType === 'fixed') {
          volumeDiscountAmount = validRule.value
        }
      }
    }
  }

  const bumpPrice = bumpProduct && bumpAccepted ? bumpProduct.price : 0
  const grossSubtotal      = (basePrice * quantity) - volumeDiscountAmount + bumpPrice
  const promoDiscountAmount = appliedPromo?.discount ?? 0
  const subtotal           = Math.max(0, grossSubtotal - promoDiscountAmount)

  const selectedZone   = deliveryZones?.find(z => z.id === selectedZoneId)
  const deliveryFee    = selectedZone?.fee ?? 0

  const preLoyaltyTotal = subtotal + deliveryFee
  
  // Limite de points: on ne peut utiliser que ce qu'on a, et on ne peut pas dépasser config.maxPerc % du total
  const maxAllowedPoints = loyaltyData?.config?.maxPerc 
    ? Math.floor((preLoyaltyTotal * loyaltyData.config.maxPerc) / 100) 
    : 0
  
  const finalRedeem = Math.min(redeemPoints, maxAllowedPoints, loyaltyData?.account?.balance || 0, preLoyaltyTotal)
  const loyaltyDiscount = finalRedeem > 0 ? finalRedeem : 0
  
  const total = Math.max(0, preLoyaltyTotal - loyaltyDiscount)

  // 🔴 YAYYAM BUSINESS LOGIC : The commission is taken on the full total (Product + Delivery) 
  const commissionRate = vendorPlan === 'pro' ? 0.06 : 0.08
  const platformFee    = Math.round(total * commissionRate)
  
  const vendorAmount   = total - platformFee

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

  // ── Sauvetage Panier Abandonné ──────────────────────────────────
  const reportAbandonedCart = () => {
    if (!phone || phone.trim().length < 8) return
    fetch('/api/checkout/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        store_id: product.store.id,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone
      })
    }).catch() // silently fail
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
      // ── Lecture du Token d'Affiliation & Sub-ID ──
      const refMatch = document.cookie.match(/(?:^|; )yayyam_affiliate_ref=([^;]*)/)
      const affiliateToken = refMatch ? decodeURIComponent(refMatch[1]) : null

      const subidMatch = document.cookie.match(/(?:^|; )yayyam_affiliate_subid=([^;]*)/)
      const affiliateSubid = subidMatch ? decodeURIComponent(subidMatch[1]) : null

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
        loyalty_discount: loyaltyDiscount,
        redeemed_points:  finalRedeem,
        platform_fee:     platformFee,
        vendor_amount:    vendorAmount,
        total,
        applied_promo_id: appliedPromo?.id || null,
        affiliate_token:  affiliateToken,
        affiliate_subid:  affiliateSubid,
        booking_date:     selectedDate || null,
        booking_start_time: selectedSlotStr ? selectedSlotStr.split('-')[0] : null,
        booking_end_time:   selectedSlotStr ? selectedSlotStr.split('-')[1] : null,
        bump_product_id:  bumpAccepted && bumpProduct ? bumpProduct.id : null,
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
        cod?: boolean
        oto?: boolean
        oto_url?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la commande.')
        setLoading(false)
        return
      }

      // COD → confirmation directe ou redirection OTO Upsell
      if (useCOD) {
        if (data.oto && data.oto_url) {
          router.push(data.oto_url)
        } else {
          router.push(`/checkout/success?order=${data.order_id}&cod=true`)
        }
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
            <img src={product.store.logo_url} alt={product.store.name || "Logo boutique"} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] text-[var(--accent)]">
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
            <span>{(basePrice * quantity).toLocaleString('fr-FR')} F</span>
          </div>
          {volumeDiscountAmount > 0 && (
            <div className="flex justify-between text-sm font-bold pt-1 text-[var(--accent)]">
              <span>Volume Discount (B2B)</span>
              <span>-{Math.round(volumeDiscountAmount).toLocaleString('fr-FR')} F</span>
            </div>
          )}
          {bumpAccepted && bumpProduct && (
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>+ {bumpProduct.name}</span>
              <span>{bumpProduct.price.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          {appliedPromo && (
            <div className="flex justify-between text-sm font-bold pt-1 text-[var(--accent)]">
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
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-sm font-bold pt-1 text-orange-600">
              <span>Points Fidélité ({loyaltyDiscount})</span>
              <span>-{loyaltyDiscount.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-black">
            <span className="text-gray-700">Total</span>
            <span className="text-[var(--accent)]">{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        {/* Encart Fidélité */}
        {loyaltyData && loyaltyData.enabled && loyaltyData.account && loyaltyData.account.balance > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm text-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-orange-900 flex items-center gap-1.5">
                  <Trophy size={14} className="text-orange-600"/> 
                  Vos points fidélité
                </p>
                <p className="text-orange-800/80 text-[11px] font-medium mt-0.5">
                  Solde : {loyaltyData.account.balance} points ({loyaltyData.account.tier})
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <input
                type="number"
                title="Points à utiliser"
                aria-label="Points à utiliser"
                min="0"
                max={Math.min(loyaltyData.account?.balance || 0, maxAllowedPoints)}
                value={redeemPoints}
                onChange={e => setRedeemPoints(Math.min(Number(e.target.value), loyaltyData.account?.balance || 0, maxAllowedPoints))}
                className="w-20 px-2 py-1.5 text-sm font-bold border border-orange-200 outline-none rounded bg-white text-gray-800"
              />
              <button 
                type="button"
                onClick={() => setRedeemPoints(Math.min(loyaltyData.account?.balance || 0, maxAllowedPoints))}
                className="text-[10px] font-bold text-orange-600 bg-white border border-gray-100 px-2 py-1.5 rounded uppercase tracking-wide shadow-sm hover:bg-orange-600 hover:text-white transition"
              >
                Max ({Math.min(loyaltyData.account?.balance || 0, maxAllowedPoints)})
              </button>
            </div>
            <p className="text-[10px] text-orange-700 mt-2 font-medium">Vous économisez {loyaltyDiscount} FCFA sur cette commande (Max {loyaltyData.config?.maxPerc || 0}%).</p>
          </div>
        )}

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
          clientProfile={clientProfile}
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
          🔒 Sécurisé par YAYYAM
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
          <img src={product.store.logo_url} alt={product.store.name || "Logo boutique"} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] text-[var(--accent)]">
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
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] text-[var(--accent)]">
                Offre spéciale
              </span>
              <span className="text-sm text-gray-400 line-through">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          )}

          <p className="text-2xl font-extrabold pt-1 text-[var(--accent)]">
            {baseProductPrice.toLocaleString('fr-FR')}{' '}
            <span className="text-base font-medium opacity-60">
              FCFA{product.payment_type === 'recurring' ? getIntervalSuffix(product.recurring_interval) : ''}
            </span>
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
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${selectedVariant === v.id ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]" : v.stock === 0 ? "border-[#f1f1f1] bg-[#fafaf7] text-[#ccc] cursor-not-allowed" : "border-[#eee] text-[#666]"}`}
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

        {/* Quantité & Palier B2B */}
        {product.type === 'physical' && (
          <section className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800 text-sm">Quantité</h2>
              {volumeDiscountAmount > 0 && (
                <span className="text-[10px] sm:text-xs font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
                  Palier débloqué !
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 transition">−</button>
              <span className="text-lg font-bold text-gray-800 min-w-[2rem] text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 text-xl font-bold text-gray-600 hover:bg-gray-50 transition">+</button>
            </div>

            {/* Widget Volume Discounts B2B */}
            {product.store.volume_discounts_active && !!product.store.volume_discounts_config && (() => {
              const config = typeof product.store.volume_discounts_config === 'string' 
                ? JSON.parse(product.store.volume_discounts_config) 
                : product.store.volume_discounts_config
                
              if (config?.rules && config.rules.length > 0) {
                const sortedRules = [...config.rules].sort((a, b) => a.quantity - b.quantity)
                
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-black text-gray-800 mb-3">{config.title || "Achetez plus, économisez plus !"}</p>
                    <div className="flex flex-col gap-2">
                      {sortedRules.map((rule: { quantity: number; discountType: string; value: number }, idx: number) => {
                        const isUnlocked = quantity >= rule.quantity
                        return (
                          <div 
                            key={idx} 
                            onClick={() => setQuantity(rule.quantity)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isUnlocked ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02] shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isUnlocked ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-gray-300'}`}>
                                {isUnlocked && <span className="w-2 h-2 bg-white rounded-full"></span>}
                              </div>
                              <span className={`text-sm font-bold ${isUnlocked ? 'text-emerald-900' : 'text-gray-600'}`}>
                                Achetez {rule.quantity} articles
                              </span>
                            </div>
                            <span className={`text-sm font-black px-2 py-1 rounded-md ${isUnlocked ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-100 text-rose-600'}`}>
                              - {rule.discountType === 'percentage' ? `${rule.value}%` : `${rule.value.toLocaleString('fr-FR')} F`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </section>
        )}

        {/* Coaching : Choix du créneau */}
        {product.type === 'coaching' && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Réserver votre session</h2>
            
            {product.coaching_durations && product.coaching_durations.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Durée de la session</label>
                <div className="flex flex-wrap gap-2">
                  {product.coaching_durations.map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => { setSelectedDuration(dur); setSelectedSlotStr(''); }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${selectedDuration === dur ? "text-white border-transparent bg-[var(--accent)]" : "text-gray-600 bg-white hover:bg-gray-50 border-gray-200"}`}
                    >
                      {dur >= 60 ? `${Math.floor(dur/60)}h${dur%60 ? dur%60 : ''}` : `${dur} min`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="selectedDate" className="block text-xs font-medium text-gray-500 mb-1">Sélectionnez une date <span className="text-red-500">*</span></label>
              <input
                id="selectedDate"
                title="Sélectionnez une date"
                type="date"
                min={new Date(Date.now() + (product.store.coaching_min_notice || 0) * 3600000).toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedSlotStr('') // reset time
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition appearance-none ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Créneaux horaires disponibles <span className="text-red-500">*</span></label>
                <p className="text-[11px] text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-start gap-1">
                  <span className="text-sm">🌍</span>
                  <span>Les horaires sont affichés à l'heure du vendeur (GMT). 
                  {userTz && <strong> Votre fuseau : {userTz}</strong>}</span>
                </p>
                {(() => {
                  const dateObj = new Date(selectedDate)
                  // getDay(): 0=Dimanche, 1=Lundi -> Notre DB: 0=Lundi, 6=Dimanche
                  const dayOfWeek = (dateObj.getDay() + 6) % 7
                  const baseAvailableSlots = coachingSlots.filter(s => s.day_of_week === dayOfWeek && s.active)

                  // Check if the entire day or specific hours are blocked
                  const dayBlocks = blockedDates.filter(b => {
                    const blockDateStr = new Date(b.date).toISOString().split('T')[0]
                    return blockDateStr === selectedDate
                  })
                  
                  const isSlotBlocked = (slot: { start_time: string, end_time: string }) => {
                    for (const block of dayBlocks) {
                      if (!block.start_time || !block.end_time) {
                        return true // The entire day is blocked!
                      }
                      // A slot [s1, e1] overlaps with block [s2, e2] if: s1 < e2 && e1 > s2
                      if (slot.start_time < block.end_time && slot.end_time > block.start_time) {
                        return true
                      }
                    }
                    return false
                  }
                  
                  const availableSlots = baseAvailableSlots.filter(s => !isSlotBlocked(s))

                  if (availableSlots.length === 0) {
                    return <p className="text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-xl text-center">Aucune disponibilité pour ce jour.</p>
                  }

                  const maxBookings = product.store.coaching_max_per_day || 0;
                  const dayBookings = Object.entries(bookedSlots).filter(([key]) => key.startsWith(selectedDate + '|')).reduce((acc, [_, val]) => acc + val, 0);
                  if (maxBookings > 0 && dayBookings >= maxBookings) {
                    return <p className="text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-xl text-center">Cette journée est complète ({maxBookings} session(s) max par jour).</p>
                  }

                  const timeToMins = (t: string) => {
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                  }

                  const finalSlots: { start: string, end: string, originalSlots: { start_time: string, end_time: string }[] }[] = [];
                  const sortedSlots = [...availableSlots].sort((a,b) => timeToMins(a.start_time) - timeToMins(b.start_time));
                  
                  sortedSlots.forEach((slot, index) => {
                    let currentDur = timeToMins(slot.end_time) - timeToMins(slot.start_time);
                    const originalSlots = [slot];
                    let endTime = slot.end_time;
                    let i = index + 1;
                    
                    while (currentDur < selectedDuration && i < sortedSlots.length) {
                      const nextSlot = sortedSlots[i];
                      if (nextSlot.start_time === endTime) {
                        currentDur += timeToMins(nextSlot.end_time) - timeToMins(nextSlot.start_time);
                        endTime = nextSlot.end_time;
                        originalSlots.push(nextSlot);
                        i++;
                      } else {
                        break;
                      }
                    }
                    
                    if (currentDur >= selectedDuration) {
                      const startMins = timeToMins(slot.start_time);
                      const finalMins = startMins + selectedDuration;
                      const finalH = Math.floor(finalMins / 60).toString().padStart(2, '0');
                      const finalM = (finalMins % 60).toString().padStart(2, '0');
                      const finalEndStr = `${finalH}:${finalM}`;
                      
                      const finalSlotValue = `${slot.start_time}-${finalEndStr}`;
                      if (!finalSlots.find(s => `${s.start}-${s.end}` === finalSlotValue)) {
                         finalSlots.push({ start: slot.start_time, end: finalEndStr, originalSlots });
                      }
                    }
                  });

                  if (finalSlots.length === 0) {
                     return <p className="text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-xl text-center">Aucun créneau continu d'une durée de {selectedDuration >= 60 ? Math.floor(selectedDuration/60)+'h'+(selectedDuration%60 || '') : selectedDuration+' min'} n'est disponible.</p>
                  }

                  return (
                    <div className="grid grid-cols-2 gap-2">
                       {finalSlots.map((combo, i) => {
                         const slotValue = `${combo.start}-${combo.end}`;
                         const isSelected = selectedSlotStr === slotValue;
                         
                         const maxAllowed = product.coaching_type === 'group' ? (product.max_participants || 10) : 1;
                         const isFull = combo.originalSlots.some(s => {
                            const slotKey = `${selectedDate}|${s.start_time}-${s.end_time}`;
                            const currentBookings = bookedSlots[slotKey] || 0;
                            return currentBookings >= maxAllowed;
                         });

                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isFull && !isSelected}
                            onClick={() => setSelectedSlotStr(slotValue)}
                            className={`py-2.5 px-2 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center ${isFull && !isSelected ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-100' : isSelected ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border-[var(--accent)] text-[var(--accent)]' : 'border-gray-200 text-gray-700 bg-white'}`}
                          >
                            {combo.start} - {combo.end} {isFull && !isSelected ? '(Complet)' : ''}
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
                onBlur={reportAbandonedCart}
                placeholder="Votre nom"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
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
                onBlur={reportAbandonedCart}
                placeholder="votre@email.com (pour recevoir le reçu)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Téléphone WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              onBlur={reportAbandonedCart}
              placeholder="+221 77 ..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
            />
          </div>

          {product.type === 'physical' && (
            <div className="space-y-4">
              {deliveryZones && deliveryZones.length > 0 && (
                <div>
                  <label htmlFor="selectedZone" className="text-xs text-gray-500 font-medium mb-1 block">
                    Zone de livraison <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="selectedZone"
                    title="Sélectionnez votre zone de livraison"
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-800 focus:ring-2 outline-none text-sm transition appearance-none ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
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

                {/* Sélecteur d'adresses sauvegardées */}
                {savedAddresses.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vos adresses enregistrées</p>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((sa) => {
                        const isSelected = selectedSavedAddr === sa.label
                        const iconMap: Record<string, React.ReactNode> = {
                          'Domicile': <Home size={13} />,
                          'Bureau': <Briefcase size={13} />,
                          'Autre': <MapPinned size={13} />,
                        }
                        return (
                          <button
                            key={sa.label}
                            type="button"
                            onClick={() => handleSelectSavedAddress(sa)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {iconMap[sa.label] || <MapPinned size={13} />}
                            {sa.label}
                            {sa.is_default && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-black">★</span>}
                            {isSelected && <span className="text-[var(--accent)] ml-0.5">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setSelectedSavedAddr(null) }}
                  placeholder="Quartier, ville..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-28 text-gray-800 placeholder:text-gray-400 focus:ring-2 outline-none text-sm transition ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 font-bold italic bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)]"
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
              <div className="flex items-center justify-between p-3 rounded-xl border bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] border-[color-mix(in_srgb,var(--accent)_11%,transparent)]">
                <div>
                  <p className="text-sm font-bold text-[var(--accent)]">{appliedPromo.code}</p>
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
                  className="flex-1 uppercase font-mono px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm transition ring-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCodeInput.trim()}
                  className="text-white px-4 rounded-xl text-sm font-black transition disabled:opacity-30 bg-[var(--accent)]"
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
          <section className="rounded-2xl border p-4 bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] border-[color-mix(in_srgb,var(--accent)_11%,transparent)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">💵 Paiement à la livraison</p>
                <p className="text-[10px] text-gray-500">Payez une fois le colis reçu</p>
              </div>
              <div
                onClick={() => setUseCOD(v => !v)}
                className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${useCOD ? "bg-[var(--accent)]" : "bg-[#eee]"}`}
              >
                <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useCOD ? 'left-7' : 'left-1.5'}`} />
              </div>
            </div>
            {codWarning && !codBlocked && (
              <p className="text-[10px] text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-2 font-medium border border-orange-100">
                ⚠️ {codWarning}
              </p>
            )}
          </section>
        )}

        {/* COD Blocked Warning */}
        {codBlocked && product.cash_on_delivery && (
          <section className="rounded-2xl border border-red-200 p-4 bg-red-50">
            <p className="text-sm font-bold text-red-700">🚫 Paiement à la livraison indisponible</p>
            <p className="text-[10px] text-red-600 mt-1">
              {codWarning || 'Le paiement à la livraison n\'est pas disponible pour ce numéro. Veuillez payer en ligne.'}
            </p>
          </section>
        )}

        {/* ORDER BUMP - OFFRE ADDITIONNELLE 🚀 */}
        {bumpProduct && product.bump_active && (
          <section 
            className={`rounded-2xl border-2 p-4 md:p-5 relative overflow-hidden transition-all duration-300 ${bumpAccepted ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] shadow-[0_4px_20px_-5px_color-mix(in_srgb,var(--accent)_40%,transparent)]' : 'border-[#f1f1f1] bg-white'}`}
          >
            {/* Liseré indicateur (optionnel, pour faire premium) */}
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[var(--accent)]" />

            <div className="flex items-start gap-4">
              {/* Image du produit bump */}
              {bumpProduct.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={bumpProduct.images[0]} 
                  alt={bumpProduct.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🎁</span>
                </div>
              )}

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base pr-4 leading-tight">
                    {product.bump_offer_text || "Profitez de cette offre exclusive !"}
                  </h3>
                  
                  {/* Checkbox "Je veux" */}
                  <label className="flex items-center cursor-pointer shrink-0 mt-1">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={bumpAccepted}
                        onChange={() => setBumpAccepted(!bumpAccepted)}
                      />
                      <div className={`block w-6 h-6 rounded border-2 transition-colors ${bumpAccepted ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-gray-300 bg-transparent'}`}>
                        {bumpAccepted && (
                          <svg className="w-4 h-4 text-white mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  <span className="font-bold text-gray-700">{bumpProduct.name}</span>
                </p>
                <p className="text-sm font-black mt-2 inline-flex items-center px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)]">
                  + {bumpProduct.price.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Récapitulatif */}
        <div className="mt-8">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <p className="text-xs md:text-sm font-medium text-red-800">
              <span className="font-bold">🔥 Forte demande :</span> {activeViewers} personnes consultent ce produit actuellement.
            </p>
          </div>
          {variant?.stock !== undefined ? (
            <p className="text-[11px] md:text-xs text-amber-700 font-bold mb-4 text-center">
               ⏳ Il ne reste que {variant.stock > 0 ? variant.stock : 3} exemplaires disponibles
            </p>
          ) : (
            <p className="text-[11px] md:text-xs text-amber-700 font-bold mb-4 text-center">
               ⏳ Il ne reste que 3 exemplaires disponibles
            </p>
          )}
        </div>

        <section className="bg-gray-50 rounded-2xl shadow-sm p-5 space-y-3 border-2 border-dashed border-gray-200">
          <h2 className="font-extrabold text-gray-800 text-lg mb-4 text-center">Récapitulatif de votre commande</h2>
          
          <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
            <span>Détails</span>
            <span>Prix</span>
          </div>
          <div className="flex justify-between text-base font-medium text-gray-700">
            <span>{product.name} × {quantity}</span>
            <span>{(basePrice * quantity).toLocaleString('fr-FR')} F</span>
          </div>
          {bumpAccepted && bumpProduct && (
            <div className="flex justify-between text-sm text-gray-700 pb-1">
              <span>+ {bumpProduct.name}</span>
              <span>{bumpProduct.price.toLocaleString('fr-FR')} F</span>
            </div>
          )}
          {appliedPromo && (
            <div className="flex justify-between text-sm font-bold pt-1 text-[var(--accent)]">
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
            <span className="text-xl text-[var(--accent)]">{total.toLocaleString('fr-FR')} <span className="text-xs opacity-50">FCFA</span></span>
          </div>
        </section>

        {/* Boutons */}
        <button
          type="submit" disabled={loading}
          className="w-full text-white font-black py-4 rounded-2xl transition text-base shadow-xl uppercase bg-[var(--accent)] disabled:opacity-50"
        >
          {loading
            ? 'CHARGEMENT...'
            : useCOD
              ? 'COMMANDER SANS PAYER'
              : product.payment_type === 'recurring'
                ? "S'ABONNER MAINTENANT"
                : `CONTINUER → PAIEMENT`}
        </button>

        {/* Badges de Paiement Sécurisé Ouest-Africains */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            GARANTIE ACHETEUR YAYYAM
          </p>
          <LocalPaymentBadges />
          <p className="text-center text-[10px] text-gray-400 font-medium mt-4">
            Vos fonds sont sécurisés par nos partenaires jusqu'à la livraison.
          </p>
        </div>
      </form>
    </div>
  )
}
