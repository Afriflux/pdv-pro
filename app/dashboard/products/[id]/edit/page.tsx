import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EditProductForm } from './EditProductForm'
import { QRButton } from '@/components/dashboard/QRButton'

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer l'espace du vendeur connecté
  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Récupérer le produit (vérifie qu'il appartient bien à ce vendeur)
  const { data: product } = await supabase
    .from('Product')
    .select('id, name, description, price, type, category, images, active')
    .eq('id', params.id)
    .eq('store_id', store.id)  // sécurité : le produit DOIT appartenir à ce vendeur
    .single()

  if (!product) notFound()

  // Récupérer les variantes existantes
  const { data: variants } = await supabase
    .from('ProductVariant')
    .select('id, dimension_1, value_1, dimension_2, value_2, stock, price_adjust')
    .eq('product_id', product.id)

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard/products" className="text-gray-400 hover:text-gray-600 transition">
          ←
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-ink">Modifier le produit</h1>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.name}</p>
        </div>
        <QRButton productId={product.id} productName={product.name} />
      </header>

      <div className="w-full p-6 space-y-6 bg-[#FAFAF7] min-h-screen">
        <EditProductForm
          storeId={store.id}
          product={product}
          initialVariants={variants ?? []}
        />
      </div>
    </main>
  )
}
