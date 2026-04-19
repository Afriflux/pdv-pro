import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validate, paymentInitiateSchema } from '@/lib/validation'
import {
  calculateFees,
  calculateVendorAmount,
  initiateWavePayment,
  initiateCardPayment,
  initiateBictorysPayment,
  initiateMonerooPayment,
  type PaymentMethod,
  type PaymentIntent,
} from '@/lib/payments/payment-service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitiateBody {
  orderId: string
  method: PaymentMethod
  customerPhone?: string
  customerEmail?: string
}

interface OrderRow {
  id: string
  total: number
  status: string
  store_id: string
  buyer_phone: string | null
  buyer_email: string | null
}

// ─── Validation méthode ───────────────────────────────────────────────────────

const VALID_METHODS: PaymentMethod[] = ['wave', 'bictorys', 'paytech', 'cinetpay', 'moneroo']

function isValidMethod(value: unknown): value is PaymentMethod {
  return VALID_METHODS.includes(value as PaymentMethod)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Auth — vérifier la session utilisateur
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 2. Parser et valider le body
  let body: Partial<InitiateBody>
  try {
    body = (await req.json()) as Partial<InitiateBody>
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 })
  }

  // Validation structurée
  const validationResult = validate(body, paymentInitiateSchema)
  if (!validationResult.success) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 })
  }

  const { orderId, method, customerPhone, customerEmail } = body

  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'orderId manquant ou invalide' }, { status: 400 })
  }

  if (!isValidMethod(method)) {
    return NextResponse.json(
      { error: `Méthode de paiement invalide. Valeurs acceptées : ${VALID_METHODS.join(', ')}` },
      { status: 400 }
    )
  }

  // 3. Récupérer la commande via Admin (bypass RLS)
  const supabaseAdmin = createAdminClient()

  const { data: orderRaw, error: orderError } = await supabaseAdmin
    .from('Order')
    .select('id, total, status, store_id, buyer_phone, buyer_email')
    .eq('id', orderId)
    .single()

  if (orderError || !orderRaw) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  }

  const order = orderRaw as OrderRow

  // 4. Vérifier que la commande est bien en attente de paiement
  if (order.status !== 'pending') {
    return NextResponse.json(
      { error: 'Commande déjà traitée', currentStatus: order.status },
      { status: 400 }
    )
  }

  // 5. Calculer les frais et le montant vendeur
  const fees = calculateFees(order.total, method)
  const vendorAmount = calculateVendorAmount(order.total, method)

  // 6. Mettre à jour la commande avec la méthode et le montant vendeur
  const { error: updateError } = await supabaseAdmin
    .from('Order')
    .update({
      payment_method: method,
      vendor_amount: vendorAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('[payments/initiate] Erreur mise à jour Order:', updateError.message)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }

  // 7. Construire le PaymentIntent
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'

  // Détermine le chemin webhook selon la méthode (routes canoniques dans /api/webhooks/)
  const webhookMap: Record<string, string> = {
    wave: '/api/webhooks/wave',
    bictorys: '/api/webhooks/bictorys',
    paytech: '/api/webhooks/paytech',
    cinetpay: '/api/webhooks/cinetpay',
    moneroo: '/api/webhooks/moneroo',
  }
  const webhookPath = webhookMap[method] ?? '/api/webhooks/wave'

  const intent: PaymentIntent = {
    orderId: order.id,
    amount: order.total,
    method,
    vendorAmount,
    fees,
    currency: 'XOF',
    customerPhone: customerPhone ?? order.buyer_phone ?? undefined,
    customerEmail: customerEmail ?? order.buyer_email ?? undefined,
    redirectUrl: `${baseUrl}/checkout/success?order=${order.id}`,
    webhookUrl: `${baseUrl}${webhookPath}`,
  }

  // 8. Router vers la bonne passerelle et retourner le résultat
  try {
    let checkoutUrl: string = ''

    switch (method) {
      case 'wave': {
        const result = await initiateWavePayment(intent)
        checkoutUrl = result.checkoutUrl
        break
      }
      case 'cinetpay': {
        const result = await initiateCardPayment(intent)
        checkoutUrl = result.checkoutUrl
        break
      }
      case 'paytech': {
        // Route via le Smart Router (qui appelle la vraie API PayTech)
        const { createPaymentSession } = await import('@/lib/payments/routing')
        const result = await createPaymentSession({
          amount: order.total,
          currency: 'XOF',
          orderId: order.id,
          method: 'paytech',
          customer: { name: 'Client', phone: intent.customerPhone || '770000000' },
          description: `Commande Yayyam #${order.id}`,
          returnUrl: intent.redirectUrl,
          notifyUrl: intent.webhookUrl,
          env: process.env.NODE_ENV === 'production' ? 'prod' : 'test'
        })
        if (!result.success || !result.paymentUrl) throw new Error(result.error || 'PayTech Error')
        checkoutUrl = result.paymentUrl
        break
      }
      case 'bictorys': {
        const result = await initiateBictorysPayment(intent)
        checkoutUrl = result.checkoutUrl
        break
      }
      case 'moneroo': {
        const result = await initiateMonerooPayment(intent)
        checkoutUrl = result.checkoutUrl
        break
      }
      default:
        throw new Error('Méthode non implémentée')
    }

    return NextResponse.json({ checkoutUrl, fees, vendorAmount }, { status: 200 })
  } catch (error: unknown) {

    console.error('[payments/initiate] Erreur passerelle:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
