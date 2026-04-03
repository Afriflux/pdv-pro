'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, Star, Award, TrendingUp, Compass, Search } from 'lucide-react'

const CATEGORIES = [
  { label: 'Tout', value: '' },
  { label: 'Mode', value: 'mode', emoji: '👗' },
  { label: 'Beauté', value: 'beaute', emoji: '💄' },
  { label: 'Tech', value: 'tech', emoji: '📱' },
  { label: 'Alimentation', value: 'alimentation', emoji: '🍽️' },
  { label: 'Maison', value: 'maison', emoji: '🏠' },
  { label: 'Services', value: 'services', emoji: '🛠️' },
  { label: 'Digital', value: 'digital', emoji: '💻' },
  { label: 'Coaching', value: 'coaching', emoji: '🎓' },
]

export default function MarketplaceClient({ 
  stores, 
  sort,
  isLoggedIn,
  dashboardUrl 
}: { 
  stores: any[], 
  sort: string,
  isLoggedIn?: boolean,
  dashboardUrl?: string
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const filtered = stores.filter(s => {
    const matchSearch = !search || 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !category || s.category?.toLowerCase().includes(category)
    return matchSearch && matchCat
  })

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
              className="text-sm font-bold text-slate hover:text-emerald transition flex items-center gap-1 hidden md:flex"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-4 md:mx-8 relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/40" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un espace..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-pearl border-transparent focus:bg-white focus:border-emerald focus:ring-2 focus:ring-emerald/10 rounded-full py-2 pl-10 pr-4 text-sm font-medium transition"
            />
          </div>
          {isLoggedIn ? (
            <Link href={dashboardUrl || '/login'} className="bg-[#1A1A1A] hover:bg-black text-white px-3 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shadow-md shadow-black/10 whitespace-nowrap">
              Accéder à mon espace
            </Link>
          ) : (
            <Link href="/register" className="bg-emerald hover:bg-emerald-rich text-white px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold transition shadow-md shadow-emerald/20 whitespace-nowrap">
              <span className="hidden md:inline">Créer mon espace</span>
              <span className="md:hidden">Ouvrir</span>
            </Link>
          )}
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
        
        {/* FILTRES CATÉGORIES (Mobile scrollable) */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat.value
                    ? 'bg-emerald text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-line pb-4 mb-8 gap-4">
          <div className="flex items-center gap-2 font-display font-black text-lg md:text-xl text-ink">
            <Compass className="text-emerald" />
            Découvrir les espaces
          </div>
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <span className="text-dust font-medium shrink-0">Trier par :</span>
            <div className="flex bg-pearl p-1 rounded-xl shrink-0">
              <Link href="?sort=best" className={`px-3 md:px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${sort === 'best' ? 'bg-white text-emerald shadow-sm' : 'text-slate hover:text-ink'}`}>Mieux notés</Link>
              <Link href="?sort=products" className={`px-3 md:px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${sort === 'products' ? 'bg-white text-emerald shadow-sm' : 'text-slate hover:text-ink'}`}>Plus de produits</Link>
              <Link href="?sort=newest" className={`px-3 md:px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${sort === 'newest' ? 'bg-white text-emerald shadow-sm' : 'text-slate hover:text-ink'}`}>Plus récents</Link>
            </div>
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <Store className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Classement en cours de calcul</h3>
            <p className="text-gray-500 max-w-md mx-auto">Revenez bientôt ! L&apos;algorithme analyse actuellement les performances de nos milliers de vendeurs pour vous proposer la crème de la crème.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-800 font-bold text-lg">Aucune boutique trouvée</p>
            <p className="text-gray-500 text-sm mt-1">Essayez un autre mot-clé ou modifiez la catégorie</p>
            {(search || category) && (
              <button 
                onClick={() => { setSearch(''); setCategory('') }}
                className="mt-6 bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded-full hover:bg-gray-200 transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((s) => (
              <Link  
                href={`/p/${s.slug}`} 
                key={s.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                {/* Header/Cover Fake */}
                <div className="h-24 bg-gradient-to-tr from-cream to-pearl w-full relative">
                  {s.featured && (
                    <div className="absolute top-3 right-3 bg-emerald text-white text-[10px] font-mono font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                      Premium
                    </div>
                  )}
                </div>
                
                <div className="px-5 pb-5 flex-1 flex flex-col relative z-10">
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
                    <h3 className="font-display font-black text-ink text-lg group-hover:text-emerald transition truncate flex items-center justify-center gap-1">
                      {s.name}
                      {s.score >= 50 && <span title="Vendeur Vérifié" className="flex items-center"><Award size={14} className="text-blue-500 shrink-0" /></span>}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-gold text-[10px] font-mono font-black uppercase tracking-wider line-clamp-1">{s.category}</p>
                      <p className="text-slate text-[10px] font-mono line-clamp-1">pdvpro.com/p/{s.slug}</p>
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

        <div className="mt-20 bg-emerald/10 border border-emerald/20 rounded-3xl p-6 md:p-10 text-center">
          <h2 className="text-xl md:text-2xl font-display font-black text-ink mb-3">Vous êtes vendeur ?</h2>
          <p className="text-slate text-sm md:text-base max-w-md mx-auto mb-6">Rejoignez PDV Pro gratuitement et commencez à vendre vos produits et services en moins de 5 minutes.</p>
          <Link href="/register" className="inline-block bg-emerald text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald/20 hover:bg-emerald-rich hover:-translate-y-1 transition-all">
            Créer ma boutique maintenant
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6 text-center text-sm text-gray-500 font-medium">
        L&apos;algorithme de classement est mis à jour toutes les 24h. Un score minimal de 50 est recommandé pour apparaître en haut de liste.
      </footer>
    </div>
  )
}
