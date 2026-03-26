import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { Package, Eye } from 'lucide-react'

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
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${item.cls}`}>
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
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${item.cls}`}>
      {item.label}
    </span>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params       = await searchParams
  const supabase     = createAdminClient()
  const statusFilter = (params.status ?? 'all') as StatusValue
  const currentPage  = Number(params.page) || 1
  const pageSize     = 25
  const offset       = (currentPage - 1) * pageSize

  // ── ÉTAPE 1 : Commandes (sans join Store — join Supabase peu fiable) ─────────
  let orderQuery = supabase
    .from('Order')
    .select('id, total, status, payment_method, created_at, store_id, buyer_name, buyer_phone', { count: 'exact' })

  if (statusFilter !== 'all') {
    orderQuery = orderQuery.eq('status', statusFilter)
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

  // Comptes par statut pour afficher dans les onglets
  const { data: counts } = await supabase
    .from('Order')
    .select('status')

  const countByStatus: Record<string, number> = {}
  for (const row of (counts as unknown as Array<{ status: string }>) ?? []) {
    countByStatus[row.status] = (countByStatus[row.status] ?? 0) + 1
  }
  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">

      {/* ── EN-TÊTE ── */}
      <header>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Toutes les Commandes</h1>
        <p className="text-gray-400 text-sm mt-1">
          {count ?? 0} transaction{(count ?? 0) > 1 ? 's' : ''}{statusFilter !== 'all' ? ` · filtre : ${statusFilter}` : ''}
        </p>
      </header>

      {/* ── LAYOUT 2 COLONNES ── */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">

        {/* ── ONGLETS LATÉRAUX ── */}
        <aside className="w-full lg:w-56 flex-shrink-0 sticky top-24 z-10">
          <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Filtrer par statut</h2>
          <nav className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-3 flex flex-col gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value
              const n = tab.value === 'all' ? total : (countByStatus[tab.value] ?? 0)
              return (
                <Link
                  key={tab.value}
                  href={`/admin/orders?status=${tab.value}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50'
                      : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  {isActive && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-full pointer-events-none" />}
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${isActive ? 'bg-white' : tab.dot}`} />
                  <span className="flex-1 text-sm tracking-tight relative z-10">{tab.label}</span>
                  <span className={`text-[10px] font-black tabular-nums relative z-10 px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100/80 text-gray-500'}`}>
                    {n}
                  </span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* ── TABLEAU PRINCIPAL ── */}
        <div className="flex-1 w-full min-w-0">
          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {/* Subtle Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left">
                {/* En-tête émeraude subtil */}
                <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-5 py-5">Référence</th>
                    <th className="px-5 py-5">Boutique</th>
                    <th className="px-5 py-5">Acheteur</th>
                    <th className="px-5 py-5">Montant</th>
                    <th className="px-5 py-5">Méthode</th>
                    <th className="px-5 py-5 text-center">Statut</th>
                    <th className="px-5 py-5">Date</th>
                    <th className="px-5 py-5 text-right">Action</th>
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
                            <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 shadow-sm">
                              <Package className="w-3.5 h-3.5 text-[#0F7A60]" />
                            </div>
                            <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </td>

                        {/* Boutique */}
                        <td className="px-5 py-5">
                          <span className="text-sm font-bold text-[#1A1A1A]">
                            {store?.name ?? '—'}
                          </span>
                        </td>

                        {/* Acheteur */}
                        <td className="px-5 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm text-[#1A1A1A] font-semibold tracking-tight">
                              {order.buyer_name ?? '—'}
                            </span>
                            {order.buyer_phone && (
                              <span className="text-[10px] text-gray-400 font-medium">{order.buyer_phone}</span>
                            )}
                          </div>
                        </td>

                        {/* Montant */}
                        <td className="px-5 py-5">
                          <span className="text-sm font-black text-[#C9A84C]">
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
                        <td className="px-5 py-5 text-xs text-gray-500 font-medium">
                          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-5 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 text-[#0F7A60] hover:shadow-md transition-all rounded-xl text-xs font-bold"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
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

            {/* Pagination Glassmorphism */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/20 relative z-10 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/admin/orders?page=${i + 1}&status=${statusFilter}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-all duration-300 shadow-sm border ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-br from-[#0F7A60] to-teal-600 text-white shadow-[0_4px_10px_rgba(15,122,96,0.3)] border-transparent'
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
