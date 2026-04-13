import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'
import ContractBanner from '@/components/vendor/ContractBanner'
import GlobalCoach from '@/components/dashboard/GlobalCoach'
import LiveNotificationListener from '@/components/dashboard/LiveNotificationListener'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger store + profil utilisateur en parallèle
  const [storeRes, userRes] = await Promise.all([
    supabase
      .from('Store')
      .select('id, name, contract_accepted, vendor_type')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('User')
      .select('name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  type StoreRow = { id: string; name: string; contract_accepted: boolean | null; vendor_type: string | null }
  type UserRow  = { name: string; avatar_url: string | null }

  const store      = storeRes.data as StoreRow | null
  const userProfile = userRes.data as UserRow | null

  // Fetch installed apps if store exists
  let installedApps: string[] = []
  if (store) {
    const apps = await prisma.installedApp.findMany({ take: 50, 
      where: { store_id: store.id, status: 'active' },
      select: { app_id: true }
    })
    installedApps = apps.map(a => a.app_id)
  }

  const storeName        = store?.name     ?? 'Mon Espace'
  const vendorName       = userProfile?.name    ?? (user.user_metadata?.name as string) ?? 'Vendeur'
  const avatarUrl        = userProfile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? (user.user_metadata?.picture as string) ?? null
  const contractAccepted = store?.contract_accepted ?? true
  const storeVendorType  = (store?.vendor_type as 'digital' | 'physical' | 'hybrid' | null) ?? 'digital'
  // true par défaut : ne pas bloquer si le store n'existe pas encore

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        storeName={storeName} 
        userName={vendorName} 
        avatarUrl={avatarUrl} 
        vendorType={storeVendorType} 
        installedApps={installedApps}
      />

      <main className="relative flex-1 bg-gray-50 min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        
        {/* 🌟 UNIVERSAL MESH BACKGROUND 🌟 */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-300/10 blur-[130px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:10s]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-teal-300/10 blur-[120px] pointer-events-none mix-blend-multiply animate-pulse [animation-duration:12s] [animation-delay:2s]" />
        </div>

        <div className="relative z-10 w-full h-full">
          <GlobalHomeButton />
        {/* Bandeau alerte contrat — affiché uniquement si non signé */}
        {!contractAccepted && store && (
          <ContractBanner
            storeId={store.id}
            storeName={store.name}
            vendorName={vendorName}
          />
        )}

        <div className="pt-12 lg:pt-0 pb-24 lg:pb-12 w-full max-w-[2000px] mx-auto px-3 lg:px-8 xl:px-10 min-h-full">
          {children}
        </div>
        </div>
      </main>

      {/* Bottom Tab Bar Mobile */}
      <MobileBottomNav
        storeName={storeName}
        userName={vendorName}
        avatarUrl={avatarUrl}
      />

      {/* Le Coach IA Ultime Omniprésent */}
      <GlobalCoach />
      
      {/* L'écouteur Web Push Temps Réel ("Cha-Ching") */}
      <LiveNotificationListener />
    </div>
  )
}
