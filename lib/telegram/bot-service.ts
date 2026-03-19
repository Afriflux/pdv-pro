/**
 * /lib/telegram/bot-service.ts
 * Service principal pour l'interaction avec l'API Telegram Bot.
 * Gère l'envoi de messages et les notifications automatiques pour les vendeurs.
 * 
 * Variables d'env requises :
 * - TELEGRAM_BOT_TOKEN
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

// Initialisation du client Supabase Admin (Bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Cache token Telegram (5 min) ──
let _cachedToken: string | null = null
let _cachedTokenAt = 0
const TOKEN_CACHE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Récupère le token Telegram depuis PlatformConfig (cache 5 min),
 * avec fallback sur la variable d'environnement.
 */
export async function getTelegramToken(): Promise<string | null> {
  // Cache valide ?
  if (_cachedToken && Date.now() - _cachedTokenAt < TOKEN_CACHE_MS) {
    return _cachedToken
  }
  try {
    const { data } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', 'TELEGRAM_BOT_TOKEN')
      .single()
    if (data?.value) {
      _cachedToken = data.value as string
      _cachedTokenAt = Date.now()
      return _cachedToken
    }
  } catch {
    // fallback env
  }
  const envToken = process.env.TELEGRAM_BOT_TOKEN || null
  if (envToken) {
    _cachedToken = envToken
    _cachedTokenAt = Date.now()
  }
  return envToken
}

// --- Types ---

export interface TelegramMessageOptions {
  parse_mode?: 'HTML' | 'Markdown'
  disable_notification?: boolean
  reply_markup?: Record<string, unknown>
}

export interface OrderNotificationData {
  orderId: string
  customerName: string
  amount: number
  itemCount: number
  paymentMethod: string
}

// --- Fonctions de base ---

/**
 * Envoie un message direct via l'API Telegram.
 * @param chatId L'ID du chat Telegram destinataire
 * @param text Le contenu du message
 * @param options Options de formatage et d'envoi
 */
export async function sendMessage(
  chatId: string,
  text: string,
  options: TelegramMessageOptions = { parse_mode: 'HTML' }
): Promise<boolean> {
  const token = await getTelegramToken()

  if (!token) {
    console.warn('[Telegram] Token manquant (ni PlatformConfig ni env). Envoi annulé.')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('[Telegram] Erreur API:', data.description)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Erreur de connexion:', error)
    return false
  }
}

/**
 * Récupère les informations de notification Telegram d'une boutique.
 * @param storeId L'ID de la boutique
 */
async function getStoreTelegramInfo(storeId: string) {
  const { data, error } = await supabaseAdmin
    .from('Store')
    .select('telegram_chat_id, telegram_notifications')
    .eq('id', storeId)
    .single()

  if (error || !data) {
    console.error(`[Telegram] Boutique ${storeId} introuvable ou erreur DB:`, error)
    return null
  }

  return data
}

// --- Fonctions de notification ---

/**
 * Notifie le vendeur d'une nouvelle commande.
 */
export async function notifyNewOrder(storeId: string, order: OrderNotificationData): Promise<void> {
  try {
    const info = await getStoreTelegramInfo(storeId)
    if (!info?.telegram_chat_id) return

    const prefs = info.telegram_notifications as Record<string, boolean>
    if (prefs?.orders === false) return

    const message = `🛍️ <b>Nouvelle commande !</b>\n\n` +
      `👤 Client : <b>${order.customerName}</b>\n` +
      `💰 Montant : <b>${order.amount.toLocaleString()} FCFA</b>\n` +
      `📦 Articles : ${order.itemCount}\n` +
      `💳 Paiement : ${order.paymentMethod}\n` +
      `🔖 Réf : <code>${orderIdToCode(order.orderId)}</code>\n\n` +
      `👉 <a href="https://pdv-pro.vercel.app/dashboard/orders/${order.orderId}">Voir sur PDV Pro</a>`

    await sendMessage(info.telegram_chat_id, message)
  } catch (error) {
    console.error('[Telegram] Erreur notifyNewOrder:', error)
  }
}

/**
 * Notifie le vendeur d'un paiement reçu.
 */
export async function notifyPaymentReceived(storeId: string, amount: number, method: string): Promise<void> {
  try {
    const info = await getStoreTelegramInfo(storeId)
    if (!info?.telegram_chat_id) return

    const prefs = info.telegram_notifications as Record<string, boolean>
    if (prefs?.payments === false) return

    const message = `✅ <b>Paiement reçu !</b>\n\n` +
      `💰 Montant : <b>${amount.toLocaleString()} FCFA</b>\n` +
      `💳 Méthode : ${method}\n\n` +
      `Votre wallet a été crédité.`

    await sendMessage(info.telegram_chat_id, message)
  } catch (error) {
    console.error('[Telegram] Erreur notifyPaymentReceived:', error)
  }
}

/**
 * Notifie le vendeur d'un nouveau message WhatsApp reçu.
 */
export async function notifyNewWhatsApp(storeId: string, from: string, message: string): Promise<void> {
  try {
    const info = await getStoreTelegramInfo(storeId)
    if (!info?.telegram_chat_id) return

    const prefs = info.telegram_notifications as Record<string, boolean>
    if (prefs?.whatsapp === false) return

    const telegramMessage = `💬 <b>Nouveau message WhatsApp</b>\n\n` +
      `👤 De : <b>${from}</b>\n` +
      `✉️ "<i>${message}</i>"\n\n` +
      `👉 <a href="https://pdv-pro.vercel.app/dashboard/messages">Répondre sur PDV Pro</a>`

    await sendMessage(info.telegram_chat_id, telegramMessage)
  } catch (error) {
    console.error('[Telegram] Erreur notifyNewWhatsApp:', error)
  }
}

/**
 * Notifie le vendeur d'un stock faible.
 */
export async function notifyLowStock(storeId: string, productName: string, stock: number): Promise<void> {
  try {
    const info = await getStoreTelegramInfo(storeId)
    if (!info?.telegram_chat_id) return

    const prefs = info.telegram_notifications as Record<string, boolean>
    if (prefs?.stock === false) return

    const message = `⚠️ <b>Stock faible !</b>\n\n` +
      `📦 Produit : <b>${productName}</b>\n` +
      `🔢 Stock restant : <b>${stock} unités</b>\n\n` +
      `👉 <a href="https://pdv-pro.vercel.app/dashboard/products">Réapprovisionner</a>`

    await sendMessage(info.telegram_chat_id, message)
  } catch (error) {
    console.error('[Telegram] Erreur notifyLowStock:', error)
  }
}

/**
 * Formate un UUID de commande pour l'affichage (tronqué).
 */
function orderIdToCode(orderId: string): string {
  return orderId.split('-')[0].toUpperCase()
}
