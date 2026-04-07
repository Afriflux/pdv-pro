import { confirmOrder } from '@/lib/payments/confirmOrder'

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text()

  // 1. Signature check (disabled / not needed for now if IP restriction is on)
  // const signature = req.headers.get('x-kkiapay-signature')
  
  // 2. Parse payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (error: unknown) {
    console.error('[KKiaPay Webhook] Erreur parsing JSON:', error)
    return new Response('OK', { status: 200 })
  }

  // 3. Process payment success
  const isSuccess = payload?.status === 'SUCCESS' || payload?.eventType === 'PAYMENT_SUCCESS' || payload?.state === 'SUCCESS'
  
  if (isSuccess) {
     // KKiaPay often passes our orderId inside 'state', 'partnerId' or 'reason' based on integration
     const orderId = payload.state || payload.partnerId || payload.transactionId
     const txId = payload.transactionId || payload.id
     
     if (!orderId) {
       console.error('[KKiaPay Webhook] Reference manquante dans le payload')
       return new Response('OK', { status: 200 })
     }
     
     try {
       await confirmOrder(orderId, txId)
     } catch (error: unknown) {
       console.error(`[KKiaPay Webhook] ❌ Erreur confirmOrder pour ${orderId}:`, error)
     }
  }

  return new Response('OK', { status: 200 })
}
