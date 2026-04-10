import crypto from 'crypto'
import { getIntegrationKey } from '../routing'

export interface PaytechWebhookPayload {
  type_event: string // ex: 'sale_complete', 'sale_canceled'
  item_price: string
  ref_command: string
  token: string
  api_key_sha256: string
  api_secret_sha256: string
}

/**
 * Valide le Webhook IPN de Paytech 
 * En hachant les données selon l'algorithme officiel: hash('sha256', api_secret) 
 * et hash('sha256', api_key) comparé avec ceux transmis par IPN, ou via le hash composé.
 */
export async function verifyPaytechWebhook(
  payload: Record<string, any>, 
  env: 'test' | 'prod'
): Promise<boolean> {
  try {
    const apiKey = await getIntegrationKey('PAYTECH_API_KEY', env)
    const apiSecret = await getIntegrationKey('PAYTECH_API_SECRET', env)
    
    if (!apiKey || !apiSecret) {
      console.error(`Grave: Clés PayTech manquantes pour vérifier le webhook ${env}.`)
      return false
    }

    // Paytech documente la sécurité IPN ainsi :
    // On reçoit api_key_sha256 et api_secret_sha256
    const expectedApiSecretHash = crypto.createHash('sha256').update(apiSecret).digest('hex')
    const expectedApiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    if (payload.api_key_sha256 === expectedApiKeyHash && payload.api_secret_sha256 === expectedApiSecretHash) {
       return true
    }
    
    return false
  } catch (error) {
    console.error('PayTech Webhook Verification Error:', error)
    return false
  }
}
