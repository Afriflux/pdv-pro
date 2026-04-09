import { createAdminClient } from '@/lib/supabase/admin'
import { createInviteLink } from '@/lib/telegram/community-service'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'

export async function sendTelegramCommunityAccess({
  orderId,
  productId,
  buyerPhone,
  buyerName,
}: {
  orderId: string
  productId: string
  buyerPhone: string
  buyerName: string
}): Promise<void> {
  try {
    const admin = createAdminClient()

    // 1. Chercher communauté Telegram liée au produit
    const { data: community } = await admin
      .from('TelegramCommunity')
      .select('id, chat_id, chat_title, is_active')
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle()

    if (!community?.chat_id) return

    // 2. Créer lien d'invitation unique (1 use, 1h)
    const inviteLink = await createInviteLink(community.chat_id)

    // 3. Message WhatsApp
    const message =
      `🎉 Félicitations ${buyerName} !\n\n` +
      `Votre accès au groupe *${community.chat_title}* est prêt :\n\n` +
      `👉 ${inviteLink}\n\n` +
      `⏰ Ce lien est valable 1 heure et à usage unique.\n` +
      `Cliquez dessus pour rejoindre le groupe immédiatement.`

    console.log(`[TelegramAccess] Order ${orderId} → ${community.chat_title} → ${buyerPhone}`)
    console.log(`[TelegramAccess] Invite link: ${inviteLink}`)

    // 4. Envoyer via WhatsApp
    if (buyerPhone) {
      try {
        const sent = await sendWhatsApp({
          to: buyerPhone,
          body: message
        })
        
        if (sent) {
          console.log(`[TelegramAccess] WhatsApp envoyé à ${buyerPhone}`)
        } else {
          console.error(`[TelegramAccess] Échec WhatsApp pour ${buyerPhone}`)
        }
      } catch (err) {
        console.error('[TelegramAccess] WhatsApp exception:', err)
      }
    }

    // 5. Audit trail en DB (non bloquant)
    const { error: insErr } = await admin.from('TelegramCommunityAccess').insert({
      order_id:     orderId,
      community_id: community.id,
      buyer_phone:  buyerPhone,
      invite_link:  inviteLink,
      sent_at:      new Date().toISOString(),
    });
    if (insErr) console.error('[TelegramAccess] Erreur DB:', insErr);

  } catch (err) {
    console.error('[TelegramAccess] Erreur globale:', err)
    // Non bloquant — ne jamais faire échouer le paiement
  }
}
