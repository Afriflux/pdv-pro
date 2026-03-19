/**
 * /app/api/telegram/webhook/route.ts
 * Gestionnaire de Webhook du Bot Telegram @PDVProBot.
 * Traite les commandes utilisateurs et fournit des informations en temps réel.
 * 
 * Sécurisé par le header X-Telegram-Bot-Api-Secret-Token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/telegram/bot-service'
import { handleConnectCommand } from '@/lib/telegram/community-service'

// Initialisation du client Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- Types Telegram ---

interface TelegramUser {
  id: number
  first_name: string
  username?: string
}

interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: { id: number; type: string; title?: string }
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

// --- Handler Principal ---

export async function POST(req: NextRequest) {
  try {
    // 1. Vérification de sécurité
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token')
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('[Telegram Webhook] Secret token invalide ou manquant')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parsing de l'Update
    const update = (await req.json()) as TelegramUpdate
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true })
    }

    const { text, from, chat } = update.message
    const chatId = chat.id.toString()
    const command = text.split(' ')[0].toLowerCase()

    // 3. Routing des commandes
    switch (command) {
      case '/start':
        await handleStart(chatId, text, from)
        break
      case '/stats':
        await handleStats(chatId)
        break
      case '/commandes':
        await handleCommandes(chatId)
        break
      case '/wallet':
        await handleWallet(chatId)
        break
      case '/aide':
        await handleAide(chatId)
        break
      default:
        // Handler /connect CODE (fonctionne dans les groupes)
        if (text.startsWith('/connect ') || text.startsWith('/connect@')) {
          const codePart = text.replace(/^\/connect(@\S+)?\s*/, '').trim().toUpperCase()
          if (codePart) {
            const chatTitle = chat.title || 'Groupe sans nom'
            const chatType = chat.type || 'group'
            const result = await handleConnectCommand(chatId, chatTitle, chatType, codePart)
            await sendMessage(chatId, result.message)
          } else {
            await sendMessage(chatId, '❌ Utilisez le format : <code>/connect PDV-XXXX</code>')
          }
        } else {
          await handleUnknown(chatId)
        }
        break
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram Webhook] Erreur critique:', error)
    return NextResponse.json({ ok: true }) // On retourne 200 pour éviter que Telegram ne réessaye indéfiniment
  }
}

// --- Command Handlers ---

/**
 * Gère la commande /start (Liaison ou Bienvenue)
 */
async function handleStart(chatId: string, fullText: string, from: TelegramUser) {
  const parts = fullText.split(' ')
  const token = parts.length > 1 ? parts[1].toUpperCase() : null

  if (token) {
    // Tentative de liaison avec un token
    const now = new Date().toISOString()
    const { data: linkToken, error } = await supabaseAdmin
      .from('telegram_link_tokens')
      .select('store_id')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', now)
      .single()

    if (error || !linkToken) {
      const errorMsg = `❌ <b>Code invalide ou expiré.</b>\n\nVeuillez générer un nouveau code dans vos paramètres PDV Pro.`
      await sendMessage(chatId, errorMsg)
      return
    }

    // Mise à jour de la boutique
    const { error: updateError } = await supabaseAdmin
      .from('Store')
      .update({
        telegram_chat_id: chatId,
        // On pourrait stocker le username si on ajoute la colonne plus tard
      })
      .eq('id', linkToken.store_id)

    if (updateError) {
      console.error('[Telegram Webhook] Erreur liaison Store:', updateError)
      await sendMessage(chatId, `❌ Une erreur technique est survenue lors de la liaison.`)
      return
    }

    // Marquer le token comme utilisé
    await supabaseAdmin
      .from('telegram_link_tokens')
      .update({ used_at: now })
      .eq('token', token)

    // Récupérer le nom de la boutique pour le message de succès
    const { data: store } = await supabaseAdmin
      .from('Store')
      .select('name')
      .eq('id', linkToken.store_id)
      .single()

    const successMsg = `✅ <b>Félicitations !</b>\n\nVotre compte est maintenant lié à la boutique <b>${store?.name || 'PDV Pro'}</b>.\n\nVous recevrez désormais vos notifications ici.`
    await sendMessage(chatId, successMsg)
  } else {
    // Message de bienvenue standard
    const welcomeMsg = `👋 <b>Bonjour ${from.first_name} !</b>\n\nJe suis le bot officiel de <b>PDV Pro</b>.\n\n` +
      `Pour lier votre compte vendeur :\n` +
      `1. Allez dans PDV Pro → Paramètres → Telegram\n` +
      `2. Cliquez sur "Connecter Telegram"\n` +
      `3. Revenez ici et tapez /start suivi du code affiché\n\n` +
      `Exemple : <code>/start ABC123</code>`
    await sendMessage(chatId, welcomeMsg)
  }
}

