import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications/createNotification'

export async function GET(req: Request) {
  // 1. Auth token
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // 2. Tous les stores
  const { data: stores } = await supabase
    .from('Store')
    .select('id, user_id, name')

  let notified = 0

  for (const store of (stores ?? [])) {
    // 3. Vérifier dernière commande confirmée
    const { data: recentOrders } = await supabase
      .from('Order')
      .select('id')
      .eq('store_id', store.id)
      .in('status', ['paid','confirmed','completed','delivered'])
      .gte('created_at', fourteenDaysAgo.toISOString())
      .limit(1)

    if (recentOrders && recentOrders.length > 0) continue // Actif

    // 4. Vérifier notification récente
    const { data: recentNotif } = await supabase
      .from('Notification')
      .select('id')
      .eq('user_id', store.user_id)
      .eq('type', 'churn_alert')
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(1)

    if (recentNotif && recentNotif.length > 0) continue // Déjà notifié

    // 5. Envoyer notification
    await createNotification({
      userId: store.user_id,
      type: 'churn_alert',
      title: '💤 Votre boutique est en veille',
      message: `Aucune vente depuis 14 jours sur "${store.name}". Partagez votre lien boutique sur WhatsApp pour relancer vos ventes !`,
      link: '/dashboard/marketing',
      supabaseClient: supabase,
    })
    notified++
  }

  return NextResponse.json({ notified, checked: stores?.length ?? 0 })
}
