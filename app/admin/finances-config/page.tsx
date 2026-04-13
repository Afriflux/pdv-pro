import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getPlatformConfig } from '@/lib/admin/adminActions'
import FinancesSection from '../settings/FinancesSection'
import { Landmark, Wallet as WalletIcon, TrendingUp, HandCoins } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FinancesConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // -- Récupération du Wallet Platforme (Super Admin) --
  const adminStore = await prisma.store.findFirst({
    where: { user_id: user.id }
  })
  
  let platformBalance = 0
  let platformTotalEarned = 0
  let platformPending = 0

  if (adminStore) {
    const adminWallet = await prisma.wallet.findUnique({
      where: { vendor_id: adminStore.id }
    })
    if (adminWallet) {
      platformBalance = adminWallet.balance
      platformTotalEarned = adminWallet.total_earned
      platformPending = adminWallet.pending
    }
  }

  const financialConfig = await getPlatformConfig()

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <header className="w-full bg-gradient-to-r from-[#012928] to-[#0A4138] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        {/* Motif Glassmorphism de fond */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-amber-400 shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Landmark className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Finances & Commissions</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-xl">
                Gérez les taux de la plateforme, les frais fixes et supervisez la Trésorerie Centrale (Wallet Plateforme).
              </p>
            </div>
          </div>
        </div>

        {/* ── KPIs OVERLAY: WALLET PLATEFORME ── */}
        <div className="relative z-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><WalletIcon className="w-3.5 h-3.5" /> Solde Central</span>
              <span className="text-2xl font-black text-white">{platformBalance.toLocaleString('fr-FR')} <span className="text-sm font-bold text-emerald-100/50">CFA</span></span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 lg:p-5 flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <div className="flex flex-col">
              <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Chiffre d'Affaires Global</span>
              <span className="text-2xl font-black text-amber-400">{platformTotalEarned.toLocaleString('fr-FR')} <span className="text-sm font-bold text-amber-400/50">CFA</span></span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 lg:p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-emerald-100/70 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><HandCoins className="w-3.5 h-3.5" /> En attente de déblocage</span>
              <span className="text-2xl font-black text-white/80">{platformPending.toLocaleString('fr-FR')} <span className="text-sm font-bold text-white/30">CFA</span></span>
            </div>
          </div>

        </div>
      </header>

      {/* ── ZONE DE CONTENU ── */}
      <div className="flex flex-col items-start gap-6 w-full max-w-7xl mx-auto relative z-20 px-6 lg:px-10 -mt-8 pb-20">
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-black-[0.02] border border-gray-100 p-6 lg:p-8">
           <FinancesSection initialConfig={financialConfig} />
        </div>
      </div>

    </div>
  )
}
