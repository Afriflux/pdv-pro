import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewPageFlow } from './NewPageFlow'

export default async function NewSalePagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Produits disponibles pour lier à la page
  const { data: products } = await supabase
    .from('Product')
    .select('id, name, price, type, images')
    .eq('store_id', store.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-cream">
      <NewPageFlow storeId={store.id} products={products ?? []} />
    </main>
  )
}
