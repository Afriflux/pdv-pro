'use client'

import React, { useState } from 'react'
import { Instagram, Facebook, Youtube, Linkedin, Globe, MessageCircle, Share2, Loader2, CheckCircle2, Link as LinkIcon } from 'lucide-react'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'

export function SocialLinksTab({ store }: { store: any }) {
  const socialConfig = (store?.social_links as Record<string, string>) || {}
  const [socialLinks, setSocialLinks] = useState({
    instagram: socialConfig.instagram || '',
    tiktok: socialConfig.tiktok || '',
    facebook: socialConfig.facebook || '',
    youtube: socialConfig.youtube || '',
    linkedin: socialConfig.linkedin || '',
    whatsapp: socialConfig.whatsapp || '',
    website: socialConfig.website || ''
  })
  
  const [loading, setLoading] = useState(false)

  const onChange = (key: string, val: string) => setSocialLinks(s => ({ ...s, [key]: val }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Actions.updateSocialLinks(socialLinks)
      toast.success('Réseaux sociaux mis à jour avec succès')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  // Configuration visuelle des différents réseaux pour l'UI avec le thème Emerald unifié
  const networks = [
    { id: 'instagram', icon: <Instagram size={22} className="text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />, label: 'Instagram', placeholder: 'https://instagram.com/macompagnie', color: 'bg-emerald-500', focusRing: 'focus-within:ring-emerald-500/20 focus-within:border-emerald-500' },
    { id: 'tiktok', icon: <span className="font-black font-mono text-emerald-600 group-focus-within:text-emerald-500 text-lg transition-colors">t</span>, label: 'TikTok', placeholder: 'https://tiktok.com/@macompagnie', color: 'bg-teal-500', focusRing: 'focus-within:ring-teal-500/20 focus-within:border-teal-500' },
    { id: 'facebook', icon: <Facebook size={22} className="text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />, label: 'Facebook', placeholder: 'https://facebook.com/macompagnie', color: 'bg-emerald-500', focusRing: 'focus-within:ring-emerald-500/20 focus-within:border-emerald-500' },
    { id: 'whatsapp', icon: <MessageCircle size={22} className="text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />, label: 'WhatsApp', placeholder: 'https://wa.me/221770000000', color: 'bg-emerald-500', focusRing: 'focus-within:ring-emerald-500/20 focus-within:border-emerald-500' },
    { id: 'youtube', icon: <Youtube size={22} className="text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />, label: 'YouTube', placeholder: 'https://youtube.com/c/macompagnie', color: 'bg-teal-500', focusRing: 'focus-within:ring-teal-500/20 focus-within:border-teal-500' },
    { id: 'linkedin', icon: <Linkedin size={22} className="text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />, label: 'LinkedIn', placeholder: 'https://linkedin.com/company/macompagnie', color: 'bg-emerald-500', focusRing: 'focus-within:ring-emerald-500/20 focus-within:border-emerald-500' },
    { id: 'website', icon: <Globe size={22} className="text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />, label: 'Site Web (Externe)', placeholder: 'https://www.monsite-vitrine.com', color: 'bg-teal-500', focusRing: 'focus-within:ring-teal-500/20 focus-within:border-teal-500' },
  ]

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER SOCIAL (Gradients Emerald/Teal) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#022C22] overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F766E] opacity-90"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(255,255,255,0.15)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Sauvegarder les liens
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative border border-emerald-100">
                  <Share2 size={56} strokeWidth={1} className="text-emerald-600 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Présence & Réseaux
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                <LinkIcon size={14} /> Connexion Externe
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Reliez vos plateformes pour créer de la confiance et augmenter vos conversions.</span>
            </div>
          </div>

          {/* === GRILLE DES LIENS === */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {networks.map((net) => {
              const val = socialLinks[net.id as keyof typeof socialLinks]
              const hasValue = val.length > 0

              return (
                <div key={net.id} className="group relative">
                  {/* Glow effect discret sous l'input focus */}
                  <div className={`absolute -inset-0.5 rounded-[1.2rem] blur opacity-0 group-focus-within:opacity-30 transition duration-500 ${net.color}`}></div>
                  
                  <div className={`relative flex items-stretch bg-white/60 backdrop-blur-md border border-gray-200/80 rounded-[1rem] shadow-sm transition-all overflow-hidden ${net.focusRing}`}>
                    {/* Zone Icône Gauche */}
                    <div className="w-16 flex-shrink-0 bg-gray-50/80 border-r border-gray-200/80 flex flex-col items-center justify-center gap-1">
                      <div className={`transition-all duration-300 ${hasValue ? 'scale-110' : 'grayscale opacity-70 group-focus-within:grayscale-0 group-focus-within:opacity-100'}`}>
                        {net.icon}
                      </div>
                    </div>
                    
                    {/* Zone Input Droite */}
                    <div className="flex-1 flex flex-col justify-center px-4 py-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">
                        {net.label}
                      </label>
                      <input 
                        type="url"
                        value={val}
                        onChange={(e) => onChange(net.id, e.target.value)}
                        className="w-full bg-transparent focus:outline-none text-[15px] font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                        placeholder={net.placeholder}
                      />
                    </div>

                    {/* Checkmark indicator */}
                    <div className="px-4 flex items-center justify-center pointer-events-none">
                      {hasValue && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Bouton de sauvegarde inférieur (Fix visibilité) */}
          <div className="mt-8 flex justify-end border-t border-gray-200/50 pt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Sauvegarder les liens
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
