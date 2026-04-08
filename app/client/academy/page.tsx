import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getMasterclassArticles } from '@/app/actions/masterclass'
import AcademyGrid from '@/app/dashboard/tips/AcademyGrid'
import { GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientAcademyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupération des articles ciblés "client" (Acheteur final)
  const dbArticles = await getMasterclassArticles(false, 'client')

  // Progression
  const completedProgresses = await prisma.masterclassProgress.findMany({
    where: { user_id: user.id },
    select: { article_id: true }
  })
  
  const completedIds = completedProgresses.map(p => p.article_id)
  
  const totalArticles = dbArticles.length
  const completedCount = completedIds.length
  const userProgress = totalArticles > 0 
    ? Math.round((completedCount / totalArticles) * 100) 
    : 0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 space-y-8 animate-fade-in pb-12 pt-8">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#052e22] to-[#0a1a15] px-8 py-12 rounded-[2rem] shadow-xl text-white">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <GraduationCap size={16} className="text-emerald" />
            <span className="text-white font-bold text-xs uppercase tracking-wider">Espace Apprentissage</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Formation & Ressources.
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
            Tirez le meilleur parti de vos achats en explorant nos formations exclusives qui vous aident à maîtriser et appliquer les connaissances acquises.
          </p>
          
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md max-w-sm">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">Votre Avancement</p>
                <p className="text-white font-black text-lg">{userProgress}% complété</p>
              </div>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-emerald rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, userProgress)}%` }}></div>
            </div>
            <p className="text-xs text-emerald/80 mt-3 font-bold">🎯 {completedCount} formation(s) sur {totalArticles} étudiées.</p>
          </div>
        </div>
      </div>

      <div className="px-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AcademyGrid articles={dbArticles as any} completedIds={completedIds} />
      </div>
    </div>
  )
}
