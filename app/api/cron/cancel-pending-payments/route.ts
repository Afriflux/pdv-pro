import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Vérifier le header d'Auth Vercel pour empêcher un abus depuis l'extérieur (optionnel mais sécurisé)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // On annule les paiements online en attente dont le timestamp (created_at) est > 5 min
  const expirationTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('Order')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .neq('payment_method', 'cod') // IMPORTANT: Les paiements à la livraison peuvent rester "pending"
    .lt('created_at', expirationTime)
    .select('id')

  if (error) {
    console.error('[CRON] Erreur lors de l\'annulation des paiements expirés:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  console.log(`[CRON] Annulation automatique de ${data?.length || 0} commandes non payées à temps.`)
  return NextResponse.json({ success: true, count: data?.length || 0, cancelled_orders: data })
}
