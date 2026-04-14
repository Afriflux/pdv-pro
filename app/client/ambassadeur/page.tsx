import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAmbassadorStats } from '@/lib/ambassador/ambassador-service'
import type { AmbassadorStats } from '@/lib/ambassador/ambassador-service'
import AmbassadorDashboard from '@/components/ambassador/AmbassadorDashboard'
import AmbassadorOnboarding from '@/components/ambassador/AmbassadorOnboarding'

export default async function AmbassadeurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const stats: AmbassadorStats | null = await getAmbassadorStats(user.id)

  if (!stats) {
    return <AmbassadorOnboarding />
  }

  return <AmbassadorDashboard stats={stats} />
}
