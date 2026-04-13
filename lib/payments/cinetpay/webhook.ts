import _crypto from 'crypto'
import { getIntegrationKey } from '../routing'

export interface CinetpayWebhookPayload {
  cpm_trans_id: string
  cpm_site_id: string
  cpm_trans_date: string
  cpm_amount: string
  cpm_currency: string
  signature: string // Ou utilisation de X-TOKEN
  cpm_result: string // '00' succes
  cpm_error_message: string
}

export async function verifyCinetpayWebhook(
  xToken: string,
  payload: any,
  env: 'test' | 'prod'
): Promise<boolean> {
  try {
    const apiKey = await getIntegrationKey('CINETPAY_API_KEY', env)
    const siteId = await getIntegrationKey('CINETPAY_SITE_ID', env)
    
    if (!apiKey || !siteId) {
      console.error(`CINETPAY_API_KEY introuvable pour l'env ${env}`)
      return false
    }

    // Le check de sécurité Cinetpay repose sur le Secret X-TOKEN HMAC généré et transmis au webhook
    // ou alors la contre-vérification via leur API check status
    // Par souci de sécurité ultime, la bonne pratique est de faire une requête check API
    
    const checkRequestBody = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: payload.cpm_trans_id
    }
    
    const checkResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkRequestBody)
    })
    
    const checkData = await checkResponse.json()
    
    // cpm_result == "00" signifie Succès Confirmé
    if (checkData.code === "00" && checkData.data && checkData.data.status === "ACCEPTED") {
      return true
    }

    return false
  } catch (error) {
    console.error('CinetPay Webhook Verification Error:', error)
    return false
  }
}
