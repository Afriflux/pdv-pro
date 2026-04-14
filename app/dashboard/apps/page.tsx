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
      const apps = await prisma.installedApp.findMany({ take: 50, 
        where: { store_id: store.id, status: 'active' },
        select: { app_id: true }
      })
      installedApps = apps.map(a => a.app_id)
    }
  }

  const dbApps = await prisma.marketplaceApp.findMany({ take: 50, 
    where: { active: true },
    orderBy: { created_at: 'asc' }
  })

  // Récupération des PaymentIntegrations inactifs
  const inactiveIntegrations = await prisma.paymentIntegration.findMany({
    where: { is_active: false },
    select: { provider: true }
  })
  const inactiveProviders = new Set(inactiveIntegrations.map(p => p.provider))

  // Masquage global dans l'App Store
  const filteredDbApps = dbApps.filter(app => !inactiveProviders.has(app.id))

  return <AppStoreClient initialInstalled={installedApps} dbApps={filteredDbApps as any} />
}
