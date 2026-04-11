'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { computeProductPrice } from '@/lib/promotions/promotionUtils'
import { FlashCountdown } from '@/components/Promotions/FlashCountdown'
import { PromotionData } from '@/lib/promotions/promotionType'
import { Search, ChevronDown, ShoppingBag, Heart, Eye, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string[]
  type: string
  category: string | null
  cash_on_delivery: boolean
}

interface ProductGridProps {
  products: Product[]
  promotions: PromotionData[]
  accent: string
}

const TYPE_LABELS: Record<string, string> = {
  digital:  '📥 Digital',
  physical: '📦 Physique',
  coaching: '🎯 Coaching',
}

const PRODUCTS_PER_PAGE = 12

// ─── Wishlist helpers (localStorage) ──────────────────────────────────────────
function getWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('yayyam_wishlist') || '[]')
  } catch { return [] }
}
function toggleWishlistItem(id: string): string[] {
  const current = getWishlist()
  const next = current.includes(id)
    ? current.filter(x => x !== id)
    : [...current, id]
  localStorage.setItem('yayyam_wishlist', JSON.stringify(next))
  return next
}

export function ProductGrid({ products, promotions, accent }: ProductGridProps) {
  // States filtres et tri
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  // Init wishlist côté client
  useEffect(() => { setWishlist(getWishlist()) }, [])

  const handleToggleWishlist = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlist(toggleWishlistItem(productId))
  }, [])

  const handleQuickView = useCallback((e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewProduct(product)
  }, [])

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // 1. Recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }

    // 2. Filtre Type
    if (filterType !== 'all') {
      result = result.filter(p => p.type === filterType)
    }

    // 2b. Filtre Catégorie
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory)
    }

    // 3. Tri
    result.sort((a, b) => {
      const priceA = computeProductPrice(a.price, a.id, promotions).finalPrice
      const priceB = computeProductPrice(b.price, b.id, promotions).finalPrice
      
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      return 0
    })

    return result
  }, [products, searchQuery, filterType, filterCategory, sortBy, promotions])

  const visibleProducts = filteredAndSortedProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAndSortedProducts.length

  const typeOptions = [
    { id: 'all', label: 'Tous' },
    { id: 'physical', label: '📦 Physiques' },
    { id: 'digital', label: '📥 Digitaux' },
    { id: 'coaching', label: '🎯 Coaching' },
  ]
  const availableTypes = ['all', ...Array.from(new Set(products.map(p => p.type)))]

  // Catégories disponibles
  const availableCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 focus:border-[#0F7A60] rounded-xl text-sm font-medium outline-none transition-all shadow-sm"
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm cursor-pointer">
               {typeOptions.filter(t => availableTypes.includes(t.id)).map(opt => (
                 <button 
                    key={opt.id}
                    onClick={() => setFilterType(opt.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterType === opt.id ? 'bg-gray-100 shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   {opt.label}
                 </button>
               ))}
             </div>
             
             <div className="relative min-w-[140px]">
               <select 
                  title="Trier les produits"
                  aria-label="Trier les produits"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 shadow-sm pl-4 pr-10 py-2 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer focus:border-[#0F7A60]"
               >
                 <option value="newest">Plus récents</option>
                 <option value="price_asc">Prix croissant</option>
                 <option value="price_desc">Prix décroissant</option>
               </select>
               <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>
         </div>

         {/* Chips de catégorie */}
         {availableCategories.length > 1 && (
           <div className="flex items-center gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
             <button
               onClick={() => setFilterCategory('all')}
               className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                 filterCategory === 'all'
                   ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                   : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
               }`}
             >
               Toutes catégories
             </button>
             {availableCategories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setFilterCategory(cat)}
                 className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                   filterCategory === cat
                     ? 'text-white shadow-sm'
                     : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
                 }`}
                 style={filterCategory === cat ? { backgroundColor: accent, borderColor: accent } : undefined}
               >
                 {cat}
               </button>
             ))}
           </div>
         )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {visibleProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
             Aucun produit ne correspond à votre recherche.
          </div>
        ) : visibleProducts.map(product => {
          const computed = computeProductPrice(product.price, product.id, promotions)
          const isWishlisted = wishlist.includes(product.id)
          return (
             <Link key={product.id} href={`/checkout/${product.id}`} className="block group h-full">
               <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
                 
                 {/* Image Section */}
                 <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw"
                           className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40"
                           // eslint-disable-next-line
                           {...{ style: { color: accent, background: accent + '11' } }}>
                        {product.type === 'digital' ? '📥' : product.type === 'coaching' ? '🎯' : '📦'}
                      </div>
                    )}

                    {/* Overlay Hover Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center z-20 gap-2">
                       {/* Quick View */}
                       <button
                         onClick={(e) => handleQuickView(e, product)}
                         className="bg-white text-gray-900 font-bold p-3 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                         title="Aperçu rapide"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <Link 
                         href={`/checkout/${product.id}`}
                         className="bg-white text-gray-900 font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 text-sm"
                       >
                         <ShoppingBag className="w-4 h-4" />
                         Voir
                       </Link>
                    </div>

                    {/* Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-none">
                       <span className="text-[10px] sm:text-xs font-black bg-white/95 backdrop-blur-md text-gray-800 px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest border border-gray-200/50">
                         {TYPE_LABELS[product.type] ?? product.type}
                       </span>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
                       {/* Wishlist heart */}
                       <button
                         onClick={(e) => handleToggleWishlist(e, product.id)}
                         className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                           isWishlisted
                             ? 'bg-red-500 text-white scale-110'
                             : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 hover:scale-110'
                         }`}
                         title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                       >
                         <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
                       </button>
                       {product.cash_on_delivery && (
                         <span className="text-[10px] sm:text-xs font-black bg-amber-500 text-white px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest pointer-events-none">
                           COD
                         </span>
                       )}
                       {computed.hasDiscount && (
                         <span className="text-[10px] sm:text-xs font-black bg-[#E23636] text-white px-2.5 py-1 rounded-md shadow-sm pointer-events-none">
                           - {Math.round((1 - computed.finalPrice / product.price) * 100)}%
                         </span>
                       )}
                    </div>
                 </div>

                 {/* Info Section */}
                 <div className="p-3 md:p-5 flex flex-col flex-grow">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:underline decoration-2 transition-all mb-3 md:mb-4"
                        {...{ style: { textDecorationColor: accent } }}>
                      {product.name}
                    </h3>
                    
                    {computed.activePromo?.type === 'flash' && computed.activePromo.ends_at && (
                      <div className="mb-3">
                        <FlashCountdown 
                          promoId={computed.activePromo.id} 
                          title={computed.activePromo.title} 
                          endsAt={computed.activePromo.ends_at} 
                        />
                      </div>
                    )}
                    
                    <div className="mt-auto flex items-end justify-between">
                       <div className="flex flex-col">
                         {computed.hasDiscount && (
                           <span className="text-xs md:text-sm text-gray-400 line-through font-semibold mb-0.5">
                             {product.price.toLocaleString('fr-FR')} F
                           </span>
                         )}
                         <span className="text-base md:text-lg font-black" {...{ style: { color: accent } }}>
                           {computed.finalPrice.toLocaleString('fr-FR')} <span className="text-xs font-bold text-gray-500">FCFA</span>
                         </span>
                       </div>
                    </div>
                 </div>
               </div>
             </Link>
          )
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
            className="px-8 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:border-gray-400 hover:shadow-md transition-all active:scale-95"
          >
            Voir plus de produits ({filteredAndSortedProducts.length - visibleCount} restants)
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (() => {
        const computed = computeProductPrice(quickViewProduct.price, quickViewProduct.id, promotions)
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setQuickViewProduct(null)}>
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-1/2 aspect-square relative bg-gray-50">
                  {quickViewProduct.images?.[0] ? (
                    <Image src={quickViewProduct.images[0]} alt={quickViewProduct.name} fill className="object-cover" sizes="400px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30" {...{ style: { color: accent } }}>
                      {quickViewProduct.type === 'digital' ? '📥' : '📦'}
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
                  <button onClick={() => setQuickViewProduct(null)} title="Fermer" aria-label="Fermer" className="self-end w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full mb-4 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    {TYPE_LABELS[quickViewProduct.type] ?? quickViewProduct.type}
                  </span>
                  <h2 className="text-xl font-black text-gray-900 mb-3 leading-tight">{quickViewProduct.name}</h2>
                  
                  {quickViewProduct.description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-4">{quickViewProduct.description}</p>
                  )}
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-baseline gap-2">
                      {computed.hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">{quickViewProduct.price.toLocaleString('fr-FR')} F</span>
                      )}
                      <span className="text-2xl font-black" {...{ style: { color: accent } }}>
                        {computed.finalPrice.toLocaleString('fr-FR')} <span className="text-sm text-gray-400">FCFA</span>
                      </span>
                    </div>
                    
                    <Link 
                      href={`/checkout/${quickViewProduct.id}`}
                      onClick={() => setQuickViewProduct(null)}
                      className="block w-full text-white font-black py-3.5 rounded-xl text-sm text-center transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                      {...{ style: { backgroundColor: accent } }}
                    >
                      Voir le produit complet →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
