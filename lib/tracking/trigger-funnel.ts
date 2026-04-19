import { prisma } from '@/lib/prisma'
import {
  sendMetaCAPIViewContentEvent,
  sendMetaCAPIInitiateCheckoutEvent,
  sendTikTokCAPIViewContentEvent,
  sendTikTokCAPIInitiateCheckoutEvent,
} from './capi'

/**
 * Déclenche les événements CAPI ViewContent côté serveur.
 * Appelé dans la page produit (server component) pour garantir le tracking
 * même si les ad-blockers empêchent les pixels navigateur.
 */
export async function triggerViewContentCAPI(
  productId: string,
  storeId: string,
  clientIp?: string,
  clientUserAgent?: string
) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        meta_pixel_id: true,
        meta_capi_token: true,
        tiktok_pixel_id: true,
        tiktok_capi_token: true,
      }
    })

    if (!store) return

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, price: true }
    })

    if (!product) return

    // Unique event ID pour déduplication avec le pixel client-side
    const eventId = `vc_${productId}_${Date.now()}`

    const promises: Promise<boolean>[] = []

    if (store.meta_pixel_id && store.meta_capi_token) {
      promises.push(
        sendMetaCAPIViewContentEvent({
          pixelId: store.meta_pixel_id,
          capiToken: store.meta_capi_token,
          eventId,
          contentName: product.name,
          contentId: productId,
          value: product.price,
          clientIp,
          clientUserAgent,
        }).catch(e => { console.error('[CAPI ViewContent Meta]', e); return false })
      )
    }

    if (store.tiktok_pixel_id && store.tiktok_capi_token) {
      promises.push(
        sendTikTokCAPIViewContentEvent({
          pixelId: store.tiktok_pixel_id,
          capiToken: store.tiktok_capi_token,
          eventId,
          contentName: product.name,
          contentId: productId,
          value: product.price,
          clientIp,
          clientUserAgent,
        }).catch(e => { console.error('[CAPI ViewContent TikTok]', e); return false })
      )
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  } catch (error) {
    console.error('[triggerViewContentCAPI] Erreur:', error)
  }
}

/**
 * Déclenche les événements CAPI InitiateCheckout côté serveur.
 * Appelé dans le route checkout/initiate pour garantir le tracking
 * des intentions d'achat même sans pixels navigateur.
 */
export async function triggerInitiateCheckoutCAPI(
  storeId: string,
  productName: string,
  total: number,
  buyerPhone?: string,
  clientIp?: string,
  clientUserAgent?: string
) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        meta_pixel_id: true,
        meta_capi_token: true,
        tiktok_pixel_id: true,
        tiktok_capi_token: true,
      }
    })

    if (!store) return

    const eventId = `ic_${storeId}_${Date.now()}`

    const promises: Promise<boolean>[] = []

    if (store.meta_pixel_id && store.meta_capi_token) {
      promises.push(
        sendMetaCAPIInitiateCheckoutEvent({
          pixelId: store.meta_pixel_id,
          capiToken: store.meta_capi_token,
          eventId,
          contentName: productName,
          value: total,
          customerPhone: buyerPhone,
          clientIp,
          clientUserAgent,
        }).catch(e => { console.error('[CAPI InitiateCheckout Meta]', e); return false })
      )
    }

    if (store.tiktok_pixel_id && store.tiktok_capi_token) {
      promises.push(
        sendTikTokCAPIInitiateCheckoutEvent({
          pixelId: store.tiktok_pixel_id,
          capiToken: store.tiktok_capi_token,
          eventId,
          contentName: productName,
          value: total,
          clientIp,
          clientUserAgent,
        }).catch(e => { console.error('[CAPI InitiateCheckout TikTok]', e); return false })
      )
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  } catch (error) {
    console.error('[triggerInitiateCheckoutCAPI] Erreur:', error)
  }
}
