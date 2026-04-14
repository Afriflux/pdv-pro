'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Search, Activity, Eye, DollarSign, Target, Check, Trash2, Copy, Edit, Link as LinkIcon, LayoutGrid, List } from 'lucide-react'
import { togglePageStatus, deletePage, duplicatePage } from '@/app/actions/pages'

// ----------------------------------------------------------------
// Types & Constantes
// ----------------------------------------------------------------
interface SalePage {
  id: string
  title: string
  slug: string
  template: string
  active: boolean
  created_at: string
  product_ids: string[] | null
  views_count?: number
  sales_count?: number
}

interface PagesViewProps {
  pages: SalePage[]
  storeName: string
}

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

const TEMPLATE_GRADIENTS: Record<string, string> = {
  beauty:     'from-pink-100 via-rose-50 to-white',
  ebook:      'from-blue-100 via-indigo-50 to-white',
  formation:  'from-emerald-100 via-teal-50 to-white',
  food:       'from-orange-100 via-amber-50 to-white',
  fashion:    'from-purple-100 via-fuchsia-50 to-white',
  services:   'from-gray-200 via-slate-50 to-white',
  coaching:   'from-sky-100 via-cyan-50 to-white',
  ecommerce:  'from-[#FFF8E7] via-[#FFF0C2] to-white',
  music:      'from-violet-100 via-purple-50 to-white',
  event:      'from-red-100 via-rose-50 to-white',
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
// Composant Ligne (Row) Modélisant une Page
// ----------------------------------------------------------------
function PageRow({ page }: { page: SalePage }) {
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  
  const handleToggle = () => startTransition(() => { togglePageStatus(page.id, page.active); })
  const handleDelete = async () => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Supprimer cette page ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (result.isConfirmed) startTransition(() => { deletePage(page.id); })
  }
  const handleDuplicate = () => startTransition(() => { duplicatePage(page.id); })
  
  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${page.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-5 bg-white/60 backdrop-blur-xl border border-white hover:bg-white hover:shadow-xl hover:shadow-[#0F7A60]/10 hover:border-[#0F7A60]/20 transition-all duration-300 gap-4 md:gap-0 relative overflow-hidden rounded-2xl mb-2">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0F7A60]/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* 1. Visuel + Titre */}
      <div className="flex items-center gap-4 w-full md:w-[35%] min-w-0 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${TEMPLATE_GRADIENTS[page.template] || 'from-gray-100 to-white'} border border-gray-100/50 shadow-sm relative overflow-hidden group-hover:scale-110 group-hover:rotate-2 transition-all duration-500`}>
           <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
           <span className="relative z-10 drop-shadow-sm">{TEMPLATE_ICONS[page.template] ?? '🛍️'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/dashboard/pages/${page.id}/edit`} className="font-display font-black text-[#1A1A1A] text-base md:text-[17px] hover:text-[#0F7A60] transition-colors truncate block mb-1">
            {page.title}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#0F7A60] font-black tracking-widest uppercase bg-[#0F7A60]/5 px-2 py-0.5 rounded-md border border-[#0F7A60]/10">
              /{page.slug}
            </span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider hidden lg:inline-block">
              {TEMPLATE_LABELS[page.template] || page.template}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Statut & Mode */}
      <div className="flex items-center gap-3 w-full md:w-[20%] jjustify-start md:justify-center">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border transition-all ${
            pending ? 'opacity-50 cursor-wait' : page.active 
            ? 'bg-emerald text-white border-emerald/10 shadow-sm shadow-emerald/10 hover:bg-emerald/90' 
            : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-emerald hover:border-emerald/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${page.active ? 'bg-white' : 'bg-gray-400'}`} />
          {page.active ? 'Mondial' : 'Inactif'}
        </button>
      </div>

      {/* 3. Métriques (Réelles) */}
      <div className="hidden md:flex items-center justify-center gap-6 w-[25%] opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="text-center">
          <p className="text-sm font-black text-ink">{page.views_count || 0}</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Vues</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-ink">{page.sales_count || 0}</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ventes</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-emerald">
            {page.views_count && page.views_count > 0 ? (((page.sales_count || 0) / page.views_count) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Taux</p>
        </div>
      </div>

      {/* 4. Actions Rapides */}
      <div className="flex items-center justify-end gap-1.5 w-full md:w-[20%]">
        {page.product_ids && page.product_ids.length > 0 && (
          <span className="mr-2 text-xs bg-gold/5 text-gold px-2 py-1 rounded-md font-black uppercase tracking-widest border border-gold/10 hidden xl:inline-block">
            {page.product_ids.length} Produit{page.product_ids.length > 1 ? 's' : ''}
          </span>
        )}
        <button onClick={handleCopyLink} className="p-2.5 text-gray-400 hover:text-ink hover:bg-gray-50 rounded-xl transition tooltip-trigger" title="Copier le lien d'accès">
          {copied ? <Check size={18} className="text-emerald" /> : <LinkIcon size={18} />}
        </button>
        <button onClick={handleDuplicate} className="p-2.5 text-gray-400 hover:text-ink hover:bg-gray-50 rounded-xl transition" title="Dupliquer la page">
          <Copy size={18} />
        </button>
        <Link href={`/dashboard/pages/${page.id}/edit`} className="p-2.5 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-xl transition" title="Modifier le design">
          <Edit size={18} />
        </Link>
        <button onClick={handleDelete} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition" title="Supprimer">
          <Trash2 size={18} />
        </button>
      </div>

    </div>
  )
}

// ----------------------------------------------------------------
// Composant Carte (Grid) Modélisant une Page
// ----------------------------------------------------------------
function PageCard({ page }: { page: SalePage }) {
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  
  const handleToggle = () => startTransition(() => { togglePageStatus(page.id, page.active); })
  const handleDelete = async () => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Supprimer cette page ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (result.isConfirmed) startTransition(() => { deletePage(page.id); })
  }
  const handleDuplicate = () => startTransition(() => { duplicatePage(page.id); })
  
  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${page.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white hover:border-[#0F7A60]/30 hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500 flex flex-col group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header Visuel */}
      <div className={`h-32 bg-gradient-to-br ${TEMPLATE_GRADIENTS[page.template] || 'from-gray-100 to-white'} relative flex items-center justify-center`}>
         <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
         <span className="relative z-10 text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-500">{TEMPLATE_ICONS[page.template] ?? '🛍️'}</span>
         
         <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleToggle}
              disabled={pending}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-widest uppercase border transition-all shadow-sm ${
                pending ? 'opacity-50 cursor-wait' : page.active 
                ? 'bg-emerald text-white border-emerald/10 shadow-emerald/20 hover:bg-emerald/90' 
                : 'bg-white/90 backdrop-blur-sm text-gray-500 border-gray-200 hover:text-emerald hover:border-emerald/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${page.active ? 'bg-white' : 'bg-gray-400'}`} />
              {page.active ? 'Actif' : 'Inactif'}
            </button>
         </div>
      </div>

      {/* Corps */}
      <div className="p-5 flex-1 flex flex-col">
          <Link href={`/dashboard/pages/${page.id}/edit`} className="font-display font-black text-ink text-lg hover:text-gold transition-colors line-clamp-2 block mb-2 leading-tight">
            {page.title}
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-emerald font-black tracking-widest uppercase bg-emerald/5 px-2 py-0.5 rounded-md border border-emerald/10 max-w-full truncate">
              /{page.slug}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-50 mb-4">
            <div className="text-center">
              <p className="text-sm font-black text-ink">{page.views_count || 0}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Vues</p>
            </div>
            <div className="text-center border-l items-center border-gray-50">
              <p className="text-sm font-black text-ink">{page.sales_count || 0}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ventes</p>
            </div>
            <div className="text-center border-l items-center border-gray-50">
              <p className="text-sm font-black text-emerald">
                {page.views_count && page.views_count > 0 ? (((page.sales_count || 0) / page.views_count) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Taux</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-3">
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider truncate">
              {TEMPLATE_LABELS[page.template] || page.template}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleCopyLink} className="p-2 text-gray-400 hover:text-ink hover:bg-gray-50 rounded-lg transition" title="Copier le lien d'accès">
                {copied ? <Check size={16} className="text-emerald" /> : <LinkIcon size={16} />}
              </button>
              <button onClick={handleDuplicate} className="p-2 text-gray-400 hover:text-ink hover:bg-gray-50 rounded-lg transition" title="Dupliquer la page">
                <Copy size={16} />
              </button>
              <Link href={`/dashboard/pages/${page.id}/edit`} className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition" title="Modifier le design">
                <Edit size={16} />
              </Link>
              <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Composant Principal (Business View)
// ----------------------------------------------------------------
export default function PagesView({ pages }: PagesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preference
  useEffect(() => {
    const saved = localStorage.getItem('pages-view-mode') as 'list' | 'grid'
    if (saved) setViewMode(saved)
    setIsLoaded(true)
  }, [])

  const updateViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    localStorage.setItem('pages-view-mode', mode)
  }

  // Statistiques calculées
  const activeCount = pages.filter(p => p.active).length
  
  const totalViews = pages.reduce((acc, p) => acc + (p.views_count || 0), 0)
  const totalSales = pages.reduce((acc, p) => acc + (p.sales_count || 0), 0)
  const avgConversion = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : '0'

  // Filtrage
  const filteredPages = useMemo(() => {
    return pages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) || page.slug.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? page.active : !page.active
      return matchesSearch && matchesStatus
    })
  }, [pages, searchQuery, statusFilter])

  return (
    <div className="px-6 pb-12 w-full w-full">
      
      {/* ── 1. Rangée de KPIs (Overview) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-2">
        <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#C9A84C]/10 transition-colors duration-500 pointer-events-none" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
           
           <div className="flex items-center gap-4 relative z-10">
             <div className="w-14 h-14 rounded-[20px] bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
               <Activity className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs font-black tracking-widest uppercase text-[#C9A84C] mb-1">Pages Publiées</p>
               <p className="font-display font-black text-3xl text-[#1A1A1A]">{activeCount} <span className="text-sm font-bold text-gray-400">/ {pages.length}</span></p>
             </div>
           </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F7A60]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#0F7A60]/10 transition-colors duration-500 pointer-events-none" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

           <div className="flex items-center gap-4 relative z-10">
             <div className="w-14 h-14 rounded-[20px] bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60] shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
               <Eye className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs font-black tracking-widest uppercase text-[#0F7A60] mb-1">Visites Totales</p>
               <p className="font-display font-black text-3xl text-[#1A1A1A]">{totalViews}</p>
             </div>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

           <div className="flex items-center gap-4 relative z-10">
             <div className="w-14 h-14 rounded-[20px] bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
               <DollarSign className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs font-black tracking-widest uppercase text-blue-500 mb-1">Ventes Réalisées</p>
               <p className="font-display font-black text-3xl text-[#1A1A1A]">{totalSales}</p>
             </div>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors duration-500 pointer-events-none" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

           <div className="flex items-center gap-4 relative z-10">
             <div className="w-14 h-14 rounded-[20px] bg-purple-50 flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
               <Target className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs font-black tracking-widest uppercase text-purple-500 mb-1">Conversion Moy.</p>
               <p className="font-display font-black text-3xl text-[#1A1A1A]">{avgConversion} <span className="text-sm font-bold text-gray-400">%</span></p>
             </div>
           </div>
        </div>
      </div>

      {/* ── 2. Filtres & Barre de Recherche ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-[350px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Rechercher une page ou un /lien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-[16px] text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-shadow placeholder:text-gray-300 font-medium"
          />
        </div>

        {/* Status Toggles */}
        <div className="flex items-center bg-white p-1 rounded-[16px] border border-gray-100 shadow-sm w-full sm:w-auto">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-[12px] text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-[#FAFAF7] text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
          >
            Toutes
          </button>
          <button 
            onClick={() => setStatusFilter('active')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-[12px] text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'active' ? 'bg-emerald text-white shadow-sm shadow-emerald/20' : 'text-gray-400 hover:text-ink'}`}
          >
            Publiées
          </button>
          <button 
            onClick={() => setStatusFilter('draft')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-[12px] text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'draft' ? 'bg-gray-100 text-gray-600 shadow-sm' : 'text-gray-400 hover:text-ink'}`}
          >
            Brouillons
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex lg:ml-auto items-center bg-white p-1 rounded-[16px] border border-gray-100 shadow-sm w-full sm:w-auto">
          <button 
            onClick={() => updateViewMode('list')}
            className={`w-10 h-10 flex items-center justify-center rounded-[12px] transition-all ${viewMode === 'list' ? 'bg-[#FAFAF7] text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
            title="Vue en liste"
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => updateViewMode('grid')}
            className={`w-10 h-10 flex items-center justify-center rounded-[12px] transition-all ${viewMode === 'grid' ? 'bg-[#FAFAF7] text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
            title="Vue en grille"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* ── 3. Table ou Grille de Données (Business List) ── */}
      {!isLoaded ? null : viewMode === 'list' ? (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          {/* Entête de table caché sur mobile */}
          <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-[#FAFAFA]">
            <div className="w-[35%] text-xs font-black text-gray-400 tracking-widest uppercase pl-4">Page de Vente</div>
            <div className="w-[20%] text-xs font-black text-gray-400 tracking-widest uppercase text-center">Visibilité</div>
            <div className="w-[25%] text-xs font-black text-gray-400 tracking-widest uppercase text-center hidden md:block">Performance (30j)</div>
            <div className="w-[20%] text-xs font-black text-gray-400 tracking-widest uppercase text-right pr-4">Outils</div>
          </div>

          {/* Liste des lignes */}
          <div className="flex flex-col">
            {filteredPages.length > 0 ? (
              filteredPages.map(page => (
                <PageRow key={page.id} page={page} />
              ))
            ) : (
              <div className="p-16 text-center text-gray-400">
                <p className="text-sm font-medium">Aucune page ne correspond à votre recherche.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-gold font-bold hover:underline text-sm">
                    Effacer la recherche
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 ml:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPages.length > 0 ? (
            filteredPages.map(page => (
              <PageCard key={page.id} page={page} />
            ))
          ) : (
            <div className="col-span-full p-16 bg-white rounded-2xl border text-center text-gray-400">
              <p className="text-sm font-medium">Aucune page ne correspond à votre recherche.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 text-gold font-bold hover:underline text-sm">
                  Effacer la recherche
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      
    </div>
  )
}
