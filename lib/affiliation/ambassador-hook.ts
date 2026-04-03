import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage } from '@/lib/telegram/bot-service'
import { notifyAffiliateSaleDelivered } from '@/lib/notifications/createNotification'

/**
 * Crédite le portefeuille d'un ambassadeur (affilié) lorsqu'une commande
 * contenant son token de tracking est confirmée/livrée.
 */
export async function triggerAmbassadorCommission(
  orderId: string,
  affiliateToken: string | null,
  affiliateAmount: number | null
): Promise<void> {
  if (!affiliateToken || !affiliateAmount || affiliateAmount <= 0) return

  try {
    const supabaseAdmin = createAdminClient()

    // 1. Trouver l'affilié via son token
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('Affiliate')
      .select('id, user_id, total_earned, conversions, balance, status, telegram_chat_id')
      .eq('token', affiliateToken)
      .single()

    if (affError || !affiliate || affiliate.status !== 'active') {
      console.log(`[AmbassadorHook] Affilié ignoré (inactif ou non trouvé) - Token: ${affiliateToken}`)
      return
    }

    // 2. Mettre à jour les statistiques globales de l'Affilié
    const newTotalEarned = (affiliate.total_earned || 0) + affiliateAmount
    const newConversions = (affiliate.conversions || 0) + 1
    const newBalance = (affiliate.balance || 0) + affiliateAmount

    await supabaseAdmin
      .from('Affiliate')
      .update({
        total_earned: newTotalEarned,
        conversions: newConversions,
        balance: newBalance
      })
      .eq('id', affiliate.id)

    console.log(`[AmbassadorHook] Succès: ${affiliateAmount} F crédités à l'ambassadeur ${affiliateToken}.`)

    // 3. Envoyer la notification in-app
    notifyAffiliateSaleDelivered({
      userId: affiliate.user_id,
      productName: `Commande #${orderId.split('-')[0].toUpperCase()}`,
      amount: affiliateAmount
    }).catch(e => console.error('[AmbassadorHook] Erreur in-app notification:', e))

    // 3. Envoyer Notification Telegram si connecté
    if (affiliate.telegram_chat_id) {
      const msg = `💸 <b>Nouvelle Commission !</b>\n\n` +
                  `Félicitations, vous venez de générer une vente !\n\n` +
                  `💰 Gain : <b>${affiliateAmount.toLocaleString()} FCFA</b>\n` +
                  `🛒 Commande : <code>${orderId.split('-')[0].toUpperCase()}</code>\n\n` +
                  `<i>Continuez comme ça !</i> 🚀`
      
      await sendMessage(affiliate.telegram_chat_id, msg)
        .catch(e => console.error('[AmbassadorHook] Erreur envoi Telegram:', e))
    }

  } catch (err) {
    console.error(`[AmbassadorHook] Erreur générale lors du crédit ambassadeur pour l'ordre ${orderId}:`, err)
  }
}
