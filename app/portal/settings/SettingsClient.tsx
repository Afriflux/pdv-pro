'use client'

import { useState } from 'react'
import { User, CreditCard, Lock, Save, CheckCircle2, AlertCircle, Phone, Mail, Camera, Trash2, Globe, Target, AlertTriangle, ScrollText, ShieldCheck } from 'lucide-react'
import { updateAffiliateProfile } from './actions'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AffiliateContractTab } from './tabs/AffiliateContractTab'
import { KycTab } from './tabs/KycTab'


interface SettingsClientProps {
  userProfile: any
  authUser: any
  affiliateId?: string
  telegramChatId?: string
  contractAcceptedAt?: string | null
}

export default function SettingsClient({ userProfile, authUser, affiliateId, telegramChatId, contractAcceptedAt }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'payments' | 'pixels' | 'notifications' | 'security' | 'danger' | 'contract' | 'kyc'>('profile')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(userProfile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const [showDangerModal, setShowDangerModal] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  
  const [professionalPhone, setProfessionalPhone] = useState<string>((userProfile.professional_phone as string) || '')
  
  const supabase = createClient()
  
  const socialJson = (userProfile.social_links as Record<string, string>) || {}

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handlePasswordReset = async () => {
    if (!userProfile.email) return
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.resetPasswordForEmail(userProfile.email as string)
    if (error) {
      setError("Erreur lors de l'envoi de l'email.")
    } else {
      setSuccess("Un email de réinitialisation sécurisé vous a été envoyé.")
      setResetSent(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    
    // In settings action, we can split logic based on the tab
    // For now we use the general one
    try {
      let finalAvatarUrl = avatarPreview;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        finalAvatarUrl = await uploadFile(avatarFile, 'avatars', `${authUser.id}/profile_${Date.now()}.${ext}`)
        formData.append('avatar_url', finalAvatarUrl)
      } else if (!avatarPreview) {
        formData.append('avatar_url', '')
      } else {
        formData.append('avatar_url', avatarPreview)
      }
      formData.set('professional_phone', professionalPhone)

      const result = await updateAffiliateProfile(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Paramètres mis à jour avec succès.')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Une erreur réseau est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full gap-6 lg:gap-8 pb-20 relative z-20 mx-auto">
      
      {/* ── MENU HYBRIDE ── */}
      <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start z-20">
        <div className="w-full overflow-x-auto scrollbar-hide lg:overflow-visible bg-white/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-2 lg:p-0 rounded-2xl lg:rounded-none border border-gray-200/50 lg:border-none shadow-[0_4px_15px_rgba(0,0,0,0.02)] lg:shadow-none">
          <nav className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 min-w-max lg:min-w-0" aria-label="Menu des paramètres affilié">
            <MenuBtn active={activeTab === 'profile'} icon={<User size={16} />} label="Général" onClick={() => { setActiveTab('profile'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'social'} icon={<Globe size={16} />} label="Réseaux" onClick={() => { setActiveTab('social'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'payments'} icon={<CreditCard size={16} />} label="Paiements" onClick={() => { setActiveTab('payments'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'pixels'} icon={<Target size={16} />} label="Tracking" onClick={() => { setActiveTab('pixels'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'notifications'} icon={<AlertCircle size={16} />} label="Alertes" onClick={() => { setActiveTab('notifications'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'security'} icon={<Lock size={16} />} label="Sécurité" onClick={() => { setActiveTab('security'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'kyc'} icon={<ShieldCheck size={16} />} label="KYC" onClick={() => { setActiveTab('kyc'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'contract'} icon={<ScrollText size={16} />} label="Contrat" onClick={() => { setActiveTab('contract'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'danger'} icon={<AlertTriangle size={16} className="text-red-500" />} label="Danger" onClick={() => { setActiveTab('danger'); setError(''); setSuccess('') }} />
          </nav>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="flex-1 w-full max-w-5xl relative z-10">
        
        {/* Messages globaux de succès / erreur */}
        {(success || error) && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in-95 ${success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
             {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
             <span>{success || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full relative">
          
          {/* 🌟 LE GRAND CONTENEUR PROFIL GLASSMORPHISM 🌟 */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
            
            {/* === HEADER / BANNER ABSTRAIT === */}
            <div className="h-48 sm:h-72 w-full relative bg-[#041D14] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0A3D2C] via-[#05261B] to-[#041D14] opacity-90"></div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms]"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0F7A60]/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4"></div>
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay"></div>

              {/* Bouton de sauvegarde global rapide depuis le banner */}
              <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
                <button 
                  type="submit" 
                  disabled={loading || activeTab === 'security'}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(255,255,255,0.1)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? '...' : <Save size={16} />}
                  Enregistrer
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
              
              {/* === AVATAR OVERLAP === */}
              {activeTab === 'profile' && (
                <div className="relative -mt-16 sm:-mt-24 mb-6">
                  <div className="relative group max-w-fit">
                    <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center relative border border-gray-100">
                        {avatarPreview ? (
                          <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={avatarPreview} alt="Avatar" fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <span className="text-gray-300 font-bold flex flex-col items-center justify-center text-4xl">
                            {(userProfile.name as string)?.[0] || 'U'}
                          </span>
                        )}
                        
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer scale-110 group-hover:scale-100">
                          <Camera size={32} className="text-white mb-2" strokeWidth={1.5} />
                          <span className="text-white text-[12px] font-bold tracking-widest uppercase">Modifier</span>
                          <input id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                    
                    {(avatarPreview) && (
                      <button 
                        type="button" 
                        onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-white hover:bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-100 z-20 transition-all hover:scale-110"
                        title="Supprimer la photo"
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'profile' && (
                <div className="pb-8 space-y-2 mt-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    {userProfile.name as string}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                      <CheckCircle2 size={14} /> Affilié Vérifié
                    </span>
                    <span className="text-[14px] text-gray-500 font-medium">Gérez votre identité publique</span>
                  </div>
                </div>
              )}

              {/* === TABS CONTENT === */}
              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-4">

                {/* TAB PROFIL */}
                {activeTab === 'profile' && (
                  <>
                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 transition-all duration-500 group">
                      <div>
                        <div className="w-12 h-12 bg-emerald-50 text-[#0F7A60] rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                          <User size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Nom d'affichage</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Visible par les vendeurs pour identifier vos ventes.</p>
                      </div>
                      <div className="relative mt-auto">
                        <input
                          name="name"
                          type="text"
                          required
                          title="Nom d'affichage"
                          placeholder="Nom complet"
                          aria-label="Nom d'affichage"
                          defaultValue={userProfile.name as string}
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 transition-all duration-500 group">
                      <div>
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-teal-100">
                          <Phone size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Ligne Professionnelle</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Numéro de contact principal facilitant le flux WhatsApp avec vos acheteurs.</p>
                      </div>
                      <div className="relative mt-auto">
                        <PhoneInput value={professionalPhone} onChange={setProfessionalPhone} />
                      </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 transition-all duration-500 group">
                      <div>
                        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-200">
                          <Mail size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Adresse Email Principale</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Liée de façon permanente à votre compte affilié.</p>
                      </div>
                      <div className="relative mt-auto">
                        <input
                          name="email"
                          type="email"
                          readOnly
                          title="Adresse Email"
                          placeholder="votre@email.com"
                          aria-label="Adresse Email"
                          defaultValue={userProfile.email as string}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-[1rem] text-gray-500 font-bold cursor-not-allowed shadow-inner outline-none pr-32"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-1.5 text-xs font-black uppercase text-gray-500 bg-gray-200 px-2.5 py-1.5 rounded-lg border border-gray-300">
                          🔒 Verrouillé
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB PIXELS */}
                {activeTab === 'pixels' && (
                  <>
                    <input type="hidden" name="name" value={userProfile.name as string} />
                    <div className="col-span-1 lg:col-span-2">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Tracking & Pixels</h2>
                       <p className="text-gray-500 font-medium">Suivez les conversions de vos campagnes publicitaires directement depuis vos liens d'affiliation.</p>
                    </div>

                    {/* Meta Pixel */}
                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group">
                      <div>
                        <div className="w-12 h-12 bg-[#1877F2]/10 text-[#1877F2] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                          <Target size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Pixel Meta (Facebook / Instagram)</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">Saisissez l'ID de votre Pixel. Exemple : <span className="font-mono bg-gray-100 px-1 rounded">1234567890</span></p>
                      </div>
                      <div className="relative">
                        <input
                          name="meta_pixel_id"
                          type="text"
                          defaultValue={userProfile.meta_pixel_id as string || ''}
                          placeholder="ID du Pixel Meta"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* TikTok Pixel */}
                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group">
                      <div>
                        <div className="w-12 h-12 bg-black/5 text-black rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                          <Target size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Pixel TikTok</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">Saisissez l'ID de votre Pixel TikTok.</p>
                      </div>
                      <div className="relative">
                        <input
                          name="tiktok_pixel_id"
                          type="text"
                          defaultValue={userProfile.tiktok_pixel_id as string || ''}
                          placeholder="ID du Pixel TikTok"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Google Tag */}
                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group">
                      <div>
                        <div className="w-12 h-12 bg-[#EA4335]/10 text-[#EA4335] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                          <Target size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Google Tag Managers (GTM) / Google Analytics</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">Saisissez l'ID court. Exemple : <span className="font-mono bg-gray-100 px-1 rounded">G-XXXXXXXX</span> ou <span className="font-mono bg-gray-100 px-1 rounded">AW-XXXXXXXX</span></p>
                      </div>
                      <div className="relative">
                        <input
                          name="google_tag_id"
                          type="text"
                          defaultValue={userProfile.google_tag_id as string || ''}
                          placeholder="ID Google Tag"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB RESEAUX SOCIAUX */}
                {activeTab === 'social' && (
                  <>
                    <input type="hidden" name="name" value={userProfile.name as string} />
                    <div className="col-span-1 lg:col-span-2">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Réseaux Sociaux</h2>
                       <p className="text-gray-500 font-medium">Associez vos réseaux sociaux pour renforcer l'authenticité de votre profil d'affilié.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:col-span-2">
                      {[
                        { id: 'social_whatsapp', label: 'WhatsApp (Lien wa.me)', icon: <Phone size={18} />, bg: 'bg-[#25D366]/10 text-[#25D366]', border: 'focus:border-[#25D366]' },
                        { id: 'social_instagram', label: 'Profil Instagram', icon: <Globe size={18} />, bg: 'bg-[#E1306C]/10 text-[#E1306C]', border: 'focus:border-[#E1306C]' },
                        { id: 'social_tiktok', label: 'Profil TikTok', icon: <Globe size={18} />, bg: 'bg-black/5 text-black', border: 'focus:border-black' },
                        { id: 'social_facebook', label: 'Page Facebook', icon: <Globe size={18} />, bg: 'bg-[#1877F2]/10 text-[#1877F2]', border: 'focus:border-[#1877F2]' },
                        { id: 'social_youtube', label: 'Chaîne YouTube', icon: <Globe size={18} />, bg: 'bg-[#FF0000]/10 text-[#FF0000]', border: 'focus:border-[#FF0000]' },
                        { id: 'social_linkedin', label: 'Profil LinkedIn', icon: <Globe size={18} />, bg: 'bg-[#0A66C2]/10 text-[#0A66C2]', border: 'focus:border-[#0A66C2]' },
                      ].map(net => (
                        <div key={net.id} className="bg-white/40 backdrop-blur-md rounded-[1.5rem] border border-gray-200/50 p-5 group flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${net.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                              {net.icon}
                            </div>
                            <label htmlFor={net.id} className="text-[14px] font-bold text-gray-900">{net.label}</label>
                          </div>
                          <input
                            id={net.id}
                            name={net.id}
                            type="url"
                            placeholder="https://"
                            defaultValue={socialJson[net.id.replace('social_', '')]}
                            className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-[1rem] outline-none transition-all text-[14px] font-medium text-gray-900 shadow-sm ${net.border}`}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* TAB PAYMENTS */}
                {activeTab === 'payments' && (
                  <>
                    <input type="hidden" name="name" value={userProfile.name as string} />
                    <div className="col-span-1 lg:col-span-2">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Paiements & Retraits</h2>
                       <p className="text-gray-500 font-medium">Configurez où les vendeurs transfèrent vos commissions gagnées.</p>
                    </div>

                    <div className="bg-emerald-50/50 rounded-[2rem] border border-emerald-100 p-6 lg:p-8 flex flex-col gap-4 col-span-1 lg:col-span-2">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-emerald-100 text-[#0F7A60] rounded-full flex items-center justify-center">
                           <CheckCircle2 size={24} />
                         </div>
                         <h3 className="font-bold text-[#0F7A60] text-lg tracking-tight">Paiements Rapides Wave / Orange Money</h3>
                       </div>
                       <p className="text-[14px] text-[#0F7A60]/80 font-medium leading-relaxed max-w-3xl">
                         Yayyam facilite le versement de vos fonds. Ce numéro sera indiqué aux marchands lorsque vous ferez une demande de retrait depuis votre Portefeuille.
                       </p>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group">
                      <div>
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-teal-100">
                          <Phone size={20} />
                        </div>
                        <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Ligne Mobile (Wave / OM)</h4>
                        <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Entrez le numéro avec l'indicatif correspondant.</p>
                      </div>
                      <div className="relative">
                        <input
                          name="phone"
                          type="tel"
                          defaultValue={userProfile.phone || ''}
                          placeholder="Ex: 77 000 00 00"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <>
                    <input type="hidden" name="name" value={userProfile.name as string} />
                    <div className="col-span-1 lg:col-span-2">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Alertes Telegram</h2>
                       <p className="text-gray-500 font-medium">Ne ratez plus aucune commission générée par vos liens !</p>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group">
                      {telegramChatId ? (
                        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-[#2AABEE]/10 text-[#2AABEE] rounded-2xl flex items-center justify-center shadow-sm">
                                <AlertCircle size={24} />
                              </div>
                              <h3 className="font-black text-gray-900 text-lg">Bot Actif !</h3>
                            </div>
                            <p className="text-[14px] text-gray-500 font-medium">Les alertes de ventes sont expédiées instantanément vers le Chat ID: <strong className="text-gray-900">{telegramChatId}</strong>.</p>
                          </div>
                          <button type="button" className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold shadow-sm hover:bg-red-100 text-[14px] transition-colors">
                            Déconnecter le Bot
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-lg mb-2">Activer les notifications en temps réel</h3>
                            <p className="text-gray-500 text-[14px] leading-relaxed font-medium">
                              Reliez ce compte à notre chatbot officiel. À chaque fois qu'un client passera commande via l'un de vos liens d'affiliation, vous serez notifié.
                            </p>
                          </div>
                          <a 
                            href={`https://t.me/Yayyam_bot?start=aff_${affiliateId}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="px-8 py-4 bg-[#2AABEE] text-white rounded-[1.2rem] font-black shadow-[0_4px_15px_rgba(42,171,238,0.3)] hover:bg-[#229ED9] transform hover:-translate-y-1 transition-all w-full sm:w-auto text-center"
                          >
                            Ouvrir Telegram
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group mt-6">
                      <div>
                         <h3 className="font-black text-gray-900 text-lg mb-2">Préférences Standard (Emails)</h3>
                         <p className="text-gray-500 text-[14px] leading-relaxed font-medium">Sélectionnez les alertes que vous souhaitez recevoir sur votre adresse : <strong>{userProfile.email as string}</strong>.</p>
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                          <div>
                            <p className="font-bold text-gray-900">Notifications de ventes</p>
                            <p className="text-[13px] text-gray-500">Un email automatisé dès qu'une de vos commandes est livrée.</p>
                          </div>
                          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500">
                             <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition" />
                          </div>
                        </label>
                        <label className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <div>
                            <p className="font-bold text-gray-900">Newsletter Yayyam</p>
                            <p className="text-[13px] text-gray-500">Actualités, nouveaux programmes d'affiliation rémunérateurs.</p>
                          </div>
                          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
                             <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB SECURITE */}
                {activeTab === 'security' && (
                  <>
                    <input type="hidden" name="name" value={userProfile.name as string} />
                    <div className="col-span-1 lg:col-span-2">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Sécurité</h2>
                       <p className="text-gray-500 font-medium">Informations sur la méthode d'authentification.</p>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 lg:col-span-2 group">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center">
                            <Lock size={20} />
                          </div>
                          <h3 className="font-bold text-gray-900">Mot de passe / Connexion</h3>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Vous êtes connecté via <strong className="text-gray-900">{authUser.app_metadata?.provider === 'google' ? 'Google' : 'Email/Mot de passe'}</strong>.</p>
                      </div>
                      {authUser.app_metadata?.provider !== 'google' && (
                        <button 
                          type="button" 
                          onClick={handlePasswordReset}
                          disabled={resetSent}
                          className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold shadow-sm hover:text-[#0F7A60] hover:border-[#0F7A60]/30 text-sm transition-colors text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {resetSent ? 'Email envoyé avec succès' : 'Réinitialiser le mot de passe'}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* TAB DANGER ZONE */}
                {activeTab === 'danger' && (
                  <>
                    <input type="hidden" name="name" value={userProfile.name as string} />
                    <div className="col-span-1 lg:col-span-2">
                       <h2 className="text-3xl font-black text-red-600 tracking-tight leading-tight mb-2 flex items-center gap-3">
                         <AlertTriangle size={32} /> Zone de Danger
                       </h2>
                       <p className="text-red-500/80 font-bold">Actions irréversibles relatives à votre compte affilié.</p>
                    </div>

                    <div className="bg-red-50/50 backdrop-blur-md rounded-[2rem] border border-red-200/60 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 lg:col-span-2 group">
                      <div className="md:w-2/3">
                        <h3 className="font-black text-red-700 text-xl tracking-tight mb-2">Désactiver mon profil d'affilié</h3>
                        <p className="text-[14px] text-red-600/80 font-medium leading-relaxed">
                          En désactivant votre profil d'affilié, tous vos liens de parrainage cesseront de fonctionner immédiatement. Vous ne recevrez plus aucune commission sur de nouvelles ventes. Cependant, votre portefeuille et vos gains actuels restent accessibles pour le retrait.
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowDangerModal(true)}
                        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-[0_8px_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105"
                      >
                        Désactiver le Compte
                      </button>
                    </div>

                    {showDangerModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-500">
                          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-[1.5rem] flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle size={32} />
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 text-center mb-3">Êtes-vous absolument sûr ?</h3>
                          <p className="text-gray-500 text-center mb-8 font-medium leading-relaxed">
                            Cette action suspendra vos revenus en cours. Vos liens ne seront plus fonctionnels et les clics seront perdus. Pour des raisons comptables, nous conserverons votre historique.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              type="button" 
                              onClick={() => setShowDangerModal(false)}
                              className="flex-1 px-6 py-4 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Annuler
                            </button>
                            <button 
                              type="button"
                              onClick={() => { setShowDangerModal(false); setError("La désactivation requiert l'assistance du support. Veuillez nous contacter."); }}
                              className="flex-1 px-6 py-4 rounded-xl font-black bg-red-600 text-white hover:bg-red-700 shadow-[0_5px_15px_rgba(220,38,38,0.4)] transition-all"
                            >
                              Oui, suspendre
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* TAB CONTRAT */}
                {activeTab === 'contract' && (
                  <AffiliateContractTab 
                    contractAcceptedAt={contractAcceptedAt} 
                    affiliateName={(userProfile.name as string) || (authUser.user_metadata?.name as string) || 'Affilié'} 
                  />
                )}

                {/* TAB KYC */}
                {activeTab === 'kyc' && (
                  <KycTab userProfile={userProfile} />
                )}
                
              </div>

              {/* === BOUTON SAUVEGARDER BAS === */}
              <div className="mt-8 flex justify-end pt-8">
                <button 
                  type="submit" 
                  disabled={loading || activeTab === 'security'}
                  className="px-8 py-3.5 bg-[#0F7A60] hover:bg-[#0C6A52] text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-[#0F7A60]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
                >
                  {loading ? 'Sauvegarde...' : 'Sauvegarder le Profil'}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>

    </div>
  )
}

function MenuBtn({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-[14.5px] transition-all duration-300 lg:w-full shrink-0 outline-none
        ${active ? 'font-bold text-[#0F7A60] bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] border border-gray-100 scale-[1.02]' : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-white/50 hover:translate-x-1 lg:hover:translate-x-1'}
      `}
    >
      <div className={`relative z-10 transition-transform duration-300 flex-shrink-0 flex items-center justify-center ${active ? 'text-[#0F7A60] scale-110' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {icon}
      </div>
      <span className="relative z-10">{label}</span>
      {active && (
         <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#0F7A60]" />
      )}
    </button>
  )
}
