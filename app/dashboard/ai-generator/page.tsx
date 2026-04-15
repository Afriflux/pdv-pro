import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AiGeneratorClient } from './AiGeneratorClient'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'AI Generator Hub | Yayyam',
}

export default async function AiGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Vérifier qu'il a bien un store
  const { data: store } = await supabase
    .from('Store')
    .select('id, store_name')
    .eq('user_id', user.id)
    .single()

  if (!store) {
    redirect('/dashboard')
  }

  // Récupérer les 10 derniers produits
  const products = await prisma.product.findMany({
    where: { store_id: store.id, active: true },
    select: { id: true, name: true, price: true, description: true, type: true },
    orderBy: { created_at: 'desc' },
    take: 10
  })

  // Récupérer le log d'usage
  const oneHourAgo = new Date(Date.now() - 3_600_000)
  const logsCount = await prisma.aIGenerationLog.count({
    where: {
      user_id: user.id,
      created_at: { gte: oneHourAgo }
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-purple-600 shadow-[0_8px_30px_rgb(147,51,234,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="m20.2 19-3-3"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent tracking-tight">AI Generator</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Créez des descriptions de vente et des scripts publicitaires magiques.</p>
            </div>
          </div>
        </header>

        <main className="w-full relative z-10 px-6 lg:px-10 pb-20">
          <AiGeneratorClient initialProducts={products as any} usageCount={logsCount} />
        </main>
      </div>
    </div>
  )
}
