'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Pencil, X, Save, ExternalLink, Loader2 } from 'lucide-react'

// ─── PROPS ────────────────────────────────────────────────────────────────
interface IntegrationItemProps {
  configKey:    string
  label:        string
  description:  string
  docsUrl:      string | null
  icon:         string
  maskedValue:  string
  isConfigured: boolean
}

// ─── Composant ligne d'intégration avec édition inline ────────────────────
export default function IntegrationItem({
  configKey,
  label,
  description,
  docsUrl,
  icon,
  maskedValue: initialMasked,
  isConfigured: initialConfigured,
}: IntegrationItemProps) {
  const [editing,      setEditing]      = useState(false)
  const [value,        setValue]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [isConfigured, setIsConfigured] = useState(initialConfigured)
  const [maskedValue,  setMaskedValue]  = useState(initialMasked)

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

      // Mise à jour optimiste de l'affichage
      const v = value.trim()
      const masked = v.length <= 8 ? '••••••••' : `${v.slice(0, 4)}••••••••${v.slice(-4)}`
      setMaskedValue(masked)
      setIsConfigured(true)
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

  return (
    <div className="px-6 py-5 group hover:bg-white/40 transition-colors relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Icône + nom + description */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 w-10 h-10 rounded-2xl bg-white/80 shadow-sm border border-white/50 flex items-center justify-center filter drop-shadow-sm">{icon ?? '🔑'}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1A1A1A] truncate group-hover:text-[#0F7A60] transition-colors">{label}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{description}</p>
          </div>
        </div>

        {/* Zone droite : valeur masquée + statut + actions */}
        <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">

          {/* Valeur masquée */}
          {!editing && (
            <code className={`font-mono text-xs px-3 py-1.5 rounded-xl border font-semibold shadow-sm ${
              isConfigured
                ? 'bg-gradient-to-r from-[#0F7A60]/5 to-transparent text-[#0F7A60] border-[#0F7A60]/20'
                : 'bg-white/60 text-gray-400 border-gray-200'
            }`}>
              {maskedValue}
            </code>
          )}

          {/* Badge statut */}
          {!editing && (
            isConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0F7A60]/10 to-teal-500/10 text-[#0F7A60] uppercase border border-[#0F7A60]/20 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Configurée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 text-red-500 uppercase border border-red-200/60 shadow-sm">
                <XCircle className="w-3.5 h-3.5" />
                Manquante
              </span>
            )
          )}

          {/* Lien docs */}
          {docsUrl && !editing && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#0F7A60] transition-colors font-bold"
            >
              Docs <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Bouton Modifier */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-xl border border-white/80 bg-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]
                text-gray-500 hover:border-[#0F7A60]/50 hover:bg-white hover:text-[#0F7A60] transition-all hover:shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Champ d'édition inline */}
      {editing && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 pl-[3.25rem] pb-2">
          <input
            type="password"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Coller la nouvelle clé API..."
            className="flex-1 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl py-3 px-4 text-sm font-mono
              focus:bg-white focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#0F7A60] to-teal-500 text-white text-xs font-bold
                rounded-2xl hover:from-[#0D5C4A] hover:to-[#0F7A60] disabled:opacity-50 transition-all shadow-[0_4px_15px_rgba(15,122,96,0.3)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.4)] border border-[#0F7A60]/50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center justify-center p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
              aria-label="Annuler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
