import { PaymentRequestPayload, PaymentResponse, getIntegrationKey } from '../routing'

export async function createMonerooPayment(payload: PaymentRequestPayload): Promise<PaymentResponse> {
  try {
    const secretKey = await getIntegrationKey('MONEROO_SECRET_KEY', payload.env)
    
    if (!secretKey) {
      throw new Error(`Clé Secrète Moneroo non configurée (env: ${payload.env})`)
    }

    // Moneroo demande un parsing basique du firstName / lastName
    const nameParts = (payload.customer.name || 'Client').trim().split(' ')
    const firstName = nameParts[0] || 'Client'
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Yayyam'

    const response = await fetch('https://api.moneroo.io/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency || 'XOF',
        description: payload.description || `Commande ${payload.orderId}`,
        customer: {
          email: payload.customer.email || 'acheteur@yayyam.com',
          first_name: firstName,
          last_name: lastName,
          phone: payload.customer.phone
        },
        return_url: payload.returnUrl,
        metadata: {
          order_id: payload.orderId
        }
      })
    })

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error(`Erreur réseau Moneroo: HTML ou réponse invalide (${response.status})`)
    }

    if (!response.ok || !data.data?.checkout_url) {
      throw new Error(data.message || data.error?.message || 'Erreur lors de l\'initialisation Moneroo')
    }

    return {
      success: true,
      paymentUrl: data.data.checkout_url,
      transactionId: data.data.id
    }

  } catch (error: any) {
    console.error('Moneroo Error:', error)
    return {
      success: false,
      error: error.message || 'Erreur inconnue Moneroo'
    }
  }
}
