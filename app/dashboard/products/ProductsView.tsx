'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/dashboard/ProductCard'
import { toggleProductStatus } from '@/app/actions/products'
import { useTransition } from 'react'
import CopyButton from '@/components/dashboard/CopyButton'
import { Package } from 'lucide-react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Product {
  id: string
  name: string
  price: number
  type: string
  category: string | null
  active: boolean
  images: string[] | null
  created_at: string
  cash_on_delivery: boolean
  description?: string | null
}

interface ProductsViewProps {
  products: Product[]
  storeName: string
  baseUrl: string
}

type ViewMode = 'grid3' | 'grid4' | 'list' | 'large'

// ----------------------------------------------------------------
// Composants internes pour les modes spécifiques
// ----------------------------------------------------------------

/**
 * Rendu mode Liste (Tableau)
 */
function ProductListRow({ product, baseUrl }: { product: Product; baseUrl: string }) {
  const [pending, startTransition] = useTransition()
  
  const handleToggle = () => {
    startTransition(() => {
      toggleProductStatus(product.id, product.active)
    })
  }

  return (
    <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white p-4 rounded-2xl hover:shadow-xl hover:shadow-[#0F7A60]/10 hover:border-[#0F7A60]/20 transition-all duration-300 group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0F7A60]/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Image miniature */}
      <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm relative z-10">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name || "Image du produit"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
        )}
      </div>

      {/* Infos principales */}
      <div className="flex-1 min-w-0">
        <Link href={`/dashboard/products/${product.id}/edit`} className="font-medium text-ink truncate block hover:text-emerald transition-colors">
          {product.name}
        </Link>
        <p className="text-xs text-dust truncate">{product.category || 'Sans catégorie'}</p>
      </div>

      {/* Prix */}
      <div className="w-24 text-right">
        <p className="font-bold text-emerald text-sm">{product.price.toLocaleString('fr-FR')} <span className="text-[10px] font-normal">FCFA</span></p>
      </div>

      {/* Type & Statut */}
      <div className="hidden md:flex items-center gap-2 w-32 justify-center">
        {product.type === 'digital' && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#1D4ED8]">
            Digital
          </span>
        )}
        {product.type === 'physical' && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#D97706]">
            Physique
          </span>
        )}
        {product.type === 'coaching' && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#7C3AED]">
            Coaching
          </span>
        )}
      </div>

      {/* Badge statut cliquable */}
      <div className="w-24 flex justify-center">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`text-xs font-semibold px-2 py-1 rounded-full shadow-sm transition-all ${
            pending ? 'opacity-50 cursor-wait bg-gray-200 text-gray-400' : product.active 
            ? 'bg-[#0D5C4A] text-white hover:bg-red-500' 
            : 'bg-[#6B7280] text-white hover:bg-[#0D5C4A]'
          }`}
        >
          {pending ? '...' : product.active ? 'Actif' : 'Inactif'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <CopyButton url={`${baseUrl}/pay/${product.id}`} compact />
        <Link 
          href={`/dashboard/products/${product.id}/edit`}
          className="p-2 text-slate hover:text-emerald hover:bg-emerald/5 rounded-lg transition"
          title="Modifier"
        >
          ✏️
        </Link>
      </div>
    </div>
  )
}

/**
 * Rendu mode Large
 */
