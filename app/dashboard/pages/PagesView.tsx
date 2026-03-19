'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import SalePageCard from '@/components/dashboard/SalePageCard'
import { togglePageStatus, deletePage, duplicatePage } from '@/app/actions/pages'
import { Trash2, Copy, Edit, Link as LinkIcon, Check } from 'lucide-react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface SalePage {
  id: string
  title: string
  slug: string
  template: string
  active: boolean
  created_at: string
  product_ids: string[] | null
}

interface PagesViewProps {
  pages: SalePage[]
  storeName: string
}

type ViewMode = 'grid3' | 'grid4' | 'list' | 'large'

// Icônes de templates pour l'affichage
const TEMPLATE_ICONS: Record<string, string> = {
  beauty:     '💄',
  ebook:      '📚',
  formation:  '🎓',
  food:       '🍽️',
  fashion:    '👗',
  services:   '💻',
  coaching:   '🏋️',
  ecommerce:  '🛒',
  music:      '🎵',
  event:      '🎟️',
}

const TEMPLATE_LABELS: Record<string, string> = {
  beauty:     'Parfumerie & Beauté',
  ebook:      'Ebook & Digital',
  formation:  'Formation & Cours',
  food:       'Restauration & Food',
  fashion:    'Mode & Vêtements',
  services:   'Services Digitaux',
  coaching:   'Coaching & Bien-être',
  ecommerce:  'E-commerce Général',
  music:      'Musique & Arts',
  event:      'Événement & Billet',
}

// ----------------------------------------------------------------
// Composants internes
// ----------------------------------------------------------------

