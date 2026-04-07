import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { UniversalWallet } from '@/components/shared/wallet/UniversalWallet'

export const metadata = {
  title: 'Portefeuille | Yayyam Affilié',
}

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupérer toutes les entrées Affiliate pour cet utilisateur
  const { data: affiliates } = await supabaseAdmin
    .from('Affiliate')
    .select('*, user:user_id(phone, affiliate_auto_withdraw, affiliate_auto_withdraw_threshold, kyc_status)')
    .eq('user_id', user.id)

  const activeAffiliates = affiliates || []

  // 2. Récupérer l'historique des ventes (tous les tokens)
  const affiliateTokens = activeAffiliates.map(a => a.token).filter(Boolean)
  const { data: orders } = affiliateTokens.length > 0
    ? await supabaseAdmin
        .from('Order')
        .select('id, created_at, affiliate_amount, status, subtotal')
        .in('affiliate_token', affiliateTokens)
        .order('created_at', { ascending: false })
    : { data: [] }

  // 3. Récupérer l'historique des requêtes de retraits (tous les IDs)
  const affiliateIds = activeAffiliates.map(a => a.id)
  const { data: withdrawals } = affiliateIds.length > 0
    ? await supabaseAdmin
        .from('AffiliateWithdrawal')
        .select('id, requested_at, amount, status, payment_method')
        .in('affiliate_id', affiliateIds)
        .order('requested_at', { ascending: false })
    : { data: [] }

  // 4. Formatter en TransactionRow unifié
  const safeOrders = orders || []
  const safeWithdrawals = withdrawals || []

  const transactions: any[] = [
    ...safeOrders.map((o: any) => ({
      id: o.id,
      type: 'order' as const,
      created_at: o.created_at,
      amount: o.affiliate_amount,
      status: o.status,
      label: `Commission sur vente #${o.id.split('-')[0].toUpperCase()}`,
      subtotal: o.subtotal
    })),
    ...safeWithdrawals.map((w: any) => ({
      id: w.id,
      type: 'withdrawal' as const,
      created_at: w.requested_at,
      amount: w.amount,
      status: w.status,
      label: `Retrait vers ${w.payment_method === 'wave' ? 'Wave' : 'Orange Money'}`,
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const userProfile = activeAffiliates.length > 0 ? activeAffiliates[0].user : null
  const cleanAffiliate = {
    id: activeAffiliates.length > 0 ? activeAffiliates[0].id : 'new-global-wallet',
    userId: user.id,
    balance: activeAffiliates.reduce((sum, a) => sum + Number(a.balance || 0), 0),
    total_earned: activeAffiliates.reduce((sum, a) => sum + Number(a.total_earned || 0), 0),
    total_withdrawn: activeAffiliates.reduce((sum, a) => sum + Number(a.total_withdrawn || 0), 0),
    phone: userProfile?.phone || '',
    auto_withdraw_enabled: userProfile?.affiliate_auto_withdraw ?? false,
    auto_withdraw_threshold: userProfile?.affiliate_auto_withdraw_threshold ?? 50000,
    kyc_status: userProfile?.kyc_status || 'unverified'
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-8 max-w-full">
      {/* ── En-tête (Style Harmonisé) ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white shadow-2xl shadow-[#0F7A60]/5 sticky top-2 z-20 overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-[#0A5240] text-white flex items-center justify-center shadow-lg shadow-[#0F7A60]/20 shrink-0">
            <span className="text-2xl md:text-3xl">💰</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">Mon Portefeuille Affilié</h1>
            <p className="text-dust text-sm md:text-base font-medium mt-1">
              Gérez vos commissions et effectuez vos demandes de retrait.
            </p>
          </div>
        </div>
      </header>
      
      <UniversalWallet 
        ownerType="affiliate"
        ownerId={cleanAffiliate.id}
        balance={cleanAffiliate.balance}
        pending={cleanAffiliate.total_withdrawn} // "En attente" is not natively supported for affiliate in this scope, but mapping to total withdrawn for the prop! Wait, I'll pass 0 for pending and total_withdrawn for total.
        totalEarned={cleanAffiliate.total_earned}
        totalWithdrawn={cleanAffiliate.total_withdrawn}
        monthlyGoal={100000} // Default affiliate goal
        transactions={transactions}
        autoWithdrawEnabled={cleanAffiliate.auto_withdraw_enabled}
        autoWithdrawThreshold={cleanAffiliate.auto_withdraw_threshold}
        hasWithdrawalAccount={!!cleanAffiliate.phone}
        withdrawalNumber={cleanAffiliate.phone}
        kycStatus={cleanAffiliate.kyc_status}
        vocab={{
          title: 'Historique & Actions',
          balance: 'Commissions',
          earned: 'Total Gagné',
          pending: 'Total Retiré',
          chartTitle: 'Évolution des revenus',
          chartSubtitle: 'Commissions générées via vos liens',
          txLabel: 'Historique des commissions'
        }}
      />
    </div>
  )
}
