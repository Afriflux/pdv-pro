'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Loader2, Users, PenTool, Send, Type, Image as ImageIcon, Link2, AlignLeft, Eye, Edit3, MessageSquare, Upload } from 'lucide-react'
import { toast } from '@/lib/toast'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CreateManualCampaignModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  
  // ── Métadonnées ──
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  
  // ── Sections du mail ──
  const [bannerUrl, setBannerUrl] = useState('')
  const [greeting, setGreeting] = useState('Salam / Bonjour 👋')
  const [bodyContent, setBodyContent] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('https://yayyam.com')
  const [signatureName, setSignatureName] = useState("L'équipe Yayyam")
  const [signatureTagline, setSignatureTagline] = useState("La plateforme e-commerce pensée pour l'Afrique 🌍")
  
  // ── UI State ──
  const [targetLists, setTargetLists] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [brevoLists, setBrevoLists] = useState<{id: number, name: string, totalSubscribers: number}[]>([])
  const [loadingLists, setLoadingLists] = useState(false)

  // Charger les vraies listes Brevo à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    setLoadingLists(true)
    fetch('/api/admin/email/lists')
      .then(r => r.json())
      .then(data => {
        if (data.lists && data.lists.length > 0) {
          setBrevoLists(data.lists)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLists(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleToggleList = (listId: number) => {
    setTargetLists(prev => 
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    )
  }

  // ── Upload bannière vers Supabase Storage ──
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, WebP...)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 Mo)')
      return
    }

    setIsUploading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const ext = file.name.split('.').pop() || 'jpg'
      const path = `email-banners/${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setBannerUrl(urlData.publicUrl)
      toast.success('Image importée avec succès !')
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error('Erreur lors de l\'import : ' + (err.message || 'Réessayez'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Assemblage du contenu HTML structuré ──
  const buildHtmlContent = () => {
    let html = ''

    // Bannière
    if (bannerUrl.trim()) {
      html += `<div style="text-align:center; margin-bottom:28px;"><img src="${bannerUrl.trim()}" alt="Bannière" style="max-width:100%; height:auto; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" /></div>\n`
    }

    // Salutation
    if (greeting.trim()) {
      html += `<p style="font-size:18px; font-weight:700; color:#1F2937; margin:0 0 20px;">${greeting.trim()}</p>\n`
    }

    // Corps
    if (bodyContent.trim()) {
      html += bodyContent.trim()
    }

    // CTA
    if (ctaText.trim() && ctaUrl.trim()) {
      html += `\n<div style="text-align:center; margin:36px 0 16px;"><a href="${ctaUrl.trim()}" style="display:inline-block; background-color:#0F7A60; color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; padding:14px 36px; border-radius:12px; letter-spacing:0.5px; box-shadow:0 4px 14px rgba(15,122,96,0.3);">${ctaText.trim()}</a></div>`
    }

    return html
  }

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim() || !bodyContent.trim()) {
      toast.error('Veuillez remplir le nom, le sujet et le contenu principal.')
      return
    }

    setIsSubmitting(true)
    try {
      const htmlContent = buildHtmlContent()
      
      const res = await fetch('/api/admin/email/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, htmlContent, targetLists })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message)
      // Reset
      setName(''); setSubject(''); setBannerUrl('')
      setGreeting('Salam / Bonjour 👋'); setBodyContent('')
      setCtaText(''); setCtaUrl('https://yayyam.com')
      setTargetLists([])
      router.refresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur de création de la campagne")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Preview HTML simulé ──
  const buildPreviewHtml = () => {
    const year = new Date().getFullYear()
    return `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; width:100%;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F0F2F5;">
          <tr>
            <td align="center" style="padding: 32px 16px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:24px; box-shadow:0 10px 25px rgba(0,0,0,0.05); overflow:hidden;">
                
                <!-- Header Premium -->
                <tr>
                  <td style="background: linear-gradient(135deg, #012928 0%, #0A4138 100%); padding: 40px 40px 32px; text-align: center;">
                    <h1 style="margin:0; font-size:32px; font-weight:900; color:#FFFFFF; letter-spacing:-1px;">
                      Yayyam<span style="color:#34D399;">.</span>
                    </h1>
                    <p style="margin:8px 0 0; font-size:12px; color:#6EE7B7; font-weight:700; text-transform:uppercase; letter-spacing:3px;">
                      E-Commerce &middot; Afrique
                    </p>
                  </td>
                </tr>

                <!-- Bandeau Sujet -->
                <tr>
                  <td style="background-color:#0F7A60; padding:16px 40px; text-align:center;">
                    <p style="margin:0; font-size:14px; font-weight:700; color:#FFFFFF; letter-spacing:0.5px;">
                      ${subject || 'Sujet de votre email'}
                    </p>
                  </td>
                </tr>

                <!-- Contenu Principal -->
                <tr>
                  <td style="padding: 44px 40px 36px; color:#1F2937; font-size:15px; line-height:1.75;">
                    ${bannerUrl ? `<div style="text-align:center; margin-bottom:28px;"><img src="${bannerUrl}" alt="Bannière" style="max-width:100%; height:auto; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" /></div>` : ''}
                    ${greeting ? `<p style="font-size:18px; font-weight:700; color:#1F2937; margin:0 0 20px;">${greeting}</p>` : ''}
                    <div style="white-space:pre-wrap;">${bodyContent || '<span style="color:#9CA3AF;font-style:italic;">Votre contenu apparaîtra ici...</span>'}</div>
                    ${ctaText ? `<div style="text-align:center; margin:36px 0 16px;"><a href="#" onClick="return false;" style="display:inline-block; background-color:#0F7A60; color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; padding:14px 36px; border-radius:12px; font-family:'Helvetica',sans-serif; letter-spacing:0.5px; box-shadow:0 4px 14px rgba(15,122,96,0.3);">${ctaText}</a></div>` : ''}
                  </td>
                </tr>

                <!-- Séparateur -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px; background: linear-gradient(90deg, transparent, #E5E7EB, transparent);"></div>
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding: 28px 40px 36px;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:4px; max-width:4px; background-color:#0F7A60; border-radius:4px;" valign="top"></td>
                        <td style="padding-left:16px;">
                          <p style="margin:0; font-size:15px; font-weight:700; color:#1F2937;">
                            ${signatureName}
                          </p>
                          <p style="margin:4px 0 0; font-size:13px; color:#6B7280; font-weight:500;">
                            ${signatureTagline}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Bande Réseaux Sociaux -->
                <tr>
                  <td style="background-color:#FAFAF7; padding:24px 40px; text-align:center; border-top:1px solid #F3F4F6;">
                    <p style="margin:0 0 12px; font-size:11px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:2px;">
                      Suivez-nous
                    </p>
                    <p style="margin:0; font-size:22px; line-height:1;">📸 &nbsp; 🎵 &nbsp; 📘 &nbsp; 💬</p>
                  </td>
                </tr>

                <!-- Footer Légal -->
                <tr>
                  <td style="background-color:#012928; padding:28px 40px; text-align:center;">
                    <p style="margin:0; font-size:12px; color:#6EE7B7; font-weight:600;">© ${year} Yayyam — Tous droits réservés.</p>
                    <p style="margin:6px 0 0; font-size:11px; color:#34D399;">Dakar, Sénégal 🇸🇳</p>
                    <p style="margin:16px 0 0;"><a href="#" style="color:#FFF; text-decoration:underline; font-size:11px; font-weight:600;">Se désabonner</a> <span style="color:#0F7A60; margin:0 8px;">|</span> <a href="#" style="color:#FFF; text-decoration:underline; font-size:11px; font-weight:600;">Politique de confidentialité</a></p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </div>
    `
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 bg-white/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#012928] to-[#0A4138] flex items-center justify-center text-white shadow-md">
                <PenTool className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-black text-gray-900 text-lg leading-tight">Composer une Campagne</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Éditeur visuel par sections</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Edit/Preview */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveView('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Éditer
              </button>
              <button
                onClick={() => setActiveView('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Eye className="w-3.5 h-3.5" /> Aperçu
              </button>
            </div>
            <button 
              onClick={onClose}
              title="Fermer"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeView === 'edit' ? (
            <div className="p-6 flex flex-col gap-5">

              {/* ── Métadonnées ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Nom interne</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lancement Ambassadeurs Avril"
                    className="w-full bg-[#FAFAF7] border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 ">
                    <Type className="w-3.5 h-3.5 text-emerald-600" /> Sujet de l'email
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: 🚀 Yayyam : Découvrez nos fonctionnalités"
                    className="w-full bg-[#FAFAF7] border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* ── Section 1 : Bannière ── */}
              <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-5 rounded-2xl border border-indigo-100/50">
                <label className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Bannière visuelle <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">(optionnel)</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="Collez un lien image ou importez ci-contre →"
                    className="flex-1 bg-white border-2 border-indigo-100 rounded-xl p-3 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/10 outline-none transition-all"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    title="Importer une bannière"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 shrink-0"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Import...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Importer</>
                    )}
                  </button>
                </div>
                {bannerUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-indigo-100 max-h-48 relative group">
                    <img src={bannerUrl} alt="Aperçu de la bannière email" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    <button
                      onClick={() => setBannerUrl('')}
                      title="Supprimer la bannière"
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Section 2 : Salutation ── */}
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50">
                <label className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Salutation
                </label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Ex: Salam / Bonjour 👋"
                  className="w-full bg-white border-2 border-amber-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/10 outline-none transition-all"
                />
              </div>

              {/* ── Section 3 : Corps du message ── */}
              <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                <label className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Contenu principal <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder={"Rédigez le corps de votre email ici.\n\nVous pouvez utiliser du texte simple ou du HTML basique.\nLes retours à la ligne sont automatiquement convertis."}
                  className="w-full bg-white border-2 border-emerald-100 rounded-xl p-4 text-sm focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]/10 outline-none transition-all resize-y min-h-[180px]"
                />
              </div>

              {/* ── Section 4 : Bouton CTA ── */}
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                <label className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Bouton d'action (CTA) <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">(optionnel)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ex: Devenir Ambassadeur →"
                    className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/10 outline-none transition-all"
                  />
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://yayyam.com/client/ambassadeur"
                    className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 text-sm font-medium text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/10 outline-none transition-all"
                  />
                </div>
                {ctaText && (
                  <div className="mt-3 text-center">
                    <span className="inline-block bg-[#0F7A60] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md">{ctaText}</span>
                  </div>
                )}
              </div>

              {/* ── Section 5 : Signature ── */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  ✍️ Signature
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="L'équipe Yayyam"
                    className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-gray-300 outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={signatureTagline}
                    onChange={(e) => setSignatureTagline(e.target.value)}
                    placeholder="Slogan ou tagline"
                    className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 text-sm font-medium text-gray-900 focus:border-gray-300 outline-none transition-all"
                  />
                </div>
                {/* Mini preview */}
                <div className="mt-3 flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                  <div className="w-1 min-h-[36px] bg-[#0F7A60] rounded-full shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{signatureName || "L'équipe Yayyam"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{signatureTagline || "La plateforme e-commerce pensée pour l'Afrique 🌍"}</p>
                  </div>
                </div>
              </div>

              {/* ── Listes cibles (dynamiques depuis Brevo) ── */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                   <Users className="w-3.5 h-3.5" /> Destinataires
                </label>
                {loadingLists ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement des listes Brevo...
                  </div>
                ) : brevoLists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {brevoLists.map(list => (
                       <label key={list.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetLists.includes(list.id) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-emerald-100'}`}>
                          <input type="checkbox" className="accent-[#0D5C4A] w-4 h-4 cursor-pointer" checked={targetLists.includes(list.id)} onChange={() => handleToggleList(list.id)} />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{list.name}</span>
                            <span className="text-[11px] text-gray-400 font-medium">ID: {list.id}{list.totalSubscribers > 0 ? ` · ${list.totalSubscribers} contacts` : ''}</span>
                          </div>
                       </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-2">Aucune liste trouvée. Vérifiez votre clé API Brevo.</p>
                )}
              </div>

            </div>
          ) : (
            /* ── PREVIEW (Mac/Mail Client Mockup) ── */
            <div className="p-6 bg-gray-50/50">
              <div className="max-w-[700px] mx-auto flex flex-col mb-8">
                
                {/* Entête type Mac Window */}
                <div className="bg-[#EAEAEA] px-4 py-3 rounded-t-[14px] border border-[#D1D1D1] flex items-center justify-between shadow-sm relative z-10">
                  <div className="flex gap-2 relative z-20">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-gray-500 bg-white/50 px-3 py-1 rounded-md shadow-sm border border-black/5 backdrop-blur-sm truncate max-w-xs">
                      {subject || "Nouveau message"}
                    </span>
                  </div>
                </div>

                {/* UI type Mailbox (Gmail / Apple Mail) */}
                <div className="bg-white border-x border-[#D1D1D1] px-6 py-4 flex items-center gap-4 shadow-sm relative z-10">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0F7A60] to-[#0A4138] flex items-center justify-center text-white font-black text-lg shadow-inner">
                    Y
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-[15px]">Yayyam E-Commerce</span>
                      <span className="text-sm text-gray-400 font-medium hidden sm:inline">&lt;contact@yayyam.com&gt;</span>
                    </div>
                    <div className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <span>À :</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium text-xs">
                        {targetLists.length > 0 ? `${targetLists.length} listes cibles` : 'Destinataires non définis'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium whitespace-nowrap hidden sm:block">
                    Aujourd'hui, 14:00
                  </div>
                </div>

                {/* Contenu visuel HTML rendu */}
                <div className="bg-[#F0F2F5] rounded-b-[14px] border-x border-b border-[#D1D1D1] shadow-2xl overflow-hidden relative">
                  <div dangerouslySetInnerHTML={{ __html: buildPreviewHtml() }} />
                </div>
                
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 sticky bottom-0 z-20 flex justify-between items-center rounded-b-[24px] shrink-0">
          <p className="text-xs font-medium text-gray-400 hidden sm:block">
            Header, signature, réseaux sociaux et footer sont automatiquement ajoutés autour de votre contenu.
          </p>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim() || !subject.trim() || !bodyContent.trim()}
              className="bg-[#012928] hover:bg-[#0A4138] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  Créer la campagne
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
