import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import ContractBanner from '@/components/vendor/ContractBanner'

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

  const storeName        = store?.name     ?? 'Mon Espace'
  const vendorName       = userProfile?.name    ?? (user.user_metadata?.name as string) ?? 'Vendeur'
  const avatarUrl        = userProfile?.avatar_url ?? null
  const contractAccepted = store?.contract_accepted ?? true
  const storeVendorType  = (store?.vendor_type as 'digital' | 'physical' | 'hybrid' | null) ?? 'digital'
  // true par défaut : ne pas bloquer si le store n'existe pas encore

  return (
    <div className="flex min-h-screen bg-[#FAFAF7]">
      <Sidebar storeName={storeName} userName={vendorName} avatarUrl={avatarUrl} vendorType={storeVendorType} />

      <main className="flex-1 bg-[#FAFAF7] min-w-0 min-h-screen overflow-auto">
        {/* Bandeau alerte contrat — affiché uniquement si non signé */}
        {!contractAccepted && store && (
          <ContractBanner
            storeId={store.id}
            storeName={store.name}
            vendorName={vendorName}
          />
        )}

        <div className="pt-14 lg:pt-0 pb-12">
          {children}
        </div>
      </main>
    </div>
  )
}
