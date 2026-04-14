'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { UniversalAIGenerator } from '@/components/shared/ai/UniversalAIGenerator'
import { Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { MobilePreviewer } from '@/components/ui/MobilePreviewer'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface Variant {
  dimension_1: string
  value_1: string
  dimension_2: string
  value_2: string
  stock: number
  price_adjust: number
}

interface ProductFormProps {
  storeId: string
  vendorType: 'digital' | 'physical' | 'hybrid'
  initialTemplateData?: any
}

const emptyVariant = (): Variant => ({
  dimension_1: '',
  value_1: '',
  dimension_2: '',
  value_2: '',
  stock: 0,
  price_adjust: 0,
})

// ----------------------------------------------------------------
// Composant
// ----------------------------------------------------------------
export function ProductForm({ storeId, vendorType, initialTemplateData }: ProductFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Champs principaux
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice]             = useState('')
  const [type, setType]               = useState<'digital' | 'physical' | 'coaching' | 'course'>(
    vendorType === 'digital' ? 'digital' : 'physical'
  )
  const [category, setCategory]       = useState('')
  const [active, setActive]           = useState(true)

  // Images
  const [imageFiles, setImageFiles]   = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Variétés
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants]       = useState<Variant[]>([emptyVariant()])

  // UI
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [canSubmitTimeout, setCanSubmitTimeout] = useState(false)
  
  // IA
  const [showAI, setShowAI]     = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // NOUVEAU: Wizard & SEO
  const [currentStep, setCurrentStep] = useState(1)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [template, _setTemplate] = useState('default')

  // Apply Template Data if provided
  useEffect(() => {
    if (initialTemplateData) {
      if (initialTemplateData.name) setName(initialTemplateData.name)
      if (initialTemplateData.description) setDescription(initialTemplateData.description)
      if (initialTemplateData.price) setPrice(initialTemplateData.price.toString())
      if (initialTemplateData.type) setType(initialTemplateData.type)
      if (initialTemplateData.category) setCategory(initialTemplateData.category)
      // Any other fields that could be templated
    }
  }, [initialTemplateData])

  // ── Tarification Récurrente ──
  const [paymentType, setPaymentType] = useState<'one_time' | 'recurring'>('one_time')
  const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')

  // Ref fichier digital
  const digitalFileRef = useRef<HTMLInputElement>(null)

  // ── États Digital ──
  const [digitalFile, setDigitalFile]   = useState<File | null>(null)
  const [digitalLink, setDigitalLink]   = useState('')
  const [digitalMode, setDigitalMode]   = useState<'file' | 'link'>('link')
  const [accessDurationDays, setAccessDurationDays] = useState('')
  const [maxDownloads,       setMaxDownloads]       = useState('')
  const [videoDownloadAllowed, setVideoDownloadAllowed] = useState(false)
  const [licenseType,        setLicenseType]        = useState<'personal' | 'resell' | 'mrr' | 'plr' | 'whitelabel'>('personal')
  const [licenseNotes,       setLicenseNotes]       = useState('')

  // ── États Droit de revente (produits digitaux uniquement) ──
  const [resaleAllowed,    setResaleAllowed]    = useState(false)
  const [resaleCommission, setResaleCommission] = useState('0')

  // ── États Physique ──
  const [shippingFee,    setShippingFee]    = useState('')
  const [shippingDelay,  setShippingDelay]  = useState('')
  const [cashOnDelivery, setCashOnDelivery] = useState(false)

  // ── États Coaching ──
  const [sessionDuration] = useState('')
  const [sessionMode,     setSessionMode]     = useState<'online' | 'onsite' | 'both'>('online')
  const [bookingLink,     setBookingLink]     = useState('')
  const [coachingType,    setCoachingType]    = useState<'individual' | 'group'>('individual')
  const [maxParticipants, setMaxParticipants] = useState('10')
  const [coachingDurations, setCoachingDurations] = useState<number[]>([60])
  const [coachingIsPack, setCoachingIsPack] = useState(false)
  const [coachingPackCount, setCoachingPackCount] = useState('1')

  // ── États Telegram ──
  const [telegramCommunities, setTelegramCommunities] = useState<{ id: string; chat_title: string; members_count: number | null }[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('')

  // ── États Affiliation ──
  const [affiliateActive, setAffiliateActive] = useState<boolean | null>(null)
  const [affiliateMargin, setAffiliateMargin] = useState<string>('')
  const [affiliateMediaKitUrl, setAffiliateMediaKitUrl] = useState<string>('')

  // ── États Order Bump ──
  const [bumpActive, setBumpActive] = useState(false)
  const [bumpProductId, setBumpProductId] = useState('')
  const [bumpOfferText, setBumpOfferText] = useState('Profitez aussi de cette offre exclusive à prix réduit !')
  
  // ── États OTO Upsell Post-Achat ──
  const [otoActive, setOtoActive] = useState(false)
  const [otoProductId, setOtoProductId] = useState('')
  const [otoDiscount, setOtoDiscount] = useState('')
  const [storeProducts, setStoreProducts] = useState<{id:string, name:string, price:number}[]>([])

  // Fetch Telegram Communities
  useEffect(() => {
    const fetchCommunities = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('TelegramCommunity')
        .select('id, chat_title, members_count')
        .eq('store_id', storeId)
        .not('chat_id', 'is', null)
      if (data) setTelegramCommunities(data)
    }
    fetchCommunities()
  }, [storeId])

  // Fetch Store Products for Order Bumps
  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('Product')
        .select('id, name, price')
        .eq('store_id', storeId)
        .eq('active', true)
      if (data) setStoreProducts(data)
    }
    fetchProducts()
  }, [storeId])

  // ----------------------------------------------------------------
  // Gestion des images
  // ----------------------------------------------------------------
  // Types acceptés — inclut GIF (peut être lourd)
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE_MB    = 10

  // Validation d'un fichier image (format + taille)
  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name} : format non supporté (JPG, PNG, WebP, GIF uniquement).`
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `${file.name} : fichier trop lourd (max ${MAX_SIZE_MB}MB).`
    }
    return null
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files  = Array.from(e.target.files ?? [])
    // Valider chaque fichier
    const errors = files.map(validateImageFile).filter(Boolean) as string[]
    if (errors.length > 0) {
      setError(errors[0])
      return
    }
    const newFiles  = [...imageFiles, ...files].slice(0, 5)
    const previews  = newFiles.map(f => URL.createObjectURL(f))
    setImageFiles(newFiles)
    setImagePreviews(previews)
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // ----------------------------------------------------------------
  // Gestion des variétés
  // ----------------------------------------------------------------
  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const addVariant = () => {
    if (variants.length < 50) setVariants(prev => [...prev, emptyVariant()])
  }

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  // ----------------------------------------------------------------
  // Soumission
  // ----------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !price) {
      setError('Le nom et le prix sont obligatoires.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Upload des images vers Supabase Storage
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const ext  = file.name.split('.').pop()
        const path = `products/${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('yayyam-products')
          .upload(path, file, { upsert: false })

        if (uploadError) {
          // Si le bucket n'existe pas encore, on continue sans image
          console.warn('Upload image échoué (bucket manquant?) :', uploadError.message)
        } else {
          const { data: urlData } = supabase.storage
            .from('yayyam-products')
            .getPublicUrl(path)
          imageUrls.push(urlData.publicUrl)
        }
      }

      // 2. Upload fichier digital si applicable
      let digitalFileUrl: string | null = null
      let bunnyVideoId: string | undefined = undefined

      if (type === 'digital' && digitalMode === 'file' && digitalFile) {
        const ext = digitalFile.name.split('.').pop()?.toLowerCase() || ''
        const isVideo = ['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)

        if (isVideo) {
          // --- UPLOAD VIA BUNNY.NET (TUS) ---
          try {
            // 2.1 Appel à notre API pour initialiser la vidéo Bunny
            const initRes = await fetch('/api/bunny/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: name.trim() || 'Vidéo Produit' })
            })
            if (!initRes.ok) throw new Error('Erreur API Bunny')
            const initData = await initRes.json()
            const { libraryId, videoId, signature, expirationTime, uploadEndpoint } = initData

            bunnyVideoId = videoId

            // 2.2 Uploader via TUS asynchrone
            await new Promise<void>((resolve, reject) => {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const { Upload } = require('tus-js-client')
              const upload = new Upload(digitalFile, {
                endpoint: uploadEndpoint,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                  AuthorizationSignature: signature,
                  AuthorizationExpire: String(expirationTime),
                  VideoId: videoId,
                  LibraryId: libraryId,
                },
                metadata: {
                  filetype: digitalFile.type || 'video/mp4',
                  title: name.trim() || 'Video',
                },
                onError: (err: Error) => reject(err),
                onProgress: (bytesUploaded: number, bytesTotal: number) => {
                  const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
                  setUploadProgress(percentage)
                },
                onSuccess: () => {
                   setUploadProgress(null)
                   resolve()
                }
              })
              
              upload.findPreviousUploads().then((previousUploads: unknown[]) => {
                 if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0])
                 }
                 upload.start()
              })
            })

            // La vidéo est chez Bunny
            digitalFileUrl = `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoId}`

          } catch (e: unknown) {
             setError('Erreur lors du transfert sécurisé Bunny CDN: ' + (e instanceof Error ? e.message : 'Unknown error'))
             setLoading(false)
             return
          }
        } else {
          // --- COMPORTEMENT ACTUEL SUPABASE (Fichiers normaux) ---
          const path = `digital/${storeId}/${Date.now()}.${ext}`
          const { error: dfErr } = await supabase.storage
            .from('yayyam-digital')
            .upload(path, digitalFile)
          if (!dfErr) {
            const { data } = supabase.storage.from('yayyam-products').getPublicUrl(path)
            digitalFileUrl = data.publicUrl
          }
        }
      }

      // 3. Insérer le produit
      const typeExtra =
        type === 'digital'
          ? { 
              digital_file_url: digitalFileUrl, 
              digital_link: digitalMode === 'link' ? digitalLink.trim() || null : null,
              digital_files: [
                {
                  type: digitalMode === 'file' ? (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(digitalFile?.name.split('.').pop()?.toLowerCase() || '') ? 'video' : 'pdf') : 'link',
                  url: digitalMode === 'file' ? digitalFileUrl : digitalLink.trim(),
                  filename: digitalMode === 'file' ? digitalFile?.name : 'Lien externe',
                  size: digitalMode === 'file' ? digitalFile?.size : 0,
                  ...(bunnyVideoId ? { bunny_video_id: bunnyVideoId } : {})
                }
              ],
              access_duration_days: accessDurationDays ? parseInt(accessDurationDays) : null,
              max_downloads: maxDownloads ? parseInt(maxDownloads) : null,
              video_download_allowed: videoDownloadAllowed,
              license_type: licenseType,
              license_notes: licenseNotes.trim() || null,
              // Droit de revente — propagé uniquement pour les produits digitaux
              resale_allowed:    resaleAllowed,
              resale_commission: resaleAllowed ? (parseFloat(resaleCommission) || 0) : 0,
            }
          : type === 'physical'
          ? { shipping_fee: shippingFee ? parseFloat(shippingFee) : null, shipping_delay: shippingDelay.trim() || null, cash_on_delivery: cashOnDelivery }
          : type === 'coaching'
          ? { 
              session_duration: sessionDuration.trim() || null, 
              session_mode: sessionMode, 
              booking_link: bookingLink.trim() || null,
              coaching_type: coachingType,
              max_participants: coachingType === 'group' ? (parseInt(maxParticipants) || 10) : 1,
              coaching_durations: coachingDurations.length > 0 ? coachingDurations : [60],
              coaching_is_pack: coachingIsPack,
              coaching_pack_count: coachingIsPack ? parseInt(coachingPackCount) || 1 : 1
            }
          : {} // course

      const productId = crypto.randomUUID()

      const { data: product, error: productError } = await supabase
        .from('Product')
        .insert({
          id:          productId,
          store_id:    storeId,
          name:        name.trim(),
          description: description.trim() || null,
          price:       parseFloat(price),
          payment_type: paymentType,
          recurring_interval: paymentType === 'recurring' ? recurringInterval : null,
          type,
          category:    category.trim() || null,
          images:      imageUrls,
          active:          active,
          affiliate_active: affiliateActive,
          affiliate_margin: affiliateMargin ? parseFloat(affiliateMargin) / 100 : null,
          affiliate_media_kit_url: affiliateMediaKitUrl.trim() || null,
          bump_active:     bumpActive,
          bump_product_id: bumpActive ? (bumpProductId || null) : null,
          bump_offer_text: bumpActive ? (bumpOfferText.trim() || null) : null,
          oto_active:      otoActive,
          oto_product_id:  otoActive ? (otoProductId || null) : null,
          oto_discount:    otoActive ? (parseFloat(otoDiscount) || null) : null,
          seo_title:       seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          template:        template,
          created_at:  new Date().toISOString(),
          updated_at:  new Date().toISOString(),
          ...typeExtra,
        })
        .select('id')
        .single()

      if (productError || !product) {
        setError('Erreur création produit : ' + (productError?.message ?? 'inconnue'))
        setLoading(false)
        return
      }

      // 3. Insérer les variétés si activées
      if (hasVariants && variants.length > 0) {
        const validVariants = variants.filter(v => v.value_1.trim())
        if (validVariants.length > 0) {
          await supabase
            .from('ProductVariant')
            .insert(validVariants.map(v => ({
              id:           crypto.randomUUID(),
              product_id:   product.id,
              dimension_1:  v.dimension_1.trim() || 'Option',
              value_1:      v.value_1.trim(),
              dimension_2:  v.dimension_2.trim() || null,
              value_2:      v.value_2.trim() || null,
              stock:        Number(v.stock) || 0,
              price_adjust: Number(v.price_adjust) || 0,
            })))
        }
      }

      // 4. Lier à la communauté Telegram si sélectionnée
      if (selectedCommunityId) {
         await supabase
           .from('TelegramCommunity')
           .update({ product_id: product.id })
           .eq('id', selectedCommunityId)
      }

      // 5. Créer l'entité Course si le type est course
      if (type === 'course') {
        const { error: courseError } = await supabase
          .from('Course')
          .insert({
            id: crypto.randomUUID(),
            product_id: product.id,
            title: name.trim(),
            description: description.trim() || null
          })
          
        if (courseError) {
          console.error("Erreur création entité Course", courseError)
        }
      }

      router.push('/dashboard/products')
      router.refresh()
    } catch (err) {
      setError('Erreur inattendue. Réessayez.')
      console.error(err)
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  const steps = [
    { num: 1, label: 'Général' },
    { num: 2, label: 'Spécificités' },
    { num: 3, label: 'Médias' },
    { num: 4, label: 'Avancé & SEO' }
  ]

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  useEffect(() => {
    let t: NodeJS.Timeout
    if (currentStep === 4) {
      setCanSubmitTimeout(false)
      t = setTimeout(() => setCanSubmitTimeout(true), 500)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [currentStep])

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Colonne Gauche : Éditeur */}
        <div className="flex-1 space-y-6 min-w-0 w-full relative">
      {/* --- FORM WIZARD STEPPER (Glassmorphism) --- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white max-w-2xl mx-auto shadow-sm shadow-black/5 rounded-[20px] p-2 flex items-center justify-between overflow-x-auto hide-scrollbar sticky top-[80px] z-20">
        {steps.map(step => (
          <div key={step.num} className="flex items-center gap-2.5 px-3 py-1.5 min-w-max">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === step.num ? 'bg-gold text-white shadow-md shadow-gold/30' : currentStep > step.num ? 'bg-ink text-white' : 'bg-gray-100 text-gray-400'}`}>
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span className={`text-[13px] font-semibold transition-colors ${currentStep === step.num ? 'text-ink' : currentStep > step.num ? 'text-ink/70' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Barre d'upload vidéo Bunny.net */}
      {uploadProgress !== null && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-blue-800">
            <span>Téléversement sécurisé de la vidéo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" ref={el => { if(el) el.style.width = `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-blue-600">Veuillez patienter sans fermer la page.</p>
        </div>
      )}

      {/* ── IA GENERATOR TOGGLE ── */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <UniversalAIGenerator
          mode="single-product"
          category={category}
          onGenerated={(data: any) => {
            if (data.title || data.name) setName(data.title || data.name)
            
            if (data.benefits || data.faq) {
              const formattedDesc = `${data.description}\n\n✨ Pourquoi vous allez l'adorer :\n${(data.benefits || []).map((b: string) => `- ${b}`).join('\n')}\n\n❓ Questions Fréquentes :\n${(data.faq || []).map((f: any) => `Q: ${f.question}\nR: ${f.answer}`).join('\n\n')}\n\n🚀 ${data.callToAction || ''}`
              setDescription(formattedDesc)
            } else if (data.description) {
              setDescription(data.description)
            }
            
            if (data.price) setPrice(String(data.price))
            if (data.seoTitle) setSeoTitle(data.seoTitle)
            if (data.metaDescription) setSeoDescription(data.metaDescription)
            
            // On ferme le widget après import
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
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex : Formation Affiliation Débutant"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Décrivez votre produit en quelques lignes. Qu'est-ce qui le rend unique ? Pourquoi vos clients vont l'adorer ?"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="15000"
              min="0"
              step="1"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex : Formation"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>
        </div>

        {/* ── Mode de facturation ── */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('one_time')}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${paymentType === 'one_time' ? 'bg-gold text-white border-gold' : 'bg-white text-gray-600 border-gray-200 hover:border-gold/50'}`}
              >
                Paiement unique
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('recurring')}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${paymentType === 'recurring' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
              >
                Abonnement (Récurrent)
              </button>
            </div>
          </div>

          {paymentType === 'recurring' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rythme de facturation</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'weekly', label: 'Hebdomadaire' },
                  { id: 'monthly', label: 'Mensuel' },
                  { id: 'quarterly', label: 'Trimestriel' },
                  { id: 'yearly', label: 'Annuel' },
                ].map((interval) => (
                  <button
                    key={interval.id}
                    type="button"
                    onClick={() => setRecurringInterval(interval.id as any)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${recurringInterval === interval.id ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                💡 Remarque : Yayyam relancera automatiquement le client à chaque itération. L'accès sera révoqué si le paiement échoue.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de produit
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'physical', label: '📦 Physique' },
              { v: 'digital',  label: '📥 Digital'  },
              { v: 'course',   label: '🎓 Formation (Académie)' },
              { v: 'coaching', label: '👥 Service / Coaching' },
            ] as const)
            .filter(opt => {
              if (vendorType === 'digital') return opt.v !== 'physical'
              if (vendorType === 'physical') return opt.v === 'physical'
              return true // hybrid
            })
            .map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setType(opt.v)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition ${
                  type === opt.v
                    ? 'border-gold/50 bg-gold/10 text-gold/80'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-cream'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      </div>
      )}

      {/* ── STEP 2 : CHAMPS SPÉCIFIQUES PAR TYPE ── */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* DIGITAL */}
      {type === 'digital' && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-ink">📥 Contenu digital</h2>
          <p className="text-xs text-gray-400">Envoyé automatiquement à l&apos;acheteur après paiement.</p>

          {/* Toggle fichier / lien */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {(['file', 'link'] as const).map(m => (
              <button
                key={m} type="button"
                onClick={() => setDigitalMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium transition ${
                  digitalMode === m ? 'bg-gold text-white' : 'bg-white text-gray-500 hover:bg-cream'
                }`}
              >
                {m === 'file' ? '📎 Fichier à uploader' : '🔗 Lien externe'}
              </button>
            ))}
          </div>

          {digitalMode === 'file' ? (
            <div>
              <button
                type="button"
                onClick={() => digitalFileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-sm text-gray-400 hover:border-gold/40 hover:text-gold transition"
              >
                {digitalFile ? `✅ ${digitalFile.name}` : '📎 Sélectionner un fichier (PDF, ZIP, Fichiers. Les vidéos MP4 font l\'objet d\'un flux VOD rapide BunnyCDN.)'}
              </button>
              <input
                aria-label="Fichier expédié"
                title="Fichier expédié"
                ref={digitalFileRef}
                type="file"
                accept=".pdf,.zip,.mp4,.mov,.mkv,.avi,.mp3,.epub,.docx"
                onChange={e => setDigitalFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lien de téléchargement</label>
              <input
                type="url"
                value={digitalLink}
                onChange={e => setDigitalLink(e.target.value)}
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
                <p className="text-xs text-gray-400">Si décoché, la vidéo sera uniquement en streaming.</p>
              </div>
              <div
                onClick={() => setVideoDownloadAllowed(v => !v)}
                className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${videoDownloadAllowed ? 'bg-gold' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${videoDownloadAllowed ? 'left-5' : 'left-1'}`} />
              </div>
            </div>


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
                onClick={() => setCashOnDelivery(v => !v)}
                className={`w-12 h-7 rounded-full transition-all cursor-pointer relative ${cashOnDelivery ? 'bg-gold shadow-lg shadow-gold/20' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cashOnDelivery ? 'left-7' : 'left-1.5'}`} />
              </div>
            </div>
            {cashOnDelivery && (
              <p className="text-xs leading-relaxed text-amber-900/70 font-medium bg-white/50 p-2 rounded-lg border border-amber-200/50">
                ✨ <strong>En activant cette option</strong>, vos clients pourront choisir de payer à la livraison <u>OU</u> en ligne. Ils gardent le choix.
              </p>
            )}
          </div>
        </section>
      )}

      {/* COACHING */}
      {type === 'coaching' && (
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-ink">🎓 Paramètres de consultation</h2>

          {/* Coaching Type Selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setCoachingType('individual')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${coachingType === 'individual' ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <h3 className="font-bold text-[#0F7A60] text-sm mb-1">👤 Individuel (1-on-1)</h3>
              <p className="text-xs text-gray-500 leading-tight">1 client par créneau. Le créneau se bloque après réservation.</p>
            </button>
            <button
              type="button"
              onClick={() => setCoachingType('group')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${coachingType === 'group' ? 'border-gold bg-gold/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <h3 className="font-bold text-gold text-sm mb-1">👥 Session de Groupe</h3>
              <p className="text-xs text-gray-500 leading-tight">Webinaire/Masterclass. Plusieurs clients sur le même créneau.</p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {coachingType === 'group' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Places maximum</label>
                <input
                  type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)}
                  min="2"
                  title="Places maximum"
                  placeholder="2"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Durées proposées (Minutes)</label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60, 90, 120].map(dur => (
                  <label key={dur} className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                    coachingDurations.includes(dur) ? 'border-gold bg-gold/10 text-gold' : 'border-gray-200 bg-white text-gray-500 hover:border-gold/50'
                  }`}>
                    <input type="checkbox" className="hidden" 
                      title={`Durée ${dur} minutes`}
                      checked={coachingDurations.includes(dur)} 
                      onChange={(e) => {
                        if (e.target.checked) setCoachingDurations([...coachingDurations, dur])
                        else if (coachingDurations.length > 1) setCoachingDurations(coachingDurations.filter(d => d !== dur))
                      }} 
                    />
                    {dur >= 60 ? (dur % 60 === 0 ? `${Math.floor(dur/60)}h` : `${Math.floor(dur/60)}h${dur%60}`) : `${dur} min`}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Sélectionnez au moins une durée.</p>
            </div>
            
            <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">Pack de sessions</p>
                <p className="text-xs text-gray-500">Vendre plusieurs sessions en une seule fois.</p>
              </div>
              <div onClick={() => setCoachingIsPack(!coachingIsPack)} className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${coachingIsPack ? 'bg-gold' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${coachingIsPack ? 'left-5' : 'left-1'}`} />
              </div>
            </div>
            {coachingIsPack && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de sessions incluses dans ce pack</label>
                <input
                  type="number" min="2" value={coachingPackCount} onChange={e => setCoachingPackCount(e.target.value)}
                  title="Nombre de sessions"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                />
              </div>
            )}

            <div className={coachingType !== 'group' ? 'col-span-1' : 'col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Session</label>
              <select
                aria-label="Mode de session"
                title="Mode de session"
                value={sessionMode} onChange={e => setSessionMode(e.target.value as 'online' | 'onsite' | 'both')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition bg-white"
              >
                <option value="online">🖥️ En ligne</option>
                <option value="onsite">📍 Présentiel</option>
                <option value="both">🌐 Les deux</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien de réservation</label>
            <input
              type="url" value={bookingLink} onChange={e => setBookingLink(e.target.value)}
              placeholder="https://calendly.com/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>
        </section>
      )}
      </div>
      )}

      {/* ── STEP 3 : IMAGES ── */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Images</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${imageFiles.length >= 50 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
            {imageFiles.length} / 50
          </span>
        </div>

        {/* Prévisualisations */}
        {imagePreviews.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((src, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(i))
                  e.currentTarget.classList.add('opacity-50')
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('opacity-50')
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('ring-2', 'ring-[#0F7A60]')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('ring-2', 'ring-[#0F7A60]')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('ring-2', 'ring-[#0F7A60]')
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                  const toIndex = i
                  if (fromIndex === toIndex || isNaN(fromIndex)) return
                  
                  // Réorganiser les fichiers ET les previews
                  const newFiles = [...imageFiles]
                  const newPreviews = [...imagePreviews]
                  const [movedFile] = newFiles.splice(fromIndex, 1)
                  const [movedPreview] = newPreviews.splice(fromIndex, 1)
                  newFiles.splice(toIndex, 0, movedFile)
                  newPreviews.splice(toIndex, 0, movedPreview)
                  setImageFiles(newFiles)
                  setImagePreviews(newPreviews)
                }}
                className="relative w-20 h-20 group cursor-grab active:cursor-grabbing transition-all rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={src} alt={`Image produit ${i + 1}`} fill unoptimized className="object-cover rounded-xl border border-gray-200" />
                
                {/* Badge "Couverture" sur la première image */}
                {i === 0 && (
                  <span className="absolute -top-1.5 -left-1.5 bg-[#0F7A60] text-white text-xs font-black px-1.5 py-0.5 rounded shadow-sm z-10">
                    COUV
                  </span>
                )}
                
                {/* Badge GIF animé */}
                {imageFiles[i]?.type === 'image/gif' && (
                  <span className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs font-black px-1 rounded animate-pulse z-10">
                    GIF
                  </span>
                )}
                
                {/* Bouton supprimer */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  ×
                </button>
                
                {/* Indicateur de drag */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Glissez/Réorganiser
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageFiles.length >= 50}
          className={`w-full border-2 border-dashed rounded-xl py-6 text-sm transition-all flex flex-col items-center gap-1 ${
            imageFiles.length >= 50 
              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' 
              : 'border-gray-200 text-gray-400 hover:border-gold/40 hover:text-gold hover:bg-gold/5'
          }`}
        >
          <span className="text-xl">📷</span>
          <span>{imageFiles.length === 0 ? 'Ajouter des images' : imageFiles.length >= 50 ? 'Limite de 50 images atteinte' : 'Ajouter une autre image'}</span>
        </button>
        <input
          aria-label="Images du produit"
          title="Images du produit"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />
      </section>
      </div>
      )}

      {/* ── STEP 4 : OPTIONS AVANCÉES ── */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white rounded-2xl shadow-sm overflow-visible">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-5 flex items-center justify-between font-semibold text-ink hover:bg-gray-50 transition-colors"
        >
          <span>⚙️ Options avancées</span>
          {showAdvanced ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>
        
        {showAdvanced && (
          <div className="p-5 border-t border-gray-100 space-y-8">
            
            {/* TELEGRAM COMMUNAUTÉS */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <span className="text-blue-500">✈️</span> Lier à un groupe Telegram privé
              </h3>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <label className="block text-sm font-medium text-blue-900 mb-2">Choisir un groupe à lier</label>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  title="Choisir un groupe à lier"
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition bg-white"
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
            </div>

            {/* DIGITAL OPTIONS */}
            {type === 'digital' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">Type de licence</label>
                    <div className="group relative">
                      <HelpCircle size={16} className="text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-ink text-white text-xs p-2 rounded-lg opacity-0 shadow-lg invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                        Définissez comment vos clients peuvent utiliser votre produit digital
                      </div>
                    </div>
                  </div>
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
                        className={`py-2 px-1 rounded-lg border text-xs font-bold transition ${
                          licenseType === opt.v ? 'border-gold bg-gold/10 text-gold' : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
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

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-ink">🔄 Droit de revente</h3>
                    <div className="group relative">
                      <HelpCircle size={16} className="text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-ink text-white text-xs p-2 rounded-lg opacity-0 shadow-lg invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                        Permettez à vos clients de revendre votre produit et gagnez une commission
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-ink">Autoriser la revente</p>
                      <p className="text-xs text-gray-400">L&apos;acheteur peut revendre ce produit à ses propres clients.</p>
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
                        type="number" min={0} max={30} step={0.5}
                        value={resaleCommission} onChange={e => setResaleCommission(e.target.value)}
                        placeholder="Ex : 10"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">% reversé au créateur à chaque revente (max 30%).</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VARIETIES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">Variétés</h3>
                  <div className="group relative">
                    <HelpCircle size={16} className="text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-ink text-white text-xs p-2 rounded-lg opacity-0 shadow-lg invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                      Ajoutez des options comme taille, couleur, etc.
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setHasVariants(v => !v)}
                    className={`w-10 h-6 rounded-full transition-colors ${hasVariants ? 'bg-gold' : 'bg-gray-200'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasVariants ? 'left-5' : 'left-1'}`} />
                  </div>
                  <span className="text-sm text-gray-500">{hasVariants ? 'Activées' : 'Désactivées'}</span>
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-gray-400">
                    Ex: Taille S/M/L ou Couleur Rouge/Bleu — max 2 dimensions par variété.
                  </p>

                  {variants.map((variant, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-cream">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Variété {i + 1}</span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="text-red-400 hover:text-red-600 text-xs font-bold"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" value={variant.dimension_1} onChange={e => updateVariant(i, 'dimension_1', e.target.value)}
                          placeholder="Dimension (ex: Taille)"
                          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                        <input
                          type="text" value={variant.value_1} onChange={e => updateVariant(i, 'value_1', e.target.value)}
                          placeholder="Valeur (ex: L)"
                          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" value={variant.dimension_2} onChange={e => updateVariant(i, 'dimension_2', e.target.value)}
                          placeholder="Dimension 2 (optionnel)"
                          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                        <input
                          type="text" value={variant.value_2} onChange={e => updateVariant(i, 'value_2', e.target.value)}
                          placeholder="Valeur 2 (optionnel)"
                          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Stock</label>
                          <input
                            aria-label="Stock" type="number" value={variant.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} min="0"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">± Prix (FCFA)</label>
                          <input
                            aria-label="Ajustement de prix" type="number" value={variant.price_adjust} onChange={e => updateVariant(i, 'price_adjust', e.target.value)} placeholder="0"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {variants.length < 50 && (
                    <button
                      type="button"
                      onClick={addVariant}
                      className="w-full border border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-gold/40 hover:text-gold transition"
                    >
                      + Ajouter une variété
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ORDER BUMP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-ink">🚀 Order Bump (Vente Additionnelle)</h3>
                <div className="group relative">
                  <HelpCircle size={16} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-ink text-white text-xs p-2 rounded-lg opacity-0 shadow-lg invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                    Proposez un produit additionnel en un clic sur la page de paiement. Idéal pour augmenter le panier moyen.
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Activer l'Order Bump</label>
                    <p className="text-xs text-gray-400 mt-1">Affichera une option sur le checkout.</p>
                  </div>
                  <div
                    onClick={() => setBumpActive(v => !v)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${bumpActive ? 'bg-gold' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${bumpActive ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>

                {bumpActive && (
                  <div className="space-y-4 pt-3 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Produit à proposer</label>
                      <select
                        value={bumpProductId}
                        onChange={e => setBumpProductId(e.target.value)}
                        title="Produit à proposer"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition bg-white"
                      >
                        <option value="">-- Sélectionnez un produit --</option>
                        {storeProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.price} FCFA)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Texte d'incitation</label>
                      <input
                        type="text"
                        value={bumpOfferText}
                        onChange={e => setBumpOfferText(e.target.value)}
                        placeholder="Oui, je veux aussi ajouter le manuel avancé !"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* OTO UPSELL */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-emerald-900">Activer l'Upsell O-T-O</label>
                    <p className="text-xs text-emerald-700 mt-1">Affichera une page "One Time Offer" juste après l'achat (réservé au COD).</p>
                  </div>
                  <div
                    onClick={() => setOtoActive(v => !v)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative ${otoActive ? 'bg-emerald-600' : 'bg-emerald-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${otoActive ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>

                {otoActive && (
                  <div className="space-y-4 pt-3 border-t border-emerald-200/50">
                    <div>
                      <label className="block text-sm font-medium text-emerald-900 mb-1">Produit à proposer</label>
                      <select
                        aria-label="Produit O-T-O"
                        title="Produit à proposer pour l'Offre Unique (O-T-O)"
                        value={otoProductId}
                        onChange={e => setOtoProductId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition bg-white text-emerald-900"
                      >
                        <option value="">-- Sélectionnez un produit --</option>
                        {storeProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.price} FCFA)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-emerald-900 mb-1">Réduction exceptionnelle (%)</label>
                      <input
                        type="number"
                        min="0" max="100"
                        value={otoDiscount}
                        onChange={e => setOtoDiscount(e.target.value)}
                        placeholder="Ex: 50 (pour -50%)"
                        className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition text-emerald-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AFFILIATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-ink">🤝 Programme d'Affiliation</h3>
                <div className="group relative">
                  <HelpCircle size={16} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-ink text-white text-xs p-2 rounded-lg opacity-0 shadow-lg invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                    Définissez des règles de commission spécifiques pour ce produit, ou laissez vide pour hériter de la boutique.
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut de l'affiliation</label>
                  <select
                    value={affiliateActive === null ? 'default' : affiliateActive ? 'true' : 'false'}
                    onChange={(e) => {
                      if (e.target.value === 'default') setAffiliateActive(null)
                      else setAffiliateActive(e.target.value === 'true')
                    }}
                    title="Statut de l'affiliation"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition bg-white"
                  >
                    <option value="default">Par défaut (Hériter de la boutique)</option>
                    <option value="true">Activer pour ce produit</option>
                    <option value="false">Désactiver pour ce produit</option>
                  </select>
                </div>

                {affiliateActive !== false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commission spécifique (%)
                    </label>
                    <input
                      type="number"
                      min={0} max={100} step="0.1"
                      value={affiliateMargin}
                      onChange={(e) => setAffiliateMargin(e.target.value)}
                      placeholder="Ex : 20. Laisser vide pour hériter de la boutique"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                    />
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien du Kit Média (Optionnel)
                  </label>
                  <input
                    aria-label="Kit Média Affilié"
                    title="Lien Google Drive, Notion, etc."
                    type="url"
                    value={affiliateMediaKitUrl}
                    onChange={(e) => setAffiliateMediaKitUrl(e.target.value)}
                    placeholder="Ex: https://drive.google.com/drive/folders/..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
                  />
                  <p className="text-xs text-gray-400 mt-1">Fournissez vos visuels, bannières et textes pour aider les ambassadeurs à vendre.</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* ── STATUT ── */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink">Statut</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {active ? 'Visible sur votre espace' : 'Masqué de votre espace'}
            </p>
          </div>
          <div
            onClick={() => setActive(v => !v)}
            className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${active ? 'bg-gold' : 'bg-gray-200'} relative`}
          >
            <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'left-7' : 'left-1.5'}`} />
          </div>
        </div>
      </section>

      {/* ── SEO ── */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <h3 className="w-full p-5 font-semibold text-ink bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <span>🔎 Référencement (SEO / Meta)</span>
        </h3>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Méta-Titre (Google)</label>
            <input
              type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
              placeholder="Ex: Acheter Formation XYZ au Sénégal"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Méta-Description</label>
            <textarea
              value={seoDescription} onChange={e => setSeoDescription(e.target.value)}
              placeholder="Description courte qui s'affichera dans les résultats Google..." rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition resize-none"
            />
          </div>
        </div>
      </section>
      </div>
      )}

      {/* ── NAVIGATION WIZARD ── */}
      <div className="flex items-center justify-between gap-4 pt-4 mt-8 sticky bottom-6 z-20">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1 || loading}
          className={`px-8 py-4 rounded-2xl font-bold transition-colors shadow-sm backdrop-blur-md ${currentStep === 1 ? 'opacity-0 cursor-default pointer-events-none' : 'bg-white/80 border border-gray-200 text-gray-700 hover:bg-white hover:shadow-md'}`}
        >
          ← Retour
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 max-w-sm bg-[#0F7A60] text-white hover:bg-[#0D5C4A] font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
          >
            Étape Suivante →
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !canSubmitTimeout}
            className={`flex-1 max-w-sm font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-base ${
              loading || !canSubmitTimeout 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-gold hover:bg-gold-light text-white shadow-gold/20'
            }`}
          >
            {loading ? 'Création en cours…' : 'Créer le produit ✔'}
          </button>
        )}
      </div>

       </div> {/* Fin Colonne Gauche */}

      {/* Colonne Droite : Previewer (Sticky) */}
      <div className="hidden xl:block w-[350px] shrink-0 sticky top-[100px]">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
           <MobilePreviewer 
             name={name}
             price={price}
             description={description}
             images={imagePreviews}
             template={template}
             type={type}
           />
        </div>
      </div>

     </div>
    </form>
  )
}
