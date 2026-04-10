import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyBictorysWebhook, BictorysWebhookPayload } from '@/lib/payments/bictorys/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'

export async function POST(req: Request) {
  try {
    const rawSecretHeader = req.headers.get('X-Secret-Key')
    if (!rawSecretHeader) {
      return NextResponse.json({ error: 'Missing security header' }, { status: 400 })
    }

    const payload = await req.json() as BictorysWebhookPayload
    const isValid = await verifyBictorysWebhook(rawSecretHeader, 'prod')
    if (!isValid) {
      console.error('[Bictorys Webhook] Tentative de fraude ignorée')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentReference, status } = payload

    if (status === 'succeeded' || status === 'authorized') {
      await confirmOrder(paymentReference)
      console.log(`[Bictorys Webhook] Paiement validé pour la commande: ${paymentReference}`)
    } else if (status === 'failed' || status === 'canceled') {
      const supabase = createAdminClient()
      await supabase.from('Order').update({ status: 'cancelled' }).eq('id', paymentReference)
      console.log(`[Bictorys Webhook] Paiement annulé/échoué pour la commande: ${paymentReference}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-bictorys' }, 'error')
    console.error('[Bictorys Webhook] Erreur serveur:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

