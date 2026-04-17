import { createClient } from '@/lib/supabase/server'
import { sendTelegramCommunityAccess } from '@/lib/telegram/send-community-access'
import {
  sendWhatsApp,
  msgOrderConfirmed,
  msgVendorNewOrder,
  msgDigitalDelivery,
} from '@/lib/whatsapp/sendWhatsApp'
import { notifyNewOrder, createNotification } from '@/lib/notifications/createNotification'
import { createDigitalAccess }   from '@/lib/digital/token'
import { createAndStoreInvoice } from '@/lib/invoice/createInvoice'
import { 
  sendFirstSaleEmail,
} from '@/lib/brevo/brevo-service'
import {
  sendDigitalDeliveryEmail,
  sendInvoiceEmail
} from '@/lib/email/resend'
import { 
  triggerNewOrderTelegram, 
  triggerPaymentTelegram 
} from '@/lib/telegram/notify-hooks'
import { triggerAffiliateCommission } from '@/lib/affiliation/commission-hook'
import { triggerAmbassadorCommission } from '@/lib/affiliation/ambassador-hook'
import { sendSaleNotification } from '@/lib/telegram/community-service'
import { 
  sendMetaCAPIPurchaseEvent, 
  sendTikTokCAPIPurchaseEvent, 
  sendGoogleCAPIPurchaseEvent 
} from '@/lib/tracking/capi'

// ─── Types internes ───────────────────────────────────────────────────────────

interface OrderRow {
  id:               string
  store_id:         string
  product_id:       string
  vendor_amount:    number
  total:            number
  status:           string
  buyer_name:       string
  buyer_phone:      string
  buyer_email:      string | null
  delivery_address: string | null
  payment_method:   string
  affiliate_token:  string | null
  affiliate_amount: number | null
}

interface ProductRow {
  name:                 string
  type:                 string
  access_duration_days: number | null
  max_downloads:        number | null
}

interface StoreRow {
  user_id: string
  name:    string
}

interface _WalletRow {
  id:          string
  balance:     number
  pending:     number
  total_earned: number
}

// ─── Fonction principale ───────────────────────────────────────────────────────

/**
 * Confirme une commande après paiement validé par IPN.
 * Pour les produits digitaux :
 *   - Génère un DigitalAccess (token SHA-256)
 *   - Envoie le lien de téléchargement par WhatsApp à l'acheteur
 * Pour tous les produits :
 *   - Met à jour le statut de commande
 *   - Crédite le wallet vendeur
 *   - Notification interne + WhatsApp vendeur
 */
