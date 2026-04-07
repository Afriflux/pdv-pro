'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Globe, LayoutTemplate, ArrowRight, Wand2, Lock, Unlock, CreditCard } from 'lucide-react'
import { purchaseAssetAction } from '@/app/dashboard/marketplace/actions'

// ----------------------------------------------------------------
// Données templates
// ----------------------------------------------------------------
type TemplateId = string

interface Product {
  id: string
  name: string
  price: number
  type: string
  images: string[]
}

interface NewPageFlowProps {
  storeId: string
  products: Product[]
  initialTemplateData?: any
  globalTemplates?: any[]
  purchasedAssetIds?: string[]
}

const PLACEHOLDERS = [
  "Ex: Je vends une formation sur le e-commerce avec 3 modules...",
  "Ex: Je lance ma nouvelle gamme de parfums de Dubaï...",
  "Ex: J'organise un séminaire sur la liberté financière...",
  "Ex: Je vends mon livre numérique sur le marketing digital..."
]

const SUGGESTIONS = [
  { label: "🔥 Lancement Formation", prompt: "Je lance une formation en ligne complète sur le marketing avec un accès à vie et des sessions live." },
  { label: "💄 Gamme Skincare", prompt: "Je vends une nouvelle gamme de soins du visage 100% naturels pour lutter contre les imperfections." },
  { label: "🎟️ Événement B2B", prompt: "J'organise une conférence business le mois prochain à Dakar avec 3 intervenants de classe mondiale." },
  { label: "📚 Ebook Recettes", prompt: "Je vends mon livre de recettes africaines revisitées avec plus de 50 repas sains." }
]

