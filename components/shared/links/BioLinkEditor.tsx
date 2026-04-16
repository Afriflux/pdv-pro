/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, GripVertical, Save, CheckCircle2, ExternalLink, UploadCloud, Loader2, Image as ImageIcon, Link2, Copy, Grid2X2, List, Eye, Palette, Share2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'
import { saveBioLink } from '@/app/actions/biolink'
import { MobileSimulator } from '@/components/shared/simulator/MobileSimulator'
import { ImageCropperModal } from './ImageCropperModal'
import EmojiPicker from 'emoji-picker-react'

interface BioLinkEditorProps {
  userId: string
  initialBioLink?: any
  domain: string
  onBack?: () => void
}

export default function BioLinkEditor({ userId, initialBioLink, domain, onBack }: BioLinkEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [themeView, setThemeView] = useState<'grid' | 'list'>('grid')
  
  const AVAILABLE_THEMES = [
    { id: 'light', name: 'Light', icon: '⚪️', tailwindClass: 'border-gray-200 bg-white text-gray-800' },
    { id: 'dark', name: 'Dark', icon: '⚫️', tailwindClass: 'border-gray-800 bg-black text-white' },
    { id: 'glass', name: 'Glass Premium', icon: '✨', tailwindClass: 'bg-gradient-to-br from-indigo-500 to-pink-500 text-white border-transparent' },
    { id: 'girly', name: 'Girly Pink', icon: '🌸', tailwindClass: 'bg-pink-50 border-pink-200 text-pink-600' },
    { id: 'pinky', name: 'Hot Pinky', icon: '💅', tailwindClass: 'bg-pink-500 border-pink-400 text-white' },
    { id: 'luxury', name: 'Luxury Gold', icon: '👑', tailwindClass: 'bg-black border-[#FFD700] text-[#FFD700]' },
    { id: 'richy', name: 'Richy Emerald', icon: '💎', tailwindClass: 'bg-[#082212] border-emerald-500 text-emerald-400' },
    { id: 'pro', name: 'Pro Corporate', icon: '💼', tailwindClass: 'bg-slate-100 border-slate-300 text-slate-800' },
    { id: 'magnet', name: 'Magnet Gradient', icon: '🧲', tailwindClass: 'bg-gradient-to-tr from-rose-600 to-indigo-600 border-transparent text-white' },
    { id: 'argenté', name: 'Silver Metal', icon: '💿', tailwindClass: 'bg-gradient-to-b from-gray-100 to-gray-300 border-gray-400 text-gray-800' },
    { id: 'services', name: 'Blue Services', icon: '🛠', tailwindClass: 'bg-blue-50 border-blue-200 text-blue-600' },
    { id: 'expresse', name: 'Red Express', icon: '🚀', tailwindClass: 'bg-red-50 border-red-200 text-red-600' },
    { id: 'été', name: 'Summer Vibes', icon: '⛱', tailwindClass: 'bg-gradient-to-br from-yellow-300 to-orange-400 border-transparent text-white' },
    { id: 'show', name: 'Show Neon', icon: '🎭', tailwindClass: 'bg-zinc-950 border-purple-500 text-purple-400' },
    { id: 'shadow', name: 'Shadow Black', icon: '🌑', tailwindClass: 'bg-[#0a0a0a] border-gray-800 text-gray-400' },
    { id: 'ambiance', name: 'Ambiance', icon: '🕯', tailwindClass: 'bg-gradient-to-tr from-amber-900 to-black border-amber-800 text-amber-500' },
    { id: 'music', name: 'Night Music', icon: '🎵', tailwindClass: 'bg-indigo-950 border-indigo-500 text-indigo-400' },
    { id: 'custom', name: 'Total Custom', icon: '🎨', tailwindClass: 'bg-white border-2 border-dashed border-[#0F7A60] text-[#0F7A60]' }
  ]

  const [formData, setFormData] = useState({
    title: initialBioLink?.title || '',
    slug: initialBioLink?.slug || '',
    bio: initialBioLink?.bio || '',
    theme: initialBioLink?.theme || 'light',
    brand_color: initialBioLink?.brand_color || '#0F7A60',
    avatar_url: initialBioLink?.avatar_url || '',
    banner_url: initialBioLink?.banner_url || '',
    newsletter_active: initialBioLink?.newsletter_active || false,
    newsletter_text: initialBioLink?.newsletter_text || 'Abonnez-vous à ma newsletter',
    tip_active: initialBioLink?.tip_active || false,
    tip_text: initialBioLink?.tip_text || 'Offrez-moi un café ☕️',
    phone_active: initialBioLink?.phone_active || false,
    phone_number: initialBioLink?.phone_number || '',
    phone_text: initialBioLink?.phone_text || 'Appeler Maintenant 📞',
    custom_appearance: initialBioLink?.custom_appearance || {
      bg_type: 'color',
      bg_value: '#FAFAF7',
      font_family: 'inter',
      button_shape: 'rounded-xl',
      button_style: 'solid'
    }
  })

  const isDarkTheme = ['dark', 'luxury', 'richy', 'show', 'shadow', 'ambiance', 'music'].includes(formData.theme);
  const isGlassTheme = ['glass', 'magnet', 'été'].includes(formData.theme);
  const isLightTheme = !isDarkTheme && !isGlassTheme;

  let bgClass = "bg-[#FAFAF7] text-gray-900";
  let wrapperClass = "bg-white text-gray-900 border-gray-100";
  
  switch(formData.theme) {
    case 'dark':
      bgClass = "bg-black text-white";
      wrapperClass = "bg-[#1A1A1A] text-white border-gray-800";
      break;
    case 'glass':
      bgClass = "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white";
      wrapperClass = "bg-white/10 backdrop-blur-xl border border-white/20 text-white";
      break;
    case 'girly':
      bgClass = "bg-pink-50 text-pink-900";
      wrapperClass = "bg-white text-pink-900 border-pink-100";
      break;
    case 'pinky':
      bgClass = "bg-pink-500 text-white";
      wrapperClass = "bg-pink-400 text-white border-pink-300";
      break;
    case 'luxury':
      bgClass = "bg-black text-amber-100";
      wrapperClass = "bg-[#0A0A0A] text-amber-100 border-[#FFD700]/30";
      break;
    case 'richy':
      bgClass = "bg-[#082212] text-emerald-50";
      wrapperClass = "bg-[#0A2E18] text-emerald-50 border-emerald-500/20";
      break;
    case 'pro':
      bgClass = "bg-slate-100 text-slate-900";
      wrapperClass = "bg-white text-slate-900 border-slate-200";
      break;
    case 'magnet':
      bgClass = "bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white";
      wrapperClass = "bg-white/10 backdrop-blur-2xl border-white/20 text-white";
      break;
    case 'argenté':
      bgClass = "bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900";
      wrapperClass = "bg-gradient-to-br from-white to-gray-50 text-gray-900 border-white/50";
      break;
    case 'services':
      bgClass = "bg-blue-50 text-blue-950";
      wrapperClass = "bg-white text-blue-950 border-blue-100";
      break;
    case 'expresse':
      bgClass = "bg-red-50 text-red-950";
      wrapperClass = "bg-white text-red-950 border-red-100";
      break;
    case 'été':
      bgClass = "bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 text-white";
      wrapperClass = "bg-white/20 backdrop-blur-xl border-white/30 text-white";
      break;
    case 'show':
      bgClass = "bg-zinc-950 text-white";
      wrapperClass = "bg-zinc-900 text-white border-purple-500/30";
      break;
    case 'shadow':
      bgClass = "bg-[#050505] text-gray-300";
      wrapperClass = "bg-[#0A0A0A] text-gray-300 shadow-[inset_0_0_50px_rgba(255,255,255,0.02)] border-gray-800/50";
      break;
    case 'ambiance':
      bgClass = "bg-gradient-to-tr from-orange-900 via-amber-900 to-black text-amber-50";
      wrapperClass = "bg-black/40 backdrop-blur-xl text-amber-50 border-amber-900/50";
      break;
    case 'music':
      bgClass = "bg-indigo-950 text-indigo-50";
      wrapperClass = "bg-indigo-900/40 backdrop-blur-xl text-indigo-50 border-indigo-500/30";
      break;
    case 'custom':
      const c = formData.custom_appearance;
      bgClass = c?.bg_type === 'gradient' ? c.bg_value : "bg-transparent";
      wrapperClass = c?.button_style === 'glass' ? "bg-white/10 backdrop-blur-xl border border-white/20" : "bg-white/80 border-gray-200";
      break;
  }
  const [links, setLinks] = useState<any[]>(initialBioLink?.links || [])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const bannerFileRef = useRef<HTMLInputElement>(null)
  const customBgFileRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  
  // Cropper states
  const [cropFileSrc, setCropFileSrc] = useState<string | null>(null)
  const [cropType, setCropType] = useState<'avatar_url' | 'banner_url' | 'custom_bg' | null>(null)
  const [openEmojiId, setOpenEmojiId] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>, 
    field: 'avatar_url' | 'banner_url' | 'custom_bg'
  ) => {
    e.preventDefault()
    let file: File | null = null
    if ('dataTransfer' in e) {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) file = e.dataTransfer.files[0]
    } else {
      if (e.target.files && e.target.files.length > 0) file = e.target.files[0]
    }
    
    if (!file) return

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      toast.error('Veuillez uploader une image valide (JPG, PNG, WebP).')
      setMessage({ text: 'Veuillez uploader une image valide.', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropFileSrc(reader.result as string)
      setCropType(field)
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = async (file: File, field: 'avatar_url' | 'banner_url' | 'custom_bg') => {
    setCropFileSrc(null)
    setCropType(null)

    if (field === 'avatar_url') setUploadingAvatar(true)
    else if (field === 'banner_url') setUploadingBanner(true)
    else setUploadingBg(true)

    const ext = file.name.split('.').pop()
    const path = `products/biolinks/${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    try {
      const { error } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: false })

      if (error) {
        toast.error(`Erreur d'upload: ${error.message}`)
        setMessage({ text: `Erreur d'upload: ${error.message}`, type: 'error' })
      } else {
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path)
        if (field === 'custom_bg') {
          setFormData(prev => ({ ...prev, custom_appearance: { ...prev.custom_appearance, bg_value: urlData.publicUrl } }))
        } else {
          setFormData(prev => ({ ...prev, [field]: urlData.publicUrl }))
        }
        toast.success(`Image ${field === 'avatar_url' ? 'de profil' : field === 'banner_url' ? 'de couverture' : 'de fond'} uploadée !`)
        setMessage({ text: 'Image uploadée avec succès ! N\'oubliez pas de Sauvegarder.', type: 'success' })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erreur inattendue lors de l\'envoi.')
      setMessage({ text: 'Erreur inattendue.', type: 'error' })
    } finally {
      if (field === 'avatar_url') setUploadingAvatar(false)
      else if (field === 'banner_url') setUploadingBanner(false)
      else setUploadingBg(false)
    }
  }

  const addLink = () => {
    setLinks([...links, { id: Math.random().toString(), title: '', url: '', icon: '', isPrimary: false, animation: 'none', isActive: true }])
  }

  const updateLink = (index: number, key: string, value: any) => {
    const newLinks = [...links]
    newLinks[index][key] = value
    setLinks(newLinks)
  }

  const removeLink = (index: number) => {
    const newLinks = [...links]
    newLinks.splice(index, 1)
    setLinks(newLinks)
  }

  const handleSave = () => {
    startTransition(async () => {
      setMessage({ text: '', type: '' })
      if (!formData.title.trim() && !formData.slug.trim()) {
         // On laisse passer
      }

      const res = await saveBioLink(userId, {
        ...formData,
        links
      })

      if (res.success) {
        import('sweetalert2').then(Swal => Swal.default.fire({
            icon: 'success',
            title: 'Sauvegardé !',
            text: 'Votre configuration Link-in-bio a bien été mise à jour.',
            confirmButtonText: 'Super !',
            confirmButtonColor: '#0F7A60',
        }))
        setFormData((prev) => ({ ...prev, slug: res.data?.slug }))
      } else {
        setMessage({ text: res.error || 'Erreur inconnue', type: 'error' })
        toast.error(res.error || 'Erreur lors de la sauvegarde.')
      }
    })
  }

  const protocol = domain.includes('localhost') ? 'http://' : 'https://'
  const publicUrl = `${protocol}${domain}/bio/${formData.slug}`

  // Calcule la bonne couleur de texte depuis la couleur de marque (clair ou sombre)
  const isLight = (hex: string) => {
    const color = hex.charAt(0) === '#' ? hex.substring(1, 7) : hex;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
      if (col <= 0.03928) return col / 12.92;
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.179;
  };
  const ctaTextColor = isLight(formData.brand_color) ? '#000000' : '#FFFFFF';
  let customBgStyle = ''
  if (formData.theme === 'custom') {
    if (formData.custom_appearance?.bg_type === 'color') {
       customBgStyle = `.custom-editor-bg { background-color: ${formData.custom_appearance.bg_value} !important; }`
    } else if (formData.custom_appearance?.bg_type === 'image') {
       customBgStyle = `.custom-editor-bg { background-image: url('${formData.custom_appearance.bg_value}') !important; background-size: cover !important; background-position: center !important; }`
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A]">Votre Link-in-Bio</h3>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 mt-1">
              <ExternalLink size={14} /> {publicUrl}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: formData.title || 'Mon Link-in-Bio',
                    url: publicUrl
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(publicUrl);
                  toast.success('Lien copié dans le presse-papier !');
                }
              }}
              className="flex items-center justify-center p-2.5 bg-[#FAFAF7] hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl transition-all active:scale-95"
              title="Partager"
            >
              <Share2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success('Lien copié dans le presse-papier !');
              }}
              className="flex items-center gap-2 bg-[#FAFAF7] hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
            >
              <Copy size={16} /> Copier
            </button>
          </div>
        </div>

        {onBack && (
          <button 
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center text-sm font-bold text-gray-500 hover:text-[#0F7A60] transition-colors"
          >
            ← Retour à mes pages
          </button>
        )}

        {/* PROFIL CARD */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-[#1A1A1A] mb-6 border-b border-gray-100 pb-4">Profil & Apparence</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-1">Intitulé de la page (Nom du profil)</label>
              <input 
                title="Nom du profil"
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                className="w-full bg-[#FAFAF7] border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none"
                placeholder="Ex: Mon Super Profil"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-1">Couleur de la marque</label>
              <div className="flex items-center gap-3">
                <input 
                  title="Sélecteur de couleur de marque"
                  type="color" 
                  value={formData.brand_color}
                  onChange={(e) => setFormData(prev => ({...prev, brand_color: e.target.value}))}
                  className="h-11 w-14 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                />
                <input 
                  title="Couleur de la marque"
                  type="text" 
                  value={formData.brand_color}
                  onChange={(e) => setFormData(prev => ({...prev, brand_color: e.target.value}))}
                  className="flex-1 bg-[#FAFAF7] border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none uppercase"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-2">Photo de Profil (Avatar)</label>
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileSelect(e, 'avatar_url')}
                onClick={() => avatarFileRef.current?.click()}
                className="w-full h-32 bg-[#FAFAF7] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition hover:border-[#0F7A60]/50 hover:bg-[#0F7A60]/5 group relative overflow-hidden"
              >
                {uploadingAvatar ? (
                  <div className="flex flex-col items-center text-[#0F7A60]">
                     <Loader2 className="animate-spin mb-2" size={24} />
                     <span className="text-sm font-bold">Importation...</span>
                  </div>
                ) : formData.avatar_url ? (
                  <div className="flex flex-col items-center justify-center w-full h-full p-2 relative">
                    <img src={formData.avatar_url} alt="Avatar" className="h-full w-24 object-cover rounded-full shadow-sm ring-4 ring-white" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition uppercase font-black text-white text-xs tracking-widest rounded-xl">Changer</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-[#0F7A60] transition">
                     <UploadCloud size={28} className="mb-2" />
                     <span className="text-sm font-bold text-center">Glissez ou cliquez pour uploader</span>
                     <span className="text-xs font-medium text-gray-400 mt-1">JPG, PNG, WebP (Max 5MB)</span>
                  </div>
                )}
                <input title="Avatar Upload" ref={avatarFileRef} type="file" accept="image/*" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => handleFileSelect(e, 'avatar_url')} />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-2">Image de Couverture (Bannière)</label>
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileSelect(e, 'banner_url')}
                onClick={() => bannerFileRef.current?.click()}
                className="w-full h-40 bg-[#FAFAF7] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition hover:border-[#0F7A60]/50 hover:bg-[#0F7A60]/5 group relative overflow-hidden"
              >
                {uploadingBanner ? (
                  <div className="flex flex-col items-center text-[#0F7A60]">
                     <Loader2 className="animate-spin mb-2" size={28} />
                     <span className="text-sm font-bold">Importation...</span>
                  </div>
                ) : formData.banner_url ? (
                  <div className="flex flex-col items-center w-full h-full relative">
                    <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition uppercase font-black text-white text-xs tracking-widest rounded-xl">Changer</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-[#0F7A60] transition">
                     <ImageIcon size={32} className="mb-2" />
                     <span className="text-sm font-bold text-center">Glissez ou cliquez pour uploader</span>
                     <span className="text-xs font-medium text-gray-400 mt-1">Format paysage conseillé</span>
                  </div>
                )}
                <input title="Banner Upload" ref={bannerFileRef} type="file" accept="image/*" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => handleFileSelect(e, 'banner_url')} />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-1">Lien personnalisé (Slug)</label>
              <div className="flex">
                <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl px-2 sm:px-3 py-3 text-xs sm:text-sm text-gray-500 font-medium shrink-0">
                  {domain}/bio/
                </span>
                <input 
                  title="Lien personnalisé (Slug)"
                  type="text" 
                  value={formData.slug}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase()
                    setFormData(prev => ({...prev, slug: val}))
                  }}
                  className="w-full min-w-0 bg-[#FAFAF7] border border-gray-100 px-3 sm:px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none"
                  placeholder="mon-nom"
                />
                <button
                  type="button"
                  onClick={() => {
                    if(!formData.slug) {
                      toast.error("Veuillez d'abord définir un lien");
                      return;
                    }
                    navigator.clipboard.writeText(publicUrl);
                    toast.success("Lien copié dans le presse-papiers !");
                  }}
                  className="bg-[#0F7A60] hover:bg-[#0B5C48] text-white px-3 sm:px-4 flex items-center justify-center rounded-r-xl transition-colors shrink-0"
                  title="Copier le lien"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-1">Biographie</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
                className="w-full bg-[#FAFAF7] border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none resize-none h-24"
                placeholder="Une courte description de qui vous êtes..."
              />
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <label className="block text-sm font-black text-[#1A1A1A]">Design & Thème de Base</label>
                <div className="flex bg-gray-100 rounded-lg p-0.5 shadow-inner">
                  <button onClick={() => setThemeView('grid')} className={`p-1.5 rounded-md transition-colors ${themeView === 'grid' ? 'bg-white shadow-sm text-[#0F7A60]' : 'text-gray-400 hover:text-gray-600'}`} title="Vue Grille"><Grid2X2 size={16} /></button>
                  <button onClick={() => setThemeView('list')} className={`p-1.5 rounded-md transition-colors ${themeView === 'list' ? 'bg-white shadow-sm text-[#0F7A60]' : 'text-gray-400 hover:text-gray-600'}`} title="Vue Liste"><List size={16} /></button>
                </div>
              </div>
              
              <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                {themeView === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2 w-full">
                    {AVAILABLE_THEMES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setFormData(prev => ({...prev, theme: t.id}))} 
                        className={`group flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${formData.theme === t.id ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className={`w-full h-12 rounded-xl mb-2 flex items-center justify-center shadow-inner border opacity-90 group-hover:opacity-100 transition-opacity ${t.tailwindClass}`}>
                          {formData.theme === t.id ? <CheckCircle2 size={20} className="drop-shadow-md" /> : <Eye size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <span className="text-[11px] font-bold text-gray-700 w-full text-center truncate">{t.icon} {t.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pb-2">
                    {AVAILABLE_THEMES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setFormData(prev => ({...prev, theme: t.id}))} 
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${formData.theme === t.id ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner border ${t.tailwindClass}`}>
                            <span className="text-[10px] opacity-70">A/a</span>
                          </div>
                          <span className="text-[13px] font-bold text-gray-700">{t.icon} {t.name}</span>
                        </div>
                        {formData.theme === t.id && <CheckCircle2 size={16} className="text-[#0F7A60]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {formData.theme === 'custom' && (
              <div className="mt-4 bg-[#FAFAF7] rounded-2xl p-5 border border-[#0F7A60]/20 animate-in fade-in">
                <h4 className="font-black text-sm text-[#0F7A60] mb-4 flex items-center gap-2">
                  <Palette size={16} /> Apparence Customisée Principale
                </h4>
                <div className="space-y-4">
                  {/* Custom BG */}
                  <div>
                    <label className="block text-[12px] font-bold text-gray-500 mb-2">Type d'arrière-plan</label>
                    <div className="flex gap-2">
                      <button onClick={() => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, bg_type: 'color'}}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${formData.custom_appearance.bg_type === 'color' ? 'bg-white border-[#0F7A60] text-[#0F7A60]' : 'border-gray-200 text-gray-400'}`}>Couleur Unie</button>
                      <button onClick={() => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, bg_type: 'gradient'}}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${formData.custom_appearance.bg_type === 'gradient' ? 'bg-white border-[#0F7A60] text-[#0F7A60]' : 'border-gray-200 text-gray-400'}`}>Dégradé (CSS)</button>
                      <button onClick={() => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, bg_type: 'image'}}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${formData.custom_appearance.bg_type === 'image' ? 'bg-white border-[#0F7A60] text-[#0F7A60]' : 'border-gray-200 text-gray-400'}`}>Image (Upload)</button>
                    </div>
                    {formData.custom_appearance.bg_type === 'color' && (
                       <input type="color" title="Couleur" value={formData.custom_appearance.bg_value} onChange={e => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, bg_value: e.target.value}}))} className="mt-2 w-full h-10 p-1 border border-gray-200 rounded-lg cursor-pointer" />
                    )}
                    {formData.custom_appearance.bg_type === 'gradient' && (
                       <select title="Gradient CSS" value={formData.custom_appearance.bg_value} onChange={e => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, bg_value: e.target.value}}))} className="mt-2 w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none">
                         <option value="" disabled>Choisir un dégradé...</option>
                         <option value="bg-gradient-to-tr from-orange-400 to-rose-400">Sunrise (Orange/Rose)</option>
                         <option value="bg-gradient-to-r from-cyan-500 to-blue-500">Ocean (Cyan/Bleu)</option>
                         <option value="bg-gradient-to-tr from-pink-500 to-purple-500">Candy (Rose/Violet)</option>
                         <option value="bg-gradient-to-tr from-emerald-500 to-teal-500">Forest (Émeraude/Bleu canard)</option>
                         <option value="bg-gradient-to-b from-gray-900 to-black">Night (Gris/Noir)</option>
                         <option value="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">Sunset (Indigo/Violet/Rose)</option>
                         <option value="bg-gradient-to-bl from-rose-100 to-teal-100">Soft (Rose pastel/Bleu pastel)</option>
                       </select>
                    )}
                    {formData.custom_appearance.bg_type === 'image' && (
                       <div className="mt-2 w-full">
                         {uploadingBg ? (
                            <div className="flex justify-center items-center h-12 bg-gray-50 border border-gray-200 rounded-lg text-[#0F7A60]">
                               <Loader2 className="animate-spin" size={20} />
                            </div>
                         ) : formData.custom_appearance.bg_value?.startsWith('http') ? (
                            <div className="relative group rounded-lg overflow-hidden border border-gray-200 h-20">
                               <img src={formData.custom_appearance.bg_value} className="w-full h-full object-cover" alt="Custom BG" />
                               <div onClick={() => customBgFileRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition">
                                  <span className="text-white text-xs font-bold">Changer l'image</span>
                               </div>
                            </div>
                         ) : (
                            <button onClick={() => customBgFileRef.current?.click()} className="w-full h-12 flex items-center justify-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-[#0F7A60]/5 hover:text-[#0F7A60] hover:border-[#0F7A60]/50 transition">
                               <UploadCloud size={16} /> Importer une image (WebP/JPG)
                            </button>
                         )}
                         <input title="Custom BG Upload" ref={customBgFileRef} type="file" accept="image/*" className="hidden" onClick={(e) => e.stopPropagation()} onChange={(e) => handleFileSelect(e, 'custom_bg')} />
                       </div>
                    )}
                  </div>
                  
                  {/* Font */}
                  <div>
                     <label className="block text-[12px] font-bold text-gray-500 mb-2">Police (Typographie)</label>
                     <select title="Police" value={formData.custom_appearance.font_family} onChange={e => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, font_family: e.target.value}}))} className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none">
                       <option value="inter">Inter (Moderne & Clean)</option>
                       <option value="playfair">Playfair Display (Luxe/Sérif)</option>
                       <option value="poppins">Poppins (Rond & Amical)</option>
                       <option value="outfit">Outfit (Tech & Bold)</option>
                     </select>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[12px] font-bold text-gray-500 mb-2">Forme des Boutons</label>
                       <select title="Forme" value={formData.custom_appearance.button_shape} onChange={e => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, button_shape: e.target.value}}))} className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none">
                         <option value="rounded-none">Carré (Hard Edge)</option>
                         <option value="rounded-xl">Pilule (Rounded)</option>
                         <option value="rounded-full">Ovale (Full Rounded)</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[12px] font-bold text-gray-500 mb-2">Style des Boutons</label>
                       <select title="Style" value={formData.custom_appearance.button_style} onChange={e => setFormData(p => ({...p, custom_appearance: {...p.custom_appearance, button_style: e.target.value}}))} className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none">
                         <option value="solid">Couleur Pleine</option>
                         <option value="outline">Contour Minimaliste</option>
                         <option value="glass">Glassmorphism (Tansparent)</option>
                       </select>
                     </div>
                  </div>
                  
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LIENS CARD */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-black text-[#1A1A1A]">Mes Liens</h3>
            <button 
              onClick={addLink}
              className="flex items-center gap-1.5 bg-[#0F7A60]/10 text-[#0F7A60] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#0F7A60] hover:text-white transition-colors"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
          
          <div className="space-y-4">
            {links.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Link2 className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">Aucun lien ajouté.</p>
              </div>
            ) : (
              links.map((link, index) => (
                <div key={link.id} className={`group relative border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 transition-all hover:shadow-md ${link.isPrimary ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-[#FAFAF7]'}`}>
                  <div className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing self-start">
                    <GripVertical size={20} />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-16 shrink-0 relative">
                        <button 
                          title="Icône"
                          type="button" 
                          onClick={() => setOpenEmojiId(openEmojiId === link.id ? null : link.id)}
                          className="w-full bg-white border border-gray-200 rounded-lg h-[38px] flex items-center justify-center text-lg hover:bg-gray-50 focus:ring-2 focus:ring-[#0F7A60]/20 outline-none"
                        >
                          {link.icon || '😌'}
                        </button>
                        {openEmojiId === link.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenEmojiId(null)} />
                            <div className="absolute top-12 left-0 z-50 shadow-2xl rounded-lg">
                              <EmojiPicker 
                                onEmojiClick={(emojiData) => {
                                  updateLink(index, 'icon', emojiData.emoji)
                                  setOpenEmojiId(null)
                                }}
                                width={280}
                                height={380}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          title="Titre du lien"
                          type="text" 
                          value={link.title}
                          onChange={(e) => updateLink(index, 'title', e.target.value)}
                          placeholder="Titre du lien"
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#0F7A60]/20 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <input 
                        title="URL du lien"
                        type="url" 
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        placeholder="URL (https://...)"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                       <div className="flex flex-col flex-1">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fond personnalisé</label>
                         <div className="flex">
                           <input type="color" title="Couleur de fond" value={link.bgColor || '#ffffff'} onChange={(e) => updateLink(index, 'bgColor', e.target.value)} className="h-8 w-10 border-0 p-0 rounded-l-md cursor-pointer shrink-0" />
                           <input type="text" value={link.bgColor || ''} onChange={(e) => updateLink(index, 'bgColor', e.target.value)} placeholder="Défaut" className="flex-1 border border-gray-200 border-l-0 rounded-r-md px-2 text-xs font-medium focus:outline-none" />
                         </div>
                       </div>
                       <div className="flex flex-col flex-1">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Texte / Icône</label>
                         <div className="flex">
                           <input type="color" title="Couleur du texte" value={link.textColor || '#000000'} onChange={(e) => updateLink(index, 'textColor', e.target.value)} className="h-8 w-10 border-0 p-0 rounded-l-md cursor-pointer shrink-0" />
                           <input type="text" value={link.textColor || ''} onChange={(e) => updateLink(index, 'textColor', e.target.value)} placeholder="Défaut" className="flex-1 border border-gray-200 border-l-0 rounded-r-md px-2 text-xs font-medium focus:outline-none" />
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                       <div className="flex flex-col flex-1">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Forme Personnalisée</label>
                         <select
                           title="Forme du bouton locale"
                           value={link.buttonShape || 'default'}
                           onChange={(e) => updateLink(index, 'buttonShape', e.target.value === 'default' ? '' : e.target.value)}
                           className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none"
                         >
                           <option value="default">Par défaut (Thème)</option>
                           <option value="rounded-none">Carré</option>
                           <option value="rounded-xl">Pilule</option>
                           <option value="rounded-full">Ovale</option>
                         </select>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 mt-1">
                       <div className="flex items-center gap-2">
                         <input 
                           title="Mettre en avant"
                           type="checkbox" 
                           id={`primary-${index}`}
                           checked={link.isPrimary || false}
                           onChange={(e) => updateLink(index, 'isPrimary', e.target.checked)}
                           className="rounded text-[#0F7A60] focus:ring-[#0F7A60]"
                         />
                         <label htmlFor={`primary-${index}`} className="text-xs font-bold text-gray-500 cursor-pointer select-none">
                           Mettre en avant
                         </label>
                       </div>
                       
                       <select
                         title="Animation"
                         value={link.animation || 'none'}
                         onChange={(e) => updateLink(index, 'animation', e.target.value)}
                         className="bg-transparent text-xs font-bold text-gray-500 cursor-pointer outline-none border-b border-gray-200 pb-0.5"
                       >
                         <option value="none">Sans animation</option>
                         <option value="pulse">Pulse (Battement)</option>
                         <option value="bounce">Bounce (Rebond)</option>
                       </select>
                    </div>
                  </div>
                  
                  <button 
                    title="Supprimer le lien"
                    onClick={() => removeLink(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg h-fit transition-colors shrink-0 self-end sm:self-start mt-4 sm:mt-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODULES PREMIUM */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 mt-6 box-border">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-black text-[#1A1A1A]">Modules Additionnels</h3>
            <span className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs uppercase font-black px-2 py-0.5 rounded-full tracking-wider">Premium</span>
          </div>

          <div className="space-y-6">
            {/* Newsletter */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${formData.newsletter_active ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-[#FAFAF7]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">Capture d'Emails (Newsletter)</h4>
                  <p className="text-xs text-gray-500 font-medium">Récoltez les contacts de vos visiteurs directement.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" title="Capture email" checked={formData.newsletter_active} onChange={(e) => setFormData(prev => ({...prev, newsletter_active: e.target.checked}))} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
                </label>
              </div>
              {formData.newsletter_active && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-[13px] font-bold text-gray-400 mb-1">Texte d'accroche</label>
                  <input type="text" value={formData.newsletter_text} onChange={(e) => setFormData(prev => ({...prev, newsletter_text: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none" placeholder="Abonnez-vous à ma newsletter" />
                </div>
              )}
            </div>

            {/* Pourboire */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${formData.tip_active ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-[#FAFAF7]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">Bouton Pourboire (☕️)</h4>
                  <p className="text-xs text-gray-500 font-medium">Laissez vos fans vous soutenir financièrement.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" title="Pourboire" checked={formData.tip_active} onChange={(e) => setFormData(prev => ({...prev, tip_active: e.target.checked}))} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
                </label>
              </div>
              {formData.tip_active && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-[13px] font-bold text-gray-400 mb-1">Texte du bouton</label>
                  <input type="text" value={formData.tip_text} onChange={(e) => setFormData(prev => ({...prev, tip_text: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none" placeholder="Offrez-moi un café ☕️" />
                </div>
              )}
            </div>

            {/* Click to Call */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${formData.phone_active ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-[#FAFAF7]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">Appel Direct (Click-to-Call)</h4>
                  <p className="text-xs text-gray-500 font-medium">Permettez aux clients de vous appeler en 1 clic.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" title="Click to call" checked={formData.phone_active} onChange={(e) => setFormData(prev => ({...prev, phone_active: e.target.checked}))} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
                </label>
              </div>
              {formData.phone_active && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-400 mb-1">Numéro de téléphone</label>
                    <input type="tel" value={formData.phone_number} onChange={(e) => setFormData(prev => ({...prev, phone_number: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none" placeholder="+221 XX XXX XX XX" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-400 mb-1">Texte du bouton</label>
                    <input type="text" value={formData.phone_text} onChange={(e) => setFormData(prev => ({...prev, phone_text: e.target.value}))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none" placeholder="Appeler Maintenant 📞" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex items-center justify-between mt-6 sticky bottom-4">
          <div className="flex-1 px-2">
            {message.text && (
              <span className={`text-sm font-medium flex items-center gap-1.5 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {message.type === 'success' && <CheckCircle2 size={16} />}
                {message.text}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-[#0F7A60] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0B5C48] transition-all disabled:opacity-50"
          >
            {isPending ? 'Sauvegarde...' : 'Sauvegarder'} <Save size={18} />
          </button>
        </div>
      </div>

      {/* Preview Column */}
      <div className="hidden lg:block w-[360px] shrink-0">
        <div className="sticky top-24 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-500 text-sm">Aperçu en direct</h3>
            {formData.slug && (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="text-[#0F7A60] hover:underline flex items-center gap-1 text-xs font-bold">
                Voir <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="mt-4 w-full">
            <MobileSimulator title="Rendu public">
              {customBgStyle && <style>{customBgStyle}</style>}
              <div 
                className={`w-full flex flex-col items-center min-h-[600px] text-center ${wrapperClass} ${formData.theme === 'custom' ? ('font-' + (formData.custom_appearance?.font_family || 'inter') + ' custom-editor-bg') : ''}`}
              >
                {/* Banner */}
                {formData.banner_url ? (
                  <>
                    <style>{`.bio-banner { background-image: url('${formData.banner_url}') }`}</style>
                    <div className="w-full h-32 bg-cover bg-center bio-banner"></div>
                  </>
                ) : (
                  <>
                    <style>{`.bio-banner-color { background-color: ${formData.brand_color}; opacity: 0.8; }`}</style>
                    <div className="w-full h-24 bio-banner-color"></div>
                  </>
                )}
                {/* Sticky Profile Header */}
                <div className={`sticky top-0 z-20 w-full flex flex-col items-center px-6 pt-1 pb-3 backdrop-blur-xl shadow-sm ${
                   isDarkTheme ? 'bg-black/40 border-b border-gray-800/50' : 
                   isGlassTheme ? 'bg-white/10 border-b border-white/20' : 
                   'bg-white/80 border-b border-gray-100'
                }`}>
                  <div className={`w-20 h-20 rounded-full -mt-10 mb-2 flex items-center justify-center text-2xl font-black shadow-lg shrink-0 overflow-hidden transition-all duration-300 ${
                    isDarkTheme ? 'bg-gray-800 border-4 border-black text-white' :
                    isGlassTheme ? 'bg-white/20 backdrop-blur-md border-2 border-white/30 text-white' :
                    'bg-white border-4 border-gray-50 text-current'
                  }`}>
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      formData.title ? formData.title.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  
                  <h2 className="text-lg font-black">{formData.title || 'Mon Titre'}</h2>
                </div>
                
                <div className="px-6 flex flex-col items-center w-full">
                  <p className={`text-[13px] font-medium mb-8 mt-3 whitespace-pre-wrap ${
                    isDarkTheme ? 'text-gray-400' :
                    isGlassTheme ? 'text-white/80' :
                    'text-gray-500'
                  }`}>
                    {formData.bio || 'Votre biographie apparaitra ici.'}
                  </p>
                  
                  <div className="w-full space-y-3 pb-10">
                    {links.map((link) => {
                      const shapeClass = link.buttonShape && link.buttonShape !== 'default' ? link.buttonShape : formData.theme === 'custom' ? formData.custom_appearance?.button_shape : 'rounded-2xl';
                      const animClass = link.animation === 'pulse' ? 'animate-pulse' : link.animation === 'bounce' ? 'animate-bounce' : '';
                      
                      return (
                        <div key={link.id} className="w-full">
                          <a 
                            href={link.url || '#'} 
                            ref={(el) => {
                              if (el) {
                                const bg = link.isPrimary 
                                  ? (link.bgColor || (isGlassTheme ? 'rgba(255, 255, 255, 0.95)' : formData.brand_color))
                                  : (link.bgColor || (isDarkTheme ? '#2A2A2A' : isGlassTheme ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF'))
                                const color = link.isPrimary
                                  ? (link.textColor || (isGlassTheme ? formData.brand_color : '#FFFFFF'))
                                  : (link.textColor || (isDarkTheme || isGlassTheme ? '#FFFFFF' : '#000000'))
                                const border = link.isPrimary
                                  ? (link.bgColor ? 'none' : (isGlassTheme ? '1px solid rgba(255, 255, 255, 1)' : 'transparent'))
                                  : (link.bgColor ? 'none' : (isGlassTheme ? '1px solid rgba(255, 255, 255, 0.2)' : isLightTheme ? '1px solid #E5E7EB' : 'none'))
                                
                                // Custom theme button style override
                                if (formData.theme === 'custom' && !link.bgColor) {
                                   if (formData.custom_appearance?.button_style === 'outline') {
                                     el.style.backgroundColor = 'transparent';
                                     el.style.border = `1px solid ${formData.brand_color}`;
                                     el.style.color = formData.brand_color;
                                   } else if (formData.custom_appearance?.button_style === 'glass') {
                                     el.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                     el.style.border = '1px solid rgba(255,255,255,0.2)';
                                     el.style.backdropFilter = 'blur(10px)';
                                   } else {
                                      el.style.backgroundColor = bg;
                                      el.style.color = color;
                                      el.style.border = border;
                                   }
                                } else {
                                   el.style.backgroundColor = bg;
                                   el.style.color = color;
                                   el.style.border = border;
                                }
                              }
                            }}
                            className={`w-full py-4 px-4 shadow-sm hover:shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold text-sm text-center flex items-center justify-center gap-2 ${shapeClass} ${
                              link.isPrimary ? 'shadow-lg' : ''
                            } ${animClass}`}
                          >
                            {link.icon && <span>{link.icon}</span>}
                            {link.title || 'Nouveau Lien'}
                          </a>
                        </div>
                      )
                    })}
                    {formData.newsletter_active && (
                      <div className={`w-full p-4 rounded-2xl text-left shadow-sm mt-4 backdrop-blur-md ${isDarkTheme ? 'bg-black/20 border border-white/5' : isGlassTheme ? 'bg-white/10 border border-white/10' : 'bg-white border border-gray-100'}`}>
                        <h4 className="font-bold text-sm mb-2">{formData.newsletter_text}</h4>
                        <div className="flex gap-2">
                          <input type="email" title="Email" placeholder="Votre email" className={`flex-1 border-none rounded-xl text-xs px-3 focus:ring-0 min-w-0 ${formData.theme === 'dark' ? 'bg-gray-800 text-white' : formData.theme === 'glass' ? 'bg-white/20 text-white placeholder-white/50' : 'bg-gray-50 text-gray-900'}`} disabled />
                          <style>{`.btn-valider { background-color: ${formData.brand_color}; color: ${ctaTextColor}; }`}</style>
                          <button className="text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm btn-valider shrink-0">Valider</button>
                        </div>
                      </div>
                    )}
                    {formData.phone_active && formData.phone_number && (
                      <button className={`w-full py-3.5 px-4 rounded-2xl border shadow-sm font-bold text-sm flex items-center justify-center gap-2 transition hover:scale-[1.03] active:scale-95 mt-4 ${formData.theme === 'dark' ? 'bg-[#2A2A2A] border-gray-700 text-blue-500' : formData.theme === 'glass' ? 'bg-white/10 backdrop-blur-md border-white/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                        {formData.phone_text || 'Appeler Maintenant 📞'}
                      </button>
                    )}
                    {formData.tip_active && (
                      <button className={`w-full py-3.5 px-4 rounded-2xl border shadow-sm font-bold text-sm flex items-center justify-center gap-2 transition hover:scale-[1.03] active:scale-95 mt-4 ${formData.theme === 'dark' ? 'bg-[#2A2A2A] border-gray-700 text-yellow-500' : formData.theme === 'glass' ? 'bg-white/10 backdrop-blur-md border-white/20 text-yellow-300' : 'bg-[#FAFAF7] border-gray-200 text-yellow-600'}`}>
                        {formData.tip_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </MobileSimulator>
          </div>
        </div>
      </div>
      <ImageCropperModal
        isOpen={Boolean(cropFileSrc && cropType)}
        imageSrc={cropFileSrc}
        onClose={() => {
          setCropFileSrc(null)
          setCropType(null)
        }}
        aspectRatio={cropType === 'avatar_url' ? 1 : cropType === 'custom_bg' ? 9/16 : 3/1}
        onCropComplete={(file) => {
          if (cropType) {
            handleFileUpload(file, cropType)
          }
        }}
      />
    </div>
  )
}
