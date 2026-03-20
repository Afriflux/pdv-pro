'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AIProductGenerator from '@/components/dashboard/AIProductGenerator'
import { Sparkles } from 'lucide-react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Variant {
  id?: string
  dimension_1: string
  value_1: string
  dimension_2: string
  value_2: string
  stock: number
  price_adjust: number
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  type: 'digital' | 'physical' | 'coaching'
  category: string | null
  images: string[]
  active: boolean
  // Champs spécifiques — optionnels car pas encore en BDD pour tous
  digital_file_url?: string | null
  digital_link?: string | null
  shipping_fee?: number | null
  shipping_delay?: string | null
  cash_on_delivery?: boolean
  session_duration?: string | null
  session_mode?: 'online' | 'onsite' | 'both' | null
  digital_files?: {
    type: string
    url: string | null
    filename: string
    size: number
  }[] | null
  access_duration_days?: number | null
  max_downloads?: number | null
  video_download_allowed?: boolean
  license_type?: string | null
  license_notes?: string | null
  // Droit de revente — champs issus de la migration resale_migration.sql
  resale_allowed?:    boolean
  resale_commission?: number | null
}

interface EditProductFormProps {
  storeId: string
  product: Product
  initialVariants: Variant[]
}

function emptyVariant(): Variant {
  return { dimension_1: '', value_1: '', dimension_2: '', value_2: '', stock: 0, price_adjust: 0 }
}

