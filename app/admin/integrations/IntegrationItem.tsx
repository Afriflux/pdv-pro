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
    <div className="px-5 py-4 group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">

        {/* Icône + nom + description */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{icon ?? '🔑'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Zone droite : valeur masquée + statut + actions */}
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">

          {/* Valeur masquée */}
          {!editing && (
            <code className={`font-mono text-xs px-2.5 py-1 rounded-lg ${
              isConfigured
                ? 'bg-[#0F7A60]/10 text-[#0F7A60]'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {maskedValue}
            </code>
          )}

          {/* Badge statut */}
          {!editing && (
            isConfigured ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-[#0F7A60]/10 text-[#0F7A60] uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Configurée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-red-50 text-red-500 uppercase">
                <XCircle className="w-3 h-3" />
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
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#0F7A60] transition-colors font-medium"
            >
              Docs <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Bouton Modifier */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200
                text-gray-500 hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Champ d'édition inline */}
      {editing && (
        <div className="mt-3 flex items-center gap-2 pl-9">
          <input
            type="password"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Coller la nouvelle clé API..."
            className="flex-1 bg-[#FAFAF7] border border-gray-200 rounded-xl py-2 px-3 text-sm font-mono
              focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F7A60] text-white text-xs font-bold
              rounded-xl hover:bg-[#0D5C4A] disabled:opacity-50 transition-all flex-shrink-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center p-2 text-gray-400 hover:text-[#1A1A1A] rounded-xl transition-colors"
            aria-label="Annuler"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
