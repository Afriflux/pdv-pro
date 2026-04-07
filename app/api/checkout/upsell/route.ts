import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp, msgOrderConfirmed, msgVendorNewOrder } from '@/lib/whatsapp/sendWhatsApp'
import { executeWorkflows } from '@/lib/workflows/execution'

// Need to duplicate some telegram helpers or just leave simple error logging
// For simplicity we will assume the main flow has standard COD webhook firing.

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    
    const body = JSON.parse(bodyText) as Record<string, any>
    const { base_order_id, upsell_product_id, price } = body

    if (!base_order_id || !upsell_product_id || price === undefined) {
      return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
    }

    // 1. Get Base Order
    const baseOrder = await prisma.order.findUnique({
      where: { id: base_order_id },
      include: { store: true }
    })

    if (!baseOrder) {
      return NextResponse.json({ error: 'Commande originale introuvable.' }, { status: 404 })
    }

    // 2. Get Upsell Product
    const upsellProduct = await prisma.product.findUnique({
      where: { id: upsell_product_id }
    })

    if (!upsellProduct) {
       return NextResponse.json({ error: 'Produit upsell introuvable.' }, { status: 404 })
    }

    // 3. Create a New Order for the Upsell Product
    const amount = Number(price)
    // Assume platform fee & vendor amount calculations (similar logic)
    const platformFee = Math.round(amount * 0.05) // 5% fee for COD/Upsell usually?
    const vendorAmount = amount - platformFee

    const newOrder = await prisma.order.create({
      data: {
        id: `ord_${Date.now()}_upsell`,
        store_id: baseOrder.store_id,
        product_id: upsell_product_id,
        buyer_name: baseOrder.buyer_name,
        buyer_email: baseOrder.buyer_email,
        buyer_phone: baseOrder.buyer_phone,
        delivery_address: baseOrder.delivery_address,
        total: amount,
        subtotal: amount,
        platform_fee: platformFee,
        vendor_amount: vendorAmount,
        status: baseOrder.status || 'PENDING', // usually 'PENDING' for COD
        payment_method: 'cod' // OTO is only for COD in our setup
      }
    })

    // 4. Vendor Notification
    if (baseOrder.store.user_id) {
       // Ideally we fetch vendor phone
       const vendor = await prisma.user.findUnique({ where: { id: baseOrder.store.user_id }})
       if (vendor?.phone) {
         sendWhatsApp({ 
           to: vendor.phone, 
           body: msgVendorNewOrder({
             productName: `[UPSELL] ${upsellProduct.name}`,
             buyerName: baseOrder.buyer_name,
             buyerPhone: baseOrder.buyer_phone,
             amount: amount,
             vendorAmount: vendorAmount,
             address: baseOrder.delivery_address || undefined
           })
         }).catch(err => console.error('[WhatsApp Vendeur Upsell Error]', err))
       }
    }

    // 5. Buyer Notification
    if (baseOrder.buyer_phone) {
      sendWhatsApp({
        to: baseOrder.buyer_phone,
        body: msgOrderConfirmed({
          buyerName: baseOrder.buyer_name,
          productName: `[Ajout OTO] ${upsellProduct.name}`,
          amount: amount,
          orderId: newOrder.id,
          vendorName: baseOrder.store.name || 'la boutique'
        })
      }).catch(err => console.error('[WhatsApp Acheteur Upsell Error]', err))
    }

    // 6. Push to Workflow Engine
    executeWorkflows(baseOrder.store_id, 'Nouvelle Commande (Validée COD)', {
      client_name: baseOrder.buyer_name,
      client_phone: baseOrder.buyer_phone,
      client_email: baseOrder.buyer_email || '',
      product_name: `[UPSELL] ${upsellProduct.name}`,
      order_id: newOrder.id,
      order_total: amount,
      customer_city: baseOrder.delivery_address?.split(',')[1]?.trim() || 'Inconnue',
      store_name: baseOrder.store.name,
    }).catch(e => console.error('[Workflow Engine Error]', e));

    return NextResponse.json({ success: true, order_id: newOrder.id })

  } catch (error: any) {
    console.error('[UPSELL ENDPOINT ERROR]:', error)
    return NextResponse.json({ error: 'Erreur interne lors de la validation Upsell' }, { status: 500 })
  }
}
