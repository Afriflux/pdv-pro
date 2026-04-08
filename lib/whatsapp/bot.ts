import { prisma } from '@/lib/prisma'

interface BotParams {
  storeId: string
  phone: string
  clientName: string
  message: string
}

export async function processWhatsAppMessage({ storeId, phone, clientName, message }: BotParams): Promise<string> {
  const botConfig = await prisma.whatsappBot.findUnique({
    where: { store_id: storeId }
  })

  if (!botConfig || !botConfig.active) {
    // Si le bot n'est pas actif pour cette boutique, on ne répond rien.
    return `<Response></Response>`
  }

  // 1. Mettre à jour ou créer la conversation
  await prisma.whatsappConversation.upsert({
    where: { store_id_phone: { store_id: storeId, phone } },
    update: { last_message: message, client_name: clientName },
    create: { store_id: storeId, phone, client_name: clientName, last_message: message }
  })

  const rawMsg = message.toLowerCase().trim()

  // 2. Traitement des Mots-Clés
  const isJoinIntent = rawMsg.startsWith('join')
  const isCatalogue = rawMsg.includes('catalogue') || rawMsg.includes('produits') || rawMsg.includes('produit')
  const isHelp = rawMsg === 'aide' || rawMsg === 'help' || rawMsg === 'menu'
  const isCommander = rawMsg.startsWith('commander')
  const isPrix = rawMsg.startsWith('prix')
  const isSuivi = rawMsg.startsWith('suivi') || rawMsg.startsWith('commande')

  let replyText = ''

  if (isJoinIntent) {
    replyText = botConfig.welcome_message
  } else if (isHelp) {
    replyText = handleHelp()
  } else if (isCatalogue) {
    replyText = await handleCatalogue(storeId)
  } else if (isPrix) {
    const productName = rawMsg.replace('prix', '').trim()
    replyText = await handleProductInfo(storeId, productName)
  } else if (isCommander) {
    const productName = rawMsg.replace('commander', '').trim()
    replyText = await handleOrder(storeId, phone, productName)
  } else if (isSuivi) {
    replyText = await handleTracking(storeId, phone)
  } else {
    // Fallback: Si auto-reply est activé, renvoyer au menu
    if (botConfig.ai_enabled) {
      // NOTE: L'intégration avec Anthropic viendra ici.
      replyText = "🤖 L'IA n'est pas encore complètement configurée pour répondre librement.\n\n" + handleHelp()
    } else if (botConfig.auto_reply) {
      replyText = "Je n'ai pas compris votre demande.\n\n" + handleHelp()
    } else {
      // Mode silencieux : n'envoie rien si pas de mots clés et auto_reply désactivé
      return `<Response></Response>`
    }
  }

  return `
    <Response>
      <Message>${escapeXml(replyText)}</Message>
    </Response>
  `
}

// ── Helpers ──────────────────────────────────────────────────────────────

function handleHelp(): string {
  return `📌 *Commandes disponibles* :

🛍️ *catalogue* : Voir nos produits
💵 *prix [nom]* : Détails d'un produit
🛒 *commander [nom]* : Acheter un produit
📦 *suivi* : Statut de votre commande
❓ *aide* : Voir ce menu`
}

async function handleCatalogue(storeId: string): Promise<string> {
  const products = await prisma.product.findMany({
    where: { store_id: storeId, active: true },
    select: { name: true, price: true },
    take: 5
  })

  if (products.length === 0) return "Aucun produit disponible pour le moment."

  let msg = "📚 *Notre Catalogue (Top 5)*\n\n"
  products.forEach(p => {
    msg += `▫️ *${p.name}*\n💰 ${p.price.toLocaleString('fr-FR')} FCFA\n\n`
  })
  msg += `Pour commander un produit, répondez :\n👉 *commander [nom du produit]*`
  return msg.trim()
}

async function handleProductInfo(storeId: string, searchInput: string): Promise<string> {
  if (!searchInput) return "Veuillez préciser le nom du produit. Ex: *prix ebook*"
  
  const product = await prisma.product.findFirst({
    where: {
      store_id: storeId,
      active: true,
      name: { contains: searchInput, mode: 'insensitive' }
    }
  })

  if (!product) return `Je n'ai pas trouvé de produit nommé "${searchInput}". Tapez *catalogue* pour voir la liste.`

  return `🏷️ *${product.name}*
💰 *${product.price.toLocaleString('fr-FR')} FCFA*
📦 Stock disponible
  
📝 ${product.description ? product.description.substring(0, 100) + '...' : ''}
  
Pour l'acheter, tapez :
👉 *commander ${product.name}*`
}

async function handleOrder(storeId: string, phone: string, searchInput: string): Promise<string> {
  if (!searchInput) return "Veuillez préciser le nom du produit à commander. Ex: *commander ebook*"

  const product = await prisma.product.findFirst({
    where: {
      store_id: storeId,
      active: true,
      name: { contains: searchInput, mode: 'insensitive' }
    }
  })

  if (!product) return `Je n'ai pas pu identifier ce produit. Vérifiez le nom dans le *catalogue*.`

  // Base URL is supposed to be env var but Yayyam.com is hardcoded in earlier files
  const checkoutUrl = `https://yayyam.com/checkout/${product.id}?ref=${encodeURIComponent(phone)}`

  return `🛒 *Commande en cours*

Vous allez commander : *${product.name}*
Prix total : *${product.price.toLocaleString('fr-FR')} FCFA*

Veuillez cliquer sur le lien sécurisé ci-dessous pour finaliser votre paiement ou indiquer une adresse de livraison (Paiement à la Livraison) :
💳 Payer maintenant → ${checkoutUrl}

Une fois terminé, vous recevrez une confirmation ici même !`
}

async function handleTracking(storeId: string, phone: string): Promise<string> {
  // Find last order for this phone in this store
  const order = await prisma.order.findFirst({
    where: {
      store_id: storeId,
      buyer_phone: { contains: phone.substring(phone.length - 8) } // Match end of phone to avoid prefix issues
    },
    orderBy: { created_at: 'desc' }
  })

  if (!order) return "Je n'ai trouvé aucune commande récente liée à votre numéro."

  const ref = order.id.split('-')[0].toUpperCase()
  let statusText = "En traitement"
  if (order.status === 'delivered') statusText = "Livrée"
  if (order.status === 'shipped') statusText = "Expédiée"
  if (order.status === 'cancelled') statusText = "Annulée"

  return `📦 *Suivi de commande*

Réf : #${ref}
Statut : *${statusText}*
Montant : ${order.total.toLocaleString('fr-FR')} FCFA

Pour la suivre en ligne : 
🔗 https://yayyam.com/track?ref=${order.id}`
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}
