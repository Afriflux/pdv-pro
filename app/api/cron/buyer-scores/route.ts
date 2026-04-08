import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeBuyerScore } from '@/lib/anti-fraud/buyer-check'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vérification de sécurité CRON (Uniquement Vercel en prod)
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Récupérer tous les numéros uniques depuis les commandes
    const buyers = await prisma.order.groupBy({
      by: ['buyer_phone'],
      _count: { id: true },
      where: {
        buyer_phone: { not: '' },
      },
    })

    let processed = 0
    let blacklisted = 0

    for (const buyer of buyers) {
      const phone = buyer.buyer_phone

      // 2. Compter les commandes par statut
      const [delivered, cancelled, disputed] = await Promise.all([
        prisma.order.count({
          where: { buyer_phone: phone, status: { in: ['delivered', 'completed', 'cod_confirmed'] } },
        }),
        prisma.order.count({
          where: { buyer_phone: phone, status: 'cancelled' },
        }),
        prisma.order.count({
          where: { buyer_phone: phone, cod_fraud_suspected: true },
        }),
      ])

      const totalOrders = buyer._count.id
      const score = computeBuyerScore({
        success_orders: delivered,
        refused_orders: cancelled,
        disputed_orders: disputed,
      })

      // 3. Upsert BuyerScore
      await prisma.buyerScore.upsert({
        where: { phone },
        update: {
          total_orders: totalOrders,
          success_orders: delivered,
          refused_orders: cancelled,
          disputed_orders: disputed,
          score,
        },
        create: {
          phone,
          total_orders: totalOrders,
          success_orders: delivered,
          refused_orders: cancelled,
          disputed_orders: disputed,
          score,
        },
      })

      // 4. Auto-blacklist si score < 20 ET 3+ refus
      if (score < 20 && cancelled >= 3) {
        await prisma.buyerBlacklist.upsert({
          where: { phone },
          update: {
            total_refused: cancelled,
            reason: '3+ cancelled COD',
          },
          create: {
            phone,
            reason: '3+ cancelled COD',
            total_refused: cancelled,
          },
        })
        blacklisted++
      }

      processed++
    }

    return NextResponse.json({
      success: true,
      processed,
      blacklisted,
      message: `${processed} acheteurs analysés, ${blacklisted} ajoutés à la blacklist.`,
    })
  } catch (error: unknown) {
    console.error('CRON BUYER-SCORES ERROR:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du recalcul des scores acheteurs.' },
      { status: 500 }
    )
  }
}
