'use client'

// ─── Page de connexion admin Yayyam ─────────────────────────────────────────
// Espace d'administration sécurisé — thème sombre #0D1117
// Accessible uniquement aux rôles : super_admin, gestionnaire, support

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { adminSignIn } from './actions'

export default function AdminLoginPage() {
  const [showPassword, setShowPassword]   = useState(false)
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)
  const [isPending, startTransition]      = useTransition()

  // Récupération du message d'erreur depuis l'URL (?error=...)
  // Fait côté client car page est 'use client'
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError && !errorMsg) {
      if (urlError === 'unauthorized') {
        setErrorMsg('Accès non autorisé. Ce compte n\'a pas les droits d\'administration.')
      } else if (urlError === 'invalid_credentials') {
        setErrorMsg('Email ou mot de passe incorrect.')
      }
    }
  }

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null)
    startTransition(async () => {
      await adminSignIn(formData)
    })
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0F7A60]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card principale */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-[#30363D]">
            <div className="w-14 h-14 bg-[#0F7A60]/10 border border-[#0F7A60]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#0F7A60]" />
            </div>
            <h1 className="text-xl font-black text-[#E6EDF3] tracking-tight">Yayyam Admin</h1>
            <p className="text-xs text-[#7D8590] font-medium mt-1 uppercase tracking-widest">
              Espace d&apos;administration sécurisé
            </p>
          </div>

          {/* Formulaire */}
          <form action={handleSubmit} className="px-8 py-6 space-y-5">

            {/* Message d'erreur */}
            {errorMsg && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-red-400 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#7D8590] uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="admin@yayyam.app"
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 text-sm text-[#E6EDF3] placeholder-[#7D8590] focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#7D8590] uppercase tracking-widest">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-3 pr-12 text-sm text-[#E6EDF3] placeholder-[#7D8590] focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#0F7A60] hover:bg-[#0D6A52] text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-[#0F7A60]/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Se connecter à l&apos;admin
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <div className="h-px bg-[#30363D] mb-4" />
            <Link
              href="/"
              className="text-xs text-[#7D8590] hover:text-[#0F7A60] transition-colors font-medium flex items-center justify-center gap-1.5"
            >
              ← Retour à la boutique
            </Link>
          </div>
        </div>

        {/* Badge sécurité */}
        <p className="text-center text-[10px] text-[#7D8590] mt-4 font-mono uppercase tracking-widest">
          🔒 Connexion chiffrée · Yayyam © 2025
        </p>
      </div>
    </div>
  )
}
