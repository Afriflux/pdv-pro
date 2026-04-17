import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyCinetpayWebhook } from '@/lib/payments/cinetpay/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'
import { confirmB2BAssetPurchase } from '@/lib/payments/confirmB2BAssetPurchase'
import { confirmTip } from '@/lib/payments/confirmTip'
import { triggerPurchasePixels } from '@/lib/tracking/trigger-pixels'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const payload: Record<string, string> = {}
    formData.forEach((value, key) => {
      payload[key] = value.toString()
    })

    const xToken = req.headers.get('x-token') || ''

    // Validation via Check-Status
    const isValid = await verifyCinetpayWebhook(xToken, payload, 'prod')
    if (!isValid) {
      console.error('[CinetPay Webhook] Tentative de fraude ignorée - Validation échouée.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = payload.cpm_trans_id

    const webhookLog = await prisma.systemWebhookLog.create({
      data: {
        provider: 'cinetpay',
        payload: payload,
        event_type: payload.cpm_result === '00' ? 'success' : 'failed',
        status: 'pending'
      }
    })

    try {
      // "00" = SUCCESS, anything else is a failure
      if (payload.cpm_result === '00') {
        if (transactionId.startsWith('B2B_')) {
           await confirmB2BAssetPurchase(transactionId)
           console.log(`[CinetPay Webhook] Paiement B2B validé pour: ${transactionId}`)
        } else if (transactionId.startsWith('TIP_')) {
           await confirmTip(transactionId)
           console.log(`[CinetPay Webhook] Tip/Don payé: ${transactionId}`)
        } else {
           await confirmOrder(transactionId)
           console.log(`[CinetPay Webhook] Paiement validé pour la commande: ${transactionId}`)
           triggerPurchasePixels(transactionId).catch(e => console.error('[CAPI Trigger CinetPay Error]', e))
        }
      } else {
        if (transactionId.startsWith('B2B_')) {
           console.log(`[CinetPay Webhook] Paiement B2B échoué pour: ${transactionId}. Message: ${payload.cpm_error_message}`)
        } else {
           const supabase = createAdminClient()
           await supabase.from('Order').update({ status: 'cancelled' }).eq('id', transactionId)
           console.log(`[CinetPay Webhook] Paiement échoué pour la commande: ${transactionId}. Message: ${payload.cpm_error_message}`)
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
    captureError(error, { context: 'webhook-cinetpay' }, 'error')
    console.error('[CinetPay Webhook] Erreur serveur:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

