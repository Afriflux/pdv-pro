import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret, cronResponse } from '@/lib/cron/cron-helpers'

// ----------------------------------------------------------------
// POST /api/cron/nettoyage
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Sécurité
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Non autorisé' }, 401)
  }

  const supabase = createAdminClient()
  
  let tokensDeleted = 0
  let ordersArchived = 0

  // 2. Supprimer les tokens Telegram expirés (plus de 7 jours)
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { count, error: tokenError } = await supabase
      .from('telegram_link_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', sevenDaysAgo)

    if (tokenError) {
      console.error('[Cron Nettoyage] Erreur suppressions tokens:', tokenError)
    } else {
      tokensDeleted = count || 0
    }
  } catch (err: unknown) {
    console.error('[Cron Nettoyage] Exception tokens:', err instanceof Error ? err.message : err)
  }

  // 3. Archiver les vieilles commandes (Status final + plus de 6 mois)
  try {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()

    const { count, error: orderError } = await supabase
      .from('Order')
      .update({ is_archived: true }, { count: 'exact' })
      .in('status', ['cancelled', 'completed'])
      .lt('updated_at', sixMonthsAgo)
      .eq('is_archived', false)

    if (orderError) {
      console.error('[Cron Nettoyage] Erreur archivage commandes:', orderError)
    } else {
      ordersArchived = count || 0
    }
  } catch (err: unknown) {
    console.error('[Cron Nettoyage] Exception archivage:', err instanceof Error ? err.message : err)
  }

  // 4. Réponse
  return cronResponse({
    tokens_deleted: tokensDeleted,
    orders_archived: ordersArchived
  })
}
