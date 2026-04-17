import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyWaveWebhook, WaveWebhookPayload } from '@/lib/payments/wave/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'
import { confirmB2BAssetPurchase } from '@/lib/payments/confirmB2BAssetPurchase'
import { confirmTip } from '@/lib/payments/confirmTip'
import { triggerPurchasePixels } from '@/lib/tracking/trigger-pixels'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const signatureHeader = req.headers.get('wave-signature')
    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing wave-signature' }, { status: 400 })
    }

    // Must read raw body as a string to verify HMAC correctly
    const rawBody = await req.text()
    
    // Test ou Prod (à identifier si l'env global Yayyam est stocké, on met 'prod' par défaut pour les webhooks live)
    const isValid = await verifyWaveWebhook(rawBody, signatureHeader, 'prod')
    if (!isValid) {
      console.error('[Wave Webhook] Signature invalide')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let parsedPayload: any;
    try { parsedPayload = JSON.parse(rawBody) } catch(e) { parsedPayload = { rawBody } }

    const webhookLog = await prisma.systemWebhookLog.create({
      data: {
        provider: 'wave',
        payload: parsedPayload,
        status: 'pending'
      }
    })

    try {
      const payload = JSON.parse(rawBody) as WaveWebhookPayload
      const { type, data } = payload
      
      await prisma.systemWebhookLog.update({
        where: { id: webhookLog.id },
        data: { event_type: type }
      })
      
      // Wave envoie `checkout_session.completed` lorsque la session de paiement réussit
      if (type !== 'checkout_session.completed') {
        await prisma.systemWebhookLog.update({ where: { id: webhookLog.id }, data: { status: 'completed', processed_at: new Date() }})
        return NextResponse.json({ message: 'Unhandled event type' }, { status: 200 })
      }

      const orderId = data.client_reference // usually starts with ORD_ or B2B_

      if (data.payment_status === 'succeeded') {
        if (orderId.startsWith('B2B_')) {
           await confirmB2BAssetPurchase(orderId)
           console.log(`[Wave Webhook] B2B Asset payé: ${orderId}`)
        } else if (orderId.startsWith('TIP_')) {
           await confirmTip(orderId)
           console.log(`[Wave Webhook] Tip/Don payé: ${orderId}`)
        } else {
           await confirmOrder(orderId)
           console.log(`[Wave Webhook] Paiement validé pour la commande: ${orderId}`)
           triggerPurchasePixels(orderId).catch(e => console.error('[CAPI Trigger Wave Error]', e))
        }
      } else {
        if (orderId.startsWith('B2B_')) {
           console.log(`[Wave Webhook] Paiement B2B échoué: ${orderId}`)
        } else {
           const supabase = createAdminClient()
           await supabase.from('Order').update({ status: 'cancelled' }).eq('id', orderId)
           console.log(`[Wave Webhook] Paiement échoué pour la commande: ${orderId}`)
        }
      }

      await prisma.systemWebhookLog.update({ where: { id: webhookLog.id }, data: { status: 'completed', processed_at: new Date() }})
    } catch (err: any) {
      await prisma.systemWebhookLog.update({ 
        where: { id: webhookLog.id }, 
        data: { status: 'failed', error_msg: err.message || 'Unknown processing error', processed_at: new Date() }
      })
      throw err;
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-wave' }, 'error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

