/**
 * /lib/telegram/community-service.ts
 * Service de gestion des communautés Telegram liées aux boutiques PDV Pro.
 * 
 * Fonctions :
 * - handleConnectCommand : traite /connect CODE depuis un groupe
 * - createInviteLink     : crée un lien d'invitation unique (1 use, 1h)
 * - revokeMember         : révoque l'accès d'un membre via ban+unban
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramToken } from '@/lib/telegram/bot-service'

// ── handleConnectCommand ─────────────────────────────────────────────────────
// Appelé depuis le webhook quand un user tape /connect CODE dans un groupe.
// Lie le groupe Telegram à la boutique PDV Pro correspondant au code.

export async function handleConnectCommand(
  chatId: string,
  chatTitle: string,
  chatType: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()

  // 1. Chercher la community avec ce code
  const { data: community, error } = await admin
    .from('TelegramCommunity')
    .select('id, chat_id, code_expires_at, store_id')
    .eq('connect_code', code.toUpperCase())
    .maybeSingle()

  if (error) {
    console.error('[Community] handleConnectCommand DB error:', error)
    return { success: false, message: '❌ Erreur serveur. Réessayez.' }
  }

  // 2. Code non trouvé
  if (!community) {
    return {
      success: false,
      message: '❌ <b>Code invalide.</b>\n\nVérifiez le code et réessayez.\nGénérez un nouveau code dans votre Dashboard PDV Pro → Communautés.'
    }
  }

  // 3. Code expiré
  if (community.code_expires_at && new Date(community.code_expires_at) < new Date()) {
    return {
      success: false,
      message: '⏰ <b>Code expiré.</b>\n\nCe code a expiré. Générez un nouveau code dans votre Dashboard PDV Pro → Communautés.'
    }
  }

  // 4. Déjà lié
  if (community.chat_id) {
    return {
      success: false,
      message: '🔗 <b>Ce code a déjà été utilisé.</b>\n\nCe groupe ou un autre est déjà lié à cette boutique.'
    }
  }

  // 5. Lier le groupe → mettre à jour la community
  const { error: updateError } = await admin
    .from('TelegramCommunity')
    .update({
      chat_id: chatId,
      chat_title: chatTitle,
      chat_type: chatType,
      connect_code: null,       // Consommer le code
      code_expires_at: null,
      is_active: true,
    })
    .eq('id', community.id)

  if (updateError) {
    console.error('[Community] handleConnectCommand update error:', updateError)
    return { success: false, message: '❌ Erreur lors de la liaison. Réessayez.' }
  }

  // 6. Récupérer le nom de la boutique pour le message de succès
  const { data: store } = await admin
    .from('Store')
    .select('name')
    .eq('id', community.store_id)
    .single()

  return {
    success: true,
    message:
      `✅ <b>Groupe lié avec succès !</b>\n\n` +
      `Ce groupe est désormais connecté à la boutique <b>${store?.name || 'PDV Pro'}</b>.\n\n` +
      `🔒 Les acheteurs ayant payé un produit lié pourront être invités automatiquement.\n\n` +
      `Gérez cette communauté depuis votre Dashboard → Communautés.`
  }
}

// ── createInviteLink ─────────────────────────────────────────────────────────
// Crée un lien d'invitation Telegram unique (expire en 1h, 1 use max).
// Utilisé pour inviter un acheteur dans un groupe privé après un achat.

export async function createInviteLink(chatId: string): Promise<string> {
  const token = await getTelegramToken()
  if (!token) throw new Error('Token Telegram non configuré')

  const res = await fetch(
    `https://api.telegram.org/bot${token}/createChatInviteLink`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        expire_date: Math.floor(Date.now() / 1000) + 3600, // +1h
        member_limit: 1,
        creates_join_request: false,
      }),
    }
  )

  const data = await res.json()
  if (!data.ok) {
    console.error('[Community] createInviteLink error:', data.description)
    throw new Error('Impossible de créer le lien d\'invitation: ' + data.description)
  }

  return data.result.invite_link as string
}

// ── revokeMember ─────────────────────────────────────────────────────────────
// Révoque l'accès d'un membre à un groupe Telegram.
// Stratégie : ban + unban immédiat (révoque sans blacklist permanente).

export async function revokeMember(chatId: string, userId: number): Promise<void> {
  const token = await getTelegramToken()
  if (!token) throw new Error('Token Telegram non configuré')

  // Ban le membre
  await fetch(`https://api.telegram.org/bot${token}/banChatMember`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, user_id: userId }),
  })

  // Unban immédiat (permet de rejoindre via un nouveau lien plus tard si autorisé)
  await fetch(`https://api.telegram.org/bot${token}/unbanChatMember`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      user_id: userId,
      only_if_banned: true,
    }),
  })
}
