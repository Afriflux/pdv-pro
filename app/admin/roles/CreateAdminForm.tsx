'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface CreateAdminBody {
  email:    string
  name:     string
  role:     'gestionnaire' | 'support'
  password: string
}

// ----------------------------------------------------------------
// COMPOSANT — Formulaire création compte admin
// Accessible uniquement depuis /admin/roles (super_admin)
// ----------------------------------------------------------------
export default function CreateAdminForm() {
  const [email,          setEmail]          = useState('')
  const [name,           setName]           = useState('')
  const [role,           setRole]           = useState<CreateAdminBody['role']>('gestionnaire')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [loading,        setLoading]        = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation basique côté client
    if (!email.trim() || !name.trim() || !password.trim()) {
      toast.error('Tous les champs sont obligatoires.')
      return
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit comporter au moins 8 caractères.')
      return
    }

    setLoading(true)
    try {
      const body: CreateAdminBody = { email: email.trim(), name: name.trim(), role, password }
      const res = await fetch('/api/admin/roles/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la création du compte.')
        return
      }

      toast.success(`Compte ${role} créé pour ${email} ✅`)

      // Réinitialiser le formulaire
      setEmail('')
      setName('')
      setRole('gestionnaire')
      setPassword('')
      setShowPassword(false)
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // Classe commune pour les inputs — charte Yayyam
  const inputCls =
    'w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-[#1A1A1A] ' +
    'focus:bg-white focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 outline-none transition-all duration-300 ' +
    'placeholder:text-gray-400 shadow-inner hover:bg-white/50'

  const labelCls = 'block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Email */}
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@yayyam.com"
            className={inputCls}
            required
            autoComplete="off"
          />
        </div>

        {/* Nom affiché */}
        <div>
          <label className={labelCls}>Nom affiché</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Prénom Nom"
            className={inputCls}
            required
          />
        </div>

        {/* Sélecteur rôle */}
        <div>
          <label className={labelCls}>Rôle</label>
          <select
            aria-label="Rôle"
            value={role}
            onChange={e => setRole(e.target.value as CreateAdminBody['role'])}
            className={inputCls + ' cursor-pointer'}
          >
            <option value="gestionnaire">Gestionnaire</option>
            <option value="support">Support</option>
            {/* super_admin non attribuable depuis l'interface */}
          </select>
          <p className="mt-1 text-xs text-gray-400 font-medium">
            Le rôle <strong>Super Admin</strong> ne peut pas être attribué ici.
          </p>
        </div>

        {/* Mot de passe temporaire */}
        <div>
          <label className={labelCls}>Mot de passe temporaire</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              className={inputCls + ' pr-11'}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {/* Toggle visibilité mot de passe */}
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F7A60] transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400 font-medium">
            L&apos;admin devra changer son mot de passe à la première connexion.
          </p>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60]
            disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold 
            rounded-2xl transition-all shadow-[0_4px_15px_rgba(15,122,96,0.3)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.4)] border border-[#0F7A60]/50"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <UserPlus className="w-4 h-4" />
          }
          {loading ? 'Création en cours...' : 'Inviter ce collaborateur'}
        </button>
      </div>
    </form>
  )
}
