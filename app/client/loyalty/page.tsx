import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { Trophy, Sparkles, Star, History, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export const metadata = {
  title: 'Points & Récompenses | Yayyam'
}

export default async function LoyaltyPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient()
  const { data: userProfile } = await supabaseAdmin.from('User').select('phone').eq('id', user.id).single()

  const phone = userProfile?.phone
  if (!phone) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 pt-8">
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-gray-100">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Configurez votre numéro</h2>
          <p className="text-gray-500">Pour cumuler des points de fidélité, vous devez d'abord configurer votre numéro de téléphone dans les paramètres de votre compte.</p>
        </div>
      </div>
    )
  }

  const cleanPhone = phone.replace(/\s+/g, '')
  const account = await prisma.loyaltyAccount.findUnique({
    where: { phone: cleanPhone },
    include: {
      transactions: {
        orderBy: { created_at: 'desc' },
        take: 30,
        include: { store: { select: { name: true } } }
      }
    }
  })

  // S'il n'a pas encore de points
  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 pt-8">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[2rem] p-10 text-center shadow-sm border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Programme de Fidélité</h2>
            <p className="text-lg text-gray-600 max-w-lg mb-8 leading-relaxed">
              Vos futurs achats chez nos marchands partenaires vous rapporteront des points. Économisez sur vos prochaines commandes sur tout Yayyam !
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl bg-white/60 p-4 rounded-3xl backdrop-blur-xl border border-white">
              <div className="text-center p-4">
                <span className="block text-2xl mb-2">🛒</span>
                <p className="font-bold text-gray-900 text-sm">Achetez</p>
                <p className="text-xs text-gray-500 mt-1">Commandez chez les vendeurs</p>
              </div>
              <div className="text-center p-4">
                 <span className="block text-2xl mb-2">⭐</span>
                 <p className="font-bold text-gray-900 text-sm">Cumulez</p>
                 <p className="text-xs text-gray-500 mt-1">Gagnez des points automatiques</p>
              </div>
              <div className="text-center p-4">
                 <span className="block text-2xl mb-2">💰</span>
                 <p className="font-bold text-gray-900 text-sm">Économisez</p>
                 <p className="text-xs text-gray-500 mt-1">Réduisez le prix de vos paniers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'diamond': return <Sparkles size={24} className="text-blue-500" />
      case 'gold': return <Star size={24} className="text-yellow-500" />
      case 'silver': return <Star size={24} className="text-gray-400" />
      default: return <Trophy size={24} className="text-orange-600" />
    }
  }

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'diamond': return 'from-blue-500 to-cyan-400 shadow-blue-500/20'
      case 'gold': return 'from-yellow-400 to-orange-500 shadow-orange-500/20'
      case 'silver': return 'from-gray-300 to-gray-500 shadow-gray-500/20'
      default: return 'from-orange-400 to-red-500 shadow-orange-500/20'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
      
      {/* ── HEADER BANNERS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Solde actuel */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-green-500/10 transition-colors duration-500" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-black tracking-widest text-gray-400 uppercase mb-2">Votre Solde de Points</p>
              <h2 className="text-5xl font-black text-gray-900 tracking-tight">
                {account.balance.toLocaleString('fr-FR')} <span className="text-2xl text-green-500 font-bold ml-1">pts</span>
              </h2>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-gray-500">
            <span>Points gagnés à vie : <span className="text-gray-900 font-bold">{account.total_earned.toLocaleString('fr-FR')}</span></span>
          </div>
        </div>

        {/* Niveau actuel */}
        <div className={`rounded-[2rem] p-8 shadow-lg relative overflow-hidden bg-gradient-to-br ${getTierColor(account.tier)} text-white`}>
          <div className="absolute top-0 right-0 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-black tracking-widest text-white/60 uppercase mb-2">Votre Niveau</p>
              <h2 className="text-4xl font-black tracking-tight capitalize">
                {account.tier}
              </h2>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center">
              {getTierIcon(account.tier)}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/20 relative z-10">
            <p className="text-sm font-bold text-white/90">
              {account.tier === 'bronze' && "Gagnez 500 points pour passer SILVER !"}
              {account.tier === 'silver' && "Gagnez 2000 points pour passer GOLD ! (Multiplicateur x1.1)"}
              {account.tier === 'gold' && "Gagnez 5000 points pour passer DIAMOND ! (Multiplicateur x1.25)"}
              {account.tier === 'diamond' && "Félicitations, vous êtes au niveau maximum ! (Multiplicateur x1.5)"}
            </p>
          </div>
        </div>

      </div>

      {/* ── TRANSACTION HISTORY ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
            <History size={20} />
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Historique des points</h3>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          {account.transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">
              Aucune transaction pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {account.transactions.map((tx: { id: string, type: string, description: string, created_at: Date, points: number, store: { name: string } | null }) => (
                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.points > 0 ? 'bg-green-50 text-green-600' : 
                      tx.type === 'bonus' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {tx.points > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {tx.store && <span className="ml-2 inline-flex items-center text-gray-400">• <span className="ml-1 font-bold text-gray-600">{tx.store.name}</span></span>}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-black ${tx.points > 0 ? 'text-green-500' : 'text-gray-900'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
