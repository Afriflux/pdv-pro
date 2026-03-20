import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  resolveOrderCommission,
  canAcceptCOD,
} from '@/lib/commission/commission-service'
import { notifyNewOrder } from '@/lib/notifications/createNotification'

function roundTo5(amount: number): number {
  return Math.ceil(amount / 5) * 5
}

async function initiateCinetPay(params: { amount: number, orderId: string, buyerName: string, buyerPhone: string, productName: string, returnUrl: string, notifyUrl: string }) {
  const apiKey = process.env.CINETPAY_API_KEY!
  const siteId = process.env.CINETPAY_SITE_ID!
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey, site_id: siteId, transaction_id: params.orderId,
      amount: roundTo5(params.amount), currency: 'XOF', description: params.productName,
      return_url: params.returnUrl, notify_url: params.notifyUrl,
      customer_name: params.buyerName.split(' ')[0],
      customer_surname: params.buyerName.split(' ').slice(1).join(' ') || '-',
      customer_phone_number: params.buyerPhone,
    }),
  })
  const data = await res.json()
  if (data.code !== '201') throw new Error('CinetPay: ' + (data.message ?? 'Erreur inconnue'))
  return data.data.payment_url as string
}

async function initiatePayTech(params: { amount: number, orderId: string, productName: string, returnUrl: string, notifyUrl: string }) {
  const apiKey = process.env.PAYTECH_API_KEY!
  const apiSecret = process.env.PAYTECH_API_SECRET!
  const res = await fetch('https://paytech.sn/api/payment/request-payment', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'API_KEY': apiKey, 'API_SECRET': apiSecret },
    body: JSON.stringify({
      item_name: params.productName, item_price: String(Math.round(params.amount)),
      currency: 'XOF', ref_command: params.orderId, ipn_url: params.notifyUrl,
      success_url: params.returnUrl, cancel_url: params.returnUrl + '&cancelled=true',
      env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
    }),
  })
  const data = await res.json()
  if (data.success !== 1) throw new Error('PayTech: ' + (data.errors?.[0] ?? 'Erreur inconnue'))
  return data.redirect_url as string
}

