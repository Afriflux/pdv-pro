import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { Package, Eye, ShoppingCart, Clock, CheckCircle2, TrendingUp, LayoutGrid, List } from 'lucide-react'
import AdminOrderFilters from './AdminOrderFilters'
import ExportOrdersCSVButton from './ExportOrdersCSVButton'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface OrderRow {
  id:             string
  total:          number
  status:         string
  payment_method: string | null
  created_at:     string
  store_id:       string
  buyer_name:     string | null
  buyer_phone:    string | null
}

interface StoreRow {
  id:   string
  name: string
  slug: string | null
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    page?:   string
    view?:   string
    q?:      string
    from?:   string
    to?:     string
    cod?:    string
  }>
}

// ─── Onglets latéraux ──────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: 'all',       label: 'Toutes',      dot: 'bg-gray-400'         },
  { value: 'pending',   label: 'En attente',  dot: 'bg-amber-400'        },
  { value: 'confirmed', label: 'Confirmées',  dot: 'bg-blue-400'         },
  { value: 'completed', label: 'Terminées',   dot: 'bg-[#0F7A60]'        },
  { value: 'cancelled', label: 'Annulées',    dot: 'bg-red-400'          },
] as const

type StatusValue = typeof STATUS_TABS[number]['value']

// ─── Badge statut ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'En attente',  cls: 'bg-amber-50 text-amber-600 border-amber-200'          },
    confirmed: { label: 'Confirmée',   cls: 'bg-blue-50 text-blue-600 border-blue-200'             },
    completed: { label: 'Terminée',    cls: 'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20'  },
    delivered: { label: 'Livrée',      cls: 'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20'  },
    cancelled: { label: 'Annulée',     cls: 'bg-red-50 text-red-500 border-red-200'                },
    paid:      { label: 'Payée',       cls: 'bg-blue-50 text-blue-600 border-blue-200'             },
  }
  const item = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${item.cls}`}>
      {item.label}
    </span>
  )
}

// ─── Badge méthode de paiement ────────────────────────────────────────────────
function MethodBadge({ method }: { method: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    wave:          { label: 'Wave',     cls: 'bg-purple-50 text-purple-600 border-purple-200'  },
    orange_money:  { label: 'OM',       cls: 'bg-orange-50 text-orange-500 border-orange-200'  },
    cod:           { label: 'COD',      cls: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20' },
    cinetpay:      { label: 'CB',       cls: 'bg-indigo-50 text-indigo-600 border-indigo-200'  },
    wallet:        { label: 'Wallet',   cls: 'bg-teal-50 text-teal-600 border-teal-200'        },
  }
  const item = map[method ?? ''] ?? { label: method ?? 'N/A', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase border ${item.cls}`}>
      {item.label}
    </span>
  )
}

