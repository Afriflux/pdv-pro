import { PaymentRequestPayload, PaymentResponse, getIntegrationKey } from '../routing'

export async function createCinetpayPayment(payload: PaymentRequestPayload): Promise<PaymentResponse> {
  try {
    const apiKey = await getIntegrationKey('CINETPAY_API_KEY', payload.env)
    const siteId = await getIntegrationKey('CINETPAY_SITE_ID', payload.env)

    if (!apiKey || !siteId) {
      throw new Error(`Clés API CinetPay non configurées pour l'environnement ${payload.env}`)
    }

    const requestBody = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: payload.orderId,
      amount: payload.amount,
      currency: payload.currency || 'XOF',
      description: payload.description.substring(0, 50),
      notify_url: payload.notifyUrl,
      return_url: payload.returnUrl,
      channels: "ALL", // ALL, MOBILE_MONEY, CREDIT_CARD
      lang: "FR",
      metadata: "Yayyam_Order",
      customer_id: payload.customer.phone || '001',
      customer_name: payload.customer.name,
      customer_surname: payload.customer.name,
      customer_phone_number: payload.customer.phone,
      customer_email: payload.customer.email || 'customer@yayyam.com',
      customer_address: payload.customer.address || 'Local',
      customer_city: payload.customer.city || 'Dakar',
      customer_country: payload.customer.country || 'SN',
      customer_state: payload.customer.country || 'SN',
      customer_zip_code: "00000"
    }

    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    // Cinetpay retourne le code "201" pour CREATED
    if (data.code !== "201") {
      throw new Error(data.description || data.message || 'Erreur lors de la création de la session CinetPay')
    }

    const paymentUrl = data.data?.payment_url
    if (!paymentUrl) {
      throw new Error(`Réponse CinetPay invalide. URL de paiement introuvable dans: ${JSON.stringify(data)}`)
    }

    return {
      success: true,
      paymentUrl: paymentUrl,
      transactionId: data.data?.payment_token
    }
  } catch (error: any) {
    console.error('CinetPay Error:', error)
    return {
      success: false,
      error: error.message || 'CinetPay Error'
    }
  }
}
