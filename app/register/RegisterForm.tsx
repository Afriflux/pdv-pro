'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/app/auth/actions'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface RegisterFormProps {
  errorMsg: string | null
}

type UserRole = 'acheteur' | 'vendeur'

interface ValidateResponse {
  valid: boolean
  ambassadorName?: string
  message?: string
}

export function RegisterForm({ errorMsg }: RegisterFormProps) {
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('vendeur')

  // ── États code ambassadeur ────────────────────────────────────
  const [ambassadorCode, setAmbassadorCode] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [ambassadorName, setAmbassadorName] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Validation du code en temps réel avec debounce 500ms
  useEffect(() => {
    if (role !== 'vendeur') return
    if (!ambassadorCode.trim()) {
      setCodeStatus('idle')
      setAmbassadorName(null)
      return
    }

    setCodeStatus('loading')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/ambassador/validate?code=${encodeURIComponent(ambassadorCode.trim().toUpperCase())}`
        )
        const data = (await res.json()) as ValidateResponse

        if (data.valid) {
          setCodeStatus('valid')
          setAmbassadorName(data.ambassadorName ?? null)
        } else {
          setCodeStatus('invalid')
          setAmbassadorName(null)
        }
      } catch {
        setCodeStatus('invalid')
        setAmbassadorName(null)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ambassadorCode, role])

  // Réinitialiser le code quand on change de rôle
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setAmbassadorCode('')
    setCodeStatus('idle')
    setAmbassadorName(null)
  }

  const canSubmit =
    role === 'acheteur' ||
    (role === 'vendeur' && codeStatus === 'valid')

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-ink/5 p-8 border border-line relative">
      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2 break-words">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bouton Google */}
      <form action={signInWithGoogle} className="mb-6">
        <button
          type="submit"
          className="w-full bg-white hover:bg-gray-50 text-ink font-bold py-3.5 px-4 rounded-xl border border-line flex items-center justify-center gap-3 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>
      </form>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-line flex-1"></div>
        <span className="text-sm text-dust font-medium">ou</span>
        <div className="h-px bg-line flex-1"></div>
      </div>

      {/* ── Sélecteur de rôle ─────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-charcoal mb-3">Je souhaite…</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRoleChange('acheteur')}
            className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-150 ${
              role === 'acheteur'
                ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🛍️</span>
            <span className={`text-xs font-black uppercase tracking-wide ${role === 'acheteur' ? 'text-[#0F7A60]' : 'text-gray-600'}`}>
              Acheter
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Compte acheteur</span>
            {role === 'acheteur' && <CheckCircle2 className="w-4 h-4 text-[#0F7A60]" />}
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('vendeur')}
            className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-150 ${
              role === 'vendeur'
                ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">📦</span>
            <span className={`text-xs font-black uppercase tracking-wide ${role === 'vendeur' ? 'text-[#0F7A60]' : 'text-gray-600'}`}>
              Vendre
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Boutique en ligne</span>
            {role === 'vendeur' && <CheckCircle2 className="w-4 h-4 text-[#0F7A60]" />}
          </button>
        </div>
      </div>

      <form
        action={signUp}
        className="space-y-4"
        onSubmit={(e) => {
          const pwd = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value
          const confirmPwd = (e.currentTarget.elements.namedItem('confirm_password') as HTMLInputElement).value
          if (pwd !== confirmPwd) {
            e.preventDefault()
            alert('Les mots de passe ne correspondent pas.')
            return
          }
          if (!phone) {
            e.preventDefault()
            alert('Veuillez entrer votre numéro WhatsApp.')
            return
          }
          if (role === 'vendeur' && codeStatus !== 'valid') {
            e.preventDefault()
            alert('Veuillez entrer un code ambassadeur valide.')
          }
        }}
      >
        {/* Champs cachés */}
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="phone" value={phone} />
        {role === 'vendeur' && (
          <input type="hidden" name="ambassadorCode" value={ambassadorCode.trim().toUpperCase()} />
        )}

        {/* Nom */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1.5">
            {role === 'vendeur' ? 'Nom ou nom de marque' : 'Votre nom complet'}
          </label>
          <input
            id="name" name="name" type="text"
            placeholder={role === 'vendeur' ? 'Ex : Aminata Diallo' : 'Ex : Moussa Diallo'}
            required
            className="w-full px-4 py-3 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">Email</label>
          <input
            id="email" name="email" type="email" required
            placeholder="email@exemple.com"
            className="w-full px-4 py-3 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">
            Numéro WhatsApp / Contact
          </label>
          <PhoneInput value={phone} onChange={setPhone} placeholder="77 000 00 00" required />
        </div>

        {/* Code Ambassadeur — uniquement si vendeur */}
        {role === 'vendeur' && (
          <div>
            <label htmlFor="ambassadorCodeInput" className="block text-sm font-medium text-charcoal mb-1.5">
              Code Ambassadeur <span className="text-red-500">*</span>
              <span className="ml-1 text-[10px] text-gray-400 font-normal">(obligatoire pour vendre)</span>
            </label>
            <div className="relative">
              <input
                id="ambassadorCodeInput"
                type="text"
                value={ambassadorCode}
                onChange={(e) => setAmbassadorCode(e.target.value)}
                placeholder="Ex: COACH-AMADOU"
                maxLength={30}
                className={`w-full px-4 py-3 pr-10 rounded-xl bg-cream border text-ink placeholder:text-dust focus:outline-none focus:ring-2 transition-all text-sm uppercase font-mono tracking-wider ${
                  codeStatus === 'valid'
                    ? 'border-[#0F7A60] focus:border-[#0F7A60] focus:ring-[#0F7A60]/15'
                    : codeStatus === 'invalid'
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15'
                      : 'border-line focus:border-emerald focus:ring-emerald/15'
                }`}
              />
              {/* Icône statut */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {codeStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {codeStatus === 'valid'   && <CheckCircle2 className="w-4 h-4 text-[#0F7A60]" />}
                {codeStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>

            {/* Badge résultat */}
            {codeStatus === 'valid' && ambassadorName && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#0F7A60] font-bold bg-[#0F7A60]/5 border border-[#0F7A60]/20 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Code valide — Ambassadeur : {ambassadorName}
              </div>
            )}
            {codeStatus === 'invalid' && ambassadorCode.trim() && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                Code invalide ou inactif
              </div>
            )}
            {codeStatus === 'idle' && !ambassadorCode && (
              <p className="mt-1.5 text-[10px] text-gray-400">
                Demandez votre code à l&apos;ambassadeur PDV Pro qui vous a recommandé la plateforme.
              </p>
            )}
          </div>
        )}

        {/* Mot de passe */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1.5">Mot de passe</label>
          <input
            id="password" name="password" type="password"
            placeholder="Minimum 8 caractères" minLength={8} required
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
          />
        </div>

        {/* Confirmation */}
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-charcoal mb-1.5">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm_password" name="confirm_password" type="password"
            placeholder="Minimum 8 caractères" minLength={8} required
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full font-bold py-4 rounded-xl transition-all shadow-md mt-4 transform active:scale-[0.98] text-white ${
            canSubmit
              ? 'bg-emerald hover:bg-emerald-rich shadow-emerald/20'
              : 'bg-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          {role === 'acheteur' ? 'Créer mon compte acheteur' : 'Créer ma boutique gratuitement'}
        </button>
      </form>

      {role === 'vendeur' && (
        <p className="text-center text-xs text-dust mt-6 font-medium">
          PDV Pro prélève <strong>7%</strong> sur vos premières ventes (dégressif jusqu&apos;à 4%).
        </p>
      )}

      <div className="mt-8 pt-6 border-t border-line text-center">
        <p className="text-sm text-slate">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-emerald font-bold hover:text-emerald-rich transition-colors underline decoration-emerald/30 underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
