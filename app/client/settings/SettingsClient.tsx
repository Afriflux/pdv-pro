'use client'

import { useState } from 'react'
import { User, Lock, ShieldCheck, Camera, Trash2, Save, CheckCircle2, AlertCircle, Loader2, MapPin, Plus, Edit3, X } from 'lucide-react'
import Image from 'next/image'
import { updateClientProfile, addDeliveryAddress, deleteDeliveryAddress, deleteClientAccount } from './actions'
import { createClient } from '@/lib/supabase/client'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
  profile: any
  user: any
  addresses?: any[]
}

export default function SettingsClient({ profile, user, addresses = [] }: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [phone, setPhone] = useState(profile?.phone || '')

  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // Modal Adresse
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)

  const [deleteLoading, setDeleteLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    
    try {
      let finalAvatarUrl = avatarPreview;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        finalAvatarUrl = await uploadFile(avatarFile, 'avatars', `${user.id}/profile_${Date.now()}.${ext}`)
        formData.append('avatar_url', finalAvatarUrl)
      } else if (!avatarPreview) {
        formData.append('avatar_url', '')
      } else {
        formData.append('avatar_url', avatarPreview)
      }
      
      formData.set('phone', phone)

      const result = await updateClientProfile(formData)
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

  const handlePasswordReset = async () => {
    const email = profile?.email || user?.email
    if (!email) return
    setResetLoading(true)
    setError('')
    setSuccess('')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) {
      setError("Erreur lors de l'envoi de l'email.")
    } else {
      setSuccess("Un email de réinitialisation sécurisé vous a été envoyé.")
      setResetSent(true)
    }
    setResetLoading(false)
  }

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddrLoading(true)
    setError('')
    setSuccess('')
    const formData = new FormData(e.currentTarget)
    const res = await addDeliveryAddress(formData)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Adresse ajoutée avec succès.')
      setIsAddressModalOpen(false)
      setTimeout(() => setSuccess(''), 3000)
    }
    setAddrLoading(false)
  }

  const handleDeleteAddress = async (id: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) return
    
    setAddrLoading(true)
    setError('')
    setSuccess('')
    const res = await deleteDeliveryAddress(id)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Adresse supprimée.')
      setTimeout(() => setSuccess(''), 3000)
    }
    setAddrLoading(false)
  }

  const handleDeleteAccount = async () => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Suppression définitive',
      text: 'Ceci supprimera définitivement votre compte et tout l’historique associé. Tapez "CONFIRMER" pour procéder.',
      input: 'text',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Supprimer définitivement',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed || result.value !== 'CONFIRMER') return
    
    setDeleteLoading(true)
    setError('')
    setSuccess('')
    const res = await deleteClientAccount()
    if (res.error) {
      setError(res.error)
      setDeleteLoading(false)
    } else {
      router.push('/login')
    }
  }

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'address' | 'danger'>('profile')

  return (
    <div className="w-full relative pb-10">
      
      {/* ── HEADER PREMIUM ÉMERAUDE ── */}
      <header className="bg-gradient-to-br from-[#0F7A60] via-[#0b5341] to-[#1A1A1A] border border-[#0F7A60]/50 rounded-[2.5rem] px-8 py-10 shadow-[0_10px_40px_rgba(15,122,96,0.3)] mb-10 w-full relative z-10 overflow-hidden text-white flex flex-col md:flex-row md:items-end justify-between gap-6 group">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#0F7A60]/20 blur-3xl rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.2rem] text-[#0F7A60] border border-white/10 shadow-lg">
               <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">Paramètres</h1>
              <p className="text-gray-400 mt-1 font-medium">Gérez vos informations de compte et préférences sécurisées.</p>
            </div>
          </div>
      </header>

      {/* ── HYBRID VIEW (Sidebar / Horizontal Menu) ── */}
      <div className="flex flex-col lg:flex-row gap-8 w-full relative z-20 mx-auto">
        
        {/* ── MENU HYBRIDE ── */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start z-20">
          <div className="w-full relative z-10 overflow-x-auto scrollbar-hide lg:overflow-visible bg-white/80 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none p-3 lg:p-0 border border-gray-200/60 lg:border-none rounded-[2rem] lg:rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:shadow-none">
            <nav className="flex flex-row lg:flex-col gap-2 min-w-max lg:min-w-0" aria-label="Menu des paramètres client">
              <MenuBtn active={activeTab === 'profile'} icon={<User size={18} />} label="Général" onClick={() => { setActiveTab('profile'); setError(''); setSuccess('') }} />
              <MenuBtn active={activeTab === 'address'} icon={<MapPin size={18} />} label="Adresses" onClick={() => { setActiveTab('address'); setError(''); setSuccess('') }} />
              <MenuBtn active={activeTab === 'security'} icon={<Lock size={18} />} label="Sécurité" onClick={() => { setActiveTab('security'); setError(''); setSuccess('') }} />
              <div className="w-px h-auto bg-gray-200/50 mx-2 hidden sm:block lg:hidden"></div>
              <MenuBtn active={activeTab === 'danger'} icon={<Trash2 size={18} />} label="Suppression" onClick={() => { setActiveTab('danger'); setError(''); setSuccess('') }} isDanger={true} />
            </nav>
          </div>
        </aside>

        {/* ── CONTENU PRINCIPAL ── */}
        <div className="flex-1 w-full relative z-10 min-w-0"> 
          
          {/* Messages globaux */}
          {(success || error) && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in-95 ${success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-red-50 text-red-600 border border-red-200 shadow-sm'}`}>
               {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
               <span>{success || error}</span>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative min-h-[600px] lg:min-h-[calc(100vh-220px)] flex flex-col">

            <div className="p-6 sm:p-10 lg:px-12 pb-12 relative z-10 w-full flex flex-col flex-1 animate-in fade-in duration-500">
              
              {/* TAB PROFIL */}
              {activeTab === 'profile' && (
                <form id="profileForm" onSubmit={handleSubmit} className="w-full relative flex flex-col flex-1">
                  {/* === AVATAR === */}
                  <div className="relative mb-8 z-40">
                    <div className="relative group/avatar max-w-fit">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-xl border border-gray-100 relative z-10 hover:shadow-2xl transition-all duration-500">
                        <div className="w-full h-full rounded-[1.5rem] sm:rounded-[1.5rem] overflow-hidden bg-gray-50 flex items-center justify-center relative border border-gray-100">
                          {avatarPreview ? (
                            <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={avatarPreview} alt="Avatar" fill unoptimized className="object-cover transition-transform duration-700 group-hover/avatar:scale-105" />
                          ) : (
                            <span className="text-gray-300 font-bold flex flex-col items-center justify-center text-4xl">
                              {profile?.name?.[0] || 'U'}
                            </span>
                          )}
                          
                          <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer scale-110 group-hover/avatar:scale-100">
                            <Camera size={28} className="text-white mb-2" strokeWidth={2} />
                            <span className="text-white text-xs font-bold tracking-widest uppercase">Modifier</span>
                            <input title="Avatar" id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
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
          
                  {/* Titre & Sous-titre sous l'avatar */}
                  <div className="pb-8 space-y-2 mt-2 border-b border-gray-100/60 mb-8">
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                      Profil & Identité
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[14px] text-gray-500 font-medium">Configurez comment les vendeurs vous voient.</span>
                    </div>
                  </div>

                  {/* Layout des champs */}
                  <div className="space-y-6 max-w-2xl">
                    <div className="space-y-2">
                      <label className="text-[13px] font-black uppercase tracking-wider text-gray-500 ml-1">Nom Complet</label>
                      <input
                        title="Nom complet"
                        name="name"
                        type="text"
                        defaultValue={profile?.name || ''}
                        className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-5 py-4 text-[15px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 transition-all shadow-inner"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-black uppercase tracking-wider text-gray-500 ml-1">Numéro de Téléphone</label>
                        <div className="relative">
                          <PhoneInput value={phone} onChange={setPhone} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-gray-500 ml-1">
                          Email 
                        </label>
                        <div className="relative group/input">
                          <input
                            type="email"
                            value={profile?.email || user.email || ''}
                            className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] pl-5 pr-12 py-4 text-[15px] font-semibold text-gray-500 focus:border-red-500 transition-all cursor-not-allowed shadow-inner"
                            readOnly
                            disabled
                            title="L'email est verrouillé."
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 border border-gray-200 bg-white p-1 rounded-md shadow-sm" title="L'email principal ne peut pas être modifié.">
                            <Lock size={12} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton de sauvegarde inférieur */}
                  <div className="mt-auto pt-8 flex justify-end border-t border-gray-100/60">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-[0_8px_20px_rgba(15,122,96,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:-translate-y-1"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}

              {/* TAB SÉCURITÉ */}
              {activeTab === 'security' && (
                <div className="pt-2 sm:pt-6">
                  <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100/60">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
                        <Lock size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sécurité du compte</h2>
                        <p className="text-[14px] text-gray-500 font-medium mt-1">Gérez votre mot de passe et l'accès à votre Espace Client.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-gray-50 border border-gray-100 rounded-2xl w-full">
                    <div>
                      <h4 className="font-black text-gray-900 mb-1 text-lg">Mot de passe</h4>
                      <p className="text-[14px] font-medium text-gray-500 max-w-md">Vous recevrez un email sécurisé avec un lien pour configurer un nouveau mot de passe fort.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetSent || resetLoading}
                      className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {resetLoading ? 'Envoi...' : resetSent ? 'Email envoyé ✓' : 'Changer mon mot de passe'}
                    </button>
                  </div>

                  {/* Note d'information */}
                  <div className="mt-8 p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-4 overflow-hidden relative">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                     <ShieldCheck className="text-amber-500 shrink-0" size={24} />
                     <div>
                        <h4 className="text-sm font-black text-amber-900 mb-1">Protection d'identité active</h4>
                        <p className="text-[13px] text-amber-800/80 font-medium leading-relaxed">
                          Afin de protéger l'historique de vos commandes, votre e-mail de liaison est figé. Il permet d'associer automatiquement tous vos achats sur Yayyam à votre compte. Si vous devez le modifier pour des raisons techniques,
                        </p>
                        <a href="mailto:support@yayyam.com" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors bg-white/60 px-3 py-1.5 rounded-lg border border-amber-200/50 hover:bg-white shadow-sm">
                          Contacter le support →
                        </a>
                     </div>
                  </div>
                </div>
              )}

              {/* TAB ADRESSES */}
              {activeTab === 'address' && (
                <div className="pt-2 sm:pt-6">
                  <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100/60">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Carnet d'adresses</h2>
                        <p className="text-[14px] text-gray-500 font-medium mt-1">Gérez vos lieux de livraison pour commander plus rapidement.</p>
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => setIsAddressModalOpen(true)}
                      className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-[#0F7A60] text-white rounded-xl font-bold transition-colors shadow-md"
                    >
                      <Plus size={18} />
                      Ajouter une adresse
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4 text-gray-400">
                        <MapPin size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune adresse enregistrée</h3>
                      <p className="text-gray-500 text-sm mb-6 max-w-sm">Ajoutez votre adresse de domicile ou de bureau pour pré-remplir la livraison lors de vos prochains achats.</p>
                      <button onClick={() => setIsAddressModalOpen(true)} className="flex sm:hidden items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-[#0F7A60] text-white rounded-xl font-bold transition-colors shadow-md">
                         <Plus size={18} />
                         Ajouter une adresse
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(addresses || []).map((address) => (
                        <div key={address.id} className="relative p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                          {address.is_default && (
                            <span className="absolute top-4 right-4 text-xs uppercase font-black tracking-wider px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
                              Par défaut
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-gray-900">{address.name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{address.label}</span>
                          </div>
                          <div className="text-[14px] text-gray-500 space-y-1">
                            <p>{address.phone}</p>
                            <p className="line-clamp-2">{address.address}</p>
                            {address.city && <p>{address.city}</p>}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                            <button className="text-sm font-bold text-[#0F7A60] hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              <Edit3 size={14} /> Modifier
                            </button>
                            <button onClick={() => handleDeleteAddress(address.id)} disabled={addrLoading} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                              <Trash2 size={14} /> Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB DANGER ZONE */}
              {activeTab === 'danger' && (
                <div className="pt-2 sm:pt-6">
                  <div className="flex items-start justify-between mb-8 pb-6 border-b border-red-100/60">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
                        <Trash2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-red-600 tracking-tight">Zone de Danger</h2>
                        <p className="text-[14px] text-gray-500 font-medium mt-1">Actions irréversibles concernant la clôture de votre compte.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-red-50/30 border border-red-100 rounded-2xl w-full">
                    <div>
                      <h4 className="font-black text-gray-900 mb-1 text-lg">Supprimer mon compte</h4>
                      <p className="text-[14px] font-medium text-gray-500 max-w-md">La suppression de votre compte est définitive. Vous perdrez l'accès à votre historique de commandes et votre bibliothèque digitale de manière permanente.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 border border-red-600 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center justify-center gap-2"
                    >
                      {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL AJOUT ADRESSE */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Nouvelle adresse</h3>
              <button aria-label="Fermer" title="Fermer" onClick={() => setIsAddressModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleAddAddress} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-black uppercase text-gray-500">Label</label>
                  <select title="Label de l'adresse" name="label" required className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10">
                    <option value="Domicile">Domicile</option>
                    <option value="Bureau">Bureau</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-black uppercase text-gray-500">Ville</label>
                  <input title="Ville" name="city" type="text" placeholder="Dakar..." required className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[13px] font-black uppercase text-gray-500">Nom du destinataire</label>
                <input title="Nom de livraison" name="name" type="text" defaultValue={profile?.name || ''} required className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10" />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-black uppercase text-gray-500">Téléphone de livraison</label>
                <input title="Téléphone de livraison" name="phone" type="tel" defaultValue={profile?.phone || ''} required className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10" />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-black uppercase text-gray-500">Adresse détaillée</label>
                <textarea name="address" required placeholder="Quartier, rue, bâtiment, indications..." rows={3} className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] px-4 py-3 text-[14px] font-semibold text-gray-900 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 resize-none"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddressModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={addrLoading} className="flex-1 py-3 bg-[#0F7A60] hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {addrLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuBtn({ active, icon, label, onClick, isDanger = false }: { active: boolean, icon: any, label: string, onClick: () => void, isDanger?: boolean }) {
  const activeClasses = isDanger 
    ? 'font-bold text-red-600 bg-red-50/90 backdrop-blur-xl shadow-[0_8px_20px_rgb(239,68,68,0.1)] border border-red-100 scale-[1.03]'
    : 'font-bold text-[#0F7A60] bg-white/90 backdrop-blur-xl shadow-[0_8px_20px_rgb(15,122,96,0.1)] border border-gray-100 scale-[1.03]'
  
  const hoverClasses = isDanger
    ? 'font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/60 hover:backdrop-blur-lg hover:shadow-sm hover:translate-x-1 hover:border lg:hover:translate-x-1.5'
    : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-white/60 hover:backdrop-blur-lg hover:shadow-sm hover:translate-x-1 hover:border lg:hover:translate-x-1.5'

  const iconActiveClasses = isDanger
    ? 'text-red-500 scale-110 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]'
    : 'text-[#0F7A60] scale-110 drop-shadow-[0_2px_8px_rgba(15,122,96,0.4)]'
  
  const pointerActiveClasses = isDanger
    ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
    : 'bg-[#0F7A60] shadow-[0_0_12px_rgba(15,122,96,0.8)]'

  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-[14.5px] transition-all duration-400 lg:w-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0F7A60] focus-visible:ring-offset-2 group overflow-hidden
        ${active ? activeClasses : hoverClasses}
      `}
      type="button"
    >
      <div className={`relative z-10 transition-transform duration-300 flex-shrink-0 flex items-center justify-center ${active ? iconActiveClasses : 'text-gray-400 group-hover:text-red-400'}`}>
        {icon}
      </div>
      <span className={`relative z-10 ${!active ? 'hidden lg:inline' : 'inline'}`}>{label}</span>
      {active && (
         <div className={`hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10 animate-pulse ${pointerActiveClasses}`} />
      )}
    </button>
  )
}
