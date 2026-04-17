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

  let userRole = 'acheteur';
  let installedApps: string[] = []
  
  if (user) {
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });
    if (userDb?.role) {
      userRole = userDb.role;
    }

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

  // Mapping DB role to App allowed_roles
  let mappedRole = 'user';
  if (userRole === 'vendeur') mappedRole = 'vendor';
  else if (userRole === 'affilie') mappedRole = 'affiliate';
  else if (userRole === 'closer') mappedRole = 'closer';
  else if (userRole === 'super_admin' || userRole === 'gestionnaire') mappedRole = 'admin';

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

  // Masquage global dans l'App Store ET Filtrage par Audience Ciblée (Rôle)
  const filteredDbApps = dbApps.filter(app => {
    // 1. Exclure les intégrations masquées
    if (inactiveProviders.has(app.id)) return false;
    
    // 2. Audience ciblée
    if (app.allowed_roles && Array.isArray(app.allowed_roles) && app.allowed_roles.length > 0) {
      if (!app.allowed_roles.includes('all') && !app.allowed_roles.includes(mappedRole) && mappedRole !== 'admin') {
        return false;
      }
    }
    
    return true;
  });

  return <AppStoreClient initialInstalled={installedApps} dbApps={filteredDbApps as any} />
}
