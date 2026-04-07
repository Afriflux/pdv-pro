'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { CheckCircle2, XCircle, Pencil, X, Save, ExternalLink, Loader2, Eye, EyeOff, Activity, Copy, Clock } from 'lucide-react'

// ─── PROPS ────────────────────────────────────────────────────────────────
interface IntegrationItemProps {
  configKey:    string
  label:        string
  description:  string
  docsUrl:      string | null
  icon:         string
  webhookUrl?:  string
  pingType?:    string
  updatedAt?:   string
  maskedValue:  string
  isConfigured: boolean
  viewMode?:    'grid' | 'list'
}

// ─── Composant ligne d'intégration avec édition inline ────────────────────
export default function IntegrationItem({
  configKey,
  label,
  description,
  docsUrl,
  icon,
  webhookUrl,
  pingType,
  updatedAt,
  maskedValue: initialMasked,
  isConfigured: initialConfigured,
  viewMode = 'grid'
}: IntegrationItemProps) {
  const [editing,      setEditing]      = useState(false)
  const [value,        setValue]        = useState('')
  const [saving,       setSaving]       = useState(false)
  
  const [isConfigured, setIsConfigured] = useState(initialConfigured)
  const [maskedValue,  setMaskedValue]  = useState(initialMasked)
  const [updatedTime,  setUpdatedTime]  = useState(updatedAt)
  
  const [pinging,      setPinging]      = useState(false)
  const [revealing,    setRevealing]    = useState(false)
  const [rawRevealed,  setRawRevealed]  = useState<string | null>(null)

  const handleSave = async () => {
    if (!value.trim()) {
      toast.error('La valeur ne peut pas être vide.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/integrations/update', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: configKey, value: value.trim() }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      // Mise à jour optimiste
      const v = value.trim()
      const masked = v.length <= 8 ? '••••••••' : `${v.slice(0, 4)}••••••••${v.slice(-4)}`
      setMaskedValue(masked)
      setIsConfigured(true)
      setUpdatedTime(new Date().toISOString())
      setRawRevealed(null)
      setEditing(false)
      setValue('')
      toast.success(`${label} mise à jour ✅`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur : ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setValue('')
  }

  const handleReveal = async () => {
    if (rawRevealed) {
      setRawRevealed(null)
      return
    }
    if (!isConfigured) return
    
    setRevealing(true)
    try {
      const res = await fetch('/api/admin/integrations/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: configKey })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRawRevealed(data.value)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la révélation')
    } finally {
      setRevealing(false)
    }
  }

  const handlePing = async () => {
    if (!isConfigured) {
      toast.error('Veuillez d\'abord configurer la clé.')
      return
    }
    setPinging(true)
    try {
      const res = await fetch('/api/admin/integrations/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: configKey, pingType })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test échoué')
      toast.success(data.message || 'Connexion établie avec succès !')
    } catch (err: any) {
      toast.error('Échec de connexion : ' + (err.message || 'Erreur inconnue'))
    } finally {
      setPinging(false)
    }
  }

  const handleCopyWebhook = () => {
    if (!webhookUrl) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${origin}${webhookUrl}`)
    toast.success('Webhook copié dans le presse-papier !')
  }

  const displayValue = rawRevealed || maskedValue
  const formattedDate = updatedTime 
    ? new Date(updatedTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // ─── VUE LISTE ────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(13,92,74,0.06)] transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Contenu principal (gauche) */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-lg border border-gray-100 shadow-inner group-hover:bg-emerald-50 transition-colors">
            {icon ?? '🔑'}
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-black text-gray-900 truncate group-hover:text-emerald-700 transition-colors flex items-center gap-2">
              {label}
              {formattedDate && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 font-normal">
                  <Clock className="w-3 h-3" /> {formattedDate}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{description}</p>
          </div>
        </div>

        {/* Valeur & Badge (droite) */}
        {!editing && (
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-auto w-full border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
             
             {/* Section Valeur + Révéler */}
             <div className="flex items-center gap-1">
               <code className={`font-mono text-[10px] ${rawRevealed ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-gray-500 bg-gray-50 border-gray-100'} font-bold px-2.5 py-1 rounded-lg border transition-colors`}>
                 {displayValue}
               </code>
               {isConfigured && (
                 <button onClick={handleReveal} disabled={revealing} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                   {revealing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (rawRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />)}
                 </button>
               )}
             </div>

             {/* Statut minimaliste en liste */}
             {isConfigured ? (
               <span title="Connecté" className="flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
             ) : (
               <span title="Manquant" className="flex items-center justify-center"><XCircle className="w-4 h-4 text-red-400" /></span>
             )}

             {/* Actions Rapides */}
             <div className="flex items-center gap-1.5 shrink-0 ml-2 border-l border-gray-100 pl-2">
               {webhookUrl && (
                 <button onClick={handleCopyWebhook} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Copier Webhook">
                   <Copy className="w-3.5 h-3.5" />
                 </button>
               )}
               {pingType && isConfigured && (
                 <button onClick={handlePing} disabled={pinging} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Tester la connexion">
                   {pinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                 </button>
               )}
               {docsUrl && (
                <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Docs">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
               )}
               <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-900 hover:text-white flex items-center justify-center transition-all border border-gray-100 shadow-sm hover:shadow-md" title="Modifier">
                  <Pencil className="w-3.5 h-3.5" />
               </button>
             </div>
          </div>
        )}

        {/* Overlay Édition List */}
        {editing && (
           <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 px-4 flex items-center gap-3 animate-in fade-in duration-200">
              <Pencil className="hidden sm:block w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="password"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Nouvelle clé..."
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-mono focus:bg-white focus:border-[#0D5C4A] focus:ring-2 focus:ring-[#0D5C4A]/10 outline-none transition-all shadow-inner"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              />
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C4A] text-white text-xs font-black rounded-xl hover:bg-[#083D31] disabled:opacity-50 transition-all shadow-sm">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Valider</span>
                </button>
                <button title="Annuler" onClick={handleCancel} disabled={saving} className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
           </div>
        )}
      </div>
    )
  }

  // ─── VUE KANBAN (GRILLE) ───────────────────────────────────────────────────
  return (
    <div className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(15,122,96,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-[180px]">
      
      {/* ── HEADER CARD ── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl border border-gray-100 shadow-inner group-hover:bg-emerald-50 transition-colors">
          {icon ?? '🔑'}
        </div>
        
        {/* Badge statut */}
        {!editing && (
          isConfigured ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 uppercase border border-emerald-100">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Connecté</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-50 text-red-500 uppercase border border-red-100">
              <XCircle className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Erreur</span>
            </span>
          )
        )}
      </div>

      {/* ── TITRE & DESC ── */}
      <div className="flex-1 min-w-0 mb-4">
        <h3 className="text-base font-black text-gray-900 truncate group-hover:text-emerald-700 transition-colors flex items-center justify-between">
          {label}
        </h3>
        <p className="text-xs font-medium text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{description}</p>
        
        {formattedDate && (
           <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
             <Clock className="w-3 h-3" /> Mis à jour le {formattedDate}
           </p>
        )}
      </div>

      {/* ── BOTTOM AREA ── */}
      <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col gap-3">
        
        {/* Ligne 1: Secret + Action Oeil */}
        {!editing && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
               <code className={`font-mono text-[10px] sm:text-xs truncate ${rawRevealed ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-gray-500 bg-gray-50 border-gray-100'} font-bold px-2.5 py-1.5 rounded-lg border transition-colors`}>
                 {displayValue}
               </code>
               {isConfigured && (
                 <button onClick={handleReveal} disabled={revealing} className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                   {revealing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (rawRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />)}
                 </button>
               )}
            </div>
          </div>
        )}

        {/* Ligne 2: Webhook / Ping / Edit */}
        {!editing && (
          <div className="flex items-center justify-end gap-1.5">
             {webhookUrl && (
               <button onClick={handleCopyWebhook} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all text-[10px] font-bold" title="Copier ce webhook pour configurer le partenaire">
                 <Copy className="w-3.5 h-3.5" /> Webhook
               </button>
             )}
             
             {pingType && isConfigured && (
               <button onClick={handlePing} disabled={pinging} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50/50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 transition-all text-[10px] font-bold" title="Vérifier la connexion">
                 {pinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />} Tester
               </button>
             )}

             <div className="flex-1"></div>

             {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all bg-gray-50"
                title="Documentation Officielle"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
             <button
                onClick={() => setEditing(true)}
                className="w-8 h-8 shrink-0 rounded-xl bg-gray-900 text-white hover:bg-emerald-700 flex items-center justify-center transition-all shadow-sm hover:shadow-md"
                title="Modifier la clé"
              >
                 <Pencil className="w-3.5 h-3.5" />
              </button>
          </div>
        )}

        {/* ── INLINE EDIT MODE OVERLAY (Grille) ── */}
        {editing && (
           <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 p-6 flex flex-col justify-center animate-in fade-in duration-200">
              <h4 className="text-xs font-black uppercase text-gray-500 mb-3 tracking-wider flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5" />
                Modifier : {label}
              </h4>
              <input
                type="password"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Coller la clé ici..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-mono focus:bg-white focus:border-[#0D5C4A] focus:ring-4 focus:ring-[#0D5C4A]/10 outline-none transition-all shadow-inner mb-4"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              />
              
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#0D5C4A] to-teal-500 text-white text-xs font-black rounded-xl hover:from-[#083D31] hover:to-[#0D5C4A] disabled:opacity-50 transition-all shadow-md"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Validation...' : 'Valider'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-12 h-12 shrink-0 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  aria-label="Annuler"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
           </div>
        )}
      </div>
    </div>
  )
}
