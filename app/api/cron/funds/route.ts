import { verifyCronSecret, cronResponse } from '@/lib/cron/cron-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * CRON /api/cron/funds — Toutes les heures
 * 
 * Rôle : Vérification de cohérence financière et nettoyage.
 * 
 * 1. Détecte les commandes « delivered » depuis +48h dont le wallet n'a jamais été crédité
 *    (cas exceptionnel de crash post-IPN) et corrige le solde.
 * 2. Vérifie l'intégrité des wallets (balance négative = anomalie).
 * 3. Annule les commandes « pending » de +24h (abandon sans paiement).
 */
// Vercel Cron envoie des GET, on supporte aussi POST pour les appels manuels
export async function GET(request: Request) {
  return handleFundsCron(request)
}

export async function POST(request: Request) {
  return handleFundsCron(request)
}

async function handleFundsCron(request: Request) {
  if (!verifyCronSecret(request)) {
    return cronResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    let walletsCorrected = 0
    let negativeWalletsDetected = 0
    let staleOrdersCancelled = 0

    // ── 1. Détection de commandes livrées sans crédit wallet ─────────────
    // Commandes « delivered » ou « completed » datant de +48h
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const uncreditedOrders = await prisma.order.findMany({
      where: {
        status: { in: ['delivered', 'completed'] },
        updated_at: { lte: new Date(cutoff48h) },
        payment_method: { not: 'cod' },
        vendor_amount: { gt: 0 },
      },
      select: {
        id: true,
        store_id: true,
        vendor_amount: true,
        store: {
          select: {
            wallet: {
              select: { id: true, total_earned: true }
            }
          }
        }
      },
      take: 100, // Limiter le batch par exécution
    })

    // Batch query for existing transactions to avoid N+1
    const walletIds = Array.from(new Set(uncreditedOrders.map(o => o.store?.wallet?.id).filter(Boolean))) as string[];
    
    const existingTxs = await prisma.transaction.findMany({ 
      where: {
        wallet_id: { in: walletIds },
        type: 'deposit',
      },
      take: 500
    });

    // Pour chaque commande, vérifier si une Transaction correspondante existe
    for (const order of uncreditedOrders) {
      if (!order.store?.wallet?.id) continue

      // Si aucune transaction n'existe pour ce paiement → anomalie, on corrige
      const hasTx = existingTxs.some(tx => tx.wallet_id === order.store?.wallet?.id && tx.label?.includes(order.id));
      if (!hasTx) {
        try {
          await prisma.$transaction([
            prisma.wallet.update({
              where: { vendor_id: order.store_id },
              data: {
                balance: { increment: order.vendor_amount },
                total_earned: { increment: order.vendor_amount },
              }
            }),
            prisma.transaction.create({
              data: {
                wallet_id: order.store.wallet.id,
                type: 'deposit',
                amount: order.vendor_amount,
                status: 'completed',
                label: `[CRON Recovery] Order ${order.id}`,
              }
            })
          ])
          walletsCorrected++
          console.log(`[CRON Funds] ✅ Wallet corrigé pour commande ${order.id} (+${order.vendor_amount} FCFA)`)
        } catch (e) {
          console.error(`[CRON Funds] Erreur correction wallet pour ${order.id}:`, e)
        }
      }
    }

    // ── 2. Détection de wallets à solde négatif (anomalie critique) ──────
    const negativeWallets = await prisma.wallet.findMany({ 
      where: {
        OR: [
          { balance: { lt: 0 } },
          { pending: { lt: 0 } },
        ]
      },
      select: {
        id: true,
        vendor_id: true,
        balance: true,
        pending: true,
      },
      take: 100
    })

    for (const w of negativeWallets) {
      negativeWalletsDetected++
      console.error(
        `[CRON Funds] 🔴 ALERTE: Wallet ${w.id} (vendor: ${w.vendor_id}) ` +
        `balance=${w.balance}, pending=${w.pending} — VALEUR NEGATIVE DETECTEE`
      )
    }

    // ── 3. Annulation des commandes « pending » de +24h ────────────────
    // Les commandes en attente de paiement depuis plus de 24h sont considérées abandonnées
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const staleUpdate = await prisma.order.updateMany({
      where: {
        status: 'pending',
        payment_method: { not: 'cod' },
        created_at: { lte: cutoff24h },
      },
      data: {
        status: 'cancelled',
      }
    })
    staleOrdersCancelled = staleUpdate.count

    if (staleOrdersCancelled > 0) {
      console.log(`[CRON Funds] 🧹 ${staleOrdersCancelled} commandes pending de +24h annulées`)
    }

    return cronResponse({
      wallets_corrected: walletsCorrected,
      negative_wallets_detected: negativeWalletsDetected,
      stale_orders_cancelled: staleOrdersCancelled,
      message: 'Vérification financière terminée',
    })

  } catch (error: unknown) {
    console.error('[CRON Funds] Global Error:', error)
    return cronResponse({ error: error instanceof Error ? error.message : 'Erreur interne' }, 500)
  }
}
