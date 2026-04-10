import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleConnectCommand } from '@/lib/telegram/community-service'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    // ── Vérification du secret Telegram ────────────────────────────────────
    // Telegram envoie ce header si configuré via setWebhook({ secret_token })
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token')
    if (TELEGRAM_WEBHOOK_SECRET && secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
      console.warn('[Webhook Telegram] ⛔ Secret token invalide')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = await req.json()
    const admin = createAdminClient()

    // 1. Handle command /connect
    if (update.message?.text?.startsWith('/connect ')) {
      const code = update.message.text.split(' ')[1]
      const chatId = String(update.message.chat.id)
      const chatTitle = update.message.chat.title || 'Private Group'
      const chatType = update.message.chat.type

      if (code) {
        const result = await handleConnectCommand(chatId, chatTitle, chatType, code)
        // Reply
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: result.message, parse_mode: 'HTML' })
        })
      }
      return NextResponse.json({ ok: true })
    }

    // 2. Handle command /lier (Link Product)
    if (update.message?.text?.startsWith('/lier')) {
      const chatId = String(update.message.chat.id)
      
      // Find the community
      const { data: community } = await admin
        .from('TelegramCommunity')
        .select('id, store_id')
        .eq('chat_id', chatId)
        .single()

      if (!community) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: '❌ Ce groupe n\'est pas lié à une boutique Yayyam.' })
        })
        return NextResponse.json({ ok: true })
      }

      // Fetch store products
      const { data: products } = await admin
        .from('Product')
        .select('id, name')
        .eq('store_id', community.store_id)
        .eq('is_active', true)
        .limit(10) // Display max 10 for inline kb

      if (!products || products.length === 0) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: '⚠️ Aucun produit disponible dans votre boutique.' })
        })
        return NextResponse.json({ ok: true })
      }

      // Inline Keyboard
      const inline_keyboard = products.map(p => ([{
        text: `📦 ${p.name}`,
        callback_data: `link_prod:${p.id}`
      }]))

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: 'Sélectionnez le produit à lier à ce groupe :',
          reply_markup: { inline_keyboard }
        })
      })
      return NextResponse.json({ ok: true })
    }

    // 3. Handle Callback Query (from Inline Keyboard)
    if (update.callback_query) {
      const data = update.callback_query.data
      if (data?.startsWith('link_prod:')) {
        const productId = data.split(':')[1]
        const chatId = String(update.callback_query.message.chat.id)
        
        // Update community product
        await admin
          .from('TelegramCommunity')
          .update({ product_id: productId })
          .eq('chat_id', chatId)

        // Get product name
        const { data: product } = await admin.from('Product').select('name').eq('id', productId).single()

        // Answer callback query
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: update.callback_query.id, text: 'Produit Lié ✅' })
        })

        // Edit message
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: chatId, 
            message_id: update.callback_query.message.message_id,
            text: `✅ Ce groupe est désormais lié au produit : <b>${product?.name || 'Inconnu'}</b>`,
            parse_mode: 'HTML'
          })
        })
      }
      return NextResponse.json({ ok: true })
    }

    // 4. Handle Chat Member Updated (Mapping invite_link to user_id)
    // NOTE: This triggers when someone uses our generated invite link.
    const chatMember = update.chat_member || update.chat_join_request
    if (chatMember && chatMember.invite_link?.invite_link) {
      const inviteLinkUsed = chatMember.invite_link.invite_link
      const telegramUserId = String(chatMember.from?.id || chatMember.new_chat_member?.user?.id)

      if (inviteLinkUsed && telegramUserId && telegramUserId !== 'undefined') {
        const { error } = await admin
          .from('TelegramCommunityAccess')
          .update({ telegram_user_id: telegramUserId })
          .eq('invite_link', inviteLinkUsed)
        
        if (error) console.error('[Webhook Telegram] Erreur mapping user_id:', error)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WEBHOOK TELEGRAM ERROR]', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