// ----------------------------------------------------------------
// Composant
// ----------------------------------------------------------------
export function EditProductForm({ storeId, product, initialVariants }: EditProductFormProps) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const digitalFileRef = useRef<HTMLInputElement>(null)

  // Champs principaux
  const [name, setName]               = useState(product.name)
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice]             = useState(String(product.price))
  const [type, setType]               = useState(product.type)
  const [category, setCategory]       = useState(product.category ?? '')
  const [active, setActive]           = useState(product.active)

  // Images existantes + nouvelles
  const [existingImages, setExistingImages] = useState<string[]>(product.images ?? [])
  const [newFiles, setNewFiles]             = useState<File[]>([])
  const [newPreviews, setNewPreviews]       = useState<string[]>([])

  // Variétés
  const [hasVariants, setHasVariants] = useState(initialVariants.length > 0)
  const [variants, setVariants]       = useState<Variant[]>(
    initialVariants.length > 0 ? initialVariants : [emptyVariant()]
  )

  // UI
  const [loading, setLoading]                     = useState(false)
  const [error, setError]                         = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting]                   = useState(false)
  
  // IA
  const [showAI, setShowAI]                       = useState(false)

  // ── États Digital — pré-remplis ──
  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [digitalLink, setDigitalLink] = useState(product.digital_link ?? '')
  const [digitalMode, setDigitalMode] = useState<'file' | 'link'>(
    product.digital_file_url ? 'file' : 'link'
  )
  const [accessDurationDays, setAccessDurationDays] = useState(product.access_duration_days != null ? String(product.access_duration_days) : '')
  const [maxDownloads,       setMaxDownloads]       = useState(product.max_downloads != null ? String(product.max_downloads) : '')
  const [videoDownloadAllowed, setVideoDownloadAllowed] = useState(product.video_download_allowed ?? false)
  const [licenseType, setLicenseType] = useState<'personal' | 'resell' | 'mrr' | 'plr' | 'whitelabel'>(
    (['personal', 'resell', 'mrr', 'plr', 'whitelabel'].includes(product.license_type ?? '')
      ? (product.license_type as 'personal' | 'resell' | 'mrr' | 'plr' | 'whitelabel')
      : 'personal'
    )
  )
  const [licenseNotes,       setLicenseNotes]       = useState(product.license_notes ?? '')
  const existingDigitalFileUrl = product.digital_file_url ?? null

  // ── États Droit de revente ──
  const [resaleAllowed,    setResaleAllowed]    = useState(product.resale_allowed ?? false)
  const [resaleCommission, setResaleCommission] = useState(product.resale_commission != null ? String(product.resale_commission) : '0')

  // ── États Physique — pré-remplis ──
  const [shippingFee,    setShippingFee]    = useState(product.shipping_fee != null ? String(product.shipping_fee) : '')
  const [shippingDelay,  setShippingDelay]  = useState(product.shipping_delay ?? '')
  const [cashOnDelivery, setCashOnDelivery] = useState(product.cash_on_delivery ?? false)

  // ── États Coaching — pré-remplis ──
  const [sessionDuration, setSessionDuration] = useState(product.session_duration ?? '')
  const [sessionMode,     setSessionMode]     = useState<'online' | 'onsite' | 'both'>(product.session_mode ?? 'online')

  // ── États Telegram ──
  const [telegramCommunities, setTelegramCommunities] = useState<any[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('')

  // Fetch Telegram Communities
  useEffect(() => {
    const fetchCommunities = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('TelegramCommunity')
        .select('id, chat_title, members_count, product_id')
        .eq('store_id', storeId)
        .not('chat_id', 'is', null)
      if (data) {
        setTelegramCommunities(data)
        const linked = data.find(c => c.product_id === product.id)
        if (linked) setSelectedCommunityId(linked.id)
      }
    }
    fetchCommunities()
  }, [storeId, product.id])

  // ─── Helpers variétés ───────────────────────────────────────────
  const updateVariant = (i: number, field: keyof Variant, value: string | number) =>
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))

  // ─── Images ─────────────────────────────────────────────────────
  // Types acceptés — inclut GIF
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE_MB    = 10

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name} : format non supporté (JPG, PNG, WebP, GIF).`
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `${file.name} : trop lourd (max ${MAX_SIZE_MB}MB).`
    }
    return null
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files  = Array.from(e.target.files ?? [])
    // Valider chaque fichier
    const errors = files.map(validateImageFile).filter(Boolean) as string[]
    if (errors.length > 0) { setError(errors[0]); return }
    const total  = existingImages.length + newFiles.length
    const slots  = Math.max(0, 50 - total)
    const added  = files.slice(0, slots)
    setNewFiles(prev => [...prev, ...added])
    setNewPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
  }

  const removeExisting = (i: number) =>
    setExistingImages(prev => prev.filter((_, idx) => idx !== i))

  const removeNew = (i: number) => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== i))
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  // ─── Mise à jour ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !price) { setError('Nom et prix obligatoires.'); return }
    setLoading(true)

    const supabase = createClient()

    try {
      // 1. Upload nouvelles images
      const uploadedUrls: string[] = []
      for (const file of newFiles) {
        const ext  = file.name.split('.').pop()
        const path = `products/${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('pdvpro-products').upload(path, file)
        if (!upErr) {
          const { data } = supabase.storage.from('pdvpro-products').getPublicUrl(path)
          uploadedUrls.push(data.publicUrl)
        }
      }
      const allImages = [...existingImages, ...uploadedUrls]

      // 2. Upload nouveau fichier digital si modifié
      let digitalFileUrl: string | null = existingDigitalFileUrl
      if (type === 'digital' && digitalMode === 'file' && digitalFile) {
        const ext  = digitalFile.name.split('.').pop()
        const path = `digital/${storeId}/${Date.now()}.${ext}`
        const { error: dfErr } = await supabase.storage
          .from('pdvpro-digital')
          .upload(path, digitalFile)
        if (!dfErr) {
          const { data } = supabase.storage.from('pdvpro-digital').getPublicUrl(path)
          digitalFileUrl = data.publicUrl
        }
      }

      // 3. Construire les champs spécifiques au type
      const typeExtra =
        type === 'digital'
          ? {
              digital_file_url: digitalMode === 'file' ? digitalFileUrl : null,
              digital_link:     digitalMode === 'link' ? digitalLink.trim() || null : null,
              digital_files: [
                {
                  type: digitalMode === 'file' ? (digitalFile ? (digitalFile.name.split('.').pop() === 'mp4' ? 'video' : 'pdf') : (existingDigitalFileUrl?.endsWith('.mp4') ? 'video' : 'pdf')) : 'link',
                  url: digitalMode === 'file' ? digitalFileUrl : digitalLink.trim(),
                  filename: digitalMode === 'file' ? (digitalFile ? digitalFile.name : 'Fichier actuel') : 'Lien externe',
                  size: digitalMode === 'file' ? (digitalFile ? digitalFile.size : 0) : 0
                }
              ],
              access_duration_days: accessDurationDays ? parseInt(accessDurationDays) : null,
              max_downloads: maxDownloads ? parseInt(maxDownloads) : null,
              video_download_allowed: videoDownloadAllowed,
              license_type: licenseType,
              license_notes: licenseNotes.trim() || null,
              // Droit de revente
              resale_allowed:    resaleAllowed,
              resale_commission: resaleAllowed ? (parseFloat(resaleCommission) || 0) : 0,
              shipping_fee: null, shipping_delay: null, cash_on_delivery: false,
              session_duration: null, session_mode: null,
            }
          : type === 'physical'
          ? {
              shipping_fee:    shippingFee ? parseFloat(shippingFee) : null,
              shipping_delay:  shippingDelay.trim() || null,
              cash_on_delivery: cashOnDelivery,
              digital_file_url: null, digital_link: null,
              session_duration: null, session_mode: null,
            }
          : {
              session_duration: sessionDuration.trim() || null,
              session_mode:     sessionMode,
              digital_file_url: null, digital_link: null,
              shipping_fee: null, shipping_delay: null, cash_on_delivery: false,
            }

      // 4. Mettre à jour le produit
      const { error: updateErr } = await supabase
        .from('Product')
        .update({
          name:        name.trim(),
          description: description.trim() || null,
          price:       parseFloat(price),
          type,
          category:    category.trim() || null,
          images:      allImages,
          active,
          ...typeExtra,
        })
        .eq('id', product.id)
        .eq('store_id', storeId)

      if (updateErr) { setError('Erreur mise à jour : ' + updateErr.message); setLoading(false); return }

      // 5. Resynchroniser les variantes
      await supabase.from('ProductVariant').delete().eq('product_id', product.id)
      if (hasVariants) {
        const valid = variants.filter(v => v.value_1.trim())
        if (valid.length > 0) {
          await supabase.from('ProductVariant').insert(
            valid.map(v => ({
              product_id:   product.id,
              dimension_1:  v.dimension_1.trim() || 'Option',
              value_1:      v.value_1.trim(),
              dimension_2:  v.dimension_2.trim() || null,
              value_2:      v.value_2.trim() || null,
              stock:        Number(v.stock) || 0,
              price_adjust: Number(v.price_adjust) || 0,
            }))
          )
        }
      }

      // 6. Lier à la communauté Telegram
      // Reset existing link for this product
      await supabase
         .from('TelegramCommunity')
         .update({ product_id: null })
         .eq('product_id', product.id)

      if (selectedCommunityId) {
         await supabase
           .from('TelegramCommunity')
           .update({ product_id: product.id })
           .eq('id', selectedCommunityId)
      }

      router.push('/dashboard/products')
      router.refresh()
    } catch {
      setError('Erreur inattendue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('Product').delete().eq('id', product.id).eq('store_id', storeId)
    router.push('/dashboard/products')
    router.refresh()
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── IA GENERATOR TOGGLE ── */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAI(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              showAI 
                ? 'bg-gray-100 text-gray-600 border-gray-200' 
                : 'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20 hover:bg-[#0F7A60]/20'
            }`}
          >
            <Sparkles size={16} />
            {showAI ? 'Masquer l\'IA' : 'Générer avec l\'IA'}
          </button>
        </div>

        {showAI && (
          <AIProductGenerator
            category={category}
            onGenerated={(data) => {
              if (data.name) setName(data.name)
              if (data.description) setDescription(data.description)
              if (data.price) setPrice(String(data.price))
              
              // On ferme l'assistant IA
              setShowAI(false)
            }}
          />
        )}

        {/* ── INFOS GÉNÉRALES ── */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-ink">Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit <span className="text-red-500">*</span>
            </label>
            <input
              aria-label="Nom du produit"
              title="Nom du produit"
              type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              aria-label="Description du produit"
              title="Description"
              value={description} onChange={e => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="Prix du produit"
                title="Prix"
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                min="0" step="1" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <input
                aria-label="Catégorie du produit"
                title="Catégorie"
                type="text" value={category} onChange={e => setCategory(e.target.value)}
                placeholder="Ex : Formation"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['physical', 'digital', 'coaching'] as const).map(t => (
                <button
                  key={t} type="button" onClick={() => setType(t)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition ${
                    type === t
                      ? 'border-gold/50 bg-gold/10 text-gold/80'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-cream'
                  }`}
                >
                  {t === 'physical' ? '📦 Physique' : t === 'digital' ? '📥 Digital' : '🎓 Coaching'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMMUNAUTÉ TELEGRAM ── */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <span className="text-blue-500">✈️</span> Lier à un groupe Telegram privé
          </h2>
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
            <label className="block text-sm font-medium text-blue-900 mb-2">Choisir un groupe à lier</label>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition bg-white"
              title="Groupe Telegram"
            >
              <option value="">— Aucun groupe lié —</option>
              {telegramCommunities.map(c => (
                <option key={c.id} value={c.id}>
                  {c.chat_title} ({c.members_count || 0} membres)
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-700/80 mt-3 font-medium">
              Les acheteurs seront invités automatiquement après achat.{' '}
              <Link href="/dashboard/telegram" className="text-blue-600 hover:underline font-bold" target="_blank">
                Gérer vos groupes →
              </Link>
            </p>
          </div>
        </section>

        {/* ── CHAMPS SPÉCIFIQUES PAR TYPE ── */}

        {/* DIGITAL */}
        {type === 'digital' && (
          <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-ink">📥 Contenu digital</h2>
            <p className="text-xs text-gray-400">Envoyé automatiquement à l&apos;acheteur après paiement.</p>

            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['file', 'link'] as const).map(m => (
                <button
                  key={m} type="button" onClick={() => setDigitalMode(m)}
                  className={`flex-1 py-2.5 text-sm font-medium transition ${
                    digitalMode === m ? 'bg-gold text-white' : 'bg-white text-gray-500 hover:bg-cream'
                  }`}
                >
                  {m === 'file' ? '📎 Fichier' : '🔗 Lien externe'}
                </button>
              ))}
            </div>

            {digitalMode === 'file' ? (
              <div className="space-y-2">
                {existingDigitalFileUrl && !digitalFile && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <span>✅ Fichier actuel enregistré</span>
                    <a href={existingDigitalFileUrl} target="_blank" rel="noopener noreferrer"
                      className="underline ml-auto">Voir</a>
                  </div>
                )}
                <button
                  type="button" onClick={() => digitalFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-sm text-gray-400 hover:border-gold/40 hover:text-gold transition"
                >
                  {digitalFile ? `✅ ${digitalFile.name}` : '📎 Remplacer le fichier (PDF, ZIP, MP4, max 500MB)'}
                </button>
                <input
                  aria-label="Fichier numérique"
                  title="Fichier numérique"
                  ref={digitalFileRef} type="file"
                  accept=".pdf,.zip,.mp4,.mp3,.epub,.docx"
                  onChange={e => setDigitalFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien de téléchargement</label>
                <input
                  type="url" value={digitalLink} onChange={e => setDigitalLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
            )}

            {/* Paramètres avancés digital */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée d&apos;accès (jours)</label>
                  <input
                    type="number"
                    value={accessDurationDays}
                    onChange={e => setAccessDurationDays(e.target.value)}
                    placeholder="Ex: 30 (vide = à vie)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite téléchargements</label>
                  <input
                    type="number"
                    value={maxDownloads}
                    onChange={e => setMaxDownloads(e.target.value)}
                    placeholder="Ex: 3 (vide = illimité)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-ink">Autoriser téléchargement vidéo</p>
                  <p className="text-[10px] text-gray-400">Si décoché, la vidéo sera uniquement en streaming.</p>
                </div>
                <div
                  onClick={() => setVideoDownloadAllowed(v => !v)}
                  className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${videoDownloadAllowed ? 'bg-gold' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${videoDownloadAllowed ? 'left-5' : 'left-1'}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Type de licence</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'personal', label: '🔒 Perso' },
                    { v: 'resell',   label: '📤 Resell' },
                    { v: 'mrr',      label: '💼 MRR' },
                    { v: 'plr',      label: '✏️ PLR' },
                    { v: 'whitelabel', label: '🏢 White' },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setLicenseType(opt.v)}
                      className={`py-2 px-1 rounded-lg border text-[11px] font-bold transition ${
                        licenseType === opt.v ? 'border-gold bg-gold/10 text-gold' : 'border-gray-100 bg-white text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes de licence</label>
                <textarea
                  value={licenseNotes}
                  onChange={e => setLicenseNotes(e.target.value)}
                  placeholder="Conditions spécifiques de la licence..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-xs transition resize-none"
                />
              </div>
            </div>

            {/* ── DROIT DE REVENTE ── */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <h3 className="text-sm font-semibold text-ink">🔄 Droit de revente</h3>
              <p className="text-xs text-gray-400">Uniquement pour les produits digitaux. Permet à l&apos;acheteur de revendre ce produit.</p>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-ink">Autoriser la revente</p>
                  <p className="text-[10px] text-gray-400">L&apos;acheteur peut revendre ce produit à ses propres clients.</p>
                </div>
                <div
                  onClick={() => setResaleAllowed(v => !v)}
                  className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${resaleAllowed ? 'bg-[#0F7A60]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${resaleAllowed ? 'left-5' : 'left-1'}`} />
                </div>
              </div>

              {resaleAllowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission créateur sur revente (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={resaleCommission}
                    onChange={e => setResaleCommission(e.target.value)}
                    placeholder="Ex : 10"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">% reversé au créateur à chaque revente (max 30%).</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PHYSIQUE */}
        {type === 'physical' && (
          <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-ink">📦 Livraison</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frais de livraison (FCFA)</label>
                <input
                  type="number" value={shippingFee} onChange={e => setShippingFee(e.target.value)}
                  placeholder="0 = gratuit" min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Délai estimé</label>
                <input
                  type="text" value={shippingDelay} onChange={e => setShippingDelay(e.target.value)}
                  placeholder="Ex : 2-3 jours"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">💵 Paiement à la livraison (COD)</p>
                  <p className="text-xs text-amber-900/60 font-medium">Autoriser l&apos;encaissement à la réception.</p>
                </div>
                <div
                  onClick={() => setCashOnDelivery((v: boolean) => !v)}
                  className={`w-12 h-7 rounded-full transition-all cursor-pointer relative ${cashOnDelivery ? 'bg-gold shadow-lg shadow-gold/20' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cashOnDelivery ? 'left-7' : 'left-1.5'}`} />
                </div>
              </div>
              {cashOnDelivery && (
                <p className="text-[11px] leading-relaxed text-amber-900/70 font-medium bg-white/50 p-2 rounded-lg border border-amber-200/50">
                  ✨ <strong>En activant cette option</strong>, vos clients pourront choisir de payer à la livraison <u>OU</u> en ligne. Ils gardent le choix.
                </p>
              )}
            </div>
          </section>
        )}

        {/* COACHING */}
        {type === 'coaching' && (
          <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-ink">🎓 Détails de session</h2>
            <p className="text-xs text-gray-400">Les créneaux de disponibilité se définissent depuis les paramètres du produit.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée de session</label>
                <input
                  type="text" value={sessionDuration} onChange={e => setSessionDuration(e.target.value)}
                  placeholder="Ex : 1h, 45min"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={sessionMode}
                  onChange={e => setSessionMode(e.target.value as 'online' | 'onsite' | 'both')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition bg-white"
                  title="Mode de session"
                >
                  <option value="online">🖥️ En ligne</option>
                  <option value="onsite">📍 Présentiel</option>
                  <option value="both">🌐 Les deux</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* ── IMAGES ── */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Images</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${(existingImages.length + newFiles.length) >= 50 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
              {existingImages.length + newFiles.length} / 50
            </span>
          </div>

          {(existingImages.length > 0 || newPreviews.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((src, i) => (
                <div key={`ex-${i}`} className="relative w-20 h-20 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                  <button type="button" onClick={() => removeExisting(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative w-20 h-20 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-20 h-20 rounded-xl object-cover border border-gold/30" />
                  {/* Badge GIF animé */}
                  {newFiles[i]?.type === 'image/gif' && (
                    <span className="absolute bottom-1 left-1 bg-purple-500 text-white text-[9px] font-black px-1 rounded animate-pulse">
                      GIF
                    </span>
                  )}
                  <button type="button" onClick={() => removeNew(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={(existingImages.length + newFiles.length) >= 50}
            className={`w-full border-2 border-dashed rounded-xl py-6 text-sm transition-all flex flex-col items-center gap-1 ${
              (existingImages.length + newFiles.length) >= 50 
                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' 
                : 'border-gray-200 text-gray-400 hover:border-gold/40 hover:text-gold hover:bg-gold/5'
            }`}
          >
            <span className="text-xl">📷</span>
            <span>{(existingImages.length + newFiles.length) === 0 ? 'Ajouter des images' : (existingImages.length + newFiles.length) >= 50 ? 'Limite de 50 images atteinte' : 'Ajouter une autre image'}</span>
          </button>
          <input aria-label="Images" title="Images" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFiles} className="hidden" />
        </section>

        {/* ── VARIÉTÉS ── */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Variétés</h2>
            <div onClick={() => setHasVariants((v: boolean) => !v)}
              className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${hasVariants ? 'bg-gold' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasVariants ? 'left-5' : 'left-1'}`} />
            </div>
          </div>

          {hasVariants && (
            <div className="space-y-4">
              {variants.map((v, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-cream">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Variété {i + 1}</span>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 text-xs">Supprimer</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={v.dimension_1} onChange={e => updateVariant(i, 'dimension_1', e.target.value)}
                      placeholder="Dimension (ex: Taille)"
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                    <input type="text" value={v.value_1} onChange={e => updateVariant(i, 'value_1', e.target.value)}
                      placeholder="Valeur (ex: L)"
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={v.dimension_2} onChange={e => updateVariant(i, 'dimension_2', e.target.value)}
                      placeholder="Dimension 2 (optionnel)"
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                    <input type="text" value={v.value_2} onChange={e => updateVariant(i, 'value_2', e.target.value)}
                      placeholder="Valeur 2 (optionnel)"
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Stock</label>
                      <input aria-label="Stock" title="Stock" type="number" value={v.stock} min="0" onChange={e => updateVariant(i, 'stock', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">± Prix (FCFA)</label>
                      <input aria-label="Ajustement prix" title="Ajustement prix" type="number" value={v.price_adjust} onChange={e => updateVariant(i, 'price_adjust', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                    </div>
                  </div>
                </div>
              ))}
              {variants.length < 50 && (
                <button type="button" onClick={() => setVariants(prev => [...prev, emptyVariant()])}
                  className="w-full border border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-gold/40 hover:text-gold transition">
                  + Ajouter une variété
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── STATUT ── */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Statut</h2>
              <p className="text-xs text-gray-400 mt-0.5">{active ? 'Visible sur votre espace' : 'Masqué de votre espace'}</p>
            </div>
            <div onClick={() => setActive((v: boolean) => !v)}
              className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${active ? 'bg-gold' : 'bg-gray-200'}`}>
              <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'left-7' : 'left-1.5'}`} />
            </div>
          </div>
        </section>

        {/* ── BOUTON SAUVEGARDER ── */}
        <button type="submit" disabled={loading}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition text-base">
          {loading ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </form>

      {/* ── ZONE DANGER ── */}
      <div className="mt-6 mb-8">
        <button type="button" onClick={() => setShowDeleteConfirm(true)}
          className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 rounded-2xl transition text-sm">
          🗑️ Supprimer ce produit
        </button>
      </div>

      {/* ── DIALOG DE CONFIRMATION ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-ink text-lg">Supprimer le produit ?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Cette action est irréversible. Le produit et toutes ses variantes seront définitivement supprimés.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-cream transition text-sm">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
                {deleting ? 'Suppression…' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
