import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PromotionsClient from './PromotionsClient'
import { getStorePromotions } from '@/lib/promotions/promotionActions'

export default async function PromotionsHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Boutique
  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')
  const storeId = store.id

  // 2. Produits Actifs (pour le choix de la cible)
  const { data: products } = await supabase
    .from('Product')
    .select('id, name')
    .eq('store_id', storeId)
    .eq('active', true)
    .order('name', { ascending: true })

  // 3. Toutes les promotions créées (Offres Flash)
  const promotions = await getStorePromotions(storeId)

  // 4. Codes Promo
  const { data: promos } = await supabase
    .from('PromoCode')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-6 md:px-8">
        <div>
          <h1 className="text-2xl font-display font-black text-ink">Offres & Promotions ⭐</h1>
          <p className="text-sm text-gray-400 mt-1">Gérez vos offres flash et vos coupons de réduction au même endroit.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full p-6 md:p-8">
        <PromotionsClient 
          storeId={storeId}
          promotions={promotions}
          promoCodes={promos ?? []}
          products={products ?? []}
        />
      </div>
    </main>
  )
}
