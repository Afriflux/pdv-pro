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
  const apiKey = process.env.WAVE_API_KEY
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
        name: 'Yayyam - Retrait vendeur',
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
 * Envoie un paiement via CinetPay (Orange Money, MTN, etc.)
 * Doc : https://docs.cinetpay.com/api/transfer
 */
export async function sendCinetPayPayout(params: {
  phone: string
  amount: number
  reference: string
}): Promise<PayoutResult> {
  const apiKey = process.env.CINETPAY_API_KEY
  const siteId = process.env.CINETPAY_SITE_ID
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
    return { success: false, error: data.message || 'Erreur CinetPay' }
  } catch (error) {
    console.error('[Payout CinetPay] Exception:', error)
    return { success: false, error: 'Erreur réseau CinetPay' }
  }
}

/**
 * Dispatcher : choisit la bonne passerelle selon le payment_method du withdrawal
 */
export async function executePayout(params: {
  phone: string
  amount: number
  reference: string
  method: string   // 'wave' | 'orange_money' | 'mtn' | 'cinetpay'
}): Promise<PayoutResult> {
  if (params.method === 'wave') {
    return sendWavePayout(params)
  }
  // Tout le reste passe par CinetPay (Orange Money, MTN, Moov)
  return sendCinetPayPayout(params)
}
