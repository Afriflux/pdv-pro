'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

// ----------------------------------------------------------------
// PROPS — Reçoit la config initiale depuis le Server Component
// ----------------------------------------------------------------
interface PlatformSectionProps {
  initialConfig: Record<string, string>
}

// ----------------------------------------------------------------
// CHAMPS DE CONFIGURATION
// ----------------------------------------------------------------
const GENERAL_FIELDS = [
  { key: 'platform_name',      label: 'Nom de la plateforme', placeholder: 'PDV Pro' },
  { key: 'support_email',      label: 'Email support',         placeholder: 'support@pdvpro.com', type: 'email' },
  { key: 'support_whatsapp',   label: 'WhatsApp support',      placeholder: '+221 00 000 00 00',  type: 'tel' },
  { key: 'app_url',            label: 'URL publique',          placeholder: 'https://pdvpro.com', type: 'url' },
]

const BRANDING_FIELDS = [
  { key: 'landing_hero_badge', label: 'Badge d\'accroche', placeholder: 'Lancement Sénégal · CI · Mali' },
  { key: 'landing_hero_h1', label: 'Titre principal H1 (3 lignes avec sauts de ligne)', placeholder: 'Mon Titre...', type: 'textarea' },
  { key: 'landing_hero_subtitle', label: 'Sous-titre hero', placeholder: 'PDV Pro est la seule plateforme...', type: 'textarea' },
  { key: 'landing_hero_cta_primary', label: 'Texte bouton principal', placeholder: 'Créer ma boutique gratuite' },
  { key: 'landing_markets', label: 'Marchés actifs', placeholder: 'Sénégal, Côte d\'Ivoire, Mali' },
]

const SOCIAL_FIELDS = [
  { key: 'landing_whatsapp_support', label: 'Numéro WhatsApp support', placeholder: '221770000000', helper: 'Format: 221XXXXXXXXX sans le +' },
  { key: 'landing_instagram_url', label: 'URL Instagram complet', placeholder: 'https://instagram.com/pdvpro', type: 'url' },
  { key: 'landing_facebook_url', label: 'URL Facebook complet', placeholder: 'https://facebook.com/pdvpro', type: 'url' },
  { key: 'landing_tiktok_url', label: 'URL TikTok complet', placeholder: 'https://tiktok.com/@pdvpro', type: 'url' },
]

// ----------------------------------------------------------------
// SECTION PARAMÈTRES PLATEFORME — Client Component
// ----------------------------------------------------------------
export default function PlatformSection({ initialConfig }: PlatformSectionProps) {
  const [config,  setConfig]  = useState<Record<string, string>>(initialConfig)
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'social'>('general')
  const [saving,  setSaving]  = useState(false)

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/platform', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ config }),
      })

      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      toast.success('Sauvegardé ✓')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl py-3 px-4 text-sm font-medium text-[#1A1A1A] ' +
    'focus:bg-white focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 outline-none transition-all duration-300 ' +
    'shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-gray-400'

  type FieldDef = { key: string; label: string; placeholder: string; type?: string; helper?: string }

  const renderFields = (fields: FieldDef[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {fields.map(field => (
        <div key={field.key} className={`${field.type === 'textarea' ? 'sm:col-span-2' : ''} group`}>
          <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1 group-focus-within:text-[#0F7A60] transition-colors">
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={config[field.key] ?? ''}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          ) : (
            <input
              type={field.type ?? 'text'}
              value={config[field.key] ?? ''}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputCls}
            />
          )}
          {field.helper && (
            <p className="text-xs text-gray-400 mt-1">{field.helper}</p>
          )}
        </div>
      ))}
    </div>
  )

  const tabs = [
    { id: 'general', label: 'Général', fields: GENERAL_FIELDS },
    { id: 'branding', label: 'Branding Hero', fields: BRANDING_FIELDS },
    { id: 'social', label: 'Réseaux sociaux', fields: SOCIAL_FIELDS },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200/50 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'general' | 'branding' | 'social')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-[#0F7A60]/10 text-[#0F7A60] shadow-sm' 
                : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        
        {activeTab === 'general' && renderFields(GENERAL_FIELDS)}
        {activeTab === 'branding' && renderFields(BRANDING_FIELDS)}
        {activeTab === 'social' && renderFields(SOCIAL_FIELDS)}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60]
              disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-all shadow-[0_4px_15px_rgba(15,122,96,0.2)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
