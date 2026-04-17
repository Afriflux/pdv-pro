'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2, User, Camera, Trash2, ShieldCheck, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageCropperModal } from '@/components/ui/ImageCropperModal'
import Image from 'next/image'

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    gestionnaire: 'bg-amber-50 text-amber-700 border-amber-100',
    support:      'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    super_admin:  'Super Admin',
    gestionnaire: 'Gestionnaire',
    support:      'Support',
  }
  return (
    <span className={`px-3 py-1 rounded-full border text-[12px] font-bold uppercase tracking-wide flex items-center gap-1.5 w-fit ${styles[role] ?? styles.support}`}>
      <ShieldCheck size={14} /> {labels[role] ?? role}
    </span>
  )
}

interface ProfileSectionProps {
  userId:      string
  initialName: string
  email:       string
  avatarUrl:   string | null
  role:        string
}

export default function ProfileSection({
  userId,
  initialName,
  email,
  avatarUrl,
  role,
}: ProfileSectionProps) {
  const [name,          setName]          = useState(initialName)
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [cropModalFile, setCropModalFile] = useState<File | null>(null)
  const [saving,        setSaving]        = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropModalFile(file)
    e.target.value = ''
  }

  const handleCropDone = (croppedFile: File, previewUrl: string) => {
    setAvatarFile(croppedFile)
    setCurrentAvatar(previewUrl)
    setCropModalFile(null)
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl + '?t=' + Date.now()
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Le nom ne peut pas être vide.')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      let finalAvatar = currentAvatar
      
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        finalAvatar = await uploadFile(avatarFile, 'avatars', `admin/${userId}/avatar_${Date.now()}.${ext}`)
      } else if (!currentAvatar) {
         finalAvatar = null
      }

      const { error } = await supabase
        .from('User')
        .update({ name: name.trim(), avatar_url: finalAvatar, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      toast.success('Profil mis à jour avec succès ✅')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur lors de la mise à jour : ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAvatar = () => {
    setCurrentAvatar(null)
    setAvatarFile(null)
  }

  const initiale = (name || email).charAt(0).toUpperCase()

  return (
    <form onSubmit={handleSaveProfile} className="animate-in fade-in zoom-in-95 duration-700 relative w-full">
      {/* 🌟 Conteneur Principal Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === BANNER === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#041D14] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A3D2C] via-[#05261B] to-[#041D14] opacity-90"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[40px] md:blur-[80px] -translate-y-1/2 translate-x-1/3 md:animate-pulse duration-[10000ms]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0F7A60]/20 rounded-full blur-[30px] md:blur-[60px] translate-y-1/2 -translate-x-1/4"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay"></div>

          {/* Bouton de sauvegarde en haut à droite */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(255,255,255,0.1)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Enregistrer les modifications
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === AVATAR OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-[2rem] sm:rounded-[2.5rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center relative border border-gray-100">
                  {currentAvatar ? (
                    <Image sizes="(max-width: 640px) 100vw, 33vw" src={currentAvatar} alt="Avatar" fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <span className="text-gray-300 font-bold flex flex-col items-center justify-center text-4xl">
                      {initiale || <User size={48} strokeWidth={1} />}
                    </span>
                  )}
                  
                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer scale-110 group-hover:scale-100">
                    <Camera size={32} className="text-white mb-2" strokeWidth={1.5} />
                    <span className="text-white text-[12px] font-bold tracking-widest uppercase">Modifier</span>
                    <input id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {currentAvatar && (
                <button 
                  type="button" 
                  onClick={handleDeleteAvatar}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-white hover:bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-100 z-20 transition-all hover:scale-110"
                  title="Supprimer la photo"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-8 space-y-3">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {name || 'Profil Administrateur'}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <RoleBadge role={role} />
              <span className="text-[14px] text-gray-500 font-medium">Gérez votre identité d'administration</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* Nom */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 hover:bg-white/60 transition-all duration-500 group">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-[#0F7A60] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100">
                  <User size={20} />
                </div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Nom d'affichage</h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Visible par vos collaborateurs et dans l'historique d'actions.</p>
              </div>
              <div className="relative mt-auto">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[1.2rem] blur opacity-0 focus-within:opacity-20 transition duration-500"></div>
                 <input 
                  required
                  title="Nom d'affichage"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Sultan AlQalifa" 
                  className="relative w-full px-5 py-4 bg-white/80 border border-gray-200/80 rounded-[1rem] focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-bold text-gray-900 placeholder:text-gray-400 shadow-sm" 
                 />
              </div>
            </div>

            {/* Email readonly */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 hover:bg-white/60 transition-all duration-500 group">
                <div>
                  <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-200">
                    <Mail size={20} />
                  </div>
                  <h4 className="text-[16px] font-black text-gray-900 tracking-tight">Email Sécurisé</h4>
                  <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">Liée de façon permanente à votre compte admin pour garantir une connexion hautement sécurisée.</p>
                </div>
                <div className="relative mt-auto">
                  <input 
                    readOnly 
                    aria-label="Adresse Email"
                    value={email} 
                    className="w-full px-5 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200/80 rounded-[1rem] text-gray-500 text-[15px] font-bold cursor-not-allowed shadow-inner focus:outline-none pr-32" 
                  />
                  <div className="absolute top-1/4 right-4 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-500 bg-gray-200/80 px-2.5 py-1.5 rounded-lg border border-gray-300">
                      🔒 Verrouillé
                  </div>
                </div>
            </div>

          </div>

        </div>
      </div>

      {cropModalFile && (
        <ImageCropperModal
          imageFile={cropModalFile}
          onClose={() => setCropModalFile(null)}
          onCrop={handleCropDone}
        />
      )}
    </form>
  )
}
