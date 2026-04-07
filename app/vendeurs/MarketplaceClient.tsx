'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, Star, Award, TrendingUp, Compass, Search } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <div className="bg-[#FDFCFB] min-h-screen text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* ── HEADER NAVIGATION ── */}
      <header className="bg-white/70 backdrop-blur-3xl border-b border-white sticky top-0 z-50 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-[12px] shadow-lg flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform">
                <Store className="text-white" size={20} />
              </div>
              <span className="text-2xl font-black tracking-tighter hidden sm:block text-gray-900">Yayyam<span className="text-emerald-500">Pro</span></span>
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-4 md:mx-8 relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une boutique, une agence, un coach..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-[100px] py-3 pl-12 pr-6 text-sm font-medium transition-all shadow-inner outline-none"
            />
          </div>
          {isLoggedIn ? (
            <Link href={dashboardUrl || '/login'} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 whitespace-nowrap">
              Mon espace
            </Link>
          ) : (
            <Link href="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
              <span className="hidden md:inline">Ouvrir ma boutique</span>
              <span className="md:hidden">Ouvrir</span>
            </Link>
          )}
        </div>
      </header>
      
      {/* ── HERO MARKETPLACE SPOTLIGHT ── */}
      <section className="bg-gray-900 text-white py-24 px-6 relative overflow-hidden rounded-b-[48px] md:rounded-b-[80px] shadow-2xl mx-2 mt-2">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-40 left-10 w-[400px] h-[400px] bg-blue-500 opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest mb-6">Marketplace Officielle</span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[1.1]">
              Découvrez la crème <br className="hidden md:block"/> de l'écosystème.
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              Les meilleurs vendeurs, agences et créateurs utilisent Yayyam. Explorez les boutiques certifiées qui génèrent les plus hauts taux de satisfaction.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="hidden lg:grid grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl shadow-2xl">
               <TrendingUp className="text-emerald-400 mb-4" size={32} />
               <h3 className="text-4xl font-black text-white tracking-tighter">Top 1%</h3>
               <p className="text-gray-400 text-xs font-black tracking-widest uppercase mt-2">Vendeurs certifiés</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl shadow-2xl">
               <Award className="text-blue-400 mb-4" size={32} />
               <h3 className="text-4xl font-black text-white tracking-tighter">&gt; 98%</h3>
               <p className="text-gray-400 text-xs font-black tracking-widest uppercase mt-2">Satisfaction client</p>
             </div>
          </motion.div>
        </div>
      </section>

      {/* ── GRID BOUTIQUES ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        
        {/* FILTRES CATÉGORIES (Mobile scrollable) */}
        <div className="mb-12">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/20 font-bold transition-all ${
                  category === cat.value
                    ? 'bg-gray-900 text-white shadow-lg rotate-1 hover:rotate-0 hover:scale-105'
                    : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                {cat.emoji && <span className="mr-2 text-base">{cat.emoji}</span>}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-10 gap-4">
          <div className="flex items-center gap-3 font-black text-2xl text-gray-900 tracking-tight">
            <Compass className="text-emerald-500" size={28} />
            Découvrir les espaces
          </div>
          <div className="flex items-center gap-3 text-sm overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs shrink-0">Trier par</span >
            <div className="flex bg-white border border-gray-100 p-1.5 rounded-full shrink-0 shadow-sm">
              <Link href="?sort=best" className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${sort === 'best' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>Mieux notés</Link>
              <Link href="?sort=products" className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${sort === 'products' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>Plus de produits</Link>
              <Link href="?sort=newest" className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${sort === 'newest' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>Récents</Link>
            </div>
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-32 bg-white/60 backdrop-blur-3xl rounded-[48px] border border-white shadow-2xl shadow-[rgba(0,0,0,0.02)]">
            <Store className="mx-auto text-gray-200 mb-6" size={64} />
            <h3 className="text-2xl font-black text-gray-900 mb-4">Classement en cours</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">L'algorithme analyse actuellement les performances de nos milliers de vendeurs pour vous proposer la crème de la crème.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-white/60 backdrop-blur-3xl rounded-[48px] border border-white shadow-2xl shadow-[rgba(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔍</div>
            <p className="text-gray-900 font-black text-2xl mb-2">Aucune boutique trouvée</p>
            <p className="text-gray-500 font-medium">Essayez un autre mot-clé ou modifiez la catégorie</p>
            {(search || category) && (
              <button 
                onClick={() => { setSearch(''); setCategory('') }}
                className="mt-8 bg-gray-900 text-white font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-xl"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((s, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                key={s.id}
              >
                <Link  
                  href={`/p/${s.slug}`} 
                  className="group bg-white/70 backdrop-blur-2xl rounded-[32px] overflow-hidden border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-[380px]"
                >
                  {/* Header/Cover Fake */}
                  <div className="h-28 bg-gradient-to-tr from-gray-100 to-gray-50 w-full relative">
                    {s.featured && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                        Top 1%
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 pb-6 flex-1 flex flex-col relative z-10">
                    {/* Photo de profil (Logo) */}
                    <div className="w-20 h-20 rounded-full bg-white border-[6px] border-white shadow-xl mx-auto -mt-10 mb-4 overflow-hidden shrink-0">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logoUrl} alt={`Logo ${s.name}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-2xl">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="font-black text-gray-900 text-xl group-hover:text-emerald-600 transition-colors truncate flex items-center justify-center gap-2 mb-1">
                        {s.name}
                        {s.score >= 50 && <span title="Vendeur Vérifié"><Award size={16} className="text-blue-500 shrink-0" /></span>}
                      </h3>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest line-clamp-1">{s.category || 'Non classé'}</p>
                    </div>

                    <div className="mt-auto space-y-2 border-t border-gray-100/50 pt-4">
                      {s.score > 0 && (
                        <div className="flex justify-between items-center text-sm px-3 py-2 bg-gray-50 rounded-xl">
                           <span className="text-gray-500 font-bold text-xs">Excellence</span>
                           <div className="flex items-center gap-1.5">
                             <Star className="text-amber-400 fill-amber-400" size={14} />
                             <span className="font-black text-gray-900">{s.score >= 100 ? '99+' : s.score}</span>
                           </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-sm px-3 py-2">
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Offres</span>
                        <span className="font-black text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs">
                          {s.productCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-32 bg-gray-900 rounded-[48px] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden text-white mx-2 md:mx-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-20 blur-[100px] rounded-full" />
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight relative z-10">Vous êtes vendeur ?</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 font-medium leading-relaxed relative z-10">Rejoignez cet écosystème de classe mondiale. Ouvrez votre boutique en 2 minutes et commencez à vendre instantanément sans limite technique.</p>
          <Link href="/register" className="inline-block bg-white text-gray-900 font-black py-4 px-10 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform text-lg relative z-10">
            Créer ma boutique maintenant
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white/50 border-t border-gray-100 py-10 px-6 text-center text-sm text-gray-400 font-bold uppercase tracking-widest">
        L&apos;algorithme de classement est mis à jour toutes les 24h.
      </footer>
    </div>
  )
}
