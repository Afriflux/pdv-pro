'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2, Save, User, Camera, Trash2, ShieldCheck, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageCropperModal } from '@/components/ui/ImageCropperModal'
import Image from 'next/image'

// ----------------------------------------------------------------
// Badge rôle coloré
// ----------------------------------------------------------------
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin:  'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20',
    gestionnaire: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20',
    support:      'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    super_admin:  'Super Admin',
    gestionnaire: 'Gestionnaire',
    support:      'Support',
  }
  return (
    <span className={`px-2.5 py-1 border rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${styles[role] ?? styles.support}`}>
      {labels[role] ?? role}
    </span>
  )
}

// ----------------------------------------------------------------
// PROPS
// ----------------------------------------------------------------
interface ProfileSectionProps {
  userId:      string
  initialName: string
  email:       string
  avatarUrl:   string | null
  role:        string
}

// ----------------------------------------------------------------
// SECTION PROFIL ADMIN — Client Component
// ----------------------------------------------------------------
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
    e.target.value = '' // reset
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
      
      // If we cleared the avatar (currentAvatar is null but we had an avatarFile or we just pressed trash bin)
      // Actually, if we have a new avatar file:
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        finalAvatar = await uploadFile(avatarFile, 'avatars', `admin/${userId}/avatar_${Date.now()}.${ext}`)
      } else if (!currentAvatar) {
         // L'utilisateur a supprimé son avatar
         finalAvatar = null
      }

      const { error } = await supabase
        .from('User')
        .update({ name: name.trim(), avatar_url: finalAvatar, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      toast.success('Profil mis à jour ✅')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur : ' + msg)
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
    <form onSubmit={handleSaveProfile} className="space-y-6 flex flex-col h-full w-full">
      {/* 🌟 Bloc Avatar comme dans Paramètres 🌟 */}
      <div className="relative group max-w-fit mx-auto mb-4 mt-2">
        <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl relative z-10 mx-auto transition-transform duration-500">
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gray-50 flex items-center justify-center relative border border-gray-100">
            {currentAvatar ? (
              <Image 
                sizes="128px" 
                src={currentAvatar} 
                alt="Avatar" 
                fill 
                unoptimized 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <span className="text-gray-300 font-bold flex flex-col items-center justify-center text-4xl">
                {initiale || <User size={48} strokeWidth={1} />}
              </span>
            )}
            
            {/* Overlay Upload au Hover */}
            <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm cursor-pointer scale-110 group-hover:scale-100">
              <Camera size={24} className="text-white mb-2" strokeWidth={1.5} />
              <span className="text-white text-[10px] font-bold tracking-widest uppercase text-center leading-tight">Changer<br/>la photo</span>
              <input id="avatar-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {/* Petit bouton corbeille flottant */}
        {currentAvatar && (
          <button 
            type="button" 
            onClick={handleDeleteAvatar}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-white hover:bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-100 z-20 transition-all hover:scale-110"
            title="Supprimer la photo"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Inputs Profil */}
      <div className="space-y-5">
        <div>
          <label htmlFor="adminName" className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">
            Nom affiché
          </label>
          <input
            id="adminName"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Sultan AlQalifa"
            className="w-full px-4 py-3 bg-white/80 border border-gray-200/80 rounded-xl focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-sm font-bold text-gray-900 shadow-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="adminEmail" className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">
            Reçu Sécurité & Rôle
          </label>
          <div className="flex flex-col gap-2">
            <input
              id="adminEmail"
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200/80 rounded-xl text-gray-500 text-sm font-medium cursor-not-allowed shadow-inner outline-none"
            />
            <div className="flex items-center justify-between px-1">
               <span className="text-xs text-gray-400">Verrouillé</span>
               <RoleBadge role={role} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 w-full">
        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60]
            disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(15,122,96,0.2)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
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
