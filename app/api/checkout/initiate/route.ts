import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmOrder } from '@/lib/payments/confirmOrder'
import { prisma } from '@/lib/prisma'
import {
  resolveOrderCommission,
  canAcceptCOD,
} from '@/lib/commission/commission-service'
import { notifyNewOrder } from '@/lib/notifications/createNotification'

// ── Helpers calcul ────────────────────────────────────────────────
function roundTo5(amount: number): number {
  return Math.ceil(amount / 5) * 5
}

// ── CinetPay ─────────────────────────────────────────────────────
async function initiateCinetPay(params: {
  amount: number
  orderId: string
  buyerName: string
  buyerPhone: string
  productName: string
  returnUrl: string
  notifyUrl: string
}) {
  const apiKey  = process.env.CINETPAY_API_KEY!
  const siteId  = process.env.CINETPAY_SITE_ID!
  const amount  = roundTo5(params.amount) // CinetPay: multiple de 5

  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey:           apiKey,
      site_id:          siteId,
      transaction_id:   params.orderId,
      amount:           amount,
      currency:         'XOF',
      description:      params.productName,
      return_url:       params.returnUrl,
      notify_url:       params.notifyUrl,
      customer_name:    params.buyerName.split(' ')[0],
      customer_surname: params.buyerName.split(' ').slice(1).join(' ') || '-',
      customer_phone_number: params.buyerPhone,
    }),
  })

  const data = await res.json()
  if (data.code !== '201') {
    throw new Error('CinetPay: ' + (data.message ?? 'Erreur inconnue'))
  }
  return data.data.payment_url as string
}

// ── PayTech ───────────────────────────────────────────────────────
async function initiatePayTech(params: {
  amount: number
  orderId: string
  productName: string
  returnUrl: string
  notifyUrl: string
}) {
  const apiKey    = process.env.PAYTECH_API_KEY!
  const apiSecret = process.env.PAYTECH_API_SECRET!

  const res = await fetch('https://paytech.sn/api/payment/request-payment', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'API_KEY':       apiKey,
      'API_SECRET':    apiSecret,
    },
    body: JSON.stringify({
      item_name:       params.productName,
      item_price:      String(Math.round(params.amount)),
      currency:        'XOF',
      ref_command:     params.orderId,
      ipn_url:         params.notifyUrl,
      success_url:     params.returnUrl,
      cancel_url:      params.returnUrl + '&cancelled=true',
      env:             process.env.NODE_ENV === 'production' ? 'prod' : 'test',
    }),
  })

  const data = await res.json()
  if (data.success !== 1) {
    throw new Error('PayTech: ' + (data.errors?.[0] ?? 'Erreur inconnue'))
  }
  return data.redirect_url as string
}

// ── Wave ──────────────────────────────────────────────────────────
async function initiateWave(params: {
  amount: number
  orderId: string
  productName: string
  successUrl: string
  errorUrl: string
}) {
  const apiKey = process.env.WAVE_API_KEY!

  const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount:      String(Math.round(params.amount)),
      currency:    'XOF',
      error_url:   params.errorUrl,
      success_url: params.successUrl,
      client_reference: params.orderId,
    }),
  })

  const data = await res.json()
  if (!data.wave_launch_url) {
    throw new Error('Wave: ' + (data.message ?? 'Erreur inconnue'))
  }
  return data.wave_launch_url as string
}

