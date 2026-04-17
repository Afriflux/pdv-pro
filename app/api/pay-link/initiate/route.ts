import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPaymentSession } from '@/lib/payments/routing'
import { resolveOrderCommission } from '@/lib/commission/commission-service'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    const body = JSON.parse(bodyText) as Record<string, any>

    const {
      pay_link_id, payment_method, buyer_phone, client_name, client_email
    } = body

    if (!pay_link_id || !payment_method || !buyer_phone) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // Sécurisation : on lit l'amount et la boutique directement en BDD !
    const payLink = await prisma.paymentLink.findUnique({
      where: { id: pay_link_id }
    })

    if (!payLink || !payLink.is_active) {
      return NextResponse.json({ error: 'Lien de paiement invalide ou expiré.' }, { status: 404 })
    }

    const total = payLink.amount;
    const store_id = payLink.store_id;

    // Recherche ou création auto du produit système "Paiement Direct" pour rattacher la commande
    let systemProduct = await prisma.product.findFirst({
      where: { store_id, category: 'system_payment_link' }
    })

    if (!systemProduct) {
       // Auto-create fail-safe
       systemProduct = await prisma.product.create({
         data: {
           store_id: store_id,
           name: 'Lien de Paiement',
           type: 'physical',
           category: 'system_payment_link',
           price: 0,
           images: [],
         }
       })
    }

    const { platformFee, deliveryCommission, vendorAmount } = await resolveOrderCommission(
      store_id,
      total,
      0, // pas de frais de livraison
      payment_method
    )

    const finalPlatformFee = platformFee + deliveryCommission
    const finalVendorAmount = vendorAmount

    const order = await prisma.order.create({
      data: {
        product_id: systemProduct.id,
        store_id: store_id,
        buyer_name: client_name || 'Client',
        buyer_phone: buyer_phone,
        buyer_email: client_email || undefined,
        payment_method,
        payment_ref: pay_link_id, // stocker l'ID du lien pour la validation future
        subtotal: total,
        total: total,
        platform_fee: finalPlatformFee,
        vendor_amount: finalVendorAmount,
        status: 'pending',
        order_type: 'payment_link'
      }
    })

    if (total === 0) {
       await prisma.order.update({
         where: { id: order.id },
         data: { status: 'paid' }
       })
       // Appeler confirmOrder à la place de l'ancienne RPC pour avoir l'atomicité
       const { confirmOrder } = await import('@/lib/payments/confirmOrder')
       await confirmOrder(order.id, 'LINK_FREE')
       return NextResponse.json({ success: true, redirectUrl: `/success/${order.id}` })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')

    // SMART ROUTING via createPaymentSession
    const paymentResponse = await createPaymentSession({
      amount: total,
      currency: 'XOF',
      orderId: order.id,
      method: payment_method as any,
      customer: {
        name: client_name || 'Client',
        phone: buyer_phone,
        email: client_email || undefined
      },
      description: payLink.title || `Facture de paiement direct`,
      returnUrl: `${baseUrl}/success/${order.id}`,
      notifyUrl: `${baseUrl}/api/webhooks/${payment_method}`,
      env: 'prod'
    })

    if (!paymentResponse.success) {
      return NextResponse.json({ error: `La passerelle de paiement a échoué: ${paymentResponse.error}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, redirectUrl: paymentResponse.paymentUrl })

  } catch (err: any) {
    console.error('Erreur API Pay-Link Initiate:', err)
    return NextResponse.json({ error: err.message || 'Une erreur système est survenue.' }, { status: 500 })
  }
}
