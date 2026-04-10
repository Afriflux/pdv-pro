import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret, cronResponse } from '@/lib/cron/cron-helpers'
import { createPaymentSession } from '@/lib/payments/routing'
import { confirmOrder } from '@/lib/payments/confirmOrder'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Avance la date de facturation en fonction de l'intervalle
 */
function getNextBillingDate(currentDate: Date | null, interval: string): Date {
  const date = currentDate ? new Date(currentDate) : new Date()
  switch (interval) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
    case 'monthly':
    default:
      date.setMonth(date.getMonth() + 1)
      break
  }
  return date
}

// ----------------------------------------------------------------
// POST /api/cron/subscriptions
// CRON d'Abonnements - Facture ou Relance les clients via WhatsApp
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Sécurité CRON
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Non autorisé' }, 401)
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString()
  
  let processed = 0
  let autoDebited = 0
  let fallbackLinksSent = 0

  try {
    // 2. Trouver les abonnements actifs à renouveler
    // On prend les Order payées avec is_subscription = true et dont next_billing_at est dépassé
    const { data: subs, error: fetchError } = await supabase
      .from('Order')
      .select(`
        id, total, quantity, buyer_id, buyer_name, buyer_phone, store_id, product_id, variant_id, delivery_zone_id, delivery_fee, order_type,
        next_billing_at, subtotal, platform_fee, vendor_amount, payment_method,
        Product ( name, recurring_interval ),
        buyer:User ( id, client_wallet_balance )
      `)
      .eq('is_subscription', true)
      .eq('status', 'paid')
      .lte('next_billing_at', today)

    if (fetchError) throw fetchError

    if (!subs || subs.length === 0) {
      return cronResponse({ processed: 0, message: 'Aucun abonnement à renouveler aujourd\'hui' })
    }

    for (const sub of subs) {
      processed++
      const product = sub.Product as any
      const interval = product?.recurring_interval || 'monthly'
      const buyer = sub.buyer as any
      
      const newBillingDate = getNextBillingDate(sub.next_billing_at ? new Date(sub.next_billing_at) : new Date(), interval)

      const clonedOrderId = randomUUID()
      let advanceDate = true
      const clientBalance = buyer?.client_wallet_balance || 0

      // A. Évaluation du Portefeuille Client (Prélèvement Automatique Intelligent)
      if (buyer && clientBalance >= sub.total) {
        // Le client a assez d'argent ! Prélèvement transactionnel
        console.log(`[CRON Subscriptions] Solde client suffisant pour ${sub.buyer_name}. Débit transactionnel en cours...`)
        
        let txError = false;
        try {
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: buyer.id },
              data: { client_wallet_balance: { decrement: sub.total } }
            })
            await tx.order.create({
              data: {
                id: clonedOrderId,
                status: 'pending',
                is_subscription: false,
                total: sub.total,
                subtotal: sub.subtotal,
                platform_fee: sub.platform_fee,
                vendor_amount: sub.vendor_amount,
                payment_method: sub.payment_method,
                quantity: sub.quantity,
                buyer_id: sub.buyer_id,
                buyer_name: sub.buyer_name,
                buyer_phone: sub.buyer_phone,
                store_id: sub.store_id,
                product_id: sub.product_id,
                variant_id: sub.variant_id ?? null,
                delivery_zone_id: sub.delivery_zone_id ?? null,
                delivery_fee: sub.delivery_fee,
                order_type: sub.order_type
              }
            })
          })
        } catch (e) {
          txError = true;
        }

        if (txError) {
          console.error(`[CRON Subscriptions] Échec transaction pour ${buyer.id}`)
          continue
        }

        // B. Accepter la commande
        try {
          await confirmOrder(clonedOrderId, `Auto-Wallet-${sub.id}`)
          autoDebited++
        } catch (confirmErr) {
          console.error(`[CRON Subscriptions] Erreur confirmOrder pour ${clonedOrderId}. Compensation...`, confirmErr)
          await prisma.$transaction([
            prisma.user.update({
              where: { id: buyer.id },
              data: { client_wallet_balance: { increment: sub.total } }
            }),
            prisma.order.update({
              where: { id: clonedOrderId },
              data: { status: 'cancelled' }
            })
          ])
          continue
        }

        // 3. Informer le client du succès !
        try {
          await sendWhatsApp({
            to: sub.buyer_phone,
            body: `✅ *Renouvellement Automatique Réussi*\n\nBonjour ${sub.buyer_name},\nVotre abonnement pour *${product.name}* a été renouvelé avec succès.\n\n💰 Montant prélevé: *${sub.total} FCFA*\n💳 Méthode: *Portefeuille Yayyam*\n\nNouveau solde portefeuille: ${clientBalance - sub.total} FCFA.\nMerci !`
          })
        } catch (e) { /* silent */ }

      } else {
        // C. Fallback: Solde insuffisant ou Portefeuille vide -> Émission d'un lien Smart Routing
        console.log(`[CRON Subscriptions] Solde insuffisant pour ${sub.buyer_name}. Envoi lien Smart Routing...`)
        
        try {
          await prisma.order.create({
            data: {
              id: clonedOrderId,
              status: 'pending',
              is_subscription: false,
              total: sub.total,
              subtotal: sub.subtotal,
              platform_fee: sub.platform_fee,
              vendor_amount: sub.vendor_amount,
              payment_method: sub.payment_method,
              quantity: sub.quantity,
              buyer_id: sub.buyer_id,
              buyer_name: sub.buyer_name,
              buyer_phone: sub.buyer_phone,
              store_id: sub.store_id,
              product_id: sub.product_id,
              variant_id: sub.variant_id ?? null,
              delivery_zone_id: sub.delivery_zone_id ?? null,
              delivery_fee: sub.delivery_fee,
              order_type: sub.order_type
            }
          })
        } catch (e) {
          console.error(`[CRON Subscriptions] Erreur création fallback order pour ${sub.id}`, e)
          continue
        }

        // On génère une URL de paiement routée sur la passerelle par défaut (ex: paytech/wave)
        const paymentRes = await createPaymentSession({
          amount: sub.total,
          currency: 'XOF',
          orderId: clonedOrderId,
          method: 'wave', // Le routeur fera basculer sur Paytech/Cinetpay si wave est HS
          customer: {
            name: sub.buyer_name,
            phone: sub.buyer_phone
          },
          description: `Renouvellement Abonnement: ${product.name}`,
          returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yayyam.com'}/checkout/success?order=${clonedOrderId}`,
          notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yayyam.com'}/api/webhooks/wave`, // Sera auto-override si fallback
          env: 'prod'
        })

        if (!paymentRes.success) {
          console.error(`[CRON Subscriptions] Échec génération lien pour ${clonedOrderId}: ${paymentRes.error}`)
          advanceDate = false // Ne pas repousser la date si la génération du lien a bloqué
        } else {
          // Envoi de la facture WhatsApp
          try {
            await sendWhatsApp({
              to: sub.buyer_phone,
              body: `⚠️ *Abonnement Arrivé à Expiration*\n\nBonjour ${sub.buyer_name},\nLe mois est écoulé ! Votre abonnement pour *${product.name}* (Montant: ${sub.total} FCFA) doit être renouvelé pour éviter la coupure.\n\n👉 *Réglez dès maintenant en un clic :*\n${paymentRes.paymentUrl}\n\nMerci de votre confiance.`
            })
          } catch (e) { /* silent */ }
          fallbackLinksSent++
        }
      }

      // D. Repousser la date de facturation de l'abonnement d'origine
      if (advanceDate) {
        await supabase
          .from('Order')
          .update({
            next_billing_at: newBillingDate.toISOString()
          })
          .eq('id', sub.id)
      }
    }

    return cronResponse({ 
      processed, 
      auto_debited_via_wallet: autoDebited,
      fallback_links_sent: fallbackLinksSent,
      message: 'Cycle d\'abonnement achevé avec succès.' 
    })

  } catch (error: unknown) {
    console.error('[CRON Subscriptions] Global Error:', error)
    return cronResponse({ error: error instanceof Error ? error.message : 'Erreur interne' }, 500)
  }
}
