import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MessageSquareHeart, Star, AlertTriangle, MessageCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NpsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  // Find all buyers of this store
  const storeOrders = await prisma.order.findMany({
    where: { store_id: store.id },
    select: { buyer_id: true }
  })
  
  const buyerIds = storeOrders.map(o => o.buyer_id).filter(Boolean) as string[]

  const npsResponses = await prisma.npsResponse.findMany({ take: 100,
    where: {
      user_id: { in: buyerIds }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  // Calculate NPS Score: % Promoters (9-10) - % Detractors (0-6)
  const total = npsResponses.length
  const promoters = npsResponses.filter(r => r.score >= 9).length
  const passives = npsResponses.filter(r => r.score >= 7 && r.score <= 8).length
  const detractors = npsResponses.filter(r => r.score <= 6).length

  const npsScore = total > 0 ? Math.round(((promoters / total) - (detractors / total)) * 100) : 0

  return (
    <div className="w-full relative z-10 px-6 lg:px-10 pb-20">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[1.2rem] text-white shadow-lg border border-white">
               <MessageSquareHeart size={28} />
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Satisfaction NPS</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">
                Net Promoter Score : Avis de vos Clients, Closers et Affiliés en temps réel.
              </p>
            </div>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
             <p className="text-xs font-black uppercase tracking-widest text-gray-400">Score NPS</p>
             <p className={`font-display font-black text-4xl mt-2 ${npsScore > 40 ? 'text-green-500' : npsScore > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
               {npsScore > 0 ? '+' : ''}{npsScore}
             </p>
           </div>
           
           <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 flex flex-col justify-between">
             <p className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center gap-2"><Star size={14}/> Promoteurs</p>
             <p className="font-display font-black text-3xl text-green-700 mt-2">{promoters}</p>
             <p className="text-xs font-bold text-green-600/60 mt-1">Score 9-10</p>
           </div>

           <div className="bg-yellow-50/50 p-6 rounded-[2rem] border border-yellow-100 flex flex-col justify-between">
             <p className="text-xs font-black uppercase tracking-widest text-yellow-600 flex items-center gap-2"><MessageCircle size={14}/> Passifs</p>
             <p className="font-display font-black text-3xl text-yellow-700 mt-2">{passives}</p>
             <p className="text-xs font-bold text-yellow-600/60 mt-1">Score 7-8</p>
           </div>

           <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 flex flex-col justify-between">
             <p className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2"><AlertTriangle size={14}/> Détracteurs</p>
             <p className="font-display font-black text-3xl text-red-700 mt-2">{detractors}</p>
             <p className="text-xs font-bold text-red-600/60 mt-1">Score 0-6</p>
           </div>
        </div>

        {/* REVIEWS GRID */}
        {npsResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border border-gray-100 text-center">
            <MessageSquareHeart size={48} className="text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Aucun retour NPS</h2>
            <p className="text-gray-500 mt-2 max-w-md">Envoyez des campagnes NPS à vos clients après livraison ou à vos affiliés pour collecter leurs avis et recommandations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {npsResponses.map(nps => {
              const isPromoter = nps.score >= 9
              const isPassive = nps.score >= 7 && nps.score <= 8
              
              const colorCls = isPromoter ? 'bg-green-50 border-green-100 text-green-700' : isPassive ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 'bg-red-50 border-red-100 text-red-700'
              const name = nps.user?.name || 'Anonyme'
              const role = nps.user?.role || 'Acheteur'
              
              return (
                <div key={nps.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                       <p className="font-bold text-gray-900">{name}</p>
                       <p className="text-xs font-black text-gray-400 tracking-wider uppercase mt-0.5">{role}</p>
                    </div>
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl border ${colorCls}`}>
                      {nps.score}
                    </div>
                  </div>
                  
                  {nps.comment && (
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 italic border border-gray-100">
                      "{nps.comment}"
                    </div>
                  )}

                  <p className="text-xs text-gray-400 font-medium">
                    Soumis le {new Date(nps.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
