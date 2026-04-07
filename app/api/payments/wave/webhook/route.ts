import { createHmac } from 'crypto'
import { confirmOrder } from '@/lib/payments/confirmOrder'

// ─── Vérification signature Wave ──────────────────────────────────────────────

/**
 * Vérifie la signature HMAC-SHA256 envoyée par Wave dans le header Wave-Signature.
 * Le secret utilisé est WAVE_API_SECRET (différent de WAVE_API_KEY).
 */
function verifyWaveSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.WAVE_API_SECRET ?? ''
  if (!secret) {
    console.error('[Wave Webhook] WAVE_API_SECRET non configuré')
    return false
  }
  const computed = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return computed === signature
}

// ─── Type du payload Wave ─────────────────────────────────────────────────────

interface WaveWebhookPayload {
  type: string
  data: {
    id: string
    checkout_status: 'complete' | 'processing' | 'error'
    client_reference: string // = orderId Yayyam
    amount: string
    currency: string
  }
}

// ─── Handler POST ─────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  // 1. Lire le body brut (nécessaire pour vérifier la signature avant de parser)
  const rawBody = await req.text()

  // 2. Vérifier la signature Wave
  const signature = req.headers.get('Wave-Signature') ?? ''

  if (!signature) {
    // console.warn('[Wave Webhook] Header Wave-Signature absent')
    return new Response('Signature manquante', { status: 401 })
  }

  if (!verifyWaveSignature(rawBody, signature)) {
    // console.warn('[Wave Webhook] Signature invalide')
    return new Response('Signature invalide', { status: 401 })
  }

  // 3. Parser le payload JSON
  let payload: WaveWebhookPayload
  try {
    payload = JSON.parse(rawBody) as WaveWebhookPayload
  } catch (error: unknown) {

    console.error('[Wave Webhook] Erreur parsing JSON:', error)
    // Retourner 200 pour éviter les retentatives Wave (l'erreur est côté format)
    return new Response('OK', { status: 200 })
  }

  // 4. Ignorer les événements non finalisés
  if (payload.data.checkout_status !== 'complete') {
    // console.log(
    //   `[Wave Webhook] Statut ignoré : ${payload.data.checkout_status} pour ${payload.data.client_reference}`
    // )
    return new Response('OK', { status: 200 })
  }

  // 5. Extraire l'orderId depuis client_reference
  const orderId = payload.data.client_reference
  const transactionId = payload.data.id

  if (!orderId) {
    console.error('[Wave Webhook] client_reference manquant dans le payload')
    return new Response('OK', { status: 200 })
  }

  // 6. Confirmer la commande
  try {
    await confirmOrder(orderId, transactionId)
    // console.log(`[Wave Webhook] ✅ Commande confirmée — orderId: ${orderId}, txId: ${transactionId}`)
  } catch (error: unknown) {

    console.error(`[Wave Webhook] ❌ Erreur confirmOrder pour ${orderId}:`, error)
    // Toujours 200 : Wave ne réessaie pas si on renvoie 200.
    // Les erreurs internes sont loggées et traitées séparément.
  }

  return new Response('OK', { status: 200 })
}
