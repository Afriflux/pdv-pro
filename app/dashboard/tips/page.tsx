// app/dashboard/tips/page.tsx
// Server Component statique — Articles & Guides pour vendeurs Yayyam

import AcademyGrid from './AcademyGrid'
import TipsClient from './TipsClient'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getMasterclassArticles } from '@/app/actions/masterclass'

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function TipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    include: { subscriptions: { orderBy: { created_at: 'desc' }, take: 1 }, wallet: true }
  })
  const isPro = store?.subscriptions?.[0]?.plan === 'pro'
  
  // Récupération des articles depuis la BDD filtrés pour les vendeurs
  const dbArticles = await getMasterclassArticles(false, 'vendor')

  // Simulation de la progression pour la gamification remplacée par les vraies stats
  const completedProgresses = await prisma.masterclassProgress.findMany({ take: 50, 
    where: { user_id: user.id },
    select: { article_id: true }
  })
  const completedIds = completedProgresses.map(p => p.article_id)

  const assetPurchases = await prisma.assetPurchase.findMany({ take: 50, 
    where: { store_id: store?.id, asset_type: 'MASTERCLASS' },
    select: { asset_id: true }
  })
  const purchasedAssetIds = assetPurchases.map(a => a.asset_id)
  
  const totalArticles = dbArticles.length
  const completedCount = completedIds.length
  const userProgress = totalArticles > 0 
    ? Math.round((completedCount / totalArticles) * 100) 
    : 0;
    
  let badgeTitle = "Novice"
  if (userProgress >= 25) badgeTitle = "Apprenti"
  if (userProgress >= 50) badgeTitle = "Vendeur Sérieux"
  if (userProgress >= 80) badgeTitle = "Général COD"
  if (userProgress === 100) badgeTitle = "Yayyam Master"

  return (
    <div className="w-full bg-[#FAFAF7] min-h-screen">

      {/* ── HERO BANNER PREMIUM ── */}
      <div className="relative overflow-hidden bg-[#0A0A0A] px-6 py-12 md:py-16 mb-8 mt-2 mx-4 sm:mx-8 rounded-[2rem] shadow-xl">
        {/* Décors d'arrière-plan */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#0F7A60]/30 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gold/20 to-transparent rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative max-w-5xl mx-auto z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
              <span className="text-gold font-bold text-xs">✨ Yayyam Académie</span>
            </div>
            <h1 className="text-xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-4">
              Devenez un maître de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">vente en ligne.</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
              Découvrez les stratégies exactes utilisées par le top 1% des vendeurs en Afrique. Des guides ultra-actionnables, des astuces secrètes et des techniques qui ont fait leurs preuves.
            </p>
            
            {/* Gamification Progress */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Votre Niveau</p>
                  <p className="text-white font-black text-lg">{badgeTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-black">{Math.min(100, userProgress)}%</p>
                </div>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <style>{`.dynamic-progress-bar { width: ${Math.min(100, userProgress)}%; }`}</style>
                <div className="h-full bg-gradient-to-r from-[#0F7A60] to-emerald-400 rounded-full transition-all duration-1000 dynamic-progress-bar"></div>
              </div>
              {userProgress < 100 ? (
                <p className="text-xs text-gray-500 mt-3">🎯 Lisez encore {Math.max(0, totalArticles - completedCount)} guides pour devenir un <strong className="text-gray-300">Maître Vendeur</strong>.</p>
              ) : (
                <p className="text-xs text-emerald-400 mt-3 font-bold">🎉 Félicitations ! Vous avez le niveau d'un Top 1% vendeur en Afrique.</p>
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4 min-w-[300px]">
            {/* Stats widgets */}
            <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4 transform rotate-2 hover:rotate-0 transition-all cursor-default">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">📈</div>
              <div>
                <p className="text-white font-black text-xl">+47%</p>
                <p className="text-xs text-gray-400 font-medium">De CA en appliquant nos méthodes</p>
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4 transform -rotate-2 hover:rotate-0 transition-all cursor-default translate-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">👥</div>
              <div>
                <p className="text-white font-black text-xl">1 200+</p>
                <p className="text-xs text-gray-400 font-medium">Vendeurs formés ce mois-ci</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 pb-20 space-y-10">
        
        {/* SECTION: MASTERCLASS GRID (Remontée en haut !) */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-8 ml-2">
            <div className="w-2 h-6 rounded-full bg-gold"></div>
            <h2 className="text-xl font-black text-ink">La Bibliothèque Masterclass</h2>
          </div>
          <AcademyGrid 
            articles={dbArticles as any} 
            completedIds={completedIds} 
            purchasedAssetIds={purchasedAssetIds} 
            wallet={store?.wallet || { balance: 0, total_earned: 0 }}
          />
        </div>

        {/* SECTION: ALERTS & NEWS (TipsClient) (Descendue) */}
        <div className="pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-6 ml-2">
            <div className="w-2 h-6 rounded-full bg-[#0F7A60]"></div>
            <h2 className="text-xl font-black text-ink">Alertes & Nouveautés</h2>
          </div>
          <TipsClient userId={user.id} isPro={isPro} />
        </div>

        {/* Footer CTA */}
        <div className="bg-[#0F7A60] rounded-2xl p-6 text-center space-y-3">
          <p className="text-2xl">🚀</p>
          <p className="font-black text-white text-lg">Prêt à passer à l&apos;action ?</p>
          <p className="text-sm text-white/80">
            Rejoignez la communauté Yayyam et échangez avec d&apos;autres vendeurs
            qui appliquent ces stratégies chaque jour.
          </p>
          <a
            href="/dashboard/communautes"
            className="inline-flex items-center gap-2 bg-white text-[#0F7A60] font-black text-sm
              px-5 py-2.5 rounded-xl hover:bg-[#FAFAF7] transition-all shadow-sm"
          >
            Rejoindre la communauté →
          </a>
        </div>

      </div>
    </div>
  )
}