// ── Handler principal ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Récupération sécurisée du body (une seule fois)
    const bodyText = await req.text()
    if (!bodyText) {
      return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    }
    const body = JSON.parse(bodyText) as Record<string, unknown>
    console.log('[API Checkout] Body reçu:', body)

    const {
      product_id,
      store_id,
      variant_id,
      quantity,
      buyer_name,
      buyer_phone,
      delivery_address,
      delivery_zone_id,
      delivery_fee,
      payment_method,
      subtotal,
      promo_discount,
      total,
      applied_promo_id,
      booking_date,
      booking_start_time,
      booking_end_time,
      simulate,
    } = body as {
      product_id:       string
      store_id:         string
      variant_id?:      string | null
      quantity:         number
      buyer_name:       string
      buyer_phone:      string
      delivery_address?: string | null
      delivery_zone_id?: string | null
      delivery_fee?:    number
      payment_method:   string
      subtotal:         number
      promo_discount?:  number
      total:            number
      applied_promo_id?: string | null
      booking_date?:    string | null
      booking_start_time?: string | null
      booking_end_time?:   string | null
      simulate?:        boolean
    }

    // ── Validation des champs obligatoires ────────────────────────
    if (!product_id)    return NextResponse.json({ error: 'product_id manquant.' }, { status: 400 })
    if (!store_id)      return NextResponse.json({ error: 'store_id manquant.' }, { status: 400 })
    if (!buyer_name && !simulate) return NextResponse.json({ error: 'buyer_name manquant.' }, { status: 400 })
    if (!buyer_phone)   return NextResponse.json({ error: 'buyer_phone manquant.' }, { status: 400 })
    if (!payment_method) return NextResponse.json({ error: 'payment_method manquant.' }, { status: 400 })

    const supabase = await createClient()

    // ── CONFIGURATION STORE (Closing) ─────────────────────────────
    const { data: storeData } = await supabase
      .from('Store')
      .select('closing_enabled, closing_fee')
      .eq('id', store_id)
      .single()
    const closingEnabled = storeData?.closing_enabled ?? false
    const closingFee = storeData?.closing_fee ?? 500
    const requiresClosing = closingEnabled && payment_method === 'cod'

    // ── CALCUL COMMISSION DÉGRESSIVE ──────────────────────────────
    const productBase = Math.max(0, subtotal - (promo_discount ?? 0))
    const { platformFee: finalPlatformFee, deliveryCommission: finalDeliveryCommission, vendorAmount: finalVendorAmount } =
      await resolveOrderCommission(store_id, productBase, delivery_fee ?? 0, payment_method)

    console.log(
      `[Checkout] Commission calculée : PF=${finalPlatformFee} DC=${finalDeliveryCommission} (method: ${payment_method})`
    )

    // ── VÉRIFICATION COD ──────────────────────────────────────────
    if (payment_method === 'cod') {
      // 1. Vérifier que le produit est bien physique
      const { data: productData, error: productErr } = await supabase
        .from('Product')
        .select('name, type')
        .eq('id', product_id)
        .single()

      if (productErr || !productData) {
        return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
      }
      if ((productData as { type: string }).type !== 'physical') {
        return NextResponse.json(
          { error: 'Le paiement à la livraison est uniquement disponible pour les produits physiques.' },
          { status: 400 }
        )
      }

      // 2. Vérifier que le wallet du vendeur couvre la commission COD (5%) + Frais de closing si applicable
      const feeToFreeze = requiresClosing ? closingFee : 0
      const { canAccept, walletBalance, commissionDue } = await canAcceptCOD(store_id, total, feeToFreeze)

      if (!canAccept) {
        return NextResponse.json(
          {
            error: `Solde wallet insuffisant pour garantir cette commande COD. Requis : ${commissionDue.toLocaleString('fr-FR')} FCFA — Actuel : ${walletBalance.toLocaleString('fr-FR')} FCFA.`,
            required: commissionDue,
            current:  walletBalance,
          },
          { status: 402 }
        )
      }

      // 3. Geler la commission dans le wallet du vendeur (atomique via RPC)
      const { error: freezeErr } = await supabase
        .rpc('freeze_commission', {
          p_vendor_id:  store_id,
          p_commission: commissionDue,
        })

      if (freezeErr) {
        return NextResponse.json(
          { error: 'Erreur lors du gel de la commission COD.' },
          { status: 500 }
        )
      }

      console.log(`[Checkout COD] Commission gelée : ${commissionDue} FCFA pour boutique ${store_id}`)
    }
    // ── FIN VÉRIFICATION COD ──────────────────────────────────────

    // 1. Créer la commande en BDD (statut pending) via Prisma
    interface OrderRecord { id: string }
    let orderRecord: OrderRecord | null = null
    try {
      orderRecord = await prisma.order.create({
        data: {
          product_id,
          store_id,
          variant_id:       variant_id ?? null,
          quantity,
          buyer_name:       buyer_name ?? (simulate ? 'Client Simulation' : ''),
          buyer_phone,
          delivery_address: delivery_address ?? null,
          delivery_zone_id: delivery_zone_id ?? null,
          delivery_fee:     delivery_fee ?? 0,
          payment_method,
          subtotal,
          promo_discount:   promo_discount ?? 0,
          platform_fee:     finalPlatformFee,
          delivery_commission: finalDeliveryCommission,
          vendor_amount:    finalVendorAmount,
          total,
          applied_promo_id: applied_promo_id ?? null,
          status:           requiresClosing ? 'cod_pending_confirmation' : 'pending',
          ...(booking_date && booking_start_time && booking_end_time && {
            booking: {
              create: {
                store_id,
                product_id,
                booking_date: new Date(booking_date),
                start_time: booking_start_time,
                end_time: booking_end_time,
              }
            }
          }),
          ...(requiresClosing && {
            closing: {
              create: {
                store_id,
                closing_fee: closingFee,
                status: 'PENDING'
              }
            }
          }),
        },
      })
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      return NextResponse.json({ error: 'Erreur création commande: ' + msg }, { status: 500 })
    }

    // Incrémenter le compteur du code promo si appliqué (atomique via RPC)
    if (applied_promo_id) {
      await supabase.rpc('increment_promo_uses', {
        p_promo_id: applied_promo_id,
        delta: 1,
      })
    }

    // ── MODE SIMULATION (DEV ONLY) ────────────────────────────────
    if (simulate && process.env.NODE_ENV === 'development') {
      await confirmOrder(orderRecord.id, 'SIMULATED-PAYMENT-' + Date.now())
      return NextResponse.json({ order_id: orderRecord.id, simulated: true })
    }

    // 2. COD → retourner l'ID de commande directement
    if (payment_method === 'cod') {
      // Pour retrouver le nom du produit, on refait une mini-requête car productData n'est dispo que dans le bloc COD au-dessus
      const { data: pData } = await supabase.from('Product').select('name').eq('id', product_id).single()
      const pName = pData?.name || 'Produit'
      const city = delivery_address?.split(',')[1]?.trim() || null

      notifyNewOrder({
        userId:        store_id, // L'ID du store est utilisé comme userId dans notifyNewOrder ou c'est l'UUID du owner ?
        productName:   pName,
        buyerName:     buyer_name ?? (simulate ? 'Client Simulation' : ''),
        amount:        total,
        orderId:       orderRecord.id,
        paymentMethod: 'cod',
        city:          city,
      }).catch(e => console.error('[Notification COD]', e))

      return NextResponse.json({ order_id: orderRecord.id, cod: true })
    }

    // 3. Paiement en ligne → générer URL de paiement
    const baseUrl   = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const returnUrl = `${baseUrl}/checkout/success?order=${orderRecord.id}`
    const notifyUrlBase = `${baseUrl}/api/checkout/ipn`

    let paymentUrl: string

    if (payment_method === 'cinetpay') {
      paymentUrl = await initiateCinetPay({
        amount:      total,
        orderId:     orderRecord.id,
        buyerName:   buyer_name,
        buyerPhone:  buyer_phone,
        productName: product_id,
        returnUrl,
        notifyUrl:   `${notifyUrlBase}/cinetpay`,
      })
    } else if (payment_method === 'paytech') {
      paymentUrl = await initiatePayTech({
        amount:      total,
        orderId:     orderRecord.id,
        productName: product_id,
        returnUrl,
        notifyUrl:   `${notifyUrlBase}/paytech`,
      })
    } else if (payment_method === 'wave') {
      paymentUrl = await initiateWave({
        amount:      total,
        orderId:     orderRecord.id,
        productName: product_id,
        successUrl:  returnUrl,
        errorUrl:    `${baseUrl}/checkout/${product_id}?error=true`,
      })
    } else {
      return NextResponse.json({ error: 'Méthode de paiement invalide.' }, { status: 400 })
    }

    return NextResponse.json({ order_id: orderRecord.id, payment_url: paymentUrl })
  } catch (error: unknown) {
    console.error('[CHECKOUT FATAL ERROR]:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
