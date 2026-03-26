import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import {
  Search, Users, Clock, CheckCircle2, XCircle, AlertCircle, List, LayoutGrid, Store as StoreIcon
} from 'lucide-react'
import AdminVendorsTable, { VendorDisplayRow } from '@/components/admin/AdminVendorsTable'
import AdminVendorsKanban from '@/components/admin/AdminVendorsKanban'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface PageProps {
  searchParams: Promise<{
    q?: string
    kyc?: string    // 'all' | 'verified' | 'pending' | 'rejected'
    status?: string // 'all' | 'active' | 'suspended'
    page?: string
    view?: string   // 'list' | 'kanban'
  }>
}

interface StoreRaw {
  id:         string
  name:       string
  slug:       string | null
  created_at: string
  is_active:  boolean
  kyc_status: 'pending' | 'verified' | 'rejected' | null
  vendor_type: string
  whatsapp:   string | null
  user_id:    string
}

interface UserRaw {
  id:    string
  email: string
  phone: string | null
  role:  string
}

// ----------------------------------------------------------------
// PAGE : LISTE DES VENDEURS — Charte PDV Pro (émeraude/or/crème)
// ----------------------------------------------------------------
export default async function AdminVendorsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createAdminClient()

  const query        = params.q      ?? ''
  const kycFilter    = params.kyc    ?? 'all'
  const statusFilter = params.status ?? 'all'
  const viewMode     = params.view   ?? 'list'
  const currentPage  = Number(params.page) || 1
  const pageSize     = viewMode === 'kanban' ? 50 : 20 // Plus de vendeurs pour le Kanban
  const offset       = (currentPage - 1) * pageSize

  // ── ÉTAPE 1 : Requête Store ────────────────────────────────────────────────
  let storeQuery = supabase
    .from('Store')
    .select('id, name, slug, created_at, is_active, kyc_status, vendor_type, whatsapp, user_id', { count: 'exact' })

  if (query) storeQuery = storeQuery.ilike('name', `%${query}%`)
  if (kycFilter !== 'all') storeQuery = storeQuery.eq('kyc_status', kycFilter)
  if (statusFilter !== 'all') storeQuery = storeQuery.eq('is_active', statusFilter === 'active')

  const { data: storesRaw, count, error } = await storeQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) console.error('[AdminVendors] Erreur Store:', error.message)
  const stores = (storesRaw as unknown as StoreRaw[]) ?? []

  // ── ÉTAPE 2 : Récupérer les User ──────────────────────────────────────────
  const userIds = Array.from(new Set(stores.map(s => s.user_id).filter(Boolean)))
  const usersMap: Record<string, UserRaw> = {}
  
  if (userIds.length > 0) {
    const { data: usersRaw } = await supabase
      .from('User')
      .select('id, email, phone, role')
      .in('id', userIds)

    for (const u of (usersRaw as unknown as UserRaw[]) ?? []) {
      usersMap[u.id] = u
    }
  }

  // ── ÉTAPE 2.5 : Statistiques Globales (KPI) ──────────────────────────────
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: verifiedCount },
    { count: suspendedCount }
  ] = await Promise.all([
    supabase.from('Store').select('id', { count: 'exact', head: true }),
    supabase.from('Store').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
    supabase.from('Store').select('id', { count: 'exact', head: true }).eq('kyc_status', 'verified'),
    supabase.from('Store').select('id', { count: 'exact', head: true }).eq('is_active', false)
  ])

  // ── ÉTAPE 3 : Métriques des 30 derniers jours ─────────────────────────────
  const storeIds = stores.map(s => s.id)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const metricsMap: Record<string, { gmv30d: number; orders30d: number; lastActivity: string | null }> = {}
  
  if (storeIds.length > 0) {
    const { data: recentOrders } = await supabase
      .from('Order')
      .select('store_id, total, status, created_at')
      .in('store_id', storeIds)
      .gte('created_at', thirtyDaysAgo)
      
    storeIds.forEach(id => {
      metricsMap[id] = { gmv30d: 0, orders30d: 0, lastActivity: null }
    })
      
    ;(recentOrders ?? []).forEach(o => {
      const sId = o.store_id as string
      if (!metricsMap[sId]) return
      
      if (['paid', 'completed', 'delivered', 'confirmed'].includes(o.status)) {
        metricsMap[sId].gmv30d += (o.total ?? 0)
      }
      metricsMap[sId].orders30d += 1
      
      const orderDate = new Date(o.created_at)
      if (!metricsMap[sId].lastActivity || orderDate > new Date(metricsMap[sId].lastActivity!)) {
        metricsMap[sId].lastActivity = o.created_at
      }
    })
  }

  // ── ÉTAPE 4 : Formatage pour le Client ────────────────────────────────────
  const vendorList: VendorDisplayRow[] = stores.map(store => ({
    id: store.id,
    name: store.name,
    slug: store.slug,
    created_at: store.created_at,
    is_active: store.is_active,
    kyc_status: store.kyc_status,
    vendor_type: store.vendor_type ?? 'hybrid',
    user_id: store.user_id,
    whatsapp: store.whatsapp,
    user: usersMap[store.user_id] ?? null,
    metrics: metricsMap[store.id] ?? { gmv30d: 0, orders30d: 0, lastActivity: null }
  }))

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        {/* Noise & Glows */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Users className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Annuaire Vendeurs</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                Gérez vos {count ?? 0} {count && count > 1 ? 'boutiques enregistrées' : 'boutique enregistrée'} sur PDV Pro.
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <form method="GET">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Rechercher une boutique..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white
                  focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 outline-none transition-all placeholder:text-white/50 shadow-inner"
              />
              <input type="hidden" name="kyc" value={kycFilter} />
              <input type="hidden" name="status" value={statusFilter} />
            </form>
          </div>
        </div>

        {/* ── KPIs OVERLAY ── */}
        <div className="relative z-10 mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mb-1">Total Vendeurs</span>
            <span className="text-2xl font-black text-white">{totalCount ?? 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mb-1">En attente KYC</span>
            <span className="text-2xl font-black text-amber-300">{pendingCount ?? 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mb-1">Vérifiés</span>
            <span className="text-2xl font-black text-white">{verifiedCount ?? 0}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mb-1">Suspendus</span>
            <span className="text-2xl font-black text-red-300">{suspendedCount ?? 0}</span>
          </div>
        </div>
      </header>

      {/* ── SPLIT VIEW (Superposé au Cover) ── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-6 lg:px-10 -mt-12 relative z-20 pb-20 items-start">
        
        {/* -- SECONDAIRE SIDEBAR (Filtres Rapides) -- */}
        <div className="w-full lg:w-72 bg-white rounded-3xl p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex-shrink-0 sticky top-24">
          <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-4">Filtres Rapides</h2>
          
          <div className="flex flex-col gap-1.5">
            <Link 
              href="/admin/vendeurs" 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${kycFilter === 'all' && statusFilter === 'all' ? 'bg-[#0F7A60] text-white shadow-[0_4px_15px_rgba(15,122,96,0.2)]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A1A1A] hover:shadow-sm border border-transparent hover:border-gray-100'}`}
            >
              <Users className="w-4.5 h-4.5" /> <span>Toutes les boutiques</span>
            </Link>
            <Link 
              href="/admin/vendeurs?kyc=pending" 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${kycFilter === 'pending' ? 'bg-[#C9A84C] text-white shadow-[0_4px_15px_rgba(201,168,76,0.2)]' : 'text-gray-500 hover:bg-amber-50 hover:text-[#C9A84C] border border-transparent hover:border-amber-100/50'}`}
            >
              <Clock className="w-4.5 h-4.5" /> <span>En attente KYC</span>
            </Link>
            <Link 
              href="/admin/vendeurs?kyc=verified" 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${kycFilter === 'verified' ? 'bg-[#0F7A60] text-white shadow-[0_4px_15px_rgba(15,122,96,0.2)]' : 'text-gray-500 hover:bg-emerald-50 hover:text-[#0F7A60] border border-transparent hover:border-emerald-100/50'}`}
            >
              <CheckCircle2 className="w-4.5 h-4.5" /> <span>KYC Vérifiés</span>
            </Link>
            <Link 
              href="/admin/vendeurs?status=suspended" 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${statusFilter === 'suspended' ? 'bg-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.2)]' : 'text-gray-500 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100/50'}`}
            >
              <XCircle className="w-4.5 h-4.5" /> <span>Suspendus</span>
            </Link>
            <Link 
              href="/admin/vendeurs?kyc=rejected" 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${kycFilter === 'rejected' ? 'bg-gray-800 text-white shadow-[0_4px_15px_rgba(31,41,55,0.2)]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'}`}
            >
              <AlertCircle className="w-4.5 h-4.5" /> <span>KYC Rejetés</span>
            </Link>
          </div>
        </div>

        {/* -- ZONE PRINCIPALE (Data Area) -- */}
        <div className="flex-1 min-w-0 bg-transparent lg:bg-white rounded-3xl lg:shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:border border-gray-100 relative z-10 overflow-hidden">
          
          {/* Header de la zone de données (Toggle) */}
          <div className="px-6 lg:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-3xl">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-emerald-600" />
              Résultats ({count ?? 0})
            </h2>
            
            {/* Toggle Vue */}
            <div className="flex bg-[#FAFAF7] p-1 rounded-xl border border-gray-200 shadow-inner">
              <Link 
                href={`/admin/vendeurs?view=list&q=${query}&kyc=${kycFilter}&status=${statusFilter}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-emerald-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List className="w-4 h-4" /> <span className="hidden sm:inline">Liste</span>
              </Link>
              <Link 
                href={`/admin/vendeurs?view=kanban&q=${query}&kyc=${kycFilter}&status=${statusFilter}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-emerald-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Kanban</span>
              </Link>
            </div>
          </div>

          <div className="w-full lg:p-0">
            {viewMode === 'kanban' ? (
              <div className="px-0 lg:px-8">
                <AdminVendorsKanban vendors={vendorList} />
              </div>
            ) : (
              <AdminVendorsTable vendors={vendorList} />
            )}
            
            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-100 flex items-center justify-center gap-2 bg-[#FAFAF7]/50">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/admin/vendeurs?page=${i + 1}&q=${query}&kyc=${kycFilter}&status=${statusFilter}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-all duration-300 shadow-sm border ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-br from-[#0F7A60] to-teal-600 text-white shadow-[0_4px_10px_rgba(15,122,96,0.3)] border-transparent'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-[#0F7A60]/30 hover:text-[#0F7A60] hover:shadow-md'
                    }`}
                  >
                    {i + 1}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