// ----------------------------------------------------------------
// Composant
// ----------------------------------------------------------------
export function NewPageFlow({ storeId, products, initialTemplateData, globalTemplates = [] }: NewPageFlowProps) {
  const router = useRouter()

  // Étape 1 : choisir le template
  // Étape 2 : configurer la page
  const [step, setStep] = useState<1 | 2>(initialTemplateData ? 2 : 1)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | string | null>(initialTemplateData ? 'import' : null)

  // Autre méthode : Import par URL
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // NOUVEAU : Hub AI Prompt
  const [aiPrompt, setAiPrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [promptError, setPromptError] = useState<string | null>(null)

  // Filtres Niche/Category
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [templateSearch, setTemplateSearch] = useState('')
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)
  
  // Freemium
  const [purchaseModalId, setPurchaseModalId] = useState<string | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  // Champs formulaire
  const [title, setTitle]           = useState('')
  const [slug, setSlug]             = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [active, setActive]         = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')

  // Options IA & Pro
  const [aiLanguage, setAiLanguage] = useState('fr')
  const [aiTone, setAiTone]         = useState('persuasif')
  const [pageTheme, setPageTheme]   = useState('minimalist')

  // Typewriter placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const template = globalTemplates.find(t => t.id === selectedTemplate)

  const CATEGORY_GROUPS = [
    { id: 'all', label: 'Tous les modèles' },
    { id: 'physical', label: '📦 Produits Physiques' },
    { id: 'digital', label: '💻 Produits Digitaux' },
    { id: 'services', label: '🤝 Services & Coaching' },
    { id: 'events', label: '📅 Événements & Formations' },
    { id: 'food', label: '🍽️ Food & Restauration' },
  ]

  const getTemplateGroup = (category: string = '') => {
    const cat = category.toLowerCase()
    if (['mode', 'e-commerce', 'électronique', 'agro', 'artisanat', 'animaux', 'enfants', 'auto', 'parfumerie', 'beauté'].some(k => cat.includes(k))) return 'physical'
    if (['ebook', 'logiciels', 'musique', 'photographie', 'jeux'].some(k => cat.includes(k))) return 'digital'
    if (['services', 'coaching', 'sport', 'b2b', 'finance', 'immobilier', 'consulting'].some(k => cat.includes(k))) return 'services'
    if (['formation', 'événement', 'tourisme'].some(k => cat.includes(k))) return 'events'
    if (['restauration', 'food'].some(k => cat.includes(k))) return 'food'
    return 'physical'
  }

  const processedTemplates = globalTemplates.filter(t => {
    const matchesSearch = (t.label || '').toLowerCase().includes(templateSearch.toLowerCase()) || (t.desc || '').toLowerCase().includes(templateSearch.toLowerCase()) || (t.category || '').toLowerCase().includes(templateSearch.toLowerCase())
    if (!matchesSearch) return false
    if (selectedGroup === 'all') return true
    return getTemplateGroup(t.category) === selectedGroup
  })

  const previewTemplate = previewTemplateId ? processedTemplates.find(t => t.id === previewTemplateId) : null

  const handleSelectTemplate = (id: TemplateId) => {
    setSelectedTemplate(id)
    const tpl = globalTemplates.find(t => t.id === id)
    if (tpl) {
      setTitle(tpl.defaultTitle)
      setSlug(tpl.defaultTitle
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''))
    }
    setStep(2)
  }

  const handleGeneratePrompt = async () => {
    if (!aiPrompt.trim()) return
    setPromptLoading(true)
    setPromptError(null)
    
    // Injecter les options dans le prompt
    const finalPrompt = `
      Sujet/Description: ${aiPrompt}
      Ton de rédaction souhaité: ${aiTone}
      Langue de la page: ${aiLanguage}
    `

    try {
      const res = await fetch('/api/pages/generate-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, store_id: storeId })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération')

      if (data.pageId) {
        router.push(`/dashboard/pages/${data.pageId}/edit`)
      }
    } catch (err: unknown) {
      setPromptError(err instanceof Error ? err.message : String(err))
    } finally {
      setPromptLoading(false)
    }
  }

  const handleImportUrl = async () => {
    if (!importUrl.trim()) return
    setImportLoading(true)
    setImportError(null)

    try {
      const res = await fetch('/api/pages/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim(), store_id: storeId })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'import')

      if (data.pageId) {
        router.push(`/dashboard/pages/${data.pageId}/edit`)
      }
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : String(err))
      setImportLoading(false)
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim() || !selectedTemplate) {
      setError('Titre et URL sont obligatoires.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const tpl = globalTemplates.find(t => t.id === selectedTemplate)

    const pageId = crypto.randomUUID()
    
    // Determine sections: either from imported template or builtin
    const sectionsToSave = initialTemplateData?.sections 
      || initialTemplateData 
      || tpl?.sections 
      || []

    const { error: insertError } = await supabase
      .from('SalePage')
      .insert({
        id:          pageId,
        store_id:    storeId,
        title:       title.trim(),
        slug:        slug.trim(),
        template:    selectedTemplate || 'default',
        sections:    sectionsToSave,
        product_ids: selectedProducts,
        active,
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Erreur : ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/pages')
    router.refresh()
  }

  // ── ÉTAPE 1 : Sélection du template ──────────────────────────────
  if (step === 1) {
    return (
      <div className="pb-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <header className="py-8 sm:py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink mb-3 tracking-tight">
            Comment voulez-vous créer votre page ?
          </h1>
          <p className="text-slate text-lg max-w-2xl mx-auto">
            Nous avons repensé la création pour aller à l'essentiel. Choisissez l'une de nos 3 méthodes magiques.
          </p>
        </header>

        <div className="space-y-10">
          
          {/* NIVEAU 1 : Génération IA (La Voie Royale) */}
          <section className="bg-gradient-to-br from-[#FFF8E7] to-[#FFF0C2] border-2 border-gold/30 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
            
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 mb-6 shadow-xl shadow-gold/20">
                <div className="bg-white text-gold w-14 h-14 rounded-full flex items-center justify-center">
                   <Wand2 className="w-7 h-7" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-ink mb-4">
                La magie de l'IA
                <span className="block text-xl font-normal text-slate mt-2">Générez une page convertissante en 10 secondes.</span>
              </h2>
              
              <div className="max-w-2xl mx-auto space-y-6 mt-10">
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gold/30 via-amber-300/30 to-gold/30 rounded-2xl blur opacity-25 group-hover/input:opacity-75 transition duration-500"></div>
                  <textarea 
                    rows={4}
                    placeholder={PLACEHOLDERS[placeholderIdx]}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="relative w-full px-6 py-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-gold/40 text-ink placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gold/20 transition-all resize-none shadow-sm text-lg"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGeneratePrompt();
                      }
                    }}
                  />
                </div>
                
                {/* Suggestions Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">Idées :</span>
                  {SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setAiPrompt(s.prompt)}
                      className="text-xs font-medium text-slate bg-white/60 border border-gold/20 px-3 py-1.5 rounded-full hover:bg-gold/10 hover:border-gold/50 hover:text-gold transition-all duration-300 backdrop-blur-sm"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Options Avancées IA */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-gold/20 backdrop-blur-sm shadow-sm hover:border-gold/50 transition-colors">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Langue :</span>
                    <select aria-label="Langue de la page" value={aiLanguage} onChange={e => setAiLanguage(e.target.value)} className="bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer">
                      <option value="fr">🇫🇷 Français</option>
                      <option value="en">🇬🇧 Anglais</option>
                      <option value="ar">🇦🇪 Arabe</option>
                      <option value="wo">🇸🇳 Wolof (Expir.)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-gold/20 backdrop-blur-sm shadow-sm hover:border-gold/50 transition-colors">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ton :</span>
                    <select aria-label="Ton de rédaction de l'IA" value={aiTone} onChange={e => setAiTone(e.target.value)} className="bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer">
                      <option value="persuasif">🎯 Persuasif (Vente forte)</option>
                      <option value="educatif">📚 Éducatif & Expert</option>
                      <option value="amical">🤝 Amical & Proche</option>
                      <option value="mysterieux">🕵️ Mystérieux (Teaser)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleGeneratePrompt}
                    disabled={promptLoading || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-gold to-yellow-500 hover:from-gold-dark hover:to-gold text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-[0_8px_30px_rgb(209,161,24,0.3)] hover:shadow-[0_8px_40px_rgb(209,161,24,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-3"
                  >
                    {promptLoading ? (
                      <span className="flex items-center gap-2">
                         <Sparkles className="w-5 h-5 animate-spin" />
                         Génération magique de votre page...
                      </span>
                    ) : (
                      <>Générer ma page instantanément <ArrowRight className="w-6 h-6" /></>
                    )}
                  </button>
                  {promptError && <p className="text-red-500 font-medium text-sm mt-3">{promptError}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* NIVEAU 2 : Clonage URL */}
          <section className="bg-gradient-to-br from-[#0F7A60] to-[#0A5C48] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20 z-10 hidden sm:flex">
              <Globe className="w-8 h-8 text-emerald-100" />
            </div>

            <div className="flex-1 z-10 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">Nouveau</span>
                <h2 className="text-xl sm:text-2xl font-bold font-display">Cloner une page existante</h2>
              </div>
              <p className="text-emerald-50 text-sm md:text-base leading-relaxed mb-6 md:mb-0 max-w-xl">
                L'IA va aspirer le texte, la structure et les arguments de votre ancienne boutique pour la recréer en version ultra-optimisée sur Yayyam. Magique et immédiat.
              </p>
              
              <div className="flex items-center gap-3 mt-4 opacity-80">
                 <span className="text-xs font-semibold tracking-wider text-emerald-200">Compatible :</span>
                 <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-50 px-2 py-1 rounded border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div> Shopify
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-50 px-2 py-1 rounded border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> Systeme.io
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-50 px-2 py-1 rounded border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div> WooCommerce
                 </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex-shrink-0 z-10 flex flex-col gap-3 sm:min-w-[300px]">
              <input 
                type="url"
                placeholder="https://maboutique.com/produit/x"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/20 transition backdrop-blur-sm"
                onKeyDown={e => e.key === 'Enter' && handleImportUrl()}
              />
              <button 
                onClick={handleImportUrl}
                disabled={importLoading || !importUrl.trim()}
                className="w-full bg-white hover:bg-gray-50 text-[#0F7A60] font-bold px-6 py-3 rounded-xl transition shadow disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {importLoading ? "Aspiration en cours..." : "Cloner la page"}
              </button>
              {importError && <p className="text-red-200 text-xs text-center">{importError}</p>}
            </div>
          </section>

          {/* SÉPARATEUR */}
          <div className="flex items-center gap-4 py-8 mt-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Ou choisir un modèle
              </span>
              <span className="text-[10px] font-bold text-[#0F7A60] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                 <span className="bg-[#0F7A60] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{globalTemplates.length}</span> Modèles design • <span className="text-lg leading-none">∞</span> Pages IA possibles
              </span>
            </div>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* NIVEAU 3 : Barre latérale filtres + Grille */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
            {/* Sidebar Filtres */}
            <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 lg:sticky lg:top-24">
               <div className="relative w-full">
                 <input 
                   type="text" 
                   placeholder="Rechercher (ex: beauté...)" 
                   value={templateSearch}
                   onChange={e => setTemplateSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-white shadow-sm"
                 />
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
               </div>
               
               <div className="flex flex-col gap-1 mx-[-0.5rem] lg:mx-0 lg:bg-white lg:p-2 lg:rounded-2xl lg:border border-gray-100 lg:shadow-sm">
                  {CATEGORY_GROUPS.map(g => {
                    const count = g.id === 'all' 
                      ? globalTemplates.length 
                      : globalTemplates.filter(t => getTemplateGroup(t.category) === g.id).length;
                    
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g.id)}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between text-left ${
                          selectedGroup === g.id
                            ? 'bg-ink text-white shadow-md'
                            : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-ink'
                        }`}
                      >
                        <span className="truncate pr-2">{g.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                          selectedGroup === g.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
               </div>
            </div>

            {/* Grille */}
            <div className="flex-1 w-full min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {processedTemplates.map(t => {
                  const isLocked = t.is_premium && !(purchasedAssetIds || []).includes(t.id)

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (isLocked) {
                          setPurchaseModalId(t.id)
                        } else {
                          setPreviewTemplateId(t.id)
                        }
                      }}
                      className={`relative overflow-hidden ${isLocked ? 'bg-gray-50/50 grayscale-[0.3]' : 'bg-white/70'} backdrop-blur-xl rounded-2xl p-6 text-left border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 group flex flex-col h-full`}
                    >
                      <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 bg-gradient-to-br ${t.color}`} />
                      <div className={`absolute -left-8 -bottom-8 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 delay-100 bg-gradient-to-tr ${t.color}`} />
                      
                      {isLocked && (
                        <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm z-20 border border-amber-200">
                          <Lock size={12} /> {t.price} FCFA
                        </div>
                      )}

                      <div className="relative z-10 flex flex-col gap-4 flex-1 mt-2">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${t.color} text-white shadow-inner group-hover:scale-110 transition-transform origin-left duration-300`}>
                          {t.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`text-base font-bold text-gray-900 group-hover:${t.accent} transition-colors`}>{t.label}</p>
                          <p className="text-sm text-gray-500 mt-1 leading-snug">{t.desc}</p>
                        </div>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[13px] font-bold text-gray-400 group-hover:text-ink transition-colors">
                          {isLocked ? (
                            <>
                              <span className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors border border-amber-100 shadow-sm text-amber-600"><Lock size={12} /></span> 
                              Débloquer
                            </>
                          ) : (
                            <>
                              <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors border border-gray-100 shadow-sm">👁️</span> 
                              Visualiser
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {processedTemplates.length === 0 && (
                <div className="w-full py-12 text-center bg-white/50 rounded-2xl border border-dashed border-gray-200 mt-0">
                  <p className="text-gray-500 font-medium">Aucun modèle trouvé pour votre recherche.</p>
                  <button onClick={() => { setTemplateSearch(''); setSelectedGroup('all'); }} className="mt-4 text-emerald-600 font-bold hover:underline">
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* MODAL ACHAT FREEMIUM */}
        {purchaseModalId && (() => {
          const t = globalTemplates.find(x => x.id === purchaseModalId)
          if (!t) return null
          
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setPurchaseModalId(null)} 
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="text-center mb-6 mt-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm text-amber-500">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-ink">Template Premium</h3>
                  <p className="text-gray-500 mt-2 text-sm">Débloquez le modèle <strong>{t.label}</strong> pour l'utiliser à vie dans votre boutique.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-500">Prix :</span>
                    <span className="text-ink text-xl">{t.price} FCFA</span>
                  </div>
                </div>

                {purchaseError && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
                    {purchaseError}
                  </div>
                )}

                <button
                  disabled={purchaseLoading}
                  onClick={async () => {
                    setPurchaseLoading(true)
                    setPurchaseError(null)
                    const res = await purchaseAssetAction(t.id, 'TEMPLATE', t.price, t.label || 'Template')
                    if (res.success) {
                      setPurchaseModalId(null)
                      // Si on veut forcer le rafraîchissement des achats (ou laisser le composant parent le re-fetcher)
                      router.refresh()
                    } else {
                      setPurchaseError(res.error || 'Erreur inconnue')
                    }
                    setPurchaseLoading(false)
                  }}
                  className="w-full bg-ink hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchaseLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CreditCard size={18} /> Payer avec mon Solde</>}
                </button>
                <p className="text-center text-xs mt-4 text-gray-400 font-medium">Le montant sera déduit de votre solde disponible.</p>
              </div>
            </div>
          )
        })()}

        {/* MODAL DE PREVIEW */}
        {previewTemplate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-5xl h-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-in zoom-in-95 duration-200">
               {/* Close button */}
               <button 
                 onClick={() => setPreviewTemplateId(null)} 
                 className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                 aria-label="Fermer"
               >
                 <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               
               {/* Aperçu Visuel (Mockup) */}
               <div className={`hidden md:flex w-full md:w-[55%] bg-gradient-to-br ${previewTemplate.color} p-8 overflow-y-auto custom-scrollbar flex-col items-center justify-start`}>
                 <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden mt-6 mb-12 border border-white/20 transform hover:scale-[1.02] transition-transform duration-500">
                   {/* Fake Browser Header */}
                   <div className="h-8 bg-gray-50 flex items-center px-4 gap-2 border-b border-gray-100">
                     <span className="w-3 h-3 rounded-full bg-red-400"></span>
                     <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                     <span className="w-3 h-3 rounded-full bg-green-400"></span>
                     <div className="ml-4 h-4 w-32 bg-white rounded-full border border-gray-200"></div>
                   </div>
                   {/* Page Content Wireframe */}
                   <div className="p-6 flex flex-col gap-8 min-h-[500px]">
                     {previewTemplate.sections?.map((s: any, i: number) => {
                       if (s.type === 'hero') return (
                         <div key={i} className="text-center space-y-4 pb-6 border-b border-gray-100">
                           <div className="h-8 w-4/5 bg-gray-200 rounded mx-auto"></div>
                           <div className="space-y-2">
                             <div className="h-3 w-3/4 bg-gray-100 rounded mx-auto"></div>
                             <div className="h-3 w-5/6 bg-gray-100 rounded mx-auto"></div>
                           </div>
                           <div className="h-10 w-1/2 bg-ink rounded-xl mx-auto mt-4"></div>
                         </div>
                       )
                       if (s.type === 'benefits' || s.type === 'services' || s.type === 'gallery') return (
                         <div key={i} className="grid grid-cols-2 gap-4">
                           <div className="h-20 bg-gray-50 rounded-xl border border-gray-100"></div>
                           <div className="h-20 bg-gray-50 rounded-xl border border-gray-100"></div>
                           <div className="h-20 bg-gray-50 rounded-xl border border-gray-100"></div>
                           <div className="h-20 bg-gray-50 rounded-xl border border-gray-100"></div>
                         </div>
                       )
                       if (s.type === 'testimonials') return (
                         <div key={i} className="flex gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                           <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                           <div className="flex-1 space-y-2 py-1">
                             <div className="h-3 w-full bg-gray-200 rounded"></div>
                             <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
                           </div>
                         </div>
                       )
                       if (s.type === 'cta') return (
                         <div key={i} className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center space-y-3 mt-4">
                           <div className="h-5 w-2/3 bg-emerald-200 rounded mx-auto mb-4"></div>
                           <div className="h-12 w-full bg-emerald-500 rounded-xl shadow-sm"></div>
                         </div>
                       )
                       return (
                         <div key={i} className="h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                           <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{s.type}</span>
                         </div>
                       )
                     })}
                   </div>
                 </div>
               </div>

               {/* Infos et Actions */}
               <div className="w-full md:w-[45%] h-full overflow-y-auto bg-white p-8 sm:p-12 flex flex-col custom-scrollbar relative z-10">
                 <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br ${previewTemplate.color} text-white shadow-inner mb-6 flex-shrink-0`}>
                   {previewTemplate.icon}
                 </div>
                 <h2 className="text-3xl font-black text-ink mb-3 tracking-tight">{previewTemplate.label}</h2>
                 <p className="text-gray-500 text-lg mb-8 leading-relaxed">{previewTemplate.desc}</p>
                 
                 <div className="space-y-5 mb-8">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <div className="h-px bg-gray-200 flex-1"></div>
                     Inclus dans ce modèle
                     <div className="h-px bg-gray-200 flex-1"></div>
                   </h3>
                   <ul className="space-y-4">
                     {previewTemplate.sections?.map((s: any, i: number) => {
                       const labels: Record<string, string> = {
                         hero: '🎯 Hero & Accroche marketing',
                         benefits: '✨ Mise en avant des bénéfices clés',
                         testimonials: '💬 Preuve sociale (Témoignages)',
                         faq: '❓ Foire aux questions (FAQ)',
                         cta: '🛒 Bloc Appel à l\'action fort',
                         program: '📚 Affichage de Programme détaillé',
                         coach: '👤 Biographie & Profil',
                         agenda: '📅 Grille de l\'Agenda',
                         menu: '🍽️ Menu interactif',
                         gallery: '🖼️ Galerie Photos premium',
                         countdown: '⏳ Compte à rebours (Urgence)',
                         comparison: '⚖️ Table de comparaison',
                         video: '▶️ Intégration Vidéo optimisée'
                       }
                       const label = labels[s.type] || s.type
                       return (
                         <li key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-700 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100">
                           <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 font-black">✓</div> 
                           {label}
                         </li>
                       )
                     })}
                   </ul>
                 </div>

                 <div className="mt-auto pt-8 space-y-3">
                   <button 
                     onClick={() => {
                       setPreviewTemplateId(null)
                       handleSelectTemplate(previewTemplate.id)
                     }}
                     className="w-full py-4 rounded-xl bg-gradient-to-r from-ink to-slate text-white font-bold text-lg hover:from-black hover:to-ink transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 active:scale-[0.98]"
                   >
                     🚀 Utiliser ce modèle
                   </button>
                   <button 
                     onClick={() => setPreviewTemplateId(null)}
                     className="w-full py-3.5 rounded-xl text-gray-500 font-bold text-[15px] hover:bg-gray-100 hover:text-ink transition-colors"
                   >
                     Retour à la galerie
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── ÉTAPE 2 : Configuration ───────────────────────────────────────
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(1)} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-ink hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${template?.color} text-white shadow-sm`}>
               {template?.icon}
            </div>
            <div>
              <h1 className="text-base font-bold text-ink leading-tight">Finaliser la configuration</h1>
              <p className="text-xs font-medium text-gray-500">Création de : {template?.label}</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Étape 2 / 2</span>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 font-medium text-sm rounded-xl px-5 py-4 flex items-center gap-3 shadow-sm">
             <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">⚠️</div>
             {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* COLONNE GAUCHE : INFOS */}
          <div className="space-y-8">
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-ink">Informations de base</h2>
                <p className="text-sm text-gray-500 mt-1">Donnez une identité forte à votre nouvelle page.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre de la page <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={title}
                    onChange={e => {
                      setTitle(e.target.value)
                      setSlug(e.target.value
                        .toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''))
                    }}
                    placeholder={template?.defaultTitle}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold/50 bg-gray-50/50 text-ink transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL publique de la page</label>
                  <div className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-gold focus-within:border-gold/50 transition-all shadow-inner">
                    <span className="text-sm font-medium text-gray-500 bg-gray-50 px-4 flex items-center border-r border-gray-200 pointer-events-none">yayyam.com/p/</span>
                    <input
                      type="text" value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mon-produit"
                      className="flex-1 px-4 py-4 focus:outline-none bg-white text-ink text-sm"
                    />
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                    <span className="text-green-500">✓</span> Cette URL sera prête à être partagée.
                  </p>
                </div>
              </div>
            </section>

            {/* Design & Options Avancées */}
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-ink">Design & Optimisations (Pro)</h2>
                <p className="text-sm text-gray-500 mt-1">Personnalisez l'ambiance et débloquez la puissance IA.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Ambiance visuelle (Moodboard Bêta)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'minimalist', name: 'Minimaliste', colors: 'from-gray-100 to-white border border-gray-200', text: 'Épuré & Clair' },
                    { id: 'luxury', name: 'Luxe', colors: 'from-black to-gray-800 border border-gray-900', text: 'Noir & Or' },
                    { id: 'dynamic', name: 'Vibrant', colors: 'from-orange-500 to-rose-500', text: 'Vif & Énergique' },
                    { id: 'nature', name: 'Nature', colors: 'from-emerald-500 to-teal-600', text: 'Verts & Terre' },
                  ].map(t => (
                    <button
                      key={t.id} type="button"
                      onClick={() => setPageTheme(t.id)}
                      className={`relative p-3 rounded-xl flex items-center gap-3 transition-all ${
                        pageTheme === t.id ? 'ring-2 ring-gold shadow-sm bg-gray-50/50' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.colors} shadow-inner`}></div>
                      <div className="text-left">
                        <p className={`text-sm font-bold leading-tight ${pageTheme === t.id ? 'text-gold-dark' : 'text-ink'}`}>{t.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{t.text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-lg flex-shrink-0">
                    🧪
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                      A/B Testing Magique <span className="bg-gold/20 text-gold-dark text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Pro</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3 pr-2">Générez 2 variantes de cette page et laissez notre algorithme trouver la version qui convertit le mieux.</p>
                    <button type="button" className="text-xs font-bold text-white bg-ink hover:bg-black px-4 py-2 rounded-lg transition-colors shadow-sm">
                      Débloquer cette fonction
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Statut & Paramètres */}
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Visibilité immédiate</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-[200px]">
                    {active ? 'La page sera publique dès sa création.' : 'La page sera enregistrée comme brouillon.'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={active ? 'Désactiver la publication immédiate' : 'Activer la publication immédiate'}
                  onClick={() => setActive(v => !v)}
                  className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative shadow-inner flex-shrink-0 ${active ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${active ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </section>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-ink to-slate hover:from-black hover:to-ink text-white shadow-xl shadow-ink/10 disabled:opacity-50 font-bold py-5 rounded-2xl transition-all text-lg flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="animate-pulse">Création en cours…</span>
              ) : (
                <>Générer la page avec l'IA ✨</>
              )}
            </button>
          </div>

          {/* COLONNE DROITE : PRODUITS & PREVIEW */}
          <div className="space-y-8">
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8 flex flex-col h-[500px]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-ink">Produits à vendre</h2>
                  <span className="bg-gold/10 text-gold-dark text-xs font-bold px-3 py-1 rounded-full">
                    {selectedProducts.length} sélectionné(s)
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Vous pouvez lier un produit principal et plusieurs produits additionnels (Upsells). L'IA les intégrera dans la page.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <span className="text-4xl mb-3">📦</span>
                  <p className="text-sm text-gray-500 font-medium mb-4">Vous n'avez pas encore de produit dans votre boutique.</p>
                  <a href="/dashboard/products/new" className="text-sm font-bold text-gold hover:text-gold-dark bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100 transition-colors">
                    + Créer mon premier produit
                  </a>
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="Rechercher un produit..." 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold focus:bg-white text-sm transition-all"
                  />
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredProducts.map(p => {
                      const isSelected = selectedProducts.includes(p.id)
                      return (
                        <button
                          key={p.id} type="button"
                          onClick={() => toggleProduct(p.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all text-left group ${
                            isSelected
                              ? 'border-gold bg-gold/5 shadow-sm'
                              : 'border-transparent hover:border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden shadow-sm transition-transform ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}>
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-gold-dark' : 'text-ink'}`}>{p.name}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-1">{p.price.toLocaleString('fr-FR')} FCFA</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-gold bg-gold text-white' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="text-center text-sm text-gray-400 py-6">Aucun produit ne correspond à votre recherche.</p>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Architecture de la page prévue */}
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8">
              <h2 className="text-base font-bold text-ink mb-1">Architecture du modèle</h2>
              <p className="text-xs text-gray-500 mb-6">Voici les blocs visuels qui seront construits pour vous :</p>
              
              <div className="flex flex-wrap gap-2.5">
                {(template?.sections as string[] || []).map((s: string, i: number) => {
                   const labels: Record<string, string> = {
                     hero: '🎯 Hero & Accroche',
                     benefits: '✨ Points forts',
                     testimonials: '💬 Témoignages',
                     faq: '❓ FAQ',
                     cta: '🛒 Appel à l\'action',
                     program: '📚 Programme',
                     coach: '👤 Profil Expert',
                     agenda: '📅 Agenda',
                     menu: '🍽️ Menu',
                     gallery: '🖼️ Galerie Photos',
                     countdown: '⏳ Urgence',
                     comparison: '⚖️ Comparaison',
                     video: '▶️ Vidéos'
                   }
                   const label = labels[s.type] || s.type
                   return (
                     <div key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50 text-gray-600 flex items-center gap-1.5`}>
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                       {label}
                     </div>
                   )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
{/* Support for CSS in modern syntax just in case */}
<style dangerouslySetInnerHTML={{__html: `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
`}} />
    </div>
  )
}
