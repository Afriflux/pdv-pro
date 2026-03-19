import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageEditor } from './PageEditor'

interface EditPageProps {
  params: { id: string }
}

export default async function EditSalePagePage({ params }: EditPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Charger la page (vérifier propriété)
  const { data: page } = await supabase
    .from('SalePage')
    .select('*')
    .eq('id', params.id)
    .eq('store_id', store.id)
    .single()

  if (!page) notFound()

  // Produits actifs du vendeur
  const { data: products } = await supabase
    .from('Product')
    .select('id, name, price, type, images')
    .eq('store_id', store.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pages" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
          <div>
            <h1 className="text-base font-bold text-ink truncate max-w-[200px]">{page.title}</h1>
            <p className="text-xs text-gray-400">/p/{page.slug}</p>
          </div>
        </div>
        <a
          href={`/p/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold border border-gold/30 rounded-xl px-3 py-1.5 hover:bg-gold/10 transition"
        >
          Voir 🔗
        </a>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageEditor page={page} storeId={store.id} products={products ?? []} />
      </div>
    </main>
  )
}
