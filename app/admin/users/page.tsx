import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import {
  Search, Users, UserCircle,
  Phone, Mail, Calendar, Filter, ChevronLeft, ChevronRight
} from 'lucide-react'
import UsersSearchInput from './UsersSearchInput'
import UserActionMenu from './UserActionMenu'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface PageProps {
  searchParams: Promise<{
    q?: string
    role?: string
    page?: string
  }>
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  super_admin:  { label: 'Super Admin',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  gestionnaire: { label: 'Gestionnaire', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  support:      { label: 'Support',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  vendeur:      { label: 'Vendeur',      color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200' },
  acheteur:     { label: 'Client',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  client:       { label: 'Client',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  affilie:      { label: 'Affilié',      color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200' },
  closer:       { label: 'Closer',       color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  ambassadeur:  { label: 'Ambassadeur',  color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200' },
}

const ROLE_FILTERS = [
  { value: 'all',          label: 'Tous',          icon: '🌐' },
  { value: 'vendeur',      label: 'Vendeurs',      icon: '🏪' },
  { value: 'acheteur',     label: 'Clients',       icon: '🛒' },
  { value: 'affilie',      label: 'Affiliés',      icon: '🔗' },
  { value: 'ambassadeur',  label: 'Ambassadeurs',  icon: '🏅' },
  { value: 'closer',       label: 'Closers',       icon: '📞' },
  { value: 'super_admin',  label: 'Admins',        icon: '👑' },
  { value: 'gestionnaire', label: 'Gestionnaires', icon: '📋' },
  { value: 'support',      label: 'Support',       icon: '🎧' },
]

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createAdminClient()

  const query      = params.q    ?? ''
  const roleFilter = params.role ?? 'all'
  const currentPage = Number(params.page) || 1
  const pageSize    = 25
  const offset      = (currentPage - 1) * pageSize

  // ── Query Users ──
  let userQuery = supabase
    .from('User')
    .select('id, name, email, phone, role, avatar_url, created_at, kyc_status', { count: 'exact' })

  if (query) {
    userQuery = userQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
  }
  if (roleFilter !== 'all') {
    if (roleFilter === 'acheteur') {
      userQuery = userQuery.in('role', ['acheteur', 'client'])
    } else if (roleFilter === 'ambassadeur') {
      const { data: ambData } = await supabase.from('Ambassador').select('user_id')
      const ambIds = ambData?.map(a => a.user_id) || []
      userQuery = userQuery.in('id', ambIds.length > 0 ? ambIds : ['empty'])
    } else {
      userQuery = userQuery.eq('role', roleFilter)
    }
  }

  const { data: users, count, error } = await userQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) console.error('[AdminUsers] Error:', error.message)

  // ── Charger les stores et les statuts ambassadeurs ──
  const targetUserIds = (users ?? []).map((u: any) => u.id) // eslint-disable-line @typescript-eslint/no-explicit-any
  let storesByUserId: Record<string, string> = {}
  let isAmbassadeurByUserId: Record<string, boolean> = {}
  
  if (targetUserIds.length > 0) {
    const [{ data: stores }, { data: ambs }] = await Promise.all([
      supabase.from('Store').select('id, user_id').in('user_id', targetUserIds),
      supabase.from('Ambassador').select('user_id').in('user_id', targetUserIds)
    ])
    if (stores) storesByUserId = Object.fromEntries(stores.map((s: any) => [s.user_id, s.id]))
    if (ambs) isAmbassadeurByUserId = Object.fromEntries(ambs.map((a: any) => [a.user_id, true]))
  }

  // ── KPI Stats ──
  const roleCountPromises = ['vendeur', 'acheteur', 'client', 'affilie', 'closer', 'super_admin', 'gestionnaire', 'support'].map(
    role => supabase.from('User').select('id', { count: 'exact', head: true }).eq('role', role)
  )
  const ambassadeurPromise = supabase.from('Ambassador').select('id', { count: 'exact', head: true })
  
  const [roleCounts, ambCount] = await Promise.all([Promise.all(roleCountPromises), ambassadeurPromise])
  const [vendeurC, acheteurC, clientC, affilieC, closerC, adminC, gestC, supportC] = roleCounts.map(r => r.count ?? 0)
  const ambassadeurC = ambCount.count ?? 0
  const totalUsers = vendeurC + acheteurC + clientC + affilieC + closerC + adminC + gestC + supportC

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER ── */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-6 pb-16 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-900/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Users className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Tous les Utilisateurs</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                {totalUsers} utilisateurs inscrits sur Yayyam.
              </p>
            </div>
          </div>

          <UsersSearchInput />
        </div>

        {/* ── KPIs ── */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 lg:gap-3">
          {[
            { label: 'Total', value: totalUsers, color: 'text-white', filter: 'all' },
            { label: 'Vendeurs', value: vendeurC, color: 'text-emerald-300', filter: 'vendeur' },
            { label: 'Clients', value: acheteurC + clientC, color: 'text-amber-300', filter: 'acheteur' },
            { label: 'Affiliés', value: affilieC, color: 'text-cyan-300', filter: 'affilie' },
            { label: 'Ambassadeurs', value: ambassadeurC, color: 'text-pink-300', filter: 'ambassadeur' },
            { label: 'Closers', value: closerC, color: 'text-orange-300', filter: 'closer' },
            { label: 'Admins', value: adminC + gestC, color: 'text-red-300', filter: 'super_admin' },
            { label: 'Support', value: supportC, color: 'text-blue-300', filter: 'support' },
          ].map(kpi => (
            <Link 
              href={`/admin/users?role=${kpi.filter}&q=${query}`}
              key={kpi.label} 
              className={`bg-white/10 backdrop-blur-md border rounded-2xl p-3 flex flex-col hover:-translate-y-1 transition-all cursor-pointer ${
                roleFilter === kpi.filter 
                ? 'border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-2 ring-white/20' 
                : 'border-white/20 hover:border-white/40'
              }`}
            >
              <span className="text-white/50 text-[10px] lg:text-xs font-black uppercase tracking-widest mb-0.5 truncate">{kpi.label}</span>
              <span className={`text-lg lg:text-xl font-black ${kpi.color}`}>{kpi.value}</span>
            </Link>
          ))}
        </div>
      </header>

      {/* ── TABLE & FILTERS LAYOUT ── */}
      <div className="flex flex-col gap-6 w-full relative z-20 px-6 lg:px-10 -mt-8 pb-20 items-start">
        
        {/* ── NAVIGATION (Top Tabs) ── */}
        <div className="w-full relative z-20">
          <div className="w-full bg-white border border-gray-100 p-2 lg:p-4 rounded-[2rem] lg:rounded-3xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-start z-10 w-fit">
            <h2 className="text-xs items-center gap-2 font-black uppercase text-gray-400 tracking-widest pl-2 pr-2 shrink-0 hidden md:flex">
              <Filter size={14} /> Filtres
            </h2>
            <div className="w-full overflow-x-auto scrollbar-hide lg:overflow-visible">
              <nav className="flex flex-row gap-2 p-1 min-w-max lg:min-w-0">
                {ROLE_FILTERS.map(filter => (
                <Link
                  key={filter.value}
                  href={`/admin/users?role=${filter.value}&q=${query}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 ${
                    roleFilter === filter.value
                    ? 'bg-[#0A4138] text-white shadow-md shadow-emerald-900/20'
                      : 'bg-transparent text-gray-500 hover:bg-emerald-50 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <span className="text-sm">{filter.icon}</span>
                  <span>{filter.label}</span>
                </Link>
              ))}
            </nav>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <div className="bg-white rounded-[2rem] lg:rounded-3xl shadow-xl border border-gray-100 relative z-10 overflow-hidden">
            
            <div className="px-6 lg:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-emerald-600" />
                Résultats ({count ?? 0})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#FAFAF7]">
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Contact</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">KYC</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Inscription</th>
                    <th className="text-right px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-gray-400 font-bold">
                        <UserCircle className="mx-auto mb-4 text-gray-200" size={48} />
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (users ?? []).map((user: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
                    const kycLabel = user.kyc_status === 'verified' ? '✅ Vérifié' : user.kyc_status === 'pending' || user.kyc_status === 'submitted' ? '⏳ En attente' : user.kyc_status === 'rejected' ? '❌ Rejeté' : '—'

                    // Determine navigation link based on role and store existence
                    let detailLink = '#'
                    const storeId = storesByUserId[user.id]
                    const isAmb = isAmbassadeurByUserId[user.id]

                    if (storeId) {
                      detailLink = `/admin/vendeurs/${storeId}`
                    }
                    else if (user.role === 'vendeur') detailLink = `/admin/vendeurs`
                    else if (user.role === 'acheteur' || user.role === 'client') detailLink = `/admin/clients?q=${encodeURIComponent(user.phone || user.email || user.name)}`
                    else if (isAmb) detailLink = `/admin/ambassadeurs`
                    else if (user.role === 'closer') detailLink = `/admin/closing`
                    else if (user.role === 'super_admin' || user.role === 'gestionnaire' || user.role === 'support') detailLink = `/admin/roles`

                    return (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                              {user.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-black text-gray-400">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 focus:outline-none">
                                <p className="font-black text-gray-900 truncate text-sm">{user.name}</p>
                                {isAmb && (
                                  <span title="Ambassadeur Actif" className="text-[10px] w-5 h-5 flex items-center justify-center bg-pink-50 border border-pink-100 rounded-full shadow-sm cursor-help">
                                    🏅
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate">{user.id.slice(0, 12)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${roleInfo.bg} ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="space-y-1 text-xs text-gray-500">
                            {user.email && (
                              <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                <Mail size={12} className="text-gray-300 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                            )}
                            {user.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone size={12} className="text-gray-300 flex-shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-xs font-bold">{kycLabel}</span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar size={12} />
                            {new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <UserActionMenu user={user} detailLink={detailLink} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-100 flex items-center justify-center gap-2 bg-[#FAFAF7]/50">
                {currentPage > 1 && (
                  <Link
                    href={`/admin/users?page=${currentPage - 1}&q=${query}&role=${roleFilter}`}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/admin/users?page=${i + 1}&q=${query}&role=${roleFilter}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-all shadow-sm border ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-br from-[#012928] to-[#0A4138] text-white shadow-md border-transparent'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  >
                    {i + 1}
                  </Link>
                ))}
                {currentPage < totalPages && (
                  <Link
                    href={`/admin/users?page=${currentPage + 1}&q=${query}&role=${roleFilter}`}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
