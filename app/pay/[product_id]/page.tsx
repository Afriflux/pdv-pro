import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { trackProductView } from '@/app/actions/analytics'
import FlashSaleCountdown from '@/components/pay/FlashSaleCountdown'
import { PixelTracker } from '@/components/tracking/PixelTracker'

export default async function PayPage({
  params
}: {
  params: { product_id: string }
}) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('Product')
    .select('*, store:Store(*)')
    .eq('id', params.product_id)
    .single()

  if (error || !product || !product.active) {
    notFound()
  }

  // Tracking de la vue (Priorité 3)
  trackProductView(params.product_id).catch(console.error)

  // Récupération des promotions (Priorité 4)
  const { data: promotions } = await supabase
    .from('Promotion')
    .select('*')
    .filter('active', 'eq', true)
    .filter('starts_at', 'lte', new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)

  // On cherche une promo qui contient ce produit
  const activePromo = promotions?.find((p: any) => 
    Array.isArray(p.product_ids) && p.product_ids.includes(params.product_id)
  )

  let promoPrice = product.price
  if (activePromo) {
    if (activePromo.discount_type === 'percentage') {
      promoPrice = product.price * (1 - (activePromo.discount_value || 0) / 100)
    } else if (activePromo.discount_type === 'fixed') {
      promoPrice = Math.max(0, product.price - (activePromo.discount_value || 0))
    }
  }

  // Handle single store relation correctly
  const store = Array.isArray(product.store) ? product.store[0] : product.store

  if (!store) {
     notFound()
  }

  let firstImage = null
  if (Array.isArray(product.images) && product.images.length > 0) {
    firstImage = product.images[0]
  } else if (typeof product.images === 'string' && product.images.startsWith('[')) {
    try {
      const parsed = JSON.parse(product.images)
      firstImage = parsed[0]
    } catch {
      firstImage = product.images
    }
  } else if (typeof product.images === 'string') {
    firstImage = product.images
  }

  const primaryColor = store.primary_color || '#0F7A60'

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <PixelTracker 
        metaId={store.meta_pixel_id} 
        tiktokId={store.tiktok_pixel_id} 
        googleId={store.google_tag_id}
        storeName={store.name}
      />
      
      {/* Header */}
      <div className="bg-white border-b border-line px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border flex items-center justify-center text-sm" style={{ backgroundColor: `${primaryColor}11`, borderColor: `${primaryColor}22` }}>
            🏪
          </div>
          <span className="font-medium text-ink text-sm">{store.name}</span>
        </div>
        <span className="text-xs text-dust font-mono bg-cream px-2 py-1 rounded-full border border-line">
          🔒 Paiement sécurisé
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Image produit */}
        {firstImage && (
          <div className="w-full aspect-video rounded-2xl overflow-hidden mb-5 border border-line shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firstImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Infos produit */}
        <div className="bg-white rounded-2xl border border-line p-5 mb-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-display text-ink text-xl font-bold mb-1">{product.name}</h1>
              {product.description && (
                <p className="text-slate text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {activePromo ? (
                <>
                  <p className="text-dust text-sm line-through decoration-red-400/50">
                    {product.price.toLocaleString('fr-FR')}
                  </p>
                  <p className="font-display text-2xl font-black text-red-600">
                    {promoPrice.toLocaleString('fr-FR')}
                    <span className="text-xs ml-1">FCFA</span>
                  </p>
                  <div className="inline-block bg-red-600 text-white text-xs font-black px-1.5 py-0.5 rounded mt-1 uppercase">
                    -{activePromo.discount_type === 'percentage' ? `${activePromo.discount_value}%` : 'PROMO'}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-bold" style={{ color: primaryColor }}>
                    {product.price.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-dust text-xs mt-0.5">FCFA</p>
                </>
              )}
            </div>
          </div>

          {activePromo?.ends_at && (
            <div className="mt-6 border-t border-line pt-6">
              <FlashSaleCountdown endsAt={activePromo.ends_at} />
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line flex-wrap">
            <span className="text-xs border px-2.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${primaryColor}11`, color: primaryColor, borderColor: `${primaryColor}22` }}>
              {product.type === 'digital' ? 'Digital' : product.type === 'coaching' ? 'Coaching' : 'Physique'}
            </span>
            {product.cash_on_delivery && (
              <span className="text-xs bg-emerald/10 text-emerald border border-emerald/20 px-2.5 py-0.5 rounded-full font-medium">
                💵 Paiement à la livraison disponible
              </span>
            )}
          </div>
        </div>

        {/* Bouton commander */}
        <a
          href={`/checkout/${product.id}`}
          className="block w-full text-white py-4 rounded-2xl font-semibold text-center text-lg transition shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          Commander maintenant →
        </a>

        {/* Réassurance */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6">
          <span className="text-xs text-dust flex items-center gap-1 font-medium">🔒 Paiement sécurisé</span>
          <span className="text-xs text-dust flex items-center gap-1 font-medium">⚡ Wave & Mobile Money</span>
          <span className="text-xs text-dust flex items-center gap-1 font-bold">✓ Yayyam</span>
        </div>
      </div>
    </div>
  )
}
