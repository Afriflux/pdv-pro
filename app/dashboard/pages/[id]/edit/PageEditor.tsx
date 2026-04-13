'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Palette, Smartphone, ChevronDown, CheckCircle2 } from 'lucide-react'
import {
  Section as RendererSection, Product as RendererProduct, Theme, DEFAULT_THEME, PageRendererConfig,
  HeroSection, BenefitsSection, TestimonialsSection, FaqSection,
  ProgramSection, CoachProfileSection, ImageGallerySection, CtaSection,
  CountdownSection, ComparisonSection, VideoGallerySection, THEME_MAP, GenericSection, ProductCards
} from '@/components/pages/PageRenderers'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface SalePage {
  id: string
  title: string
  slug: string
  template: string
  sections: RendererSection[]
  product_ids: string[]
  active: boolean
  custom_domain?: string | null
  
  // Nouveaux champs d'affiliation
  affiliate_active?: boolean | null
  affiliate_margin?: number | null
}

interface PageEditorProps {
  page: SalePage
  storeId: string
  products: RendererProduct[]
}

const SECTION_LABELS: Record<string, string> = {
  hero:         '🏆 Hero',
  benefits:     '✅ Points forts',
  testimonials: '⭐ Témoignages',
  faq:          '❓ FAQ',
  cta:          '🚀 Appel à l\'action',
  program:      '📋 Programme',
  coach:        '👤 Profil coach',
  agenda:       '📅 Agenda',
  menu:         '🍽️ Menu',
  tracks:       '🎵 Musique',
  preview:      '👁️ Aperçu',
  gallery:      '🖼️ Galerie',
  services:     '💼 Services',
  countdown:    '⏳ Urgence (Compte à rebours)',
  comparison:   '⚖️ Comparaison (Nous vs Eux)',
  video:        '▶️ Galerie Vidéos',
}

// Supprimé car nous utilisons directement THEME_MAP importé

