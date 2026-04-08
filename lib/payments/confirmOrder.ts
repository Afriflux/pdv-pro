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
import { sendMetaCAPIPurchaseEvent } from '@/lib/tracking/capi'
import { 
  triggerNewOrderTelegram, 
  triggerPaymentTelegram 
} from '@/lib/telegram/notify-hooks'
import { triggerAffiliateCommission } from '@/lib/affiliation/commission-hook'
import { triggerAmbassadorCommission } from '@/lib/affiliation/ambassador-hook'
import { sendSaleNotification } from '@/lib/telegram/community-service'

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

interface WalletRow {
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
    .select('id, store_id, product_id, vendor_amount, total, status, buyer_name, buyer_phone, delivery_address, payment_method, affiliate_token, affiliate_amount')
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
    .select('user_id, name, meta_pixel_id, meta_capi_token')
    .eq('id', order.store_id)
    .single()

  const store: StoreRow | null = storeRaw
    ? {
        user_id: storeRaw.user_id as string,
        name:    storeRaw.name    as string,
      }
    : null

  const isDigital = product.type === 'digital'

  // ── 4. Mettre à jour le statut de commande ────────────────────────────────
  const newStatus = isDigital ? 'completed' : 'confirmed'

  await supabase
    .from('Order')
    .update({
      status:      newStatus,
      payment_ref: paymentRef ?? null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', orderId)

  // ── 5. Créditer le wallet vendeur ─────────────────────────────────────────
  const { data: wallet } = await supabase
    .from('Wallet')
    .select('id, balance, pending, total_earned')
    .eq('vendor_id', order.store_id)
    .single<WalletRow>()

  if (wallet) {
    await supabase
      .from('Wallet')
      .update({
        // Tous les paiements en ligne confirmés vont directement dans la balance
        balance:      wallet.balance + order.vendor_amount,
        total_earned: wallet.total_earned + order.vendor_amount,
        // pending n'est pas touché ici (réservé au COD)
      })
      .eq('id', wallet.id)
  } else {
    await supabase.from('Wallet').insert({
      vendor_id:    order.store_id,
      balance:      order.vendor_amount,
      total_earned: order.vendor_amount,
      pending:      0,
    })
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
    } catch (err) {
      console.error('[confirmOrder] Erreur création facture:', err)
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
            const { sendFirstSaleEmail } = await import('@/lib/brevo/brevo-service')
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

        console.log('[confirmOrder] DigitalAccess créé:', access.token, '→ WhatsApp envoyé')
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

  // ── 10. Meta CAPI Server-Side Tracking ────────────────────────────────────
  if (storeRaw && storeRaw.meta_pixel_id && storeRaw.meta_capi_token) {
    sendMetaCAPIPurchaseEvent({
      pixelId: storeRaw.meta_pixel_id as string,
      capiToken: storeRaw.meta_capi_token as string,
      eventId: orderId,
      orderId: orderId,
      value: order.total,
      currency: 'XOF',
      contentName: product.name,
      customerPhone: order.buyer_phone,
      customerName: order.buyer_name
    }).catch(e => console.error('[CAPI IPN Error]', e))
  }

  return { confirmed: true, status: newStatus }
}
