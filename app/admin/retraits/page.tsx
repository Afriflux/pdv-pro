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
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1 sticky top-6">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Statuts Retrait</h2>
        
        <Link 
          href="/admin/retraits" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'all' ? 'bg-[#0F7A60] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Wallet className="w-4 h-4" /> Tous les retraits
        </Link>
        <Link 
          href="/admin/retraits?status=pending" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'pending' ? 'bg-[#C9A84C] text-white shadow-sm' : 'text-gray-500 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]'}`}
        >
          <Clock className="w-4 h-4" /> En attente
        </Link>
        <Link 
          href="/admin/retraits?status=approved" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'approved' ? 'bg-[#0F7A60] text-white shadow-sm' : 'text-gray-500 hover:bg-[#0F7A60]/10 hover:text-[#0F7A60]'}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Approuvés / Payés
        </Link>
        <Link 
          href="/admin/retraits?status=rejected" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'rejected' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
        >
          <XCircle className="w-4 h-4" /> Rejetés
        </Link>
        <Link 
          href="/admin/retraits?status=insufficient_funds" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'insufficient_funds' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
        >
          <AlertCircle className="w-4 h-4" /> Fonds Insuffisants
        </Link>
      </div>

      {/* ── COLONNE DROITE : CONTENU PRINCIPAL ── */}
      <div className="flex-1 w-full space-y-6">

        {/* ── EN-TÊTE ── */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Validation des Retraits</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {totalPendingCount} demande(s) en attente ({totalPendingAmount.toLocaleString()} CFA)
            </p>
          </div>
        </div>

        {/* --- TABLEAU --- */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-black tracking-widest">
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
              <tbody className="divide-y divide-gray-50">
              {(withdrawals as unknown as WithdrawalRow[] || []).map((wr) => (
                <tr key={wr.id} className="hover:bg-[#FAFAF7] transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/admin/vendeurs/${wr.Store?.id}`}
                      className="flex items-center gap-2 group"
                    >
                      <span className="font-semibold text-sm group-hover:text-[#0F7A60] transition-colors text-[#1A1A1A]">{wr.Store?.name || 'N/A'}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
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
