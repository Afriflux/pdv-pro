import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { AdminDoubleChart, AdminPieChart } from '@/components/admin/AdminCharts'
import { ExportButton } from '@/components/admin/ExportButton'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface OrderWithStore {
  id: string
  total: number
  status: string
  created_at: string
  Store: { name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  cod_pending: 'COD en attente',
  cod_confirmed: 'COD confirmée',
  no_answer: 'Pas de réponse',
}

// ----------------------------------------------------------------
// Badge statut commande
// ----------------------------------------------------------------
function OrderStatusBadge({ status }: { status: string }) {
  const isSuccess = ['completed', 'delivered', 'paid'].includes(status)
  const isDanger = ['cancelled'].includes(status)
  
  const cls = isSuccess 
    ? 'bg-[#0F7A60]/10 text-[#0F7A60]' 
    : isDanger 
      ? 'bg-red-500/10 text-red-500' 
      : 'bg-amber-500/10 text-amber-600'

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ----------------------------------------------------------------
// DASHBOARD SUPER ADMIN — Charte PDV Pro
// ----------------------------------------------------------------
export default async function AdminDashboard() {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  const supabase = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const sevenDaysAgoISO = sevenDaysAgo.toISOString()

  // Récupération de toutes les métriques en parallèle
  const [
    { data: userData },
    { count: totalStores },
    { data: revenueData },
    { count: pendingWithdrawals },
    { data: withdrawalsAmount },
    { count: newStoresWeek },
    { data: latestOrders },
    { data: revenueAllTimeData },
    { data: weekOrdersRaw }, 
    { count: pendingKYC },
    { count: openComplaints },
  ] = await Promise.all([
    supabase.from('User').select('name').eq('id', user?.id).single(),
    supabase.from('Store').select('*', { count: 'exact', head: true }),
    supabase.from('Order').select('total, platform_fee').in('status', ['paid', 'confirmed', 'completed']).gte('created_at', todayISO),
    supabase.from('WithdrawalRequest').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('WithdrawalRequest').select('amount').eq('status', 'pending'),
    supabase.from('Store').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgoISO),
    supabase.from('Order')
      .select('id, total, status, created_at, Store(name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('Order').select('platform_fee').in('status', ['paid', 'confirmed', 'completed']),
    // Requête massive pour Chart, PieChart, Leaderboard
    supabase.from('Order').select('platform_fee, total, created_at, status, store_id, Store(name)').gte('created_at', sevenDaysAgoISO),
    supabase.from('Store').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
    supabase.from('Complaint').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
  ])

  // Calculs KPI
  const dailyGMV = revenueData?.reduce((acc, curr) => acc + (curr.total ?? 0), 0) ?? 0
  const totalPlatformRevenue = revenueAllTimeData?.reduce((acc, curr) => acc + (curr.platform_fee ?? 0), 0) ?? 0
  const totalPendingAmount = withdrawalsAmount?.reduce((acc, curr) => acc + (curr.amount ?? 0), 0) ?? 0

  // ─────────────────────────────────────────────────────────────────
  // TRAITEMENT DES GRAPHIQUES ET DU LEADERBOARD (7j)
  // ─────────────────────────────────────────────────────────────────
  type WeekOrderRow = {
    platform_fee: number;
    total: number;
    created_at: string;
    status: string;
    store_id: string;
    Store: { name: string } | null;
  }
  const weekOrders = (weekOrdersRaw as unknown as WeekOrderRow[]) || []

  // Double Chart
  const chartDataMap = new Map<string, { revenu: number; volume: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    chartDataMap.set(dateStr, { revenu: 0, volume: 0 })
  }

  // Pie Chart
  const statusCounts = { success: 0, pending: 0, cancelled: 0 }
  
  // Leaderboard
  const storeVolumes: Record<string, { name: string; volume: number }> = {}

  weekOrders.forEach(o => {
    const isSuccess = ['paid', 'confirmed', 'completed', 'delivered'].includes(o.status) || o.status.includes('confirmed')
    const isPending = ['processing', 'shipped', 'pending', 'cod_pending'].includes(o.status)
    const isCancelled = ['cancelled', 'no_answer'].includes(o.status)

    if (isSuccess) statusCounts.success++
    else if (isCancelled) statusCounts.cancelled++
    else statusCounts.pending++

    if (isSuccess) {
      const d = new Date(o.created_at)
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
      if (chartDataMap.has(dateStr)) {
        const current = chartDataMap.get(dateStr)!
        current.revenu += (o.platform_fee || 0)
        current.volume += (o.total || 0)
      }

      if (o.store_id) {
        if (!storeVolumes[o.store_id]) {
          storeVolumes[o.store_id] = { name: o.Store?.name || 'Inconnu', volume: 0 }
        }
        storeVolumes[o.store_id].volume += (o.total || 0)
      }
    }
  })

  const chartData = Array.from(chartDataMap.entries()).map(([date, data]) => ({ 
    date, 
    total_revenu: data.revenu,
    volume: data.volume
  }))

  const pieData = [
    { name: 'Succès', value: statusCounts.success },
    { name: 'En cours', value: statusCounts.pending },
    { name: 'Échecs', value: statusCounts.cancelled },
  ]

  const leaderboardOpts = Object.values(storeVolumes).sort((a, b) => b.volume - a.volume).slice(0, 5)

  // Salutation
  const userName = userData?.name?.split(' ')[0] || 'Admin'
  const hour = new Date().getUTCHours() 
  const greeting = hour < 12 ? 'Bon matin' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const dateFormatted = new Date().toLocaleDateString('fr-FR', dateOptions)
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)

  return (
    <main className="min-h-screen font-sans border border-transparent">
      {/* Ambient BG Glows */}
      <div className="absolute top-0 right-10 w-[600px] h-[600px] bg-[#0F7A60]/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-0 w-[500px] h-[500px] bg-[#C9A84C]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* ── SECTION 1 : HEADER ───────────────────────────────────────────── */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-gray-100 px-6 lg:px-14 py-8 relative z-10 w-full mb-8">
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">
              {greeting}, {userName} ! 👋
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-2">
              Statistiques globales au {capitalizedDate}
            </p>
          </div>
          <div className="flex-shrink-0 print:hidden">
            <ExportButton />
          </div>
        </div>
      </header>

      <div className="w-full px-6 lg:px-14 space-y-6 animate-in fade-in duration-500 mb-20">

        {/* ── NOUVEAU : ACTION CENTER (Urgences) ─────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <Link href="/admin/retraits" className="bg-red-50 hover:bg-red-100/50 border border-red-100 p-4 rounded-2xl flex items-center justify-between group transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Retraits d'urgence</p>
                <p className="text-sm font-black text-red-900">{pendingWithdrawals ?? 0} demandes</p>
              </div>
            </div>
            <ArrowRight className="text-red-300 group-hover:text-red-500 w-4 h-4 transition-colors" />
          </Link>
          
          <Link href="/admin/kyc" className="bg-amber-50 hover:bg-amber-100/50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between group transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-500/80 uppercase tracking-wider">KYC en attente</p>
                <p className="text-sm font-black text-amber-900">{pendingKYC ?? 0} dossiers</p>
              </div>
            </div>
            <ArrowRight className="text-amber-300 group-hover:text-amber-500 w-4 h-4 transition-colors" />
          </Link>

          <Link href="/admin/complaints" className="bg-blue-50 hover:bg-blue-100/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between group transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Plaintes ouvertes</p>
                <p className="text-sm font-black text-blue-900">{openComplaints ?? 0} tickets</p>
              </div>
            </div>
            <ArrowRight className="text-blue-300 group-hover:text-blue-500 w-4 h-4 transition-colors" />
          </Link>
        </section>

        {/* ── SECTION 2 : 4 KPI CARDS ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
          
          <div className="bg-white/80 backdrop-blur-xl border border-white hover:border-[#0F7A60]/20 hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F7A60]/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0F7A60] mb-2 relative z-10 flex items-center justify-between">
              <span>Revenus Plateforme (Total)</span>
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] truncate relative z-10 tracking-tighter group-hover:text-[#0F7A60] transition-colors duration-500">
              {totalPlatformRevenue.toLocaleString('fr-FR')} <span className="text-sm text-gray-400 font-bold ml-1">F</span>
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border border-white hover:border-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 relative z-10">
              Volume Ventes Global (Auj.)
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] truncate relative z-10 tracking-tighter group-hover:text-amber-600 transition-colors duration-500">
              {dailyGMV.toLocaleString('fr-FR')} <span className="text-sm font-bold opacity-40 ml-1 group-hover:opacity-100 text-[#1A1A1A]">F</span>
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 rounded-[32px] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 relative z-10 flex items-center justify-between">
              Vendeurs Actifs
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md text-[9px] font-bold">+{newStoresWeek} 7j</span>
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] relative z-10 tracking-tighter group-hover:text-blue-600 transition-colors duration-500">
              {totalStores ?? 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-white/10 rounded-[32px] p-6 shadow-2xl shadow-black/20 relative overflow-hidden group text-white hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-500">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-red-400 opacity-90 mb-2 relative z-10 flex items-center justify-between">
              Retraits en attente
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md text-[9px] font-bold">{pendingWithdrawals ?? 0} req</span>
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-white truncate relative z-10 tracking-tighter flex items-center gap-1 group-hover:text-red-100 transition-colors duration-500">
              {totalPendingAmount.toLocaleString('fr-FR')} <span className="text-sm font-bold opacity-60 mt-2">F</span>
            </p>
          </div>
        </section>

        {/* ── SECTION 3 : GRAPHIQUE + PIE CHART + LEADERBOARD ───────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* Double Graphique (8 cols) */}
          <div className="lg:col-span-8 bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 flex flex-col group hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-500">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="font-black text-[#1A1A1A] text-lg">Activité Globale (7 derniers jours)</h2>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0F7A60]"></div><span className="text-[10px] font-bold text-gray-500 uppercase">Revenus (Commissions)</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#C9A84C]"></div><span className="text-[10px] font-bold text-gray-500 uppercase">Volume (GMV)</span></div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#0F7A60]/10 transition-colors duration-500 text-gray-400 group-hover:text-[#0F7A60]">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="flex-1 min-h-[250px] -ml-4">
               <AdminDoubleChart data={chartData} />
            </div>
          </div>

          {/* Sidebar Charts (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Pie Chart */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50">
               <h2 className="font-black text-[#1A1A1A] text-sm mb-4">Statuts (7j)</h2>
               <AdminPieChart data={pieData} />
               <div className="flex justify-center gap-4 mt-2">
                 <span className="text-[10px] font-bold text-gray-400"><span className="text-[#0F7A60] w-2 h-2 inline-block rounded-full bg-[#0F7A60] mr-1"></span> Succès</span>
                 <span className="text-[10px] font-bold text-gray-400"><span className="text-[#3B82F6] w-2 h-2 inline-block rounded-full bg-[#3B82F6] mr-1"></span> En cours</span>
                 <span className="text-[10px] font-bold text-gray-400"><span className="text-[#EF4444] w-2 h-2 inline-block rounded-full bg-[#EF4444] mr-1"></span> Échecs</span>
               </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 flex-1">
               <h2 className="font-black text-[#1A1A1A] text-sm mb-4 flex items-center gap-2">🏆 Top Vendeurs (7j)</h2>
               <div className="space-y-3">
                 {leaderboardOpts.map((store, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/50 p-2.5 rounded-2xl border border-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i===0?'bg-amber-100 text-amber-600':i===1?'bg-gray-200 text-gray-600':i===2?'bg-amber-50 text-amber-800':'bg-gray-50 text-gray-400'}`}>
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-[#1A1A1A] truncate max-w-[120px]">{store.name}</span>
                      </div>
                      <span className="text-xs font-black text-[#0F7A60]">{store.volume.toLocaleString('fr-FR')} F</span>
                   </div>
                 ))}
                 {leaderboardOpts.length === 0 && <p className="text-xs text-center text-gray-400">Aucun vendeur actif</p>}
               </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 4 : DERNIÈRES COMMANDES ─────────────── */}
        <section className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col relative z-10 w-full mb-10">
          <div className="px-6 py-6 border-b border-gray-100/50 flex items-center justify-between bg-white/50">
            <h2 className="font-black text-[#1A1A1A] text-lg">Activités récentes (Commandes)</h2>
            <Link href="/admin/orders" className="text-xs font-black text-[#0F7A60] hover:text-[#0B5C48] bg-[#0F7A60]/5 hover:bg-[#0F7A60]/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
              Tout voir <ArrowRight size={14}/>
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col p-2">
            {latestOrders && latestOrders.length > 0 ? (
              <div className="space-y-1">
                {(latestOrders as unknown as OrderWithStore[]).map(order => (
                  <div key={order.id} className="px-4 py-3.5 rounded-2xl flex items-center justify-between hover:bg-[#FAFAF7] transition-all duration-300 group cursor-default">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                          ['completed', 'delivered', 'paid'].includes(order.status) ? 'bg-[#0F7A60]/10 text-[#0F7A60]' :
                          ['cancelled'].includes(order.status) ? 'bg-red-500/10 text-red-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          <ShoppingBag size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[11px] font-mono font-bold text-gray-400">#{order.id.split('-')[0].toUpperCase()}</p>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="text-sm font-bold text-[#1A1A1A] truncate group-hover:text-[#0F7A60] transition-colors">{order.Store?.name ?? 'Boutique inconnue'}</p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-4">
                      <p className="text-[15px] font-black text-[#1A1A1A]">{(order.total || 0).toLocaleString('fr-FR')} F</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <ShoppingBag size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-400">Aucune commande pour le moment</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}
