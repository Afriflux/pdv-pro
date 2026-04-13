import { createAdminClient } from '@/lib/supabase/admin'
import {
  Users, Search, ShoppingBag, Phone, Mail,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface PageProps {
  searchParams: Promise<{
    q?: string
    page?: string
    sort?: string // 'orders' | 'spent' | 'recent'
  }>
}

interface BuyerRow {
  buyer_name: string
  buyer_phone: string
  buyer_email: string | null
  total: number
  status: string
  created_at: string
  store_id: string
}

interface BuyerAggregated {
  name: string
  phone: string
  email: string | null
  totalOrders: number
  totalSpent: number
  firstOrder: string
  lastOrder: string
  stores: Set<string>
}

// ----------------------------------------------------------------
// PAGE : BASE DE DONNÉES CLIENTS (ADMIN)
// ----------------------------------------------------------------
export default async function AdminClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createAdminClient()
  
  const query = params.q ?? ''
  const sortBy = params.sort ?? 'recent'
  const currentPage = Number(params.page) || 1
  const pageSize = 30

  // ── Requête : Toutes les commandes payées → agrégation par buyer_phone ──
  let orderQuery = supabase
    .from('Order')
    .select('buyer_name, buyer_phone, buyer_email, total, status, created_at, store_id')
    .in('status', ['paid', 'confirmed', 'completed', 'delivered'])

  if (query) {
    orderQuery = orderQuery.or(`buyer_name.ilike.%${query}%,buyer_phone.ilike.%${query}%,buyer_email.ilike.%${query}%`)
  }

  const { data: ordersRaw, error } = await orderQuery.order('created_at', { ascending: false }).limit(5000)

  if (error) console.error('[AdminClients] Erreur:', error.message)
  const orders = (ordersRaw ?? []) as unknown as BuyerRow[]

  // ── Agrégation par téléphone ────────────────────────────────────────────
  const buyersMap = new Map<string, BuyerAggregated>()

  for (const order of orders) {
    const key = order.buyer_phone
    if (!key) continue
    
    const existing = buyersMap.get(key)
    if (existing) {
      existing.totalOrders++
      existing.totalSpent += order.total
      existing.stores.add(order.store_id)
      if (order.buyer_name && !existing.name) existing.name = order.buyer_name
      if (order.buyer_email && !existing.email) existing.email = order.buyer_email
      if (new Date(order.created_at) < new Date(existing.firstOrder)) existing.firstOrder = order.created_at
      if (new Date(order.created_at) > new Date(existing.lastOrder)) existing.lastOrder = order.created_at
    } else {
      buyersMap.set(key, {
        name: order.buyer_name || 'Client anonyme',
        phone: order.buyer_phone,
        email: order.buyer_email,
        totalOrders: 1,
        totalSpent: order.total,
        firstOrder: order.created_at,
        lastOrder: order.created_at,
        stores: new Set([order.store_id])
      })
    }
  }

  const buyersList = Array.from(buyersMap.values())
  
  if (sortBy === 'orders') {
    buyersList.sort((a, b) => b.totalOrders - a.totalOrders)
  } else if (sortBy === 'spent') {
    buyersList.sort((a, b) => b.totalSpent - a.totalSpent)
  } else {
    buyersList.sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime())
  }

  // ── Pagination ──────────────────────────────────────────────────────────
  const totalBuyers = buyersList.length
  const totalPages = Math.ceil(totalBuyers / pageSize)
  const offset = (currentPage - 1) * pageSize
  const paginatedBuyers = buyersList.slice(offset, offset + pageSize)
  
  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalGMV = buyersList.reduce((s, b) => s + b.totalSpent, 0)
  const totalOrdersKPI = buyersList.reduce((s, b) => s + b.totalOrders, 0)
  const avgBasket = totalOrdersKPI > 0 ? Math.round(totalGMV / totalOrdersKPI) : 0
  const repeatBuyers = buyersList.filter(b => b.totalOrders >= 2).length

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Users className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Base Clients</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                {totalBuyers} client{totalBuyers > 1 ? 's' : ''} unique{totalBuyers > 1 ? 's' : ''} identifié{totalBuyers > 1 ? 's' : ''} dans votre réseau.
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
                placeholder="Rechercher par nom, téléphone ou email..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white
                  focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 outline-none transition-all placeholder:text-white/50 shadow-inner"
              />
              <input type="hidden" name="sort" value={sortBy} />
            </form>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="relative z-10 mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1">Clients Uniques</span>
            <span className="text-2xl font-black text-white">{totalBuyers}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1">GMV Totale</span>
            <span className="text-2xl font-black text-amber-300">{formatMoney(totalGMV)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1">Panier Moyen</span>
            <span className="text-2xl font-black text-white">{formatMoney(avgBasket)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex flex-col">
            <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1">Clients Récurrents</span>
            <span className="text-2xl font-black text-emerald-300">{repeatBuyers}</span>
          </div>
        </div>
      </header>

      {/* ── CONTENU ── */}
      <div className="flex-1 w-full relative z-20 px-6 lg:px-10 -mt-16 pb-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.02] border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">

          {/* Header zone données */}
          <div className="px-6 lg:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Répertoire ({totalBuyers})
            </h2>
            <div className="flex bg-[#FAFAF7] p-1 rounded-xl border border-gray-200 shadow-inner">
              <Link 
                href={`/admin/clients?sort=recent&q=${query}`}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'recent' ? 'bg-white text-emerald-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Récents
              </Link>
              <Link 
                href={`/admin/clients?sort=spent&q=${query}`}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'spent' ? 'bg-white text-emerald-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Top dépensiers
              </Link>
              <Link 
                href={`/admin/clients?sort=orders&q=${query}`}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'orders' ? 'bg-white text-emerald-700 shadow border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Top commandes
              </Link>
            </div>
          </div>

          {/* Tableau */}
          {paginatedBuyers.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                <Users size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Aucun client trouvé</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Les clients apparaîtront ici dès qu&apos;une commande sera validée sur le réseau Yayyam.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-[#FAFAF7] border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Client</th>
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contact</th>
                    <th className="text-center px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Commandes</th>
                    <th className="text-right px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Total Dépensé</th>
                    <th className="text-center px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Boutiques</th>
                    <th className="text-right px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Dernier Achat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedBuyers.map((buyer, idx) => (
                    <tr key={buyer.phone + idx} className="hover:bg-emerald-50/30 transition-colors group">
                      {/* Nom */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center shrink-0 border border-emerald-200">
                            <span className="text-emerald-700 font-bold text-sm">
                              {buyer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{buyer.name}</p>
                            {buyer.totalOrders >= 3 && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                🔥 Fidèle
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-700 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {buyer.phone}
                          </span>
                          {buyer.email && (
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" /> {buyer.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Commandes */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gray-900">{buyer.totalOrders}</span>
                      </td>

                      {/* Total dépensé */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900">{formatMoney(buyer.totalSpent)}</span>
                      </td>

                      {/* Boutiques */}
                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">
                          {buyer.stores.size}
                        </span>
                      </td>

                      {/* Dernier achat */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(buyer.lastOrder).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-100 flex items-center justify-center gap-2 bg-[#FAFAF7]/50">
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                <Link
                  key={i}
                  href={`/admin/clients?page=${i + 1}&q=${query}&sort=${sortBy}`}
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
  )
}
