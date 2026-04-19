import crypto from 'crypto'

// ─── Shared Helpers ──────────────────────────────────────────────────────────

/**
 * Hash une valeur en SHA-256 (format requis par Meta & TikTok pour les données PII).
 */
function hashVal(val: string): string {
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex')
}

// ─── 1. META CAPI (Facebook Conversions API) ─────────────────────────────────

/**
 * Envoie un événement de Conversion "Purchase" vers l'API de Conversions de Meta.
 * Documentation : https://developers.facebook.com/docs/marketing-api/conversions-api
 */
export async function sendMetaCAPIPurchaseEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string
  orderId: string
  value: number
  currency: string
  contentName: string
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  clientIp?: string
  clientUserAgent?: string
  sourceUrl?: string
}) {
  const {
    pixelId, capiToken, eventId, orderId, value, currency,
    contentName, customerPhone, customerEmail, customerName,
    clientIp, clientUserAgent, sourceUrl
  } = params

  if (!pixelId || !capiToken) {
    console.warn('[CAPI Meta] Pixel ID ou CAPI Token manquant, annulation.')
    return false
  }

  const userData: Record<string, unknown> = {
    client_ip_address: clientIp || '0.0.0.0',
    client_user_agent: clientUserAgent || 'Yayyam Server',
  }

  if (customerPhone) userData.ph = [hashVal(customerPhone)]
  if (customerEmail) userData.em = [hashVal(customerEmail)]
  if (customerName) {
    const parts = customerName.split(' ')
    if (parts.length >= 2) {
      userData.fn = [hashVal(parts[0])]
      userData.ln = [hashVal(parts.slice(1).join(' '))]
    } else {
      userData.fn = [hashVal(customerName)]
    }
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl || 'https://yayyam.com',
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: currency.toUpperCase(),
          value,
          order_id: orderId,
          content_name: contentName,
        }
      }
    ]
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    if (!response.ok) {
      console.error('[CAPI Meta] Erreur API :', result)
      return false
    }

    console.log(`[CAPI Meta] Purchase envoyé pour ${orderId}`, result.events_received)
    return true
  } catch (error) {
    console.error('[CAPI Meta] Erreur réseau :', error)
    return false
  }
}

// ─── 2. TIKTOK EVENTS API (Server-Side) ──────────────────────────────────────

/**
 * Envoie un événement "CompletePayment" vers l'Events API de TikTok.
 * Documentation : https://business-api.tiktok.com/portal/docs?id=1771100865818625
 */
export async function sendTikTokCAPIPurchaseEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string
  orderId: string
  value: number
  currency: string
  contentName: string
  customerPhone?: string
  customerEmail?: string
  clientIp?: string
  clientUserAgent?: string
  sourceUrl?: string
}) {
  const {
    pixelId, capiToken, eventId, orderId, value, currency,
    contentName, customerPhone, customerEmail,
    clientIp, clientUserAgent, sourceUrl
  } = params

  if (!pixelId || !capiToken) {
    console.warn('[CAPI TikTok] Pixel ID ou Token manquant, annulation.')
    return false
  }

  // TikTok Events API attend des données hashées en SHA-256
  const context: Record<string, unknown> = {
    ip: clientIp || '0.0.0.0',
    user_agent: clientUserAgent || 'Yayyam Server',
  }

  const user: Record<string, unknown> = {}
  if (customerPhone) user.phone_id = hashVal(customerPhone)
  if (customerEmail) user.email = hashVal(customerEmail)

  const payload = {
    pixel_code: pixelId,
    event: 'CompletePayment',
    event_id: eventId,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      page: {
        url: sourceUrl || 'https://yayyam.com',
      },
      user,
    },
    properties: {
      currency: currency.toUpperCase(),
      value,
      order_id: orderId,
      contents: [
        {
          content_name: contentName,
          content_type: 'product',
          quantity: 1,
          price: value,
        }
      ],
    },
  }

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': capiToken,
      },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: pixelId,
        data: [payload],
      })
    })

    const result = await response.json()
    if (result.code !== 0) {
      console.error('[CAPI TikTok] Erreur API :', result)
      return false
    }

    console.log(`[CAPI TikTok] CompletePayment envoyé pour ${orderId}`)
    return true
  } catch (error) {
    console.error('[CAPI TikTok] Erreur réseau :', error)
    return false
  }
}

// ─── 3. GOOGLE MEASUREMENT PROTOCOL (GA4 Server-Side) ────────────────────────

/**
 * Envoie un événement "purchase" vers Google Analytics 4 via le Measurement Protocol.
 * Documentation : https://developers.google.com/analytics/devguides/collection/protocol/ga4
 * 
 * Requiert :
 * - measurement_id : Le Google Tag ID (G-XXXXXXXXXX)
 * - api_secret : Clé API créée dans GA4 Admin > Data Streams > Measurement Protocol API secrets
 */
