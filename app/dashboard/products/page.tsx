import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductsView from './ProductsView'
import ProductsHeaderImport from './ProductsHeaderImport'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Product {
  id: string
  name: string
  price: number
  type: 'digital' | 'physical' | 'coaching'
  category: string | null
  active: boolean
  images: string[]
  created_at: string
  cash_on_delivery: boolean
  description: string | null
}

interface Store {
  id: string
  name: string
}

// ----------------------------------------------------------------
// Page (Server Component)
// ----------------------------------------------------------------
export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Récupérer l'espace du vendeur
  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single<Store>()

  if (!store) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] p-4">
        <div className="w-full p-6 mx-auto mt-16 text-center">
          <p className="text-slate">Espace introuvable. Contactez le support.</p>
        </div>
      </main>
    )
  }

  // 2. Récupérer les produits de l'espace
  const { data: products } = await supabase
    .from('Product')
    .select('id, name, price, type, category, active, images, created_at, cash_on_delivery, description')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  const productList = (products ?? []) as Product[]
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <>
      {/* Header avec bouton Import CSV */}
      <ProductsHeaderImport />

      {/* Vue dynamique des produits (Client Component) */}
      <ProductsView
        products={productList}
        storeName={store.name}
        baseUrl={baseUrl}
      />
    </>
  )
}
