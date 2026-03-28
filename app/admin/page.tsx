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
    <main className="min-h-screen font-sans border border-transparent bg-[#FAFAF7] flex flex-col">
      {/* ── SECTION 1 : HEADER FULL-BLEED EMERALD ──────────────────────── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-10 pb-24 px-6 lg:px-14 relative overflow-hidden shrink-0 shadow-lg z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 mix-blend-overlay rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C9A84C] opacity-20 mix-blend-overlay rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/3" />

        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
              {greeting}, {userName} ! 👋
            </h1>
            <p className="text-sm font-medium text-emerald-100/80 mt-1.5">
              Statistiques globales au {capitalizedDate}
            </p>
          </div>
          <div className="flex-shrink-0 print:hidden opacity-90 hover:opacity-100 transition-opacity">
            <ExportButton />
          </div>
        </div>
      </header>

      {/* ── CONTENU (Overlap) ── */}
      <div className="w-full px-6 lg:px-14 space-y-8 animate-in fade-in duration-500 mb-20 -mt-14 relative z-20">

        {/* ── SECTION 2 : 4 KPI CARDS (OVERLAP) ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          
          <div className="bg-[#1A1A1A] border border-gray-800 hover:border-[#C9A84C]/50 hover:shadow-2xl hover:shadow-[#C9A84C]/20 transition-all duration-500 rounded-[28px] p-6 relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] mb-2 relative z-10">
              Revenus Plateforme (Total)
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-white truncate relative z-10 tracking-tighter group-hover:text-emerald-50 transition-colors duration-500">
              {totalPlatformRevenue.toLocaleString('fr-FR')} <span className="text-sm text-gray-500 font-bold ml-1">F</span>
            </p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl border border-white hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 rounded-[28px] p-6 relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 relative z-10">
              Volume Ventes Global (Auj.)
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] truncate relative z-10 tracking-tighter group-hover:text-amber-600 transition-colors duration-500">
              {dailyGMV.toLocaleString('fr-FR')} <span className="text-sm font-bold text-gray-400 ml-1">F</span>
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border border-white hover:border-[#0F7A60]/30 hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 rounded-[28px] p-6 relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F7A60]/[0.03] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0F7A60] mb-2 relative z-10 flex items-center justify-between">
              Vendeurs Actifs
              <span className="bg-[#0F7A60]/10 text-[#0F7A60] px-2 py-0.5 rounded-md text-[9px] font-bold">+{newStoresWeek} (7j)</span>
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-[#1A1A1A] relative z-10 tracking-tighter group-hover:text-[#0F7A60] transition-colors duration-500">
              {totalStores ?? 0}
            </p>
          </div>

          <div className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 rounded-[28px] p-6 relative overflow-hidden group shadow-lg">
             <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 relative z-10 flex items-center justify-between">
              Retraits en attente
              {pendingWithdrawals ? <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[9px] font-bold animate-pulse">{pendingWithdrawals ?? 0} req</span> : null}
            </p>
            <p className="text-3xl lg:text-4xl font-display font-black text-red-600 truncate relative z-10 tracking-tighter flex items-center gap-1 group-hover:text-red-700 transition-colors duration-500">
              {totalPendingAmount.toLocaleString('fr-FR')} <span className="text-sm font-bold opacity-60 mt-2">F</span>
            </p>
          </div>
        </section>

        {/* ── NOUVEAU : ACTION CENTER (Urgences) ─────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/retraits" className="bg-white hover:bg-red-50/50 border border-gray-100 hover:border-red-200 p-4 rounded-2xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-500 shadow-inner group-hover:scale-105 transition-transform">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest">Opérations de caisse</p>
                <p className="text-sm font-black text-[#1A1A1A] group-hover:text-red-600 transition-colors">Retraits d'urgence <span className="text-red-500">({pendingWithdrawals ?? 0})</span></p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 transition-colors text-gray-400 group-hover:text-red-500">
              <ArrowRight size={14} />
            </div>
          </Link>
          
          <Link href="/admin/kyc" className="bg-white hover:bg-amber-50/50 border border-gray-100 hover:border-amber-200 p-4 rounded-2xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-105 transition-transform">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Identités Vendeurs</p>
                <p className="text-sm font-black text-[#1A1A1A] group-hover:text-amber-600 transition-colors">KYC en attente <span className="text-amber-500">({pendingKYC ?? 0})</span></p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors text-gray-400 group-hover:text-amber-500">
              <ArrowRight size={14} />
            </div>
          </Link>

          <Link href="/admin/complaints" className="bg-white hover:bg-blue-50/50 border border-gray-100 hover:border-blue-200 p-4 rounded-2xl flex items-center justify-between group transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-105 transition-transform">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest">Service Clientèle</p>
                <p className="text-sm font-black text-[#1A1A1A] group-hover:text-blue-600 transition-colors">Plaintes ouvertes <span className="text-blue-500">({openComplaints ?? 0})</span></p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors text-gray-400 group-hover:text-blue-500">
              <ArrowRight size={14} />
            </div>
          </Link>
        </section>

        {/* ── SECTION 3 : GRAPHIQUE + PIE CHART + LEADERBOARD ───────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* Double Graphique (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl shadow-gray-200/50 flex flex-col group hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-500">
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
            <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl shadow-gray-200/50">
               <h2 className="font-black text-[#1A1A1A] text-sm mb-4">Statuts (7j)</h2>
               <AdminPieChart data={pieData} />
               <div className="flex justify-center gap-4 mt-2">
                 <span className="text-[10px] font-bold text-gray-400"><span className="text-[#0F7A60] w-2 h-2 inline-block rounded-full bg-[#0F7A60] mr-1"></span> Succès</span>
                 <span className="text-[10px] font-bold text-gray-400"><span className="text-[#3B82F6] w-2 h-2 inline-block rounded-full bg-[#3B82F6] mr-1"></span> En cours</span>
                 <span className="text-[10px] font-bold text-gray-400"><span className="text-[#EF4444] w-2 h-2 inline-block rounded-full bg-[#EF4444] mr-1"></span> Échecs</span>
               </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gradient-to-br from-[#0A5240] to-[#0F7A60] border border-teal-800 rounded-[32px] p-6 shadow-xl shadow-teal-900/20 flex-1 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#C9A84C]/5 mix-blend-overlay opacity-50"></div>
               <h2 className="font-black text-white text-sm mb-4 flex items-center gap-2 relative z-10">🏆 Top Vendeurs (7j)</h2>
               <div className="space-y-3 relative z-10">
                 {leaderboardOpts.map((store, i) => (
                   <div key={i} className="flex justify-between items-center bg-black/10 backdrop-blur-sm p-3 rounded-2xl border border-white/5 shadow-sm hover:bg-black/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${i===0?'bg-[#C9A84C] text-white shadow-md shadow-[#C9A84C]/30':i===1?'bg-gray-300 text-gray-800':i===2?'bg-amber-700/50 text-amber-100':'bg-white/10 text-white/50'}`}>
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-emerald-50 truncate max-w-[120px]">{store.name}</span>
                      </div>
                      <span className="text-xs font-black text-[#C9A84C] drop-shadow-sm">{store.volume.toLocaleString('fr-FR')} F</span>
                   </div>
                 ))}
                 {leaderboardOpts.length === 0 && <p className="text-xs text-center text-emerald-200/50 mt-4">Aucun vendeur actif</p>}
               </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 4 : DERNIÈRES COMMANDES ─────────────── */}
        <section className="bg-white border border-gray-100 rounded-[32px] shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col relative z-10 w-full mb-10">
          <div className="px-6 py-6 border-b border-gray-100/50 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-black text-[#1A1A1A] text-lg">Activités récentes (Commandes)</h2>
            <Link href="/admin/orders" className="text-xs font-black text-gray-500 hover:text-[#0F7A60] bg-white border border-gray-200 hover:border-[#0F7A60]/30 hover:bg-[#0F7A60]/5 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
              Tout voir <ArrowRight size={14}/>
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col p-2">
            {latestOrders && latestOrders.length > 0 ? (
              <div className="space-y-1">
                {(latestOrders as unknown as OrderWithStore[]).map(order => (
                  <div key={order.id} className="px-4 py-3.5 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-all duration-300 group cursor-default border border-transparent hover:border-gray-100">
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
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 m-2 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3">
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
