import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { VolumeDiscountsControls } from './VolumeDiscountsControls'
import { Layers, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function VolumeDiscountsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true, volume_discounts_active: true, volume_discounts_config: true }
  })
  if (!store) redirect('/onboarding')

  return (
    <div className="w-full relative z-10 px-6 lg:px-10 pb-20">
      
      {/* Background spécifique à l'app pour l'intégration visuelle */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/5 blur-[120px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/5 blur-[100px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        
        {/* Header Premium Alignement Standard */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-8 border-b border-gray-200/40 relative z-10 pt-8">
          <div className="flex items-center gap-5">
            <Link href="/dashboard/apps" className="hover:bg-white/50 p-2 rounded-xl transition-colors">
              <ArrowLeft className="text-gray-400 w-5 h-5" />
            </Link>
            <div className="flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-xl rounded-[1.2rem] text-violet-600 shadow-[0_8px_30px_rgb(139,92,246,0.12)] border border-white">
              <Layers strokeWidth={2.5} size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">Prix de Gros B2B</h1>
              <p className="text-gray-500 text-[15px] font-medium mt-1">Créez des paliers de réductions incitatifs pour exploser votre Panier Moyen (AOV).</p>
            </div>
          </div>
        </header>

        <main className="max-w-4xl pt-4">
          <VolumeDiscountsControls 
            initialActive={store.volume_discounts_active} 
            initialConfig={store.volume_discounts_config} 
          />
          
          <div className="mt-10 bg-violet-50/50 rounded-3xl p-6 border border-violet-100 flex gap-4">
            <div className="bg-violet-100 text-violet-600 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0">?</div>
            <div>
              <h4 className="text-violet-900 font-bold mb-1">Comment ça marche ?</h4>
              <p className="text-violet-700/80 text-sm font-medium leading-relaxed">
                Une fois activé, notre Moteur de Vitrine interceptera chaque modification de quantité par vos clients. S'ils ajoutent 3 articles et que vous avez une règle "Pour 3 articles : -15%", le prix de leur commande se mettra à jour automatiquement avec un design très incitatif.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
