/* eslint-disable react/forbid-dom-props */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PhoneInput } from '@/components/ui/PhoneInput'
import * as Actions from '@/app/actions/settings'
import VendorContractModal from '@/components/vendor/VendorContractModal'
import { 
  User, 
  Palette, 
  ShieldCheck, 
  Bell, 
  AlertTriangle, 
  Globe, 
  Check, 
  Loader2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Share2,
  Target,
  Wallet,
  Store as StoreIcon
} from 'lucide-react'
import { TelegramSettings } from '@/components/settings/TelegramSettings'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface StoreData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string | null
  description: string | null
  category: string | null
  kyc_status: string
  kyc_document_type?: string | null
  kyc_documents?: unknown
  id_card_url: string | null
  security_pin: string | null
  notif_new_order?: boolean
  notif_weekly_report?: boolean
  notif_stock_alert?: boolean
  banner_url: string | null
  social_links?: unknown
  meta_pixel_id?: string | null
  tiktok_pixel_id?: string | null
  google_tag_id?: string | null
  telegram_chat_id?: string | null
  telegram_notifications?: unknown
  updated_at?: string
  withdrawal_method?: string | null
  withdrawal_number?: string | null
  withdrawal_name?:   string | null
  contract_accepted?:    boolean | null
  contract_accepted_at?: string | null
  vendor_type?: 'digital' | 'physical' | 'hybrid' | null
}

interface ProfileData {
  name: string
  phone: string
  email: string | null
  avatar_url?: string | null
}

interface SettingsFormProps {
  store: StoreData | null
  profile: ProfileData
  userId: string
}

const ACCENT_COLORS = [
  '#0F7A60', // Emeraude PDV Pro
  '#f97316', '#ef4444', '#8b5cf6', '#3b82f6',
  '#10b981', '#f59e0b', '#ec4899', '#14b8a6',
]

