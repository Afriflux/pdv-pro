import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SocialProofClient } from './SocialProofClient'
import { revalidatePath } from 'next/cache'

export const metadata = {
  title: 'Preuve Sociale | Yayyam',
}

export default async function SocialProofPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, social_proof_active: true, social_proof_config: true }
  })

  if (!store) redirect('/dashboard')

  const toggleSocialProof = async (active: boolean) => {
    'use server'
    await prisma.store.update({
      where: { id: store.id },
      data: { social_proof_active: active }
    })
    revalidatePath('/dashboard/social-proof')
  }

  const saveConfig = async (config: any) => {
    'use server'
    await prisma.store.update({
      where: { id: store.id },
      data: { social_proof_config: config }
    })
    revalidatePath('/dashboard/social-proof')
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-rose-600 shadow-[0_8px_30px_rgb(225,29,72,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-rose-900 to-rose-600 bg-clip-text text-transparent tracking-tight">Preuve Sociale</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Boostez vos taux de conversion avec des notifications d'achats en temps réel.</p>
            </div>
          </div>
        </header>

        <main className="w-full relative z-10 px-6 lg:px-10 pb-20">
          <SocialProofClient 
            initialActive={store.social_proof_active} 
            initialConfig={store.social_proof_config} 
            onToggle={toggleSocialProof}
            onSave={saveConfig}
          />
        </main>
      </div>
    </div>
  )
}
