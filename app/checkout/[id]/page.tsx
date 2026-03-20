import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductPage from './ProductPage'
import { getStorePromotions } from '@/lib/promotions/promotionActions'
import { computeProductPrice } from '@/lib/promotions/promotionUtils'
import { PixelTracker } from '@/components/tracking/PixelTracker'
import { prisma } from '@/lib/prisma'

interface CheckoutPageProps {
  params: { id: string }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const supabase = await createClient()

  // Charger le produit + sa boutique
  const { data: product } = await supabase
    .from('Product')
    .select(`
      id, name, description, price, type, images, category, resale_allowed, resale_commission, cash_on_delivery,
      store:Store(id, name, slug, logo_url, primary_color, meta_pixel_id, tiktok_pixel_id, google_tag_id, contract_accepted, vendor_type)
    `)
    .eq('id', params.id)
    .eq('active', true)
    .single()

  if (!product) notFound()

  // Charger les variantes
  const { data: variants } = await supabase
    .from('ProductVariant')
    .select('id, dimension_1, value_1, dimension_2, value_2, stock, price_adjust')
    .eq('product_id', params.id)

  const store = (Array.isArray(product.store) ? product.store[0] : product.store) as {
    id: string; name: string; slug: string
    logo_url: string | null; primary_color: string | null
    meta_pixel_id: string | null; tiktok_pixel_id: string | null; google_tag_id: string | null
    contract_accepted: boolean | null; vendor_type: 'digital' | 'physical' | 'hybrid' | null
  } | null

  if (!store) notFound()

  // Promos actives sur l'espace
  const promos  = await getStorePromotions(store.id)
  const computed = computeProductPrice(product.price, product.id, promos)

  // Vérifier si le vendeur est abonné PRO
  const { data: subData } = await supabase
    .from('Subscription')
    .select('plan')
    .eq('vendor_id', store.id)
    .eq('plan', 'pro')
    .gte('expires_at', new Date().toISOString())
    .limit(1)

  const vendorPlan = subData && subData.length > 0 ? 'pro' : 'gratuit'

  // Récupérer les zones de livraison de la boutique
  const deliveryZones = await prisma.deliveryZone.findMany({
    where: { store_id: store.id, active: true },
    orderBy: { created_at: 'asc' }
  })

  // Récupérer les créneaux si produit_type === "coaching"
  let coachingSlots: any[] = []
  if (product.type === 'coaching') {
    coachingSlots = await prisma.coachingSlot.findMany({
      where: { store_id: store.id, active: true },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }]
    })
  }

  // Blocage élégant si le vendeur n'a pas signé son contrat partenaire
  if (!store.contract_accepted) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-black text-[#1A1A1A]">
            Boutique temporairement indisponible
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Cette boutique finalise sa configuration.
            Elle sera disponible très prochainement.
          </p>
          <p className="text-xs text-gray-400">
            Si vous êtes le vendeur,{' '}
            <a
              href="/dashboard/settings#contrat"
              className="text-[#0F7A60] font-bold hover:underline"
            >
              activez votre espace ici →
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PixelTracker
        metaId={store.meta_pixel_id}
        tiktokId={store.tiktok_pixel_id}
        googleId={store.google_tag_id}
        storeName={store.name}
      />
      <ProductPage
        product={{ ...product, store }}
        variants={variants ?? []}
        computedPrice={computed}
        vendorPlan={vendorPlan}
        storeId={store.id}
        deliveryZones={deliveryZones}
        coachingSlots={coachingSlots}
      />
    </>
  )
}
