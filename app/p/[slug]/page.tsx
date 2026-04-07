import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { YayyamAnalytics } from '@/components/tracking/YayyamAnalytics'
import { AffiliateTracker } from '@/components/tracking/AffiliateTracker'
import { LiveCheckoutDrawer } from '@/components/pages/LiveCheckoutDrawer'
import { 
  Section, Product, Theme, DEFAULT_THEME, PageRendererConfig,
  HeroSection, BenefitsSection, TestimonialsSection, FaqSection, 
  ProgramSection, CoachProfileSection, ImageGallerySection, CtaSection, 
  ProductCards, GenericSection,
  CountdownSection, ComparisonSection, VideoGallerySection, CrossSellSection
} from '@/components/pages/PageRenderers'
import { AnnouncementBar, StickyMobileCTA, SalesPops, ExitIntentPopup, ScrollReveal } from '@/components/pages/StorefrontFeatures'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface SalePagePublicProps {
  params: { slug: string }
}

// ----------------------------------------------------------------
// Meta & SEO
// ----------------------------------------------------------------
export async function generateMetadata({ params }: SalePagePublicProps): Promise<Metadata> {
  const supabase = await createClient()

  // On cherche d'abord la SalePage
  const { data: page } = await supabase
    .from('SalePage')
    .select('*, store:Store(name, slug)')
    .eq('slug', params.slug)
    .single()

  if (!page) {
    // Si pas de SalePage, on vérifie si c'est une boutique
    const { data: store } = await supabase
      .from('Store')
      .select('name, description')
      .eq('slug', params.slug)
      .single()
    
    if (store) {
      return { 
        title: `${store.name} | Yayyam`,
        description: store.description 
      }
    }
    return { title: 'Page non trouvée | Yayyam' }
  }

  const sections = (page.sections as Section[]) ?? []
  const desc = sections.find(s => s.type === 'hero')?.subtitle ?? page.title

  const storeData = page.store as unknown as { name: string } | { name: string }[]
  const storeName = Array.isArray(storeData) ? storeData[0]?.name : storeData?.name

  return {
    title: `${page.title} | ${storeName || 'Espace'}`,
    description: desc,
    openGraph: {
      title: page.title,
      description: desc,
      url: `https://yayyam.com/p/${params.slug}`,
      siteName: storeName || 'Yayyam',
      images: [
        {
          url: '/og-image.svg',
          width: 1200,
          height: 630,
        },
      ],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: desc,
    }
  }
}

