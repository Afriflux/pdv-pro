'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ----------------------------------------------------------------
// SECTION SÉCURITÉ — Changement de mot de passe
// Utilise supabase.auth.updateUser({ password: newPassword })
// ----------------------------------------------------------------
export default function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords,   setShowPasswords]   = useState(false)
  const [loading,         setLoading]         = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tous les champs sont obligatoires.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit comporter au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Le nouveau mot de passe et la confirmation ne correspondent pas.')
      return
    }
    if (newPassword === currentPassword) {
      toast.error('Le nouveau mot de passe doit être différent de l\'actuel.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Mise à jour du mot de passe via Supabase Auth
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      toast.success('Mot de passe mis à jour avec succès ✅')

      // Réinitialiser les champs
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Erreur : ' + msg)
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl py-3 px-4 text-sm font-semibold text-[#1A1A1A] pr-11 ' +
    'focus:bg-white focus:border-[#0F7A60] focus-visible:ring-4 focus-visible:ring-[#0F7A60]/10 outline-none transition-all duration-300 ' +
    'shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-gray-400'

  const labelCls = 'block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bouton toggle visibilité globale */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowPasswords(v => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0F7A60] transition-colors font-medium"
        >
          {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
        </button>
      </div>

      {/* Mot de passe actuel */}
      <div>
        <label htmlFor="currentPassword" className={labelCls}>Mot de passe actuel</label>
        <div className="relative">
          <input
            id="currentPassword"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Votre mot de passe actuel"
            className={inputCls}
            required
            autoComplete="current-password"
          />
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nouveau mot de passe */}
        <div>
          <label htmlFor="newPassword" className={labelCls}>Nouveau mot de passe</label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              className={inputCls}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          </div>
        </div>

        {/* Confirmation */}
        <div>
          <label htmlFor="confirmPassword" className={labelCls}>Confirmer le mot de passe</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Répétez le nouveau mot de passe"
              className={`${inputCls} ${
                confirmPassword && confirmPassword !== newPassword
                  ? 'border-red-300 focus-visible:ring-2 focus-visible:ring-red-100'
                  : confirmPassword && confirmPassword === newPassword
                  ? 'border-[#0F7A60] focus-visible:ring-2 focus-visible:ring-[#0F7A60]/10'
                  : ''
              }`}
              required
              autoComplete="new-password"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          </div>
          {/* Indicateur correspondance */}
          {confirmPassword && confirmPassword !== newPassword && (
            <p role="alert" aria-live="polite" className="mt-1 text-[10px] text-red-500 font-medium">
              Les mots de passe ne correspondent pas.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60]
            disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-all shadow-[0_4px_15px_rgba(15,122,96,0.2)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
        </button>
      </div>
    </form>
  )
}
