'use client'

import React from 'react'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'
import {
  ArrowLeft
} from 'lucide-react'

interface RegisterPageProps {
  searchParams: { error?: string; plan?: string; msg?: string }
}

const errorMessages: Record<string, string> = {
  champs_requis: 'Nom, téléphone, email et mot de passe sont obligatoires.',
  auth_error:    'Erreur lors de la création du compte.',
  profil_error:  'Erreur création du profil.',
  store_error:   'Erreur création de la boutique.'
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const errorKey = searchParams.error
  const fullMsg  = searchParams.msg
  const baseMsg  = errorKey ? (errorMessages[errorKey] ?? 'Une erreur est survenue.') : null
  const errorMsg = baseMsg ? (fullMsg ? `${baseMsg} Détail : ${fullMsg}` : baseMsg) : null

  return (
    <main className="min-h-screen relative flex items-center justify-center font-body bg-[#02120C] overflow-hidden px-4 md:px-0 py-12">
      
      {/* ── Background Cinématique (CSS animations) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 animate-[glow-pulse_15s_linear_infinite]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[130px] translate-y-1/3 translate-x-1/3 animate-[glow-drift_20s_ease-in-out_infinite]" />
        <div className="absolute right-[10%] w-[1px] h-[20%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent blur-[2px] animate-[laser-sweep_12s_linear_1s_infinite]" />
      </div>

      {/* ── Bouton Retour ── */}
      <div className="absolute top-6 left-6 z-50 animate-[fade-slide-right_0.8s_ease-out_0.5s_both]">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group px-3 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 backdrop-blur-md">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium hidden sm:inline tracking-wide">Retour</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-xl animate-[fade-in_0.6s_ease-out_both]">
        {/* Entête Carte */}
        <div className="text-center mb-8 animate-[fade-slide-up_0.6s_ease-out_0.1s_both]">
          <Link href="/" className="inline-block text-4xl font-display font-black text-white hover:opacity-80 transition drop-shadow-sm tracking-tight mb-4 group">
            Yayyam<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 drop-shadow-md">Pro</span>
            <div className="h-[2px] w-0 group-hover:w-full bg-emerald-400 transition-all duration-500 mx-auto mt-1 rounded-full"></div>
          </Link>
          <h1 className="font-display font-black text-3xl text-white mb-2 tracking-tight">Lancez-vous. On vous couvre.</h1>
          <p className="text-white/50 text-sm font-medium tracking-wide">
             Créez votre boutique en ligne gratuitement en moins de 2 minutes.
          </p>
        </div>

        <div className="animate-[fade-slide-up_0.6s_ease-out_0.2s_both]">
          <RegisterForm errorMsg={errorMsg} />
        </div>
        
      </div>
    </main>
  )
}
