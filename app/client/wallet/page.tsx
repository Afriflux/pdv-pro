import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { UniversalWallet } from '@/components/shared/wallet/UniversalWallet'

export const metadata = {
  title: 'Mon Portefeuille | Espace Client',
}

export default async function ClientWalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  
  const { data: profile } = await supabaseAdmin
    .from('User')
    .select('id, client_wallet_balance, client_payment_method, client_payment_number, name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 animate-in fade-in duration-500">
      {/* ── En-tête (Style Harmonisé) ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white shadow-2xl shadow-[#0F7A60]/5 sticky top-2 z-20 overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-[#0A5240] text-white flex items-center justify-center shadow-lg shadow-[#0F7A60]/20 shrink-0">
            <span className="text-2xl md:text-3xl">👝</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">Mon Portefeuille Acheteur</h1>
            <p className="text-dust text-sm md:text-base font-medium mt-1">
              Gérez votre solde de remboursement et de cashback.
            </p>
          </div>
        </div>
      </header>

      <UniversalWallet 
        ownerType="client"
        ownerId={profile.id}
        balance={Number(profile.client_wallet_balance) || 0}
        pending={0}
        totalEarned={Number(profile.client_wallet_balance) || 0} // Total cashback earned roughly equates balance for now
        monthlyGoal={50000} // Gamification goal for clients
        transactions={[]} // Can fetch real cashback history later
        hasWithdrawalAccount={!!profile.client_payment_number}
        withdrawalMethod={profile.client_payment_method || 'wave'}
        withdrawalNumber={profile.client_payment_number || ''}
        vocab={{
          title: 'Actions Rapides',
          balance: 'Solde Cashback',
          earned: 'Total Cashback',
          pending: 'En attente',
          chartTitle: 'Évolution du Cashback',
          chartSubtitle: 'Vos remises obtenues',
          txLabel: 'Historique des bonus'
        }}
        kycStatus="verified" // Clients usually don't need KYC to withdraw cashback or use it. We set 'verified' to allow withdrawal to phone number.
      />
    </div>
  )
}
