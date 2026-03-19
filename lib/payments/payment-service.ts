// ─── Types unifiés ────────────────────────────────────────────────────────────

export type PaymentMethod = 'wave' | 'orange_money' | 'card_cinetpay' | 'card_paytech'

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

export interface OrangePaymentStatus {
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

interface OrangeWebPayResponse {
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
 * Wave & Orange Money : 1% fixe
 * Carte (CinetPay / PayTech) : 3%
 */
export function calculateFees(amount: number, method: PaymentMethod): number {
  if (method === 'wave' || method === 'orange_money') {
    return Math.round(amount * 0.01) // 1% fixe Mobile Money
  }
  return Math.round(amount * 0.03) // 3% Carte bancaire
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'

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

// ─── Orange Money ──────────────────────────────────────────────────────────────

/**
 * Initie un paiement Orange Money via l'API Orange Money WebPay.
 * Retourne l'URL de paiement à laquelle rediriger l'acheteur.
 */
export async function initiateOrangeMoneyPayment(
  intent: PaymentIntent
): Promise<{ checkoutUrl: string }> {
  const apiKey = process.env.ORANGE_MONEY_API_KEY
  const merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY
  if (!apiKey) throw new Error('[Orange Money] ORANGE_MONEY_API_KEY non configurée')
  if (!merchantKey) throw new Error('[Orange Money] ORANGE_MONEY_MERCHANT_KEY non configuré')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'

  const response = await fetch(
    'https://api.orange.com/orange-money-webpay/dev/v1/webpayment',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_key: merchantKey,
        currency: intent.currency,
        order_id: intent.orderId,
        amount: intent.amount,
        return_url: intent.redirectUrl,
        cancel_url: `${baseUrl}/checkout/error?order=${intent.orderId}`,
        notif_url: intent.webhookUrl,
        lang: 'fr',
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[Orange Money] Erreur API (${response.status}) : ${errorBody}`)
  }

  const result = (await response.json()) as OrangeWebPayResponse

  return { checkoutUrl: result.data.payment_url }
}

/**
 * Vérifie le statut d'une transaction Orange Money.
 * Utilisé dans le webhook IPN Orange Money.
 * Note : Orange Money n'a pas d'endpoint de vérification unifié en dev,
 * on retourne un statut basé sur le token reçu dans le webhook.
 */
export async function verifyOrangeMoneyPayment(
  transactionId: string
): Promise<OrangePaymentStatus> {
  const apiKey = process.env.ORANGE_MONEY_API_KEY
  if (!apiKey) throw new Error('[Orange Money] ORANGE_MONEY_API_KEY non configurée')

  // En production Orange Money, la confirmation vient directement du webhook (notif_url).
  // Cette fonction est prévue pour une vérification complémentaire si nécessaire.
  const response = await fetch(
    `https://api.orange.com/orange-money-webpay/dev/v1/webpayment/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    // En cas d'échec de vérification, on renvoie pending pour retry
    return {
      status: 'pending',
      amount: 0,
      transactionId,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await response.json()) as Record<string, any>

  // Orange Money envoie status = 200 dans le corps quand c'est réussi
  const isSuccess = data?.status === 200 || data?.message === 'Accepted'

  return {
    status: isSuccess ? 'completed' : 'failed',
    amount: (data?.amount as number) ?? 0,
    transactionId,
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
      description: `Commande PDV Pro #${intent.orderId}`,
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
