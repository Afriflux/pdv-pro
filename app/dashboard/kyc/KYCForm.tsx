/* eslint-disable react/forbid-dom-props */
'use client'

// ─── app/dashboard/kyc/KYCForm.tsx ───────────────────────────────────────────
// Composant client — Formulaire KYC 3 étapes pour les vendeurs
// Étape 1 : Identité (type doc + upload recto/verso + nom complet)
// Étape 2 : Justificatif domicile (optionnel)
// Étape 3 : Récapitulatif + soumission → POST /api/kyc/submit

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type DocumentType = 'cni' | 'passeport' | 'permis'
type UploadState  = 'idle' | 'uploading' | 'done' | 'error'

interface KYCFormProps {
  storeId:         string
  initialStatus:   string | null
  rejectionReason?: string | null
}

// ─── Barre de progression ─────────────────────────────────────────────────────

function KycProgress({ current, total }: { current: number; total: number }) {
  const labels = ['Identité', 'Domicile', 'Vérification']
  const icons  = ['🪪', '🏠', '✅']

  return (
    <div className="mb-6">
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-[#0F7A60] rounded-full transition-all duration-500"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between">
        {labels.map((label, i) => {
          const n = i + 1
          return (
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                n < current  ? 'border-[#0F7A60] bg-[#0F7A60] text-white'
                : n === current ? 'border-[#0F7A60] bg-white shadow-md ring-4 ring-[#0F7A60]/10'
                               : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}>
                {n < current ? '✓' : icons[i]}
              </div>
              <span className={`text-[10px] font-bold hidden sm:block ${n === current ? 'text-[#0F7A60]' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function KYCForm({ storeId, initialStatus, rejectionReason }: KYCFormProps) {
  const router   = useRouter()
  const supabase = createClient()

  const TOTAL_STEPS = 3
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Données identité
  const [documentType, setDocumentType] = useState<DocumentType>('cni')
  const [fullName,     setFullName]     = useState('')
  const [idCardUrl,    setIdCardUrl]    = useState('')
  const [idCardBackUrl, setIdCardBackUrl] = useState('')
  const [domicileUrl,  setDomicileUrl]  = useState('')

  // États upload
  const [rectoState,   setRectoState]   = useState<UploadState>('idle')
  const [versoState,   setVersoState]   = useState<UploadState>('idle')
  const [domicileState, setDomicileState] = useState<UploadState>('idle')

  const rectoRef    = useRef<HTMLInputElement>(null)
  const versoRef    = useRef<HTMLInputElement>(null)
  const domicileRef = useRef<HTMLInputElement>(null)

  // ── Helper upload Supabase Storage ────────────────────────────────────────

  const uploadFile = useCallback(async (
    file: File,
    path: string,
    setStatus: (s: UploadState) => void
  ): Promise<string | null> => {
    setStatus('uploading')
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true })

    if (error) {
      setStatus('error')
      toast.error(`Upload échoué : ${error.message}`)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(path)

    setStatus('done')
    return publicUrl
  }, [supabase])

  // ── Handlers upload ────────────────────────────────────────────────────────

  async function handleRecto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5 MB'); return }
    const url = await uploadFile(file, `${storeId}/recto-${Date.now()}.${file.name.split('.').pop()}`, setRectoState)
    if (url) setIdCardUrl(url)
  }

  async function handleVerso(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5 MB'); return }
    const url = await uploadFile(file, `${storeId}/verso-${Date.now()}.${file.name.split('.').pop()}`, setVersoState)
    if (url) setIdCardBackUrl(url)
  }

  async function handleDomicile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Taille max : 10 MB'); return }
    const url = await uploadFile(file, `${storeId}/domicile-${Date.now()}.${file.name.split('.').pop()}`, setDomicileState)
    if (url) setDomicileUrl(url)
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 1) {
      if (!fullName.trim()) { toast.error('Le nom complet est obligatoire.'); return }
      if (!idCardUrl)       { toast.error('Veuillez uploader le recto du document.'); return }
      if (documentType === 'cni' && !idCardBackUrl) {
        toast.error('Le verso est requis pour une CNI.'); return
      }
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 1))
  }

  // ── Soumission KYC ────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          documentType,
          fullName:        fullName.trim(),
          idCardUrl,
          documentBackUrl: idCardBackUrl || undefined,
          domicileUrl:     domicileUrl   || undefined,
        }),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        toast.success('Dossier KYC soumis ! Vérification sous 24-48h.')
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la soumission')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Zone de drop / upload générique ──────────────────────────────────────

  function UploadZone({
    label, value, state, inputRef, onChange, accept = 'image/*',
  }: {
    label:    string
    value:    string
    state:    UploadState
    inputRef: React.RefObject<HTMLInputElement>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    accept?:  string
  }) {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5">{label}</label>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Uploader : ${label}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className={`w-full h-28 rounded-xl border-2 border-dashed cursor-pointer flex flex-col
            items-center justify-center gap-1.5 transition-all
            ${value ? 'border-[#0F7A60] bg-[#F0FAF7]' : 'border-gray-200 bg-[#FAFAF7] hover:border-[#0F7A60]/40'}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-24 object-contain rounded-lg p-1" />
          ) : (
            <>
              <span className="text-2xl">
                {state === 'uploading' ? '⏳' : state === 'error' ? '❌' : '📎'}
              </span>
              <p className="text-xs text-gray-400 font-medium">
                {state === 'uploading' ? 'Upload en cours...'
                  : state === 'error'   ? 'Échec — réessayez'
                  : 'Cliquez pour uploader'}
              </p>
              <p className="text-[11px] text-gray-300">JPG, PNG, PDF — max 5 MB</p>
            </>
          )}
        </div>
        <input aria-label={`Fichier ${label}`} title={`Fichier ${label}`} ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
        {value && (
          <button
            type="button"
            onClick={() => {
              if (inputRef === rectoRef)    { setIdCardUrl('');    setRectoState('idle')    }
              if (inputRef === versoRef)    { setIdCardBackUrl(''); setVersoState('idle')   }
              if (inputRef === domicileRef) { setDomicileUrl('');  setDomicileState('idle') }
            }}
            className="text-xs text-red-400 mt-1 hover:underline"
          >
            Supprimer
          </button>
        )}
      </div>
    )
  }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Alerte rejet si applicable */}
      {initialStatus === 'rejected' && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex gap-3">
          <span className="text-xl flex-shrink-0">❌</span>
          <div>
            <p className="text-sm font-bold text-red-700">Dossier KYC refusé</p>
            {rejectionReason && (
              <p className="text-xs text-red-600 mt-0.5">
                Raison : <strong>{rejectionReason}</strong>
              </p>
            )}
            <p className="text-xs text-red-500 mt-1">
              Veuillez corriger votre dossier et le soumettre à nouveau.
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <KycProgress current={step} total={TOTAL_STEPS} />

        {/* ── ÉTAPE 1 : Identité ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A] mb-1">🪪 Pièce d&apos;identité</h2>
              <p className="text-sm text-gray-400">Choisissez le type de document et uploadez les photos.</p>
            </div>

            {/* Type de document */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Type de document *</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'cni',      label: 'CNI',      sub: 'Carte nationale',  icon: '🪪' },
                  { value: 'passeport', label: 'Passeport', sub: 'Passeport valide', icon: '📕' },
                  { value: 'permis',   label: 'Permis',   sub: 'Permis conduire',  icon: '🚗' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDocumentType(opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      documentType === opt.value
                        ? 'border-[#0F7A60] bg-[#F0FAF7]'
                        : 'border-gray-200 bg-[#FAFAF7] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <p className="text-xs font-bold text-[#1A1A1A] mt-1">{opt.label}</p>
                    <p className="text-[10px] text-gray-400">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom complet */}
            <div>
              <label htmlFor="kyc-fullname" className="block text-xs font-bold text-gray-600 mb-1.5">
                Nom complet (tel que sur le document) *
              </label>
              <input
                id="kyc-fullname"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ex : Aminata Diallo Ndiaye"
                maxLength={100}
                className="w-full px-4 py-3 text-sm text-[#1A1A1A] bg-[#FAFAF7] border border-gray-200
                  rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2
                  focus:ring-[#0F7A60]/30 focus:border-[#0F7A60] transition-all"
              />
            </div>

            {/* Upload recto */}
            <UploadZone
              label={documentType === 'cni' ? 'Recto du document *' : 'Photo du document *'}
              value={idCardUrl}
              state={rectoState}
              inputRef={rectoRef}
              onChange={handleRecto}
            />

            {/* Upload verso (CNI seulement) */}
            {documentType === 'cni' && (
              <UploadZone
                label="Verso du document (CNI) *"
                value={idCardBackUrl}
                state={versoState}
                inputRef={versoRef}
                onChange={handleVerso}
              />
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : Justificatif domicile ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A] mb-1">🏠 Justificatif de domicile</h2>
              <p className="text-sm text-gray-400">
                Cette étape est <strong>optionnelle</strong> mais recommandée pour un niveau de vérification renforcé.
              </p>
            </div>

            <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-600 mb-2">Documents acceptés :</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Facture d&apos;eau ou d&apos;électricité (moins de 3 mois)</li>
                <li>• Relevé bancaire avec adresse visible</li>
                <li>• Attestation de domicile officielle</li>
              </ul>
            </div>

            <UploadZone
              label="Document justificatif (optionnel)"
              value={domicileUrl}
              state={domicileState}
              inputRef={domicileRef}
              onChange={handleDomicile}
              accept="image/*,application/pdf"
            />
          </div>
        )}

        {/* ── ÉTAPE 3 : Récapitulatif ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A] mb-1">✅ Vérification finale</h2>
              <p className="text-sm text-gray-400">Vérifiez vos informations avant de soumettre votre dossier.</p>
            </div>

            {/* Récapitulatif */}
            <div className="bg-[#FAFAF7] rounded-xl p-5 border border-gray-100 space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Récapitulatif du dossier</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type de document</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {documentType === 'cni' ? '🪪 CNI' : documentType === 'passeport' ? '📕 Passeport' : '🚗 Permis'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nom complet</span>
                  <span className="font-bold text-[#1A1A1A]">{fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recto document</span>
                  <span className={`font-bold ${idCardUrl ? 'text-[#0F7A60]' : 'text-red-400'}`}>
                    {idCardUrl ? '✅ Uploadé' : '❌ Manquant'}
                  </span>
                </div>
                {documentType === 'cni' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Verso document</span>
                    <span className={`font-bold ${idCardBackUrl ? 'text-[#0F7A60]' : 'text-red-400'}`}>
                      {idCardBackUrl ? '✅ Uploadé' : '❌ Manquant'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Justificatif domicile</span>
                  <span className={`font-bold ${domicileUrl ? 'text-[#0F7A60]' : 'text-gray-400'}`}>
                    {domicileUrl ? '✅ Uploadé' : '⚪ Non fourni'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message délai */}
            <div className="bg-[#FDF9F0] border border-[#C9A84C]/20 rounded-xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">⏱️</span>
              <p className="text-xs text-gray-600 leading-relaxed">
                Après soumission, notre équipe vérifiera votre dossier sous
                <strong> 24 à 48 heures</strong>.
                Vous recevrez une notification par email à l&apos;issue de la vérification.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation bas ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-7 pt-5 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              ← Précédent
            </button>
          ) : <div />}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-all"
            >
              Passer cette étape →
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F7A60] hover:bg-[#0D6B53] rounded-xl shadow-sm transition-all"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F7A60] hover:bg-[#0D6B53]
                rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all
                flex items-center gap-2"
            >
              {submitting ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg><span>Soumission...</span></>
              ) : '🛡️ Soumettre mon dossier'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
