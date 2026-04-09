import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp, msgAbandonedCart } from '@/lib/whatsapp/sendWhatsApp'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { lead_id } = payload.data || {}

    if (!lead_id) {
      return NextResponse.json({ error: 'Missing lead_id' }, { status: 400 })
    }

    // 1. Récupérer le Lead
    const lead = await prisma.lead.findUnique({
      where: { id: lead_id }
    })

    if (!lead || !lead.product_id) {
       return NextResponse.json({ message: 'Lead without product found' }, { status: 200 })
    }

    const product = await prisma.product.findUnique({
       where: { id: lead.product_id },
       select: { name: true, price: true, store_id: true }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found maybe deleted' }, { status: 200 })
    }

    // 2. Vérifier si une commande a été passée entre temps par ce téléphone
    const where: any = {
      buyer_phone: lead.phone,
      product_id: lead.product_id
    }
    
    if (lead.created_at) {
      where.created_at = { gte: lead.created_at }
    }

    const convertedOrder = await prisma.order.findFirst({
      where
    })

    if (convertedOrder) {
       // Acheté entre temps, on nettoie le script
       await prisma.lead.delete({ where: { id: lead.id } })
       return NextResponse.json({ message: 'Cart recovered naturally (Order found).' }, { status: 200 })
    }

    // 3. Récupérer les infos de la boutique pour le nom
    const store = await prisma.store.findUnique({ where: { id: product.store_id }, select: { name: true, whatsapp_abandoned_cart: true } })

    // Si le vendeur a désactivé l'option entre temps
    if (!store?.whatsapp_abandoned_cart) {
       return NextResponse.json({ message: 'Store disabled cart recovery.' }, { status: 200 })
    }

    // 4. Envoyer le message WhatsApp
    const checkoutLink = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${lead.product_id}?phone=${lead.phone}&name=${encodeURIComponent(lead.name || '')}`
    
    await sendWhatsApp({
      to: lead.phone,
      body: msgAbandonedCart(
        lead.name || 'Client',
        product.name,
        store.name,
        checkoutLink
      )
    })

    console.log(`[Job: Abandoned Cart] Rappel envoyé avec succès à ${lead.phone}`)
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error("[Job: Abandoned Cart] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
