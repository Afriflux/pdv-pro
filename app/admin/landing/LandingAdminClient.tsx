'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { 
  Loader2, Save, X, Plus, ArrowUp, ArrowDown, 
  MonitorPlay, AlignLeft, MessageSquareQuote, 
  HelpCircle, Tags, Sparkles, Globe, Timer, ExternalLink 
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Testimonial {
  id: string
  name: string
  city: string
  country_flag: string
  business: string
  quote: string
  active: boolean
}

interface FAQ {
  id: string
  question: string
  answer: string
  order: number
  active: boolean
}

interface Props {
  initialTestimonials: Testimonial[]
  initialFaq: FAQ[]
  initialTarifs: Record<string, string>
  initialGeneral: Record<string, string>
}

// ── COMPTEUR D'ONGLETS ───────────────────────────────────────────────────────
type TabId = 'hero' | 'sections' | 'testimonials' | 'faq' | 'pricing' | 'banner' | 'footer'
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'hero', label: 'Accueil & Hero', icon: MonitorPlay },
  { id: 'banner', label: 'Bannière Flash', icon: Timer },
  { id: 'sections', label: 'Copywriting', icon: AlignLeft },
  { id: 'testimonials', label: 'Témoignages', icon: MessageSquareQuote },
  { id: 'faq', label: 'Questions FAQ', icon: HelpCircle },
  { id: 'pricing', label: 'Tarifs & Appels', icon: Tags },
  { id: 'footer', label: 'Footer & Réseaux', icon: Globe },
]

