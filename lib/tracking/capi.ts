import crypto from 'crypto'

/**
 * Fonction asynchrone pour envoyer un événement de Conversion "Purchase" (Achat)
 * vers l'API de Conversions de Meta (Facebook CAPI).
 */
export async function sendMetaCAPIPurchaseEvent(params: {
  pixelId: string
  capiToken: string
  eventId: string       // ID Unique pour la déduplication (ex: order.id)
  orderId: string
  value: number         // Montant total
  currency: string      // ex: 'XOF'
  contentName: string   // Nom du(des) produit(s)
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  clientIp?: string
  clientUserAgent?: string
  sourceUrl?: string
}) {
  const {
    pixelId,
    capiToken,
    eventId,
    orderId,
    value,
    currency,
    contentName,
    customerPhone,
    customerEmail,
    customerName,
    clientIp,
    clientUserAgent,
    sourceUrl
  } = params

  if (!pixelId || !capiToken) {
    console.warn('[CAPI] Meta Pixel ID ou CAPI Token manquant, annulation.')
    return false
  }

  // --- HASHING DES DONNÉES UTILISATEUR (Obligatoire pour Meta) ---
  const hashVal = (val: string) => {
    return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex')
  }

  const userData: Record<string, any> = {
    client_ip_address: clientIp || '0.0.0.0', // Obligatoire
    client_user_agent: clientUserAgent || 'Yayyam Server', // Obligatoire
  }

  if (customerPhone) userData.ph = [hashVal(customerPhone)]
  if (customerEmail) userData.em = [hashVal(customerEmail)]
  if (customerName) {
    // Tentative de split pour fn (First Name) et ln (Last Name)
    const parts = customerName.split(' ')
    if (parts.length >= 2) {
      userData.fn = [hashVal(parts[0])]
      userData.ln = [hashVal(parts.slice(1).join(' '))]
    } else {
      userData.fn = [hashVal(customerName)]
    }
  }

  // Payload final event
  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000), // Timestamp UNIX
        event_id: eventId, // Crucial pour déduplication Pixel vs CAPI
        event_source_url: sourceUrl || 'https://yayyam.com',
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: currency.toUpperCase(),
          value: value,
          order_id: orderId,
          content_name: contentName,
        }
      }
    ]
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    if (!response.ok) {
      console.error('[CAPI] Erreur Meta API :', result)
      return false
    }

    console.log(`[CAPI] Événement Purchase envoyé avec succès pour ${orderId}`, result.events_received)
    return true
  } catch (error) {
    console.error('[CAPI] Erreur réseau lors de l\'envoi Meta CAPI :', error)
    return false
  }
}
