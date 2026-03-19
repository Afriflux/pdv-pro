import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null

/**
 * Normalise un numéro de téléphone au format E.164
 */
export function normalizePhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
  if (clean.startsWith('+')) return clean
  if (clean.startsWith('00')) return '+' + clean.slice(2)
  if (clean.length === 9) return '+221' + clean
  if (clean.length === 8) return '+221' + clean
  return '+' + clean
}

/**
 * Envoie un message WhatsApp via Twilio réel
 */
export async function sendWhatsApp({ to, body }: { to: string; body: string }): Promise<boolean> {
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

  if (!twilioClient) {
    console.log('[WhatsApp DEV] Simulé:', body)
    return true
  }

  const toFormatted = `whatsapp:${normalizePhone(to)}`
  const fromFormatted = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

  try {
    await twilioClient.messages.create({
      from: fromFormatted,
      to: toFormatted,
      body: body
    })
    return true
  } catch (err) {
    console.error('[WhatsApp] Erreur Twilio:', err)
    return false
  }
}

// ── Templates de messages ──────────────────────────────────────────

export function msgOrderConfirmed(params: {
  buyerName: string
  productName: string
  amount: number
  orderId: string
  vendorName: string
}) {
  return `✅ Commande confirmée !
Bonjour ${params.buyerName.split(' ')[0]},
Votre commande *${params.productName}* a bien été reçue.
Montant : *${params.amount.toLocaleString('fr-FR')} FCFA*
Référence : #${params.orderId.split('-')[0].toUpperCase()}
Nous vous contacterons sous peu.
— ${params.vendorName}`
}

export function msgVendorNewOrder(params: {
  productName: string
  buyerName: string
  buyerPhone: string
  amount: number
  vendorAmount: number
  address?: string
}) {
  return `🛍️ Nouvelle commande !
*${params.productName}*
👤 ${params.buyerName}
📱 ${params.buyerPhone}
💰 ${params.amount.toLocaleString('fr-FR')} FCFA (vous recevez *${params.vendorAmount.toLocaleString('fr-FR')} FCFA*)${params.address ? `\n📍 ${params.address}` : ''}
Connectez-vous pour gérer : pdvpro.com/dashboard`
}

export function msgDigitalDelivery(params: {
  buyerName: string
  productName: string
  downloadUrl: string
  expiresInDays: number
}) {
  return `📥 *Votre produit est prêt !*

Bonjour ${params.buyerName.split(' ')[0]},

*${params.productName}* est disponible au téléchargement :

👉 ${params.downloadUrl}

⚠️ Lien valable *${params.expiresInDays} jours*

_Propulsé par PDV Pro 🚀_`
}

export function msgVendorCodReminder(params: {
  productName: string
  buyerName: string
  buyerPhone: string
}) {
  return `⚠️ *COD en attente depuis +48h*

Commande : *${params.productName}*
👤 Acheteur : ${params.buyerName}
📞 ${params.buyerPhone}

Pensez à confirmer la livraison dans votre dashboard.`
}

export function msgWithdrawalApproved(params: {
  amount: number
  method: string
}) {
  return `✅ *Retrait Approuvé !*

Votre demande de retrait de *${params.amount.toLocaleString('fr-FR')} FCFA* vers ${params.method} a été traitée avec succès !
Les fonds seront disponibles sur votre compte d'ici peu.

_L'équipe PDV Pro_ 💰`
}

export function msgWithdrawalFailed(params: {
  amount: number
}) {
  return `❌ *Échec du Retrait*

Le transfert de *${params.amount.toLocaleString('fr-FR')} FCFA* a échoué (problème opérateur).
Le montant a été recrédité sur votre solde PDV Pro.

_Support PDV Pro_`
}

export function msgWithdrawalRejected(params: {
  amount: number
  reason: string
}) {
  return `🚫 *Retrait Rejeté*

Votre demande de retrait de *${params.amount.toLocaleString('fr-FR')} FCFA* a été annulée par l'administration.
Raison : ${params.reason}

Le montant est de nouveau disponible sur votre solde.
_Support PDV Pro_`
}
