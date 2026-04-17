import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  calculateFees,
  calculateVendorAmount,
  type PaymentMethod
} from '@/lib/payments/payment-service'
import { createPaymentSession, PaymentRequestPayload } from '@/lib/payments/routing'

const VALID_METHODS: PaymentMethod[] = ['wave', 'bictorys', 'paytech', 'cinetpay', 'moneroo']

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 })
  }

  const { storeId, amount, method, customerPhone } = body

  if (!storeId || !amount || !method) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  if (amount < 100) {
    return NextResponse.json({ error: 'Le montant minimum est de 100 FCFA' }, { status: 400 })
  }

  if (!VALID_METHODS.includes(method as PaymentMethod)) {
    return NextResponse.json({ error: 'Méthode non valide' }, { status: 400 })
  }

  // 1. Trouver le Wallet du vendeur (storeId)
  const wallet = await prisma.wallet.findUnique({
    where: { vendor_id: storeId },
    select: { id: true }
  })

  if (!wallet) {
    return NextResponse.json({ error: 'Portefeuille du vendeur introuvable' }, { status: 404 })
  }

  // 2. Créer la Transaction en "pending" pour le Tips
  let transaction;
  try {
    transaction = await prisma.transaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'tip', // Utilise un type unique pour le repérer
        amount: amount,
        status: 'pending',
        label: JSON.stringify({ description: 'Don reçu (Tip)', method })
      },
      select: { id: true }
    })
  } catch (txError) {
    console.error('Erreur création transaction tip:', txError)
    return NextResponse.json({ error: 'Erreur interne lors de la création du transfert' }, { status: 500 })
  }

  // 3. Calculer les montants
  const fees = calculateFees(amount, method as PaymentMethod)
  const vendorAmount = calculateVendorAmount(amount, method as PaymentMethod)

  // 4. Préparer l'Intent de paiement
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'
  
  const webhookMap: Record<string, string> = {
    wave: '/api/webhooks/wave',
    bictorys: '/api/webhooks/bictorys',
    paytech: '/api/webhooks/paytech',
    cinetpay: '/api/webhooks/cinetpay',
    moneroo: '/api/webhooks/moneroo',
  }
  const webhookPath = webhookMap[method as string] ?? '/api/webhooks/wave'

  const payload: PaymentRequestPayload = {
    amount: amount,
    currency: 'XOF',
    orderId: 'TIP_' + transaction.id,
    method: method as any,
    customer: {
      name: 'Donateur',
      phone: customerPhone || '770000000'
    },
    description: 'Don / Pourboire',
    returnUrl: `${baseUrl}/checkout/success?tip=true`,
    notifyUrl: `${baseUrl}${webhookPath}`,
    env: 'prod'
  }

  // 5. Appeler la passerelle intelligente
  try {
    const session = await createPaymentSession(payload)
    if (!session.success || !session.paymentUrl) {
      throw new Error(session.error || 'Impossible de générer le lien de paiement')
    }
    return NextResponse.json({ checkoutUrl: session.paymentUrl, fees, vendorAmount }, { status: 200 })
  } catch (err: any) {
    console.error('Tip Payment Gateway Error:', err)
    // En production, on masque l'erreur technique derrière un message doux pour l'utilisateur
    const isDev = process.env.NODE_ENV === 'development'
    const userMessage = "Ce moyen de paiement est momentanément indisponible. Veuillez réessayer avec une autre méthode."
    return NextResponse.json({ error: isDev ? (err.message || userMessage) : userMessage }, { status: 500 })
  }
}