function LargeProductCard({ product, baseUrl }: { product: Product; baseUrl: string }) {
  const [pending, startTransition] = useTransition()
  
  const handleToggle = () => {
    startTransition(() => {
      toggleProductStatus(product.id, product.active)
    })
  }

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white hover:border-[#0F7A60]/30 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 flex flex-col md:flex-row h-full group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Image large */}
      <div className="md:w-2/5 aspect-[16/10] md:aspect-auto relative bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100/50 overflow-hidden z-10">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name || "Image du produit"} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50">📦</div>
        )}
        
        {/* Badges flottants */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.cash_on_delivery && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#D97706] shadow-sm">
              COD
            </span>
          )}
          {product.type === 'digital' && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#1D4ED8] shadow-sm">
              Digital
            </span>
          )}
          {product.type === 'coaching' && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-[#7C3AED] shadow-sm">
              Coaching
            </span>
          )}
        </div>
      </div>

      {/* Texte et contenus */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/dashboard/products/${product.id}/edit`} className="hover:text-emerald transition-colors">
            <h3 className="font-display text-2xl font-black text-ink leading-tight line-clamp-2">{product.name}</h3>
          </Link>
          <button
            onClick={handleToggle}
            disabled={pending}
            className={`text-xs font-semibold px-2 py-1 rounded-full shadow-sm transition-all ${
              pending ? 'opacity-50' : product.active 
              ? 'bg-[#0D5C4A] text-white hover:bg-red-500' 
              : 'bg-[#6B7280] text-white hover:bg-[#0D5C4A]'
            }`}
          >
            {pending ? '...' : product.active ? 'Actif' : 'Inactif'}
          </button>
        </div>

        {product.category && <p className="text-emerald font-bold text-sm tracking-widest uppercase mb-3 px-2 py-0.5 bg-emerald/5 rounded-lg w-fit">{product.category}</p>}
        
        <p className="text-slate text-sm line-clamp-3 mb-6 flex-1">
          {product.description || "Aucune description pour ce produit."}
        </p>

        <div className="flex items-end justify-between mt-auto pt-6 border-t border-line">
          <div>
            <p className="text-dust text-xs font-medium uppercase tracking-wider mb-1">Prix de vente</p>
            <p className="font-display text-3xl font-black text-emerald">
              {product.price.toLocaleString('fr-FR')} <span className="text-sm font-sans font-normal text-dust">FCFA</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <CopyButton url={`${baseUrl}/pay/${product.id}`} />
            <Link 
              href={`/dashboard/products/${product.id}/edit`}
              className="px-6 py-3 bg-ink text-white rounded-xl font-bold hover:bg-slate transition shadow-lg shadow-ink/10 flex items-center gap-2"
            >
              ✏️ Modifier
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Composant Principal
// ----------------------------------------------------------------

export default function ProductsView({ products, storeName, baseUrl }: ProductsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid3')
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger la preference au montage
  useEffect(() => {
    const saved = localStorage.getItem('products-view-mode') as ViewMode
    if (saved && ['grid3', 'grid4', 'list', 'large'].includes(saved)) {
      setViewMode(saved)
    }
    setIsLoaded(true)
  }, [])

  // Sauvegarder la preference
  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('products-view-mode', mode)
  }

  if (!isLoaded) return <div className="p-12 text-center text-dust">Chargement de la vue...</div>

  // Configuration de la grille selon le mode
  const gridClassName = {
    grid3: 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    grid4: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    list:  'flex flex-col gap-2',
    large: 'grid grid-cols-1 xl:grid-cols-2 gap-6',
  }[viewMode]

  return (
    <>
      {/* Barre d'outils (Toggle) */}
      <div className="flex items-center justify-between mb-6 px-6">
        <p className="text-gray-500 text-sm font-medium">
          {products.length} produit{products.length > 1 ? 's' : ''} dans votre catalogue ({storeName})
        </p>
        
        <div className="flex bg-white/80 backdrop-blur-xl border border-white rounded-xl p-1 gap-1 shadow-sm">
          {(['grid3', 'grid4', 'list', 'large'] as const).map((mode) => {
            const icons = { grid3: '▥', grid4: '⊟', list: '▤', large: '⊡' }
            const labels = { grid3: 'Grille 3', grid4: 'Grille 4', list: 'Liste', large: 'Grandes' }
            
            return (
              <button
                key={mode}
                onClick={() => updateViewMode(mode)}
                title={labels[mode]}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === mode 
                  ? 'bg-gold text-white shadow-md shadow-gold/20' 
                  : 'text-dust hover:text-ink hover:bg-white'
                }`}
              >
                <span className="text-xl leading-none">{icons[mode]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu de la liste */}
      <div className="w-full p-6 pt-0">
        {products.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-20 text-center flex flex-col items-center justify-center shadow-xl shadow-gray-200/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0F7A60]/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="w-24 h-24 mb-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:text-[#0F7A60] group-hover:rotate-3 transition-all duration-500 relative z-10">
              <Package size={48} strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-[#1A1A1A] text-2xl font-black mb-3 relative z-10">Aucun produit pour le moment</h3>
            <p className="text-gray-500 font-medium text-sm mb-8 max-w-sm mx-auto relative z-10 leading-relaxed">
              Ajoutez votre premier produit pour commencer à générer des ventes et développer votre activité.
            </p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 bg-gradient-to-br from-[#0F7A60] to-[#0D5C4A] hover:to-[#0A4A3A] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-[#0F7A60]/20 hover:shadow-xl hover:shadow-[#0F7A60]/40 hover:-translate-y-1 transition-all duration-300 relative z-10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              Créer mon premier produit →
            </Link>
          </div>
        ) : (
          <div className={gridClassName}>
            {products.map(product => {
              // Rendu différent selon le mode
              if (viewMode === 'list') {
                return <ProductListRow key={product.id} product={product} baseUrl={baseUrl} />
              }
              if (viewMode === 'large') {
                return <LargeProductCard key={product.id} product={product} baseUrl={baseUrl} />
              }
              // Les modes grid utilisent ProductCard avec des ajustements optionnels
              const displayMode = viewMode === 'grid3' || viewMode === 'grid4' ? viewMode : 'grid3'
              return <ProductCard key={product.id} product={product} baseUrl={baseUrl} displayMode={displayMode} />
            })}
          </div>
        )}
      </div>
    </>
  )
}
