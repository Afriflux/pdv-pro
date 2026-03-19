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
    'w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-[#1A1A1A] ' +
    'focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all ' +
    'placeholder:text-gray-400'

  type FieldDef = { key: string; label: string; placeholder: string; type?: string; helper?: string }

  const renderFields = (fields: FieldDef[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(field => (
        <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
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
      <div className="flex flex-wrap gap-4 border-b border-gray-100 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'general' | 'branding' | 'social')}
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

      <form onSubmit={handleSave} className="space-y-5">
        
        {activeTab === 'general' && renderFields(GENERAL_FIELDS)}
        {activeTab === 'branding' && renderFields(BRANDING_FIELDS)}
        {activeTab === 'social' && renderFields(SOCIAL_FIELDS)}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A]
              disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
