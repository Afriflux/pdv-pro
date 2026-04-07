import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalWallet } from '@/components/shared/wallet/UniversalWallet'

export const dynamic = 'force-dynamic'

export default async function CloserWalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Récupération des leads closés et de leurs commissions
  const closedLeads = await prisma.lead.findMany({
    where: {
      closer_id: user.id,
      status: 'won',
    },
    include: {
      Store: { select: { name: true } },
      Product: { select: { name: true, price: true } }
    },
    orderBy: {
      closed_at: 'desc'
    }
  })

  // Get user profile for withdrawal details
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      withdrawal_method: true,
      withdrawal_number: true,
      withdrawal_name: true,
      name: true,
      closer_auto_withdraw: true,
      closer_auto_withdraw_threshold: true,
      kyc_status: true
    }
  })

  const totalEarned = closedLeads.reduce((acc, lead) => {
    return acc + (lead.commission_amount || ((lead.Product?.price || 0) * 0.1))
  }, 0)

  // Calcule dynamiquement le solde en déduisant les retraits Closers (CloserWithdrawal)
  const withdrawals = await prisma.closerWithdrawal.findMany({
    where: { closer_id: user.id }
  })
  
  const totalWithdrawn = withdrawals.reduce((acc, w) => {
    if (w.status === 'paid' || w.status === 'pending' || w.status === 'processing') return acc + w.amount
    return acc
  }, 0)
  
  // Update Real Balance
  const balance = Math.max(0, totalEarned - totalWithdrawn)
  
  const pending = withdrawals.reduce((acc, w) => {
    if (w.status === 'pending' || w.status === 'processing') return acc + w.amount
    return acc
  }, 0)

  // Map withdrawals to transactions array for the UI
  const withdrawalTransactions = withdrawals.map(w => ({
    id: w.id,
    type: 'withdrawal' as const,
    created_at: w.requested_at.toISOString(),
    amount: w.amount,
    status: w.status,
    label: `Retrait ${w.payment_method} (${w.phone || ''})`,
  }))
  
  // Total ce mois-ci
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const transactions = [
    ...closedLeads.map(lead => ({
      id: lead.id,
      type: 'order' as const,
      created_at: lead.closed_at ? lead.closed_at.toISOString() : (lead.updated_at?.toISOString() || new Date().toISOString()),
      amount: lead.commission_amount || ((lead.Product?.price || 0) * 0.1),
      status: 'paid',
      label: `Closing: ${lead.Store?.name || lead.name}`,
    })),
    ...withdrawalTransactions
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="w-full space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-12 max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      {/* ── En-tête (Style Harmonisé) ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white shadow-2xl shadow-[#0F7A60]/5 sticky top-2 z-20 overflow-hidden group mb-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-[#0A5240] text-white flex items-center justify-center shadow-lg shadow-[#0F7A60]/20 shrink-0">
            <span className="text-2xl md:text-3xl">💰</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">Mon Portefeuille Closer</h1>
            <p className="text-dust text-sm md:text-base font-medium mt-1">
              Gérez vos commissions de closing et vos retraits.
            </p>
          </div>
        </div>
      </header>

      <UniversalWallet 
        ownerType="closer"
        ownerId={user.id}
        balance={balance}
        pending={pending}
        totalEarned={totalEarned}
        transactions={transactions}
        autoWithdrawEnabled={profile?.closer_auto_withdraw ?? false}
        autoWithdrawThreshold={profile?.closer_auto_withdraw_threshold ?? 50000}
        monthlyGoal={1000000}
        hasWithdrawalAccount={!!profile?.withdrawal_number}
        withdrawalMethod={profile?.withdrawal_method || 'wave'}
        withdrawalNumber={profile?.withdrawal_number || ''}
        kycStatus={profile?.kyc_status || 'unverified'}
        vocab={{
          title: 'Actions & Configuration',
          balance: 'Commissions Dispo.',
          earned: 'Total Gagné',
          pending: 'En attente',
          chartTitle: 'Vos Performances de Closing',
          chartSubtitle: 'Commissions validées',
          txLabel: 'Historique de commissionnement'
        }}
      />
    </div>
  )
}
