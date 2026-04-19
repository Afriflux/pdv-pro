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

    let data
    try {
      const responseText = await response.text()
      data = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(`Bictorys a renvoyé une erreur réseau (non-JSON): ${response.status} ${response.statusText}`)
    }

    if (!response.ok) {
      throw new Error(data.message || data.error?.message || `Bictorys a refusé la transaction (${response.status})`)
    }

    const paymentUrl = data.url || data.data?.url || data.checkoutUrl || data.paymentUrl;

    if (!paymentUrl) {
      throw new Error(`Réponse Bictorys invalide. URL de paiement introuvable dans: ${JSON.stringify(data)}`)
    }

    return {
      success: true,
      paymentUrl: paymentUrl,
      transactionId: data.id || data.data?.id || payload.orderId
    }
  } catch (error: any) {
    console.error('Bictorys Error:', error)
    return {
      success: false,
      error: error.message || 'Bictorys Error'
    }
  }
}
