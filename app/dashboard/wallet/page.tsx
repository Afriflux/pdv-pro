import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WithdrawForm from './WithdrawForm'
import { DepositModal } from '@/components/dashboard/DepositModal'
import { WalletDashboardClient, TransactionRow } from './WalletDashboardClient'
import { AutoWithdrawSettings } from './AutoWithdrawSettings'

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
      .select('id, created_at, vendor_amount, status, buyer_name')
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
      status: o.status,
      label: o.buyer_name || 'Client Inconnu'
    })),
    ...recentWithdrawals.map((w: any) => ({
      id: w.id,
      type: 'withdrawal' as const,
      created_at: w.requested_at,
      amount: Number(w.amount),
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
        
        <div className="relative z-10 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
          <DepositModal />
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

      {/* ── Layout en 2 colonnes (Pleine largeur) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── Colonne Gauche Interactive (Stats, Graphique & Transactions) ── */}
        <WalletDashboardClient 
          balance={balance}
          pending={pending}
          totalEarned={totalEarned}
          initialTransactions={transactions}
          autoWithdrawEnabled={autoWithdrawEnabled}
          autoWithdrawThreshold={autoWithdrawThreshold}
          monthlyGoal={monthlyGoal}
          walletId={wallet?.id || ''}
        />

        {/* ── Colonne Droite (Actions de Retrait) ── */}
        <div className="lg:col-span-4 space-y-6 lg:sticky top-6">
          
          {/* Composant de paramétrage de retraits automatisés */}
          {hasWithdrawalAccount && (
            <AutoWithdrawSettings 
              walletId={wallet?.id || ''}
              initialEnabled={autoWithdrawEnabled}
              initialThreshold={autoWithdrawThreshold}
            />
          )}

          {/* Compte de retrait (readonly) */}
          {hasWithdrawalAccount && (
            <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full pointer-events-none blur-xl group-hover:bg-white/10 transition-colors duration-500" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <p className="text-sm font-bold text-white/90">Compte de retrait</p>
                </div>
                <Link
                  href="/dashboard/settings#retrait"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-inner"
                  title="Modifier"
                >
                  <span className="text-[11px]">✏️</span>
                </Link>
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Opérateur</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-white/10 flex items-center justify-center text-sm shadow-inner backdrop-blur-sm overflow-hidden">
                      {store.withdrawal_method === 'wave' ? (
                        <img src="/wave.svg" alt="Wave" className="w-full h-full object-cover" />
                      ) : store.withdrawal_method === 'orange_money' ? (
                        <img src="/orange-money.svg" alt="Orange Money" className="w-full h-full object-cover bg-orange-500" />
                      ) : (
                        '🏦'
                      )}
                    </div>
                    <p className="text-base font-black">{methodLabel}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Numéro de réception</p>
                  <p className="text-lg font-mono tracking-widest text-[#FFF] opacity-95">{store.withdrawal_number}</p>
                </div>

                {store.withdrawal_name && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Bénéficiaire</p>
                    <p className="text-sm font-bold truncate text-white/80">{store.withdrawal_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section retrait (Formulaire) */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-black text-[#1A1A1A] flex items-center gap-2">
                <span className="text-lg">💸</span> Demander un retrait
              </h2>
              <p className="text-xs text-[#0F7A60] font-bold mt-1.5 bg-[#0F7A60]/10 inline-block px-2.5 py-1 rounded-lg">
                ⚡ Minimum : {formatAmount(5000)} · Traitement instantané
              </p>
            </div>

            {canWithdraw ? (
              <WithdrawForm
                balance={balance}
                withdrawalMethod={store.withdrawal_method ?? 'wave'}
                withdrawalNumber={store.withdrawal_number ?? ''}
                withdrawalName={store.withdrawal_name ?? ''}
                storeId={store.id}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-[#FAFAF7] rounded-2xl p-5 text-center border border-gray-50">
                  {!hasWithdrawalAccount ? (
                    <div className="space-y-3">
                      <span className="text-2xl">⚙️</span>
                      <p className="text-sm font-bold text-gray-600">Configuration requise</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                        Ajoutez un moyen de retrait pour débloquer cette section.
                      </p>
                      <Link href="/dashboard/settings#retrait" className="inline-flex items-center justify-center mt-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm">
                        Paramètres →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 py-3">
                      <span className="text-2xl">🔒</span>
                      <p className="text-sm font-bold text-gray-600">Solde insuffisant</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Il vous manque <strong className="text-gray-600 font-bold">{formatAmount(5000 - balance)}</strong> pour atteindre le seuil de retrait.
                      </p>
                    </div>
                  )}
                </div>
                <button
                  disabled
                  className="w-full py-4 text-sm font-bold text-white bg-gray-200 rounded-xl cursor-not-allowed transition-colors"
                >
                  Demander un retrait
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
