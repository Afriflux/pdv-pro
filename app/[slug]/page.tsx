/* eslint-disable react/forbid-dom-props */
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getStorePromotions } from '@/lib/promotions/promotionActions'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { PixelTracker } from '@/components/tracking/PixelTracker'
import SocialProofBanner from '@/components/widgets/SocialProofBanner'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import NewsletterWidget from '@/components/brevo/NewsletterWidget'
import WhatsAppFloat from '@/components/storefront/WhatsAppFloat'
import StoreSocialLinks from '@/components/storefront/StoreSocialLinks'

export const dynamic = 'force-dynamic'

interface StorePageProps {
  params: { slug: string }
}

// ── Requête store cachée — dédupliquée entre generateMetadata et StorePage ────
const getStoreBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('Store')
    .select(`
      id, name, slug, description, logo_url, banner_url,
      primary_color, category, whatsapp, social_links,
      meta_pixel_id, tiktok_pixel_id, google_tag_id,
      is_active, user:User(phone)
    `)
    .eq('slug', slug)
    .single()
  return data
})

// SEO dynamique — utilise la requête cachée (pas de double appel DB)
export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug)

  if (!store) return { title: 'Espace introuvable' }

  return {
    title: store.name + ' — PDV Pro',
    description: store.description ?? `Découvrez l'espace de vente de ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description ?? '',
      images: store.logo_url ? [store.logo_url] : [],
    },
  }
}

export default async function StorePage({ params }: StorePageProps) {
  // 1. Charger l'espace principal (requête cachée — même appel que generateMetadata)
  const store = await getStoreBySlug(params.slug)

  if (!store) notFound()

  // 2. Vérification critique : Si la boutique est désactivée par le vendeur, afficher la maintenance
  if (!store.is_active) {
    return (
      <main className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-[32px] p-12 max-w-lg shadow-xl shadow-ink/5 border border-line w-full space-y-6">
          <div className="w-20 h-20 bg-ink rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg">
            🔒
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-ink mb-2">Boutique indisponible</h1>
            <p className="text-dust leading-relaxed font-medium">
              L&apos;espace de vente <strong className="text-ink">{store.name}</strong> est temporairement fermé.
              Merci de votre compréhension et à très bientôt.
            </p>
          </div>
          <PoweredByBadge />
        </div>
      </main>
    )
  }

  const supabase = await createClient()

  // 3. Charger produits + pages + promotions en parallèle (P4)
  const [{ data: products }, { data: pages }, promotions] = await Promise.all([
    supabase
      .from('Product')
      .select('id, name, description, price, images, type, category, cash_on_delivery')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('SalePage')
      .select('id, title, slug, template, cover_url')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(12),
    getStorePromotions(store.id),
  ])

  const accent = store.primary_color ?? '#0F7A60'

  // Calcul du numéro WhatsApp et des SocialLinks castés
  const storeUser   = store.user as { phone?: string | null } | null
  const waPhone     = store.whatsapp || storeUser?.phone || ''
  const socialLinks = store.social_links as Record<string, string> | null

  return (
    <main className="min-h-screen bg-gray-50">
      <PixelTracker 
        metaId={store.meta_pixel_id} 
        tiktokId={store.tiktok_pixel_id} 
        googleId={store.google_tag_id}
        storeName={store.name}
      />

      {/* Header Section */}
      <div className="relative">
        {store.banner_url ? (
          <div className="relative h-48 md:h-64 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            
            {/* Infos sur bannière */}
            <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto flex items-end justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl flex-shrink-0">
                  {store.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={store.logo_url} alt={store.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black" style={{ color: accent, backgroundColor: '#fff' }}>{store.name[0]}</div>
                  )}
                </div>
                <div className="text-white pb-1">
                  <h1 className="text-2xl md:text-3xl font-black">{store.name}</h1>
                  {store.category && (
                    <span className="inline-block mt-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold font-mono tracking-widest border border-white/30">
                      {store.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div 
              className="h-44 w-full" 
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
            />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
            
            <div className="max-w-2xl mx-auto px-4 relative z-10">
              <div className="flex flex-col items-center text-center -mt-14 space-y-4">
                <div className="w-28 h-28 rounded-full border-[6px] border-gray-50 shadow-2xl overflow-hidden bg-white flex-shrink-0 group hover:scale-105 transition-transform duration-500">
                  {store.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={store.logo_url} alt={store.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black" style={{ color: accent }}>{store.name[0]}</div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{store.name}</h1>
                  {store.category && (
                    <span className="inline-block mt-3 px-4 py-1.5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold font-mono tracking-widest uppercase">
                      {store.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liens sociaux via le Composant */}
        <div className="mt-4">
          <StoreSocialLinks socialLinks={socialLinks} />
        </div>

        {/* Description */}
        {store.description && (
          <div className="max-w-xl mx-auto px-6 mt-6">
            <p className="text-sm md:text-base text-gray-600 leading-relaxed text-center font-medium opacity-90">
              {store.description}
            </p>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12 mt-10 space-y-8">

        {/* Pages de vente */}
        {(pages ?? []).length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                Pages Spéciales
              </h2>
              <div className="h-[1px] flex-1 bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(pages ?? []).map(page => (
                <Link key={page.id} href={`/p/${page.slug}`}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ring-1 ring-gray-100">
                  {page.cover_url
                    ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={page.cover_url} alt={page.title}
                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500" />
                    )
                    : (
                      <div className="w-full h-32 flex items-center justify-center text-3xl"
                        style={{ background: accent + '11' }}>
                        🛍️
                      </div>
                    )}
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{page.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Produits */}
        {(products ?? []).length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                Notre collection ({(products ?? []).length})
              </h2>
              <div className="h-[1px] flex-1 bg-gray-200" />
            </div>

            {/* Bannière de preuve sociale — au-dessus de la grille produits */}
            {(products ?? [])[0] && (
              <div className="mb-6">
                <SocialProofBanner
                  storeId={store.id}
                  productId={(products ?? [])[0].id}
                  stock={99}
                  stockThreshold={10}
                />
              </div>
            )}

            <ProductGrid 
              products={products ?? []} 
              promotions={promotions} 
              accent={accent} 
            />
          </section>
        )}

        {/* État vide premium */}
        {(products ?? []).length === 0 && (pages ?? []).length === 0 && (
          <div className="bg-white rounded-[32px] p-12 text-center shadow-lg shadow-gray-100/50 border border-gray-100 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100" />
            <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner">
              ✨
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Bientôt disponible</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              La boutique prépare actuellement ses rayons.
              Inscrivez-vous ci-dessous pour être alerté du lancement.
            </p>
          </div>
        )}

        {/* Widget newsletter */}
        <div className="pt-6 border-t border-gray-200/60 mt-8">
          <NewsletterWidget storeId={store.id} storeName={store.name} />
        </div>

        {/* Bouton WhatsApp Flottant via Composant */}
        <WhatsAppFloat phone={waPhone} storeName={store.name} />

        {/* Badge PDV Pro — discret en bas de la page boutique */}
        <PoweredByBadge />
      </div>
    </main>
  )
}