// ----------------------------------------------------------------
// Composant Principal
// ----------------------------------------------------------------
export function SettingsForm({ store: initialStore, profile, userId }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // ── Store local — permet la mise à jour optimiste (ex: signature contrat) ──
  const [store, setStore] = useState<StoreData | null>(initialStore)

  const [activeSection, setActiveSection] = useState<'profil' | 'lien' | 'apparence' | 'reseaux' | 'pixels' | 'securite' | 'kyc' | 'notifications' | 'retrait' | 'contrat' | 'vendor' | 'danger'>('profil')

  // Hash scroll : activer la section correspondant au hash URL au montage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '').trim()
    const valid = [
      'profil', 'lien', 'apparence', 'reseaux', 'pixels',
      'securite', 'kyc', 'notifications', 'retrait', 'contrat', 'vendor', 'danger',
    ]
    if (valid.includes(hash)) {
      setActiveSection(hash as typeof activeSection)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- États Formulaire ---
  
  // KYC
  const [kycStatus, setKycStatus] = useState(store?.kyc_status || 'none')
  const [kycDocType, setKycDocType] = useState<'cni' | 'passport' | 'permis'>((store?.kyc_document_type as 'cni' | 'passport' | 'permis') || 'cni')
  
  const docs = (store?.kyc_documents as Record<string, string>) || {}
  const [rectoPreview, setRectoPreview] = useState<string | null>(docs?.recto || null)
  const [rectoFile, setRectoFile] = useState<File | null>(null)
  const [versoPreview, setVersoPreview] = useState<string | null>(docs?.verso || null)
  const [versoFile, setVersoFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(docs?.selfie || null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  // Profil
  const [userName, setUserName] = useState(profile.name)
  const [userPhone, setUserPhone] = useState(profile.phone)
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Lien / Slug
  const [slug, setSlug] = useState(store?.slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  // Apparence
  const [primaryColor, setPrimaryColor] = useState(store?.primary_color ?? '#0F7A60')
  const [colorInput, setColorInput] = useState(store?.primary_color ?? '#0F7A60')
  const [logoPreview, setLogoPreview] = useState(store?.logo_url || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState(store?.banner_url || null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  // Sécurité
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Zone de danger
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Notifications
  const [notifs, setNotifs] = useState({
    whatsapp: store?.notif_new_order ?? true,
    weekly: store?.notif_weekly_report ?? false,
    stock: store?.notif_stock_alert ?? true
  })

  // Réseaux Sociaux
  const socialConfig = (store?.social_links as Record<string, string>) || {}
  const [socialLinks, setSocialLinks] = useState({
    instagram: socialConfig.instagram || '',
    tiktok: socialConfig.tiktok || '',
    facebook: socialConfig.facebook || '',
    youtube: socialConfig.youtube || '',
    linkedin: socialConfig.linkedin || '',
    whatsapp: socialConfig.whatsapp || '',
    website: socialConfig.website || ''
  })

  // Retrait
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wave' | 'orange_money' | 'bank'>(
    (store?.withdrawal_method as 'wave' | 'orange_money' | 'bank' | null | undefined) ?? 'wave'
  )
  const [withdrawalNumber, setWithdrawalNumber] = useState(store?.withdrawal_number ?? '')
  const [withdrawalName,   setWithdrawalName]   = useState(store?.withdrawal_name   ?? '')
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)

  // Contrat partenaire
  const [showContractModal, setShowContractModal] = useState(false)

  // Vendor Type
  const [vendorType, setVendorType] = useState<'digital' | 'physical' | 'hybrid'>(
    (store?.vendor_type as 'digital' | 'physical' | 'hybrid' | null | undefined) ?? 'digital'
  )

  // Global UI
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // --- Handlers ---

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (type === 'avatar') {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    } else if (type === 'logo') {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    } else {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  }

  const checkSlugDispo = async (val: string) => {
    if (!val || val === store?.slug) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    try {
      const res = await fetch(`/api/check-slug?slug=${val}`)
      const data = await res.json()
      setSlugStatus(data.available ? 'available' : 'taken')
    } catch {
      setSlugStatus('idle')
    }
  }

  // --- Actions de sauvegarde ---

  const onUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let finalAvatar = profile.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        finalAvatar = await uploadFile(avatarFile, 'avatars', `${userId}/profile_${Date.now()}.${ext}`)
      }
      await Actions.updateProfile({ name: userName, avatarUrl: finalAvatar || null })
      showMsg('success', 'Profil mis à jour')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onUpdateSlug = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Actions.updateSlug(slug)
      showMsg('success', 'Lien de vente mis à jour')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onUpdateAppearance = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let finalLogo = store?.logo_url || null
      if (logoFile && store?.id) {
        const ext = logoFile.name.split('.').pop()
        finalLogo = await uploadFile(logoFile, 'logos', `${store.id}/logo_${Date.now()}.${ext}`)
      }

      let finalBanner = store?.banner_url || null
      if (bannerFile && store?.id) {
        const ext = bannerFile.name.split('.').pop()
        finalBanner = await uploadFile(bannerFile, 'banners', `${store.id}/banner_${Date.now()}.${ext}`)
      } else if (bannerPreview === null) {
        finalBanner = null
      }

      await Actions.updateAppearance({ 
        logoUrl: finalLogo, 
        primaryColor,
        bannerUrl: finalBanner ?? null
      })
      showMsg('success', 'Apparence mise à jour')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    // 1. Vérifier que le mot de passe actuel est saisi
    if (!currentPassword) {
      setPasswordError('Saisissez votre mot de passe actuel')
      return
    }

    // 2. Les nouveaux mots de passe correspondent
    if (password !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      // 3. Vérifier le mot de passe actuel via Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    profile.email ?? '',
        password: currentPassword,
      })
      if (signInError) {
        setPasswordError('Mot de passe actuel incorrect')
        setLoading(false)
        return
      }

      // 4. Procéder au changement
      await Actions.updatePassword(password)
      showMsg('success', '🔒 Mot de passe modifié avec succès')

      // 5. Réinitialiser les 3 champs
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onUpdateNotifications = async () => {
    setLoading(true)
    try {
      await Actions.updateNotifications({
        notif_new_order: notifs.whatsapp,
        notif_weekly_report: notifs.weekly,
        notif_stock_alert: notifs.stock
      })
      showMsg('success', 'Préférences enregistrées')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const onUpdateSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Actions.updateSocialLinks(socialLinks)
      showMsg('success', 'Réseaux sociaux mis à jour')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveField = async (field: string, value: string) => {
    try {
      const res = await fetch('/api/settings/update-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      
      // Mettre à jour le store local
      setStore(prev => prev ? { ...prev, [field]: value || null } : prev)
      showMsg('success', `${field.replace(/_/g, ' ')} sauvegardé !`)
    } catch {
      showMsg('error', 'Erreur lors de la sauvegarde')
    }
  }

  const onDeleteAccount = async () => {
    setLoading(true)
    try {
      await Actions.deleteAccount()
      router.push('/')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }

  const onUpdateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawalNumber.trim()) {
      showMsg('error', 'Le numéro de compte est obligatoire.')
      return
    }
    if (!withdrawalName.trim()) {
      showMsg('error', 'Le nom du titulaire est obligatoire.')
      return
    }
    setWithdrawalLoading(true)
    try {
      const res = await fetch('/api/settings/withdrawal', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          withdrawalMethod,
          withdrawalNumber: withdrawalNumber.trim(),
          withdrawalName:   withdrawalName.trim(),
        }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        showMsg('success', '✅ Coordonnées de retrait sauvegardées !')
        router.refresh()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde')
      }
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : 'Erreur interne')
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const onUpdateKYC = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const isPassport = kycDocType === 'passport'
    if (isPassport) {
      if (!rectoFile && !rectoPreview) { showMsg('error', 'Page avec vos informations requise'); return; }
      if (!selfieFile && !selfiePreview) { showMsg('error', 'Selfie requis'); return; }
    } else {
      if (!rectoFile && !rectoPreview) { showMsg('error', 'Face avant (Recto) requise'); return; }
      if (!versoFile && !versoPreview) { showMsg('error', 'Face arrière (Verso) requise'); return; }
      if (!selfieFile && !selfiePreview) { showMsg('error', 'Selfie requis'); return; }
    }

    setLoading(true)
    try {
      const docs: Record<string, string | null> = {}
      
      const up = async (file: File | null, label: string) => {
        if (!file || !store?.id) return null
        const ext = file.name.split('.').pop()
        return await uploadFile(file, 'kyc', `${store.id}/${label}_${Date.now()}.${ext}`)
      }

      const [r, v, s] = await Promise.all([
        up(rectoFile, 'recto'),
        up(versoFile, 'verso'),
        up(selfieFile, 'selfie')
      ])

      docs.recto = r || rectoPreview
      docs.verso = v || versoPreview
      docs.selfie = s || selfiePreview

      await Actions.updateKYC({ 
        documentType: kycDocType,
        kycDocuments: docs,
        idCardUrl: docs.recto
      })

      setKycStatus('pending')
      showMsg('success', 'Documents envoyés pour vérification')
    } catch (err: unknown) {
      showMsg('error', err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      
      {/* ── MENU LATÉRAL (Navigation Paramètres) ── */}
      <aside className="lg:w-72 flex-shrink-0">
        <nav className="flex flex-col gap-1 sticky top-24">
          <MenuBtn active={activeSection === 'profil'} icon={<User size={18}/>} label="Mon Profil" onClick={() => setActiveSection('profil')} />
          <MenuBtn active={activeSection === 'lien'} icon={<Globe size={18}/>} label="Lien de vente" onClick={() => setActiveSection('lien')} />
          <MenuBtn active={activeSection === 'apparence'} icon={<Palette size={18}/>} label="Mon apparence" onClick={() => setActiveSection('apparence')} />
          <MenuBtn active={activeSection === 'reseaux'} icon={<Share2 size={18}/>} label="Réseaux sociaux" onClick={() => setActiveSection('reseaux')} />
          <MenuBtn active={activeSection === 'pixels'} icon={<Target size={18}/>} label="Pixels & Tracking" onClick={() => setActiveSection('pixels')} />
          <MenuBtn active={activeSection === 'securite'} icon={<ShieldCheck size={18}/>} label="Sécurité" onClick={() => setActiveSection('securite')} />
          <MenuBtn active={activeSection === 'kyc'} icon={<CheckCircle2 size={18}/>} label="Vérification KYC" onClick={() => setActiveSection('kyc')} />
          <MenuBtn active={activeSection === 'notifications'} icon={<Bell size={18}/>} label="Notifications" onClick={() => setActiveSection('notifications')} />
          <MenuBtn active={activeSection === 'retrait'} icon={<Wallet size={18}/>} label="Coordonnées de retrait" onClick={() => setActiveSection('retrait')} />
          <MenuBtn
            active={activeSection === 'contrat'}
            icon={<FileText size={18}/>}
            label="Mon contrat"
            onClick={() => setActiveSection('contrat')}
          />
          <MenuBtn 
            active={activeSection === 'vendor'} 
            icon={<StoreIcon size={18}/>} 
            label="Type de vendeur" 
            onClick={() => setActiveSection('vendor')} 
          />
          <div className="h-4" />
          <button 
            onClick={() => setActiveSection('danger')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeSection === 'danger' ? 'bg-red-50 text-red-600' : 'text-red-400 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <AlertTriangle size={18} /> Zone de danger
          </button>
        </nav>
      </aside>

      {/* ── CONTENU (Sections) ── */}
      <div className="flex-1 max-w-2xl">
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {message.type === 'success' ? <Check size={16}/> : '!'}
            </div>
            {message.text}
          </div>
        )}

        {/* 1. PROFIL */}
        {activeSection === 'profil' && (
          <form onSubmit={onUpdateProfile} className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <h2 className="text-2xl font-black text-ink">Mon Profil</h2>
            
            <div className="flex items-center gap-6 pb-6 border-b border-line">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-cream bg-white overflow-hidden shadow-sm">
                  {avatarPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald/5 text-emerald text-3xl font-black">
                      {userName[0]}
                    </div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-gold-dark font-medium border border-gold/30 px-3 py-2 rounded-xl hover:bg-gold/5 transition">
                  📸 Changer ma photo
                  <input aria-label="Avatar" title="Avatar" id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                </label>
              </div>
              <div className="flex-1">
                <p className="font-bold text-ink">Photo de profil</p>
                <p className="text-sm text-dust">Utilisée pour vos communications clients et votre tableau de bord.</p>
              </div>
            </div>

            <div className="grid gap-6">
              <InputGroup label="Nom complet" value={userName} onChange={setUserName} placeholder="Ex: Jean Dupont" />
              
              <div>
                <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">WhatsApp / Téléphone</label>
                <PhoneInput value={userPhone} onChange={setUserPhone} />
                <p className="text-[10px] text-dust mt-2 italic">Format international recommandé pour vos notifications WhatsApp.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-dust uppercase tracking-widest mb-1.5">Adresse Email</label>
                <input aria-label="Adresse Email" title="Adresse Email" value={profile.email || ''} readOnly className="w-full px-4 py-3 bg-cream border border-line rounded-xl text-dust text-sm cursor-not-allowed" />
                <p className="text-[10px] text-dust mt-1.5">L&apos;email ne peut pas être modifié. Contactez le support si besoin.</p>
              </div>
            </div>

            <SubmitBtn loading={loading} />
          </form>
        )}

        {/* 2. LIEN DE VENTE */}
        {activeSection === 'lien' && (
          <form onSubmit={onUpdateSlug} className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-ink">Mon Lien de Vente</h2>
              <div className="bg-emerald/5 text-emerald border border-emerald/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Public
              </div>
            </div>

            <div className="bg-[#FAFAF7] rounded-3xl p-6 border border-line">
              <p className="text-xs font-black text-dust uppercase tracking-widest mb-4">Aperçu de votre adresse</p>
              <div className="flex items-center text-lg md:text-xl font-display font-medium text-ink overflow-hidden border-b border-emerald/20 pb-2">
                <span className="text-dust opacity-50">pdvpro.com/</span>
                <span className="text-emerald font-black truncate">{slug}</span>
              </div>
              <p className="text-xs text-dust mt-4 leading-relaxed">
                Il s&apos;agit de votre URL principale. Vos clients l&apos;utiliseront pour accéder à votre espace de vente.
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">Modifier mon slug</label>
              <div className="relative">
                <input 
                  aria-label="Modifier mon slug"
                  title="Modifier mon slug"
                  value={slug} 
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    setSlug(val)
                    checkSlugDispo(val)
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-all font-mono text-sm ${
                    slugStatus === 'taken' ? 'border-red-400 focus:ring-red-400/10' : 
                    slugStatus === 'available' ? 'border-emerald-400 focus:ring-emerald-400/10' : 
                    'border-line focus:ring-emerald/10'
                  }`}
                  placeholder="nom-de-votre-espace"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === 'checking' && <Loader2 size={16} className="animate-spin text-dust" />}
                  {slugStatus === 'taken' && <span className="text-[10px] font-black text-red-500 uppercase">Indisponible</span>}
                  {slugStatus === 'available' && <span className="text-[10px] font-black text-emerald uppercase">Disponible</span>}
                </div>
              </div>
            </div>

            <SubmitBtn loading={loading} label="Mettre à jour mon lien" disabled={slugStatus === 'taken' || slugStatus === 'checking'} />
          </form>
        )}

        {/* 3. APPARENCE */}
        {activeSection === 'apparence' && (
          <form onSubmit={onUpdateAppearance} className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <h2 className="text-2xl font-black text-ink">Apparence</h2>

            <div className="space-y-4">
              <p className="text-xs font-black text-dust uppercase tracking-widest">Logo & Bannière</p>
              
              {/* Logo */}
              <div className="flex items-center gap-6 bg-[#FAFAF7] p-6 rounded-3xl border border-line border-dashed">
                <div className="w-20 h-20 rounded-2xl bg-white border border-line overflow-hidden flex items-center justify-center p-2 shadow-sm">
                  {logoPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-dust opacity-30" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-white border border-line px-4 py-2 rounded-xl text-xs font-bold text-ink hover:bg-cream transition flex items-center gap-2 shadow-sm w-fit">
                    <ImageIcon size={14} /> Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                  </label>
                  <p className="text-[10px] text-dust mt-2">Format suggéré : carré (PNG/WEBP).</p>
                </div>
              </div>

              {/* Bannière */}
              <div className="space-y-3">
                <div className="relative w-full h-32 md:h-40 bg-[#FAFAF7] rounded-3xl border border-line border-dashed overflow-hidden group">
                  {bannerPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bannerPreview} alt="Bannière" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer bg-white text-ink px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                          <ImageIcon size={14} /> Changer
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                        </label>
                        <button 
                          aria-label="Supprimer la bannière"
                          title="Supprimer la bannière"
                          type="button"
                          onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-cream transition-colors">
                      <ImageIcon size={32} className="text-dust opacity-30 mb-2" />
                      <span className="text-xs font-bold text-dust">Ajouter une bannière</span>
                      <span className="text-[10px] text-dust/60 mt-1">1200 x 300px recommandé</span>
                      <input aria-label="Bannière" title="Bannière" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-dust uppercase tracking-widest">Couleur principale</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {ACCENT_COLORS.map(color => (
                  <button 
                    aria-label={`Couleur ${color}`}
                    title={`Couleur ${color}`}
                    key={color} 
                    type="button" 
                    onClick={() => {
                      setPrimaryColor(color)
                      setColorInput(color)
                    }}
                    className={`w-10 h-10 rounded-xl border-4 transition-all ${
                      primaryColor === color ? 'border-ink scale-110 shadow-lg' : 'border-white'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label className="w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center cursor-pointer hover:scale-105 transition overflow-hidden shadow-sm">
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => {
                      setPrimaryColor(e.target.value)
                      setColorInput(e.target.value)
                    }} 
                    className="opacity-0 absolute" 
                  />
                  <span className="text-lg">🎨</span>
                </label>
                
                <div className="flex-1 min-w-[120px] relative">
                  <input 
                    type="text" 
                    value={colorInput}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase()
                      setColorInput(val)
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        setPrimaryColor(val)
                      }
                    }}
                    placeholder="#0F7A60"
                    className={`w-full h-10 px-4 rounded-xl border text-sm font-mono focus:outline-none transition-all ${
                      colorInput.length > 0 && !/^#[0-9A-Fa-f]{6}$/.test(colorInput) 
                        ? 'border-red-400 focus:ring-red-400/10' 
                        : 'border-line focus:ring-emerald/10'
                    }`}
                  />
                  {colorInput.length > 0 && !/^#[0-9A-Fa-f]{6}$/.test(colorInput) && (
                    <p className="absolute -bottom-5 left-0 text-[9px] text-red-500 font-bold uppercase">Format #RRGGBB requis</p>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPreview(true)}
                className="mt-6 w-full rounded-2xl p-4 text-center text-white font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2" 
                style={{ backgroundColor: primaryColor }}
              >
                Aperçu du bouton de paiement
              </button>
            </div>

            {/* Modal d'aperçu */}
            {showPreview && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-black text-dust uppercase tracking-[0.2em]">Aperçu de paiement</p>
                      <button aria-label="Fermer l'aperçu" title="Fermer l'aperçu" onClick={() => setShowPreview(false)} className="text-dust hover:text-ink transition-colors">✕</button>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-20 rounded-2xl border border-line flex items-center justify-center p-2 bg-cream">
                        {logoPreview ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                          </>
                        ) : (
                          <ImageIcon size={32} className="text-dust opacity-30" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-ink">{store?.name || 'Ma Boutique'}</h3>
                        <p className="text-sm text-dust">Paiement sécurisé via PDV Pro</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-px bg-line w-full" />
                      <div className="flex justify-between items-center font-bold">
                        <span>Total à payer</span>
                        <span className="text-xl">10 000 FCFA</span>
                      </div>
                      <button 
                        disabled
                        className="w-full py-5 rounded-2xl text-white font-black text-lg shadow-lg" 
                        style={{ backgroundColor: primaryColor }}
                      >
                        Payer maintenant
                      </button>
                      <p className="text-[10px] text-center text-dust uppercase tracking-widest font-black">
                        🔒 Données chiffrées
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <SubmitBtn loading={loading} />
          </form>
        )}

        {/* 3.5 RÉSEAUX SOCIAUX */}
        {activeSection === 'reseaux' && (
          <form onSubmit={onUpdateSocialLinks} className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <h2 className="text-2xl font-black text-ink">Mes Réseaux Sociaux</h2>
            
            <div className="bg-emerald/5 border border-emerald/10 p-4 rounded-xl text-xs text-emerald-800 flex gap-3">
              <Share2 size={18} className="flex-shrink-0" />
              <p>Ces liens seront affichés sur votre page boutique pour permettre à vos clients de vous suivre.</p>
            </div>

            <div className="grid gap-6">
              <InputGroup 
                label="Instagram" 
                value={socialLinks.instagram} 
                onChange={(v) => setSocialLinks({...socialLinks, instagram: v})} 
                placeholder="Ex: @votre.boutique" 
              />
              <InputGroup 
                label="TikTok" 
                value={socialLinks.tiktok} 
                onChange={(v) => setSocialLinks({...socialLinks, tiktok: v})} 
                placeholder="Ex: @votre.boutique" 
              />
              <InputGroup 
                label="Facebook" 
                value={socialLinks.facebook} 
                onChange={(v) => setSocialLinks({...socialLinks, facebook: v})} 
                placeholder="Lien de votre page" 
              />
              <InputGroup 
                label="WhatsApp (Lien direct)" 
                value={socialLinks.whatsapp} 
                onChange={(v) => setSocialLinks({...socialLinks, whatsapp: v})} 
                placeholder="Ex: wa.me/221..." 
              />
              <InputGroup 
                label="YouTube" 
                value={socialLinks.youtube} 
                onChange={(v) => setSocialLinks({...socialLinks, youtube: v})} 
                placeholder="Lien de votre chaîne" 
              />
              <InputGroup 
                label="LinkedIn" 
                value={socialLinks.linkedin} 
                onChange={(v) => setSocialLinks({...socialLinks, linkedin: v})} 
                placeholder="Lien de votre profil" 
              />
              <InputGroup 
                label="Site Web" 
                value={socialLinks.website} 
                onChange={(v) => setSocialLinks({...socialLinks, website: v})} 
                placeholder="https://www.votre-site.com" 
              />
            </div>

            <SubmitBtn loading={loading} />
          </form>
        )}

        {/* 3.6 PIXELS & TRACKING */}
        {activeSection === 'pixels' && (
          <div className="space-y-6">

            {/* Header */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#1A1A1A] mb-2">
                📡 Pixels & Tracking
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Les pixels vous permettent de mesurer vos ventes,
                optimiser vos publicités et recibler vos visiteurs.
                Suivez le guide étape par étape.
              </p>
            </div>

            {/* Meta Pixel */}
            <PixelCard
              name="Meta Pixel"
              logo="📘"
              color="#1877F2"
              description="Mesure les conversions Facebook & Instagram"
              value={store?.meta_pixel_id ?? ''}
              onChange={(val) => handleSaveField('meta_pixel_id', val)}
              guide={[
                "Allez sur business.facebook.com",
                "Cliquez sur 'Gestionnaire d'événements'",
                "Créez un nouveau pixel → copiez l'ID (16 chiffres)",
                "Collez l'ID ci-dessous et sauvegardez",
              ]}
              placeholder="Ex : 1234567890123456"
              helpUrl="https://business.facebook.com/events_manager"
              badge={store?.meta_pixel_id ? "✅ Actif" : "⚪ Non configuré"}
            />

            {/* TikTok Pixel */}
            <PixelCard
              name="TikTok Pixel"
              logo="🎵"
              color="#010101"
              description="Mesure les conversions TikTok Ads"
              value={store?.tiktok_pixel_id ?? ''}
              onChange={(val) => handleSaveField('tiktok_pixel_id', val)}
              guide={[
                "Allez sur ads.tiktok.com",
                "Cliquez sur 'Assets' → 'Events'",
                "Créez un pixel Web → copiez l'ID",
                "Collez l'ID ci-dessous et sauvegardez",
              ]}
              placeholder="Ex : CXXXXXXXXXXXXXXX"
              helpUrl="https://ads.tiktok.com/i18n/events_manager"
              badge={store?.tiktok_pixel_id ? "✅ Actif" : "⚪ Non configuré"}
            />

            {/* Google Tag Manager */}
            <PixelCard
              name="Google Tag Manager"
              logo="🏷️"
              color="#4285F4"
              description="Centralise tous vos tags Google (Analytics, Ads...)"
              value={store?.google_tag_id ?? ''}
              onChange={(val) => handleSaveField('google_tag_id', val)}
              guide={[
                "Allez sur tagmanager.google.com",
                "Créez un compte → un conteneur",
                "Copiez l'ID du conteneur (format GTM-XXXXX)",
                "Collez l'ID ci-dessous et sauvegardez",
              ]}
              placeholder="Ex : GTM-XXXXX"
              helpUrl="https://tagmanager.google.com"
              badge={store?.google_tag_id ? "✅ Actif" : "⚪ Non configuré"}
            />

            {/* Info box */}
            <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-bold text-[#0F7A60]">
                  Comment fonctionnent les pixels ?
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Une fois configurés, les pixels se chargent automatiquement
                  sur votre boutique publique et sur vos pages de vente.
                  Ils enregistrent chaque visite et chaque achat —
                  sans aucune action supplémentaire de votre part.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* 4. SÉCURITÉ */}
        {activeSection === 'securite' && (
          <form onSubmit={onUpdatePassword} className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <h2 className="text-2xl font-black text-ink">Sécurité</h2>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-800 flex gap-3">
                <ShieldCheck size={18} className="flex-shrink-0" />
                <p>Pour des raisons de sécurité, nous recommandons un mot de passe robuste de minimum 8 caractères.</p>
              </div>

              {passwordError && <p className="text-xs text-red-500 font-bold">{passwordError}</p>}

              <div className="grid gap-6">
                {/* Mot de passe actuel — OBLIGATOIRE en premier */}
                <div>
                  <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:ring-emerald/10 focus:outline-none transition-all text-sm"
                  />
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:ring-emerald/10 focus:outline-none transition-all text-sm"
                  />
                </div>

                {/* Confirmer le nouveau mot de passe */}
                <div>
                  <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-line focus:ring-emerald/10 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <SubmitBtn loading={loading} label="Changer le mot de passe" />
          </form>
        )}

        {/* 4.5 KYC */}
        {activeSection === 'kyc' && (
          <div className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-ink">Vérification KYC</h2>
              <KycBadge status={kycStatus} />
            </div>

            <div className="bg-emerald/5 border border-emerald/10 p-6 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <ShieldCheck size={18} /> Pourquoi vérifier mon identité ?
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Conformément aux régulations financières, la vérification KYC est obligatoire pour retirer vos fonds. 
                Elle garantit la sécurité des transactions sur PDV Pro.
              </p>
            </div>

            {kycStatus === 'verified' ? (
              <div className="py-12 flex flex-col items-center text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} />
                 </div>
                 <h3 className="text-xl font-bold text-ink">Compte vérifié</h3>
                 <p className="text-sm text-dust max-w-xs capitalize">
                   {kycDocType.replace('cni', 'CNI').replace('passport', 'Passeport').replace('permis', 'Permis')} vérifié le {store?.updated_at ? new Date(store.updated_at).toLocaleDateString() : 'récemment'}
                 </p>
                 <p className="text-xs text-dust">Vous pouvez retirer vos gains sans limite.</p>
              </div>
            ) : kycStatus === 'pending' ? (
              <div className="py-12 flex flex-col items-center text-center space-y-4">
                 <div className="w-20 h-20 bg-gold-100 text-gold rounded-full flex items-center justify-center">
                    <Clock size={40} />
                 </div>
                 <h3 className="text-xl font-bold text-ink">Vérification en cours</h3>
                 <p className="text-sm text-dust max-w-xs capitalize">
                   {kycDocType.replace('cni', 'CNI').replace('passport', 'Passeport').replace('permis', 'Permis')} soumis — nos équipes examinent vos documents.
                 </p>
                 <p className="text-xs text-dust">Cela prend généralement moins de 24h.</p>
              </div>
            ) : (
              <form onSubmit={onUpdateKYC} className="space-y-8">
                {/* ÉTAPE 1 : Type de Document */}
                <div className="space-y-4">
                  <label className="block text-xs font-black text-dust uppercase tracking-widest">Type de document</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'cni', label: 'Carte d\'Identité', icon: '🆔' },
                      { id: 'passport', label: 'Passeport', icon: '📕' },
                      { id: 'permis', label: 'Permis de conduire', icon: '🚗' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setKycDocType(type.id as Parameters<typeof setKycDocType>[0])}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          kycDocType === type.id 
                            ? 'border-emerald bg-emerald/5 text-emerald font-bold' 
                            : 'border-line bg-white text-dust hover:border-dust/30'
                        }`}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-sm">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ÉTAPE 2 : Champs d'upload dynamiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {kycDocType === 'passport' ? (
                    <>
                      <DocUploadField 
                        label="Page avec vos informations" 
                        placeholder="Double page avec photo + infos"
                        preview={rectoPreview}
                        onChange={(f, p) => { setRectoFile(f); setRectoPreview(p); }}
                        icon={<FileText size={40} />}
                      />
                      <DocUploadField 
                        label="Selfie avec votre passeport" 
                        placeholder="Vous tenant le passeport ouvert"
                        preview={selfiePreview}
                        onChange={(f, p) => { setSelfieFile(f); setSelfiePreview(p); }}
                        icon={<User size={40} />}
                      />
                    </>
                  ) : (
                    <>
                      <DocUploadField 
                        label="Face avant (Recto)" 
                        placeholder="Photo de la face avec photo"
                        preview={rectoPreview}
                        onChange={(f, p) => { setRectoFile(f); setRectoPreview(p); }}
                        icon={<FileText size={40} />}
                      />
                      <DocUploadField 
                        label="Face arrière (Verso)" 
                        placeholder="Photo du dos du document"
                        preview={versoPreview}
                        onChange={(f, p) => { setVersoFile(f); setVersoPreview(p); }}
                        icon={<FileText size={40} />}
                      />
                      <DocUploadField 
                        label="Selfie avec votre document" 
                        placeholder="Vous tenant le document face caméra"
                        preview={selfiePreview}
                        onChange={(f, p) => { setSelfieFile(f); setSelfiePreview(p); }}
                        icon={<User size={40} />}
                      />
                    </>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Conseils pour une validation rapide :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800">
                      <CheckCircle2 size={14} className="text-emerald" /> Photo nette et lisible
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800">
                      <CheckCircle2 size={14} className="text-emerald" /> Document entier visible
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800 text-red-600 font-bold">
                      <XCircle size={14} /> Pas de reflets ou flou
                    </div>
                  </div>
                </div>

                <SubmitBtn loading={loading} label="Soumettre pour vérification" />
              </form>
            )}
          </div>
        )}

        {/* 5. NOTIFICATIONS */}
        {activeSection === 'notifications' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
              <h2 className="text-2xl font-black text-ink">Notifications Email & Système</h2>
              
              <div className="space-y-1">
                <ToggleRow 
                  icon={<Bell size={18}/>} 
                  title="Ventes via WhatsApp" 
                  desc="Recevoir une alerte immédiate lors d'une nouvelle commande confirmée." 
                  checked={notifs.whatsapp} 
                  onChange={(val) => setNotifs({...notifs, whatsapp: val})} 
                />
                <ToggleRow 
                  icon={<Bell size={18}/>} 
                  title="Rapport Hebdomadaire" 
                  desc="Recevoir chaque lundi le récapitulatif de vos performances par email." 
                  checked={notifs.weekly} 
                  onChange={(val) => setNotifs({...notifs, weekly: val})} 
                />
                <ToggleRow 
                  icon={<Bell size={18}/>} 
                  title="Alertes Stock" 
                  desc="Être prévenu lorsque le stock d'un produit physique est bas." 
                  checked={notifs.stock} 
                  onChange={(val) => setNotifs({...notifs, stock: val})} 
                />
              </div>

              <div className="pt-4">
                <SubmitBtn onClick={onUpdateNotifications} loading={loading} label="Enregistrer mes préférences" />
              </div>
            </div>

            {/* Intégration Telegram */}
            <TelegramSettings 
              storeId={store?.id || ''}
              initialChatId={store?.telegram_chat_id || null}
              initialNotifications={(store?.telegram_notifications as { orders: boolean; payments: boolean; whatsapp: boolean; stock: boolean }) || {
                orders: true,
                payments: true,
                whatsapp: true,
                stock: true
              }}
            />
          </div>
        )}

        {/* ── SECTION RETRAIT ── */}
        {activeSection === 'retrait' && (
          <form
            id="retrait"
            onSubmit={onUpdateWithdrawal}
            className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-ink">💰 Coordonnées de retrait</h2>
              {store?.withdrawal_number ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 size={12} /> Configuré ✅
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  ⚠️ Non configuré
                </span>
              )}
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800 flex gap-3">
              <Wallet size={18} className="flex-shrink-0 text-emerald-600" />
              <p>
                Configurez <strong>une fois</strong> votre compte de retrait.
                Ces informations seront utilisées automatiquement pour tous vos retraits.
              </p>
            </div>

            {/* Méthode de retrait */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-dust uppercase tracking-widest">
                Méthode préférée
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'wave',         label: 'Wave',           icon: '🌊' },
                  { id: 'orange_money', label: 'Orange Money',   icon: '🟠' },
                  { id: 'bank',         label: 'Virement',       icon: '🏦' },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawalMethod(m.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-sm font-bold
                      ${
                        withdrawalMethod === m.id
                          ? 'border-emerald bg-emerald/5 text-emerald'
                          : 'border-line bg-white text-dust hover:border-dust/30'
                      }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Numéro de compte */}
            <div>
              <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">
                {withdrawalMethod === 'bank' ? 'IBAN ou numéro de compte' : 'Numéro Wave / Orange Money'}
              </label>
              <input
                type="text"
                value={withdrawalNumber}
                onChange={(e) => setWithdrawalNumber(e.target.value)}
                placeholder={
                  withdrawalMethod === 'bank'
                    ? 'IBAN ou numéro de compte bancaire'
                    : '+221 77 000 00 00'
                }
                className="w-full px-4 py-3 rounded-xl border border-line focus:ring-emerald/10 focus:outline-none transition-all text-sm font-mono"
              />
            </div>

            {/* Nom du titulaire */}
            <div>
              <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">
                Nom du titulaire
              </label>
              <input
                type="text"
                value={withdrawalName}
                onChange={(e) => setWithdrawalName(e.target.value)}
                placeholder="Ex: Amadou Diallo"
                className="w-full px-4 py-3 rounded-xl border border-line focus:ring-emerald/10 focus:outline-none transition-all text-sm"
              />
            </div>

            {/* Message sécurité */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-700">🔒 Données sécurisées</strong> — Ces coordonnées sont chiffrées
                et utilisées automatiquement pour vos retraits. Elles ne sont jamais partagées avec des tiers.
              </p>
            </div>

            {/* Bouton sauvegarde */}
            <button
              type="submit"
              disabled={withdrawalLoading}
              className="w-full md:w-auto px-8 bg-emerald hover:bg-emerald-rich disabled:opacity-50
                text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald/10
                flex items-center justify-center gap-2"
            >
              {withdrawalLoading && <Loader2 size={18} className="animate-spin" />}
              💾 Sauvegarder les coordonnées
            </button>
          </form>
        )}

        {/* 6. DANGER ZONE */}
        {/* ── SECTION CONTRAT ── */}
        {activeSection === 'contrat' && (
          <div className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-ink">📜 Mon Contrat Partenaire</h2>

            {store?.contract_accepted ? (
              // Contrat déjà signé — badge vert + date
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="text-4xl">✅</div>
                <p className="font-black text-emerald-700">Contrat signé</p>
                <p className="text-sm text-gray-500">
                  Signé le :{' '}
                  {store.contract_accepted_at
                    ? new Date(store.contract_accepted_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })
                    : 'Date inconnue'}
                </p>
                <p className="text-xs text-gray-400">
                  Vos ventes sont activées. Une copie a été envoyée à votre email.
                </p>
              </div>
            ) : (
              // Contrat non signé — alerte + bouton
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="font-bold text-amber-800">Contrat non signé</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Vos clients ne peuvent pas finaliser leurs achats
                      tant que votre contrat partenaire n&apos;est pas signé.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContractModal(true)}
                  className="w-full py-3 text-sm font-bold text-white bg-[#0F7A60]
                    hover:bg-[#0D6B53] rounded-2xl transition-all shadow-sm"
                >
                  📜 Signer mon contrat maintenant
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'vendor' && (
          <div className="bg-white rounded-3xl border border-line p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-2xl font-black text-ink mb-2">Type de vendeur</h2>
              <p className="text-sm text-dust">
                Définissez le fonctionnement par défaut de votre boutique.
              </p>
            </div>

            <div className="space-y-4">
              {([
                { id: 'digital',  icon: '💾', title: 'Digital',  desc: 'PDF, formations, accès Telegram, fichiers...' },
                { id: 'physical', icon: '📦', title: 'Physique', desc: 'Vêtements, cosmétiques, électronique...' },
                { id: 'hybrid',   icon: '🔀', title: 'Hybride',  desc: 'Vous vendez les deux types de produits' },
              ] as const).map(option => (
                <label 
                  key={option.id}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    vendorType === option.id 
                      ? 'border-[#0F7A60] bg-[#F0FAF7]' 
                      : 'border-line hover:border-emerald/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="vendor_type"
                    value={option.id}
                    checked={vendorType === option.id}
                    onChange={() => {
                      setVendorType(option.id)
                      handleSaveField('vendor_type', option.id)
                    }}
                    className="mt-1 w-4 h-4 text-emerald focus:ring-emerald cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{option.icon}</span>
                      <p className="font-bold text-ink">{option.title}</p>
                    </div>
                    <p className="text-sm text-dust leading-relaxed">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Avertissement si on sélectionne 'physical' ou 'hybrid' alors que le store actuel n'est pas 'physical' ni 'hybrid' */}
            {(vendorType === 'physical' || vendorType === 'hybrid') && (store?.vendor_type === 'digital' || !store?.vendor_type) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mt-6">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <p className="text-sm text-amber-800 leading-relaxed font-medium">
                  Le paiement à la livraison (COD) reste désactivé par défaut.
                  Vous pourrez l&apos;activer manuellement par produit.
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'danger' && (
          <>
          <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h2 className="text-2xl font-black">Zone de danger</h2>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
              <p className="text-sm font-bold text-red-800">Supprimer mon compte PDV Pro</p>
              <p className="text-xs text-red-700 leading-relaxed">
                Cette action supprimera votre espace, tous vos produits, vos pages de vente et vos accès.
                L&apos;argent restant dans votre portefeuille doit être retiré au préalable.
              </p>
            </div>

            <button
              onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl
                transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3"
            >
              <Trash2 size={18}/>
              Supprimer mon compte définitivement
            </button>
          </div>

          {/* Modal confirmation suppression */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle size={24} />
                  <h3 className="text-xl font-black">Supprimer définitivement ?</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Cette action est <strong>irréversible</strong>. Votre boutique, tous vos produits,
                  vos pages de vente et vos commandes seront supprimés. L&apos;argent
                  restant dans votre portefeuille doit être retiré au préalable.
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    Tapez SUPPRIMER pour confirmer
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono uppercase tracking-wider
                      focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600
                      hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { setShowDeleteModal(false); onDeleteAccount() }}
                    disabled={deleteConfirmText !== 'SUPPRIMER' || loading}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-black
                      hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>}
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}

      </div>
    </div>

    {/* Modal signature contrat partenaire */}
    {showContractModal && store?.id && (
      <VendorContractModal
        storeId={store.id}
        storeName={store.name ?? 'Votre boutique'}
        vendorName={profile.name ?? 'Vendeur'}
        onAccepted={() => {
          setShowContractModal(false)
          // Mise à jour optimiste de l'état local — visible immédiatement
          setStore(prev => prev ? {
            ...prev,
            contract_accepted:    true,
            contract_accepted_at: new Date().toISOString(),
          } : prev)
          router.refresh()
        }}
        onClose={() => setShowContractModal(false)}
      />
    )}

    </>
  )
}

// ----------------------------------------------------------------
// Sous-Composants UI
// ----------------------------------------------------------------

function KycBadge({ status }: { status: string }) {
  if (status === 'verified') return (
    <div className="flex items-center gap-2 bg-emerald-50 text-emerald border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
      <CheckCircle2 size={12} /> Vérifié
    </div>
  )
  if (status === 'pending') return (
    <div className="flex items-center gap-2 bg-gold-50 text-gold border border-gold-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
      <Clock size={12} className="animate-pulse" /> En attente
    </div>
  )
  if (status === 'rejected') return (
    <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
      <XCircle size={12} /> Rejeté
    </div>
  )
  return (
    <div className="flex items-center gap-2 bg-gray-50 text-gray-400 border border-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
      Non vérifié
    </div>
  )
}

function MenuBtn({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'bg-emerald text-white shadow-md shadow-emerald/20 translate-x-1' 
          : 'text-dust hover:bg-white hover:text-ink'
      }`}
    >
      <span className={active ? 'text-white' : 'text-dust'}>{icon}</span>
      {label}
    </button>
  )
}

function InputGroup({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-black text-dust uppercase tracking-widest mb-2">{label}</label>
      <input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-line focus:ring-emerald/10 focus:outline-none transition-all text-sm" 
        placeholder={placeholder}
      />
    </div>
  )
}

function SubmitBtn({ loading, label = 'Sauvegarder les modifications', onClick, disabled }: { loading: boolean; label?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button 
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full md:w-auto px-8 bg-emerald hover:bg-emerald-rich disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald/10 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {label}
    </button>
  )
}

function ToggleRow({ icon, title, desc, checked, onChange }: { icon: React.ReactNode; title: string, desc: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="py-4 border-b border-line last:border-0 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-dust flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-bold text-ink text-sm">{title}</p>
        <p className="text-xs text-dust mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button 
        type="button" 
        {...({ role: 'switch', 'aria-checked': checked } as React.HTMLAttributes<HTMLButtonElement>)}
        aria-label={`Basculer ${title}`}
        title={`Basculer ${title}`}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${checked ? 'bg-emerald' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  )
}

function DocUploadField({ label, placeholder, preview, onChange, icon }: { label: string; placeholder: string; preview: string | null; onChange: (f: File, p: string) => void; icon: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-black text-dust uppercase tracking-widest">{label}</label>
      <div className="relative group aspect-video w-full bg-[#FAFAF7] rounded-3xl border-2 border-dashed border-line overflow-hidden flex items-center justify-center transition-all hover:bg-cream">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <label className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span className="bg-white text-ink px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                <ImageIcon size={14} /> Changer
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if(f){ onChange(f, URL.createObjectURL(f)); }
              }} />
            </label>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center">
            <div className="opacity-30 mb-3">{icon}</div>
            <span className="text-[10px] font-bold text-dust uppercase tracking-wider">{placeholder}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if(f){ onChange(f, URL.createObjectURL(f)); }
            }} />
          </label>
        )}
      </div>
    </div>
  )
}

interface PixelCardProps {
  name:        string
  logo:        string
  color:       string
  description: string
  value:       string
  onChange:    (val: string) => void
  guide:       string[]
  placeholder: string
  helpUrl:     string
  badge:       string
}

function PixelCard({
  name, logo, color, description,
  value, onChange, guide,
  placeholder, helpUrl, badge,
}: PixelCardProps) {
  const [showGuide, setShowGuide] = useState(false)
  const [localVal,  setLocalVal]  = useState(value)
  const [saved,     setSaved]     = useState(false)

  const handleSave = () => {
    onChange(localVal.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header card */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{logo}</span>
          <div>
            <p className="font-black text-sm text-[#1A1A1A]">{name}</p>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
          badge.startsWith('✅')
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {badge}
        </span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Input + bouton sauvegarder */}
        <div className="flex gap-2">
          <input
            type="text"
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-2.5
              text-sm font-mono text-[#1A1A1A] focus:border-[#0F7A60]
              focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={localVal.trim() === value}
            style={{ backgroundColor: saved ? '#0F7A60' : color }}
            className="px-4 py-2.5 text-white text-xs font-black rounded-xl
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saved ? '✅' : 'Sauvegarder'}
          </button>
        </div>

        {/* Guide accordéon */}
        <button
          type="button"
          onClick={() => setShowGuide(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-[#0F7A60] hover:underline"
        >
          {showGuide ? '▲ Masquer le guide' : '📖 Voir le guide étape par étape'}
        </button>

        {showGuide && (
          <div className="bg-[#FAFAF7] rounded-2xl p-4 space-y-3">
            {guide.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#0F7A60] text-white
                  text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{step}</p>
              </div>
            ))}
            
            <a
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold
                text-[#0F7A60] hover:underline mt-2"
            >
              Ouvrir {name} ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
