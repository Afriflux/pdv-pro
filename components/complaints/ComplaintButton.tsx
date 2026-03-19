'use client'

// ─── Bouton "Signaler" avec modale de plainte ─────────────────────────────────
// Utilisable depuis n'importe quelle page (storefront, page produit, etc.)
// POST /api/complaints/create

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ComplaintButtonProps {
  storeId?:   string
  productId?: string
  variant?:   'button' | 'link'
}

type ComplaintType = 'plagiat' | 'fraude' | 'contenu_inapproprie' | 'autre'

interface CreateComplaintBody {
  store_id?:    string
  product_id?:  string
  type:         ComplaintType
  description:  string
  evidence_url?: string
}

const COMPLAINT_TYPES: Array<{ value: ComplaintType; label: string; icon: string }> = [
  { value: 'plagiat',             label: 'Plagiat / Copie illégale',    icon: '©️'  },
  { value: 'fraude',              label: 'Fraude / Arnaque',            icon: '🚨' },
  { value: 'contenu_inapproprie', label: 'Contenu inapproprié',         icon: '⛔' },
  { value: 'autre',               label: 'Autre',                       icon: '❓' },
]

// ─── COMPOSANT ────────────────────────────────────────────────────────────────

export default function ComplaintButton({
  storeId,
  productId,
  variant = 'link',
}: ComplaintButtonProps) {
  const [open,         setOpen]         = useState(false)
  const [type,         setType]         = useState<ComplaintType>('fraude')
  const [description,  setDescription]  = useState('')
  const [evidenceUrl,  setEvidenceUrl]  = useState('')
  const [sending,      setSending]      = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('La description est obligatoire.')
      return
    }

    setSending(true)
    try {
      const body: CreateComplaintBody = {
        type,
        description: description.trim(),
      }
      if (storeId)                       body.store_id    = storeId
      if (productId)                     body.product_id  = productId
      if (evidenceUrl.trim())            body.evidence_url = evidenceUrl.trim()

      const res = await fetch('/api/complaints/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      toast.success('Signalement envoyé. Notre équipe va examiner votre demande. ✅')
      setOpen(false)
      setDescription('')
      setEvidenceUrl('')
      setType('fraude')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur : ' + msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Déclencheur */}
      {variant === 'button' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500
            border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Signaler
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
        >
          <AlertTriangle className="w-3 h-3" />
          Signaler un problème
        </button>
      )}

      {/* Modale */}
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="text-base font-bold text-[#1A1A1A]">🚨 Signaler un problème</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-[#1A1A1A] rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Type de plainte */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Type de problème
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPLAINT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        type === t.value
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Décrivez le problème en détail..."
                  rows={4}
                  required
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all resize-none"
                />
              </div>

              {/* Preuve (lien) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Preuve (lien URL — optionnel)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                  placeholder="https://exemple.com/preuve..."
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending || !description.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4" /> Envoyer le signalement</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
