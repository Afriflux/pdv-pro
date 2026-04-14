"use client"

import { useState } from 'react'
import { User, Lock, Trash2, Save, CheckCircle2, AlertCircle, Loader2, Landmark, Wallet, Smartphone, Building2, CreditCard, Camera } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { updateClientProfile, deleteClientAccount } from '@/app/client/settings/actions'
import { updateCloserFinance } from '@/app/closer/settings/actions'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface CloserSettingsClientProps {
  profile: any
  user: any
}

export default function CloserSettingsClient({ profile, user }: CloserSettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [phone, setPhone] = useState(profile?.phone || '')

  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Finance states
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wave' | 'orange_money' | 'bank'>(
    profile?.withdrawal_method || 'wave'
  )
  const [withdrawalNumber, setWithdrawalNumber] = useState(profile?.withdrawal_number || '')
  const [withdrawalName, setWithdrawalName] = useState(profile?.withdrawal_name || profile?.name || '')
  const [autoWithdrawEnabled, setAutoWithdrawEnabled] = useState<boolean>(profile?.closer_auto_withdraw || false)
  const [autoWithdrawThreshold, setAutoWithdrawThreshold] = useState<number>(profile?.closer_auto_withdraw_threshold || 50000)
  const [financeLoading, setFinanceLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'profile' | 'finance' | 'security' | 'danger'>('profile')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (['profile', 'finance', 'security', 'danger'].includes(hash)) {
        setActiveTab(hash as any)
      }
    }
  }, [])

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

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawalNumber.trim()) { setError('Le numéro de compte est obligatoire.'); return; }
    if (!withdrawalName.trim()) { setError('Le nom du titulaire est obligatoire.'); return; }
    
    setFinanceLoading(true)
    setError('')
    setSuccess('')
    
    const res = await updateCloserFinance(withdrawalMethod, withdrawalNumber, withdrawalName, autoWithdrawEnabled, autoWithdrawThreshold)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Coordonnées de retrait sauvegardées avec succès !')
      setTimeout(() => setSuccess(''), 3000)
    }
    setFinanceLoading(false)
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

  const handleDeleteAccount = async () => {
    // eslint-disable-next-line no-alert
    if (!prompt('Ceci supprimera définitivement votre compte et tout l’historique associé.\nTapez "CONFIRMER" pour procéder.')) return
    
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
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">Paramètres Closer</h1>
              <p className="text-gray-400 mt-1 font-medium">Gérez votre profil public et vos préférences de paiement.</p>
            </div>
          </div>
      </header>

      {/* ── SPLIT VIEW (Sidebar & Content side-by-side) ── */}
      <div className="flex flex-col lg:flex-row items-start gap-8 w-full relative z-20 mx-auto">
        
        {/* ── MENU LATÉRAL ── */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 sticky top-[80px] z-10 bg-white/80 backdrop-blur-3xl border border-gray-200/60 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-2">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto custom-scrollbar lg:overflow-visible pb-2 lg:pb-0" aria-label="Menu des paramètres client">
            <MenuBtn active={activeTab === 'profile'} icon={<User className="w-5 h-5" />} label="Général" onClick={() => { setActiveTab('profile'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'finance'} icon={<Wallet className="w-5 h-5" />} label="Retraits" onClick={() => { setActiveTab('finance'); setError(''); setSuccess('') }} />
            <MenuBtn active={activeTab === 'security'} icon={<Lock className="w-5 h-5" />} label="Sécurité" onClick={() => { setActiveTab('security'); setError(''); setSuccess('') }} />
            <div className="hidden lg:block h-px w-full bg-gray-200/50 my-2"></div>
            <MenuBtn active={activeTab === 'danger'} icon={<Trash2 className="w-5 h-5" />} label="Suppression" onClick={() => { setActiveTab('danger'); setError(''); setSuccess('') }} isDanger={true} />
          </nav>
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

          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative min-h-[600px] flex flex-col">

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
                      
                      {avatarPreview && (
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
                            title="L'email est verrouillé."
                            type="email"
                            value={profile?.email || user.email || ''}
                            className="w-full bg-gray-50/50 outline-none border border-gray-200/60 rounded-[1rem] pl-5 pr-12 py-4 text-[15px] font-semibold text-gray-500 focus:border-red-500 transition-all cursor-not-allowed shadow-inner"
                            readOnly
                            disabled
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 border border-gray-200 bg-white p-1 rounded-md shadow-sm">
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

              {/* TAB FINANCE (RETRAIT) UNIFORME AU VENDEUR */}
              {activeTab === 'finance' && (
                <form onSubmit={handleFinanceSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full pt-2 sm:pt-6">
                  
                  {/* === ICON OVERLAP === */}
                  <div className="relative mb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-gray-100/60 pb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100/50 shrink-0">
                        <Landmark size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Portefeuille & Retraits</h2>
                        <div className="flex items-center gap-2 mt-1 hidden sm:flex">
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-100 uppercase tracking-wide">
                            Commissions Closer
                          </span>
                          <span className="text-[13px] text-gray-500 font-medium">Moyen de paiement de vos commissions.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-10 mt-6">

                    {/* === SÉLECTION DU FOURNISSEUR === */}
                    <div>
                      <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4 block">1. Choisissez un fournisseur</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Wave */}
                        <button
                          type="button"
                          onClick={() => setWithdrawalMethod('wave')}
                          className={`relative p-6 text-left rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden group ${
                            withdrawalMethod === 'wave' 
                            ? 'border-[#00a2ff] bg-[#00a2ff]/[0.02] shadow-[0_8px_30px_rgb(0,162,255,0.1)]' 
                            : 'border-transparent bg-gray-50 hover:bg-[#00a2ff]/5 hover:border-[#00a2ff]/30'
                          }`}
                        >
                          {withdrawalMethod === 'wave' && <div className="absolute inset-0 bg-[#00a2ff]/5 border-[3px] border-[#00a2ff] rounded-[1.5rem] pointer-events-none"></div>}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${withdrawalMethod === 'wave' ? 'bg-[#00a2ff] text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm group-hover:text-[#00a2ff]'}`}>
                            <Smartphone size={28} />
                          </div>
                          <div>
                            <h3 className={`font-black text-[18px] tracking-tight mb-1 ${withdrawalMethod === 'wave' ? 'text-[#00a2ff]' : 'text-gray-900'}`}>Wave Mobile</h3>
                            <p className="text-xs font-medium text-gray-500 leading-snug">Virement rapide vers un compte Wave Sénégal / CI.</p>
                          </div>
                          {withdrawalMethod === 'wave' && (
                            <div className="absolute top-6 right-6 text-[#00a2ff] animate-in zoom-in">
                              <CheckCircle2 size={24} className="fill-[#00a2ff]/20" />
                            </div>
                          )}
                        </button>

                        {/* Orange Money */}
                        <button
                          type="button"
                          onClick={() => setWithdrawalMethod('orange_money')}
                          className={`relative p-6 text-left rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden group ${
                            withdrawalMethod === 'orange_money' 
                            ? 'border-[#ff6600] bg-[#ff6600]/[0.02] shadow-[0_8px_30px_rgb(255,102,0,0.1)]' 
                            : 'border-transparent bg-gray-50 hover:bg-[#ff6600]/5 hover:border-[#ff6600]/30'
                          }`}
                        >
                          {withdrawalMethod === 'orange_money' && <div className="absolute inset-0 bg-[#ff6600]/5 border-[3px] border-[#ff6600] rounded-[1.5rem] pointer-events-none"></div>}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${withdrawalMethod === 'orange_money' ? 'bg-[#ff6600] text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm group-hover:text-[#ff6600]'}`}>
                            <Smartphone size={28} />
                          </div>
                          <div>
                            <h3 className={`font-black text-[18px] tracking-tight mb-1 ${withdrawalMethod === 'orange_money' ? 'text-[#ff6600]' : 'text-gray-900'}`}>Orange Money</h3>
                            <p className="text-xs font-medium text-gray-500 leading-snug">Virement vers un compte Orange Money actif.</p>
                          </div>
                          {withdrawalMethod === 'orange_money' && (
                            <div className="absolute top-6 right-6 text-[#ff6600] animate-in zoom-in">
                              <CheckCircle2 size={24} className="fill-[#ff6600]/20" />
                            </div>
                          )}
                        </button>

                        {/* Bank */}
                        <button
                          type="button"
                          onClick={() => setWithdrawalMethod('bank')}
                          className={`relative p-6 text-left rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden group ${
                            withdrawalMethod === 'bank' 
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-[0_8px_30px_rgb(5,150,105,0.1)]' 
                            : 'border-transparent bg-gray-50 hover:bg-gray-100/80 hover:border-gray-300'
                          }`}
                        >
                          {withdrawalMethod === 'bank' && <div className="absolute inset-0 bg-emerald-600/5 border-[3px] border-emerald-600 rounded-[1.5rem] pointer-events-none"></div>}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${withdrawalMethod === 'bank' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white text-gray-400 shadow-sm group-hover:text-emerald-600'}`}>
                            <Building2 size={28} />
                          </div>
                          <div>
                            <h3 className={`font-black text-[18px] tracking-tight mb-1 ${withdrawalMethod === 'bank' ? 'text-gray-900' : 'text-gray-900'}`}>Virement Bancaire</h3>
                            <p className="text-xs font-medium text-gray-500 leading-snug">Transfert direct vers votre compte (UEMOA / SEPA).</p>
                          </div>
                          {withdrawalMethod === 'bank' && (
                            <div className="absolute top-6 right-6 text-gray-900 animate-in zoom-in">
                              <CheckCircle2 size={24} className="fill-gray-900/20" />
                            </div>
                          )}
                        </button>

                      </div>
                    </div>

                    {/* === INFOS DU COMPTE === */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4 block">2. Saisissez vos coordonnées relatives au choix</label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        {/* Numéro / IBAN */}
                        <div className="group relative">
                          <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-emerald-500"></div>
                          <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all flex flex-col gap-2">
                            <label className="text-[14px] font-black text-gray-900 tracking-tight">
                              {withdrawalMethod === 'bank' ? "IBAN / RIB Complet" : "Numéro de téléphone"}
                            </label>
                            <input 
                              title="Nom de la banque ou Mobile Money"
                              type="text"
                              value={withdrawalNumber}
                              onChange={(e) => setWithdrawalNumber(e.target.value)}
                              className="w-full bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none py-2 text-[16px] font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal font-mono transition-colors"
                              placeholder={withdrawalMethod === 'bank' ? "SN..." : "Format: 77xxx / +225..."}
                            />
                          </div>
                        </div>

                        {/* Nom */}
                        <div className="group relative">
                          <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-emerald-500"></div>
                          <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all flex flex-col gap-2">
                            <label className="text-[14px] font-black text-gray-900 tracking-tight">
                              Nom complet du titulaire
                            </label>
                            <input 
                              title="Nom sur le compte"
                              type="text"
                              value={withdrawalName}
                              onChange={(e) => setWithdrawalName(e.target.value)}
                              className="w-full bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none py-2 text-[16px] font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal transition-colors"
                              placeholder="Ex: Amadou Fall"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* === AUTO WITHDRAW === */}
                    <div className="pt-8 border-t border-gray-100">
                      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm max-w-4xl">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                              <span className="text-lg">🤖</span> Retraits Automatisés
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 max-w-[300px] leading-relaxed">
                              Transférez vos gains automatiquement vers votre compte dès que le seuil défini est atteint.
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setAutoWithdrawEnabled(!autoWithdrawEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 shadow-inner focus:outline-none ${autoWithdrawEnabled ? 'bg-[#0F7A60]' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoWithdrawEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        
                        {autoWithdrawEnabled && (
                          <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seuil de déclenchement (FCFA)</label>
                            <div className="flex items-center gap-2 max-w-xs">
                              <input 
                                title="Numéro de compte (IBAN ou Mobile)"
                                type="number"
                                value={autoWithdrawThreshold}
                                onChange={(e) => setAutoWithdrawThreshold(Number(e.target.value))}
                                placeholder="Ex: 50000"
                                className="flex-1 min-w-0 bg-[#FAFAF7] border border-gray-200 text-sm font-black text-[#1A1A1A] rounded-xl px-4 py-2.5 outline-none focus:border-[#0F7A60] transition-colors"
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 italic">Vos paiements s'effectueront lorsque vous atteindrez ce montant.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end border-t border-gray-100/50 pt-8">
                    <button 
                      type="submit"
                      disabled={financeLoading}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
                    >
                      {financeLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <CreditCard size={18} />}
                      Sauvegarder mon compte de retrait
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
                        <p className="text-[14px] text-gray-500 font-medium mt-1">Gérez votre mot de passe et l'accès à votre Espace Closer.</p>
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
                        <p className="text-[14px] text-gray-500 font-medium mt-1">Actions irréversibles concernant la suppression de votre compte.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-red-50/30 border border-red-100 rounded-2xl w-full">
                    <div>
                      <h4 className="font-black text-gray-900 mb-1 text-lg">Supprimer mon compte</h4>
                      <p className="text-[14px] font-medium text-gray-500 max-w-md">La suppression de votre compte est définitive. Vous perdrez l'accès complet à vos gains non retirés et à votre file d'appels.</p>
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
