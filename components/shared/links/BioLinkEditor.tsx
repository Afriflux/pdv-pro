/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, GripVertical, Save, CheckCircle2, ExternalLink, UploadCloud, Loader2, Image as ImageIcon, Link2 } from 'lucide-react'
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
}

export default function BioLinkEditor({ userId, initialBioLink, domain }: BioLinkEditorProps) {
  const [isPending, startTransition] = useTransition()
  
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
  })
  const [links, setLinks] = useState<any[]>(initialBioLink?.links || [])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const avatarFileRef = useRef<HTMLInputElement>(null)
  const bannerFileRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  
  // Cropper states
  const [cropFileSrc, setCropFileSrc] = useState<string | null>(null)
  const [cropType, setCropType] = useState<'avatar_url' | 'banner_url' | null>(null)
  const [openEmojiId, setOpenEmojiId] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>, 
    field: 'avatar_url' | 'banner_url'
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

  const handleFileUpload = async (file: File, field: 'avatar_url' | 'banner_url') => {
    setCropFileSrc(null)
    setCropType(null)

    if (field === 'avatar_url') setUploadingAvatar(true)
    else setUploadingBanner(true)

    const ext = file.name.split('.').pop()
    const path = `products/biolinks/${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    try {
      const { error } = await supabase.storage
        .from('yayyam-products')
        .upload(path, file, { upsert: false })

      if (error) {
        toast.error(`Erreur d'upload: ${error.message}`)
        setMessage({ text: `Erreur d'upload: ${error.message}`, type: 'error' })
      } else {
        const { data: urlData } = supabase.storage.from('yayyam-products').getPublicUrl(path)
        setFormData(prev => ({ ...prev, [field]: urlData.publicUrl }))
        toast.success(`Image ${field === 'avatar_url' ? 'de profil' : 'de couverture'} uploadée !`)
        setMessage({ text: 'Image uploadée avec succès ! N\'oubliez pas de Sauvegarder.', type: 'success' })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erreur inattendue lors de l\'envoi.')
      setMessage({ text: 'Erreur inattendue.', type: 'error' })
    } finally {
      if (field === 'avatar_url') setUploadingAvatar(false)
      else setUploadingBanner(false)
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
        setMessage({ text: 'Votre vitrine a été mise à jour.', type: 'success' })
        setFormData((prev) => ({ ...prev, slug: res.data?.slug }))
      } else {
        setMessage({ text: res.error || 'Erreur inconnue', type: 'error' })
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        {/* PROFIL CARD */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-[#1A1A1A] mb-6 border-b border-gray-100 pb-4">Profil & Apparence</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-1">Nom du profil</label>
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
                <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl px-3 py-3 text-sm text-gray-500 font-medium">
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
                  className="flex-1 bg-[#FAFAF7] border border-gray-100 rounded-r-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F7A60]/20 outline-none"
                  placeholder="mon-nom"
                />
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
            <div>
              <label className="block text-[13px] font-bold text-gray-400 mb-2">Thème de base</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFormData(prev => ({...prev, theme: 'light'}))} 
                  className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold ${formData.theme === 'light' ? 'border-[#0F7A60] bg-[#0F7A60]/5 text-[#0F7A60]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setFormData(prev => ({...prev, theme: 'dark'}))} 
                  className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold ${formData.theme === 'dark' ? 'border-[#0F7A60] bg-[#0F7A60]/5 text-[#0F7A60]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => setFormData(prev => ({...prev, theme: 'glass'}))} 
                  className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-pink-500 text-white ${formData.theme === 'glass' ? 'ring-4 ring-pink-500/30' : 'opacity-70 hover:opacity-100'}`}
                >
                  Glass Premium
                </button>
              </div>
            </div>
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
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fond personnalisé</label>
                         <div className="flex">
                           <input type="color" title="Couleur de fond" value={link.bgColor || '#ffffff'} onChange={(e) => updateLink(index, 'bgColor', e.target.value)} className="h-8 w-10 border-0 p-0 rounded-l-md cursor-pointer shrink-0" />
                           <input type="text" value={link.bgColor || ''} onChange={(e) => updateLink(index, 'bgColor', e.target.value)} placeholder="Défaut" className="flex-1 border border-gray-200 border-l-0 rounded-r-md px-2 text-xs font-medium focus:outline-none" />
                         </div>
                       </div>
                       <div className="flex flex-col flex-1">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Texte / Icône</label>
                         <div className="flex">
                           <input type="color" title="Couleur du texte" value={link.textColor || '#000000'} onChange={(e) => updateLink(index, 'textColor', e.target.value)} className="h-8 w-10 border-0 p-0 rounded-l-md cursor-pointer shrink-0" />
                           <input type="text" value={link.textColor || ''} onChange={(e) => updateLink(index, 'textColor', e.target.value)} placeholder="Défaut" className="flex-1 border border-gray-200 border-l-0 rounded-r-md px-2 text-xs font-medium focus:outline-none" />
                         </div>
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
            <span className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider">Premium</span>
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
              <div className={`w-full flex flex-col items-center min-h-[600px] text-center ${
                formData.theme === 'dark' ? 'bg-[#1A1A1A] text-white' : 
                formData.theme === 'glass' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white' : 
                'bg-gray-50 text-gray-900'
              }`}>
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
                   formData.theme === 'dark' ? 'bg-[#1A1A1A]/80 border-b border-gray-800' : 
                   formData.theme === 'glass' ? 'bg-white/10 border-b border-white/20' : 
                   'bg-gray-50/90 border-b border-gray-200'
                }`}>
                  <div className={`w-20 h-20 rounded-full -mt-10 mb-2 flex items-center justify-center text-2xl font-black shadow-lg shrink-0 overflow-hidden transition-all duration-300 ${
                    formData.theme === 'dark' ? 'bg-gray-800 border-4 border-[#1A1A1A] text-white' :
                    formData.theme === 'glass' ? 'bg-white/20 backdrop-blur-md border-2 border-white/30 text-white' :
                    'bg-white border-4 border-gray-50 text-[#0F7A60]'
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
                    formData.theme === 'dark' ? 'text-gray-400' :
                    formData.theme === 'glass' ? 'text-white/80' :
                    'text-gray-500'
                  }`}>
                    {formData.bio || 'Votre biographie apparaitra ici.'}
                  </p>
                  
                  <div className="w-full space-y-3 pb-10">
                    {links.map((link) => (
                      <div key={link.id} className="w-full">
                        <a 
                          href={link.url || '#'} 
                          className={`w-full rounded-2xl py-4 px-4 shadow-sm hover:shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold text-sm text-center flex items-center justify-center gap-2 ${
                            link.isPrimary ? 'shadow-lg' : ''
                          } ${link.animation === 'pulse' ? 'animate-pulse' : link.animation === 'bounce' ? 'animate-bounce' : ''}`}
                          style={{
                            ...(link.isPrimary ? {
                              backgroundColor: link.bgColor ? link.bgColor : (formData.theme === 'glass' ? 'rgba(255, 255, 255, 0.95)' : formData.brand_color),
                              color: link.textColor ? link.textColor : (formData.theme === 'glass' ? formData.brand_color : ctaTextColor),
                              border: link.bgColor ? 'none' : (formData.theme === 'glass' ? '1px solid rgba(255, 255, 255, 1)' : `1px solid ${formData.brand_color}`),
                            } : {
                              backgroundColor: link.bgColor ? link.bgColor : (formData.theme === 'dark' ? '#2A2A2A' : formData.theme === 'glass' ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF'),
                              color: link.textColor ? link.textColor : (formData.theme === 'dark' || formData.theme === 'glass' ? '#FFFFFF' : '#000000'),
                              border: link.bgColor ? 'none' : (formData.theme === 'glass' ? '1px solid rgba(255, 255, 255, 0.3)' : formData.theme === 'light' ? '1px solid #E5E7EB' : 'none'),
                            })
                          }}
                        >
                          {link.icon && <span>{link.icon}</span>}
                          {link.title || 'Nouveau Lien'}
                        </a>
                      </div>
                    ))}
                    {formData.newsletter_active && (
                      <div className={`w-full p-4 rounded-2xl text-left shadow-sm mt-4 backdrop-blur-md ${formData.theme === 'dark' ? 'bg-[#2A2A2A]' : formData.theme === 'glass' ? 'bg-white/10' : 'bg-white border border-gray-100'}`}>
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
        aspectRatio={cropType === 'avatar_url' ? 1 : 3/1}
        onCropComplete={(file) => {
          if (cropType) {
            handleFileUpload(file, cropType)
          }
        }}
      />
    </div>
  )
}
