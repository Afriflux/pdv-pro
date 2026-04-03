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

export function msgOrderConfirmed({ buyerName, productName, amount, orderId, vendorName }: {
  buyerName: string; productName: string; amount: number; orderId: string; vendorName: string
}) {
  const ref = orderId.split('-')[0].toUpperCase()
  return `✅ *Commande confirmée !*

Bonjour ${buyerName},

Votre commande *${productName}* de *${amount.toLocaleString('fr-FR')} FCFA* a bien été reçue par ${vendorName}.

📦 Réf : #${ref}
📍 Suivez votre commande : https://pdvpro.com/track?ref=${orderId}

Le vendeur vous contactera pour la livraison.

Merci d'avoir choisi PDV Pro ! 🙏`
}

export function msgVendorNewOrder({ productName, buyerName, buyerPhone, amount, vendorAmount, address }: {
  productName: string; buyerName: string; buyerPhone: string; amount: number; vendorAmount: number; address?: string
}) {
  return `🛍️ *Nouvelle commande !*

Client : *${buyerName}* (${buyerPhone})
Produit : *${productName}*
Montant : *${amount.toLocaleString('fr-FR')} FCFA*
Votre part : *${vendorAmount.toLocaleString('fr-FR')} FCFA*
${address ? `📍 Livraison : ${address}\n` : ''}
👉 Gérez vos commandes : https://pdvpro.com/dashboard/orders`
}

export function msgDigitalDelivery({ buyerName, productName, downloadUrl, expiresInDays }: {
  buyerName: string; productName: string; downloadUrl: string; expiresInDays: number
}) {
  return `📥 *Votre produit numérique est prêt !*

Bonjour ${buyerName},

Votre achat *${productName}* est disponible au téléchargement :

🔗 ${downloadUrl}

⏰ Ce lien est valable ${expiresInDays} jours.

Merci pour votre confiance ! 🙏
— PDV Pro`
}

export function msgOrderShipped({ buyerName, productName, vendorName, orderId }: {
  buyerName: string; productName: string; vendorName: string; orderId: string
}) {
  const ref = orderId.split('-')[0].toUpperCase()
  return `🚚 *Votre commande est en route !*

Bonjour ${buyerName},
Bonne nouvelle, votre livraison pour *${productName}* est officiellement expédiée par ${vendorName}. 

📦 Réf : #${ref}
Un livreur vous contactera très bientôt. Tenez-vous prêt !
Si vous avez un empêchement, n'hésitez pas à nous le signaler.

Suivi : https://pdvpro.com/track?ref=${orderId}
À très vite ! 🙏`
}

export function msgOrderDelivered({ buyerName, productName, vendorName }: {
  buyerName: string; productName: string; vendorName: string
}) {
  return `🎉 *Commande Livrée !*

Bonjour ${buyerName},
Nous vous confirmons la bonne réception de votre commande *${productName}*.

Merci d'avoir fait confiance à ${vendorName} et à PDV Pro !
Si vous aimez le produit, n'hésitez pas à laisser un retour.

À bientôt pour de nouvelles découvertes ! 🛍️`
}

export function msgOrderCancelled({ buyerName, productName }: {
  buyerName: string; productName: string
}) {
  return `❌ *Commande Annulée*

Bonjour ${buyerName},
Votre demande concernant *${productName}* a été annulée.
Si c'est une erreur ou si vous souhaitez reprogrammer, vous pouvez nous recontacter.

— L'équipe PDV Pro`
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

export function msgMasterclassReminder(params: {
  vendorName: string
  academyLink: string
}) {
  return `🚀 *Salut ${params.vendorName}, bienvenue sur PDV Pro !*

Nous avons remarqué que tu n'as pas encore jeté un œil à l'Académie PDV Pro. 
Des stratégies inédites t'y attendent (gratuitement) pour lancer ta boutique et exploser tes ventes en Afrique.

👉 Découvre les secrets du Top 1% ici : 
${params.academyLink}

À très vite ! 🎓`
}

export function msgVendorEmptyStore(params: {
  vendorName: string
  dashboardLink: string
}) {
  return `🛑 *C'est dommage de t'arrêter en si bon chemin...*

Salut ${params.vendorName}, l'équipe PDV Pro au rapport ! 🫡

Il ne te manque qu'une seule étape pour encaisser ta première vente sur Wave ou Orange Money : **Publier ton premier produit.**
Que ce soit un Ebook, un vêtement, ou une session de coaching, ça prend littéralement 30 secondes.

👉 Va sur ton tableau de bord et lance la machine :
${params.dashboardLink}

Si tu bloques, réponds juste à ce message ! 🙌`
}
