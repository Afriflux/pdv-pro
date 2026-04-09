import { createAdminClient } from '@/lib/supabase/admin'
import { 
  Wallet, 
  Clock, 
  TrendingUp,
  Banknote
} from 'lucide-react'
import { RetraitsView } from './RetraitsView'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface StoreRow {
  id: string
  name: string
}

interface WithdrawalRow {
  id: string
  amount: number
  payment_method: string
  phone_or_iban: string
  status: 'pending' | 'approved' | 'rejected' | 'insufficient_funds' | 'paid' | 'processing'
  requested_at: string
  processed_at: string | null
  store_id: string | null
  Store?: StoreRow | null
}

interface PageProps {
  searchParams: { 
    status?: string 
  }
}

// ----------------------------------------------------------------
// PAGE : GESTION DES RETRAITS (FULL-BLEED PREMIUM)
// ----------------------------------------------------------------
export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
  const supabase = createAdminClient()
  const statusFilter = searchParams.status || 'all'

  // 1. Récupération des stats GLOBALES pour les KPIs
  const { data: allWithdrawalsRaw } = await supabase
    .from('Withdrawal')
    .select('status, amount')

  const allWithdrawals = (allWithdrawalsRaw as Array<{ status: string, amount: number }>) || []

  let totalDecaisse = 0
  let pendingAmount = 0
  let pendingCount = 0
  const totalRequests = allWithdrawals.length

  for (const w of allWithdrawals) {
    if (w.status === 'paid' || w.status === 'approved') {
      totalDecaisse += Number(w.amount || 0)
    }
    if (w.status === 'pending') {
      pendingAmount += Number(w.amount || 0)
      pendingCount++
    }
  }

  // 2. Requête principale filtrée
  let query = supabase
    .from('Withdrawal')
    .select(`
      id, amount, payment_method, phone_or_iban, status, requested_at, processed_at, store_id
    `)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: withdrawalsRaw } = await query.order('requested_at', { ascending: false })
  const withdrawals = (withdrawalsRaw as unknown as WithdrawalRow[]) || []

  // ÉTAPE 2 : Boutiques pour les store_id trouvés
  const storeIds = Array.from(new Set(withdrawals.map(w => w.store_id).filter(Boolean)))
  const storesMap: Record<string, StoreRow> = {}

  if (storeIds.length > 0) {
    const { data: storesRaw } = await supabase
      .from('Store')
      .select('id, name')
      .in('id', storeIds)

    for (const s of (storesRaw as unknown as StoreRow[]) ?? []) {
      storesMap[s.id] = s
    }
  }

  // Attribution des boutiques aux retraits
  const enhancedWithdrawals = withdrawals.map(w => ({
    ...w,
    Store: w.store_id ? storesMap[w.store_id] : null
  }))

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-0">
      
      {/* ── EN-TÊTE FULL BLEED IMMERSIF (Spans full width) ── */}
      <div className="relative bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-12 pb-24 px-8 lg:px-12 border-b border-white/10 overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="w-full relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black tracking-widest uppercase">
                Gouvernance & Finances
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Gestion des Retraits
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full flex-col flex -mt-16 relative z-20 px-0">
        
        {/* ── KPI STATS CARDS ── */}
        <div className="px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
             {/* Total Demandes */}
             <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Wallet className="w-24 h-24" />
                </div>
                <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-1 relative z-10">Total Demandes</p>
                <div className="flex items-baseline gap-2 relative z-10">
                   <h3 className="text-4xl font-black text-gray-900 tracking-tight">{totalRequests}</h3>
                </div>
             </div>

             {/* En Attente (Montant) */}
             <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                  <Clock className="w-24 h-24 text-amber-500" />
                </div>
                <p className="text-[11px] font-black uppercase text-amber-500/80 tracking-widest mb-1 relative z-10">À Décaisser ({pendingCount})</p>
                <div className="flex items-baseline gap-2 relative z-10">
                   <h3 className="text-2xl font-black text-amber-500 tracking-tight">{pendingAmount.toLocaleString()} <span className="text-sm">FCFA</span></h3>
                </div>
             </div>

             {/* Total Décaissé */}
             <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Banknote className="w-24 h-24 text-[#0F7A60]" />
                </div>
                <p className="text-[11px] font-black uppercase text-[#0F7A60]/80 tracking-widest mb-1 relative z-10">Total Payé</p>
                <div className="flex flex-col relative z-10">
                   <h3 className="text-2xl font-black text-[#0F7A60] tracking-tight">{totalDecaisse >= 1_000_000 ? (totalDecaisse/1_000_000).toFixed(2) + ' M' : (totalDecaisse/1000).toFixed(0) + ' K'}</h3>
                   <span className="text-xs text-[#0F7A60] font-bold mt-1">FCFA</span>
                </div>
             </div>

             {/* Trend */}
             <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                  <TrendingUp className="w-24 h-24 text-blue-500" />
                </div>
                <p className="text-[11px] font-black uppercase text-blue-500/80 tracking-widest mb-1 relative z-10">Liquidités Sortantes</p>
                <div className="flex items-baseline gap-2 relative z-10 mt-2">
                   <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 font-bold text-xs rounded-lg">Flux de trésorerie actif</span>
                </div>
             </div>
          </div>
        </div>

        <RetraitsView initialWithdrawals={enhancedWithdrawals as WithdrawalRow[]} />
      </div>
    </div>
  )
}


