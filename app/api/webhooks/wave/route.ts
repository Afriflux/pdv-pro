import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyWaveWebhook, WaveWebhookPayload } from '@/lib/payments/wave/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'

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

    const payload = JSON.parse(rawBody) as WaveWebhookPayload
    const { type, data } = payload
    
    // Wave envoie `checkout_session.completed` lorsque la session de paiement réussit
    if (type !== 'checkout_session.completed') {
      return NextResponse.json({ message: 'Unhandled event type' }, { status: 200 })
    }

    const orderId = data.client_reference

    if (data.payment_status === 'succeeded') {
      await confirmOrder(orderId)
      console.log(`[Wave Webhook] Paiement validé pour la commande: ${orderId}`)
    } else {
      const supabase = createAdminClient()
      await supabase.from('Order').update({ status: 'cancelled' }).eq('id', orderId)
      console.log(`[Wave Webhook] Paiement échoué pour la commande: ${orderId}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-wave' }, 'error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