export default function LandingAdminClient(props: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('hero')

  const [testimonials, setTestimonials] = useState<Testimonial[]>(props.initialTestimonials)
  const [faqs, setFaqs] = useState<FAQ[]>(props.initialFaq)

  const [tarifs, setTarifs] = useState(props.initialTarifs)
  const [general, setGeneral] = useState(props.initialGeneral)

  const [savingTestimonials, setSavingTestimonials] = useState(false)
  const [savingFaqs, setSavingFaqs] = useState(false)
  const [savingTarifs, setSavingTarifs] = useState(false)
  const [savingGeneral, setSavingGeneral] = useState(false)

  // ACTIONS API 
  const saveLandingConfig = async (key: string, value: string) => {
    const res = await fetch('/api/admin/landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { [key]: value } }),
    })
    const data = await res.json() as { success?: boolean; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Erreur API')
  }

  const saveSettingsPlatform = async (configParams: Record<string, string>) => {
    const res = await fetch('/api/admin/settings/platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configParams }),
    })
    const data = await res.json() as { success?: boolean; error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Erreur API')
  }

  // HANDLERS
  const updateGeneral = (key: string, val: string) => setGeneral(prev => ({ ...prev, [key]: val }))

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGeneral(true)
    try {
      await saveSettingsPlatform(general)
      toast.success('Modifications propulsées en ligne ✨')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleSaveTestimonials = async () => {
    setSavingTestimonials(true)
    try {
      await saveLandingConfig('landing_testimonials', JSON.stringify(testimonials))
      toast.success('Mur de témoignages mis à jour ✨')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingTestimonials(false)
    }
  }

  const addTestimonial = () => {
    const newT: Testimonial = { id: crypto.randomUUID(), name: '', city: '', country_flag: '🇸🇳', business: '', quote: '', active: true }
    setTestimonials([newT, ...testimonials])
  }

  const updateTestimonial = (id: string, field: keyof Testimonial, val: string | boolean) => setTestimonials(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
  const removeTestimonial = (id: string) => confirm('Flasher ce témoignage ?') && setTestimonials(prev => prev.filter(t => t.id !== id))

  const handleSaveFaqs = async () => {
    setSavingFaqs(true)
    try {
      await saveLandingConfig('landing_faq', JSON.stringify(faqs))
      toast.success('Assistant FAQ synchronisé ✨')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingFaqs(false)
    }
  }

  const addFaq = () => {
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order)) : 0
    setFaqs([...faqs, { id: crypto.randomUUID(), question: '', answer: '', order: maxOrder + 1, active: true }])
  }

  const updateFaq = (id: string, field: keyof FAQ, val: string | boolean | number) => setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f))
  const removeFaq = (id: string) => confirm('Détruire cette question ?') && setFaqs(prev => prev.filter(f => f.id !== id))
  const moveFaq = (index: number, diff: number) => {
    const clone = [...faqs], targetIdx = index + diff
    if (targetIdx < 0 || targetIdx >= clone.length) return
    const temp = clone[index]; clone[index] = clone[targetIdx]; clone[targetIdx] = temp
    setFaqs(clone.map((f, i) => ({ ...f, order: i + 1 })))
  }

  const handleSaveTarifs = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTarifs(true)
    try {
      await saveSettingsPlatform(tarifs)
      toast.success('Moteur de tarification calibré ✨')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingTarifs(false)
    }
  }

  const inputClass = "w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
  const labelClass = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest"
  const cardClass = "bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative z-10 transition-all duration-500"

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-24 items-start w-full relative">
      
      {/* BOUTON PREVIEW FLOTTANT */}
      <a 
        href="/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-4 rounded-full font-bold shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_10px_40px_rgba(16,185,129,0.6)] hover:-translate-y-1 hover:scale-105 transition-all duration-300 group ring-4 ring-emerald-500/20"
        title="Voir le site en direct"
        aria-label="Voir le site en direct"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        Live Preview
        <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform" />
      </a>

      {/* MAC-STYLE VERTICAL TABS SIDEBAR */}
      <div className="w-full lg:w-72 shrink-0 sticky top-8 z-20">
        <div className="flex flex-col p-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                aria-label={`Ouvrir l'onglet ${tab.label}`}
                title={`Onglet ${tab.label}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-start gap-4 px-4 py-3 text-[15px] font-bold rounded-2xl transition-all duration-300 w-full group ${
                  isActive 
                    ? 'text-emerald-900 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.06)] ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-transparent text-slate-400 group-hover:bg-slate-200/50 group-hover:text-slate-600'}`}>
                  <Icon size={18} />
                </div>
                {tab.label}
                {isActive && (
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 w-full min-w-0">
      {/* CONTENU ONGLET HERO */}
      {activeTab === 'hero' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSaveGeneral} className={cardClass}>
             <div className="mb-8">
               <h3 className="text-2xl font-black bg-gradient-to-br from-slate-900 to-slate-500 bg-clip-text text-transparent flex items-center gap-2">
                 <Sparkles className="text-amber-500 w-6 h-6" /> Le Haut de l'Affiche
               </h3>
               <p className="text-slate-500 font-medium mt-1">C'est la première chose que voient vos visiteurs. Frappez fort.</p>
             </div>
             <div className="space-y-6">
                <div className="group">
                  <label htmlFor="landing_hero_badge" className={labelClass}>Badge Promotionnel (Le Tag de lancement)</label>
                  <input id="landing_hero_badge" type="text" value={general.landing_hero_badge || ''} onChange={e => updateGeneral('landing_hero_badge', e.target.value)} className={inputClass} placeholder="🚀 Launch Week — Commission à 5%..." title="Le badge en haut du hero" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">S'affiche tout en haut, laissez vide pour masquer.</p>
                </div>
                <div>
                  <label htmlFor="landing_hero_h1" className={labelClass}>Titre Principal H1 (Le très gros texte)</label>
                  <textarea id="landing_hero_h1" rows={3} value={general.landing_hero_h1 || ''} onChange={e => updateGeneral('landing_hero_h1', e.target.value)} className={`${inputClass} font-display text-xl leading-relaxed resize-none`} placeholder="Commencez à vendre&#10;aujourd'hui.&#10;Encaissez sur Wave/OM." title="Titre principal de la page" />
                  <p className="text-xs text-emerald-500/80 mt-2 font-bold tracking-wide">ASTUCE BIEN VISUELLE : La dernière ligne tapée s'affichera en Vert Magnifique !</p>
                </div>
                <div>
                  <label htmlFor="landing_hero_subtitle" className={labelClass}>La Proposition de Valeur (Sous-titre)</label>
                  <textarea id="landing_hero_subtitle" rows={2} value={general.landing_hero_subtitle || ''} onChange={e => updateGeneral('landing_hero_subtitle', e.target.value)} className={`${inputClass} resize-none`} placeholder="Yayyam est la seule plateforme..." title="Sous titre descriptif" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <label htmlFor="landing_hero_cta_primary" className={labelClass}>Bouton d'Action (Vert)</label>
                    <input id="landing_hero_cta_primary" type="text" value={general.landing_hero_cta_primary || ''} onChange={e => updateGeneral('landing_hero_cta_primary', e.target.value)} className={inputClass} placeholder="Lancer ma boutique" title="Texte du bouton CTA" />
                  </div>
                  <div>
                    <label htmlFor="landing_hero_cta_secondary" className={labelClass}>Bouton Secondaire (Blanc)</label>
                    <input id="landing_hero_cta_secondary" type="text" value={general.landing_hero_cta_secondary || ''} onChange={e => updateGeneral('landing_hero_cta_secondary', e.target.value)} className={inputClass} placeholder="Voir les boutiques actives" title="Texte du bouton secondaire" />
                  </div>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mt-6">
                  <label htmlFor="landing_ticker_text" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Barre de Défilement Infini (Bas de page)</label>
                  <textarea id="landing_ticker_text" rows={3} value={general.landing_ticker_text || ''} onChange={e => updateGeneral('landing_ticker_text', e.target.value)} className={`${inputClass} font-mono text-sm resize-none`} placeholder="Texte 1 , Texte 2 , Texte 3" title="Texte de la barre défilante, séparé par des virgules" />
                  <p className="text-xs text-slate-400 mt-3 font-medium">Séparez chaque argument par une virgule pour créer la bande défilante infinie en bas du site.</p>
                </div>
             </div>
             <div className="flex justify-end pt-8 mt-8 border-t border-slate-100 relative">
                <button type="submit" disabled={savingGeneral} aria-label="Sauvegarder les modifications générales" title="Sauvegarder" className="group relative inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-0.5 overflow-hidden">
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                   <span className="relative z-10 flex items-center gap-2">
                     {savingGeneral ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     Mettre en ligne
                   </span>
                </button>
             </div>
          </form>
        </div>
      )}

      {/* CONTENU ONGLET BANNIÈRE URGENTE */}
      {activeTab === 'banner' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSaveGeneral} className={cardClass}>
             <div className="mb-10">
               <h3 className="text-2xl font-black bg-gradient-to-br from-orange-500 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
                 <Timer className="text-red-500 w-6 h-6" /> Bandeau d'Urgence Promotionnel
               </h3>
               <p className="text-slate-500 font-medium mt-1">Affichez un compte à rebours dynamique tout en haut de la plateforme pour booster les conversions lors des événements spéciaux.</p>
             </div>
             
             <div className="space-y-8 bg-orange-50/50 p-8 rounded-2xl border border-orange-100">
                <div>
                  <label htmlFor="landing_banner_text" className={labelClass}>Texte Annonce (Accroche)</label>
                  <input id="landing_banner_text" type="text" value={general.landing_banner_text || ''} onChange={e => updateGeneral('landing_banner_text', e.target.value)} className={inputClass} placeholder="Ex: Lancement officiel le 1er Avril 2026" title="Accroche de la bannière" />
                </div>
                <div>
                  <label htmlFor="landing_banner_date" className={labelClass}>Date d'Expiration et d'Objectif (Format ISO)</label>
                  <input id="landing_banner_date" type="text" value={general.landing_banner_date || ''} onChange={e => updateGeneral('landing_banner_date', e.target.value)} className={inputClass} placeholder="2026-04-01T00:00:00Z" title="Date d'expiration de la promotion" />
                  <p className="text-xs text-slate-400 mt-2">Le compteur descendra jusqu'à cette date exacte. Une fois dépassée, le bandeau disparaîtra automatiquement.</p>
                </div>
                <label className="inline-flex items-center gap-3 cursor-pointer p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition w-full">
                  <input type="checkbox" id="landing_banner_active" checked={general.landing_banner_active === 'true'} onChange={e => updateGeneral('landing_banner_active', e.target.checked ? 'true' : 'false')} className="w-5 h-5 text-orange-600 rounded-md border-slate-300 focus:ring-orange-500" title="Activer le bandeau promotionnel" />
                  <span className="font-bold text-slate-700">Activer le bandeau en haut de page</span>
                </label>
             </div>
             
             <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                <button type="submit" disabled={savingGeneral} aria-label="Mettre en ligne la bannière promotionnelle" title="Mettre en Ligne" className="group relative inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5">
                   {savingGeneral ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   Publier la Promotion
                </button>
             </div>
          </form>
        </div>
      )}

      {/* CONTENU ONGLET SECTIONS TEXTES */}
      {activeTab === 'sections' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSaveGeneral} className={cardClass}>
             <div className="mb-10">
               <h3 className="text-2xl font-black bg-gradient-to-br from-slate-900 to-slate-500 bg-clip-text text-transparent">L'Art du Copywriting</h3>
               <p className="text-slate-500 font-medium mt-1">Sculptez chaque section de votre tunnel de vente.</p>
             </div>
             
             <div className="space-y-12">
               {/* PROBLÈME */}
               <div className="relative pl-10 before:absolute before:inset-y-0 before:left-3 before:w-[2px] before:bg-red-500/20 hover:before:bg-red-500/60 transition duration-300">
                 <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-500 font-bold text-xs shadow-sm">1</div>
                 <h4 className="text-lg font-bold text-slate-800 mb-6">Attaquer le Problème WhatsApp</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="landing_problem_supertitle" className={labelClass}>Sur-titre Rouge</label>
                      <input id="landing_problem_supertitle" type="text" value={general.landing_problem_supertitle || ''} onChange={e => updateGeneral('landing_problem_supertitle', e.target.value)} className={inputClass} placeholder="Le Casse-tête" title="Surtitre problème" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="landing_problem_title" className={labelClass}>Titre H2</label>
                      <input id="landing_problem_title" type="text" value={general.landing_problem_title || ''} onChange={e => updateGeneral('landing_problem_title', e.target.value)} className={inputClass} placeholder="La vente sur WhatsApp est brisée." title="Titre problème" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="landing_problem_subtitle" className={labelClass}>Texte Explicatif</label>
                      <textarea id="landing_problem_subtitle" rows={2} value={general.landing_problem_subtitle || ''} onChange={e => updateGeneral('landing_problem_subtitle', e.target.value)} className={inputClass} title="Explicatif problème" />
                    </div>
                 </div>
               </div>

               {/* SOLUTION */}
               <div className="relative pl-10 before:absolute before:inset-y-0 before:left-3 before:w-[2px] before:bg-emerald-500/20 hover:before:bg-emerald-500/60 transition duration-300">
                 <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-xs shadow-sm">2</div>
                 <h4 className="text-lg font-bold text-slate-800 mb-6">Apporter la Solution Magique</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="landing_solution_supertitle" className={labelClass}>Sur-titre Émeraude</label>
                      <input id="landing_solution_supertitle" type="text" value={general.landing_solution_supertitle || ''} onChange={e => updateGeneral('landing_solution_supertitle', e.target.value)} className={inputClass} title="Surtitre solution" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="landing_solution_title" className={labelClass}>Titre H2</label>
                      <input id="landing_solution_title" type="text" value={general.landing_solution_title || ''} onChange={e => updateGeneral('landing_solution_title', e.target.value)} className={inputClass} title="Titre solution" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="landing_solution_subtitle" className={labelClass}>Texte Explicatif</label>
                      <textarea id="landing_solution_subtitle" rows={3} value={general.landing_solution_subtitle || ''} onChange={e => updateGeneral('landing_solution_subtitle', e.target.value)} className={inputClass} title="Explicatif solution" />
                    </div>
                 </div>
               </div>

               {/* FONCTIONNALITÉS */}
               <div className="relative pl-10 before:absolute before:inset-y-0 before:left-3 before:w-[2px] before:bg-amber-500/20 hover:before:bg-amber-500/60 transition duration-300">
                 <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-xs shadow-sm">3</div>
                 <h4 className="text-lg font-bold text-slate-800 mb-6">L'Arsenal (Fonctionnalités)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="landing_features_supertitle" className={labelClass}>Sur-titre</label>
                      <input id="landing_features_supertitle" type="text" value={general.landing_features_supertitle || ''} onChange={e => updateGeneral('landing_features_supertitle', e.target.value)} className={inputClass} title="Surtitre arsenal" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="landing_features_title" className={labelClass}>Grand Titre</label>
                      <input id="landing_features_title" type="text" value={general.landing_features_title || ''} onChange={e => updateGeneral('landing_features_title', e.target.value)} className={inputClass} title="Titre arsenal" />
                    </div>
                 </div>
               </div>

               {/* SECTEURS & TELEGRAM */}
               <div className="relative pl-10 before:absolute before:border-l-2 before:border-dashed before:inset-y-0 before:left-3 before:border-slate-300">
                 <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shadow-sm">4</div>
                 <h4 className="text-lg font-bold text-slate-800 mb-6">Secteurs & Module Telegram</h4>
                 <div className="grid grid-cols-1 gap-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="landing_sectors_supertitle" className={labelClass}>Sur-Titre Secteurs</label>
                        <input id="landing_sectors_supertitle" type="text" value={general.landing_sectors_supertitle || ''} onChange={e => updateGeneral('landing_sectors_supertitle', e.target.value)} className={inputClass} title="Surtitre secteurs" />
                      </div>
                      <div>
                        <label htmlFor="landing_sectors_title" className={labelClass}>Titre Secteurs</label>
                        <input id="landing_sectors_title" type="text" value={general.landing_sectors_title || ''} onChange={e => updateGeneral('landing_sectors_title', e.target.value)} className={inputClass} title="Titre secteurs" />
                      </div>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div>
                      <label htmlFor="landing_telegram_title" className={labelClass}>Titre Module Telegram (Multilignes)</label>
                      <textarea id="landing_telegram_title" rows={2} value={general.landing_telegram_title || ''} onChange={e => updateGeneral('landing_telegram_title', e.target.value)} className={`${inputClass} font-mono`} title="Titre Telegram" />
                    </div>
                    <div>
                      <label htmlFor="landing_telegram_subtitle" className={labelClass}>Description Telegram</label>
                      <textarea id="landing_telegram_subtitle" rows={3} value={general.landing_telegram_subtitle || ''} onChange={e => updateGeneral('landing_telegram_subtitle', e.target.value)} className={inputClass} title="Description Telegram" />
                    </div>
                 </div>
               </div>
             </div>
             
             <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                <button type="submit" disabled={savingGeneral} aria-label="Compiler les sections textes" title="Sauvegarder les sections" className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5">
                   {savingGeneral ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   Compiler le Copywriting
                </button>
             </div>
          </form>
        </div>
      )}

      {/* CONTENU ONGLET TÉMOIGNAGES */}
      {activeTab === 'testimonials' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100">
             <div>
               <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent mb-1">Hall de la Gloire ({testimonials.length})</h3>
               <p className="text-slate-500 font-medium">Les témoignages de vos héros convertissent plus que n'importe quelle publicité.</p>
             </div>
             <button aria-label="Ajouter un témoignage" title="Ajouter un Héros" onClick={addTestimonial} className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-sm font-bold text-emerald-700 transition">
               <Plus size={18} /> Ajouter un Héros
             </button>
          </div>

          <div className="space-y-6">
            {testimonials.map((t, idx) => (
              <div key={t.id} className="bg-white border-2 border-slate-100 hover:border-emerald-500/30 rounded-[2rem] p-8 relative group transition-all duration-300 shadow-sm hover:shadow-xl">
                 <button onClick={() => removeTestimonial(t.id)} aria-label="Supprimer ce témoignage" title="Supprimer" className="absolute top-6 right-6 text-red-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all">
                   <X size={20} />
                 </button>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pr-12">
                   <div>
                     <label htmlFor={`t_name_${t.id}`} className={labelClass}>Rangs #{idx+1} — Nom</label>
                     <input id={`t_name_${t.id}`} type="text" value={t.name} onChange={e => updateTestimonial(t.id, 'name', e.target.value)} className={inputClass} placeholder="Nom" title="Nom du client" />
                   </div>
                   <div>
                     <label htmlFor={`t_city_${t.id}`} className={labelClass}>Ville</label>
                     <input id={`t_city_${t.id}`} type="text" value={t.city} onChange={e => updateTestimonial(t.id, 'city', e.target.value)} className={inputClass} title="Ville du client" />
                   </div>
                   <div>
                     <label htmlFor={`t_flag_${t.id}`} className={labelClass}>Drapeau</label>
                     <input id={`t_flag_${t.id}`} type="text" value={t.country_flag} onChange={e => updateTestimonial(t.id, 'country_flag', e.target.value)} className={inputClass} title="Drapeau emoji" />
                   </div>
                   <div>
                     <label htmlFor={`t_biz_${t.id}`} className={labelClass}>Activité / Niche</label>
                     <input id={`t_biz_${t.id}`} type="text" value={t.business} onChange={e => updateTestimonial(t.id, 'business', e.target.value)} className={inputClass} title="Business du client" />
                   </div>
                 </div>
                 <div className="mb-6">
                    <label htmlFor={`t_quote_${t.id}`} className={labelClass}>Leurs Mots (Témoignage Poignant)</label>
                    <textarea id={`t_quote_${t.id}`} value={t.quote} onChange={e => updateTestimonial(t.id, 'quote', e.target.value)} className={`${inputClass} resize-none min-h-[100px] text-lg font-serif italic text-slate-700 bg-slate-50/50`} placeholder="« Ce logiciel a changé ma vie... »" title="Avis authentique du client" />
                 </div>
                 <label htmlFor={`t_active_${t.id}`} className="inline-flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-emerald-500/30 transition">
                    <input id={`t_active_${t.id}`} type="checkbox" checked={t.active} onChange={e => updateTestimonial(t.id, 'active', e.target.checked)} className="w-5 h-5 text-emerald-500 rounded-md border-slate-300 focus:ring-emerald-500" title="Afficher publiquement ?" />
                    <span className="text-sm font-bold text-slate-700">Publié sur la page Ventes</span>
                 </label>
              </div>
            ))}
          </div>
          {testimonials.length > 0 && (
            <div className="flex justify-end pt-6">
              <button aria-label="Fixer et sauvegarder les témoignages" title="Sauvegarder" type="button" onClick={handleSaveTestimonials} disabled={savingTestimonials} className="group flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all">
                 {savingTestimonials ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 Fixer le Hall de la Gloire
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET FAQ */}
      {activeTab === 'faq' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
           <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100">
             <div>
               <h3 className="text-2xl font-black bg-gradient-to-r from-blue-900 to-indigo-600 bg-clip-text text-transparent mb-1">Centre Neuro-FAQ ({faqs.length})</h3>
               <p className="text-slate-500 font-medium">Répondez aux objections avant même qu'elles ne soient formulées.</p>
             </div>
             <button aria-label="Nouvelle question FAQ" title="Ajouter une section FAQ" onClick={addFaq} className="flex items-center gap-2 px-6 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-bold text-indigo-700 transition">
               <Plus size={18} /> Nouvelle Question
             </button>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={f.id} className="bg-white border border-slate-100 hover:border-indigo-200 rounded-[2rem] p-6 flex gap-6 relative group transition-all duration-300 shadow-sm">
                <div className="flex flex-col gap-2 items-center justify-center pt-8">
                   <button onClick={() => moveFaq(i, -1)} disabled={i === 0} aria-label="Monter l'élément FAQ" title="Monter" className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ArrowUp size={20}/></button>
                   <span className="text-sm font-black text-slate-300 bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center border border-slate-100">{i + 1}</span>
                   <button onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1} aria-label="Descendre l'élément FAQ" title="Descendre" className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ArrowDown size={20}/></button>
                </div>
                <div className="flex-1 pr-10 space-y-6">
                   <button onClick={() => removeFaq(f.id)} aria-label="Supprimer cette FAQ" title="Supprimer FAQ" className="absolute top-4 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                     <X size={20} />
                   </button>
                   <div>
                     <label htmlFor={`faq_q_${f.id}`} className={labelClass}>L'Objection (Question Clé)</label>
                     <input id={`faq_q_${f.id}`} type="text" value={f.question} onChange={e => updateFaq(f.id, 'question', e.target.value)} className={`${inputClass} font-bold text-indigo-950 focus:border-indigo-500 focus:ring-indigo-500/10`} title="Question posée" />
                   </div>
                   <div>
                     <label htmlFor={`faq_a_${f.id}`} className={labelClass}>Le Destructeur d'Objection (Réponse)</label>
                     <textarea id={`faq_a_${f.id}`} value={f.answer} onChange={e => updateFaq(f.id, 'answer', e.target.value)} className={`${inputClass} resize-none min-h-[100px] text-slate-600`} title="Réponse détaillée" />
                   </div>
                   <label htmlFor={`faq_act_${f.id}`} className="inline-flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200/60 transition">
                      <input id={`faq_act_${f.id}`} type="checkbox" checked={f.active} onChange={e => updateFaq(f.id, 'active', e.target.checked)} className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500" title="Rendre la FAQ publique" />
                      <span className="text-sm font-bold text-slate-700">En ligne et indexé</span>
                   </label>
                </div>
              </div>
            ))}
          </div>
          {faqs.length > 0 && (
            <div className="flex justify-end pt-4">
              <button type="button" aria-label="Sauvegarder la FAQ" title="Sauvegarder" onClick={handleSaveFaqs} disabled={savingFaqs} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.2)] transition-all">
                 {savingFaqs ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 Éduquer l'Audience
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET TARIFS & CTA */}
      {activeTab === 'pricing' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSaveTarifs} className={cardClass}>
             <div className="mb-10 flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mb-4 shadow-inner">
                 <Tags size={32} />
               </div>
               <h3 className="text-3xl font-black text-slate-900">Le Moteur Économique</h3>
               <p className="text-slate-500 font-medium mt-2">Structurez vos appels à l'action finaux et vos variables d'écosystème COD.</p>
             </div>
             
             <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl font-medium"></div>
               <h4 className="text-lg font-bold text-slate-800 mb-6 relative z-10">Variables Cash on Delivery (COD)</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                 <div>
                   <label htmlFor="landing_cod_price" className={labelClass}>Commission COD Standard (%)</label>
                   <div className="relative">
                      <input id="landing_cod_price" type="text" value={tarifs.landing_cod_price || ''} onChange={e => setTarifs(p => ({...p, landing_cod_price: e.target.value}))} className={`${inputClass} pl-10 text-xl font-bold font-mono text-amber-600`} title="Prix commission fixe COD" />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                   </div>
                 </div>
                 <div>
                   <label htmlFor="landing_withdrawal_min" className={labelClass}>Seuil de retrait (FCFA)</label>
                   <input id="landing_withdrawal_min" type="text" value={tarifs.landing_withdrawal_min || ''} onChange={e => setTarifs(p => ({...p, landing_withdrawal_min: e.target.value}))} className={`${inputClass} text-xl font-bold font-mono text-slate-700`} title="Seuil minimum de retrait" />
                 </div>
                 <div className="sm:col-span-2">
                   <label htmlFor="landing_commission_tiers" className={labelClass}>Machine à Paliers (JSON Tableau)</label>
                   <input id="landing_commission_tiers" type="text" value={tarifs.landing_commission_tiers || ''} onChange={e => setTarifs(p => ({...p, landing_commission_tiers: e.target.value}))} className={`${inputClass} font-mono text-blue-600 bg-blue-50/50`} title="Tableau JSON Paliers" />
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pt-8 border-t border-slate-100">
               <div className="sm:col-span-2">
                   <label htmlFor="landing_plan_free_tagline" className={labelClass}>Sous-titre Plan Gratuit (Psychologie)</label>
                   <textarea id="landing_plan_free_tagline" value={tarifs.landing_plan_free_tagline || ''} onChange={e => setTarifs(p => ({...p, landing_plan_free_tagline: e.target.value}))} className={`${inputClass} resize-none min-h-[80px]`} title="Tagline plan gratuit" />
               </div>
               <div className="sm:col-span-2">
                   <label htmlFor="landing_plan_cod_tagline" className={labelClass}>Sous-titre Plan COD (Psychologie)</label>
                   <textarea id="landing_plan_cod_tagline" value={tarifs.landing_plan_cod_tagline || ''} onChange={e => setTarifs(p => ({...p, landing_plan_cod_tagline: e.target.value}))} className={`${inputClass} resize-none min-h-[80px]`} title="Tagline plan COD" />
               </div>
             </div>
             
             <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
               <h4 className="text-lg font-bold text-emerald-400 mb-6">Le Coup de Grâce (Footer CTA)</h4>
               <div className="grid grid-cols-1 gap-6">
                 <div>
                     <label htmlFor="landing_cta_title" className="block text-xs font-bold text-emerald-200/50 mb-2 uppercase tracking-widest">Le Grand Titre d'Action</label>
                     <input id="landing_cta_title" type="text" value={tarifs.landing_cta_title || ''} onChange={e => setTarifs(p => ({...p, landing_cta_title: e.target.value}))} className={`${inputClass} bg-white/10 border-white/10 text-white focus:bg-white/20 placeholder:text-white/30 text-2xl font-bold`} title="Titre de fin pour agir" />
                 </div>
                 <div>
                     <label htmlFor="landing_cta_subtitle" className="block text-xs font-bold text-emerald-200/50 mb-2 uppercase tracking-widest">Le Sentiment d'Urgence (Sous-titre)</label>
                     <textarea id="landing_cta_subtitle" value={tarifs.landing_cta_subtitle || ''} onChange={e => setTarifs(p => ({...p, landing_cta_subtitle: e.target.value}))} className={`${inputClass} bg-white/10 border-white/10 text-white focus:bg-white/20 placeholder:text-white/30 resize-none`} rows={2} title="Texte urgence final" />
                 </div>
                 <div>
                     <label htmlFor="landing_cta_button" className="block text-xs font-bold text-emerald-200/50 mb-2 uppercase tracking-widest">Bouton Final</label>
                     <input id="landing_cta_button" type="text" value={tarifs.landing_cta_button || ''} onChange={e => setTarifs(p => ({...p, landing_cta_button: e.target.value}))} className={`${inputClass} bg-emerald-500 border-emerald-400 text-white placeholder:text-emerald-100 font-bold text-center text-lg`} title="Bouton CTA" />
                 </div>
               </div>
             </div>

             <div className="flex justify-center mt-12 w-full">
                <button aria-label="Appliquer les tarifs" title="Sauvegarder" type="submit" disabled={savingTarifs} className="group w-full max-w-sm flex justify-center items-center gap-3 px-8 py-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black text-lg rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02]">
                   {savingTarifs ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                   VERROUILLER LES APPELS
                </button>
             </div>
          </form>
        </div>
      )}

      {/* CONTENU ONGLET FOOTER & RS */}
      {activeTab === 'footer' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSaveGeneral} className={cardClass}>
             <div className="mb-10 flex flex-col items-start border-b border-slate-100 pb-8">
               <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-2">
                 <Globe className="text-emerald-500 w-7 h-7" /> Réseaux & Pied de page
               </h3>
               <p className="text-slate-500 font-medium mt-2">Connectez et gérez vos URL externes affichées dans le vrai footer public.</p>
             </div>
             
             <div className="space-y-6">
                <div>
                  <label htmlFor="landing_instagram_url" className={labelClass}>URL de la page Instagram</label>
                  <input id="landing_instagram_url" type="url" value={general.landing_instagram_url || ''} onChange={e => updateGeneral('landing_instagram_url', e.target.value)} className={inputClass} placeholder="https://instagram.com/yayyam..." title="Lien complet Instagram" />
                </div>
                <div>
                  <label htmlFor="landing_facebook_url" className={labelClass}>URL de la page Facebook</label>
                  <input id="landing_facebook_url" type="url" value={general.landing_facebook_url || ''} onChange={e => updateGeneral('landing_facebook_url', e.target.value)} className={inputClass} placeholder="https://facebook.com/yayyam..." title="Lien complet Facebook" />
                </div>
                <div>
                  <label htmlFor="landing_whatsapp_support" className={labelClass}>Téléphone Support WhatsApp</label>
                  <input id="landing_whatsapp_support" type="tel" value={general.landing_whatsapp_support || ''} onChange={e => updateGeneral('landing_whatsapp_support', e.target.value)} className={inputClass} placeholder="221780476393" title="Format international requis sans le +" />
                  <p className="text-xs text-slate-400 mt-2 italic">Entrez le numéro avec son indicatif format international complet, sans le '+' (Ex: 22177... ou 22507...). Un clic déclenchera une discussion sur WhatsApp !</p>
                </div>
             </div>
             
             <div className="flex justify-end pt-8 mt-8 border-t border-slate-100">
                <button type="submit" disabled={savingGeneral} aria-label="Sauvegarder les réseaux sociaux" title="Enregistrer le Footer" className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5">
                   {savingGeneral ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   Enregistrer le Footer
                </button>
             </div>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}
