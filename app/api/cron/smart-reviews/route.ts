import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'
import { verifyCronSecret } from '@/lib/cron/cron-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

    // Cherche les commandes livrées entre il y a 72h et 48h (pour n'envoyer qu'une fois)
    const eligibleOrders = await prisma.order.findMany({
      where: {
        status: 'delivered',
        updated_at: {
          gte: threeDaysAgo,
          lte: twoDaysAgo
        },
        // Pas de Review encore associée
        Review: { none: {} }
      },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        product: { select: { id: true, name: true } }
      }
    })

    let sentCount = 0;
    for (const order of eligibleOrders) {
      if (order.buyer_phone) {
        const storeName = order.store?.name || 'Yayyam'
        
        await sendWhatsApp({
          to: order.buyer_phone,
          body: `Bonjour ${order.buyer_name.split(' ')[0]} ! 😊\n\nVous avez récemment reçu votre commande "${order.product?.name}" sur *${storeName}*.\n\nÊtes-vous satisfait(e) de votre achat ?\n\nRépondez simplement par un chiffre entre *1* et *5* pour nous noter (5 étant "Très satisfait").\n\nMerci de votre confiance !`
        })
        sentCount++
      }
    }

    return NextResponse.json({ success: true, processed: eligibleOrders.length, sent: sentCount })
  } catch (error) {
    console.error('Erreur CRON smart-reviews', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
