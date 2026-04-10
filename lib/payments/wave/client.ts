import { PaymentRequestPayload, PaymentResponse, getIntegrationKey } from '../routing'

export async function createWavePayment(payload: PaymentRequestPayload): Promise<PaymentResponse> {
  try {
    const apiKey = await getIntegrationKey('WAVE_API_KEY', payload.env)
    
    if (!apiKey) {
      throw new Error(`Clé d'API Wave non configurée pour l'environnement ${payload.env}`)
    }

    const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: payload.amount.toString(),
        currency: payload.currency || 'XOF',
        error_url: payload.returnUrl,
        success_url: payload.returnUrl,
        client_reference: payload.orderId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la création de la session Wave')
    }

    return {
      success: true,
      paymentUrl: data.wave_launch_url,
      transactionId: data.id // checkout session id
    }
  } catch (error: any) {
    console.error('Wave Error:', error)
    return {
      success: false,
      error: error.message || 'Wave Error'
    }
  }
}
