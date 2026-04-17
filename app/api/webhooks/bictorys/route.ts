import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyBictorysWebhook, BictorysWebhookPayload } from '@/lib/payments/bictorys/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'
import { confirmB2BAssetPurchase } from '@/lib/payments/confirmB2BAssetPurchase'
import { confirmTip } from '@/lib/payments/confirmTip'
import { triggerPurchasePixels } from '@/lib/tracking/trigger-pixels'

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
      if (paymentReference.startsWith('B2B_')) {
         await confirmB2BAssetPurchase(paymentReference)
         console.log(`[Bictorys Webhook] Paiement B2B validé pour: ${paymentReference}`)
      } else if (paymentReference.startsWith('TIP_')) {
         await confirmTip(paymentReference)
         console.log(`[Bictorys Webhook] Tip/Don payé: ${paymentReference}`)
      } else {
         await confirmOrder(paymentReference)
         console.log(`[Bictorys Webhook] Paiement validé pour la commande: ${paymentReference}`)
         triggerPurchasePixels(paymentReference).catch(e => console.error('[CAPI Trigger Bictorys Error]', e))
      }
    } else if (status === 'failed' || status === 'canceled') {
      if (paymentReference.startsWith('B2B_')) {
         console.log(`[Bictorys Webhook] Paiement B2B annulé/échoué pour: ${paymentReference}`)
      } else {
         const supabase = createAdminClient()
         await supabase.from('Order').update({ status: 'cancelled' }).eq('id', paymentReference)
         console.log(`[Bictorys Webhook] Paiement annulé/échoué pour la commande: ${paymentReference}`)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-bictorys' }, 'error')
    console.error('[Bictorys Webhook] Erreur serveur:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

