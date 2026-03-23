import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PagesView from './PagesView'
import PagesHeaderImport from './PagesHeaderImport'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface SalePage {
  id: string
  title: string
  slug: string
  template: string
  active: boolean
  created_at: string
  product_ids: string[] | null
  views_count?: number
  sales_count?: number
}

interface Store {
  id: string
  name: string
}

export default async function SalePagesListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single<Store>()

  if (!store) redirect('/dashboard')

  const { data: pages } = await supabase
    .from('SalePage')
    .select('id, title, slug, template, active, created_at, product_ids, views_count, sales_count')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const list = (pages ?? []) as SalePage[]

  return (
    <>
      <PagesHeaderImport />

      {/* État vide classique hors de PagesView si possible, ou géré par PagesView. 
          Ici on garde le pattern de ProductsView où l'état vide est géré dedans (sauf que j'ai oublié de l'y mettre, je vais l'ajouter) */}
      <div className="bg-transparent min-h-screen pb-12">
        {list.length === 0 ? (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center text-center p-12 sm:p-20 max-w-3xl mx-auto my-12 bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white shadow-xl shadow-gray-200/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C9A84C]/10 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none group-hover:bg-[#C9A84C]/20 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#0F7A60]/10 rounded-full blur-[80px] -ml-40 -mb-40 pointer-events-none group-hover:bg-[#0F7A60]/20 transition-colors duration-700" />
              
              <div className="w-24 h-24 bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 rounded-3xl flex items-center justify-center text-[#C9A84C] mb-8 relative z-10 shadow-inner border border-[#C9A84C]/20 transform -rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                <Sparkles className="w-12 h-12" />
              </div>
              
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#1A1A1A] mb-4 relative z-10 tracking-tight">
                Aucune page de vente
              </h2>
              <p className="text-gray-500 font-medium text-lg mb-10 relative z-10 leading-relaxed max-w-md">
                Votre vitrine est vide. Utilisez la magie de l'IA pour générer votre première page de vente ultra-performante en quelques secondes.
              </p>
              
              <Link
                href="/dashboard/pages/new"
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-br from-[#C9A84C] to-[#B39540] hover:to-[#9E8233] text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg shadow-[#C9A84C]/30 hover:shadow-xl hover:shadow-[#C9A84C]/50 hover:-translate-y-1 transition-all duration-300 relative z-10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                <Sparkles className="w-5 h-5" /> Créer ma première page
              </Link>
            </div>
          </div>
        ) : (
          <PagesView 
            pages={list} 
            storeName={store.name} 
          />
        )}
      </div>
    </>
  )
}
