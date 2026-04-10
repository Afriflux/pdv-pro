import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/cron-helpers'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60s max for cron

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Get all active stores (with at least 1 product) that have coach-ia installed
    const stores = await prisma.store.findMany({
      where: {
        is_active: true,
        products: { some: { active: true } },
        installedApps: { some: { app_id: 'coach-ia', status: 'active' } }
      },
      select: {
        id: true,
        name: true,
        user_id: true,
      },
    })

    if (stores.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'Aucune boutique active.' })
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let processed = 0
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    for (const store of stores) {
      try {
        // Check if digest already exists for today
        const existing = await prisma.dailyDigest.findUnique({
          where: { store_id_date: { store_id: store.id, date: today } },
        })
        if (existing) continue

        // 2. Get yesterday's metrics
        const [ordersYesterday, ordersAllTime, cancelledYesterday] = await Promise.all([
          prisma.order.findMany({
            where: {
              store_id: store.id,
              created_at: { gte: yesterday, lte: yesterdayEnd },
            },
            select: { total: true, status: true, product: { select: { name: true } } },
          }),
          prisma.order.count({ where: { store_id: store.id } }),
          prisma.order.count({
            where: {
              store_id: store.id,
              status: 'cancelled',
              created_at: { gte: yesterday, lte: yesterdayEnd },
            },
          }),
        ])

        const completedOrders = ordersYesterday.filter(o =>
          ['delivered', 'completed', 'cod_confirmed', 'confirmed', 'pending'].includes(o.status)
        )
        const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
        const avgCart = completedOrders.length > 0 ? Math.round(revenue / completedOrders.length) : 0

        // Top product
        const productCounts: Record<string, number> = {}
        for (const o of ordersYesterday) {
          const name = o.product?.name || 'Inconnu'
          productCounts[name] = (productCounts[name] || 0) + 1
        }
        const topProduct = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucun'

        // Previous day comparison
        const twoDaysAgo = new Date(yesterday)
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 1)
        const twoDaysAgoEnd = new Date(twoDaysAgo)
        twoDaysAgoEnd.setHours(23, 59, 59, 999)

        const prevDayOrders = await prisma.order.count({
          where: {
            store_id: store.id,
            created_at: { gte: twoDaysAgo, lte: twoDaysAgoEnd },
          },
        })

        const metrics = {
          orders: completedOrders.length,
          revenue,
          avg_cart: avgCart,
          abandoned: cancelledYesterday,
          top_product: topProduct,
          total_orders_all_time: ordersAllTime,
          prev_day_orders: prevDayOrders,
        }

        // 3. Calculate store score (0-100)
        const score = Math.min(100, Math.max(0,
          (completedOrders.length >= 3 ? 30 : completedOrders.length * 10) +
          (revenue >= 100000 ? 30 : Math.round((revenue / 100000) * 30)) +
          (cancelledYesterday === 0 ? 20 : Math.max(0, 20 - cancelledYesterday * 10)) +
          (ordersAllTime >= 50 ? 20 : Math.round((ordersAllTime / 50) * 20))
        ))

        // 4. Generate AI summary
        const changeVsPrev = prevDayOrders > 0
          ? `${Math.round(((completedOrders.length - prevDayOrders) / prevDayOrders) * 100)}%`
          : 'N/A'

        const prompt = `Tu es un coach e-commerce expert du marché africain (Afrique de l'Ouest, FCFA). Génère un résumé quotidien ULTRA CONCIS en français pour la boutique "${store.name}".

Données d'hier :
- ${completedOrders.length} commandes (${changeVsPrev} vs veille)
- ${revenue.toLocaleString('fr-FR')} FCFA de chiffre d'affaires
- Panier moyen : ${avgCart.toLocaleString('fr-FR')} FCFA
- ${cancelledYesterday} paniers abandonnés/annulés
- Produit vedette : ${topProduct}
- Score boutique : ${score}/100

⚠️ FORMATAGE STRICTEMENT IMPOSÉ :
- Première ligne = émoji + résumé des chiffres clés (1 ligne max)
- Puis 2-3 suggestions actionnables numérotées (1 ligne chacune)
- Dernière ligne = score boutique avec émoji feu
- MAXIMUM 150 mots au total
- Pas de salutation, pas de formule de politesse`

        let summary = ''
        const suggestions: { text: string; priority: string; action_url: string }[] = []

        try {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 250,
            messages: [{ role: 'user', content: prompt }],
          })
          const textBlock = response.content.find(c => c.type === 'text')
          summary = textBlock?.text || ''

          // Extract suggestions from numbered lines
          const lines = summary.split('\n').filter(l => l.trim())
          for (const line of lines) {
            const match = line.match(/^(\d+)\.\s+(.+)/)
            if (match) {
              suggestions.push({
                text: match[2].trim(),
                priority: suggestions.length === 0 ? 'high' : 'medium',
                action_url: '/dashboard',
              })
            }
          }
        } catch (aiErr) {
          console.error(`[Daily Digest AI Error] Store ${store.id}:`, aiErr)
          // Fallback summary without AI
          summary = `📊 Hier : ${completedOrders.length} commande(s) · ${revenue.toLocaleString('fr-FR')} FCFA (${changeVsPrev} vs veille)\n\n💡 Score boutique: ${score}/100`
        }

        // 5. Save to DB
        await prisma.dailyDigest.create({
          data: {
            store_id: store.id,
            date: today,
            summary,
            metrics,
            suggestions,
            score,
          },
        })

        // 6. Send in-app notification
        await prisma.notification.create({
          data: {
            user_id: store.user_id,
            type: 'daily_digest',
            title: '📊 Votre Coach Quotidien est prêt',
            message: `${completedOrders.length} commande(s) hier · ${revenue.toLocaleString('fr-FR')} FCFA · Score ${score}/100`,
            link: '/dashboard',
          },
        })

        processed++
      } catch (storeErr) {
        console.error(`[Daily Digest Error] Store ${store.id}:`, storeErr)
        // Continue to next store
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: stores.length,
      message: `${processed}/${stores.length} digests générés.`,
    })
  } catch (error: unknown) {
    console.error('CRON DAILY-DIGEST ERROR:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération des digests.' },
      { status: 500 }
    )
  }
}
