/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { User, Camera, CheckCircle2, Mail, Phone, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as Actions from '@/app/actions/settings'
import { toast } from 'sonner'

export function ProfileTab({ profile, userId }: { profile: any; userId: string }) {
  const [userName, setUserName] = useState(profile?.name || '')
  const [userPhone, setUserPhone] = useState(profile?.phone || '')
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState('')
  
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setServerError('')
    try {
      let finalAvatar = profile?.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        finalAvatar = await uploadFile(avatarFile, 'avatars', `${userId}/profile_${Date.now()}.${ext}`)
      }
      const res = await Actions.updateProfile({ name: userName, phone: userPhone, avatarUrl: finalAvatar || null })
      
      if (res?.error) {
        setServerError(res.error)
        toast.error(res.error)
      } else {
        toast.success('Profil mis à jour avec succès')
      }
    } catch (err: any) {
      setServerError(err.message || 'Erreur lors de la mise à jour')
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Le Grand Conteneur Profil Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER ABSTRAIT === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#041D14] overflow-hidden">
          {/* Gradients Flous Complexes Héroïques (Vert Nuit Sombre et Profond) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A3D2C] via-[#05261B] to-[#041D14] opacity-90"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0F7A60]/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(255,255,255,0.1)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Enregistrer les modifications
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === AVATAR OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6">
            
            {/* Bloc Avatar interactif */}
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center relative border border-gray-100">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar" fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <span className="text-gray-300 font-bold flex flex-col items-center justify-center text-4xl">
                      {userName[0] || <User size={48} strokeWidth={1} />}
                    </span>
                  )}
                  
                  {/* Overlay Upload au Hover */}
                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer scale-110 group-hover:scale-100">
                    <Camera size={32} className="text-white mb-2" strokeWidth={1.5} />
                    <span className="text-white text-[12px] font-bold tracking-widest uppercase">Modifier</span>
                    <input id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {/* Petit bouton corbeille flottant */}
              {(avatarPreview || profile?.avatar_url) && (
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
            
          {/* Titre & Statut */}
          <div className="pb-8 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              {userName || 'Votre Profil'}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                <CheckCircle2 size={14} /> Vendeur Vérifié
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Gérez votre identité publique</span>
            </div>
          </div>

          {serverError && (
            <div className="mb-8 bg-red-50 border border-red-200 text-red-600 text-[14px] font-bold p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <span className="text-xl">⚠️</span> {serverError}
            </div>
          )}

          {/* === FORM FIELDS EN CARTES GLASS === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* Carte Nom Complet */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 hover:bg-white/60 transition-all duration-500 group">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-[#0F7A60] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100">
                  <User size={20} />
                </div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Nom d'affichage</h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Visible par vos clients sur votre boutique et vos reçus commerciaux.</p>
              </div>
              <div className="relative mt-auto">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[1.2rem] blur opacity-0 focus-within:opacity-20 transition duration-500"></div>
                 <input 
                  required
                  title="Nom d'affichage"
                  aria-label="Nom d'affichage"
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="Ex: Sultan AlQalifa" 
                  className="relative w-full px-5 py-4 bg-white/80 border border-gray-200/80 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 placeholder:text-gray-400 shadow-sm" 
                 />
              </div>
            </div>

            {/* Carte Téléphone PRO */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 hover:bg-white/60 transition-all duration-500 group">
              <div>
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-teal-100">
                  <Phone size={20} />
                </div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Ligne Professionnelle</h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Numéro de contact principal facilitant le flux WhatsApp avec vos acheteurs.</p>
              </div>
              <div className="mt-auto">
                 <PhoneInput value={userPhone} onChange={setUserPhone} />
              </div>
            </div>

            {/* Carte Email (Vérifié / Verrouillé) */}
            {(!profile?.email || !/^(\+?\d+|user.+?)@/.test(profile.email)) && (
              <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 group hover:bg-white/60 transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="md:w-1/2">
                    <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-200">
                      <Mail size={20} />
                    </div>
                    <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Adresse Email Principale</h4>
                    <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Liée de façon permanente à votre compte pour garantir une connexion hautement sécurisée.</p>
                  </div>
                  <div className="md:w-1/2 relative">
                    <input 
                      readOnly 
                      aria-label="Adresse Email"
                      title="Adresse Email"
                      placeholder="votre@email.com"
                      value={profile?.email || ''} 
                      className="w-full px-5 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200/80 rounded-[1rem] text-gray-500 text-[15px] font-bold cursor-not-allowed shadow-inner focus:outline-none pr-32" 
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 bg-gray-200/80 px-2.5 py-1.5 rounded-lg border border-gray-300">
                       🔒 Verrouillé
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bouton de sauvegarde inférieur (Fix visibilité) */}
          <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Sauvegarder le Profil
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
