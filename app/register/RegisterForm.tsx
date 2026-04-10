'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/app/auth/actions'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Briefcase, ShoppingBag, ChevronRight, Users, Headset } from 'lucide-react'
import { PasswordInput } from '@/components/ui/PasswordInput'

interface RegisterFormProps {
  errorMsg: string | null
}

type UserRole = 'acheteur' | 'vendeur' | 'affilie' | 'closer'

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

  // Validation du code
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

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    setAmbassadorCode('')
    setCodeStatus('idle')
    setAmbassadorName(null)
  }

  const canSubmit = true // Code ambassadeur est toujours optionnel

  return (
    <motion.div 
      whileHover={{ boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.15)' }}
      className="bg-[#0A1A1F]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden"
    >
      {/* Lueur Céleste au top */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
      
      {/* Ambient local glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <div className="relative z-10">
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-start gap-3 break-words">
                <AlertTriangle className="shrink-0 mt-0.5 w-4 h-4" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton Google */}
        <form action={signInWithGoogle} className="mb-6">
          <button
            type="submit"
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-4 rounded-xl border border-white/5 hover:border-white/20 flex items-center justify-center gap-3 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/10 group"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 drop-shadow-sm group-hover:scale-110 transition-transform" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            S'inscrire avec Google
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6 opacity-60">
          <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1"></div>
          <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">ou création manuelle</span>
          <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1"></div>
        </div>

        {/* ── Sélecteur de rôle Magique ──────────────── */}
        <div className="mb-8 relative">
          <p className="text-[11px] font-black text-emerald-400/70 uppercase tracking-widest mb-3 text-center">Profil d'accès</p>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 rounded-[1.5rem] border border-white/5 relative z-10 w-full mb-2">
            
            <button
              type="button"
              onClick={() => handleRoleChange('acheteur')}
              className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl transition-colors duration-300 z-10 ${
                role === 'acheteur' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {role === 'acheteur' && (
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ borderRadius: '1rem' }}
                />
              )}
              <ShoppingBag className="w-6 h-6 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Acheteur</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('vendeur')}
              className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl transition-colors duration-300 z-10 ${
                role === 'vendeur' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {role === 'vendeur' && (
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ borderRadius: '1rem' }}
                />
              )}
              <Briefcase className="w-6 h-6 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Vendeur</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleRoleChange('affilie')}
              className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl transition-colors duration-300 z-10 ${
                role === 'affilie' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {role === 'affilie' && (
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ borderRadius: '1rem' }}
                />
              )}
              <Users className="w-6 h-6 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Affilié</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleRoleChange('closer')}
              className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl transition-colors duration-300 z-10 ${
                role === 'closer' ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {role === 'closer' && (
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-0 bg-white/5 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ borderRadius: '1rem' }}
                />
              )}
              <Headset className="w-6 h-6 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Closer</span>
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
            if (role === 'vendeur' && ambassadorCode.trim() && codeStatus !== 'valid') {
              // Code invalide ou en cours → on le vide silencieusement avant envoi
              setAmbassadorCode('')
              setCodeStatus('idle')
            }
          }}
        >
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="phone" value={phone} />
          {role === 'vendeur' && (
            <input type="hidden" name="ambassadorCode" value={ambassadorCode.trim().toUpperCase()} />
          )}

          <div className="group/input">
            <label htmlFor="name" className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
              {role === 'vendeur' ? 'Boutique / Marque' : 'Nom Complet'}
            </label>
            <input
              id="name" name="name" type="text"
              placeholder={role === 'vendeur' ? 'Ex : La Maison d\'Aida' : 'Ex : Aida Ndiaye'}
              required
              className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
            />
          </div>

          <div className="group/input">
            <label htmlFor="email" className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">Email</label>
            <input
              id="email" name="email" type="email" required
              placeholder="contact@exemple.com"
              className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
            />
          </div>

          <div className="group/input">
            <label className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
              Paiement Mensuel Via Numéro
            </label>
            <PhoneInput value={phone} onChange={setPhone} placeholder="77 000 00 00" required theme="dark" />
          </div>

          {/* Déploiement conditionnel fluide Code Ambassadeur */}
          <AnimatePresence>
            {role === 'vendeur' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="group/code pt-2">
                  <label htmlFor="ambassadorCodeInput" className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/code:text-emerald-400 transition-colors">
                    Code Référentiel <span className="text-[10px] text-white/30 lowercase tracking-normal font-medium ml-1">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="ambassadorCodeInput"
                      type="text"
                      value={ambassadorCode}
                      onChange={(e) => setAmbassadorCode(e.target.value)}
                      placeholder="Ex: AFRIKA-CONNECT"
                      maxLength={30}
                      className={`w-full px-4 py-4 pr-10 rounded-xl bg-black/40 border text-white placeholder:text-white/20 focus:outline-none focus:ring-1 transition-all text-sm uppercase font-mono tracking-widest shadow-inner ${
                        codeStatus === 'valid'
                          ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/50'
                          : codeStatus === 'invalid'
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50'
                            : 'border-white/5 focus:border-emerald-400/50 focus:ring-emerald-400/50 hover:border-white/10 hover:bg-black/50'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {codeStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-white/40" />}
                      {codeStatus === 'valid'   && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {codeStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {codeStatus === 'valid' && ambassadorName && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Accompagnement validé : {ambassadorName}
                      </motion.div>
                    )}
                    {codeStatus === 'invalid' && ambassadorCode.trim() && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        Code non reconnu
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="group/input">
              <label htmlFor="password" className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">Mot de passe</label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
              />
            </div>
            <div className="group/input">
              <label htmlFor="confirm_password" className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">Confirmation</label>
              <PasswordInput
                id="confirm_password"
                name="confirm_password"
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest py-4 rounded-xl transition-all mt-6 transform group/btn ${
              canSubmit
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#021f15] shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] active:scale-[0.98]'
                : 'bg-white/5 text-white/30 cursor-not-allowed shadow-none border border-white/5'
            }`}
          >
            {role === 'vendeur' ? 'Déployer Cloud Store' : 
             role === 'affilie' ? 'Rejoindre l\'affiliation' :
             role === 'closer' ? 'Devenir Closer' : 'Accéder à mon espace'}
            {canSubmit && <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10">
          <p className="text-sm text-white/50">
            Une instance existe déjà ?{' '}
            <Link href="/login" className="text-white font-bold hover:text-emerald-400 transition-colors underline decoration-white/20 hover:decoration-emerald-400/50 underline-offset-4">
              Connexion
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
