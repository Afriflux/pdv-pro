import { confirmOrder } from '@/lib/payments/confirmOrder'

// ─── Type du payload Orange Money ────────────────────────────────────────────

interface OrangeWebhookPayload {
  status: number        // 200 = succès
  message: string       // 'Accepted' = succès
  data: {
    order_id: string    // = orderId PDV Pro
    status: string      // 'SUCCESSFULL' = succès
    amount: number
    currency: string
    pay_token: string
    txnid: string       // ID transaction Orange Money
  }
}

// ─── Vérification optionnelle du header Authorization ────────────────────────

/**
 * Orange Money ne signe pas systématiquement les webhooks.
 * Si ORANGE_MONEY_WEBHOOK_SECRET est configuré, on vérifie l'Authorization.
 * Sinon on continue sans vérification (comportement normal en dev Orange).
 */
function verifyOrangeAuthorization(req: Request): boolean {
  const secret = process.env.ORANGE_MONEY_WEBHOOK_SECRET
  if (!secret) {
    // Secret non configuré → on accepte (Orange sandbox ne signe pas)
    return true
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Orange Webhook] Header Authorization absent alors que ORANGE_MONEY_WEBHOOK_SECRET est configuré')
    // On laisse passer : Orange omet parfois ce header même en prod
    return true
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  return token === secret
}

// ─── Handler POST ─────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  // 1. Vérification Authorization (optionnelle — non bloquante)
  if (!verifyOrangeAuthorization(req)) {
    console.warn('[Orange Webhook] Authorization invalide — rejet')
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Parker le body JSON
  let payload: OrangeWebhookPayload
  try {
    payload = (await req.json()) as OrangeWebhookPayload
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'JSON invalide'
    console.error('[Orange Webhook] Erreur parsing JSON:', message)
    // 200 pour éviter les retentatives sur une erreur de format
    return new Response('OK', { status: 200 })
  }

  console.log(
    `[Orange Webhook] Reçu — order_id: ${payload.data?.order_id}, status: ${payload.data?.status}, http_status: ${payload.status}`
  )

  // 3. Vérifier que le paiement est bien validé par Orange
  const isSuccess =
    payload.status === 200 &&
    payload.message === 'Accepted' &&
    payload.data?.status === 'SUCCESSFULL'

  if (!isSuccess) {
    console.log(
      `[Orange Webhook] Paiement non confirmé — statut HTTP: ${payload.status}, data.status: ${payload.data?.status}`
    )
    // 200 silencieux : on ne réessaie pas pour un échec connu
    return new Response('OK', { status: 200 })
  }

  // 4. Extraire l'orderId et le txnid
  const orderId = payload.data.order_id
  const transactionId = payload.data.txnid

  if (!orderId) {
    console.error('[Orange Webhook] order_id manquant dans le payload')
    return new Response('OK', { status: 200 })
  }

  // 5. Confirmer la commande
  try {
    await confirmOrder(orderId, transactionId)
    console.log(
      `[Orange Webhook] ✅ Commande confirmée — orderId: ${orderId}, txnid: ${transactionId}`
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error(`[Orange Webhook] ❌ Erreur confirmOrder pour ${orderId}:`, message)
    // Toujours 200 : les erreurs internes sont traitées séparément (logs / cron)
  }

  return new Response('OK', { status: 200 })
}
