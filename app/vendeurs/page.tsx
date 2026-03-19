import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Store, Star, Award, TrendingUp, Compass, Search } from 'lucide-react'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Marketplace PDV Pro | Découvrez les meilleurs espaces',
  description: 'Explorez des centaines d&apos;espaces de vente certifiés. Mode, Cosmétiques, Électronique, Alimentation. Achetez en toute sécurité avec Wave & Orange Money.',
  openGraph: {
    title: 'Marketplace PDV Pro',
    description: 'Découvrez les meilleurs espaces de vente d&apos;Afrique de l&apos;Ouest.',
    url: 'https://pdvpro.com/vendeurs',
    siteName: 'PDV Pro',
    images: [{ url: '/og-marketplace.png', width: 1200, height: 630 }],
    locale: 'fr_FR',
    type: 'website',
  }
}

export default async function MarketplacePage() {
  const supabase = await createClient()

  // On récupère les boutiques avec leurs scores et leurs infos de base.
  const { data: storesData } = await supabase
    .from('Store')
    .select(`
      id, 
      name, 
      slug, 
      logo_url, 
      category,
      created_at,
      products:Product(id),
      score:StoreScore(score, featured)
    `)
    .order('name', { ascending: true })
    .limit(100)
 
  // Nettoyage et typage manuel des données.
  const validatedStores = (storesData || []).map((s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const scoreData = Array.isArray(s.score) ? s.score[0] : s.score
    
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      logoUrl: s.logo_url,
      category: s.category || 'Vente générale',
      score: scoreData?.score || 0,
      featured: scoreData?.featured || false,
      productCount: s.products?.length || 0,
      joinedAt: new Date(s.created_at)
    }
  }).filter(Boolean) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans selection:bg-orange-500 selection:text-white">

      {/* ── HEADER NAVIGATION ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center transform -rotate-6">
                <Store className="text-white" size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter hidden sm:block text-ink">PDV<span className="text-emerald">Pro</span></span>
            </Link>
            <Link 
              href="/"
              className="text-sm font-bold text-slate hover:text-emerald transition flex items-center gap-1"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/40" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un espace, une marque..." 
              className="w-full bg-pearl border-transparent focus:bg-white focus:border-emerald focus:ring-2 focus:ring-emerald/10 rounded-full py-2 pl-10 pr-4 text-sm font-medium transition"
            />
          </div>
          
          <Link href="/register" className="bg-emerald hover:bg-emerald-rich text-white px-5 py-2 rounded-full text-sm font-bold transition shadow-md shadow-emerald/20">
            Créer mon espace gratuit →
          </Link>
        </div>
      </header>
      
      {/* ── HERO MARKETPLACE ── */}
      <section className="bg-emerald-deep text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-emerald opacity-20 blur-[100px] rounded-full"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-display font-black mb-4">L&apos;excellence certifiée.</h1>
            <p className="text-white/60 text-lg font-light leading-relaxed">
              Explorez les meilleurs espaces de la plateforme. Chaque vendeur ici présent a satisfait à nos critères stricts de livraison, de qualité et de régularité.
            </p>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
               <TrendingUp className="text-gold mb-3" size={28} />
               <h3 className="text-3xl font-display font-black text-white">Top 1%</h3>
                <p className="text-white/40 text-sm font-mono tracking-wider uppercase">Espaces sélectionnés</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
               <Award className="text-gold mb-3" size={28} />
               <h3 className="text-3xl font-display font-black text-white">&gt; 90%</h3>
               <p className="text-white/40 text-sm font-mono tracking-wider uppercase">Taux de satisfaction</p>
             </div>
          </div>
        </div>
      </section>

      {/* ── GRID BOUTIQUES ── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 font-display font-black text-xl text-ink mb-8 border-b border-line pb-4">
          <Compass className="text-emerald" />
          Découvrir les espaces
        </div>

        {validatedStores.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <Store className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Classement en cours de calcul</h3>
            <p className="text-gray-500 max-w-md mx-auto">Revenez bientôt ! L&apos;algorithme analyse actuellement les performances de nos milliers de vendeurs pour vous proposer la crème de la crème.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {validatedStores.map((s) => (
              <Link  
                href={`/p/${s.slug}`} 
                key={s.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                {/* Header/Cover Fake (Gris clair) */}
                <div className="h-24 bg-gradient-to-tr from-cream to-pearl w-full relative">
                  {s.featured && (
                    <div className="absolute top-3 right-3 bg-emerald text-white text-[10px] font-mono font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                      Premium
                    </div>
                  )}
                </div>
                
                <div className="px-5 pb-5 pt-0 flex-1 flex flex-col relative z-10">
                  {/* Photo de profil (Logo) */}
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md mx-auto -mt-8 mb-3 overflow-hidden">
                    {s.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logoUrl} alt={`Logo ${s.name}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald/10 flex items-center justify-center text-emerald font-display font-black text-xl">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="font-display font-black text-ink text-lg group-hover:text-emerald transition truncate">{s.name}</h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-gold text-[10px] font-mono font-black uppercase tracking-wider">{s.category}</p>
                      <p className="text-slate text-[10px] font-mono">pdvpro.com/p/{s.slug}</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 font-medium text-xs">Score Qualité</span>
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-yellow-400" size={14} />
                        <span className="font-black text-gray-900">{s.score >= 100 ? '99+' : s.score}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm px-1">
                      <span className="text-gray-500 text-xs">Articles en vente</span>
                      <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                        {s.productCount}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6 text-center text-sm text-gray-500 font-medium">
        L&apos;algorithme de classement est mis à jour toutes les 24h. Un score minimal de 50 est recommandé pour apparaître en haut de liste.
      </footer>
    </div>
  )
}
