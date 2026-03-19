'use client'

import Link from 'next/link'
import { useTransition, useState } from 'react'
import { togglePageStatus, deletePage, duplicatePage } from '@/app/actions/pages'
import { Trash2, Copy, Eye, Edit, Link as LinkIcon, Check } from 'lucide-react'

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

interface SalePageCardProps {
  page: {
    id: string
    title: string
    slug: string
    template: string
    active: boolean
    product_ids: string[] | null
  }
  displayMode?: 'grid3' | 'grid4'
}

export default function SalePageCard({ page }: SalePageCardProps) {
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(() => {
      togglePageStatus(page.id, page.active)
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Supprimer définitivement cette page ?')) return
    startTransition(() => {
      deletePage(page.id)
    })
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(() => {
      duplicatePage(page.id)
    })
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}/p/${page.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-gold/20 transition-all duration-300 flex flex-col group relative">
      
      {/* VISUEL (Icône Template) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F9F9F6] flex items-center justify-center border-b border-gray-50">
        <div className="text-5xl group-hover:scale-110 transition-transform duration-500 opacity-80">
           {TEMPLATE_ICONS[page.template] ?? '🛍️'}
        </div>

        {/* Badge Statut flottant */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleToggle}
            disabled={pending}
            className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full border shadow-sm transition-all uppercase ${
              pending ? 'opacity-50 cursor-wait' : page.active 
              ? 'bg-emerald text-white border-emerald/10 hover:shadow-emerald/20' 
              : 'bg-white text-gray-400 border-gray-100 hover:text-emerald hover:border-emerald/20 outline-none'
            }`}
          >
            {pending ? '...' : page.active ? 'Publiée' : 'Brouillon'}
          </button>
        </div>

        {/* Overlay d'actions rapides au survol */}
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <a href={`/p/${page.slug}`} target="_blank" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-ink hover:bg-gold hover:text-white transition transform hover:scale-110" title="Voir la page">
            <Eye size={18} />
          </a>
          <button onClick={handleCopyLink} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-ink hover:bg-gold hover:text-white transition transform hover:scale-110" title="Copier le lien">
            {copied ? <Check size={18} className="text-emerald" /> : <LinkIcon size={18} />}
          </button>
          <button onClick={handleDuplicate} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-ink hover:bg-gold hover:text-white transition transform hover:scale-110" title="Dupliquer">
            <Copy size={18} />
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4">
          <Link href={`/dashboard/pages/${page.id}/edit`} className="block">
            <h3 className="font-display font-black text-ink text-base line-clamp-1 group-hover:text-gold transition-colors mb-1">
              {page.title}
            </h3>
          </Link>
          <p className="text-[11px] text-emerald font-black uppercase tracking-[0.1em]">
            /{page.slug}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
           <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
             {TEMPLATE_ICONS[page.template] ?? '🛍️'} {page.template}
           </span>
           {page.product_ids && page.product_ids.length > 0 && (
              <span className="text-[10px] bg-gold/10 text-gold px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                {page.product_ids.length} Produit{page.product_ids.length > 1 ? 's' : ''}
              </span>
           )}
        </div>

        {/* ACTIONS INFÉRIEURES */}
        <div className="mt-auto flex items-center gap-2 border-t border-gray-50 pt-4">
          <Link
            href={`/dashboard/pages/${page.id}/edit`}
            className="flex-1 bg-ink text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl text-center hover:bg-slate transition shadow-lg shadow-ink/10 flex items-center justify-center gap-2"
          >
            <Edit size={14} />
            Modifier
          </Link>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="w-11 h-11 flex items-center justify-center border border-gray-100 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
