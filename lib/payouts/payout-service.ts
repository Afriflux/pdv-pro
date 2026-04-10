import { getIntegrationKey } from '../payments/routing'
import { triggerSystemAlertTelegram } from '../telegram/notify-hooks'

interface PayoutResult {

  success: boolean
  transactionId?: string
  error?: string
}

/**
 * Envoie un paiement via Wave Payout API
 * Doc : https://docs.wave.com/api/v1/payouts
 */
export async function sendWavePayout(params: {
  phone: string       // Numéro du vendeur (format international +221...)
  amount: number      // Montant en FCFA
  reference: string   // ID du withdrawal pour traçabilité
}): Promise<PayoutResult> {
  const apiKey = await getIntegrationKey('WAVE_API_KEY', 'prod')
  if (!apiKey) {
    console.error('[Payout] WAVE_API_KEY manquante')
    return { success: false, error: 'Clé API Wave non configurée' }
  }

  try {
    const response = await fetch('https://api.wave.com/v1/payout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'XOF',
        receive_amount: params.amount,
        mobile: params.phone,
        client_reference: params.reference,
        name: 'Yayyam - Retrait',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Payout Wave] Erreur:', errorText)
      return { success: false, error: `Wave API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, transactionId: data.id || data.transaction_id }
  } catch (error) {
    console.error('[Payout Wave] Exception:', error)
    return { success: false, error: 'Erreur réseau Wave' }
  }
}

/**
 * Envoie un paiement via CinetPay Transfer API
 */
export async function sendCinetPayPayout(params: {
  phone: string
  amount: number
  reference: string
}): Promise<PayoutResult> {
  const apiKey = await getIntegrationKey('CINETPAY_API_KEY', 'prod')
  const siteId = await getIntegrationKey('CINETPAY_SITE_ID', 'prod')
  
  if (!apiKey || !siteId) {
    console.error('[Payout] CINETPAY credentials manquantes')
    return { success: false, error: 'Clé API CinetPay non configurée' }
  }

  try {
    const response = await fetch('https://api-checkout.cinetpay.com/v2/transfer/money/send/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: params.reference,
        amount: params.amount,
        currency: 'XOF',
        receiver: params.phone,
        sending_country: 'SN',
        payment_method: 'MOBILE_MONEY',
      }),
    })

    const data = await response.json()
    if (data.code === '00' || data.code === 200) {
      return { success: true, transactionId: data.data?.transaction_id }
    }
    return { success: false, error: data.message || data.description || 'Erreur CinetPay' }
  } catch (error) {
    console.error('[Payout CinetPay] Exception:', error)
    return { success: false, error: 'Erreur réseau CinetPay' }
  }
}

/**
 * Envoie un paiement via Bictorys Disbursements
 */
export async function sendBictorysPayout(params: {
  phone: string
  amount: number
  reference: string
}): Promise<PayoutResult> {
  const apiKey = await getIntegrationKey('BICTORYS_SECRET_KEY', 'prod')
  
  if (!apiKey) {
    console.error('[Payout] BICTORYS_SECRET_KEY manquante')
    return { success: false, error: 'Clé API Bictorys non configurée' }
  }

  try {
    const response = await fetch('https://api.bictorys.com/pay/v1/disbursements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        paymentReference: params.reference,
        amount: params.amount,
        currency: 'XOF',
        destinationPhoneNumber: params.phone,
        description: 'Yayyam Retrait',
      }),
    })

    const data = await response.json()
    if (response.ok && data.status !== 'failed') {
      return { success: true, transactionId: data.id || data.paymentReference }
    }
    return { success: false, error: data.message || 'Erreur Bictorys' }
  } catch (error) {
    console.error('[Payout Bictorys] Exception:', error)
    return { success: false, error: 'Erreur réseau Bictorys' }
  }
}

/**
 * Envoie un paiement via PayTech Transfer
 */
export async function sendPaytechPayout(params: {
  phone: string
  amount: number
  reference: string
}): Promise<PayoutResult> {
  const apiKey = await getIntegrationKey('PAYTECH_API_KEY', 'prod')
  const apiSecret = await getIntegrationKey('PAYTECH_API_SECRET', 'prod')
  
  if (!apiKey || !apiSecret) {
    return { success: false, error: 'Clé API PayTech non configurée' }
  }

  try {
    const response = await fetch('https://paytech.sn/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': apiKey,
        'API_SECRET': apiSecret
      },
      body: JSON.stringify({
        item_price: params.amount,
        currency: 'XOF',
        phone: params.phone,
        command_name: 'Retrait Yayyam',
        ref_command: params.reference
      }),
    })

    const data = await response.json()
    if (data.success === 1 || data.success === true) {
      return { success: true, transactionId: data.token || params.reference }
    }
    return { success: false, error: data.error?.[0] || 'Erreur PayTech' }
  } catch (error) {
    console.error('[Payout PayTech] Exception:', error)
    return { success: false, error: 'Erreur réseau PayTech' }
  }
}

/**
 * Moteur de Décaissement : Choisit la meilleure passerelle selon le profil du compte (Smart Payout)
 * Par exemple, tout ce qui est vers 'wave' est exécuté pures par l'API Wave, le reste via PayTech ou Bictorys.
 */
export async function executePayout(params: {
  phone: string
  amount: number
  reference: string
  method: string   // 'wave' | 'orange_money' | 'free_money' | 'bank'
}): Promise<PayoutResult> {
  const method = params.method.toLowerCase()
  
  console.log(`🚀 [Payout Engine] Lancement du retrait de ${params.amount} FCFA vers ${params.phone} via ${method}`)

  if (method === 'wave') {
    return await sendWavePayout(params)
  }
  
  if (method === 'orange_money' || method === 'free_money') {
    // Ordre de priorité intelligent pour les agrégateurs :
    // 1. Tenter Bictorys
    let result = await sendBictorysPayout(params)
    if (result.success) return result
    
    console.warn(`[Payout Engine] Bictorys a échoué. Tentative de secours (Fallback) sur PayTech pour ${params.phone}...`)
    triggerSystemAlertTelegram('Chute de la Passerelle Bictorys', `Un retrait de ${params.amount} FCFA vers ${params.phone} a échoué. Bascule de secours automatique vers PayTech initiée.\nErreur Bictorys: ${result.error}`)
    
    // 2. Si Bictorys échoue (ex: fonds insuffisants sur l'agrégateur), fallback PayTech
    result = await sendPaytechPayout(params)
    if (result.success) return result
    
    console.warn(`[Payout Engine] PayTech a échoué. Tentative finale (Fallback) sur CinetPay pour ${params.phone}...`)
    triggerSystemAlertTelegram('Chute de la Passerelle PayTech', `La bascule de secours PayTech a échoué. Tentative finale avec CinetPay pour le retrait de ${params.amount} FCFA vers ${params.phone}.\nErreur PayTech: ${result.error}`)
    
    // 3. Fallback ultime Cinetpay
    return await sendCinetPayPayout(params)
  }

  // Pour les virements bancaires (bank), PayTech ou Bictorys peuvent gérér selon l'implémentation.
  // Par défaut, nous tenterons CinetPay ou Bictorys.
  if (method === 'bank') {
     return await sendBictorysPayout(params) // Bictorys supporte les IBAN plus tard.
  }

  return { success: false, error: `La méthode de retrait '${method}' n'est pas routable actuellement.` }
}
