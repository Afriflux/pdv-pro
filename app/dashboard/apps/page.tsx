import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AppStoreClient } from './AppStoreClient'

export const metadata = {
  title: 'App Store | Yayyam',
  description: 'Installez des applications pour boostez vos ventes',
}

export default async function AppStorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let installedApps: string[] = []
  if (user) {
    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (store) {
      const apps = await prisma.installedApp.findMany({
        where: { store_id: store.id, status: 'active' },
        select: { app_id: true }
      })
      installedApps = apps.map(a => a.app_id)
    }
  }

  return <AppStoreClient initialInstalled={installedApps} />
}
