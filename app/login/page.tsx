'use client'

import React from 'react'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/app/auth/actions'
import {
  ArrowLeft,
  Lock,
  User,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { PasswordInput } from '@/components/ui/PasswordInput'

interface LoginPageProps {
  searchParams: { error?: string; redirect?: string }
}

const errorMessages: Record<string, string> = {
  champs_requis: 'Veuillez remplir tous les champs.',
  identifiants_invalides: 'Email/téléphone ou mot de passe incorrect.',
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorKey = searchParams.error
  const errorMsg = errorKey ? (errorMessages[errorKey] ?? 'Une erreur est survenue.') : null

  return (
    <main className="min-h-screen relative flex items-center justify-center font-body bg-[#02120C] overflow-hidden px-4 md:px-0">
      
      {/* ── Background Cinématique (CSS animations) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 animate-[glow-pulse_15s_linear_infinite]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[130px] translate-y-1/3 translate-x-1/3 animate-[glow-drift_20s_ease-in-out_infinite]" />
        <div className="absolute left-[10%] w-[1px] h-[20%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent blur-[2px] animate-[laser-sweep_10s_linear_2s_infinite]" />
      </div>

      {/* ── Bouton Retour ── */}
      <div className="absolute top-6 left-6 z-50 animate-[fade-slide-right_0.8s_ease-out_0.5s_both]">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group px-3 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 backdrop-blur-md">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium hidden sm:inline tracking-wide">Retour</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md my-12 animate-[fade-in_0.6s_ease-out_both]">
        {/* Entête */}
        <div className="text-center mb-10 animate-[fade-slide-up_0.6s_ease-out_0.1s_both]">
           <Link href="/" className="inline-block text-4xl font-display font-black text-white hover:opacity-80 transition drop-shadow-sm tracking-tight mb-5 group">
             Yayyam<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 drop-shadow-md">Pro</span>
             <div className="h-[2px] w-0 group-hover:w-full bg-emerald-400 transition-all duration-500 mx-auto mt-1 rounded-full"></div>
           </Link>
           <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Votre espace de confiance</h1>
           <p className="text-white/50 text-sm font-medium tracking-wide">
             Accédez à votre infrastructure de vente.
           </p>
        </div>

        {/* ── Carte Principal (Glass) ── */}
        <div className="bg-[#0A1A1F]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)] transition-shadow duration-500 animate-[fade-slide-up_0.6s_ease-out_0.2s_both]">
          {/* Lueur supérieure Card */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
          {/* Lueur d'ambiance locale */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none"></div>

          {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-start gap-3 animate-[fade-in_0.3s_ease-out]">
              <AlertTriangle className="shrink-0 mt-0.5 w-4 h-4" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Bouton Google */}
          <form action={signInWithGoogle} className="mb-6 relative z-10 animate-[fade-slide-up_0.6s_ease-out_0.3s_both]">
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
              Continuer avec Google
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6 opacity-60 animate-[fade-slide-up_0.6s_ease-out_0.35s_both]">
            <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1"></div>
            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">ou identifiants</span>
            <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1"></div>
          </div>

          <form action={signIn} className="space-y-4 relative z-10">
            <div className="group/input animate-[fade-slide-up_0.6s_ease-out_0.4s_both]">
              <label htmlFor="emailOrPhone" className="block text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
                Identifiant
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-white/30 group-focus-within/input:text-emerald-400 transition-colors" />
                </div>
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="text"
                  placeholder="Email ou Téléphone"
                  required
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
                />
              </div>
            </div>

            <div className="group/input animate-[fade-slide-up_0.6s_ease-out_0.48s_both]">
              <label htmlFor="password" className="flex items-center justify-between text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
                <span>Mot de passe</span>
                <Link href="/auth/reset-password" className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-wider">Oublié ?</Link>
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                required
                iconLeft={<Lock className="w-5 h-5 text-white/30 group-focus-within/input:text-emerald-400 transition-colors" />}
                className="w-full py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
              />
            </div>

            <div className="pt-2 animate-[fade-slide-up_0.6s_ease-out_0.56s_both]">
               <button
                 type="submit"
                 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#021f15] font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] transform active:scale-[0.98] group/btn"
               >
                 Accéder au système
                 <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-sm text-white/40 mt-8 font-medium animate-[fade-slide-up_0.6s_ease-out_0.64s_both]">
          Démarrer une nouvelle activité ?{' '}
          <Link href="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline decoration-emerald-400/30 hover:decoration-emerald-400 underline-offset-4">
            Rejoignez-nous
          </Link>
        </p>
      </div>
    </main>
  )
}
