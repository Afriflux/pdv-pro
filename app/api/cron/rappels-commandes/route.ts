import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret, cronResponse, isOlderThan } from '@/lib/cron/cron-helpers'

// ----------------------------------------------------------------
// POST /api/cron/rappels-commandes
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Sécurité
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Non autorisé' }, 401)
  }

  const supabase = createAdminClient()
  let remindersSent = 0

  try {
    // 2. Récupérer les commandes nécessitant un rappel
    // - Pending > 48h
    // - Confirmed > 72h (pas encore expédiées/livrées)
    // Filtre de base sur le statut, le filtrage temporel se fait en JS pour plus de flexibilité
    const { data: orders, error: fetchError } = await supabase
      .from('Order')
      .select(`
        id,
        status,
        created_at,
        last_reminder_at,
        total,
        quantity,
        buyer_name,
        store_id,
        Store (
          id,
          user_id
        )
      `)
      .in('status', ['pending', 'confirmed'])

    if (fetchError) throw fetchError

    if (!orders || orders.length === 0) {
      return cronResponse({ reminders_sent: 0, message: 'Aucune commande à relancer' })
    }

    for (const order of orders) {
      // Éviter les rappels multiples trop proches (< 24h)
      if (order.last_reminder_at && !isOlderThan(order.last_reminder_at, 24)) {
        continue
      }

      let shouldRemind = false
      let message = ""

      if (order.status === 'pending' && isOlderThan(order.created_at, 48)) {
        shouldRemind = true
        message = `⚠️ Commande en attente depuis 48h (ID: ${order.id.slice(0,8)}) — pensez à la traiter.`
      } else if (order.status === 'confirmed' && isOlderThan(order.created_at, 72)) {
        shouldRemind = true
        message = `📦 Commande confirmée depuis 72h (ID: ${order.id.slice(0,8)}) — elle n'est pas encore expédiée.`
      }

      if (shouldRemind) {
        // Envoi notification Telegram via bot-service (pour message personnalisé)
        // Note: Ici on utilise notifyNewOrder comme base ou on pourrait appeler directement sendMessage
        // Mais pour respecter l'objectif "Envoyer notification Telegram", on va essayer de passer par le service.
        
        try {
          // On peut utiliser la fonction de base sendMessage si disponible ou notifyNewOrder
          // Le prompt demande d'utiliser le canal Telegram.
          
          // Récupérer le chat_id du store
          const { data: storeInfo } = await supabase
            .from('Store')
            .select('telegram_chat_id, telegram_notifications')
            .eq('id', order.store_id)
            .single()

          if (storeInfo?.telegram_chat_id && storeInfo?.telegram_notifications?.orders !== false) {
             // Import et appel dynamique pour Telegram
             const { sendMessage } = await import('@/lib/telegram/bot-service')
             await sendMessage(storeInfo.telegram_chat_id, message)
             
             // Mettre à jour la date du dernier rappel
             await supabase
               .from('Order')
               .update({ last_reminder_at: new Date().toISOString() })
               .eq('id', order.id)

             remindersSent++
          }
        } catch (err) {
          console.error(`[Cron Rappel] Erreur pour commande ${order.id}:`, err)
        }
      }
    }

    return cronResponse({ reminders_sent: remindersSent })

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[CRON Rappels] Global Error:', errorMsg)
    return cronResponse({ error: errorMsg }, 500)
  }
}
