import { PaymentRequestPayload, PaymentResponse, getIntegrationKey } from '../routing'

export async function createPaytechPayment(payload: PaymentRequestPayload): Promise<PaymentResponse> {
  try {
    const apiKey = await getIntegrationKey('PAYTECH_API_KEY', payload.env)
    const apiSecret = await getIntegrationKey('PAYTECH_API_SECRET', payload.env)
    
    if (!apiKey || !apiSecret) {
      throw new Error(`Clés API PayTech non configurées pour l'environnement ${payload.env}`)
    }

    const isTestStr = payload.env === 'test' ? 'test' : 'live'
    
    // Si la méthode était "wave" et qu'on a le fallback Paytech, on peut forcer la vue
    // ou laisser Paytech gérer (en test, Paytech gère).
    
    const requestBody = new URLSearchParams()
    requestBody.append('item_name', payload.description.substring(0, 50))
    requestBody.append('item_price', payload.amount.toString())
    requestBody.append('currency', payload.currency || 'XOF')
    requestBody.append('ref_command', payload.orderId)
    requestBody.append('command_name', `Paiement Yayyam: ${payload.orderId}`)
    requestBody.append('env', isTestStr)
    requestBody.append('ipn_url', payload.notifyUrl)
    requestBody.append('success_url', payload.returnUrl)
    requestBody.append('cancel_url', payload.returnUrl)

    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'API_KEY': apiKey,
        'API_SECRET': apiSecret
      },
      body: requestBody.toString()
    })

    const data = await response.json()

    if (data.success !== 1) {
      throw new Error(data.error?.[0] || 'Erreur lors de la création de la session PayTech')
    }

    return {
      success: true,
      paymentUrl: data.redirect_url,
      transactionId: data.token
    }
  } catch (error: any) {
    console.error('Paytech Error:', error)
    return {
      success: false,
      error: error.message || 'Paytech Error'
    }
  }
}
