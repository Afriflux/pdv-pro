import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { trackProductView } from '@/app/actions/analytics'
import FlashSaleCountdown from '@/components/pay/FlashSaleCountdown'
import ProductImageGallery from '@/components/pay/ProductImageGallery'
import { PixelTracker } from '@/components/tracking/PixelTracker'

/* eslint-disable react/forbid-dom-props */

interface PayPageProps {
  params: { product_id: string }
}

// ── SEO : Metadata dynamique + Open Graph ─────────────────────────────────────
export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('Product')
    .select('name, description, price, images, store:Store(name, store_name)')
    .eq('id', params.product_id)
    .single()

  if (!product) return { title: 'Produit introuvable | Yayyam' }

  const store = Array.isArray(product.store) ? product.store[0] : product.store
  const storeName = store?.store_name || store?.name || 'Yayyam'
  const firstImage = parseImages(product.images)?.[0]

  return {
    title: `${product.name} — ${storeName}`,
    description: product.description?.substring(0, 155) || `Découvrez ${product.name} sur ${storeName}`,
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 155) || `Achetez ${product.name}`,
      url: `https://yayyam.com/pay/${params.product_id}`,
      siteName: storeName,
      images: firstImage ? [{ url: firstImage, width: 800, height: 800, alt: product.name }] : [],
      locale: 'fr_FR',
      type: 'website',
    },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') {
    if (images.startsWith('[')) {
      try { return JSON.parse(images).filter(Boolean) } catch { return [images] }
    }
    return [images]
  }
  return []
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function PayPage({ params }: PayPageProps) {
  const supabase = await createClient()

  // 1. Charger produit + boutique + avis en parallèle
  const [{ data: product, error }, { data: promotions }] = await Promise.all([
    supabase
      .from('Product')
      .select('*, store:Store(*)')
      .eq('id', params.product_id)
      .single(),
    supabase
      .from('Promotion')
      .select('*')
      .filter('active', 'eq', true)
      .filter('starts_at', 'lte', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`),
  ])

  if (error || !product || !product.active) notFound()

  const store = Array.isArray(product.store) ? product.store[0] : product.store
  if (!store) notFound()

  // Avis du produit
  const { data: reviews, count: reviewCount } = await supabase
    .from('Review')
    .select('id, rating, comment, buyer_name, created_at', { count: 'exact' })
    .eq('product_id', params.product_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Nombre de ventes
  const { count: salesCount } = await supabase
    .from('Order')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', params.product_id)
    .in('status', ['delivered', 'confirmed', 'shipped'])

  // Tracking
  trackProductView(params.product_id).catch(console.error)

  // 2. Promotions
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

  // 3. Images & Template Config
  const allImages = parseImages(product.images)
  
  let themeOverride = null
  let colorOverride = null
  try {
    if (product.template && product.template.startsWith('{')) {
      const config = JSON.parse(product.template)
      themeOverride = config.theme === 'default' ? null : config.theme
      colorOverride = config.color || null
    }
  } catch (e) {}

  const primaryColor = colorOverride || store.primary_color || '#0F7A60'

  // 4. Rating
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0
  const totalReviews = reviewCount || 0

  // 5. JSON-LD (Structured Data)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': product.description,
    'image': allImages,
    'brand': { '@type': 'Brand', 'name': store.store_name || store.name },
    'offers': {
      '@type': 'Offer',
      'url': `https://yayyam.com/pay/${params.product_id}`,
      'priceCurrency': 'XOF',
      'price': activePromo ? promoPrice : product.price,
      'availability': 'https://schema.org/InStock',
    },
    ...(totalReviews > 0 ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': avgRating.toFixed(1),
        'reviewCount': totalReviews,
      }
    } : {}),
  }

  // Stars helper
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
    ))
  }

  // ── Moteur Multi-Thèmes ────────────────────────────────────────────────────────
  const theme = themeOverride || store.theme_funnel || store.theme_storefront || 'classic'
  const t = (() => {
    switch (theme) {
      case 'cinematic':
        return {
          bg: 'bg-gray-950 text-gray-100',
          card: 'bg-gray-900 border-gray-800 shadow-2xl',
          text: 'text-gray-100',
          textMuted: 'text-gray-400',
          textAccent: 'text-white',
          border: 'border-gray-800',
          badgeBg: 'bg-gray-800 text-gray-300',
        }
      case 'cream_elegant':
        return {
          bg: 'bg-[#FAF9F6] text-[#1C201F]',
          card: 'bg-white border-[#E8E6DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[2rem]',
          text: 'text-[#1C201F]',
          textMuted: 'text-[#8C8F8A]',
          textAccent: 'text-[#0B2B20]',
          border: 'border-[#E8E6DF]',
          badgeBg: 'bg-[#F4F3EE] text-[#4A4D4A]',
        }
      default: // classic
        return {
          bg: 'bg-white md:bg-[#F9FAFB] text-gray-900',
          card: 'md:bg-white md:shadow-2xl border-transparent rounded-[2.5rem]',
          text: 'text-gray-900',
          textMuted: 'text-gray-500',
          textAccent: 'text-gray-900',
          border: 'border-gray-100',
          badgeBg: 'bg-gray-50 text-gray-600 border border-gray-100',
        }
    }
  })()

  return (
    <div className={`min-h-screen flex md:items-center justify-center font-sans relative overflow-hidden transition-colors duration-500 ${t.bg}`}>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PixelTracker
        metaId={store.meta_pixel_id}
        tiktokId={store.tiktok_pixel_id}
        googleId={store.google_tag_id}
        storeName={store.name}
      />

      {/* Fond Décoratif */}
      <div className="hidden md:block absolute top-0 inset-x-0 h-[40vh] pointer-events-none" {...{ style: { background: `linear-gradient(to bottom, ${primaryColor}15, transparent)` } }} />

      <div className={`w-full max-w-6xl mx-auto md:p-8 flex flex-col md:flex-row gap-0 overflow-hidden relative z-10 min-h-screen md:min-h-[85vh] ${t.card}`}>

        {/* ── COLONNE GAUCHE (VISUEL) ─────────────────────────────────────── */}
        <div className={`w-full md:w-5/12 lg:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col border-r ${t.border} ${theme === 'classic' ? 'bg-gray-50 md:bg-transparent' : ''}`}>

          {/* Header Store */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center text-lg font-black shadow-md ${theme === 'cream_elegant' ? 'bg-[#0B2B20] text-white' : 'bg-gradient-to-br from-gray-900 to-gray-700 text-white'}`}>
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${t.textMuted}`}>Produit de</p>
              <span className={`font-black text-base ${t.textAccent}`}>{store.store_name || store.name}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {/* 🆕 Galerie Multi-Images */}
            {allImages.length > 0 ? (
              <ProductImageGallery
                images={allImages}
                productName={product.name}
                productType={product.type}
              />
            ) : (
              <div className="w-full aspect-[4/5] md:aspect-square mb-8 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 relative">
                <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                  <h2 className="text-8xl md:text-9xl font-black text-emerald-900/10 rotate-12 select-none absolute">
                    {product.name.substring(0, 2).toUpperCase()}
                  </h2>
                  <div className="relative z-10 w-24 h-24 rounded-full bg-white/80 backdrop-blur-sm shadow-xl flex items-center justify-center">
                    <span className="text-3xl font-black text-emerald-800">{product.name.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description Desktop */}
            <div className="hidden md:block mt-8">
              <h2 className={`font-black text-xs uppercase tracking-widest mb-4 ${t.textMuted}`}>Description du produit</h2>
              {product.description ? (
                <p className={`text-sm font-medium leading-relaxed whitespace-pre-line p-6 rounded-[1.5rem] ${theme === 'cinematic' ? 'bg-gray-800 text-gray-300' : theme === 'cream_elegant' ? 'bg-[#F4F3EE] text-[#4A4D4A]' : 'bg-gray-50 text-gray-600'}`}>
                  {product.description}
                </p>
              ) : (
                <p className={`text-sm font-medium italic ${t.textMuted}`}>Aucune description détaillée fournie.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE (CHECKOUT PREVIEW) ──────────────────────────── */}
        <div className={`w-full md:w-7/12 lg:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col ${theme === 'classic' ? 'bg-white' : ''}`}>

          <div className="flex-1 mt-0 md:mt-10">
            {/* Titre & Prix */}
            <div className="mb-8">
              <h1 className={`font-black text-3xl md:text-4xl lg:text-5xl leading-tight mb-4 tracking-tight ${t.textAccent}`}>
                {product.name}
              </h1>

              {/* 🆕 Rating & Ventes */}
              {(totalReviews > 0 || (salesCount ?? 0) > 0) && (
                <div className="flex flex-wrap items-center gap-4 mb-5">
                  {totalReviews > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex">{renderStars(avgRating)}</div>
                      <span className={`text-sm font-bold ${t.text}`}>{avgRating.toFixed(1)}</span>
                      <span className={`text-xs font-medium ${t.textMuted}`}>({totalReviews} avis)</span>
                    </div>
                  )}
                  {(salesCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <span>🔥</span> {salesCount}+ vendu{salesCount! > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Prix */}
              <div className="inline-block relative mt-2">
                <div className="absolute inset-0 rounded-[1rem] -rotate-2 scale-105" {...{ style: { backgroundColor: `${primaryColor}20` } }} />
                <div className={`relative border-2 px-6 py-4 rounded-[1rem] shadow-sm flex items-end gap-3 transition hover:-translate-y-1 ${t.bg === 'bg-gray-950 text-gray-100' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`} {...{ style: { borderColor: `${primaryColor}30` } }}>
                  {activePromo ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-400 line-through decoration-red-400 decoration-2 mb-1">
                        {product.price.toLocaleString('fr-FR')} FCFA
                      </span>
                      <div className="flex items-end gap-2">
                        <span className={`font-black text-4xl leading-none ${t.bg === 'bg-gray-950 text-gray-100' ? 'text-white' : 'text-gray-900'}`}>{promoPrice.toLocaleString('fr-FR')}</span>
                        <span className={`font-black text-sm pb-1 ${t.textMuted}`}>XOF</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <span className="font-black text-4xl leading-none" {...{ style: { color: t.bg === 'bg-gray-950 text-gray-100' ? '#E1E1D9' : primaryColor } }}>
                        {product.price.toLocaleString('fr-FR')}
                      </span>
                      <span className={`font-black text-sm pb-1 ${t.textMuted}`}>XOF</span>
                    </div>
                  )}
                </div>
              </div>

              {activePromo && activePromo.ends_at && (
                <div className="mt-6 inline-block bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                  <FlashSaleCountdown endsAt={activePromo.ends_at} />
                </div>
              )}
            </div>

            {/* Description Mobile */}
            <div className="md:hidden mb-8">
              <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4">
                {product.description || "Aucune description fournie."}
              </p>
            </div>

            {/* Réassurance Minimaliste (au lieu du gros texte moche) */}
            <div className="flex flex-wrap items-center gap-2 mb-10 mt-6">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${t.badgeBg}`}>
                <span className="text-emerald-500">🔒</span> Sécurisé
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${t.badgeBg}`}>
                <span className="text-amber-500">⚡</span> Rapide
              </div>
              {product.cash_on_delivery && (
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${t.badgeBg}`}>
                  <span className="text-indigo-500">💵</span> COD
                </div>
              )}
            </div>

            {/* Bouton CTA */}
            <div className="mt-auto">
              <a
                href={`/checkout/${product.id}`}
                className="group relative w-full inline-flex items-center justify-center overflow-hidden rounded-[1.5rem] text-white px-8 py-5 text-lg font-black shadow-[0_15px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.3)] transition-all hover:scale-[1.02]"
                {...{ style: { backgroundColor: primaryColor } }}
              >
                <span className="absolute right-0 h-full w-10 translate-x-12 transform bg-white/20 transition-all duration-700 group-hover:-translate-x-[500px]" />
                <span className="relative flex items-center gap-2">
                  Obtenir ce produit <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </a>
            </div>

            {/* 🆕 Section Avis */}
            {reviews && reviews.length > 0 && (
              <div className="mt-10 border-t border-gray-100 pt-8">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6">
                  Derniers Avis ({totalReviews})
                </h3>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-black">
                            {(review.buyer_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm text-gray-800">{review.buyer_name || 'Acheteur'}</span>
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-4 border-t border-gray-100 pt-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Propulsé par Yayyam</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
