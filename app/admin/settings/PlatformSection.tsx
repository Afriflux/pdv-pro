'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2, Save, Upload, ImageIcon, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  { key: 'platform_name',      label: 'Nom de la plateforme', placeholder: 'Yayyam' },
  { key: 'support_email',      label: 'Email support',         placeholder: 'support@yayyam.com', type: 'email' },
  { key: 'support_whatsapp',   label: 'WhatsApp support',      placeholder: '+221 00 000 00 00',  type: 'tel' },
  { key: 'app_url',            label: 'URL publique',          placeholder: 'https://yayyam.com', type: 'url' },
  { key: 'landing_hero_badge', label: 'Badge Héro Promotionnel (Accueil)', placeholder: '🚀 Launch Week...', type: 'text', helper: 'Le petit badge textuel sous le titre principal de l\'accueil' },
]

const MEDIA_FIELDS = [
  { key: 'landing_logo',       label: 'Logo principal (Accueil)',    placeholder: '', type: 'image' },
  { key: 'auth_bg',            label: 'Image de fond (Connexion)',   placeholder: '', type: 'image' },
  { key: 'seo_og_image',       label: 'Aperçu Réseaux Sociaux (OG Image)', placeholder: '', type: 'image', helper: 'Image affichée lors du partage sur WhatsApp/Facebook' },
]

const SEO_FIELDS = [
  { key: 'seo_title',          label: 'Balise Title globale',        placeholder: 'Ma Plateforme - Le meilleur du e-commerce', type: 'text', helper: 'Le titre principal vu sur Google' },
  { key: 'seo_description',    label: 'Meta Description globale',      placeholder: 'Courte description accrocheuse pour le référencement naturel...', type: 'textarea' },
  { key: 'seo_keywords',       label: 'Mots-clés (séparés par virgules)', placeholder: 'ecommerce, afrique, ventes...', type: 'text' },
]

const COMMUNICATIONS_FIELDS = [
  { key: 'email_sender_address', label: 'E-mail système par défaut',     placeholder: 'no-reply@yayyam.com', type: 'text', helper: 'L\'email utilisé par la plateforme pour envoyer les alertes' },
  { key: 'email_sender_name',    label: 'Nom affiché de l\'expéditeur',  placeholder: 'L\'Équipe Yayyam', type: 'text' },
]

const LEGAL_FIELDS = [
  { key: 'legal_cgu_url',     label: 'URL des Conditions Générales (CGU/CGV)', placeholder: 'https://yayyam.com/mentions-legales', type: 'text', helper: 'Lien affiché dans les pages de Checkout' },
  { key: 'legal_privacy_url', label: 'URL Politique de confidentialité',       placeholder: 'https://yayyam.com/politique-confidentialite', type: 'text' },
  { key: 'legal_refund_url',  label: 'URL Politique de Remboursement',         placeholder: 'https://yayyam.com/refunds', type: 'text' },
]



// ----------------------------------------------------------------
// SECTION PARAMÈTRES PLATEFORME — Client Component
// ----------------------------------------------------------------
export default function PlatformSection({ initialConfig }: PlatformSectionProps) {
  const [config,  setConfig]  = useState<Record<string, string>>(initialConfig)
  const [activeTab, setActiveTab] = useState<string>('general')
  const [saving,  setSaving]  = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({})

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleAIGenerate = async (fieldKey: string, type: 'title' | 'description') => {
    setGeneratingAI(prev => ({ ...prev, [fieldKey]: true }))
    try {
      const context = config['platform_name'] || 'Plateforme e-commerce Yayyam'
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, type })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur API IA')
      
      handleChange(fieldKey, data.result)
      toast.success('Texte optimisé généré ! 🪄')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setGeneratingAI(prev => ({ ...prev, [fieldKey]: false }))
    }
  }

  const handleImageUpload = async (key: string, file: File) => {
    setUploading(key)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `platform/${Date.now()}_${key}.${ext}`
      
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      handleChange(key, data.publicUrl)
      toast.success('Image importée et appliquée ✓')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Erreur lors de l'upload: " + msg)
    } finally {
      setUploading(null)
    }
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
    'focus:bg-white focus:border-[#0F7A60] focus-visible:ring-4 focus-visible:ring-[#0F7A60]/10 outline-none transition-all duration-300 ' +
    'shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-gray-400'

  type FieldDef = { key: string; label: string; placeholder: string; type?: string; helper?: string; options?: {label: string; value: string}[] }

  const renderFields = (fields: FieldDef[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {fields.map(field => (
        <div key={field.key} className={`${field.type === 'textarea' ? 'sm:col-span-2' : ''} group`}>
          <div className="flex items-center justify-between mb-1.5 ml-1">
             <label htmlFor={field.key} className="block text-xs font-black text-gray-500 uppercase tracking-wider group-focus-within:text-[#0F7A60] transition-colors">
               {field.label}
             </label>
             {(field.key === 'seo_title' || field.key === 'seo_description') && (
               <button
                 type="button"
                 title="Générer avec l'IA"
                 onClick={() => handleAIGenerate(field.key, field.key === 'seo_title' ? 'title' : 'description')}
                 disabled={generatingAI[field.key]}
                 className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 active:scale-95"
               >
                 {generatingAI[field.key] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                 Aide IA
               </button>
             )}
          </div>
          {field.type === 'select' ? (
            <select
              id={field.key}
              value={config[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={inputCls + ' appearance-none cursor-pointer'}
              title={field.label}
              aria-label={field.label}
            >
              <option value="" disabled>{field.placeholder}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'image' ? (
            <div className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border border-white/60">
               {config[field.key] ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={config[field.key]} alt={field.label} className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm" />
               ) : (
                 <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-5 h-5 opacity-50" />
                 </div>
               )}
               <div className="flex-1">
                 <input
                   type="file"
                   accept="image/*"
                   title={`Uploader ${field.label}`}
                   onChange={(e) => {
                     const f = e.target.files?.[0]
                     if (f) handleImageUpload(field.key, f)
                   }}
                   className="hidden"
                   id={`file-${field.key}`}
                 />
                 <label htmlFor={`file-${field.key}`} className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm ${uploading === field.key ? 'opacity-50 pointer-events-none' : ''}`}>
                   {uploading === field.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                   Changer le fichier
                 </label>
                 {config[field.key] && (
                   <div className="text-[10px] text-gray-400 mt-2 truncate w-48" title={config[field.key]}>
                     {config[field.key]}
                   </div>
                 )}
               </div>
            </div>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.key}
              value={config[field.key] ?? ''}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          ) : (
            <input
              id={field.key}
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
    { id: 'general', label: 'Contact', fields: GENERAL_FIELDS },
    { id: 'media', label: 'Visuels', fields: MEDIA_FIELDS },
    { id: 'seo', label: 'SEO', fields: SEO_FIELDS },
    { id: 'communications', label: 'Notifications', fields: COMMUNICATIONS_FIELDS },
    { id: 'legal', label: 'Légal', fields: LEGAL_FIELDS },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200/50 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'seo'     && renderFields(SEO_FIELDS)}
        {activeTab === 'media'   && renderFields(MEDIA_FIELDS)}
        {activeTab === 'communications' && renderFields(COMMUNICATIONS_FIELDS)}
        {activeTab === 'legal' && renderFields(LEGAL_FIELDS)}

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
