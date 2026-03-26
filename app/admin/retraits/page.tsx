import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'

import Link from 'next/link'
import { 
  Wallet, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ExternalLink
} from 'lucide-react'
import WithdrawalActions from './WithdrawalActions'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface WithdrawalRow {
  id: string
  amount: number
  method: string
  phone_or_iban: string
  status: 'pending' | 'approved' | 'rejected' | 'insufficient_funds'
  created_at: string
  processed_at: string | null
  Store: { id: string; name: string } | null
}

interface PageProps {
  searchParams: { 
    status?: string 
  }
}

// ----------------------------------------------------------------
// PAGE : GESTION DES RETRAITS
// ----------------------------------------------------------------
export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
  const supabase = createAdminClient()
  const statusFilter = searchParams.status || 'all'

  // 1. Récupération des stats rapides
  const { data: statsData } = await supabase
    .from('WithdrawalRequest')
    .select('amount')
    .eq('status', 'pending')

  const totalPendingCount = statsData?.length || 0
  const totalPendingAmount = statsData?.reduce((acc, curr) => acc + curr.amount, 0) || 0

  // 2. Requête principale
  let query = supabase
    .from('WithdrawalRequest')
    .select(`
      id, amount, method, phone_or_iban, status, created_at, processed_at,
      Store(id, name)
    `)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: withdrawals } = await query.order('created_at', { ascending: false })

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start animate-in fade-in duration-500">
      
      {/* ── COLONNE GAUCHE : ONGLETS LATÉRAUX ── */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1 sticky top-24 z-10">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Statuts Retrait</h2>
        
        <nav className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-3 flex flex-col gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Link 
            href="/admin/retraits" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${statusFilter === 'all' ? 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-gray-900 border border-transparent'}`}
          >
            {statusFilter === 'all' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${statusFilter === 'all' ? 'bg-white' : 'bg-gray-400'}`} />
            <span className="flex-1 relative z-10">Tous les retraits</span>
          </Link>
          <Link 
            href="/admin/retraits?status=pending" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${statusFilter === 'pending' ? 'bg-gradient-to-r from-[#C9A84C] to-amber-500 text-white shadow-[0_4px_15px_rgba(201,168,76,0.3)] border border-[#C9A84C]/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-[#C9A84C] border border-transparent'}`}
          >
            {statusFilter === 'pending' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${statusFilter === 'pending' ? 'bg-white' : 'bg-amber-400'}`} />
            <span className="flex-1 relative z-10">En attente</span>
          </Link>
          <Link 
            href="/admin/retraits?status=approved" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${statusFilter === 'approved' ? 'bg-gradient-to-r from-[#0F7A60] to-emerald-500 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-[#0F7A60] border border-transparent'}`}
          >
            {statusFilter === 'approved' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${statusFilter === 'approved' ? 'bg-white' : 'bg-[#0F7A60]'}`} />
            <span className="flex-1 relative z-10">Approuvés / Payés</span>
          </Link>
          <Link 
            href="/admin/retraits?status=rejected" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${statusFilter === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] border border-red-500/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-red-500 border border-transparent'}`}
          >
            {statusFilter === 'rejected' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${statusFilter === 'rejected' ? 'bg-white' : 'bg-red-400'}`} />
            <span className="flex-1 relative z-10">Rejetés</span>
          </Link>
          <Link 
            href="/admin/retraits?status=insufficient_funds" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${statusFilter === 'insufficient_funds' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_4px_15px_rgba(234,88,12,0.3)] border border-orange-600/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-orange-600 border border-transparent'}`}
          >
            {statusFilter === 'insufficient_funds' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${statusFilter === 'insufficient_funds' ? 'bg-white' : 'bg-orange-500'}`} />
            <span className="flex-1 relative z-10">Fonds Insuffisants</span>
          </Link>
        </nav>
      </div>

      {/* ── COLONNE DROITE : CONTENU PRINCIPAL ── */}
      <div className="flex-1 w-full space-y-6">

        {/* ── EN-TÊTE ── */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Validation des Retraits</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalPendingCount} demande(s) en attente (<span className="font-bold text-[#C9A84C]">{totalPendingAmount.toLocaleString()} FCFA</span>)
            </p>
          </div>
        </div>

        {/* --- TABLEAU --- */}
        <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-5">Boutique</th>
                  <th className="px-6 py-5">Montant</th>
                  <th className="px-6 py-5">Méthode</th>
                  <th className="px-6 py-5">Contact/IBAN</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5">Statut</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
              {(withdrawals as unknown as WithdrawalRow[] || []).map((wr) => (
                <tr key={wr.id} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">
                  <td className="px-6 py-5">
                    <Link 
                      href={`/admin/vendeurs/${wr.Store?.id}`}
                      className="flex items-center gap-2 group/link"
                    >
                      <span className="font-bold text-sm group-hover/link:text-[#0F7A60] transition-colors text-[#1A1A1A]">{wr.Store?.name || 'N/A'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/link:opacity-100 transition-all" />
                    </Link>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-3 py-1.5 rounded-xl">
                      {wr.amount.toLocaleString()} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black text-[#0F7A60] uppercase tracking-wider bg-[#0F7A60]/10 px-2.5 py-1 rounded-lg">
                      {wr.method}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-mono font-medium text-gray-500">
                    {wr.phone_or_iban}
                  </td>
                  <td className="px-6 py-5 text-xs font-semibold text-gray-400">
                    {format(new Date(wr.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-5">
                    {renderStatusBadge(wr.status)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <WithdrawalActions withdrawalId={wr.id} status={wr.status} />
                  </td>
                </tr>
              ))}
              {(!withdrawals || withdrawals.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative border border-white/50">
                      <Wallet className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-bold text-gray-700">Aucune demande</p>
                    <p className="text-sm mt-2 text-gray-500">Aucun retrait ne correspond à ces critères.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  )
}

function renderStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase"><CheckCircle2 className="w-3 h-3" /> Payé</span>
    case 'pending':
      return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase"><Clock className="w-3 h-3" /> En attente</span>
    case 'rejected':
      return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-[9px] font-black uppercase"><XCircle className="w-3 h-3" /> Rejeté</span>
    case 'insufficient_funds':
      return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/10 text-red-600 rounded-full text-[9px] font-black uppercase"><AlertCircle className="w-3 h-3" /> Fonds insuffisants</span>
    default:
      return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-500 rounded-full text-[9px] font-black uppercase">{status}</span>
  }
}
