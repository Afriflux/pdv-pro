import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SmartReviewsClient } from './SmartReviewsClient'
import { revalidatePath } from 'next/cache'

export const metadata = {
  title: 'Avis 5 Étoiles | Yayyam',
}

export default async function SmartReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, smart_reviews_active: true }
  })

  if (!store) redirect('/dashboard')

  // Récupération des avis existants
  const recentReviews = await prisma.review.findMany({
    where: { store_id: store.id },
    take: 10,
    orderBy: { created_at: 'desc' }
  })

  const toggleSmartReviews = async (active: boolean) => {
    'use server'
    await prisma.store.update({
      where: { id: store.id },
      data: { smart_reviews_active: active }
    })
    revalidatePath('/dashboard/smart-reviews')
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-amber-500 shadow-[0_8px_30px_rgb(245,158,11,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent tracking-tight">Avis Automatisés</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Collectez des avis 5 étoiles en pilote automatique avec le bot WhatsApp.</p>
            </div>
          </div>
        </header>

        <main className="w-full relative z-10 px-6 lg:px-10 pb-20">
          <SmartReviewsClient 
            initialActive={store.smart_reviews_active} 
            recentReviews={recentReviews as any}
            onToggle={toggleSmartReviews}
          />
        </main>
      </div>
    </div>
  )
}
