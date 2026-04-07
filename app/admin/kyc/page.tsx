// ─── app/admin/kyc/page.tsx ───────────────────────────────────────────────────
// Server Component — liste des dossiers KYC à traiter
// Auth : super_admin ou gestionnaire uniquement

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import KYCClient, { StoreKYC } from './KYCClient'

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_KYC_STORES: StoreKYC[] = [
  {
    id: 'mock-kyc-1',
    name: 'Moussa Electronics',
    slug: 'moussa-electronics',
    kyc_status: 'submitted',
    kyc_document_type: 'cni',
    kyc_documents: {
      full_name: 'Moussa Diop',
      id_card_url: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?q=80&w=1000',
      id_card_back_url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=1000',
      domicile_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000',
      submitted_at: new Date().toISOString(),
    },
    id_card_url: null,
    created_at: new Date().toISOString(),
    user_id: 'mock-user-1'
  },
  {
    id: 'mock-kyc-2',
    name: 'Fatou Cosmetics',
    slug: 'fatou-cosmetics',
    kyc_status: 'verified',
    kyc_document_type: 'passeport',
    kyc_documents: {
      full_name: 'Fatou Ndiaye',
      id_card_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000',
      submitted_at: new Date(Date.now() - 86400000).toISOString(),
    },
    id_card_url: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'mock-user-2'
  },
  {
    id: 'mock-kyc-3',
    name: 'Dakar Sneakz',
    slug: 'dakar-sneakz',
    kyc_status: 'rejected',
    kyc_document_type: 'permis',
    kyc_documents: {
      full_name: 'Amadou Sow',
      id_card_url: 'https://images.unsplash.com/photo-1544256718-3b61023f0449?q=80&w=1000',
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      rejection_reason: 'La photo du permis est illisible et expirée depuis 2021.'
    },
    id_card_url: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    user_id: 'mock-user-3'
  },
  {
    id: 'mock-kyc-4',
    name: 'Tech Store Cheap',
    slug: 'tech-store',
    kyc_status: 'submitted',
    kyc_document_type: 'cni',
    kyc_documents: {
      full_name: 'Ousmane Fall',
      id_card_url: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?q=80&w=1000',
      submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    id_card_url: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    user_id: 'mock-user-4'
  },
  {
    id: 'mock-kyc-5',
    name: 'Gamer Zone',
    slug: 'gamer-zone',
    kyc_status: 'submitted',
    kyc_document_type: 'passeport',
    kyc_documents: {
      full_name: 'Binta Fall',
      id_card_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000',
      submitted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    id_card_url: null,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    user_id: 'mock-user-5'
  }
]

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
  const { data: allStoreData, error: storeError } = await supabaseAdmin
    .from('Store')
    .select('kyc_status')

  const { data: allUserData, error: userError } = await supabaseAdmin
    .from('User')
    .select('kyc_status')
    .neq('kyc_status', 'unverified') // Ignore unverified users to avoid cluttering stats

  let allStores = allStoreData ?? []
  const allUsers = allUserData ?? []
  
  let stores: StoreKYC[] = []
  let isDemoMode = false

  // MODE DÉMO si aucune donnée
  if ((allStores.length === 0 && allUsers.length === 0) || storeError || userError) {
    isDemoMode = true
    allStores = MOCK_KYC_STORES as unknown as any[]
    stores = MOCK_KYC_STORES.filter(s => s.kyc_status === currentStatus)
  } else {
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
      kyc_status: u.kyc_status,
      kyc_document_type: u.kyc_document_type,
      kyc_documents: u.kyc_documents as any,
      id_card_url: u.id_card_url,
      created_at: u.created_at || new Date().toISOString(),
      user_id: u.id
    }))

    stores = [...((pendingStoreKYC ?? []) as StoreKYC[]), ...mappedUserKYC].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

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
      isDemoMode={isDemoMode}
    />
  )
}
