import { createAdminClient } from '@/lib/supabase/admin'

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

import { prisma } from '@/lib/prisma'

export async function sendWhatsApp({ to, body, storeId }: { to: string; body: string, storeId?: string }): Promise<boolean> {
  const supabaseAdmin = createAdminClient()

  // --- SÉCURISATION MONÉTISATION & CRÉDITS ---
  if (storeId) {
    try {
      const smsBundle = await prisma.smsCredit.findUnique({ where: { store_id: storeId } })
      if (!smsBundle || smsBundle.credits <= 0) {
        console.warn(`[WhatsApp Péage] Bloqué: Crédits épuisés pour le store ${storeId}.`)
        return false
      }
      // On décrémente un crédit (Péage SaaS)
      await prisma.smsCredit.update({
        where: { store_id: storeId },
        data: { credits: { decrement: 1 }, used: { increment: 1 } }
      })
    } catch (e) {
      console.error('[WhatsApp Péage] Erreur de vérification Prisma:', e)
    }
  }

  const { data: configRows } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')
    .in('key', ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'])

  const configMap = Object.fromEntries(configRows?.map(row => [row.key, row.value]) || [])
  const phoneId = configMap['WHATSAPP_PHONE_NUMBER_ID'] || process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = configMap['WHATSAPP_ACCESS_TOKEN'] || process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneId || !token) {
    console.warn('[WhatsApp Route] Credentials missing for Meta Cloud API.')
    return false
  }

  const toFormatted = normalizePhone(to)

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toFormatted,
        type: 'text',
        text: { preview_url: false, body: body }
      })
    })

    if (!res.ok) {
       console.error('[WhatsApp] Meta Send Error:', await res.text())
       return false
    }
    
    return true
  } catch (err) {
    console.error('[WhatsApp] Runtime Exception:', err)
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
📍 Suivez votre commande : https://yayyam.com/track?ref=${orderId}

Le vendeur vous contactera pour la livraison.

Merci d'avoir choisi Yayyam ! 🙏`
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
👉 Gérez vos commandes : https://yayyam.com/dashboard/orders`
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
— Yayyam`
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

Suivi : https://yayyam.com/track?ref=${orderId}
À très vite ! 🙏`
}

export function msgOrderDelivered({ buyerName, productName, vendorName }: {
  buyerName: string; productName: string; vendorName: string
}) {
  return `🎉 *Commande Livrée !*

Bonjour ${buyerName},
Nous vous confirmons la bonne réception de votre commande *${productName}*.

Merci d'avoir fait confiance à ${vendorName} et à Yayyam !
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

— L'équipe Yayyam`
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

_L'équipe Yayyam_ 💰`
}

export function msgWithdrawalFailed(params: {
  amount: number
}) {
  return `❌ *Échec du Retrait*

Le transfert de *${params.amount.toLocaleString('fr-FR')} FCFA* a échoué (problème opérateur).
Le montant a été recrédité sur votre solde Yayyam.

_Support Yayyam_`
}

export function msgWithdrawalRejected(params: {
  amount: number
  reason: string
}) {
  return `🚫 *Retrait Rejeté*

Votre demande de retrait de *${params.amount.toLocaleString('fr-FR')} FCFA* a été annulée par l'administration.
Raison : ${params.reason}

Le montant est de nouveau disponible sur votre solde.
_Support Yayyam_`
}

export function msgMasterclassReminder(params: {
  vendorName: string
  academyLink: string
}) {
  return `🚀 *Salut ${params.vendorName}, bienvenue sur Yayyam !*

Nous avons remarqué que tu n'as pas encore jeté un œil à l'Académie Yayyam. 
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

Salut ${params.vendorName}, l'équipe Yayyam au rapport ! 🫡

Il ne te manque qu'une seule étape pour encaisser ta première vente sur Wave ou Orange Money : **Publier ton premier produit.**
Que ce soit un Ebook, un vêtement, ou une session de coaching, ça prend littéralement 30 secondes.

👉 Va sur ton tableau de bord et lance la machine :
${params.dashboardLink}

Si tu bloques, réponds juste à ce message ! 🙌`
}

export function msgAbandonedCart(buyerName: string, productName: string, storeName: string, checkoutLink: string) {
  return `🛒 *Votre panier vous attend !*

Bonjour${buyerName ? ' ' + buyerName : ''},

Vous avez récemment montré de l'intérêt pour *${productName}* sur *${storeName}*, mais vous n'avez pas finalisé votre achat.

Avez-vous rencontré un problème technique ? Si vous êtes toujours intéressé(e), vous pouvez reprendre votre commande exactement là où vous l'avez laissée ici :

👉 ${checkoutLink}

Si vous avez la moindre question, répondez simplement à ce message ! 🙏

L'équipe ${storeName}`
}
