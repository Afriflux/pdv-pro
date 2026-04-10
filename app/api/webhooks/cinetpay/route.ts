import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyCinetpayWebhook } from '@/lib/payments/cinetpay/webhook'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmOrder } from '@/lib/payments/confirmOrder'

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

    // "00" = SUCCESS, anything else is a failure
    if (payload.cpm_result === '00') {
      await confirmOrder(transactionId)
      console.log(`[CinetPay Webhook] Paiement validé pour la commande: ${transactionId}`)
    } else {
      const supabase = createAdminClient()
      await supabase.from('Order').update({ status: 'cancelled' }).eq('id', transactionId)
      console.log(`[CinetPay Webhook] Paiement échoué pour la commande: ${transactionId}. Message: ${payload.cpm_error_message}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-cinetpay' }, 'error')
    console.error('[CinetPay Webhook] Erreur serveur:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

