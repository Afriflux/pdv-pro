'use client'

import React, { useState } from 'react'
import { AlertTriangle, ShieldCheck, Lock, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'

export function SecurityTab({ profile }: { profile: any }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Saisissez votre mot de passe actuel')
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }
    if (password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email ?? '',
        password: currentPassword,
      })
      if (signInError) {
        setPasswordError('Mot de passe actuel incorrect')
        setLoading(false)
        return
      }

      await Actions.updatePassword(password)
      toast.success('Mot de passe modifié avec succès')

      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER CYBER-SECURITY (Gradients Emerald/Slate Profonds) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#020617] overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#022C22] via-[#020617] to-[#064E3B] opacity-90"></div>
          
          {/* Motifs de sécurité */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #10B981 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(16,185,129,0.15)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Renforcer la sécurité
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-[#020617] to-emerald-950 flex items-center justify-center relative border border-emerald-900/50">
                  <div className="absolute inset-0 bg-emerald-500/10 animate-pulse duration-1000"></div>
                  <Lock size={56} strokeWidth={1} className="text-emerald-400 group-hover:scale-110 transition-transform duration-700 relative z-10" />
                </div>
              </div>
            </div>

            {/* Banner Explicatif Warning */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6 text-sm rounded-2xl border border-amber-200/50 shadow-inner flex items-start gap-4 max-w-lg mb-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-orange-400"></div>
              <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgb(251,191,36,0.2)] text-amber-600 shrink-0 group-hover:rotate-12 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="font-black text-amber-950 text-[15px] mb-1">Ne partagez jamais vos accès</p>
                <p className="text-amber-800/80 font-medium leading-relaxed">
                  L'équipe de support Yayyam ne vous demandera jamais votre mot de passe. Utilisez une combinaison complexe et unique.
                </p>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Sécurité & Accès
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                <ShieldCheck size={14} /> Chiffrement Actif
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Contrôlez l'accès critique à votre boutique et à votre argent.</span>
            </div>
          </div>

          {/* === FORM FIELDS EN CARTES GLASS === */}
          <div className="flex flex-col gap-6 w-full max-w-3xl">

            {passwordError && (
              <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200 text-red-600 text-[14px] font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                {passwordError}
              </div>
            )}
            
            {/* Actuel */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-gray-400"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center focus-within:ring-2 focus-within:ring-gray-400/20 focus-within:border-gray-400 transition-all">
                <div className="w-12 h-12 rounded-[1rem] bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  <KeyRound size={20} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <label className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-2 block">Mot de passe actuel</label>
                  <input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/80 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 shadow-sm text-[15px] font-bold text-gray-900 placeholder:text-gray-300 font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Séparateur pour nouveau mdp */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Nouveau Mot de passe</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Nouveau */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-emerald-500"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all">
                <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Lock size={20} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <label className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-2 block">Saisissez un nouveau mot de passe</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/80 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-sm text-[15px] font-bold text-gray-900 placeholder:text-gray-300 font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Confirmer */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-500 bg-emerald-500"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-[1.2rem] border border-gray-200/80 p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all">
                <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <label className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-2 block">Confirmez le nouveau mot de passe</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/80 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-sm text-[15px] font-bold text-gray-900 placeholder:text-gray-300 font-mono tracking-widest"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Bouton de sauvegarde inférieur (Fix visibilité) */}
          <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              Renforcer la sécurité
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