/**
 * Affiche les statistiques du jour
 */
async function handleStats(chatId: string) {
  const store = await getStoreByChatId(chatId)
  if (!store) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // 1. Nombre de commandes du jour
  const { count: ordersCount } = await supabaseAdmin
    .from('Order')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)
    .gte('created_at', todayISO)

  // 2. CA du jour (seulement les commandes confirmées/payées)
  const { data: ordersData } = await supabaseAdmin
    .from('Order')
    .select('total')
    .eq('store_id', store.id)
    .gte('created_at', todayISO)
    .in('status', ['paid', 'confirmed', 'completed'])

  const caToday = (ordersData || []).reduce((acc, curr) => acc + curr.total, 0)

  // 3. Vues produits (total cumulé de la boutique)
  const { data: productsData } = await supabaseAdmin
    .from('Product')
    .select('views')
    .eq('store_id', store.id)

  const totalViews = (productsData || []).reduce((acc, curr) => acc + (curr.views || 0), 0)

  const statsMsg = `📊 <b>Stats du jour</b>\n\n` +
    `🛍️ Commandes : <b>${ordersCount || 0}</b>\n` +
    `💰 Chiffre d'Affaires : <b>${caToday.toLocaleString()} FCFA</b>\n` +
    `👁️ Vues produits : <b>${totalViews.toLocaleString()}</b>\n\n` +
    `👉 <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analytics">Voir plus de détails</a>`

  await sendMessage(chatId, statsMsg)
}

/**
 * Affiche les 5 dernières commandes
 */
async function handleCommandes(chatId: string) {
  const store = await getStoreByChatId(chatId)
  if (!store) return

  const { data: orders, error } = await supabaseAdmin
    .from('Order')
    .select('id, buyer_name, total, status, created_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !orders || orders.length === 0) {
    await sendMessage(chatId, `📭 <b>Aucune commande trouvée.</b>`)
    return
  }

  let msg = `📦 <b>5 dernières commandes</b>\n\n`
  orders.forEach(o => {
    const code = o.id.split('-')[0].toUpperCase()
    msg += `• <code>${code}</code> | ${o.buyer_name}\n`
    msg += `  <b>${o.total.toLocaleString()} FCFA</b> - <i>${translateStatus(o.status)}</i>\n\n`
  })

  msg += `👉 <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders">Gérer les commandes</a>`
  await sendMessage(chatId, msg)
}

/**
 * Affiche le solde du portefeuille
 */
async function handleWallet(chatId: string) {
  const store = await getStoreByChatId(chatId)
  if (!store) return

  const { data: wallet } = await supabaseAdmin
    .from('Wallet')
    .select('balance, pending')
    .eq('vendor_id', store.id)
    .single()

  const balance = wallet?.balance || 0
  const pending = wallet?.pending || 0

  const walletMsg = `💳 <b>Mon Portefeuille</b>\n\n` +
    `💰 Solde disponible : <b>${balance.toLocaleString()} FCFA</b>\n` +
    `⏳ En attente (COD) : <b>${pending.toLocaleString()} FCFA</b>\n\n` +
    `👉 <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet">Demander un retrait</a>`

  await sendMessage(chatId, walletMsg)
}

/**
 * Affiche l'aide
 */
async function handleAide(chatId: string) {
  const aideMsg = `🆘 <b>Commandes disponibles</b>\n\n` +
    `📊 /stats - Vos performances du jour\n` +
    `📦 /commandes - Vos 5 dernières commandes\n` +
    `💳 /wallet - Votre solde actuel\n` +
    `🆘 /aide - Affiche ce menu\n\n` +
    `<i>PDV Pro - L'excellence e-commerce en Afrique.</i>`
  await sendMessage(chatId, aideMsg)
}

/**
 * Gère les textes inconnus
 */
async function handleUnknown(chatId: string) {
  await sendMessage(chatId, `🤔 Désolé, je n'ai pas compris.\n\nTapez /aide pour voir les commandes disponibles.`)
}

// --- Helpers ---

/**
 * Récupère la boutique associée à un chat_id Telegram
 */
async function getStoreByChatId(chatId: string) {
  const { data, error } = await supabaseAdmin
    .from('Store')
    .select('id, name')
    .eq('telegram_chat_id', chatId)
    .single()

  if (error || !data) {
    await sendMessage(chatId, `🔗 <b>Compte non lié.</b>\n\nTapez /start pour voir comment lier votre compte PDV Pro.`)
    return null
  }

  return data
}

/**
 * Traduit les statuts de commande en français
 */
function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    confirmed: 'Confirmée',
    processing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    cod_pending_confirmation: 'COD en attente',
    cod_confirmed: 'COD confirmée',
    no_answer: 'Pas de réponse',
  }
  return map[status] || status
}
