import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import TelegramDashboard from './TelegramDashboard'

export const dynamic = 'force-dynamic'

export default async function TelegramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Store du vendeur
  const { data: store } = await admin
    .from('Store')
    .select('id, name, slug, telegram_chat_id')
    .eq('user_id', user.id)
    .single()
  if (!store) redirect('/dashboard')

  // Communautés liées
  const { data: communities } = await admin
    .from('TelegramCommunity')
    .select('id, chat_id, chat_title, chat_type, product_id, is_active, members_count, created_at')
    .eq('store_id', store.id)
    .not('chat_id', 'is', null)
    .order('created_at', { ascending: false })

  // Produits du vendeur (pour le linking dropdown)
  const { data: products } = await admin
    .from('Product')
    .select('id, name, type, price')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('name')

  // Stats d'accès récents
  const { data: recentAccess } = await admin
    .from('TelegramCommunityAccess')
    .select('id, buyer_phone, sent_at, community_id')
    .in('community_id', (communities || []).map(c => c.id))
    .order('sent_at', { ascending: false })
    .limit(10)

  return (
    <TelegramDashboard
      store={store}
      communities={communities || []}
      products={products || []}
      recentAccess={recentAccess || []}
    />
  )
}
