import { getIntegrationKey } from '../routing'

export interface BictorysWebhookPayload {
  paymentReference: string
  status: 'succeeded' | 'authorized' | 'failed' | 'canceled'
  amount: number
  currency: string
}

export async function verifyBictorysWebhook(
  incomingSecretKeyHeader: string,
  env: 'test' | 'prod'
): Promise<boolean> {
  const expectedWebhookSecret = await getIntegrationKey('BICTORYS_WEBHOOK_SECRET', env)
  
  if (!expectedWebhookSecret) {
    console.error(`BICTORYS_WEBHOOK_SECRET introuvable pour l'env ${env}`)
    return false
  }

  // Vérification stricte
  if (incomingSecretKeyHeader === expectedWebhookSecret) {
    return true
  }

  console.error('Bictorys Webhook Verification Failed: mismatch on X-Secret-Key header')
  return false
}