async function initiateWave(params: { amount: number, orderId: string, productName: string, successUrl: string, errorUrl: string }) {
  const apiKey = process.env.WAVE_API_KEY!
  const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      amount: String(Math.round(params.amount)), currency: 'XOF',
      error_url: params.errorUrl, success_url: params.successUrl, client_reference: params.orderId,
    }),
  })
  const data = await res.json()
  if (!data.wave_launch_url) throw new Error('Wave: ' + (data.message ?? 'Erreur inconnue'))
  return data.wave_launch_url as string
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    const body = JSON.parse(bodyText) as Record<string, any>

    const {
      product_id, store_id, variant_id, quantity = 1,
      buyer_name, buyer_phone, delivery_address, delivery_zone_id,
      payment_method, applied_promo_id,
      booking_date, booking_start_time, booking_end_time
    } = body

    if (!product_id || !store_id || !buyer_name || !buyer_phone || !payment_method) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // ── 1. VALIDATION SERVEUR DU PRODUIT & STOCK ──────────────────
    const product = await prisma.product.findUnique({ where: { id: product_id } })
    if (!product || !product.active || product.store_id !== store_id) {
      return NextResponse.json({ error: 'Produit introuvable ou inactif.' }, { status: 404 })
    }

    let basePrice = product.price
    if (variant_id) {
      const variantData = await prisma.productVariant.findUnique({ where: { id: variant_id } })
      if (!variantData || variantData.product_id !== product_id) {
        return NextResponse.json({ error: 'Variante introuvable.' }, { status: 404 })
      }
      if (variantData.stock < quantity) {
        return NextResponse.json({ error: 'Stock insuffisant pour cette option.' }, { status: 400 })
      }
      basePrice += variantData.price_adjust
    }

    const grossSubtotal = basePrice * quantity
    let promoDiscountAmount = 0

    // ── 2. VALIDATION SERVEUR DU CODE PROMO ───────────────────────
    if (applied_promo_id) {
      const promo = await prisma.promoCode.findUnique({ where: { id: applied_promo_id } })
      if (!promo || !promo.active || promo.store_id !== store_id) {
        return NextResponse.json({ error: 'Code promo invalide.' }, { status: 400 })
      }
      if (promo.expires_at && promo.expires_at < new Date()) {
        return NextResponse.json({ error: 'Code promo expiré.' }, { status: 400 })
      }
      if (promo.max_uses && promo.uses >= promo.max_uses) {
        return NextResponse.json({ error: 'Ce code a atteint sa limite d\'utilisation.' }, { status: 400 })
      }
      if (promo.min_order && grossSubtotal < promo.min_order) {
        return NextResponse.json({ error: `Minimum requis de ${promo.min_order} FCFA.` }, { status: 400 })
      }
      if (promo.product_ids && promo.product_ids.length > 0 && !promo.product_ids.includes(product_id)) {
        return NextResponse.json({ error: 'Non applicable sur ce produit.' }, { status: 400 })
      }

      if (promo.type === 'percentage') {
        promoDiscountAmount = (grossSubtotal * promo.value) / 100
      } else {
        promoDiscountAmount = promo.value
      }
      if (promoDiscountAmount > grossSubtotal) promoDiscountAmount = grossSubtotal
    }

    const subtotal = Math.max(0, grossSubtotal - promoDiscountAmount)

    // ── 3. VALIDATION TYPE DE PRODUIT & FRAIS DE LIVRAISON ────────
    let deliveryFee = 0
    if (product.type === 'physical') {
      if (payment_method !== 'cod' && !delivery_address) {
        return NextResponse.json({ error: 'Adresse de livraison requise.' }, { status: 400 })
      }
      if (delivery_zone_id) {
        const zone = await prisma.deliveryZone.findUnique({ where: { id: delivery_zone_id } })
        if (!zone || !zone.active || zone.store_id !== store_id) {
          return NextResponse.json({ error: 'Zone impossible.' }, { status: 400 })
        }
        deliveryFee = zone.fee
      }
    } else if (product.type === 'coaching') {
      if (!booking_date || !booking_start_time || !booking_end_time) {
        return NextResponse.json({ error: 'Informations de coaching manquantes.' }, { status: 400 })
      }
    }

    if (payment_method === 'cod' && product.type !== 'physical') {
      return NextResponse.json({ error: 'Le COD est réservé aux produits physiques.' }, { status: 400 })
    }

    const total = subtotal + deliveryFee

    // ── 4. COMMISSION PLATEFORME ──────────────────────────────────
    const storeRecord = await prisma.store.findUnique({
      where: { id: store_id },
      select: { closing_enabled: true, closing_fee: true }
    })
    
    const requiresClosing = storeRecord?.closing_enabled && payment_method === 'cod'
    const closingFee = storeRecord?.closing_fee ?? 500

    const { platformFee: finalPlatformFee, deliveryCommission: finalDeliveryCommission, vendorAmount: finalVendorAmount } =
      await resolveOrderCommission(store_id, subtotal, deliveryFee, payment_method)

    const supabase = await createClient()

    // Vérification Portefeuille pour COD
    if (payment_method === 'cod') {
      const feeToFreeze = requiresClosing ? closingFee : 0
      const { canAccept, commissionDue } = await canAcceptCOD(store_id, total, feeToFreeze)

      if (!canAccept) {
        return NextResponse.json({ error: `Solde insuffisant pour la marge COD. Requis : ${commissionDue} FCFA.` }, { status: 402 })
      }

      const { error: freezeErr } = await supabase.rpc('freeze_commission', {
        p_vendor_id: store_id, p_commission: commissionDue,
      })
      if (freezeErr) return NextResponse.json({ error: 'Erreur au gel du solde COD.' }, { status: 500 })
    }

    // ── 5. TRANSACTION ATOMIQUE ───────────────────────────────────
    let orderRecord
    try {
      const operations: any[] = []

      // Baisse de stock atomique (si variante)
      if (variant_id) {
        operations.push(
          prisma.productVariant.update({
            where: { id: variant_id },
            data: { stock: { decrement: quantity } }
          })
        )
      }

      // Création commande
      operations.push(
        prisma.order.create({
          data: {
            product_id, store_id, variant_id: variant_id ?? null, quantity,
            buyer_name, buyer_phone, delivery_address: delivery_address ?? null,
            delivery_zone_id: delivery_zone_id ?? null, delivery_fee: deliveryFee,
            payment_method, subtotal: grossSubtotal, promo_discount: promoDiscountAmount,
            platform_fee: finalPlatformFee, delivery_commission: finalDeliveryCommission,
            vendor_amount: finalVendorAmount, total,
            applied_promo_id: applied_promo_id ?? null,
            status: requiresClosing ? 'cod_pending_confirmation' : 'pending',
            ...(booking_date && booking_start_time && booking_end_time && {
              booking: {
                create: {
                  store_id, product_id, booking_date: new Date(booking_date),
                  start_time: booking_start_time, end_time: booking_end_time,
                }
              }
            }),
            ...(requiresClosing && {
              closing: {
                create: { store_id, closing_fee: closingFee, status: 'PENDING' }
              }
            }),
          },
        })
      )

      const results = await prisma.$transaction(operations)
      orderRecord = results[results.length - 1] // La commande est la dernière op

    } catch (dbErr: any) {
      if (payment_method === 'cod') {
        const feeToFreeze = requiresClosing ? closingFee : 0
        const commissionDue = Math.round(total * 0.05) + feeToFreeze
        await supabase.rpc('unfreeze_commission', { p_vendor_id: store_id, p_commission: commissionDue })
      }
      return NextResponse.json({ error: "Erreur serveur ou stock épuisé." }, { status: 500 })
    }

    if (applied_promo_id) {
      await supabase.rpc('increment_promo_uses', { p_promo_id: applied_promo_id, delta: 1 })
    }

    // ── 6. REPONSE FINALE ─────────────────────────────────────────
    if (payment_method === 'cod') {
      const city = delivery_address?.split(',')[1]?.trim() || null
      notifyNewOrder({
        userId: store_id, productName: product.name, buyerName: buyer_name,
        amount: total, orderId: orderRecord.id, paymentMethod: 'cod', city,
      }).catch(e => console.error('[Notification COD ERROR]', e))

      return NextResponse.json({ order_id: orderRecord.id, cod: true })
    }

    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const returnUrl = `${baseUrl}/checkout/success?order=${orderRecord.id}`
    const notifyUrlBase = `${baseUrl}/api/checkout/ipn`

    let paymentUrl = ''
    if (payment_method === 'cinetpay') {
      paymentUrl = await initiateCinetPay({ amount: total, orderId: orderRecord.id, buyerName: buyer_name, buyerPhone: buyer_phone, productName: product.name, returnUrl, notifyUrl: `${notifyUrlBase}/cinetpay` })
    } else if (payment_method === 'paytech') {
      paymentUrl = await initiatePayTech({ amount: total, orderId: orderRecord.id, productName: product.name, returnUrl, notifyUrl: `${notifyUrlBase}/paytech` })
    } else if (payment_method === 'wave') {
      paymentUrl = await initiateWave({ amount: total, orderId: orderRecord.id, productName: product.name, successUrl: returnUrl, errorUrl: `${baseUrl}/checkout/${product_id}?error=true` })
    } else {
      return NextResponse.json({ error: 'Moyen de paiement invalide.' }, { status: 400 })
    }

    return NextResponse.json({ order_id: orderRecord.id, payment_url: paymentUrl })
  } catch (error: any) {
    console.error('[CHECKOUT ERROR]:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