// ----------------------------------------------------------------
// Éditeur de section individuelle
// ----------------------------------------------------------------
function SectionEditor({
  section,
  sectionIndex,
  isGeneratingField,
  openDropdownId,
  setOpenDropdownId,
  onChange,
  onAIGenerate
}: {
  section: RendererSection
  sectionIndex: number
  isGeneratingField: string | null
  openDropdownId: string | null
  setOpenDropdownId: (id: string | null) => void
  onChange: (s: RendererSection) => void
  onAIGenerate?: (field: string, contextType: string, actionType: string) => void
}) {
  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition'

  const AIHelperDropdown = ({ field }: { field: string }) => {
    const id = `${sectionIndex}-${field}`
    const isGenerating = isGeneratingField === id
    const isOpen = openDropdownId === id

    return (
      <div className="relative inline-flex items-center" onMouseLeave={() => setOpenDropdownId(null)}>
        <button 
          type="button" 
          disabled={isGenerating}
          onClick={() => setOpenDropdownId(isOpen ? null : id)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors overflow-visible ${isGenerating ? 'animate-pulse bg-gold/10 ring-1 ring-gold/30' : 'hover:bg-gold/10'}`}
          title="Baguette Magique IA"
        >
          <Sparkles size={14} className={isGenerating ? "text-gold-dark" : "text-[#C9A84C]"} /> 
        </button>

        {isOpen && !isGenerating && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => { setOpenDropdownId(null); if(onAIGenerate) onAIGenerate(field, section.type, 'generate') }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-gold text-sm">✨</span> Générer un texte
            </button>
            <div className="h-px bg-gray-100 my-1 mx-3"></div>
            <button
              type="button"
              onClick={() => { setOpenDropdownId(null); if(onAIGenerate) onAIGenerate(field, section.type, 'improve') }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-blue-500 text-sm">✍️</span> Rendre plus persuasif
            </button>
            <button
              type="button"
              onClick={() => { setOpenDropdownId(null); if(onAIGenerate) onAIGenerate(field, section.type, 'fix') }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-emerald-500 text-sm">🔍</span> Corriger l'orthographe
            </button>
            <button
              type="button"
              onClick={() => { setOpenDropdownId(null); if(onAIGenerate) onAIGenerate(field, section.type, 'shorten') }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-orange-500 text-sm">✂️</span> Raccourcir
            </button>
            <button
              type="button"
              onClick={() => { setOpenDropdownId(null); if(onAIGenerate) onAIGenerate(field, section.type, 'translate') }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
            >
              <span className="text-purple-500 text-sm">🌍</span> Traduire (FR ↔ EN)
            </button>
          </div>
        )}
      </div>
    )
  }

  if (section.type === 'hero') {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-500 block">Titre principal</label>
            <AIHelperDropdown field="title" />
          </div>
          <input type="text" value={section.title ?? ''} onChange={e => onChange({ ...section, title: e.target.value })} className={inputClass} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-500 block">Sous-titre / Promesse</label>
            <AIHelperDropdown field="subtitle" />
          </div>
          <textarea value={section.subtitle ?? ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Texte du bouton CTA</label>
          <input type="text" value={section.cta ?? ''} onChange={e => onChange({ ...section, cta: e.target.value })} className={inputClass} />
        </div>
      </div>
    )
  }

  if (section.type === 'cta') {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Texte du bouton CTA final</label>
        <input type="text" value={section.cta ?? ''} onChange={e => onChange({ ...section, cta: e.target.value })} className={inputClass} />
      </div>
    )
  }

  if (section.type === 'benefits' || section.type === 'program' || section.type === 'menu' || section.type === 'services' || section.type === 'agenda' || section.type === 'credentials') {
    const items = (section.items as string[] | undefined) ?? []
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-500 block">Éléments de la liste</label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={typeof item === 'string' ? item : ''}
              onChange={e => {
                const next = [...items] as string[]
                next[i] = e.target.value
                onChange({ ...section, items: next })
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange({ ...section, items: items.filter((_, idx) => idx !== i) })}
              className="text-red-400 hover:text-red-600 text-xs px-2"
            >×</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...section, items: [...items, ''] })}
          className="text-sm font-bold text-[#0F7A60] hover:text-[#0D6B53] flex items-center gap-1"
        >+ Ajouter un élément</button>
      </div>
    )
  }

  if (section.type === 'testimonials') {
    const items = (section.items as Array<{ name: string; text: string; rating: number }>) ?? []
    return (
      <div className="space-y-4">
        <label className="text-xs font-medium text-gray-500 block">Témoignages</label>
        {items.map((t, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-[#FAFAF7]">
            <input
              type="text" placeholder="Nom du client" value={t.name ?? ''}
              onChange={e => {
                const next = [...items]; next[i] = { ...next[i], name: e.target.value }
                onChange({ ...section, items: next })
              }} className={inputClass}
            />
            <textarea
              placeholder="Ce qu'il a dit..." value={t.text ?? ''} rows={2}
              onChange={e => {
                const next = [...items]; next[i] = { ...next[i], text: e.target.value }
                onChange({ ...section, items: next })
              }} className={`${inputClass} resize-none`}
            />
            <button
              type="button"
              onClick={() => onChange({ ...section, items: items.filter((_, idx) => idx !== i) })}
              className="text-xs font-bold text-red-400 hover:text-red-600"
            >Supprimer</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...section, items: [...items, { name: '', text: '', rating: 5 }] })}
          className="text-sm font-bold text-[#0F7A60] hover:text-[#0D6B53]"
        >+ Ajouter un témoignage</button>
      </div>
    )
  }

  if (section.type === 'faq') {
    const items = (section.items as Array<{ q: string; a: string }>) ?? []
    return (
      <div className="space-y-4">
        <label className="text-xs font-medium text-gray-500 block">Questions / Réponses</label>
        {items.map((qa, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-[#FAFAF7]">
            <input
              type="text" placeholder="Question" value={qa.q ?? ''}
              onChange={e => {
                const next = [...items]; next[i] = { ...next[i], q: e.target.value }
                onChange({ ...section, items: next })
              }} className={inputClass}
            />
            <textarea
              placeholder="Réponse" value={qa.a ?? ''} rows={2}
              onChange={e => {
                const next = [...items]; next[i] = { ...next[i], a: e.target.value }
                onChange({ ...section, items: next })
              }} className={`${inputClass} resize-none`}
            />
            <button
              type="button"
              onClick={() => onChange({ ...section, items: items.filter((_, idx) => idx !== i) })}
              className="text-xs font-bold text-red-400 hover:text-red-600"
            >Supprimer</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...section, items: [...items, { q: '', a: '' }] })}
          className="text-sm font-bold text-[#0F7A60] hover:text-[#0D6B53]"
        >+ Ajouter une question</button>
      </div>
    )
  }

  if (section.type === 'coach') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Nom du coach / créateur</label>
          <input type="text" value={section.name ?? ''} onChange={e => onChange({ ...section, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-500 block">Bio courte</label>
            <AIHelperDropdown field="bio" />
          </div>
          <textarea value={section.bio ?? ''} onChange={e => onChange({ ...section, bio: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
        </div>
      </div>
    )
  }

  if (section.type === 'countdown') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Titre (ex: Offre Éclair)</label>
          <input type="text" value={section.title ?? ''} onChange={e => onChange({ ...section, title: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Texte d'urgence (ex: expire bientôt)</label>
          <input type="text" value={section.subtitle ?? ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} className={inputClass} />
        </div>
      </div>
    )
  }

  if (section.type === 'comparison') {
    const items = (section.items as Array<{ name?: string; text?: string }>) ?? []
    const pros = items.find(i => i.name === 'Nous') || { name: 'Nous', text: '' }
    const cons = items.find(i => i.name !== 'Nous') || { name: 'Les Autres', text: '' }

    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Titre de la section</label>
          <input type="text" value={section.title ?? ''} onChange={e => onChange({ ...section, title: e.target.value })} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="text-xs font-medium text-[#0F7A60] mb-1 block">Notre Solution (séparé par virgules)</label>
              <textarea rows={3} placeholder="Rapide, Efficace, Pas cher" value={pros.text ?? ''} onChange={e => {
                 const newItems = [{ name: 'Nous', text: e.target.value }, cons]
                 onChange({ ...section, items: newItems })
              }} className={`${inputClass} resize-none`} />
           </div>
           <div>
              <label className="text-xs font-medium text-red-500 mb-1 block">La Concurrence (séparé par virgules)</label>
              <textarea rows={3} placeholder="Lent, Compliqué, Cher" value={cons.text ?? ''} onChange={e => {
                 const newItems = [pros, { name: 'Les Autres', text: e.target.value }]
                 onChange({ ...section, items: newItems })
              }} className={`${inputClass} resize-none`} />
           </div>
        </div>
      </div>
    )
  }

  if (section.type === 'video') {
    const items = (section.items as string[]) ?? []
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Titre de la section vidéo</label>
          <input type="text" value={section.title ?? ''} onChange={e => onChange({ ...section, title: e.target.value })} className={inputClass} />
        </div>
        <div className="space-y-3">
           <label className="text-xs font-medium text-gray-500 block">Vidéos (URL ou ID)</label>
           {items.map((item, i) => (
             <div key={i} className="flex gap-2">
               <input placeholder="URL de la vidéo..." type="text" value={item} onChange={e => {
                 const next = [...items]; next[i] = e.target.value; onChange({ ...section, items: next })
               }} className={inputClass} />
               <button type="button" onClick={() => onChange({ ...section, items: items.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 text-xs px-2">×</button>
             </div>
           ))}
           <button type="button" onClick={() => onChange({ ...section, items: [...items, ''] })} className="text-sm font-bold text-[#0F7A60] hover:text-[#0D6B53]">+ Ajouter vidéo</button>
        </div>
      </div>
    )
  }

  // Section texte générique
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 block">Texte</label>
        <AIHelperDropdown field="text" />
      </div>
      <textarea value={section.text ?? ''} onChange={e => onChange({ ...section, text: e.target.value })} rows={4} className={`${inputClass} resize-none`} />
    </div>
  )
}

// ----------------------------------------------------------------
// Mobile Live Preview Wrapper
// ----------------------------------------------------------------
function MobilePreview({ sections, products, theme, ctaText }: { sections: RendererSection[], products: RendererProduct[], theme: Theme, ctaText: string }) {
  if (sections.length === 0) return (
    <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 font-medium px-6 text-center">
      La page est vide. Ajoutez du contenu à gauche pour voir l'aperçu dynamique.
    </div>
  )

  return (
    <PageRendererConfig theme={theme}>
      <div className="w-full min-h-full pb-20">
        {/* Render toutes les sections */}
        {sections.map((s, i) => {
          if (s.type === 'hero')         return <HeroSection key={i} s={s} products={products} cta={ctaText} theme={theme} />
          if (s.type === 'benefits')     return <BenefitsSection key={i} s={s} theme={theme} />
          if (s.type === 'testimonials') return <TestimonialsSection key={i} s={s} theme={theme} />
          if (s.type === 'faq')          return <FaqSection key={i} s={s} theme={theme} />
          if (s.type === 'program')      return <ProgramSection key={i} s={s} theme={theme} />
          if (s.type === 'coach')        return <CoachProfileSection key={i} s={s} theme={theme} />
          if (s.type === 'gallery')      return <ImageGallerySection key={i} s={s} theme={theme} />
          if (s.type === 'cta')          return <CtaSection key={i} s={s} products={products} theme={theme} />
          if (s.type === 'countdown')    return <CountdownSection key={i} s={s} theme={theme} />
          if (s.type === 'comparison')   return <ComparisonSection key={i} s={s} theme={theme} />
          if (s.type === 'video')        return <VideoGallerySection key={i} s={s} theme={theme} />
          return <GenericSection key={i} s={s} />
        })}

        <ProductCards products={products} theme={theme} />
        
        <footer className="py-6 px-6 bg-gray-900 text-center">
          <p className="text-gray-400 text-xs font-sans">
            Propulsé par <span className="text-white font-bold tracking-wide">Yayyam</span>
          </p>
        </footer>
      </div>
    </PageRendererConfig>
  )
}

// ----------------------------------------------------------------
// PageEditor — composant principal
// ----------------------------------------------------------------
export function PageEditor({ page, storeId, products }: PageEditorProps) {
  const router = useRouter()

  const [title, setTitle]           = useState(page.title)
  const [slug, setSlug]             = useState(page.slug)
  const [customDomain, setCustomDomain] = useState(page.custom_domain || '')
  const [sections, setSections]     = useState<RendererSection[]>(page.sections as RendererSection[])
  const [linkedProducts, setLinked] = useState<string[]>(page.product_ids ?? [])
  const [active, setActive]         = useState(page.active)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [generatingField, setGeneratingField] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  
  // ── États Affiliation ──
  const [affiliateActive, setAffiliateActive] = useState<boolean | null>(page.affiliate_active ?? null)
  const [affiliateMargin, setAffiliateMargin] = useState<string>(page.affiliate_margin != null ? String(page.affiliate_margin * 100) : '')

  // Navigation accordéons
  const [expanded, setExpanded]     = useState<string | number | null>('design')
  
  // Suppression logic
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  // -- THEME EXTRACTION & MUTATION --
  const themeSectionIndex = sections.findIndex(s => s.type === 'theme')
  const rawTheme = themeSectionIndex >= 0 ? sections[themeSectionIndex] as unknown as Theme : undefined
  const currentTheme: Theme = rawTheme ? { color: rawTheme.color || 'orange', font: rawTheme.font || 'sans' } : DEFAULT_THEME

  const updateTheme = (updates: Partial<Theme>) => {
    const newTheme = { ...currentTheme, ...updates, type: 'theme' }
    setSections(prev => {
      const idx = prev.findIndex(s => s.type === 'theme')
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = newTheme as unknown as RendererSection
        return copy
      } else {
        return [...prev, newTheme as unknown as RendererSection]
      }
    })
  }

  const visualSections = sections.filter(s => s.type !== 'theme')
  const ctaText = visualSections.find(s => s.type === 'cta')?.cta ?? 'Commander maintenant'

  // -- HANDLERS --
  const updateVisualSection = (i: number, updated: RendererSection) => {
    const exactVisualSection = visualSections[i]
    setSections(prev => prev.map(s => s === exactVisualSection ? updated : s))
  }

  const handleAIGenerate = async (sectionIndex: number, exactVisualSection: RendererSection, field: string, contextType: string, actionType: string = 'generate') => {
    if (!title.trim()) {
      alert("Veuillez d'abord donner un titre général à la page pour aider l'IA.")
      return
    }

    const uniqueId = `${sectionIndex}-${field}`
    setGeneratingField(uniqueId)
    
    try {
      const res = await fetch('/api/ai/generate-page-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageTitle: title,
          field,
          contextType,
          template: page.template,
          currentText: (exactVisualSection as any)[field],
          actionType
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur IA')

      updateVisualSection(sectionIndex, { ...exactVisualSection, [field]: data.text })
    } catch (err: any) {
      alert(err.message || 'Erreur de génération')
    } finally {
      setGeneratingField(null)
    }
  }

  const toggleProduct = (id: string) =>
    setLinked(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) { setError('Titre et URL obligatoires.'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('SalePage')
      .update({
        title:       title.trim(),
        slug:        slug.trim(),
        custom_domain: customDomain.trim() || null,
        sections,
        product_ids: linkedProducts,
        active,
        affiliate_active: affiliateActive,
        affiliate_margin: affiliateMargin ? parseFloat(affiliateMargin) / 100 : null,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', page.id)
      .eq('store_id', storeId)

    setLoading(false)
    if (updateErr) { setError('Erreur : ' + updateErr.message); return }
    router.push('/dashboard/pages')
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('SalePage').delete().eq('id', page.id).eq('store_id', storeId)
    router.push('/dashboard/pages')
    router.refresh()
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      
      {/* ---------- GAUCHE : PANNEAUX DE CONFIGURATION ---------- */}
      <div className="w-full xl:max-w-2xl flex-1 space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* 1. Infos de base */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div 
            className="flex items-center justify-between cursor-pointer group" 
            onClick={() => setExpanded(expanded === 'infos' ? null : 'infos')}
          >
            <h2 className="font-bold text-ink">Informations de base</h2>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === 'infos' ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded === 'infos' && (
            <div className="pt-2 space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Titre de la page</label>
                <input
                  title="Titre de la page"
                  placeholder="Ex: Mon Livre Épatant"
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">URL publique</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400 flex-shrink-0 bg-gray-50 px-3 py-3 rounded-xl border border-gray-100">yayyam.com/p/</span>
                  <input
                    title="URL Publique"
                    placeholder="mon-livre-epatant"
                    type="text" value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                  />
                </div>
              </div>
              <div className="p-4 bg-[#FAFAF7] rounded-xl flex items-start gap-3">
                <Sparkles size={16} className="text-[#0F7A60] mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-900 block mb-0.5">Conseil IA :</strong>
                  L'URL de votre page (le "slug") doit être courte et mémorisable. Évitez les mots inutiles comme "le", "la", "de".
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between items-center">
                   <span>Domaine personnalisé (Optionnel)</span>
                   <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-wider">Premium</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400 flex-shrink-0 bg-gray-50 px-3 py-3 rounded-xl border border-gray-100">https://</span>
                  <input
                    title="Domaine personnalisé"
                    placeholder="ex: mondomaine.com"
                    type="text" value={customDomain}
                    onChange={e => setCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Liez votre propre domaine au lieu d'utiliser l'URL par défaut. Vous devrez configurer les DNS de votre domaine.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 2. Design & Apparence */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between cursor-pointer group" onClick={() => setExpanded(expanded === 'design' ? null : 'design')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="font-bold text-ink text-base">Design & Apparence</h2>
                <p className="text-xs text-gray-400">Gérez les couleurs et polices</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === 'design' ? 'rotate-180' : ''}`} />
          </div>
          
          {expanded === 'design' && (
            <div className="pt-4 border-t border-gray-100 space-y-6 animate-in fade-in duration-200">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Couleur Principale</label>
                   <div className="flex flex-wrap gap-2">
                     {Object.keys(THEME_MAP).map((c) => (
                       <button 
                          key={c} 
                          onClick={() => updateTheme({ color: c as any })} 
                          title={`Couleur ${c}`}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${currentTheme.color === c ? 'border-gray-900 scale-110 shadow-md ring-2 ring-gray-900 ring-offset-2' : 'border-transparent hover:scale-105 shadow-sm'} ${THEME_MAP[c as Theme['color']].bgPrimary}`} 
                       />
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Police Générale</label>
                   <select 
                      title="Police de caractères" 
                      value={currentTheme.font} 
                      onChange={e => updateTheme({ font: e.target.value as any })} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gold focus:outline-none"
                    >
                     <option value="sans">Moderne (Sans-serif)</option>
                     <option value="serif">Élégant (Serif)</option>
                     <option value="mono">Tech (Monospace)</option>
                   </select>
                 </div>
               </div>
            </div>
          )}
        </section>

        {/* 3. Sections de contenu */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer group mb-2"
            onClick={() => setExpanded(expanded === 'sections' ? null : 'sections')}
          >
            <div>
              <h2 className="font-bold text-ink">Sections (Blocs de Contenu)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Remplissez les informations de votre page bloc par bloc.</p>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === 'sections' ? 'rotate-180' : ''}`} />
          </div>

          {expanded === 'sections' && (
            <div className="space-y-3 pt-2">
              {visualSections.map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                  <button
                    type="button"
                    onClick={() => setExpanded(`section-${i}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <span className="text-sm font-bold text-gray-800">
                      {SECTION_LABELS[s.type] ?? s.type}
                    </span>
                    <span className={`text-gray-400 transition-transform ${expanded === `section-${i}` ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {expanded === `section-${i}` && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-5 bg-[#FAFAF7] shadow-inner">
                      <SectionEditor
                        section={s}
                        sectionIndex={i}
                        isGeneratingField={generatingField}
                        openDropdownId={openDropdownId}
                        setOpenDropdownId={setOpenDropdownId}
                        onChange={(updated) => updateVisualSection(i, updated)}
                        onAIGenerate={(field, ctx, actionType) => handleAIGenerate(i, s, field, ctx, actionType)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Produits liés */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setExpanded(expanded === 'products' ? null : 'products')}
          >
            <div>
              <h2 className="font-bold text-ink">Boutons de commande (Produits)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ces produits créeront les boutons "Acheter" sur votre page de vente.</p>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === 'products' ? 'rotate-180' : ''}`} />
          </div>

          {expanded === 'products' && (
            <div className="pt-2">
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">Aucun produit actif dans votre catalogue.</p>
              ) : (
                <div className="space-y-3">
                  {products.map(p => (
                    <button
                      key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                        linkedProducts.includes(p.id) ? 'border-[#0F7A60]/50 bg-[#0F7A60]/5 shadow-sm' : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden shadow-sm">
                        {p.images?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.images[0]} alt={p.name || "Image produit"} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${linkedProducts.includes(p.id) ? 'text-[#0F7A60]' : 'text-gray-900'}`}>{p.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{p.price.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        linkedProducts.includes(p.id) ? 'border-[#0F7A60] bg-[#0F7A60]' : 'border-gray-300'
                      }`}>
                        {linkedProducts.includes(p.id) && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5. Affiliation */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setExpanded(expanded === 'affiliation' ? null : 'affiliation')}
          >
            <div>
              <h2 className="font-bold text-ink">🤝 Programme d'Affiliation</h2>
              <p className="text-xs text-gray-400 mt-0.5">Règles de commission spécifiques pour cette page de vente.</p>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded === 'affiliation' ? 'rotate-180' : ''}`} />
          </div>

          {expanded === 'affiliation' && (
            <div className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut de l'affiliation</label>
                  <select
                    value={affiliateActive === null ? 'default' : affiliateActive ? 'true' : 'false'}
                    onChange={(e) => {
                      if (e.target.value === 'default') setAffiliateActive(null)
                      else setAffiliateActive(e.target.value === 'true')
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition bg-white"
                  >
                    <option value="default">Par défaut (Hériter de la boutique)</option>
                    <option value="true">Activer pour cette page</option>
                    <option value="false">Désactiver pour cette page</option>
                  </select>
                </div>

                {affiliateActive !== false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commission spécifique (%)
                    </label>
                    <input
                      type="number"
                      min={0} max={100} step="0.1"
                      value={affiliateMargin}
                      onChange={(e) => setAffiliateMargin(e.target.value)}
                      placeholder="Ex : 20. Vide = hériter"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Sauvegarde & Statut */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex-1 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-ink text-sm mb-0.5">Statut de la page</h2>
              <p className="text-xs text-gray-400">{active ? 'Publiée' : 'Brouillon'}</p>
            </div>
            <div
              onClick={() => setActive((v: boolean) => !v)}
              className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative shadow-inner ${active ? 'bg-[#0F7A60]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${active ? 'left-7' : 'left-1'}`} />
            </div>
          </div>

          <button onClick={handleSave} disabled={loading}
            className="flex-1 min-w-[200px] bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold px-6 py-5 rounded-2xl transition shadow-lg text-base flex justify-center items-center gap-2">
            {loading ? 'Enregistrement...' : <>Enregistrer les modifications</>}
          </button>
        </div>

        {/* Zone danger */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <button type="button" onClick={() => setShowDelete(true)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold px-4 py-3 rounded-xl transition text-sm flex items-center gap-2">
            Supprimer définitivement cette page
          </button>
        </div>
      </div>

      {/* ---------- DROITE : LIVE MOBILE PREVIEW ---------- */}
      <div className="hidden xl:block w-[390px] flex-shrink-0">
         <div className="sticky top-10">
           <div className="mb-4 flex items-center justify-between px-2">
             <div className="flex items-center gap-2 text-gray-400 font-bold text-xs">
               <Smartphone size={16} /> Live Mobile Preview
             </div>
             <div className="text-xs bg-[#0F7A60]/10 text-[#0F7A60] px-2 py-1 rounded font-black tracking-widest uppercase">
               Temps Réel
             </div>
           </div>

           {/* Phone Frame */}
           <div className="w-[390px] h-[780px] bg-white rounded-[3rem] border-[14px] border-gray-900 overflow-y-auto relative shadow-2xl hide-scrollbar ring-1 ring-black/5">
             {/* Notch */}
             <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-2xl w-40 mx-auto z-50 flex items-center justify-center">
               <div className="w-12 h-1.5 bg-gray-800 rounded-full" />
             </div>
             
             {/* Render de la page */}
             <MobilePreview 
               sections={visualSections} 
               products={products.filter(p => linkedProducts.includes(p.id))} 
               theme={currentTheme}
               ctaText={ctaText}
             />
           </div>
         </div>
      </div>

      {/* Dialog suppression */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
              <h3 className="font-extrabold text-gray-900 text-xl">Supprimer la page ?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Cette action est définitive. La page ne sera plus accessible à vos clients.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition text-sm">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg text-sm">
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
