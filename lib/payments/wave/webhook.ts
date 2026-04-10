import crypto from 'crypto'
import { getIntegrationKey } from '../routing'

export interface WaveWebhookPayload {
  type: string // ex: 'checkout_session.completed'
  data: {
    id: string
    amount: string
    checkout_status: 'complete' | 'failed'
    client_reference: string
    currency: string
    payment_status: 'succeeded' | 'failed'
  }
}

export async function verifyWaveWebhook(
  payloadString: string, 
  waveSignatureHeader: string,
  env: 'test' | 'prod'
): Promise<boolean> {
  const webhookSecret = await getIntegrationKey('WAVE_API_SECRET', env)
  
  if (!webhookSecret) {
    console.error(`WAVE_API_SECRET introuvable pour l'env ${env}`)
    return false
  }

  try {
    // Wave header format: "v1,t=1612...83,s=1b1f...9b"
    const parts = waveSignatureHeader.split(',')
    let timestamp = ''
    let signatures: string[] = []

    for (const part of parts) {
      if (part.startsWith('t=')) {
        timestamp = part.substring(2)
      } else if (part.startsWith('s=')) {
        signatures.push(part.substring(2))
      }
    }

    if (!timestamp || signatures.length === 0) {
      return false
    }

    const signedPayload = `${timestamp}${payloadString}`
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex')

    // On vérifie si la signature attendue correspond à l'une des signatures fournies
    return signatures.includes(expectedSignature)
  } catch (error) {
    console.error('Wave Webhook Verification Error:', error)
    return false
  }
}
