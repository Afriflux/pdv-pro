'use client'

import React from 'react'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/app/auth/actions'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Lock,
  User,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

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

  // ── Animations ──
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center font-body bg-[#02120C] overflow-hidden px-4 md:px-0">
      
      {/* ── Background Cinématique ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
        {/* Glow Top Left */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"
        />
        {/* Glow Bottom Right */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], x: [0, -50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[130px] translate-y-1/3 translate-x-1/3"
        />
        {/* Ligne Laser Sweep */}
        <motion.div 
           initial={{ top: '-10%', opacity: 0 }}
           animate={{ top: '110%', opacity: [0, 0.5, 0.5, 0] }}
           transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
           className="absolute left-[10%] w-[1px] h-[20%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent blur-[2px]"
        />
      </div>

      {/* ── Bouton Retour ── */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute top-6 left-6 z-50"
      >
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group px-3 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 backdrop-blur-md">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium hidden sm:inline tracking-wide">Retour</span>
        </Link>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md my-12"
      >
        {/* Entête */}
        <motion.div variants={itemVariants} className="text-center mb-10">
           <Link href="/" className="inline-block text-4xl font-display font-black text-white hover:opacity-80 transition drop-shadow-sm tracking-tight mb-5 group">
             Yayyam<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 drop-shadow-md">Pro</span>
             <div className="h-[2px] w-0 group-hover:w-full bg-emerald-400 transition-all duration-500 mx-auto mt-1 rounded-full"></div>
           </Link>
           <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Espace d'élite</h1>
           <p className="text-white/50 text-sm font-medium tracking-wide">
             Accédez à votre infrastructure de vente.
           </p>
        </motion.div>

        {/* ── Carte Principal (Glass) ── */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.15)' }}
          className="bg-[#0A1A1F]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden"
        >
          {/* Lueur supérieure Card */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
          {/* Lueur d'ambiance locale */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none"></div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5 w-4 h-4" />
              <span className="font-medium">{errorMsg}</span>
            </motion.div>
          )}

          {/* Bouton Google */}
          <motion.form variants={itemVariants} action={signInWithGoogle} className="mb-6 relative z-10">
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
          </motion.form>

          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6 opacity-60">
            <div className="h-px bg-gradient-to-r from-transparent to-white/20 flex-1"></div>
            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">ou identifiants</span>
            <div className="h-px bg-gradient-to-l from-transparent to-white/20 flex-1"></div>
          </motion.div>

          <form action={signIn} className="space-y-4 relative z-10">
            <motion.div variants={itemVariants} className="group/input">
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
            </motion.div>

            <motion.div variants={itemVariants} className="group/input">
              <label htmlFor="password" className="flex items-center justify-between text-[11px] font-black text-emerald-400/70 mb-1.5 uppercase tracking-widest group-focus-within/input:text-emerald-400 transition-colors">
                <span>Mot de passe</span>
                <Link href="/auth/reset-password" className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-wider">Oublié ?</Link>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/30 group-focus-within/input:text-emerald-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm shadow-inner hover:border-white/10 hover:bg-black/50"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
               <button
                 type="submit"
                 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#021f15] font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] transform active:scale-[0.98] group/btn"
               >
                 Accéder au système
                 <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </motion.div>
          </form>
        </motion.div>
        
        <motion.p variants={itemVariants} className="text-center text-sm text-white/40 mt-8 font-medium">
          Démarrer une nouvelle activité ?{' '}
          <Link href="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline decoration-emerald-400/30 hover:decoration-emerald-400 underline-offset-4">
            Rejoignez-nous
          </Link>
        </motion.p>
      </motion.div>
    </main>
  )
}
