import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/admin/rbac'
import AccountingClient from './AccountingClient'
import { Calculator } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAccountingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Verification avec le nouveau système RBAC
  await requirePermission('accounting', 'read')

  const supabaseAdmin = createAdminClient()

  // -- Récupération des revenus (Wallet Plateforme) --
  // On utilise supabaseAdmin pour éviter les erreurs de cache prisma actuel
  const { data: adminStore } = await supabaseAdmin
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
    
  let platformTotalEarned = 0
  if (adminStore) {
    const { data: adminWallet } = await supabaseAdmin
      .from('Wallet')
      .select('total_earned')
      .eq('vendor_id', adminStore.id)
      .maybeSingle()
    
    if (adminWallet) platformTotalEarned = adminWallet.total_earned
  }

  // -- Récupération des charges --
  const { data: rawExpenses } = await supabaseAdmin
    .from('CompanyExpense')
    .select('*')
    .order('expense_date', { ascending: false })
    
  const expenses = (rawExpenses || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    amount: e.amount,
    isRecurring: e.is_recurring,
    frequency: e.frequency,
    expenseDate: e.expense_date,
  }))

  const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)
  const netProfit = platformTotalEarned - totalExpenses

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      {/* ── HEADER FULL-BLEED ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] pt-10 pb-28 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-emerald-100 shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Calculator className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Comptabilité Interne (P&L)</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-xl">
                Suivez les charges de la plateforme (SERVEURS, MARKETING, SALAIRES) et analysez votre résultat net avant impôts et distribution.
              </p>
            </div>
          </div>
        </div>
        
        {/* KPI P&L Overview */}
        <div className="relative z-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
            <span className="text-emerald-100/70 text-[10px] font-black uppercase mb-1">C.A Brut Global</span>
            <span className="text-2xl font-black text-white">{platformTotalEarned.toLocaleString('fr-FR')} <span className="text-sm">CFA</span></span>
          </div>
          <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl p-4 flex flex-col shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <span className="text-red-200/90 text-[10px] font-black uppercase mb-1">Total Charges (Fixes & Var)</span>
            <span className="text-2xl font-black text-red-100">{totalExpenses.toLocaleString('fr-FR')} <span className="text-sm">CFA</span></span>
          </div>
          <div className="bg-[#C9A84C]/10 backdrop-blur-md border border-[#C9A84C]/30 rounded-2xl p-4 flex flex-col shadow-[0_0_15px_rgba(201,168,76,0.15)]">
            <span className="text-[#C9A84C]/90 text-[10px] font-black uppercase mb-1">Bénéfice Net (Période)</span>
            <span className="text-2xl font-black text-[#C9A84C]">{netProfit.toLocaleString('fr-FR')} <span className="text-sm">CFA</span></span>
          </div>
        </div>
      </header>

      {/* ── CONTENU ── */}
      <div className="flex flex-col items-start gap-6 w-full max-w-7xl mx-auto relative z-20 px-6 lg:px-10 -mt-10 pb-20">
        <AccountingClient initialExpenses={expenses} />
      </div>
    </div>
  )
}