function PageListRow({ page }: { page: SalePage }) {
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  
  const handleToggle = () => {
    startTransition(() => {
      togglePageStatus(page.id, page.active)
    })
  }

  const handleDelete = () => {
    if (!confirm('Supprimer cette page ?')) return
    startTransition(() => {
      deletePage(page.id)
    })
  }

  const handleDuplicate = () => {
    startTransition(() => {
      duplicatePage(page.id)
    })
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${page.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-100 p-3 rounded-2xl hover:shadow-lg transition-all group px-5">
      <div className="w-12 h-12 rounded-xl bg-[#F9F9F6] border border-gray-50 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
        {TEMPLATE_ICONS[page.template] ?? '🛍️'}
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/dashboard/pages/${page.id}/edit`} className="font-bold text-ink truncate block hover:text-gold transition-colors text-sm">
          {page.title}
        </Link>
        <p className="text-[10px] text-emerald font-black truncate uppercase tracking-widest mt-0.5">/{page.slug}</p>
      </div>

      <div className="hidden lg:block w-48">
         <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{TEMPLATE_LABELS[page.template] || page.template}</p>
      </div>

      <div className="w-28 flex justify-center">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full border transition-all uppercase ${
            pending ? 'opacity-50 cursor-wait' : page.active 
            ? 'bg-emerald text-white border-emerald/10' 
            : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-emerald hover:border-emerald/20'
          }`}
        >
          {page.active ? 'Publiée' : 'Brouillon'}
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={handleCopyLink} className="p-2.5 text-gray-300 hover:text-gold hover:bg-gold/5 rounded-xl transition" title="Copier le lien">
          {copied ? <Check size={16} className="text-emerald" /> : <LinkIcon size={16} />}
        </button>
        <button onClick={handleDuplicate} className="p-2.5 text-gray-300 hover:text-gold hover:bg-gold/5 rounded-xl transition" title="Dupliquer">
          <Copy size={16} />
        </button>
        <Link href={`/dashboard/pages/${page.id}/edit`} className="p-2.5 text-gray-300 hover:text-gold hover:bg-gold/5 rounded-xl transition" title="Modifier">
          <Edit size={16} />
        </Link>
        <button onClick={handleDelete} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition" title="Supprimer">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function LargePageCard({ page }: { page: SalePage }) {
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  
  const handleToggle = () => {
    startTransition(() => {
      togglePageStatus(page.id, page.active)
    })
  }

  const handleDelete = () => {
    if (!confirm('Supprimer cette page ?')) return
    startTransition(() => {
      deletePage(page.id)
    })
  }

  const handleDuplicate = () => {
    startTransition(() => {
      duplicatePage(page.id)
    })
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${page.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all flex flex-col md:row-span-1 md:flex-row group min-h-[220px]">
      <div className="md:w-1/3 min-h-[200px] md:min-h-0 relative bg-[#F9F9F6] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-gray-50">
        <div className="text-8xl group-hover:scale-110 transition-transform duration-500 opacity-80">
           {TEMPLATE_ICONS[page.template] ?? '🛍️'}
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link href={`/dashboard/pages/${page.id}/edit`} className="hover:text-gold transition-colors block mb-1">
              <h3 className="font-display text-2xl font-black text-ink leading-tight line-clamp-1">{page.title}</h3>
            </Link>
            <p className="text-xs text-emerald font-black uppercase tracking-[0.2em]">
              /{page.slug}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={pending}
            className={`text-[10px] font-black tracking-widest px-4 py-2 rounded-full border transition-all uppercase ${
              pending ? 'opacity-50' : page.active 
              ? 'bg-emerald text-white border-emerald/10 shadow-lg shadow-emerald/10' 
              : 'bg-gray-50 text-gray-400 border-gray-100'
            }`}
          >
            {page.active ? 'Publiée' : 'Brouillon'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
           <span className="text-[10px] bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border border-gray-100/50">
             {TEMPLATE_LABELS[page.template] || page.template}
           </span>
           {page.product_ids && page.product_ids.length > 0 && (
              <span className="text-[10px] bg-gold/5 text-gold px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border border-gold/10">
                {page.product_ids.length} Produit{page.product_ids.length > 1 ? 's' : ''}
              </span>
           )}
        </div>

        <div className="flex items-center gap-3 mt-auto">
           <Link 
              href={`/dashboard/pages/${page.id}/edit`}
              className="flex-1 bg-ink text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate transition text-center shadow-xl shadow-ink/10 flex items-center justify-center gap-2"
            >
              <Edit size={16} /> Modifier
            </Link>
            <button onClick={handleCopyLink} className="w-14 h-14 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-ink hover:bg-gray-50 transition" title="Copier le lien">
              {copied ? <Check size={20} className="text-emerald" /> : <LinkIcon size={20} />}
            </button>
            <button onClick={handleDuplicate} className="w-14 h-14 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-ink hover:bg-gray-50 transition" title="Dupliquer">
              <Copy size={20} />
            </button>
            <button onClick={handleDelete} className="w-14 h-14 flex items-center justify-center border border-gray-100 rounded-2xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition" title="Supprimer">
              <Trash2 size={20} />
            </button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Composant Principal
// ----------------------------------------------------------------

export default function PagesView({ pages }: PagesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid3')
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger la preference au montage
  useEffect(() => {
    const saved = localStorage.getItem('pages-view-mode') as ViewMode
    if (saved && ['grid3', 'grid4', 'list', 'large'].includes(saved)) {
      setViewMode(saved)
    }
    setIsLoaded(true)
  }, [])

  // Sauvegarder la preference
  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('pages-view-mode', mode)
  }

  if (!isLoaded) return <div className="p-12 text-center text-dust">Chargement...</div>

  const gridClassName = {
    grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    grid4: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4',
    list:  'flex flex-col gap-3',
    large: 'grid grid-cols-1 xl:grid-cols-2 gap-8',
  }[viewMode]

  return (
    <>
      {/* Barre d'outils (Toggle) */}
      <div className="flex items-center justify-between mb-8 px-6 pt-4">
        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest">
          {pages.length} page{pages.length > 1 ? 's' : ''} de vente active{pages.length > 1 ? 's' : ''}
        </p>
        
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 gap-1 shadow-sm">
          {(['grid3', 'grid4', 'list', 'large'] as const).map((mode) => {
            const icons = { grid3: '▥', grid4: '⊟', list: '▤', large: '⊡' }
            const labels = { grid3: 'Medium', grid4: 'Compact', list: 'Liste détaillée', large: 'Vue Large' }
            
            return (
              <button
                key={mode}
                onClick={() => updateViewMode(mode)}
                title={labels[mode]}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  viewMode === mode 
                  ? 'bg-gold text-white shadow-lg shadow-gold/20' 
                  : 'text-gray-300 hover:text-ink hover:bg-gray-50'
                }`}
              >
                <span className="text-xl leading-none">{icons[mode]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full p-6 pt-0">
        <div className={gridClassName}>
          {pages.map(page => {
            if (viewMode === 'list') return <PageListRow key={page.id} page={page} />
            if (viewMode === 'large') return <LargePageCard key={page.id} page={page} />
            
            const displayMode = viewMode === 'grid3' || viewMode === 'grid4' ? viewMode : 'grid3'
            return <SalePageCard key={page.id} page={page} displayMode={displayMode} />
          })}
        </div>
      </div>
    </>
  )
}
