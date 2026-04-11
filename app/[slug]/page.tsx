/* eslint-disable react/forbid-dom-props */
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getStorePromotions } from '@/lib/promotions/promotionActions'
import SocialProofBanner from '@/components/widgets/SocialProofBanner'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import { StorefrontClient } from './StorefrontClient'

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
      seo_title, seo_description,
      announcement_active, announcement_text, announcement_bg_color,
      is_active, kyc_status, user:User(phone),
      volume_discounts_active, volume_discounts_config,
      smart_reviews_active
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
    title: store.seo_title || `${store.name} — Yayyam`,
    description: store.seo_description || store.description || `Découvrez l'espace de vente de ${store.name}`,
    openGraph: {
      title: store.seo_title || store.name,
      description: store.seo_description || store.description || '',
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
      .select('*')
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
    <StorefrontClient 
      store={store}
      products={products ?? []}
      pages={pages ?? []}
      promotions={promotions}
      salesCount={salesCount ?? 0}
      avgRating={avgRating}
      reviewCount={reviewCount}
      recentReviews={store.smart_reviews_active ? reviews || [] : []}
      waPhone={waPhone}
      socialLinks={socialLinks}
      accent={accent}
      socialProofSlot={
        products && products[0] ? (
          <SocialProofBanner storeId={store.id} productId={products[0].id} stock={99} stockThreshold={10} />
        ) : undefined
      }
    />
  )
}