// ----------------------------------------------------------------
// Page publique
// ----------------------------------------------------------------
export default async function PublicSalePage({ params }: SalePagePublicProps) {
  const supabase = await createClient()

  // On cherche d'abord la SalePage
  const { data: page } = await supabase
    .from('SalePage')
    .select('*, store:Store(name)')
    .eq('slug', params.slug)
    .single()

  if (!page) {
    // Si pas de SalePage, on vérifie si c'est une boutique
    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (store) {
      redirect(`/${params.slug}`)
    }
    notFound()
  }

  // Incrémenter le compteur de vues
  const currentViews = page.views_count || 0
  await supabase.from('SalePage').update({ views_count: currentViews + 1 }).eq('id', page.id)

  // Charger les produits liés
  let linkedProducts: Product[] = []
  if (page.product_ids?.length > 0) {
    const { data } = await supabase
      .from('Product')
      .select('id, name, description, price, type, images')
      .in('id', page.product_ids)
      .eq('active', true)
    linkedProducts = data ?? []
  }

  const sections = (page.sections as Section[]) ?? []
  const ctaText = sections.find(s => s.type === 'cta')?.cta ?? 'Commander maintenant'
  
  // Extraire le thème s'il existe (stocké dans un bloc { type: 'theme' })
  const themeSection = sections.find(s => s.type === 'theme') as unknown as Theme | undefined
  const theme = themeSection ? { color: themeSection.color || 'orange', font: themeSection.font || 'sans' } as Theme : DEFAULT_THEME

  // On retire le bloc theme des sections visuelles
  const visualSections = sections.filter(s => s.type !== 'theme')

  // Fetch cross-sell products from the exact same store, excluding the currently linked products
  let crossSellProducts: Product[] = []
  if (page.store_id) {
    const { data: storeProducts } = await supabase
      .from('Product')
      .select('id, name, description, price, type, images')
      .eq('store_id', page.store_id)
      .eq('active', true)
      .not('id', 'in', page.product_ids && page.product_ids.length > 0 ? `(${page.product_ids.join(',')})` : '(00000000-0000-0000-0000-000000000000)') // Supabase IN syntax hack for empty arrays
      .limit(4)
    crossSellProducts = storeProducts ?? []
  }

  return (
    <PageRendererConfig theme={theme}>
      <main className="min-h-screen antialiased flex flex-col relative overflow-x-hidden">
          <AnnouncementBar theme={theme} />
          
          <YayyamAnalytics pageId={page.id} />
          
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          
          {/* Sections dans l'ordre, wrappées avec Scroll Reveal */}
          {visualSections.map((s, i) => {
            const SectionEl = (
              s.type === 'hero'         ? <HeroSection key={i} s={s} products={linkedProducts} cta={ctaText} theme={theme} /> :
              s.type === 'benefits'     ? <BenefitsSection key={i} s={s} theme={theme} /> :
              s.type === 'testimonials' ? <TestimonialsSection key={i} s={s} theme={theme} /> :
              s.type === 'faq'          ? <FaqSection key={i} s={s} theme={theme} /> :
              s.type === 'program'      ? <ProgramSection key={i} s={s} theme={theme} /> :
              s.type === 'coach'        ? <CoachProfileSection key={i} s={s} theme={theme} /> :
              s.type === 'gallery'      ? <ImageGallerySection key={i} s={s} theme={theme} /> :
              s.type === 'cta'          ? <CtaSection key={i} s={s} products={linkedProducts} theme={theme} /> :
              s.type === 'countdown'    ? <CountdownSection key={i} s={s} theme={theme} /> :
              s.type === 'comparison'   ? <ComparisonSection key={i} s={s} theme={theme} /> :
              s.type === 'video'        ? <VideoGallerySection key={i} s={s} theme={theme} /> :
              <GenericSection key={i} s={s} />
            )

            // On ne met pas de ScrollReveal sur le Hero pour un LCP rapide, ni Countdown
            if (s.type === 'hero' || s.type === 'countdown') return SectionEl
            
            return (
              <ScrollReveal key={i}>
                 {SectionEl}
              </ScrollReveal>
            )
          })}

          {/* Bloc produits (Boutons d'achat statiques) */}
          <ScrollReveal>
             <ProductCards products={linkedProducts} theme={theme} />
          </ScrollReveal>

          {/* Section Cross-Sell */}
          {crossSellProducts.length > 0 && (
             <ScrollReveal>
                <CrossSellSection products={crossSellProducts} theme={theme} />
             </ScrollReveal>
          )}

          {/* Checkout Drawer (Slide-over) */}
          <LiveCheckoutDrawer 
            pageId={page.id} 
            products={[...linkedProducts, ...crossSellProducts]} // Support checkout for cross-sell as well
            theme={theme}
            storeName={page.store?.name}
          />

          {/* Fonctions de Conversion Ultra (Global) */}
          <SalesPops />
          <ExitIntentPopup productId={linkedProducts[0]?.id} theme={theme} />
          {linkedProducts[0] && (
            <StickyMobileCTA productId={linkedProducts[0].id} price={linkedProducts[0].price} theme={theme} />
          )}

          {/* Footer minimal */}
          <footer className="py-10 px-6 bg-gray-900 text-center">
            <p className="text-gray-400 text-sm">
              Propulsé par <span className="text-white font-bold tracking-wide">Yayyam</span>
              {page.store?.name && <span className="opacity-50"> · {page.store.name}</span>}
            </p>
          </footer>
      </main>
    </PageRendererConfig>
  )
}
