import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'

import Link from 'next/link'
import { 
  Wallet, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Filter
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold font-sans">Gestion des Retraits</h1>
        <p className="text-gray-500 text-sm mt-1">Validation et suivi des demandes de décaissement</p>
      </header>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161B22] border border-[#30363D] p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Nombre en attente</p>
            <h3 className="text-2xl font-black">{totalPendingCount}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Montant total à décaisser</p>
            <h3 className="text-2xl font-black text-emerald-500">{totalPendingAmount.toLocaleString()} <span className="text-xs font-medium">CFA</span></h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- FILTRES --- */}
      <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-2xl flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-500 mr-2" />
        {['all', 'pending', 'approved', 'rejected', 'insufficient_funds'].map((s) => (
          <Link
            key={s}
            href={`/admin/retraits?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === s 
                ? 'bg-[#0F7A60] text-white shadow-lg shadow-[#0F7A60]/20' 
                : 'bg-[#0D1117] border border-[#30363D] text-gray-400 hover:border-[#30363D]/80'
            }`}
          >
            {s.toUpperCase().replace('_', ' ')}
          </Link>
        ))}
      </div>

      {/* --- TABLEAU --- */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0D1117] text-gray-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Boutique</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Méthode</th>
                <th className="px-6 py-4">Contact/IBAN</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {(withdrawals as unknown as WithdrawalRow[] || []).map((wr) => (
                <tr key={wr.id} className="hover:bg-[#0D1117]/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/admin/vendeurs/${wr.Store?.id}`}
                      className="flex items-center gap-2 group"
                    >
                      <span className="font-semibold text-sm group-hover:text-[#0F7A60] transition-colors">{wr.Store?.name || 'N/A'}</span>
                      <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-[#C9A84C]">
                    {wr.amount.toLocaleString()} CFA
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-tighter">
                    {wr.method}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    {wr.phone_or_iban}
                  </td>
                  <td className="px-6 py-4 text-[10px] text-gray-500">
                    {format(new Date(wr.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusBadge(wr.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <WithdrawalActions withdrawalId={wr.id} status={wr.status} />
                  </td>
                </tr>
              ))}
              {(!withdrawals || withdrawals.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic text-sm">
                    Aucune demande de retrait trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
