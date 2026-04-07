import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function initiateCinetPay(params: { amount: number, orderId: string, customerPhone: string, customerName: string, returnUrl: string, notifyUrl: string }) {
  const apiKey = process.env.CINETPAY_API_KEY!
  const siteId = process.env.CINETPAY_SITE_ID!
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey, site_id: siteId, transaction_id: params.orderId,
      amount: Math.round(params.amount), currency: 'XOF', description: 'Paiement Facture',
      return_url: params.returnUrl, notify_url: params.notifyUrl,
      channels: 'ALL',
      customer_name: params.customerName.split(' ')[0] || 'Client',
      customer_surname: params.customerName.split(' ').slice(1).join(' ') || '-',
      customer_phone_number: params.customerPhone,
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
      quote_id, payment_method, buyer_phone
    } = body

    if (!quote_id || !payment_method || !buyer_phone) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // Validation du devis
    const quote = await prisma.quote.findUnique({
      where: { id: quote_id }
    })

    if (!quote || quote.status === 'REJECTED') {
      return NextResponse.json({ error: 'Ce devis est invalide ou refusé.' }, { status: 404 })
    }

    const store_id = quote.store_id

    // Recherche ou création auto du produit système "Paiement Direct" pour rattacher la commande
    const systemProduct = await prisma.product.findFirst({
      where: { store_id, category: 'system_payment_link' }
    })

    if (!systemProduct) {
       return NextResponse.json({ error: 'Produit système manquant. Veuillez en informer le vendeur.' }, { status: 500 })
    }

    const total = quote.total_amount

    const commissionRate = 0.08 
    const finalPlatformFee = Math.round(total * commissionRate)
    const finalVendorAmount = total - finalPlatformFee

    const order = await prisma.order.create({
      data: {
        product_id: systemProduct.id,
        store_id: store_id,
        buyer_name: quote.client_name,
        buyer_phone: buyer_phone,
        buyer_email: quote.client_email,
        payment_method,
        subtotal: total,
        total: total,
        platform_fee: finalPlatformFee,
        vendor_amount: finalVendorAmount,
        status: 'pending',
      }
    })

    if (total === 0) {
       await prisma.order.update({
         where: { id: order.id },
         data: { status: 'paid' }
       })
       const supabase = await createClient()
       await supabase.rpc('increment_vendor_wallet', { p_vendor_id: store_id, p_amount: finalVendorAmount })
       return NextResponse.json({ success: true, redirectUrl: `/success/${order.id}` })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
    let redirectUrl = ''

    if (payment_method === 'paytech') {
      redirectUrl = await initiatePayTech({
        amount: total,
        orderId: order.id,
        productName: `Facture de ${quote.client_name}`,
        returnUrl: `${baseUrl}/success/${order.id}`,
        notifyUrl: `${baseUrl}/api/webhooks/paytech`
      })
    } else if (payment_method === 'cinetpay') {
      redirectUrl = await initiateCinetPay({
        amount: total,
        orderId: order.id,
        customerName: quote.client_name,
        customerPhone: buyer_phone,
        returnUrl: `${baseUrl}/success/${order.id}`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`
      })
    } else if (payment_method === 'wave') {
      redirectUrl = await initiateWave({
        amount: total,
        orderId: order.id,
        productName: `Facture de ${quote.client_name}`,
        successUrl: `${baseUrl}/success/${order.id}`,
        errorUrl: `${baseUrl}/quote/${quote.id}?error=canceled`
      })
    } else {
      return NextResponse.json({ error: 'Méthode de paiement non supportée.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, redirectUrl })

  } catch (err: any) {
    console.error('Erreur API Quote Initiate:', err)
    return NextResponse.json({ error: err.message || 'Une erreur système est survenue.' }, { status: 500 })
  }
}
