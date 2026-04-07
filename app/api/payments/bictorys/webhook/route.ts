import { confirmOrder } from '@/lib/payments/confirmOrder'

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text()

  // 1. Signature check
  // Bictorys usually sends a x-bictorys-signature header
  // const signature = req.headers.get('x-bictorys-signature')
  
  // 2. Parse payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (error: unknown) {
    console.error('[Bictorys Webhook] Erreur parsing JSON:', error)
    return new Response('OK', { status: 200 })
  }

  // 3. Process payment success
  const isSuccess = payload?.status === 'successful' || payload?.event === 'charge.success' || payload?.status === 'SUCCESS' || payload?.event === 'payment.success'
  
  if (isSuccess) {
     const orderId = payload.data?.reference || payload.reference || payload.data?.metadata?.orderId
     const txId = payload.data?.id || payload.transactionId || payload.id
     
     if (!orderId) {
       console.error('[Bictorys Webhook] Reference manquante dans le payload')
       return new Response('OK', { status: 200 })
     }
     
     try {
       await confirmOrder(orderId, txId)
     } catch (error: unknown) {
       console.error(`[Bictorys Webhook] ❌ Erreur confirmOrder pour ${orderId}:`, error)
     }
  }

  return new Response('OK', { status: 200 })
}
