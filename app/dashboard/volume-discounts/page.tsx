import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { VolumeDiscountsClient } from './VolumeDiscountsClient'
import { revalidatePath } from 'next/cache'

export const metadata = {
  title: 'Prix de Gros | Yayyam',
}

export default async function VolumeDiscountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, volume_discounts_active: true, volume_discounts_config: true }
  })

  if (!store) redirect('/dashboard')

  const toggleVolumeDiscounts = async (active: boolean) => {
    'use server'
    await prisma.store.update({
      where: { id: store.id },
      data: { volume_discounts_active: active }
    })
    revalidatePath('/dashboard/volume-discounts')
  }

  const saveConfig = async (config: any) => {
    'use server'
    await prisma.store.update({
      where: { id: store.id },
      data: { volume_discounts_config: config }
    })
    revalidatePath('/dashboard/volume-discounts')
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-10 border-b border-gray-200/40 relative z-10 px-6 lg:px-10 pt-8">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-blue-600 shadow-[0_8px_30px_rgb(37,99,235,0.12)] border border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="M7 7l10 10"/><path d="M17 7L7 17"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent tracking-tight">Prix de Gros B2B</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Augmentez votre panier moyen en offrant des réductions par lots.</p>
            </div>
          </div>
        </header>

        <main className="w-full relative z-10 px-6 lg:px-10 pb-20">
          <VolumeDiscountsClient 
            initialActive={store.volume_discounts_active} 
            initialConfig={store.volume_discounts_config} 
            onToggle={toggleVolumeDiscounts}
            onSave={saveConfig}
          />
        </main>
      </div>
    </div>
  )
}
