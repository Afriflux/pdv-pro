import { prisma } from '@/lib/prisma'
import {
  sendMetaCAPIPurchaseEvent,
  sendTikTokCAPIPurchaseEvent,
  sendGoogleCAPIPurchaseEvent
} from './capi'

/**
 * Fonctions unifiées pour déclencher l'ensemble des Pixels CAPI Server-Side configurés par le vendeur.
 * Doit être appelé lors de la validation asynchrone (Webhooks) ou synchrone de toute commande.
 */
export async function triggerPurchasePixels(orderId: string, clientIp?: string, clientUserAgent?: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { select: { name: true } },
        store: {
          select: {
            meta_pixel_id: true,
            meta_capi_token: true,
            tiktok_pixel_id: true,
            tiktok_capi_token: true,
            google_tag_id: true,
            google_api_secret: true,
          }
        }
      }
    })

    if (!order || !order.store) return;

    const {
      total, buyer_name, buyer_phone, buyer_email, product
    } = order
    const store = order.store

    const promises: Promise<boolean>[] = []

    // 1. Meta (Facebook)
    if (store.meta_pixel_id && store.meta_capi_token) {
      promises.push(
        sendMetaCAPIPurchaseEvent({
          pixelId: store.meta_pixel_id,
          capiToken: store.meta_capi_token,
          eventId: order.id,
          orderId: order.id,
          value: total,
          currency: 'XOF', // Géré globalement (ou dynamique basé sur order si on stockait la devise)
          contentName: product?.name || 'Produit',
          customerPhone: buyer_phone || undefined,
          customerEmail: buyer_email || undefined,
          customerName: buyer_name || undefined,
          clientIp,
          clientUserAgent
        }).catch(e => { console.error('[triggerPurchasePixels] Meta Error:', e); return false })
      )
    }

    // 2. TikTok
    if (store.tiktok_pixel_id && store.tiktok_capi_token) {
      promises.push(
        sendTikTokCAPIPurchaseEvent({
          pixelId: store.tiktok_pixel_id,
          capiToken: store.tiktok_capi_token,
          eventId: order.id,
          orderId: order.id,
          value: total,
          currency: 'XOF',
          contentName: product?.name || 'Produit',
          customerPhone: buyer_phone || undefined,
          customerEmail: buyer_email || undefined,
          clientIp,
          clientUserAgent
        }).catch(e => { console.error('[triggerPurchasePixels] TikTok Error:', e); return false })
      )
    }

    // 3. Google (GA4 Measurement Protocol)
    if (store.google_tag_id && store.google_api_secret) {
      promises.push(
        sendGoogleCAPIPurchaseEvent({
          measurementId: store.google_tag_id,
          apiSecret: store.google_api_secret,
          eventId: order.id,
          orderId: order.id,
          value: total,
          currency: 'XOF',
          contentName: product?.name || 'Produit'
        }).catch(e => { console.error('[triggerPurchasePixels] Google Error:', e); return false })
      )
    }

    // Attendre l'envoi de tous les requêtes CAPI sans interrompre la routine en cas d'erreur isolée.
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }

  } catch (error) {
    console.error('[triggerPurchasePixels] Erreur globale lors du déclenchement :', error)
  }
}
