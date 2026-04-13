import { PaymentRequestPayload, PaymentResponse, getIntegrationKey } from '../routing'

export async function createBictorysPayment(payload: PaymentRequestPayload): Promise<PaymentResponse> {
  try {
    const apiSecretKey = await getIntegrationKey('BICTORYS_SECRET_KEY', payload.env)
    
    if (!apiSecretKey) {
      throw new Error(`Clé API Bictorys non configurée pour l'environnement ${payload.env}`)
    }

    const baseUrl = payload.env === 'test' ? 'https://api.test.bictorys.com' : 'https://api.bictorys.com'
    
    // Acheminer directement vers le mode Wave si la méthode est 'wave'
    let endpointUrl = `${baseUrl}/pay/v1/charges`
    if (payload.method === 'wave') {
      endpointUrl += '?payment_type=wave'
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiSecretKey
      },
      body: JSON.stringify({
        paymentReference: payload.orderId,
        amount: payload.amount.toString(),
        currency: payload.currency || 'XOF',
        successRedirectUrl: payload.returnUrl,
        errorRedirectUrl: payload.returnUrl
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la création de la session Bictorys')
    }

    // Le backend Bictorys renvoie l'objet charge qui contient l'URL de paiement ou les détails
    // Bictorys structure généralement `data.checkoutUrl` ou `data.paymentUrl`
    return {
      success: true,
      paymentUrl: data.checkoutUrl || data.paymentUrl || payload.returnUrl, // Fallback returnUrl si api direct mode utilisé.
      transactionId: data.id || payload.orderId
    }
  } catch (error: any) {
    console.error('Bictorys Error:', error)
    return {
      success: false,
      error: error.message || 'Bictorys Error'
    }
  }
}
