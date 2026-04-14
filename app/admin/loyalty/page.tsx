import { createAdminClient } from '@/lib/supabase/admin'
import { Gift, Star, Trophy, TrendingUp, Users, Zap, Crown, Target, Award, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import AmbassadorSettingsClient from './AmbassadorSettingsClient'

export const metadata = {
  title: 'Fidélité & Récompenses | Yayyam Admin',
}

export default async function LoyaltyPage() {
  const supabase = createAdminClient()

  // KPIs
  const [
    { count: totalBuyers },
    { count: totalOrders },
    { data: topBuyers },
  ] = await Promise.all([
    supabase.from('User').select('id', { count: 'exact', head: true }).eq('role', 'acheteur'),
    supabase.from('Order').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'delivered', 'completed']),
    supabase.from('Order')
      .select('buyer_id, buyer_name')
      .in('status', ['confirmed', 'delivered', 'completed'])
      .limit(500),
  ])

  // Fetch Config for Ambassador
  const { data: configs } = await supabase.from('PlatformConfig').select('key, value').in('key', [
    'ambassador_reward_client',
    'ambassador_reward_pro',
    'ambassador_require_purchase',
    'ambassador_active'
  ])

  const getConfig = (key: string, def: string) => configs?.find(c => c.key === key)?.value || def

  const initialConfig = {
    ambassador_reward_client: getConfig('ambassador_reward_client', '500'),
    ambassador_reward_pro: getConfig('ambassador_reward_pro', '1000'),
    ambassador_require_purchase: getConfig('ambassador_require_purchase', 'true'),
    ambassador_active: getConfig('ambassador_active', 'false'),
  }

  // Calculate top buyers
  const buyerCounts: Record<string, { name: string; count: number }> = {}
  for (const order of (topBuyers ?? [])) {
    if (!order.buyer_id) continue
    if (!buyerCounts[order.buyer_id]) {
      buyerCounts[order.buyer_id] = { name: order.buyer_name || 'Client', count: 0 }
    }
    buyerCounts[order.buyer_id].count++
  }
  const topBuyersList = Object.entries(buyerCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  const repeatBuyers = Object.values(buyerCounts).filter(b => b.count >= 2).length
  const loyaltyRate = (totalBuyers ?? 0) > 0 ? Math.round((repeatBuyers / (totalBuyers ?? 1)) * 100) : 0

  const tiers = [
    { name: 'Bronze', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', condition: '1–2 commandes', reward: 'Badge Bronze + 5% sur prochaine commande' },
    { name: 'Argent', icon: Award, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', condition: '3–5 commandes', reward: 'Badge Argent + Livraison gratuite' },
    { name: 'Or', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', condition: '6–10 commandes', reward: 'Badge Or + 10% permanent' },
    { name: 'Diamant', icon: Trophy, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', condition: '11+ commandes', reward: 'Badge Diamant + Accès VIP + 15%' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Gift className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Fidélité & Récompenses</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                Programme de fidélisation Yayyam — Vos meilleurs clients récompensés.
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="relative z-10 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Clients totaux', value: totalBuyers ?? 0, color: 'text-white', icon: Users },
            { label: 'Commandes', value: totalOrders ?? 0, color: 'text-emerald-300', icon: TrendingUp },
            { label: 'Clients fidèles (2+)', value: repeatBuyers, color: 'text-amber-300', icon: Star },
            { label: 'Taux fidélité', value: `${loyaltyRate}%`, color: 'text-cyan-300', icon: Target },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={14} className="text-white/40" />
                <span className="text-white/50 text-xs font-black uppercase tracking-widest">{kpi.label}</span>
              </div>
              <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="px-6 lg:px-10 -mt-16 pb-20 relative z-20">
        
        {/* Paramètres d'Acquisition (Ambassadeurs) */}
        <AmbassadorSettingsClient initialConfig={initialConfig} />

        {/* Loyalty Tiers */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" /> Programme de Fidélité — Paliers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map(tier => (
              <div key={tier.name} className={`rounded-2xl p-6 border-2 ${tier.border} ${tier.bg} relative overflow-hidden`}>
                <div className="absolute -top-4 -right-4 opacity-10">
                  <tier.icon size={80} />
                </div>
                <div className="relative z-10">
                  <tier.icon size={28} className={tier.color} />
                  <h3 className={`text-xl font-black mt-3 ${tier.color}`}>{tier.name}</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1">{tier.condition}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <p className="text-xs text-gray-600 font-medium">{tier.reward}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center font-bold">
            ⚙️ Les récompenses automatiques seront activées dans une prochaine mise à jour. Les paliers sont calculés en temps réel.
          </p>
        </div>

        {/* Top Buyers Leaderboard */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> Top 10 — Clients les plus fidèles
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF7]">
                  <th className="text-left px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="text-center px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Commandes</th>
                  <th className="text-center px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Palier</th>
                </tr>
              </thead>
              <tbody>
                {topBuyersList.map(([id, buyer], idx) => {
                  const tier = buyer.count >= 11 ? '💎 Diamant' : buyer.count >= 6 ? '🥇 Or' : buyer.count >= 3 ? '🥈 Argent' : '🥉 Bronze'
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                      <td className="px-8 py-4 font-black text-gray-300">{idx + 1}</td>
                      <td className="px-4 py-4 font-bold text-gray-900">{buyer.name}</td>
                      <td className="px-4 py-4 text-center font-black text-emerald-700">{buyer.count}</td>
                      <td className="px-4 py-4 text-center text-sm">{tier}</td>
                    </tr>
                  )
                })}
                {topBuyersList.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400 font-bold">Aucune donnée de commande encore</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
