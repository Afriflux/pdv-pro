import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { PDVAnalytics } from '@/components/tracking/PDVAnalytics'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Section {
  type: string
  title?: string
  subtitle?: string
  cta?: string
  text?: string
  items?: string[] | Array<{ q?: string; a?: string; name?: string; text?: string; rating?: number }>
  name?: string
  bio?: string
  credentials?: string[]
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  type: string
  images: string[]
}

interface SalePagePublicProps {
  params: { slug: string }
}

// ----------------------------------------------------------------
// Section renderers
// ----------------------------------------------------------------
function HeroSection({ s, products, cta }: { s: Section; products: Product[]; cta: string }) {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20 px-6 text-center overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500 opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
          {s.title ?? 'Bienvenue'}
        </h1>
        {s.subtitle && (
          <p className="text-gray-300 text-lg">{s.subtitle}</p>
        )}

        {/* Produits */}
        {products.length > 0 && (
          <div className="space-y-3 mt-8">
            {products.map(p => (
              <a
                key={p.id}
                href={`#product-${p.id}`}
                className="block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl text-lg transition shadow-lg shadow-orange-500/30"
              >
                {s.cta ?? cta} — {p.price.toLocaleString('fr-FR')} FCFA
              </a>
            ))}
          </div>
        )}
        {products.length === 0 && s.cta && (
          <a href="#contact"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-2xl text-lg transition">
            {s.cta}
          </a>
        )}
      </div>
    </section>
  )
}

function BenefitsSection({ s }: { s: Section }) {
  const items = (s.items as string[] | undefined) ?? []
  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8">Pourquoi nous choisir ?</h2>
        <div className="grid grid-cols-1 gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-orange-50 rounded-2xl p-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">✓</div>
              <span className="text-gray-700 font-medium">{typeof item === 'string' ? item : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection({ s }: { s: Section }) {
  const items = (s.items as Array<{ name: string; text: string; rating: number }> | undefined) ?? []
  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8">Ce que disent nos clients</h2>
        <div className="space-y-4">
          {items.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1 mb-2">
                {'★★★★★'.split('').map((star, si) => (
                  <span key={si} className={si < (t.rating ?? 5) ? 'text-orange-400' : 'text-gray-200'}>{star}</span>
                ))}
              </div>
              <p className="text-gray-600 text-sm italic mb-3">&ldquo;{t.text}&rdquo;</p>
              <p className="text-sm font-semibold text-gray-800">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqSection({ s }: { s: Section }) {
  const items = (s.items as Array<{ q: string; a: string }> | undefined) ?? []
  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8">Questions fréquentes</h2>
        <div className="space-y-4">
          {items.map((qa, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-5">
              <p className="font-semibold text-gray-800 mb-2">❓ {qa.q}</p>
              <p className="text-gray-500 text-sm">{qa.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProgramSection({ s }: { s: Section }) {
  const items = (s.items as string[] | undefined) ?? []
  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8">Programme</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
              <span className="text-gray-700">{typeof item === 'string' ? item : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection({ s, products }: { s: Section; products: Product[] }) {
  return (
    <section className="py-16 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center">
      <div className="max-w-xl mx-auto space-y-4">
        <p className="text-xl font-bold">{s.cta ?? 'Passer commande maintenant'}</p>
        {products.map(p => (
          <a
            key={p.id}
            href={`#product-${p.id}`}
            className="inline-block bg-white text-orange-600 font-bold py-4 px-10 rounded-2xl text-lg hover:bg-gray-50 transition shadow-lg"
          >
            Commander — {p.price.toLocaleString('fr-FR')} FCFA
          </a>
        ))}
      </div>
    </section>
  )
}

function ProductCards({ products }: { products: Product[] }) {
  if (products.length === 0) return null
  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8">Nos produits</h2>
        <div className="space-y-5">
          {products.map(p => (
            <div key={p.id} id={`product-${p.id}`} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {p.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt={p.name} className="w-full h-52 object-cover" />
              )}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                {p.description && <p className="text-gray-500 text-sm">{p.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-orange-500">
                    {p.price.toLocaleString('fr-FR')} <span className="text-base font-medium">FCFA</span>
                  </span>
                  <a
                    href={`/checkout/${p.id}`}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    Acheter
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GenericSection({ s }: { s: Section }) {
  return (
    <section className="py-12 px-6 bg-white">
      <div className="max-w-xl mx-auto text-center">
        {s.text && <p className="text-gray-600">{s.text}</p>}
      </div>
    </section>
  )
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
        title: `${store.name} | PDV Pro`,
        description: store.description 
      }
    }
    return { title: 'Page non trouvée | PDV Pro' }
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
      url: `https://pdvpro.com/p/${params.slug}`,
      siteName: storeName || 'PDV Pro',
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

  return (
    <main className="min-h-screen font-sans antialiased">
        <PDVAnalytics pageId={page.id} />
        {/* Sections dans l'ordre */}
        {sections.map((s, i) => {
          if (s.type === 'hero')         return <HeroSection key={i} s={s} products={linkedProducts} cta={ctaText} />
          if (s.type === 'benefits')     return <BenefitsSection key={i} s={s} />
          if (s.type === 'testimonials') return <TestimonialsSection key={i} s={s} />
          if (s.type === 'faq')          return <FaqSection key={i} s={s} />
          if (s.type === 'program')      return <ProgramSection key={i} s={s} />
          if (s.type === 'cta')          return <CtaSection key={i} s={s} products={linkedProducts} />
          return <GenericSection key={i} s={s} />
        })}

        {/* Bloc produits */}
        <ProductCards products={linkedProducts} />

        {/* Footer minimal */}
        <footer className="py-8 px-6 bg-gray-900 text-center">
          <p className="text-gray-500 text-sm">
            Propulsé par <span className="text-orange-400 font-semibold">PDV Pro</span>
            {page.store?.name && <span className="text-gray-600"> · {page.store.name}</span>}
          </p>
        </footer>
    </main>
  )
}
