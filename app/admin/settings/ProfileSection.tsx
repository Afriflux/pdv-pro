'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ----------------------------------------------------------------
// Badge rôle coloré (copie légère pour éviter import serveur)
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
    <span className={`px-2.5 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${styles[role] ?? styles.support}`}>
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
  const [uploading,     setUploading]     = useState(false)
  const [saving,        setSaving]        = useState(false)

  // Upload avatar dans Supabase Storage (bucket "avatars")
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation taille et type
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde. Maximum 2 MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier invalide. Sélectionnez une image.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext       = file.name.split('.').pop() ?? 'jpg'
      const path      = `admin/${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl + '?t=' + Date.now() // Cache busting

      // Mettre à jour avatar_url dans la table User
      const { error: updateError } = await supabase
        .from('User')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) throw updateError

      setCurrentAvatar(publicUrl)
      toast.success('Photo de profil mise à jour ✅')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur upload : ' + msg)
    } finally {
      setUploading(false)
    }
  }

  // Sauvegarde du nom
  const handleSaveName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Le nom ne peut pas être vide.')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('User')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      toast.success('Profil sauvegardé ✅')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur : ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const initiale = (name || email).charAt(0).toUpperCase()

  return (
    <form onSubmit={handleSaveName} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          {currentAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentAvatar}
              alt="Avatar admin"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#0F7A60]/10 flex items-center justify-center text-2xl font-black text-[#0F7A60] border-2 border-[#0F7A60]/20">
              {initiale}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-[#FAFAF7] border border-gray-200
              rounded-xl text-xs font-bold text-gray-600 hover:border-[#0F7A60] hover:text-[#0F7A60] transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Upload en cours...' : 'Changer la photo'}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={uploading}
          />
          <p className="mt-1 text-[10px] text-gray-400 font-medium">JPG, PNG — Max 2 MB</p>
        </div>
      </div>

      {/* Nom */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
          Nom affiché
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Prénom Nom"
          className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-[#1A1A1A]
            focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
          required
        />
      </div>

      {/* Email readonly + badge rôle */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
          Email & Rôle
        </label>
        <div className="flex items-center gap-3">
          <input
            aria-label="Email"
            title="Email"
            type="email"
            value={email}
            readOnly
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-400 cursor-not-allowed"
          />
          <RoleBadge role={role} />
        </div>
      </div>

      {/* Bouton sauvegarde */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A]
            disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
        </button>
      </div>
    </form>
  )
}