// ─── Carte Kanban ─────────────────────────────────────────────────────────────
function KanbanCard({ order, storeName }: { order: OrderRow, storeName: string }) {
  return (
    <Link href={`/admin/orders/${order.id}`} className="block">
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#0F7A60]/30 transition-all group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0F7A60] transition-colors" />
            <span className="font-mono text-xs font-black text-gray-500 group-hover:text-gray-900 transition-colors">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <MethodBadge method={order.payment_method} />
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-black text-[#1A1A1A] truncate">{storeName}</p>
          <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
            👤 {order.buyer_name || 'Client Inconnu'}
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
          <span className="text-xs font-black text-[#C9A84C]">
            {order.total.toLocaleString('fr-FR')} FCFA
          </span>
          <span className="text-xs font-bold text-gray-400">
            {format(new Date(order.created_at), 'dd MMM', { locale: fr })}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params       = await searchParams
  const supabase     = createAdminClient()
  const statusFilter = (params.status ?? 'all') as StatusValue
  const currentView  = params.view ?? 'list' // 'list' | 'kanban'
  const currentPage  = Number(params.page) || 1
  const searchQ      = params.q || ''
  const dateFrom     = params.from || ''
  const dateTo       = params.to || ''
  const codOnly      = params.cod === 'true'
  const pageSize     = 60 // On augmente la limite pour que le Kanban affiche assez de cartes
  const offset       = (currentPage - 1) * pageSize

  // ── ÉTAPE 1 : Commandes (sans join Store — join Supabase peu fiable) ─────────
  let orderQuery = supabase
    .from('Order')
    .select('id, total, status, payment_method, created_at, store_id, buyer_name, buyer_phone, cod_fraud_suspected', { count: 'exact' })

  // ── Application des filtres ──
  if (statusFilter !== 'all') {
    orderQuery = orderQuery.eq('status', statusFilter)
  }
  
  if (codOnly) {
    orderQuery = orderQuery.eq('payment_method', 'cod')
  }

  if (dateFrom) {
    orderQuery = orderQuery.gte('created_at', new Date(dateFrom).toISOString())
  }

  if (dateTo) {
    const endOfDay = new Date(dateTo)
    endOfDay.setUTCHours(23, 59, 59, 999)
    orderQuery = orderQuery.lte('created_at', endOfDay.toISOString())
  }

  if (searchQ) {
    // Or condition in Supabase applies across the selected columns
    orderQuery = orderQuery.or(`id.ilike.%${searchQ}%,buyer_name.ilike.%${searchQ}%,buyer_ телефон.ilike.%${searchQ}%`) // To fix: phone is buyer_phone. Corrected below.
    orderQuery = orderQuery.or(`id.ilike.%${searchQ}%,buyer_name.ilike.%${searchQ}%,buyer_phone.ilike.%${searchQ}%`)
  }

  const { data: ordersRaw, count, error } = await orderQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) console.error('[AdminOrders] Erreur Order:', error.message)

  const orders = (ordersRaw as unknown as OrderRow[]) ?? []

  // ── ÉTAPE 2 : Boutiques pour les store_id trouvés ────────────────────────────
  const storeIds = Array.from(new Set(orders.map(o => o.store_id).filter(Boolean)))
  const storesMap: Record<string, StoreRow> = {}

  if (storeIds.length > 0) {
    const { data: storesRaw } = await supabase
      .from('Store')
      .select('id, name, slug')
      .in('id', storeIds)

    for (const s of (storesRaw as unknown as StoreRow[]) ?? []) {
      storesMap[s.id] = s
    }
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  // Comptes par statut pour afficher dans les onglets et les KPIs
  const { data: allOrders } = await supabase
    .from('Order')
    .select('status, total')

  const countByStatus: Record<string, number> = {}
  let totalRevenue = 0
  for (const row of (allOrders as unknown as Array<{ status: string, total: number }>) ?? []) {
    countByStatus[row.status] = (countByStatus[row.status] ?? 0) + 1
    totalRevenue += Number(row.total || 0)
  }
  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0)

  // KPIs calculés
  const countPending = (countByStatus['pending'] || 0) + (countByStatus['pending_payment'] || 0)
  const countCompleted = (countByStatus['completed'] || 0) + (countByStatus['delivered'] || 0)

  // Kanban setup
  const kanbanColumns = STATUS_TABS.filter(t => t.value !== 'all' && (statusFilter === 'all' || statusFilter === t.value))

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-12 overflow-x-hidden">
      {/* ── EN-TÊTE FULL BLEED IMMERSIF ── */}
      <div className="relative bg-gradient-to-r from-[#012928] to-[#0A4138] pt-16 pb-32 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Motif Glassmorphism de fond */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[80px] -z-0 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-widest uppercase">
                Gouvernance & Opérations
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Gestion<br />des Commandes <span className="text-emerald-400 opacity-60">·</span>
            </h1>
            <p className="mt-4 text-emerald-100/70 text-sm max-w-xl font-medium leading-relaxed">
              Supervisez toutes les transactions du réseau.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        
        {/* ── KPI STATS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           {/* Total Commandes */}
           <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <ShoppingCart className="w-24 h-24" />
              </div>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1 relative z-10">Total Commandes</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-gray-900 tracking-tight">{total}</h3>
              </div>
           </div>

           {/* En Attente */}
           <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                <Clock className="w-24 h-24" />
              </div>
              <p className="text-xs font-black uppercase text-amber-500/80 tracking-widest mb-1 relative z-10">En Attente</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-amber-500 tracking-tight">{countPending}</h3>
              </div>
           </div>

           {/* Terminées */}
           <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                <CheckCircle2 className="w-24 h-24 text-[#0F7A60]" />
              </div>
              <p className="text-xs font-black uppercase text-[#0F7A60]/80 tracking-widest mb-1 relative z-10">Livrées</p>
              <div className="flex items-baseline gap-2 relative z-10">
                 <h3 className="text-4xl font-black text-[#0F7A60] tracking-tight">{countCompleted}</h3>
              </div>
           </div>

           {/* Volume d'Affaires */}
           <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                <TrendingUp className="w-24 h-24 text-blue-500" />
              </div>
              <p className="text-xs font-black uppercase text-blue-500/80 tracking-widest mb-1 relative z-10">Volume d'Affaire Global</p>
              <div className="flex flex-col relative z-10">
                 <h3 className="text-2xl font-black text-gray-900 tracking-tight">{totalRevenue >= 1_000_000 ? (totalRevenue/1_000_000).toFixed(2) + ' M' : (totalRevenue/1000).toFixed(0) + ' K'}</h3>
                 <span className="text-xs text-blue-600 font-bold mt-1">FCFA</span>
              </div>
           </div>
        </div>

        {/* ── TABLE & FILTERS LAYOUT ── */}
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">

          {/* ── NAVIGATION (Top Tabs) ── */}
          <div className="w-full relative z-20">
            <div className="w-full relative z-10 flex flex-col md:flex-row md:items-center gap-4 bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2rem] lg:rounded-3xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest px-2 shrink-0 hidden md:flex items-center gap-2">
                Statuts
              </h2>
              <div className="w-full overflow-x-auto scrollbar-hide lg:overflow-visible">
                <nav className="flex flex-row flex-nowrap lg:flex-wrap gap-2 w-full min-w-max lg:min-w-0 p-1 items-center">
                  {STATUS_TABS.map((tab) => {
                    const isActive = statusFilter === tab.value
                    const n = tab.value === 'all' ? total : (countByStatus[tab.value] ?? 0)
                    return (
                      <Link
                        key={tab.value}
                        href={`/admin/orders?status=${tab.value}&view=${currentView}`}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group shrink-0 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50'
                            : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-gray-900 border border-transparent'
                        }`}
                      >
                        {isActive && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-full pointer-events-none" />}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 relative z-10 shadow-sm ${isActive ? 'bg-white' : tab.dot}`} />
                        <span className="text-sm tracking-tight relative z-10 whitespace-nowrap">{tab.label}</span>
                        <span className={`text-xs font-black tabular-nums relative z-10 px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100/80 text-gray-500'}`}>
                          {n}
                        </span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* ── CONTENU (TABLE OU KANBAN) ── */}
          <div className="flex-1 w-full min-w-0">
            
            {/* ── BARRE DE RECHERCHE & FILTRES ── */}
            <AdminOrderFilters />

            {/* Header des actions de contenu (Toggle Vue) */}
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A]">
                  {statusFilter === 'all' ? 'Toutes les commandes' : STATUS_TABS.find(t => t.value === statusFilter)?.label}
                </h2>
                {searchQ && <p className="text-xs text-gray-500 font-bold mt-1">Recherche pour "{searchQ}"</p>}
              </div>
              
              <div className="flex items-center gap-3">
                <ExportOrdersCSVButton />
                <div className="flex items-center bg-white/70 backdrop-blur-xl border border-white/50 p-1 rounded-xl shadow-sm">
                <Link
                  href={`/admin/orders?status=${statusFilter}&view=list`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <List className="w-4 h-4" />
                  Liste
                </Link>
                <Link
                  href={`/admin/orders?status=${statusFilter}&view=kanban`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentView === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </Link>
              </div>
            </div>
            </div>

            {currentView === 'kanban' ? (
              /* ── VUE KANBAN ── */
              <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                {kanbanColumns.map(column => {
                  const columnOrders = orders.filter(o => o.status === column.value)
                  
                  return (
                    <div key={column.value} className="flex-none w-[300px] snap-center flex flex-col bg-white/40 backdrop-blur-md rounded-3xl p-4 border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] h-fit min-h-[500px]">
                      <div className="flex items-center gap-3 px-2 mb-4">
                        <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] flex-1">{column.label}</h3>
                        <span className="text-xs font-black text-gray-500 bg-white/60 px-2 py-0.5 rounded-lg shadow-sm border border-white">
                          {columnOrders.length}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {columnOrders.map(order => (
                          <KanbanCard 
                            key={order.id} 
                            order={order} 
                            storeName={storesMap[order.store_id]?.name ?? '—'} 
                          />
                        ))}
                        
                        {columnOrders.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/30 rounded-2xl border border-dashed border-gray-200">
                            <Package className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-wider">Aucune commande</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ── VUE LISTE (TABLE) ── */
              <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                {/* Subtle Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

                <div className="overflow-x-auto relative z-10 w-full">
                  <table className="w-full text-left">
                    {/* En-tête émeraude subtil */}
                    <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-xs font-black tracking-widest">
                      <tr>
                        <th className="px-5 py-5 whitespace-nowrap">Référence</th>
                        <th className="px-5 py-5 whitespace-nowrap">Boutique</th>
                        <th className="px-5 py-5 whitespace-nowrap">Acheteur</th>
                        <th className="px-5 py-5 whitespace-nowrap">Montant</th>
                        <th className="px-5 py-5 whitespace-nowrap">Méthode</th>
                        <th className="px-5 py-5 text-center whitespace-nowrap">Statut</th>
                        <th className="px-5 py-5 whitespace-nowrap">Date</th>
                        <th className="px-5 py-5 text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map((order) => {
                        const store = storesMap[order.store_id]
                        return (
                          <tr key={order.id} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">
                            {/* Référence */}
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 shadow-sm flex-shrink-0">
                                  <Package className="w-3.5 h-3.5 text-[#0F7A60]" />
                                </div>
                                <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </td>

                            {/* Boutique */}
                            <td className="px-5 py-5">
                              <span className="text-sm font-bold text-[#1A1A1A] line-clamp-1">
                                {store?.name ?? '—'}
                              </span>
                            </td>

                            {/* Acheteur */}
                            <td className="px-5 py-5">
                              <div className="flex flex-col">
                                <span className="text-sm text-[#1A1A1A] font-semibold tracking-tight whitespace-nowrap">
                                  {order.buyer_name ?? '—'}
                                </span>
                                {order.buyer_phone && (
                                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{order.buyer_phone}</span>
                                )}
                              </div>
                            </td>

                            {/* Montant */}
                            <td className="px-5 py-5">
                              <span className="text-sm font-black text-[#C9A84C] whitespace-nowrap">
                                {order.total.toLocaleString('fr-FR')} FCFA
                              </span>
                            </td>

                            {/* Méthode */}
                            <td className="px-5 py-5">
                              <MethodBadge method={order.payment_method} />
                            </td>

                            {/* Statut */}
                            <td className="px-5 py-5 text-center">
                              <StatusBadge status={order.status} />
                            </td>

                            {/* Date */}
                            <td className="px-5 py-5 text-xs text-gray-500 font-medium whitespace-nowrap">
                              {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                            </td>

                            {/* Action */}
                            <td className="px-5 py-5 text-right">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 text-[#0F7A60] hover:shadow-md transition-all rounded-xl text-xs font-bold"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Voir</span>
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* État vide Premium */}
                  {orders.length === 0 && (
                    <div className="text-center py-24 text-gray-400 relative z-10 w-full">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/50 to-transparent pointer-events-none" />
                      <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
                        <Package className="w-10 h-10 text-[#0F7A60] opacity-80" />
                        <div className="absolute -inset-4 bg-emerald-400/20 rounded-full blur-xl -z-10" />
                      </div>
                      <p className="text-lg font-bold text-gray-700 relative z-10">Aucune commande</p>
                      <p className="text-sm mt-2 text-gray-500 max-w-sm mx-auto relative z-10">
                        {statusFilter !== 'all' ? `Aucune commande avec le statut « ${statusFilter} » actuellement.` : 'Aucune commande enregistrée pour le moment.'}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
            
            {/* Pagination Glassmorphism Bilan (Partagée) */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/admin/orders?page=${i + 1}&status=${statusFilter}&view=${currentView}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-all duration-300 shadow-sm border ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-br from-[#0A4138] to-[#0F7A60] text-white shadow-[0_4px_10px_rgba(15,122,96,0.3)] border-transparent'
                        : 'bg-white/80 backdrop-blur-md border border-white/50 text-gray-500 hover:border-[#0F7A60]/30 hover:text-[#0F7A60] hover:shadow-md'
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
