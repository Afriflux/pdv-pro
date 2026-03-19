import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PagesView from './PagesView'

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
    .select('id, title, slug, template, active, created_at, product_ids')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const list = (pages ?? []) as SalePage[]

  return (
    <>
      {/* Header uniforme */}
      <header className="bg-white border-b border-line shadow-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-display text-ink text-xl font-bold">Pages de vente</h1>
          <Link
            href="/dashboard/pages/new"
            className="bg-gold text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gold-light transition shadow-md shadow-gold/20 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span>+</span> Nouvelle page
          </Link>
        </div>
      </header>

      {/* État vide classique hors de PagesView si possible, ou géré par PagesView. 
          Ici on garde le pattern de ProductsView où l'état vide est géré dedans (sauf que j'ai oublié de l'y mettre, je vais l'ajouter) */}
      <div className="bg-[#FAFAF7] min-h-screen pb-12">
        {list.length === 0 ? (
          <div className="p-6">
            <div className="bg-white rounded-2xl border border-line p-16 text-center shadow-sm">
              <div className="text-6xl mb-4">🛍️</div>
              <h2 className="font-display text-ink text-xl font-bold mb-2">Aucune page de vente</h2>
              <p className="text-slate text-sm mb-6 max-w-xs mx-auto">
                Créez votre première page de vente en choisissant parmi nos 10 templates sectoriels.
              </p>
              <Link
                href="/dashboard/pages/new"
                className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 rounded-xl font-medium hover:bg-gold-light transition shadow-md shadow-gold/20"
              >
                + Créer ma première page
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
