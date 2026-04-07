// ─── app/admin/kyc/page.tsx ───────────────────────────────────────────────────
// Server Component — liste des dossiers KYC à traiter
// Auth : super_admin ou gestionnaire uniquement

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import KYCClient, { StoreKYC } from './KYCClient'

// No more Mock Data

// ─── Page principale ──────────────────────────────────────────────────────────
export default async function AdminKYCPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams
  const currentStatus = params.status || 'submitted'
  
  // 1. Auth admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const supabaseAdmin = createAdminClient()
  const { data: adminUser } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['super_admin', 'gestionnaire']
  if (!adminUser?.role || !allowedRoles.includes(adminUser.role)) {
    redirect('/admin')
  }

  // 2. Charger les stats globales
  const { data: allStoreData } = await supabaseAdmin
    .from('Store')
    .select('kyc_status')

  const { data: allUserData } = await supabaseAdmin
    .from('User')
    .select('kyc_status')
    .neq('kyc_status', 'unverified') // Ignore unverified users to avoid cluttering stats

  const allStores = allStoreData ?? []
  const allUsers = allUserData ?? []
  
  let stores: StoreKYC[] = []
  // 3. Charger les dossiers réels filtrés
  const { data: pendingStoreKYC } = await supabaseAdmin
    .from('Store')
    .select(`
      id, name, slug, kyc_status, kyc_document_type,
      kyc_documents, id_card_url, created_at, user_id
    `)
    .eq('kyc_status', currentStatus)
    .order('created_at', { ascending: true })

  const { data: pendingUserKYC } = await supabaseAdmin
    .from('User')
    .select(`
      id, name, role, kyc_status, kyc_document_type,
      kyc_documents, id_card_url, created_at
    `)
    .eq('kyc_status', currentStatus)
    .order('created_at', { ascending: true })

  const mappedUserKYC: StoreKYC[] = (pendingUserKYC || []).map(u => ({
    id: u.id,
    name: u.name || 'Utilisateur Anonyme',
    slug: `user-${u.id}`,
    kyc_status: u.kyc_status as any,
    kyc_document_type: u.kyc_document_type,
    kyc_documents: u.kyc_documents as any,
    id_card_url: u.id_card_url,
    created_at: u.created_at || new Date().toISOString(),
    user_id: u.id
  }))

  stores = [...((pendingStoreKYC ?? []) as StoreKYC[]), ...mappedUserKYC].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Calcul KPI combiné
  const combinedStats = [...allStores, ...allUsers].reduce((acc: any, curr) => {
    acc[curr.kyc_status] = (acc[curr.kyc_status] || 0) + 1
    return acc
  }, {})

  const totalSubmitted = combinedStats['submitted'] || 0
  const totalVerified = combinedStats['verified'] || 0
  const totalRejected = combinedStats['rejected'] || 0
  const totalProfiles = allStores.length + allUsers.length

  return (
    <KYCClient 
      stores={stores}
      currentStatus={currentStatus}
      totalSubmitted={totalSubmitted}
      totalVerified={totalVerified}
      totalRejected={totalRejected}
      totalProfiles={totalProfiles}
      isDemoMode={false}
    />
  )
}
