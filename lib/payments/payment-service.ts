// ─── Types unifiés ────────────────────────────────────────────────────────────

import { getIntegrationKey } from './routing'

export type PaymentMethod = 'wave' | 'bictorys' | 'paytech' | 'cinetpay' | 'moneroo'

export interface PaymentIntent {
  orderId: string
  amount: number
  method: PaymentMethod
  vendorAmount: number
  fees: number
  currency: 'XOF'
  customerPhone?: string
  customerEmail?: string
  redirectUrl: string
  webhookUrl: string
}

export interface WavePaymentStatus {
  status: 'completed' | 'pending' | 'failed'
  amount: number
  transactionId: string
}



// ─── Réponse Wave Session ──────────────────────────────────────────────────────

interface WaveCheckoutSession {
  id: string
  wave_launch_url: string
  client_reference: string
  amount: string
  currency: string
  checkout_status: string
}

// ─── Réponse Orange Money WebPay ──────────────────────────────────────────────

interface _OrangeWebPayResponse {
  status: number
  message: string
  data: {
    payment_url: string
    pay_token: string
    notif_token: string
  }
}

// ─── Statut détail Wave ───────────────────────────────────────────────────────

interface WaveTransactionDetail {
  id: string
  checkout_status: 'complete' | 'processing' | 'error'
  amount: string
  currency: string
  client_reference: string
}

// ─── Calcul des frais ─────────────────────────────────────────────────────────

/**
 * Calcule les frais passerelle selon la méthode de paiement.
 * Wave : 1% fixe
 * Autres (Bictorys, PayTech, CinetPay, Moneroo) : 3%
 */
export function calculateFees(amount: number, method: PaymentMethod): number {
  if (method === 'wave') {
    return Math.round(amount * 0.01) // 1% Wave direct
  }
  return Math.round(amount * 0.03) // 3% Agrégateurs
}

/**
 * Calcule le montant net reçu par le vendeur après déduction des frais passerelle.
 */
export function calculateVendorAmount(amount: number, method: PaymentMethod): number {
  return amount - calculateFees(amount, method)
}

// ─── Wave ──────────────────────────────────────────────────────────────────────

/**
 * Initie un paiement Wave via l'API Wave Sénégal.
 * Retourne l'URL de paiement Wave à laquelle rediriger l'acheteur.
 */
export async function initiateWavePayment(
  intent: PaymentIntent
): Promise<{ checkoutUrl: string }> {
  const apiKey = process.env.WAVE_API_KEY
  if (!apiKey) throw new Error('[Wave] WAVE_API_KEY non configurée')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'

  const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(intent.amount),
      currency: intent.currency,
      success_url: intent.redirectUrl,
      error_url: `${baseUrl}/checkout/error?order=${intent.orderId}`,
      client_reference: intent.orderId,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[Wave] Erreur API (${response.status}) : ${errorBody}`)
  }

  const session = (await response.json()) as WaveCheckoutSession

  return { checkoutUrl: session.wave_launch_url }
}

/**
 * Vérifie le statut d'une transaction Wave à partir de son ID de session.
 * Utilisé dans le webhook IPN Wave.
 */
export async function verifyWavePayment(transactionId: string): Promise<WavePaymentStatus> {
  const apiKey = process.env.WAVE_API_KEY
  if (!apiKey) throw new Error('[Wave] WAVE_API_KEY non configurée')

  const response = await fetch(
    `https://api.wave.com/v1/checkout/sessions/${transactionId}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[Wave] Erreur vérification (${response.status}) : ${errorBody}`)
  }

  const data = (await response.json()) as WaveTransactionDetail

  // Mapping statut Wave → statut interne
  let status: WavePaymentStatus['status']
  if (data.checkout_status === 'complete') {
    status = 'completed'
  } else if (data.checkout_status === 'processing') {
    status = 'pending'
  } else {
    status = 'failed'
  }

  return {
    status,
    amount: parseInt(data.amount, 10),
    transactionId: data.id,
  }
}



// ─── CinetPay (Carte bancaire) ────────────────────────────────────────────────

interface CinetPayInitResponse {
  code: string
  message: string
  data: {
    payment_url: string
    payment_token: string
  }
}

/**
 * Initie un paiement carte via CinetPay.
 * Retourne l'URL de paiement CinetPay.
 */
export async function initiateCardPayment(
  intent: PaymentIntent
): Promise<{ checkoutUrl: string }> {
  const apiKey = process.env.CINETPAY_API_KEY
  const siteId = process.env.CINETPAY_SITE_ID
  if (!apiKey) throw new Error('[CinetPay] CINETPAY_API_KEY non configurée')
  if (!siteId) throw new Error('[CinetPay] CINETPAY_SITE_ID non configuré')



  const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: intent.orderId,
      amount: intent.amount,
      currency: intent.currency,
      description: `Commande Yayyam #${intent.orderId}`,
      return_url: intent.redirectUrl,
      notify_url: intent.webhookUrl,
      customer_phone_number: intent.customerPhone ?? '',
      customer_email: intent.customerEmail ?? '',
      channels: 'ALL',
      lang: 'FR',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[CinetPay] Erreur API (${response.status}) : ${errorBody}`)
  }

  const result = (await response.json()) as CinetPayInitResponse

  if (result.code !== '201') {
    throw new Error(`[CinetPay] Échec initialisation : ${result.message}`)
  }

  return { checkoutUrl: result.data.payment_url }
}

// ─── Bictorys ─────────────────────────────────────────────────────────────────

export async function initiateBictorysPayment(
  intent: PaymentIntent
): Promise<{ checkoutUrl: string }> {
  const envStatus = process.env.NODE_ENV === 'production' ? 'prod' : 'test'
  const apiKey = await getIntegrationKey('BICTORYS_SECRET_KEY', envStatus)
  
  if (!apiKey) throw new Error('[Bictorys] BICTORYS_SECRET_KEY non configurée dans le Dashboard')

  const response = await fetch('https://api.bictorys.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: intent.amount,
      currency: intent.currency,
      reference: intent.orderId,
      description: `Commande Yayyam #${intent.orderId}`,
      return_url: intent.redirectUrl,
      notify_url: intent.webhookUrl,
      customer: {
        phone: intent.customerPhone,
        email: intent.customerEmail,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[Bictorys] Erreur API (${response.status}) : ${errorBody}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await response.json()) as any
  const url = result?.data?.checkout_url || result?.checkout_url || result?.url
  if (!url) throw new Error('[Bictorys] URL de checkout absente')

  return { checkoutUrl: url }
}

// ─── Moneroo (orchestrateur) ─────────────────────────────────────────────────────

export async function initiateMonerooPayment(
  intent: PaymentIntent
): Promise<{ checkoutUrl: string }> {
  const secretKey = process.env.MONEROO_SECRET_KEY
  if (!secretKey) throw new Error('[Moneroo] MONEROO_SECRET_KEY non configurée')

  const response = await fetch('https://api.moneroo.io/v1/payments/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      amount: intent.amount,
      currency: intent.currency,
      description: `Commande Yayyam #${intent.orderId}`,
      return_url: intent.redirectUrl,
      customer: {
        email: intent.customerEmail || 'client@yayyam.com',
        phone: intent.customerPhone,
      },
      metadata: {
        order_id: intent.orderId,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[Moneroo] Erreur API (${response.status}) : ${errorBody}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await response.json()) as any
  const url = result?.data?.checkout_url || result?.checkout_url
  if (!url) throw new Error('[Moneroo] URL de checkout absente')

  return { checkoutUrl: url }
}
