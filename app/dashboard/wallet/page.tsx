import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DepositModal } from '@/components/dashboard/DepositModal'
import { WithdrawModal } from './WithdrawModal'
import { WalletDashboardClient, TransactionRow } from './WalletDashboardClient'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoreData {
  id:                string
  withdrawal_method: string | null
  withdrawal_number: string | null
  withdrawal_name:   string | null
}

interface WalletData {
  id:           string
  balance:      number
  pending:      number
  total_earned: number
  auto_withdraw_enabled: boolean | null
  auto_withdraw_threshold: number | null
  monthly_goal: number | null
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

const METHOD_LABELS: Record<string, string> = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  bank:         'Virement bancaire',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Récupérer le store du vendeur
  const { data: storeRaw } = await supabase
    .from('Store')
    .select('id, withdrawal_method, withdrawal_number, withdrawal_name')
    .eq('user_id', user.id)
    .single()

  const store = storeRaw as StoreData | null
  if (!store) redirect('/dashboard')

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  // 2. Charger wallet + commandes (60 derniers jours)
  const [walletRes, recentOrdersRes] = await Promise.all([
    supabase
      .from('Wallet')
      .select('id, balance, pending, total_earned, auto_withdraw_enabled, auto_withdraw_threshold, monthly_goal')
      .eq('vendor_id', store.id)
      .single(),
    supabase
      .from('Order')
      .select('id, created_at, vendor_amount, platform_fee, delivery_fee, subtotal, status, buyer_name')
      .eq('store_id', store.id)
      .in('status', ['completed', 'paid'])
      .gte('created_at', sixtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  const wallet = walletRes.data as WalletData | null

  // 3. Charger les retraits (Withdrawals) si un wallet existe
  let recentWithdrawals: any[] = []
  if (wallet) {
    const wRes = await supabase
      .from('Withdrawal')
      .select('id, requested_at, amount, status, payment_method')
      .eq('wallet_id', wallet.id)
      .gte('requested_at', sixtyDaysAgo.toISOString())
      .limit(100)
    recentWithdrawals = wRes.data || []
  }

  // 4. Fusionner les ventes (Orders) et les retraits (Withdrawals) en une liste unifiée
  const transactions: TransactionRow[] = [
    ...(recentOrdersRes.data || []).map((o: any) => ({
      id: o.id,
      type: 'order' as const,
      created_at: o.created_at,
      amount: Number(o.vendor_amount),
      platform_fee: Number(o.platform_fee) || 0,
      delivery_fee: Number(o.delivery_fee) || 0,
      subtotal: Number(o.subtotal) || 0,
      status: o.status,
      label: o.buyer_name || 'Client Inconnu'
    })),
    ...recentWithdrawals.map((w: any) => ({
      id: w.id,
      type: 'withdrawal' as const,
      created_at: w.requested_at,
      amount: Number(w.amount),
      platform_fee: 0,
      delivery_fee: 0,
      subtotal: 0,
      status: w.status,
      label: `Retrait ${METHOD_LABELS[w.payment_method] || 'Transfert'}`,
      notes: w.notes
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())


  const balance     = Number(wallet?.balance)      || 0
  const pending     = Number(wallet?.pending)      || 0
  const totalEarned = Number(wallet?.total_earned) || 0

  const autoWithdrawEnabled   = Boolean(wallet?.auto_withdraw_enabled)
  const autoWithdrawThreshold = Number(wallet?.auto_withdraw_threshold) || 100000
  const monthlyGoal           = Number(wallet?.monthly_goal) || 1000000

  const hasWithdrawalAccount = !!store.withdrawal_number?.trim()
  const canWithdraw          = hasWithdrawalAccount && balance >= 5000
  const methodLabel          = METHOD_LABELS[store.withdrawal_method ?? 'wave'] ?? 'Wave'

  return (
    <div className="w-full space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-12">

      {/* ── En-tête ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white shadow-2xl shadow-[#0F7A60]/5 sticky top-2 z-20 overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-[#0A5240] text-white flex items-center justify-center shadow-lg shadow-[#0F7A60]/20 shrink-0">
            <span className="text-2xl md:text-3xl">💰</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">Mon Portefeuille</h1>
            <p className="text-dust text-sm md:text-base font-medium mt-1">
              Suivez vos revenus et effectuez vos retraits.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 shrink-0 w-full sm:w-auto mt-5 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <DepositModal />
          <WithdrawModal 
            balance={balance}
            withdrawalMethod={store.withdrawal_method ?? 'wave'}
            withdrawalNumber={store.withdrawal_number ?? ''}
            withdrawalName={store.withdrawal_name ?? ''}
            storeId={store.id}
            hasWithdrawalAccount={hasWithdrawalAccount}
            canWithdraw={canWithdraw}
          />
        </div>
      </header>

      {/* ── Alerte : compte de retrait non configuré ── */}
      {!hasWithdrawalAccount && (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-3xl p-4 md:p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 relative z-10">
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex-1 mt-0.5 relative z-10">
            <p className="text-sm font-black text-amber-900">
              Compte de retrait non configuré
            </p>
            <p className="text-[13px] text-amber-800/80 mt-1 max-w-2xl leading-relaxed">
              Configurez votre compte Wave, Orange Money ou bancaire dans les Paramètres avant de pouvoir effectuer un retrait de vos gains.
            </p>
            <Link
              href="/dashboard/settings#retrait"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-amber-100/80 text-xs font-bold text-amber-900 rounded-xl hover:bg-amber-200 transition-colors shadow-sm"
            >
              Configurer maintenant →
            </Link>
          </div>
        </div>
      )}

      {/* ── Client Component avec Onglets ── */}
      <WalletDashboardClient 
        balance={balance}
        pending={pending}
        totalEarned={totalEarned}
        initialTransactions={transactions}
        autoWithdrawEnabled={autoWithdrawEnabled}
        autoWithdrawThreshold={autoWithdrawThreshold}
        monthlyGoal={monthlyGoal}
        walletId={wallet?.id || ''}
        hasWithdrawalAccount={hasWithdrawalAccount}
        canWithdraw={canWithdraw}
        methodLabel={methodLabel}
        withdrawalMethod={store.withdrawal_method ?? 'wave'}
        withdrawalNumber={store.withdrawal_number ?? ''}
        withdrawalName={store.withdrawal_name ?? ''}
        storeId={store.id}
      />
    </div>
  )
}
