'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

interface SalePage {
  id: string
  title: string
  slug: string
  template: string
  sections: Section[]
  product_ids: string[]
  active: boolean
}

interface Product {
  id: string
  name: string
  price: number
  type: string
  images: string[]
}

interface PageEditorProps {
  page: SalePage
  storeId: string
  products: Product[]
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
}

// ----------------------------------------------------------------
// Éditeur de section individuelle
// ----------------------------------------------------------------
function SectionEditor({
  section,
  onChange,
}: {
  section: Section
  onChange: (s: Section) => void
}) {
  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition'

  if (section.type === 'hero') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Titre principal</label>
          <input type="text" value={section.title ?? ''} onChange={e => onChange({ ...section, title: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Sous-titre</label>
          <input type="text" value={section.subtitle ?? ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Texte du bouton</label>
          <input type="text" value={section.cta ?? ''} onChange={e => onChange({ ...section, cta: e.target.value })} className={inputClass} />
        </div>
      </div>
    )
  }

  if (section.type === 'cta') {
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Texte du bouton CTA</label>
        <input type="text" value={section.cta ?? ''} onChange={e => onChange({ ...section, cta: e.target.value })} className={inputClass} />
      </div>
    )
  }

  if (section.type === 'benefits' || section.type === 'program' || section.type === 'menu' || section.type === 'services' || section.type === 'agenda' || section.type === 'credentials') {
    const items = (section.items as string[] | undefined) ?? []
    return (
      <div className="space-y-2">
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
          className="text-sm text-gold hover:text-gold-light"
        >+ Ajouter</button>
      </div>
    )
  }

  if (section.type === 'testimonials') {
    const items = (section.items as Array<{ name: string; text: string; rating: number }>) ?? []
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-500 block">Témoignages</label>
        {items.map((t, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-cream">
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
              className="text-xs text-red-400 hover:text-red-600"
            >Supprimer</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...section, items: [...items, { name: '', text: '', rating: 5 }] })}
          className="text-sm text-gold hover:text-gold-light"
        >+ Ajouter un témoignage</button>
      </div>
    )
  }

  if (section.type === 'faq') {
    const items = (section.items as Array<{ q: string; a: string }>) ?? []
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-500 block">Questions / Réponses</label>
        {items.map((qa, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-cream">
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
              className="text-xs text-red-400 hover:text-red-600"
            >Supprimer</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...section, items: [...items, { q: '', a: '' }] })}
          className="text-sm text-gold hover:text-gold-light"
        >+ Ajouter une question</button>
      </div>
    )
  }

  if (section.type === 'coach') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Nom du coach</label>
          <input type="text" value={section.name ?? ''} onChange={e => onChange({ ...section, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Bio courte</label>
          <textarea value={section.bio ?? ''} onChange={e => onChange({ ...section, bio: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
        </div>
      </div>
    )
  }

  // Section texte générique
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">Texte</label>
      <textarea value={section.text ?? ''} onChange={e => onChange({ ...section, text: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
    </div>
  )
}

// ----------------------------------------------------------------
// PageEditor — composant principal
// ----------------------------------------------------------------
export function PageEditor({ page, storeId, products }: PageEditorProps) {
  const router = useRouter()

  const [title, setTitle]           = useState(page.title)
  const [slug, setSlug]             = useState(page.slug)
  const [sections, setSections]     = useState<Section[]>(page.sections as Section[])
  const [linkedProducts, setLinked] = useState<string[]>(page.product_ids ?? [])
  const [active, setActive]         = useState(page.active)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [expanded, setExpanded]     = useState<number | null>(0)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const updateSection = (i: number, updated: Section) =>
    setSections(prev => prev.map((s, idx) => idx === i ? updated : s))

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
        sections,
        product_ids: linkedProducts,
        active,
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
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Infos de base */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-ink">Informations de base</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la page</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL publique</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 flex-shrink-0">pdvpro.com/p/</span>
            <input
              type="text" value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>
        </div>
      </section>

      {/* Sections éditables */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="font-semibold text-ink">Sections de la page</h2>
        <p className="text-xs text-gray-400">Cliquez sur une section pour la modifier.</p>

        {sections.map((s, i) => (
          <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between p-4 hover:bg-cream transition"
            >
              <span className="text-sm font-medium text-gray-700">
                {SECTION_LABELS[s.type] ?? s.type}
              </span>
              <span className={`text-gray-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {expanded === i && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-cream">
                <SectionEditor
                  section={s}
                  onChange={(updated) => updateSection(i, updated)}
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Produits liés */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-ink">Produits liés</h2>
          <p className="text-xs text-gray-400 mt-0.5">Ces produits apparaîtront avec un bouton d&apos;achat sur la page</p>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">Aucun produit actif.</p>
        ) : (
          <div className="space-y-2">
            {products.map(p => (
              <button
                key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                  linkedProducts.includes(p.id) ? 'border-gold/50 bg-gold/10' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {p.images?.[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.images[0]} alt={p.name || "Image produit"} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.price.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  linkedProducts.includes(p.id) ? 'border-gold bg-gold' : 'border-gray-300'
                }`}>
                  {linkedProducts.includes(p.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Statut */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink">Statut</h2>
            <p className="text-xs text-gray-400 mt-0.5">{active ? 'Page publiée — visible en ligne' : 'Brouillon — non visible'}</p>
          </div>
          <div
            onClick={() => setActive((v: boolean) => !v)}
            className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${active ? 'bg-gold' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'left-7' : 'left-1.5'}`} />
          </div>
        </div>
      </section>

      {/* Bouton sauvegarder */}
      <button onClick={handleSave} disabled={loading}
        className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition text-base">
        {loading ? 'Enregistrement…' : 'Sauvegarder les modifications'}
      </button>

      {/* Zone danger */}
      <div className="mt-2 mb-8">
        <button type="button" onClick={() => setShowDelete(true)}
          className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 rounded-2xl transition text-sm">
          🗑️ Supprimer cette page
        </button>
      </div>

      {/* Dialog suppression */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-ink text-lg">Supprimer la page ?</h3>
              <p className="text-sm text-gray-500 mt-1">Cette action est irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-cream transition text-sm">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
