/* eslint-disable react/forbid-dom-props */
'use client'

// ─── app/onboarding/page.tsx ──────────────────────────────────────────────────
// Page d'onboarding multi-étapes pour les nouveaux vendeurs
// Affichée après inscription si store.onboarding_completed = false
// 4 étapes : Profil | Apparence | Premier produit (optionnel) | Config finale

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import VendorContractModal from '@/components/vendor/VendorContractModal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoreData {
  name:        string
  description: string
  whatsapp:    string
  primaryColor: string
  logoUrl:     string
  bannerUrl:   string
  telegramNotifications: boolean
}



type UploadState = 'idle' | 'uploading' | 'done' | 'error'

// ─── Barre de progression des étapes ─────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
  const STEP_ICONS = ['🏪', '🎨']
  const STEP_LABELS = ['Type', 'Boutique']

  return (
    <div className="mb-8">
      {/* Barre de progression */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#0F7A60] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>

      {/* Indicateurs circulaires */}
      <div className="flex items-center justify-between">
        {STEP_ICONS.map((icon, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < current
          const isCurrent   = stepNum === current
          return (
            <div key={stepNum} className="flex flex-col items-center gap-1">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-base
                border-2 transition-all duration-300
                ${isCompleted ? 'border-[#0F7A60] bg-[#0F7A60] text-white'
                  : isCurrent  ? 'border-[#0F7A60] bg-white text-[#1A1A1A] shadow-md ring-4 ring-[#0F7A60]/10'
                               : 'border-gray-200 bg-gray-50 text-gray-400'}
              `}>
                {isCompleted ? '✓' : icon}
              </div>
              <span className={`text-[10px] font-bold hidden sm:block
                ${isCurrent ? 'text-[#0F7A60]' : 'text-gray-400'}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const TOTAL_STEPS = 2
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [vendorType, setVendorType] = useState<'digital' | 'physical' | 'hybrid' | null>(null)

  // Contrat partenaire
  const [contractSigned,    setContractSigned]    = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [storeId,           setStoreId]           = useState<string | null>(null)
  const [vendorName,        setVendorName]        = useState('')

  // Charger le storeId + nom vendeur au montage
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      // Récupérer le store du vendeur
      supabase
        .from('Store')
        .select('id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setStoreId((data as { id: string }).id)
        })
      // Récupérer le nom du vendeur
      supabase
        .from('User')
        .select('name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setVendorName((data as { name: string }).name ?? '')
        })
    })
  }, [supabase])

  // Données boutique
  const [store, setStore] = useState<StoreData>({
    name:                  '',
    description:           '',
    whatsapp:              '',
    primaryColor:          '#0F7A60',
    logoUrl:               '',
    bannerUrl:             '',
    telegramNotifications: false,
  })



  // Upload états
  const [logoUpload,   setLogoUpload]   = useState<UploadState>('idle')
  const logoRef   = useRef<HTMLInputElement>(null)

  // ── Helpers upload Supabase Storage ──────────────────────────────────────

  const uploadFile = useCallback(async (
    file: File,
    bucket: string,
    path: string,
    setStatus: (s: UploadState) => void
  ): Promise<string | null> => {
    setStatus('uploading')
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (error) {
      setStatus('error')
      toast.error(`Upload échoué : ${error.message}`)
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    setStatus('done')
    return publicUrl
  }, [supabase])

  // ── Upload logo ────────────────────────────────────────────────────────────

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo : taille max 2 MB')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `logos/${user.id}/logo.${ext}`
    const url  = await uploadFile(file, 'store-assets', path, setLogoUpload)
    if (url) setStore(prev => ({ ...prev, logoUrl: url }))
  }


  // ── Terminer l'onboarding ──────────────────────────────────────────────────

  async function handleComplete() {
    if (!store.name.trim()) {
      toast.error('Le nom de la boutique est requis.')
      return
    }

    setSaving(true)
    try {
      const res  = await fetch('/api/onboarding/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          vendorType,
          storeName:    store.name.trim(),
          primaryColor: store.primaryColor,
          logoUrl:      store.logoUrl || undefined,
        }),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      if (res.ok && data.success) {
        toast.success('Bienvenue sur PDV Pro ! 🎉')
        router.push('/dashboard')
      } else {
        throw new Error(data.error ?? 'Erreur lors de la finalisation')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur interne')
      setSaving(false)
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 1 && !vendorType) {
      toast.error('Veuillez choisir un type de vendeur.')
      return
    }
    if (step === 2 && !store.name.trim()) {
      toast.error('Le nom de la boutique est obligatoire.')
      return
    }
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 1))
  }

  // ─── Rendu des étapes ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-4">

      {/* Card principale */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Header émeraude */}
        <div className="bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-black text-2xl text-white">PDV</span>
            <span className="font-black text-2xl text-[#C9A84C]">Pro</span>
          </div>
          <p className="text-white/80 text-sm">
            Étape {step} sur {TOTAL_STEPS} — Configurez votre boutique
          </p>
        </div>

        {/* Contenu */}
        <div className="px-8 py-7">
          <StepProgress current={step} total={TOTAL_STEPS} />

          {/* ── ÉTAPE 1 : Choix du Vendor Type ──────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-1">Quel type de vendeur êtes-vous ?</h2>
                <p className="text-sm text-gray-400">Cela configurera votre interface PDV Pro.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* DIGITAL */}
                <button
                  onClick={() => setVendorType('digital')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col items-center text-center ${
                    vendorType === 'digital'
                      ? 'border-[#0F7A60] bg-[#F0FAF7]'
                      : 'border-gray-200 bg-[#FAFAF7] hover:border-[#0F7A60]/50'
                  }`}
                >
                  <span className="text-4xl mb-3">💾</span>
                  <p className="font-black text-[#1A1A1A] mb-1">Digital</p>
                  <p className="text-[11px] text-gray-500">PDF, formations, accès Telegram, fichiers...</p>
                </button>

                {/* PHYSICAL */}
                <button
                  onClick={() => setVendorType('physical')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col items-center text-center ${
                    vendorType === 'physical'
                      ? 'border-[#0F7A60] bg-[#F0FAF7]'
                      : 'border-gray-200 bg-[#FAFAF7] hover:border-[#0F7A60]/50'
                  }`}
                >
                  <span className="text-4xl mb-3">📦</span>
                  <p className="font-black text-[#1A1A1A] mb-1">Physique</p>
                  <p className="text-[11px] text-gray-500">Vêtements, cosmétiques, électronique...</p>
                </button>

                {/* HYBRID */}
                <button
                  onClick={() => setVendorType('hybrid')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col items-center text-center ${
                    vendorType === 'hybrid'
                      ? 'border-[#0F7A60] bg-[#F0FAF7]'
                      : 'border-gray-200 bg-[#FAFAF7] hover:border-[#0F7A60]/50'
                  }`}
                >
                  <span className="text-4xl mb-3">🔀</span>
                  <p className="font-black text-[#1A1A1A] mb-1">Hybride</p>
                  <p className="text-[11px] text-gray-500">Vous vendez les deux types de produits</p>
                </button>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 font-bold">
                  Passer cette étape →
                </Link>
                <button
                  onClick={handleNext}
                  disabled={!vendorType}
                  className="px-6 py-3 bg-[#0F7A60] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D6B53] transition-colors"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Nom de boutique + Logo + Couleur ──────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-1">Identité de la boutique</h2>
                <p className="text-sm text-gray-400">Nom, logo et couleur pour personnaliser votre espace.</p>
              </div>

              {/* Nom boutique */}
              <div>
                <label htmlFor="store-name" className="block text-xs font-bold text-gray-600 mb-1.5">
                  Nom de la boutique *
                </label>
                <input
                  id="store-name"
                  type="text"
                  value={store.name}
                  onChange={e => setStore(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex : Rose Beauty Dakar"
                  required
                  maxLength={80}
                  className="w-full px-4 py-3 text-sm text-[#1A1A1A] bg-[#FAFAF7] border border-gray-200 rounded-xl
                    placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30
                    focus:border-[#0F7A60] transition-all"
                />
              </div>

              {/* Upload logo */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Logo de la boutique <span className="font-normal text-gray-400">(optionnel, max 2 MB)</span>
                </label>
                <div
                  onClick={() => logoRef.current?.click()}
                  className={`
                    relative w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer
                    flex flex-col items-center justify-center gap-2 transition-all
                    ${store.logoUrl
                      ? 'border-[#0F7A60] bg-[#F0FAF7]'
                      : 'border-gray-200 bg-[#FAFAF7] hover:border-[#0F7A60]/50 hover:bg-[#F0FAF7]/50'}
                  `}
                >
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logoUrl} alt="Logo" className="h-28 w-auto object-contain rounded-xl" />
                  ) : (
                    <>
                      <span className="text-3xl">{logoUpload === 'uploading' ? '⏳' : '🖼️'}</span>
                      <p className="text-xs font-semibold text-gray-500">
                        {logoUpload === 'uploading' ? 'Upload en cours...' : 'Cliquez pour uploader'}
                      </p>
                    </>
                  )}
                </div>
                <input
                  aria-label="Upload logo"
                  title="Upload logo"
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              {/* Couleur principale */}
              <div>
                <label htmlFor="store-color" className="block text-xs font-bold text-gray-600 mb-1.5">
                  Couleur principale de la boutique
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="store-color"
                    type="color"
                    value={store.primaryColor}
                    onChange={e => setStore(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#0F7A60', '#C9A84C', '#E74C3C', '#3498DB', '#9B59B6', '#1A1A1A'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setStore(prev => ({ ...prev, primaryColor: color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          store.primaryColor === color ? 'border-[#0F7A60] scale-110 shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Contrat partenaire si Physique/Hybride */}
              {(vendorType === 'physical' || vendorType === 'hybrid') && !contractSigned && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mt-6">
                  <span className="text-xl flex-shrink-0">📜</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800">Signez votre contrat partenaire</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Requis pour vos ventes. Vous pouvez le signer maintenant ou plus tard.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowContractModal(true)}
                      className="mt-2 text-xs font-bold text-[#0F7A60] hover:underline"
                    >
                      Signer maintenant →
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <button onClick={handleBack} className="text-xs font-bold text-gray-500 hover:text-gray-700">
                  ← Retour
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving || !store.name.trim()}
                  className="px-6 py-3 bg-[#0F7A60] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D6B53] transition-colors flex items-center gap-2"
                >
                  {saving ? 'Création...' : '🎉 Lancer ma boutique'}
                </button>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Footer discret */}
      <div className="flex flex-col items-center gap-4 mt-6">
        {/* Lien pour passer l'onboarding depuis n'importe quelle étape */}
        <Link 
          href="/dashboard"
          className="text-sm text-slate hover:text-ink transition"
        >
          Passer cette étape →
        </Link>
        <p className="text-xs text-gray-400">
          PDV Pro — Plateforme de vente africaine 🌍
        </p>
      </div>

      {/* Modal contrat partenaire */}
      {showContractModal && storeId && (
        <VendorContractModal
          storeName={store.name || 'Votre boutique'}
          vendorName={vendorName}
          storeId={storeId}
          onAccepted={() => {
            setContractSigned(true)
            setShowContractModal(false)
          }}
          onClose={() => setShowContractModal(false)}
        />
      )}

    </div>
  )
}
