import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreAnalytics } from '@/lib/analytics/analyticsActions'
import AnalyticsLazyWrapper from './AnalyticsLazyWrapper'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { days?: string }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger le store via Supabase
  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Tous les vendeurs ont accès jusqu'à 90 jours
  const requestedDays = Math.min(
    Math.max(parseInt(searchParams.days ?? '7', 10), 1),
    90,
  )

  const data = await getStoreAnalytics(store.id, requestedDays)

  return (
    <main>
      <AnalyticsLazyWrapper
        data={data}
        currentPeriod={requestedDays}
        storeName={data.storeName}
      />
    </main>
  )
}
