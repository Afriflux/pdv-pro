import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import {
  MessageSquare, Clock, CheckCircle2, AlertCircle, XCircle,
  Search, Filter, LucideIcon
} from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    page?: string
  }>
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  OPEN:        { label: 'Ouvert',     color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',    icon: AlertCircle },
  IN_PROGRESS: { label: 'En cours',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   icon: Clock },
  RESOLVED:    { label: 'Résolu',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  CLOSED:      { label: 'Fermé',      color: 'text-gray-700',    bg: 'bg-gray-50 border-gray-200',      icon: XCircle },
}

export default async function AdminTicketsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createAdminClient()

  const query        = params.q      ?? ''
  const statusFilter = params.status ?? 'all'
  const currentPage  = Number(params.page) || 1
  const pageSize     = 20
  const offset       = (currentPage - 1) * pageSize

  // Query tickets
  let ticketQuery = supabase
    .from('HelpdeskTicket')
    .select('id, store_id, customer_name, customer_email, customer_phone, subject, message, status, created_at, updated_at', { count: 'exact' })

  if (query) {
    ticketQuery = ticketQuery.or(`customer_name.ilike.%${query}%,subject.ilike.%${query}%,customer_email.ilike.%${query}%`)
  }
  if (statusFilter !== 'all') {
    ticketQuery = ticketQuery.eq('status', statusFilter)
  }

  const { data: tickets, count, error } = await ticketQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) console.error('[AdminTickets] Error:', error.message)

  // KPIs
  const [
    { count: totalCount },
    { count: openCount },
    { count: inProgressCount },
    { count: resolvedCount }
  ] = await Promise.all([
    supabase.from('HelpdeskTicket').select('id', { count: 'exact', head: true }),
    supabase.from('HelpdeskTicket').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
    supabase.from('HelpdeskTicket').select('id', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
    supabase.from('HelpdeskTicket').select('id', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
  ])

  // Get store names for tickets
  const storeIds = Array.from(new Set((tickets ?? []).map((t: any) => t.store_id).filter(Boolean)))  // eslint-disable-line @typescript-eslint/no-explicit-any
  const storeMap: Record<string, string> = {}
  if (storeIds.length > 0) {
    const { data: stores } = await supabase.from('Store').select('id, name').in('id', storeIds)
    for (const s of (stores ?? []) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      storeMap[s.id] = s.name
    }
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Support & Tickets</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                Centre de gestion des demandes de support client.
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
                placeholder="Rechercher un ticket..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white
                  focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 outline-none transition-all placeholder:text-white/50 shadow-inner"
              />
              <input type="hidden" name="status" value={statusFilter} />
            </form>
          </div>
        </div>

        {/* KPIs */}
        <div className="relative z-10 mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', value: totalCount ?? 0, color: 'text-white' },
            { label: 'Ouverts', value: openCount ?? 0, color: 'text-red-300' },
            { label: 'En cours', value: inProgressCount ?? 0, color: 'text-amber-300' },
            { label: 'Résolus', value: resolvedCount ?? 0, color: 'text-emerald-300' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
              <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1">{kpi.label}</span>
              <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row items-start gap-6 w-full relative z-20 px-6 lg:px-10 -mt-16 pb-20">
        
        {/* Sidebar Filtres */}
        <aside className="w-full lg:w-[250px] flex-shrink-0 sticky top-[100px] z-10 bg-white border border-gray-100 p-5 rounded-3xl shadow-xl flex flex-col gap-4">
          <h2 className="text-xs items-center gap-2 flex font-black uppercase text-gray-400 tracking-widest pl-2">
            <Filter size={14} /> Statut
          </h2>
          <nav className="flex flex-col gap-1.5">
            {[
              { value: 'all',          label: 'Tous',       icon: '📋' },
              { value: 'OPEN',         label: 'Ouverts',    icon: '🔴' },
              { value: 'IN_PROGRESS',  label: 'En cours',   icon: '🟡' },
              { value: 'RESOLVED',     label: 'Résolus',    icon: '🟢' },
              { value: 'CLOSED',       label: 'Fermés',     icon: '⚫' },
            ].map(filter => (
              <Link
                key={filter.value}
                href={`/admin/tickets?status=${filter.value}&q=${query}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  statusFilter === filter.value
                    ? 'bg-[#0A4138] text-white shadow-md shadow-emerald-900/20'
                    : 'text-gray-500 hover:bg-emerald-50 hover:text-gray-900'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Bientôt</p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <MessageSquare size={20} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-700">Chat en temps réel</p>
              <p className="text-xs text-emerald-500 mt-1">Discussion style WhatsApp intégrée</p>
            </div>
          </div>
        </aside>

        {/* Table */}
        <div className="flex-1 min-w-0 w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            
            <div className="px-6 lg:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Tickets ({count ?? 0})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#FAFAF7]">
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ticket</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Boutique</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Statut</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(tickets ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-20 text-gray-400 font-bold">
                        <MessageSquare className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-lg font-black text-gray-300 mb-2">Aucun ticket</p>
                        <p className="text-sm">Les tickets de support apparaîtront ici</p>
                      </td>
                    </tr>
                  ) : (tickets ?? []).map((ticket: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any 
                    const statusInfo = STATUS_MAP[ticket.status] ?? STATUS_MAP['OPEN']
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={ticket.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-black text-gray-900 text-sm truncate max-w-[300px]">{ticket.subject}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {ticket.customer_name} {ticket.customer_phone ? `• ${ticket.customer_phone}` : ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-gray-600">{storeMap[ticket.store_id] ?? ticket.store_id?.slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell text-xs text-gray-400">
                          {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/admin/tickets?page=${i + 1}&q=${query}&status=${statusFilter}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-all shadow-sm border ${
                      currentPage === i + 1
                        ? 'bg-[#0A4138] text-white shadow-md border-transparent'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'
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