export async function confirmOrder(orderId: string, paymentRef?: string) {
  const supabase = await createClient()

  // ── 1. Charger la commande ─────────────────────────────────────────────────
  const { data: order } = await supabase
    .from('Order')
    .select('id, store_id, product_id, vendor_amount, total, status, buyer_name, buyer_phone, buyer_email, delivery_address, payment_method, affiliate_token, affiliate_amount')
    .eq('id', orderId)
    .single<OrderRow>()

  if (!order) throw new Error('Commande introuvable: ' + orderId)

  // Éviter double confirmation
  if (order.status !== 'pending') {
    console.log('[confirmOrder] IPN ignoré — déjà traitée:', orderId, order.status)
    return { already_confirmed: true }
  }

  // ── 2. Charger le produit (inclut access_duration_days + max_downloads) ────
  const { data: productRaw } = await supabase
    .from('Product')
    .select('name, type, access_duration_days, max_downloads')
    .eq('id', order.product_id)
    .single()

  const product: ProductRow = {
    name:                 (productRaw?.name as string)                           ?? 'Produit',
    type:                 (productRaw?.type as string)                           ?? 'physical',
    access_duration_days: (productRaw?.access_duration_days as number | null)   ?? null,
    max_downloads:        (productRaw?.max_downloads as number | null)           ?? null,
  }

  // ── 3. Charger la boutique ─────────────────────────────────────────────────
  const { data: storeRaw } = await supabase
    .from('Store')
    .select('user_id, name, meta_pixel_id, meta_capi_token, tiktok_pixel_id, tiktok_capi_token, google_tag_id, google_api_secret')
    .eq('id', order.store_id)
    .single()

  const store: StoreRow | null = storeRaw
    ? {
        user_id: storeRaw.user_id as string,
        name:    storeRaw.name    as string,
      }
    : null

  const isDigital = product.type === 'digital'

  // ── 4. VERROU ATOMIQUE - Mettre à jour le statut de commande ─────────────────
  const newStatus = isDigital ? 'completed' : 'confirmed'

  // Utilisation de la méthode atomique pour éviter le "Race Condition" de 2 Webhooks simultanés
  const { data: updatedOrder, error: updateError } = await supabase
    .from('Order')
    .update({
      status:      newStatus,
      payment_ref: paymentRef ?? null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select()

  if (updateError || !updatedOrder || updatedOrder.length === 0) {
    console.log('[confirmOrder] IPN ignoré (Faille Race Condititon évitée) — déjà traitée ou non-pending:', orderId)
    return { already_confirmed: true }
  }

  // ── 5. Créditer le wallet vendeur (RPC ATOMIQUE via supabase) ───────────────
  // Puisque Supabase standard JS n'a pas `{ increment }` comme Prisma pur, on appelle la RPC Supabase
  // Ou alors on utilise `prisma.wallet.update` vu que Prisma gère l'incrémentation atomique !
  try {
     const { prisma } = await import('@/lib/prisma')
     const wallet = await prisma.wallet.findUnique({ where: { vendor_id: order.store_id } })
     if (wallet) {
       await prisma.wallet.update({
          where: { vendor_id: order.store_id },
          data: {
            balance: { increment: order.vendor_amount },
            total_earned: { increment: order.vendor_amount }
          }
       })
     } else {
       await prisma.wallet.create({
          data: {
            vendor_id: order.store_id,
            balance: order.vendor_amount,
            total_earned: order.vendor_amount,
            pending: 0,
          }
       })
     }
  } catch (e) {
     console.error('[confirmOrder] Erreur Crédit Wallet Atomique:', e)
  }

  // ── 5.ter Déclenchement commission affiliation B2B & Ambassadeur ──────────────────
  triggerAffiliateCommission(orderId, order.store_id, order.total, order.vendor_amount)
    .catch(e => console.error('[Affiliation B2B]', e))
    
  triggerAmbassadorCommission(orderId, order.affiliate_token, order.affiliate_amount)
    .catch(e => console.error('[Ambassadeur]', e))

  // ── 5.quat Earn Loyalty Points for Online Payment ──────────────────
  try {
     const { earnLoyaltyPoints } = await import('@/app/actions/loyalty')
     await earnLoyaltyPoints(order.buyer_phone, order.store_id, order.total, orderId)
  } catch (e) { console.error('[Loyalty Points]', e) }

  // ── 5.bis Génération automatique de la facture PDF ───────────────────────
  // Fire-and-forget pour ne pas bloquer l'IPN
  ;(async () => {
    try {
      await createAndStoreInvoice(orderId)
      
      // Envoi de l'email de reçu (Facture) si l'email existe
      if (order.buyer_email) {
        await sendInvoiceEmail(order.buyer_email, orderId, order.total, store?.name ?? 'Yayyam')
      }
    } catch (err) {
      console.error('[confirmOrder] Erreur création/envoi facture:', err)
    }
  })()

  // ── 6. Notification interne dashboard ─────────────────────────────────────
  if (store) {
    const city = order.delivery_address?.split(',')[1]?.trim() || null

    notifyNewOrder({
      userId:      store.user_id,
      productName: product.name,
      buyerName:   order.buyer_name,
      amount:      order.total,
      orderId:     orderId,
      paymentMethod: order.payment_method,
      city:        city,
    }).catch(e => console.error('[Notification]', e))

    // ── 6.bis Notification Telegram ─────────────────────────────────────────
    triggerNewOrderTelegram(order.store_id, orderId).catch(console.error)
    triggerPaymentTelegram(order.store_id, order.total, order.payment_method).catch(console.error)
    sendSaleNotification(order.store_id, order.total, order.buyer_name, product.name).catch(console.error)

    // ── 6.ter NPS post-première vente ───────────────────────────────────────
    ;(async () => {
      try {
        const { count, error } = await supabase
          .from('Order')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', order.store_id)
          .in('status', ['paid', 'confirmed', 'completed', 'delivered'])

        if (error) throw error

        if (count === 1) {
          await createNotification({
            userId: store.user_id,
            type: 'nps',
            title: '⭐ Félicitations pour votre première vente !',
            message: 'Recommanderiez-vous Yayyam à un ami vendeur ? Donnez-nous votre avis !',
            link: '/dashboard/settings#nps',
          })

          const { data: vendorUser } = await supabase.from('User').select('email').eq('id', store.user_id).single()
          if (vendorUser?.email) {
            sendFirstSaleEmail(vendorUser.email, product.name, order.total).catch(console.error)
          }
        }
      } catch (err) {
        console.error('[NPS Check]', err)
      }
    })()
  }

  // ── 7. Digital : générer DigitalAccess + envoyer lien WhatsApp ────────────
  if (isDigital && order.buyer_phone) {
    // Lancer en fire-and-forget pour ne pas bloquer la réponse IPN
    ;(async () => {
      try {
        const access = await createDigitalAccess({
          orderId:            orderId,
          productId:          order.product_id,
          downloadsMax:       product.max_downloads,
          accessDurationDays: product.access_duration_days,
        })

        const expiresInDays = product.access_duration_days ?? 30

        await sendWhatsApp({
          to:   order.buyer_phone,
          body: msgDigitalDelivery({
            buyerName:    order.buyer_name,
            productName:  product.name,
            downloadUrl:  access.downloadUrl,
            expiresInDays,
          }),
        })

        // Envoi email Digital Delivery si l'acheteur a fourni son email
        if (order.buyer_email) {
          sendDigitalDeliveryEmail(order.buyer_email, product.name, access.downloadUrl, store?.name ?? 'Yayyam').catch(console.error)
        }

        console.log('[confirmOrder] DigitalAccess créé → WhatsApp + Email de livraison envoyés')
      } catch (err) {
        console.error('[confirmOrder] Erreur livraison digitale:', err)
      }
    })()
  }

  // ── 7.bis Accès communauté Telegram (si produit lié) ────────────────────
  if (order.buyer_phone) {
    sendTelegramCommunityAccess({
      orderId:    orderId,
      productId:  order.product_id,
      buyerPhone: order.buyer_phone,
      buyerName:  order.buyer_name,
    }).catch(e => console.error('[TelegramAccess]', e))
  }

  // ── 8. WhatsApp physique : confirmation acheteur ──────────────────────────
  if (!isDigital && order.buyer_phone) {
    sendWhatsApp({
      to:   order.buyer_phone,
      body: msgOrderConfirmed({
        buyerName:   order.buyer_name,
        productName: product.name,
        amount:      order.total,
        orderId:     orderId,
        vendorName:  store?.name ?? 'Yayyam',
      }),
    }).catch(e => console.error('[WhatsApp acheteur]', e))
  }

  // ── 9. WhatsApp vendeur ───────────────────────────────────────────────────
  if (store) {
    const { data: vendorUser } = await supabase
      .from('User')
      .select('phone')
      .eq('id', store.user_id)
      .single()

    const vendorPhone = vendorUser?.phone as string | undefined
    if (vendorPhone) {
      sendWhatsApp({
        to:   vendorPhone,
        body: msgVendorNewOrder({
          productName:  product.name,
          buyerName:    order.buyer_name,
          buyerPhone:   order.buyer_phone,
          amount:       order.total,
          vendorAmount: order.vendor_amount,
          address:      order.delivery_address ?? undefined,
        }),
      }).catch(e => console.error('[WhatsApp vendeur]', e))
    }
  }

  // ── 10. Server-Side Conversion APIs (Meta + TikTok + Google) ──────────────
  if (storeRaw) {
    const sharedParams = {
      eventId: orderId,
      orderId,
      value: order.total,
      currency: 'XOF',
      contentName: product.name,
      customerPhone: order.buyer_phone,
      customerName: order.buyer_name,
    }

    // Meta CAPI
    if (storeRaw.meta_pixel_id && storeRaw.meta_capi_token) {
      sendMetaCAPIPurchaseEvent({
        pixelId: storeRaw.meta_pixel_id as string,
        capiToken: storeRaw.meta_capi_token as string,
        ...sharedParams,
      }).catch(e => console.error('[CAPI Meta Error]', e))
    }

    // TikTok Events API
    if (storeRaw.tiktok_pixel_id && storeRaw.tiktok_capi_token) {
      sendTikTokCAPIPurchaseEvent({
        pixelId: storeRaw.tiktok_pixel_id as string,
        capiToken: storeRaw.tiktok_capi_token as string,
        ...sharedParams,
      }).catch(e => console.error('[CAPI TikTok Error]', e))
    }

    // Google Measurement Protocol (GA4)
    if (storeRaw.google_tag_id && storeRaw.google_api_secret) {
      sendGoogleCAPIPurchaseEvent({
        measurementId: storeRaw.google_tag_id as string,
        apiSecret: storeRaw.google_api_secret as string,
        eventId: orderId,
        orderId,
        value: order.total,
        currency: 'XOF',
        contentName: product.name,
      }).catch(e => console.error('[CAPI Google Error]', e))
    }
  }

  return { confirmed: true, status: newStatus }
}
