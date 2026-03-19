import { createAdminClient } from '@/lib/supabase/admin'
import {
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Store,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

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

interface StatItem {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  color: string
  bgColor: string
}

// ----------------------------------------------------------------
// Badge statut commande
// ----------------------------------------------------------------
function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed:  'bg-[#0F7A60]/10 text-[#0F7A60]',
    paid:       'bg-blue-50 text-blue-600',
    pending:    'bg-[#C9A84C]/10 text-[#C9A84C]',
    cancelled:  'bg-red-50 text-red-500',
    processing: 'bg-purple-50 text-purple-600',
  }
  const labels: Record<string, string> = {
    completed:  'Complétée',
    paid:       'Payée',
    pending:    'En attente',
    cancelled:  'Annulée',
    processing: 'En cours',
  }
  const cls = styles[status] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ----------------------------------------------------------------
// DASHBOARD SUPER ADMIN — Charte PDV Pro (émeraude/or/crème)
// ----------------------------------------------------------------
export default async function AdminDashboard() {
  const supabase = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Récupération de toutes les métriques en parallèle
  const [
    { count: totalStores },
    { count: ordersToday },
    { data: revenueData },
    { count: pendingOrders },
    { count: pendingWithdrawals },
    { data: withdrawalsAmount },
    { count: newStoresWeek },
    { data: latestOrders },
  ] = await Promise.all([
    supabase.from('Store').select('*', { count: 'exact', head: true }),
    supabase.from('Order').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('Order').select('total').in('status', ['paid', 'confirmed', 'completed']).gte('created_at', todayISO),
    supabase.from('Order').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('WithdrawalRequest').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('WithdrawalRequest').select('amount').eq('status', 'pending'),
    supabase.from('Store').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('Order')
      .select('id, total, status, created_at, Store(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Calculs agrégés
  const dailyRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total ?? 0), 0) ?? 0
  const totalPendingAmount = withdrawalsAmount?.reduce((acc, curr) => acc + (curr.amount ?? 0), 0) ?? 0

  // Cards statistiques avec couleurs de la charte PDV Pro
  const stats: StatItem[] = [
    {
      label:   'Vendeurs Totaux',
      value:   totalStores ?? 0,
      icon:    Store,
      trend:   `+${newStoresWeek ?? 0} cette semaine`,
      color:   'text-[#0F7A60]',
      bgColor: 'bg-[#0F7A60]/10',
    },
    {
      label:   'Commandes (24h)',
      value:   ordersToday ?? 0,
      icon:    ShoppingBag,
      color:   'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label:   'CA du jour',
      value:   `${dailyRevenue.toLocaleString('fr-FR')} FCFA`,
      icon:    TrendingUp,
      color:   'text-[#C9A84C]',
      bgColor: 'bg-[#C9A84C]/10',
    },
    {
      label:   'En attente',
      value:   pendingOrders ?? 0,
      icon:    Clock,
      color:   'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      label:   'Retraits en attente',
      value:   pendingWithdrawals ?? 0,
      icon:    Wallet,
      color:   'text-[#0F7A60]',
      bgColor: 'bg-[#0F7A60]/10',
    },
    {
      label:   'Montant à décaisser',
      value:   `${totalPendingAmount.toLocaleString('fr-FR')} FCFA`,
      icon:    ArrowUpRight,
      color:   'text-red-500',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── EN-TÊTE ── */}
      <header>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Vue d&apos;ensemble</h1>
        <p className="text-gray-400 text-sm mt-1">
          Statistiques consolidées de PDV Pro au{' '}
          {format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
      </header>

      {/* ── CARDS STATISTIQUES — Fond blanc, bordure grise, icônes colorées ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</h3>
                {stat.trend && (
                  <p className="text-[11px] text-[#0F7A60] mt-2 font-medium">
                    {stat.trend}
                  </p>
                )}
              </div>
              {/* Icône colorée selon la charte */}
              <div className={`p-3 rounded-xl ${stat.bgColor} flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLEAU DERNIÈRES COMMANDES — Fond blanc, bordures grises ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0F7A60]/10 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#0F7A60]" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">Dernières commandes</h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-[#0F7A60] hover:text-[#0D5C4A] font-semibold transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* Header tableau — émeraude subtil */}
            <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Réf</th>
                <th className="px-6 py-4">Boutique</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {((latestOrders as unknown as OrderWithStore[]) ?? []).map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-[#FAFAF7] transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                    {order.Store?.name ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#C9A84C]">
                    {order.total.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* État vide */}
          {(!latestOrders || latestOrders.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune commande pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── LIENS RAPIDES — Navigation admin ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/vendeurs',      label: 'Gérer les vendeurs',   icon: Users,       color: 'text-[#0F7A60]', bg: 'bg-[#0F7A60]/10' },
          { href: '/admin/retraits',      label: 'Valider les retraits', icon: Wallet,      color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
          { href: '/admin/orders',        label: 'Toutes les commandes', icon: ShoppingBag, color: 'text-blue-500',   bg: 'bg-blue-50' },
          { href: '/admin/ambassadeurs',  label: 'Ambassadeurs',         icon: Users,       color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-300 transition-all group text-center"
          >
            <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <span className="text-xs font-semibold text-gray-600 leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
