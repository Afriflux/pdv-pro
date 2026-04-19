'use client'

import { useState, useTransition } from 'react'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/app/auth/actions'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { CheckCircle2, Loader2, AlertTriangle, Briefcase, ShoppingBag, ChevronRight, Users, Headset, ArrowLeft } from 'lucide-react'
import { PasswordInput } from '@/components/ui/PasswordInput'

interface RegisterFormProps {
  errorMsg: string | null
}

export type UserRole = 'acheteur' | 'vendeur' | 'affilie' | 'closer'

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  acheteur: 'Achetez et suivez vos commandes facilement.',
  vendeur: 'Créez votre boutique et vendez sans commission fixe.',
  affilie: 'Gagnez des commissions en partageant des produits.',
  closer: 'Concluez des ventes pour les vendeurs et soyez rémunéré.',
}

export function RegisterForm({ errorMsg }: RegisterFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
  }

  const handleNextStep = () => {
    if (role) {
      setStep(2)
      setFormError(null)
    }
  }

  const handlePrevStep = () => {
    setStep(1)
    setFormError(null)
  }

  return (
    <div 
      className="bg-[#0A1A1F]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)] transition-shadow duration-500 relative overflow-hidden animate-[fade-slide-up_0.6s_ease-out_both]"
    >
      {/* Lueur Céleste au top */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
      
      {/* Ambient local glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <div className="relative z-10">
        {(errorMsg || formError) && (
          <div className="mb-8 overflow-hidden animate-[fade-in_0.3s_ease-out]">
            <div role="alert" aria-live="polite" className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-start gap-3 break-words">
              <AlertTriangle className="shrink-0 mt-0.5 w-4 h-4" />
              <span className="font-medium">{formError || errorMsg}</span>
            </div>
          </div>
        )}

        {/* ── ETAPE 1 : CHOIX DU ROLE ──────────────── */}
        {step === 1 && (
          <div className="animate-[fade-in_0.3s_ease-out_both]">
            <div className="mb-8 relative">
              <p className="text-sm font-bold text-white/90 mb-6 text-center">Que souhaitez-vous faire sur Yayyam ?</p>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/40 rounded-[1.5rem] border border-white/5 relative w-full mb-4">
                
                <button
                  type="button"
                  onClick={() => handleRoleChange('acheteur')}
                  className={`relative flex flex-col items-center gap-2 py-6 px-3 rounded-2xl transition-all duration-300 z-10 ${
                    role === 'acheteur' ? 'text-emerald-400 bg-emerald-900/20 scale-95' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {role === 'acheteur' && (
                    <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/40 rounded-[1.25rem] shadow-[0_0_20px_rgba(52,211,153,0.15)] animate-[fade-in_0.2s_ease-out]" />
                  )}
                  <ShoppingBag className="w-8 h-8 relative z-10" />
                  <span className="text-xs font-black uppercase tracking-widest relative z-10">Client</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('vendeur')}
                  className={`relative flex flex-col items-center gap-2 py-6 px-3 rounded-2xl transition-all duration-300 z-10 ${
                    role === 'vendeur' ? 'text-emerald-400 bg-emerald-900/20 scale-95' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {role === 'vendeur' && (
                    <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/40 rounded-[1.25rem] shadow-[0_0_20px_rgba(52,211,153,0.15)] animate-[fade-in_0.2s_ease-out]" />
                  )}
                  <Briefcase className="w-8 h-8 relative z-10" />
                  <span className="text-xs font-black uppercase tracking-widest relative z-10">Vendeur</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRoleChange('affilie')}
                  className={`relative flex flex-col items-center gap-2 py-6 px-3 rounded-2xl transition-all duration-300 z-10 ${
                    role === 'affilie' ? 'text-emerald-400 bg-emerald-900/20 scale-95' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {role === 'affilie' && (
                    <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/40 rounded-[1.25rem] shadow-[0_0_20px_rgba(52,211,153,0.15)] animate-[fade-in_0.2s_ease-out]" />
                  )}
                  <Users className="w-8 h-8 relative z-10" />
                  <span className="text-xs font-black uppercase tracking-widest relative z-10">Affilié</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRoleChange('closer')}
                  className={`relative flex flex-col items-center gap-2 py-6 px-3 rounded-2xl transition-all duration-300 z-10 ${
                    role === 'closer' ? 'text-emerald-400 bg-emerald-900/20 scale-95' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {role === 'closer' && (
                    <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/40 rounded-[1.25rem] shadow-[0_0_20px_rgba(52,211,153,0.15)] animate-[fade-in_0.2s_ease-out]" />
                  )}
                  <Headset className="w-8 h-8 relative z-10" />
                  <span className="text-xs font-black uppercase tracking-widest relative z-10">Closer</span>
                </button>
              </div>

              {/* Description détaillée du rôle sélectionné */}
              <div className="h-4 flex items-center justify-center">
                {role ? (
                  <p className="text-center text-xs text-emerald-300 animate-[fade-in_0.3s_ease-out]">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                ) : (
                  <p className="text-center text-xs text-white/30">Veuillez sélectionner un profil.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleNextStep}
              disabled={!role}
              className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest py-4 rounded-xl transition-all transform group/btn mt-8 ${
                role
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#021f15] shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] active:scale-[0.98]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed shadow-none border border-white/5'
              }`}
            >
              Continuer
              {role && <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
            </button>
          </div>
        )}

        {/* ── ETAPE 2 : FORMULAIRE & GOOGLE ──────────────── */}
        {step === 2 && role && (
          <div className="animate-[fade-in_0.4s_ease-out_both] space-y-6">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <button 
                onClick={handlePrevStep}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                type="button"
                aria-label="Retour"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">Profil d'accès</p>
                <p className="text-sm font-bold text-white capitalize">{role}</p>
              </div>
            </div>

            {/* Bouton Google */}
            <form action={async () => {
              // On appelle l'action serveur avec le rôle en paramètre FormData pour positionner le cookie
              const fd = new FormData()
              fd.set('role', role)
              await signInWithGoogle(fd)
            }}>
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
                Inscription avec Google
              </button>
            </form>

            <div className="flex items-center gap-4 opacity-60">
              <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1"></div>
              <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">ou création manuelle</span>
              <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1"></div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setFormError(null)
                const formElement = e.currentTarget
                
                if (!phone) {
                  setFormError('Veuillez entrer votre numéro WhatsApp.')
                  return
                }
                const formData = new FormData(formElement)
                formData.set('role', role)
                formData.set('phone', phone)

                startTransition(async () => {
                  try {
                    const res = await signUp(formData)
                    if (res?.error) {
                      setFormError(res.msg || 'Erreur lors de l\'inscription.')
                      return
                    }
                    if (res?.success) {
                      try {
                        if (typeof window !== 'undefined') {
                          if ((window as any).fbq) (window as any).fbq('track', 'CompleteRegistration', { content_name: role })
                          if ((window as any).ttq) (window as any).ttq.track('CompleteRegistration', { content_type: role })
                        }
                      } catch (e) {}

                      await Swal.fire({
                        title: 'Inscription Réussie ! 🎉',
                        text: 'Votre compte a bien été créé. Redirection en cours...',
                        icon: 'success',
                        timer: 3500,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        background: '#0A1A1F',
                        color: '#fff',
                        iconColor: '#34D399',
                        customClass: {
                           popup: 'border border-emerald-500/20 rounded-3xl'
                        }
                      })
                      window.location.href = res.url || '/dashboard'
                    }
                  } catch (err: unknown) {
                    console.error(err)
                    setFormError('Une erreur inattendue est survenue.')
                  }
                })
              }}
            >
              <div className="group/input">
                <label htmlFor="name" className="block text-xs font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
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
                <label htmlFor="email" className="flex items-center gap-2 text-xs font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
                  Email <span className="text-xs text-white/30 lowercase tracking-normal font-medium">(Optionnel)</span>
                </label>
                <input
                  id="email" name="email" type="email"
                  placeholder="contact@exemple.com"
                  className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
                />
              </div>

              <div className="group/input">
                <label className="block text-xs font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
                  Numéro WhatsApp
                </label>
                <PhoneInput value={phone} onChange={setPhone} placeholder="77 000 00 00" required theme="dark" />
              </div>

              <div className="group/input pt-2">
                <label htmlFor="password" className="block text-xs font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">Mot de passe</label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="8 caractères minimum"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest py-4 rounded-xl transition-all mt-6 transform group/btn ${
                  !isPending
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#021f15] shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] active:scale-[0.98]'
                    : 'bg-white/5 text-white/30 cursor-not-allowed shadow-none border border-white/5'
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    CRÉER MON COMPTE
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10">
          <p className="text-sm text-white/50">
            Une instance existe déjà ?{' '}
            <Link href="/login" className="text-white font-bold hover:text-emerald-400 transition-colors underline decoration-white/20 hover:decoration-emerald-400/50 underline-offset-4">
              Connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
