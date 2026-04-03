/* eslint-disable react/forbid-dom-props */
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getStorePromotions } from '@/lib/promotions/promotionActions'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { PixelTracker } from '@/components/tracking/PixelTracker'
import { BadgeCheck } from 'lucide-react'
import SocialProofBanner from '@/components/widgets/SocialProofBanner'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import NewsletterWidget from '@/components/brevo/NewsletterWidget'
import WhatsAppFloat from '@/components/storefront/WhatsAppFloat'
import StoreSocialLinks from '@/components/storefront/StoreSocialLinks'
import { ShoppingBag, Star } from 'lucide-react'

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
      id, name, slug, description, logo_url, banner_url, created_at,
      primary_color, category, whatsapp, social_links,
      meta_pixel_id, tiktok_pixel_id, google_tag_id,
      is_active, kyc_status, user:User(phone)
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

  // 3. Charger produits + pages + promotions en parallèle
  const [{ data: products }, { data: pages }, promotions, { count: salesCount }, { data: reviews }] = await Promise.all([
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
    supabase
      .from('Order')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .eq('status', 'delivered'),
    supabase
      .from('Review')
      .select('rating')
      .eq('store_id', store.id)
  ])

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0
  const reviewCount = reviews?.length || 0

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
      <div className="w-full bg-white pb-6 border-b border-gray-150 shadow-sm relative z-10">
        {store.banner_url ? (
          <div className="w-full h-48 md:h-64 overflow-hidden bg-gray-100 relative">
            <Image src={store.banner_url} alt={store.name || "Bannière de la boutique"} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/15" />
          </div>
        ) : (
          <div 
            className="w-full h-40 md:h-48"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
          />
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-20">
            {/* Logo */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white overflow-hidden bg-white shadow-lg flex-shrink-0 z-10 transition-transform duration-300 hover:scale-105">
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.name} fill className="object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-black" style={{ color: accent, backgroundColor: '#f9f9f9' }}>
                  {store.name[0]}
                </div>
              )}
            </div>

            {/* Infos (Title, Category, Badges, Stats) */}
            <div className="flex-1 text-center md:text-left pt-2 pb-1 md:pb-5">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex flex-col md:flex-row items-center md:justify-start gap-3">
                {store.name}
                {store.kyc_status === 'verified' && (
                  <span title="Vendeur vérifié" className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mt-2 md:mt-0 shadow-sm border border-blue-100">
                    <BadgeCheck className="w-4 h-4 shrink-0" /> Vérifié
                  </span>
                )}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                {store.category && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-bold border border-gray-200">
                    {store.category}
                  </span>
                )}
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5 text-gray-700 font-bold bg-amber-50 px-3 py-1 rounded-md border border-amber-100">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{avgRating > 0 ? avgRating.toFixed(1) : 'Nouveau'}</span>
                  <span className="text-gray-500 font-medium ml-1">({reviewCount} avis)</span>
                </div>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300" />
                <div className="text-gray-700 font-bold text-sm bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
                  {salesCount ?? 0} ventes
                </div>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300" />
                <div className="text-gray-500 font-medium text-sm">
                  Depuis {new Date(store.created_at).getFullYear()}
                </div>
              </div>

              {/* Description */}
              {store.description && (
                <p className="mt-4 text-gray-600 text-sm max-w-2xl text-center md:text-left leading-relaxed font-medium">
                  {store.description}
                </p>
              )}

              {/* Social Links */}
              <div className="mt-5 flex justify-center md:justify-start">
                <StoreSocialLinks socialLinks={socialLinks} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 mt-10 space-y-12">

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
                      <div className="relative w-full h-32">
                        <Image src={page.cover_url} alt={page.title} fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
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

        {/* Footer CTA Vendeur */}
        <div className="pt-16 pb-10">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 xl:mr-10 opacity-10 pointer-events-none">
              <ShoppingBag className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                Vous êtes créateur ou commerçant ?
              </h2>
              <p className="text-gray-300 text-sm md:text-base max-w-xl">
                Rejoignez des centaines d'entrepreneurs et créez votre boutique gratuitement sur PDV Pro en quelques clics, sans compétence technique.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-auto flex-shrink-0">
              <Link href="/register" className="inline-block w-full text-center bg-white text-gray-900 hover:bg-gray-100 font-black py-4 px-8 rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95">
                Ouvrir ma boutique gratuite
              </Link>
            </div>
          </div>
        </div>

        {/* Bouton WhatsApp Flottant via Composant */}
        <WhatsAppFloat phone={waPhone} storeName={store.name} />

        {/* Badge PDV Pro — discret en bas de la page boutique */}
        <PoweredByBadge />
      </div>
    </main>
  )
}
