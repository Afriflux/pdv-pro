import { NextResponse } from 'next/server'
import { captureError } from '@/lib/monitoring'
import { verifyPaytechWebhook, PaytechWebhookPayload } from '@/lib/payments/paytech/webhook'
import { confirmOrder } from '@/lib/payments/confirmOrder'

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
    
    // 1. Vérification cryptographique stricte
    const isValid = await verifyPaytechWebhook(payload, env)
    if (!isValid) {
      console.error('[Paytech Webhook] Tentative de fraude ignorée - Hash invalide')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type_event, ref_command, token } = payload as unknown as PaytechWebhookPayload

    // 2. Traitement BDD via confirmOrder
    if (type_event === 'sale_complete') {
      await confirmOrder(ref_command, token)
      console.log(`[Paytech Webhook] Paiement validé et exécuté pour la commande: ${ref_command}`)
    } else if (type_event === 'sale_canceled') {
      // Pour une annulation, un appel simple ou l'ignorer
      console.log(`[Paytech Webhook] Paiement annulé pour la commande: ${ref_command}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    captureError(error, { context: 'webhook-paytech' }, 'error')
    console.error('[Paytech Webhook] Erreur serveur:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

