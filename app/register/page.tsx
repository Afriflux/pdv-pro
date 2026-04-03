'use client'

import React from 'react'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'
import { motion } from 'framer-motion'
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

  // ── Animations ──
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center font-body bg-[#02120C] overflow-hidden px-4 md:px-0 py-12">
      
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
           transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1 }}
           className="absolute right-[10%] w-[1px] h-[20%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent blur-[2px]"
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
        className="relative z-10 w-full max-w-xl"
      >
        {/* Entête Carte */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Link href="/" className="inline-block text-4xl font-display font-black text-white hover:opacity-80 transition drop-shadow-sm tracking-tight mb-4 group">
            PDV<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 drop-shadow-md">Pro</span>
            <div className="h-[2px] w-0 group-hover:w-full bg-emerald-400 transition-all duration-500 mx-auto mt-1 rounded-full"></div>
          </Link>
          <h1 className="font-display font-black text-3xl text-white mb-2 tracking-tight">Le Futur du Commerce</h1>
          <p className="text-white/50 text-sm font-medium tracking-wide">
             Générez votre espace de vente en ligne souverain en moins de 2 minutes.
          </p>
        </motion.div>

        {/* Le formulaire (qui contient ses propres motion framer si besoin, mais va hériter de l'apparition) */}
        <motion.div variants={itemVariants}>
          <RegisterForm errorMsg={errorMsg} />
        </motion.div>
        
      </motion.div>
    </main>
  )
}
