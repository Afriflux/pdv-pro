'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, X, Plus, ArrowUp, ArrowDown } from 'lucide-react'

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
  initialCodPrice: string
  initialCommissionTiers: string
  initialWithdrawalMin: string
  initialPlanFreeTagline: string
  initialPlanCodTagline: string
  initialCtaTitle: string
  initialCtaSubtitle: string
  initialCtaButton: string
}

// ── COMPTEUR D'ONGLETS ───────────────────────────────────────────────────────
type TabId = 'testimonials' | 'faq' | 'pricing'
const TABS: { id: TabId; label: string }[] = [
  { id: 'testimonials', label: 'Témoignages' },
  { id: 'faq', label: 'Questions fréquentes (FAQ)' },
  { id: 'pricing', label: 'Tarifs & CTA' },
]

export default function LandingAdminClient(props: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('testimonials')

  // ETATS LIES AUX ONGLETS
  const [testimonials, setTestimonials] = useState<Testimonial[]>(props.initialTestimonials)
  const [faqs, setFaqs] = useState<FAQ[]>(props.initialFaq)

  const [tarifs, setTarifs] = useState({
    landing_cod_price: props.initialCodPrice,
    landing_commission_tiers: props.initialCommissionTiers,
    landing_withdrawal_min: props.initialWithdrawalMin,
    landing_plan_free_tagline: props.initialPlanFreeTagline,
    landing_plan_cod_tagline: props.initialPlanCodTagline,
    landing_cta_title: props.initialCtaTitle,
    landing_cta_subtitle: props.initialCtaSubtitle,
    landing_cta_button: props.initialCtaButton,
  })

  // LOADING STATES
  const [savingTestimonials, setSavingTestimonials] = useState(false)
  const [savingFaqs, setSavingFaqs] = useState(false)
  const [savingTarifs, setSavingTarifs] = useState(false)

  // --------------------------------------------------------------------------
  // ACTIONS API 
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // TÉMOIGNAGES
  // --------------------------------------------------------------------------
  const handleSaveTestimonials = async () => {
    setSavingTestimonials(true)
    try {
      await saveLandingConfig('landing_testimonials', JSON.stringify(testimonials))
      toast.success('Témoignages sauvegardés ✓')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setSavingTestimonials(false)
    }
  }

  const addTestimonial = () => {
    const newT: Testimonial = {
      id: crypto.randomUUID(),
      name: '',
      city: '',
      country_flag: '🇸🇳',
      business: '',
      quote: '',
      active: true,
    }
    setTestimonials([newT, ...testimonials])
  }

  const updateTestimonial = (id: string, field: keyof Testimonial, val: string | boolean) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
  }

  const removeTestimonial = (id: string) => {
    if (!confirm('Supprimer ce témoignage ?')) return
    setTestimonials(prev => prev.filter(t => t.id !== id))
  }

  // --------------------------------------------------------------------------
  // FAQ
  // --------------------------------------------------------------------------
  const handleSaveFaqs = async () => {
    setSavingFaqs(true)
    try {
      await saveLandingConfig('landing_faq', JSON.stringify(faqs))
      toast.success('FAQ sauvegardées ✓')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setSavingFaqs(false)
    }
  }

  const addFaq = () => {
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order)) : 0
    const newF: FAQ = {
      id: crypto.randomUUID(),
      question: '',
      answer: '',
      order: maxOrder + 1,
      active: true,
    }
    setFaqs([...faqs, newF])
  }

  const updateFaq = (id: string, field: keyof FAQ, val: string | boolean | number) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f))
  }

  const removeFaq = (id: string) => {
    if (!confirm('Supprimer cette question ?')) return
    setFaqs(prev => prev.filter(f => f.id !== id))
  }

  const moveFaq = (index: number, diff: number) => {
    const clone = [...faqs]
    const targetIdx = index + diff
    if (targetIdx < 0 || targetIdx >= clone.length) return
    const temp = clone[index]
    clone[index] = clone[targetIdx]
    clone[targetIdx] = temp
    // Re-assign order purely to array setup
    const reordered = clone.map((f, i) => ({ ...f, order: i + 1 }))
    setFaqs(reordered)
  }

  // --------------------------------------------------------------------------
  // TARIFS
  // --------------------------------------------------------------------------
  const handleSaveTarifs = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTarifs(true)
    try {
      await saveSettingsPlatform(tarifs)
      toast.success('Tarifs et CTA sauvegardés ✓')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setSavingTarifs(false)
    }
  }

  // --------------------------------------------------------------------------
  // UI HELPERS
  // --------------------------------------------------------------------------
  const inputClass = "w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all placeholder:text-gray-400"
  
  return (
    <div className="space-y-6">
      {/* ONGLETS */}
      <div className="flex flex-wrap gap-4 border-b border-gray-100 pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'text-[#0F7A60] border-[#0F7A60]' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENU ONGLET TÉMOIGNAGES */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
             <div>
               <h3 className="font-bold text-[#1A1A1A]">Liste des témoignages ({testimonials.length})</h3>
               <p className="text-xs text-gray-500">Ajoutez les retours d&apos;expérience de vos meilleurs vendeurs.</p>
             </div>
             <button onClick={addTestimonial} className="flex items-center gap-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold text-[#1A1A1A] transition">
               <Plus size={16} /> Ajouter
             </button>
          </div>

          <div className="space-y-4">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-4 relative group">
                 <button onClick={() => removeTestimonial(t.id)} className="absolute top-4 right-4 text-red-400 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">
                   <X size={16} />
                 </button>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pr-8">
                   <div>
                     <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Nom complet</label>
                     <input type="text" value={t.name} onChange={e => updateTestimonial(t.id, 'name', e.target.value)} className={inputClass} placeholder="Moustapha Dieng" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Ville</label>
                     <input type="text" value={t.city} onChange={e => updateTestimonial(t.id, 'city', e.target.value)} className={inputClass} placeholder="Dakar" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Drapeau</label>
                     <input type="text" value={t.country_flag} onChange={e => updateTestimonial(t.id, 'country_flag', e.target.value)} className={inputClass} placeholder="🇸🇳" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Activité</label>
                     <input type="text" value={t.business} onChange={e => updateTestimonial(t.id, 'business', e.target.value)} className={inputClass} placeholder="Vendeur électronique" />
                   </div>
                 </div>
                 <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Citation</label>
                    <textarea value={t.quote} onChange={e => updateTestimonial(t.id, 'quote', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Le meilleur outil..."></textarea>
                 </div>
                 <label className="flex items-center gap-2 cursor-pointer w-max">
                    <input type="checkbox" checked={t.active} onChange={e => updateTestimonial(t.id, 'active', e.target.checked)} className="w-4 h-4 text-[#0F7A60] rounded border-gray-300 focus:ring-[#0F7A60]" />
                    <span className="text-sm font-bold text-[#1A1A1A]">Témoignage public visible</span>
                 </label>
              </div>
            ))}
          </div>
          {testimonials.length > 0 && (
            <div className="flex justify-end pt-2">
              <button type="button" onClick={handleSaveTestimonials} disabled={savingTestimonials} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition">
                 {savingTestimonials ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Sauvegarder les témoignages
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
             <div>
               <h3 className="font-bold text-[#1A1A1A]">Questions courantes ({faqs.length})</h3>
               <p className="text-xs text-gray-500">Renseignez les questions que les vendeurs posent le plus souvent.</p>
             </div>
             <button onClick={addFaq} className="flex items-center gap-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold text-[#1A1A1A] transition">
               <Plus size={16} /> Ajouter
             </button>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={f.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 relative group">
                <div className="flex flex-col gap-1 items-center justify-center pt-6">
                   <button onClick={() => moveFaq(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-30 transition-colors"><ArrowUp size={16}/></button>
                   <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                   <button onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-30 transition-colors"><ArrowDown size={16}/></button>
                </div>
                <div className="flex-1 pr-6 space-y-4">
                   <button onClick={() => removeFaq(f.id)} className="absolute top-4 right-4 text-red-400 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">
                     <X size={16} />
                   </button>
                   <div>
                     <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Question</label>
                     <input type="text" value={f.question} onChange={e => updateFaq(f.id, 'question', e.target.value)} className={inputClass} placeholder="Comment demander un retrait ?" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Réponse</label>
                     <textarea value={f.answer} onChange={e => updateFaq(f.id, 'answer', e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Il suffit d'aller dans..."></textarea>
                   </div>
                   <label className="flex items-center gap-2 cursor-pointer w-max">
                      <input type="checkbox" checked={f.active} onChange={e => updateFaq(f.id, 'active', e.target.checked)} className="w-4 h-4 text-[#0F7A60] rounded border-gray-300 focus:ring-[#0F7A60]" />
                      <span className="text-sm font-bold text-[#1A1A1A]">Question visible en ligne</span>
                   </label>
                </div>
              </div>
            ))}
          </div>
          {faqs.length > 0 && (
            <div className="flex justify-end pt-2">
              <button type="button" onClick={handleSaveFaqs} disabled={savingFaqs} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition">
                 {savingFaqs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Sauvegarder les FAQ
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET TARIFS & CTA */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSaveTarifs} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
           <h3 className="font-bold text-[#1A1A1A] mb-4">Configuration globale des tarifs</h3>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Commission COD (%)</label>
               <input type="text" value={tarifs.landing_cod_price} onChange={e => setTarifs(p => ({...p, landing_cod_price: e.target.value}))} className={inputClass} placeholder="5" />
               <p className="text-xs text-gray-400 mt-1">Ex: &quot;5&quot; pour 5%</p>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Retrait minimum</label>
               <input type="text" value={tarifs.landing_withdrawal_min} onChange={e => setTarifs(p => ({...p, landing_withdrawal_min: e.target.value}))} className={inputClass} placeholder="5 000" />
             </div>
             <div className="sm:col-span-2">
               <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Paliers de commissions (JSON)</label>
               <input type="text" value={tarifs.landing_commission_tiers} onChange={e => setTarifs(p => ({...p, landing_commission_tiers: e.target.value}))} className={inputClass} placeholder="[{&quot;min&quot;:0,&quot;max&quot;:100000,&quot;rate&quot;:7}, ...]" />
               <p className="text-xs text-gray-400 mt-1">Format attendu tableau JSON (ex: [&#123;&quot;min&quot;:0,&quot;max&quot;:100000,&quot;rate&quot;:7&#125;]).</p>
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
             <div className="sm:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Accroche Plan Gratuit</label>
                 <textarea value={tarifs.landing_plan_free_tagline} onChange={e => setTarifs(p => ({...p, landing_plan_free_tagline: e.target.value}))} className={`${inputClass} resize-none`} rows={2} placeholder="Idéal pour démarrer sans risque..." />
             </div>
             <div className="sm:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Accroche Plan COD</label>
                 <textarea value={tarifs.landing_plan_cod_tagline} onChange={e => setTarifs(p => ({...p, landing_plan_cod_tagline: e.target.value}))} className={`${inputClass} resize-none`} rows={2} placeholder="Pour les e-commerçants confirmés..." />
             </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
             <div className="sm:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Titre CTA Final</label>
                 <input type="text" value={tarifs.landing_cta_title} onChange={e => setTarifs(p => ({...p, landing_cta_title: e.target.value}))} className={inputClass} placeholder="Votre boutique peut être live ce soir." />
             </div>
             <div className="sm:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Sous-titre CTA</label>
                 <textarea value={tarifs.landing_cta_subtitle} onChange={e => setTarifs(p => ({...p, landing_cta_subtitle: e.target.value}))} className={`${inputClass} resize-none`} rows={2} placeholder="Rejoignez +500 vendeurs..." />
             </div>
             <div className="sm:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Bouton CTA</label>
                 <input type="text" value={tarifs.landing_cta_button} onChange={e => setTarifs(p => ({...p, landing_cta_button: e.target.value}))} className={inputClass} placeholder="Créer ma boutique maintenant" />
             </div>
           </div>

           <div className="flex justify-end pt-4 border-t border-gray-50">
              <button type="submit" disabled={savingTarifs} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition">
                 {savingTarifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Sauvegarder les tarifs & CTA
              </button>
           </div>
        </form>
      )}

    </div>
  )
}
