import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAIResponse } from '@/lib/ai/router'

interface BotParams {
  storeId: string
  phone: string
  clientName: string
  message: string
}

async function sendWhatsAppText(to: string, text: string) {
  const supabaseAdmin = createAdminClient()
  const { data: configRows } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')
    .in('key', ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'])

  const configMap = Object.fromEntries(configRows?.map(row => [row.key, row.value]) || [])
  const phoneId = configMap['WHATSAPP_PHONE_NUMBER_ID'] || process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = configMap['WHATSAPP_ACCESS_TOKEN'] || process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneId || !token) {
    console.error('[WhatsApp] Missing credentials for Meta API')
    return false
  }

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
        to: to,
        type: 'text',
        text: { preview_url: false, body: text }
      })
    })

    if (!res.ok) {
      console.error('[WhatsApp Cloud API Error]:', await res.text())
    }
    return res.ok
  } catch (err) {
    console.error('[WhatsApp Cloud API Exception]:', err)
    return false
  }
}

export async function processWhatsAppMessage({ storeId, phone, clientName, message }: BotParams): Promise<void> {
  const botConfig = await prisma.whatsappBot.findUnique({
    where: { store_id: storeId },
    include: { store: true }
  })

  // Normalize phone number to omit "+" and non digits for the Cloud API
  const cleanPhone = phone.replace(/\+/g, '').replace(/\s+/g, '')

  const rawMsg = message.toLowerCase().trim()

  // --- SMART REVIEWS INTERCEPTION ---
  if (/^[1-5]$/.test(rawMsg)) {
    const rating = parseInt(rawMsg, 10)
    
    // Check if there is an order eligible for review
    const orderToReview = await prisma.order.findFirst({
      where: {
        store_id: storeId,
        buyer_phone: { contains: phone.substring(phone.length - 8) },
        status: 'delivered',
        Review: { none: {} }
      },
      orderBy: { updated_at: 'desc' }
    });

    if (orderToReview) {
      await prisma.review.create({
        data: {
          store_id: storeId,
          product_id: orderToReview.product_id,
          order_id: orderToReview.id,
          buyer_name: orderToReview.buyer_name,
          buyer_phone: orderToReview.buyer_phone,
          rating: rating,
          comment: "Avis collecté via WhatsApp Smart Reviews",
          verified: true
        }
      });
      
      const storeName = botConfig?.store.name || 'Notre Boutique'
      await sendWhatsAppText(
        cleanPhone, 
        `Merci pour votre note de ${rating}/5 ! 🙏\n\nSi vous avez un commentaire supplémentaire, n'hésitez pas à nous l'écrire. À très bientôt sur *${storeName}* !`
      );
      
      // Update the client context just in case, even if bot is off
      await prisma.whatsappConversation.upsert({
        where: { store_id_phone: { store_id: storeId, phone } },
        update: { last_message: `Review: ${rating}/5`, client_name: clientName },
        create: { store_id: storeId, phone, client_name: clientName, last_message: `Review: ${rating}/5` }
      })
      return; // Stop execution here
    }
  }
  // --- FIN SMART REVIEWS ---

  if (!botConfig || !botConfig.active) {
    // Si le bot n'est pas actif pour cette boutique, on ne répond rien.
    return
  }

  // 1. Mettre à jour ou créer la conversation
  const conversation = await prisma.whatsappConversation.upsert({
    where: { store_id_phone: { store_id: storeId, phone } },
    update: { last_message: message, client_name: clientName },
    create: { store_id: storeId, phone, client_name: clientName, last_message: message }
  })

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
    // Fallback: Si auto-reply est activé, renvoyer au menu
    if (botConfig.ai_enabled) {
      let history: {role: string, content: string}[] = []
      if (conversation?.context && Array.isArray(conversation.context)) {
          history = conversation.context as {role: string, content: string}[]
      }
      history.push({ role: 'user', content: message })

      const historyText = history.map(msg => `${msg.role === 'user' ? 'CLIENT' : 'BOT'}: ${msg.content}`).join('\n')

      const systemPrompt = `Tu es l'assistant commercial virtuel de la boutique eCommerce "${botConfig.store.name}".
Tu parles directement au client sur WhatsApp. Tes réponses doivent être courtes, humaines, chaleureuses et utiliser des emojis avec parcimonie.
Objectif : Rassurer, donner les prix, et conclure la vente.
Tu ne dois jamais dire que tu es une intelligence artificielle, tu es membre de l'équipe "${botConfig.store.name}".
Si le client veut passer commande, dis-lui simplement de répondre "commander [nom du produit]".
Ne rajoute PAS '*BOT:*' ou de formatage système devant tes réponses.`

      const aiRes = await generateAIResponse({
        taskType: 'reasoning',
        systemPrompt,
        prompt: `Historique :\n${historyText}\n\nGénère la réponse de manière fluide :`,
        temperature: 0.7
      })

      replyText = aiRes.content.trim()

      history.push({ role: 'assistant', content: replyText })
      // Keep only last 10 messages
      if (history.length > 10) history = history.slice(history.length - 10)

      await prisma.whatsappConversation.update({
        where: { store_id_phone: { store_id: storeId, phone } },
        data: { context: history as any }
      })

    } else if (botConfig.auto_reply) {
      replyText = "Je n'ai pas compris votre demande.\n\n" + handleHelp()
    } else {
      // Mode silencieux : n'envoie rien si pas de mots clés et auto_reply désactivé
      return
    }
  }

  if (replyText) {
    await sendWhatsAppText(cleanPhone, replyText)
  }
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
