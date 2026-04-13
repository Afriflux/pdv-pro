import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/admin/rbac'
import EquityClient from './EquityClient'
import { PieChart, Landmark } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminEquityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Verification avec le nouveau système RBAC
  await requirePermission('equity', 'read')

  const supabaseAdmin = createAdminClient()

  // -- Récupération des actionnaires --
  const { data: rawEquity } = await supabaseAdmin
    .from('ShareholderEquity')
    .select('id, user_id, equity_percent, is_active, start_date, end_date, User(name, email), DividendDistribution(amount)')
    .eq('is_active', true)
    
  const shareholders = (rawEquity || []).map((e: any) => {
    // Somme des dividendes déjà versés à cet associé
    const sumPaid = (e.DividendDistribution || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0)
    
    return {
      id: e.id,
      userId: e.user_id,
      name: e.User?.name || 'Inconnu',
      email: e.User?.email || '',
      percent: e.equity_percent,
      startDate: e.start_date,
      endDate: e.end_date,
      alreadyPaid: sumPaid
    }
  })

  // Calcul basique pour l'UI
  const totalAllocated = shareholders.reduce((acc: number, curr: any) => acc + curr.percent, 0)
  
  // -- Calcul du P&L simulé --
  // Pour la démo : On récupère brut - expenses
  const { data: adminStore } = await supabaseAdmin.from('Store').select('id').eq('user_id', user.id).maybeSingle()
  let platformTotalEarned = 0
  if (adminStore) {
    const { data: adminWallet } = await supabaseAdmin.from('Wallet').select('total_earned').eq('vendor_id', adminStore.id).maybeSingle()
    if (adminWallet) platformTotalEarned = adminWallet.total_earned
  }

  const { data: rawExpenses } = await supabaseAdmin.from('CompanyExpense').select('amount')
  const totalExpenses = (rawExpenses || []).reduce((acc: number, curr: any) => acc + curr.amount, 0)
  const netProfit = platformTotalEarned - totalExpenses

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      {/* ── HEADER FULL-BLEED ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-10 pb-28 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Actionnariat & Board</h1>
              <p className="text-zinc-300 font-medium text-sm mt-1 max-w-xl">
                Gérez le capital de Yayyam, définissez les parts (% Equity) des associés, et supervisez la distribution automatique des dividendes (Smart Contract interne).
              </p>
            </div>
          </div>
        </div>
        
        {/* KPI Equity Overview */}
        <div className="relative z-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between">
             <div className="flex flex-col">
               <span className="text-zinc-400 text-xs font-black uppercase mb-1">Capital Distribué</span>
               <span className="text-2xl font-black text-white">{totalAllocated}% <span className="text-sm font-bold text-zinc-500">sur 100%</span></span>
             </div>
             <PieChart className="w-8 h-8 text-zinc-600 opacity-50" />
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-zinc-400 text-xs font-black uppercase mb-1">Associés Actifs</span>
            <span className="text-2xl font-black text-white">{shareholders.length} <span className="text-sm text-zinc-500">Membres du Board</span></span>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.15)] overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
              <Landmark className="w-16 h-16 text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-xs font-black uppercase mb-1">Bénéfice Net Distribuable</span>
            <span className="text-2xl font-black text-emerald-400">{netProfit.toLocaleString('fr-FR')} <span className="text-sm">CFA</span></span>
          </div>
        </div>
      </header>

      {/* ── CONTENU ── */}
      <div className="flex flex-col items-start gap-6 w-full max-w-7xl mx-auto relative z-20 px-6 lg:px-10 -mt-10 pb-20">
        <EquityClient 
          initialShareholders={shareholders} 
          netProfit={netProfit} 
        />
      </div>
    </div>
  )
}