export async function sendGoogleCAPIPurchaseEvent(params: {
  measurementId: string
  apiSecret: string
  eventId: string
  orderId: string
  value: number
  currency: string
  contentName: string
  clientId?: string
}) {
  const {
    measurementId, apiSecret, eventId, orderId,
    value, currency, contentName, clientId
  } = params

  if (!measurementId || !apiSecret) {
    console.warn('[CAPI Google] Measurement ID ou API Secret manquant, annulation.')
    return false
  }

  // Google MP nécessite un client_id. On en génère un basé sur l'orderId si absent.
  const resolvedClientId = clientId || crypto.randomUUID()

  const payload = {
    client_id: resolvedClientId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: orderId,
          value,
          currency: currency.toUpperCase(),
          // Identification pour déduplication
          engagement_time_msec: 100,
          session_id: eventId,
          items: [
            {
              item_name: contentName,
              quantity: 1,
              price: value,
            }
          ],
        }
      }
    ]
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    )

    // Google MP retourne 204 (no content) en cas de succès
    if (response.status === 204 || response.ok) {
      console.log(`[CAPI Google] Purchase envoyé pour ${orderId}`)
      return true
    }

    const text = await response.text()
    console.error('[CAPI Google] Erreur API :', response.status, text)
    return false
  } catch (error) {
    console.error('[CAPI Google] Erreur réseau :', error)
    return false
  }
}

// ─── 4. META CAPI — ViewContent ───────────────────────────────────────────────

export async function sendMetaCAPIViewContentEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string
  contentName: string
  contentId: string
  value?: number
  currency?: string
  clientIp?: string
  clientUserAgent?: string
  sourceUrl?: string
}) {
  const { pixelId, capiToken, eventId, contentName, contentId, value, currency, clientIp, clientUserAgent, sourceUrl } = params
  if (!pixelId || !capiToken) return false

  const payload = {
    data: [{
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl || 'https://yayyam.com',
      action_source: 'website',
      user_data: {
        client_ip_address: clientIp || '0.0.0.0',
        client_user_agent: clientUserAgent || 'Yayyam Server',
      },
      custom_data: {
        currency: (currency || 'XOF').toUpperCase(),
        value: value || 0,
        content_name: contentName,
        content_ids: [contentId],
        content_type: 'product',
      }
    }]
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const result = await response.json()
      console.error('[CAPI Meta ViewContent] Erreur:', result)
      return false
    }
    return true
  } catch (error) {
    console.error('[CAPI Meta ViewContent] Erreur réseau:', error)
    return false
  }
}

// ─── 5. META CAPI — InitiateCheckout ──────────────────────────────────────────

export async function sendMetaCAPIInitiateCheckoutEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string
  contentName: string
  value: number
  currency?: string
  customerPhone?: string
  clientIp?: string
  clientUserAgent?: string
  sourceUrl?: string
}) {
  const { pixelId, capiToken, eventId, contentName, value, currency, customerPhone, clientIp, clientUserAgent, sourceUrl } = params
  if (!pixelId || !capiToken) return false

  const userData: Record<string, unknown> = {
    client_ip_address: clientIp || '0.0.0.0',
    client_user_agent: clientUserAgent || 'Yayyam Server',
  }
  if (customerPhone) userData.ph = [hashVal(customerPhone)]

  const payload = {
    data: [{
      event_name: 'InitiateCheckout',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl || 'https://yayyam.com',
      action_source: 'website',
      user_data: userData,
      custom_data: {
        currency: (currency || 'XOF').toUpperCase(),
        value,
        content_name: contentName,
      }
    }]
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const result = await response.json()
      console.error('[CAPI Meta InitiateCheckout] Erreur:', result)
      return false
    }
    return true
  } catch (error) {
    console.error('[CAPI Meta InitiateCheckout] Erreur réseau:', error)
    return false
  }
}

// ─── 6. TIKTOK CAPI — ViewContent ────────────────────────────────────────────

export async function sendTikTokCAPIViewContentEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string
  contentName: string
  contentId: string
  value?: number
  currency?: string
  clientIp?: string
  clientUserAgent?: string
}) {
  const { pixelId, capiToken, eventId, contentName, contentId, value, currency, clientIp, clientUserAgent } = params
  if (!pixelId || !capiToken) return false

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': capiToken,
      },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: pixelId,
        data: [{
          event: 'ViewContent',
          event_id: eventId,
          timestamp: new Date().toISOString(),
          context: {
            ip: clientIp || '0.0.0.0',
            user_agent: clientUserAgent || 'Yayyam Server',
          },
          properties: {
            currency: (currency || 'XOF').toUpperCase(),
            value: value || 0,
            contents: [{ content_name: contentName, content_id: contentId, content_type: 'product', quantity: 1 }],
          },
        }],
      })
    })
    const result = await response.json()
    return result.code === 0
  } catch (error) {
    console.error('[CAPI TikTok ViewContent] Erreur:', error)
    return false
  }
}

// ─── 7. TIKTOK CAPI — InitiateCheckout ───────────────────────────────────────

export async function sendTikTokCAPIInitiateCheckoutEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string
  contentName: string
  value: number
  currency?: string
  clientIp?: string
  clientUserAgent?: string
}) {
  const { pixelId, capiToken, eventId, contentName, value, currency, clientIp, clientUserAgent } = params
  if (!pixelId || !capiToken) return false

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': capiToken,
      },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: pixelId,
        data: [{
          event: 'InitiateCheckout',
          event_id: eventId,
          timestamp: new Date().toISOString(),
          context: {
            ip: clientIp || '0.0.0.0',
            user_agent: clientUserAgent || 'Yayyam Server',
          },
          properties: {
            currency: (currency || 'XOF').toUpperCase(),
            value,
            contents: [{ content_name: contentName, content_type: 'product', quantity: 1, price: value }],
          },
        }],
      })
    })
    const result = await response.json()
    return result.code === 0
  } catch (error) {
    console.error('[CAPI TikTok InitiateCheckout] Erreur:', error)
    return false
  }
}

