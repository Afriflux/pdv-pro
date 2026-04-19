import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyPaytechWebhook, PaytechWebhookPayload } from '@/lib/payments/paytech/webhook'
import { confirmOrder } from '@/lib/payments/confirmOrder'
import { confirmB2BAssetPurchase } from '@/lib/payments/confirmB2BAssetPurchase'
import { confirmTip } from '@/lib/payments/confirmTip'
import { triggerPurchasePixels } from '@/lib/tracking/trigger-pixels'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    // Parse form data to payload object
    const payload: Record<string, string> = {}
    formData.forEach((value, key) => {
      payload[key] = value.toString()
    })

    // Paytech logs environment? Defaulting to production verification if not explicitly passed
    const env = payload.env === 'test' ? 'test' : 'prod'
    
    const isValid = await verifyPaytechWebhook(payload, env)
    if (!isValid) {
      console.error('[Paytech Webhook] Tentative de fraude ignorée - Hash invalide')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type_event, ref_command, token } = payload as unknown as PaytechWebhookPayload

    const webhookLog = await prisma.systemWebhookLog.create({
      data: {
        provider: 'paytech',
        payload: payload,
        event_type: type_event || null,
        status: 'pending'
      }
    })

    try {
      // 2. Traitement BDD via confirmOrder
      if (type_event === 'sale_complete') {
        if (ref_command.startsWith('B2B_')) {
           await confirmB2BAssetPurchase(ref_command)
           console.log(`[Paytech Webhook] Paiement B2B validé et exécuté pour: ${ref_command}`)
        } else if (ref_command.startsWith('TIP_')) {
           await confirmTip(ref_command)
           console.log(`[Paytech Webhook] Tip/Don payé: ${ref_command}`)
        } else {
           await confirmOrder(ref_command, token)
           console.log(`[Paytech Webhook] Paiement validé et exécuté pour la commande: ${ref_command}`)
           triggerPurchasePixels(ref_command).catch(e => console.error('[CAPI Trigger Paytech Error]', e))
        }
      } else if (type_event === 'sale_canceled') {
        // Pour une annulation, mettre à jour le statut de la commande
        if (ref_command.startsWith('B2B_')) {
           console.log(`[Paytech Webhook] Paiement B2B annulé pour: ${ref_command}`)
        } else {
           const { createAdminClient } = await import('@/lib/supabase/admin')
           const supabase = createAdminClient()
           await supabase.from('Order').update({ status: 'cancelled' }).eq('id', ref_command)
           console.log(`[Paytech Webhook] Paiement annulé pour la commande: ${ref_command}`)
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
    captureError(error, { context: 'webhook-paytech' }, 'error')
    console.error('[Paytech Webhook] Erreur serveur:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

