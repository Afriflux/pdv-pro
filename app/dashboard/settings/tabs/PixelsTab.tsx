'use client'

import React, { useState } from 'react'
import { Target, Loader2, CheckCircle2, Activity, Fingerprint, Facebook, Search } from 'lucide-react'
import * as Actions from '@/app/actions/settings'
import { toast } from 'sonner'

export function PixelsTab({ store }: { store: any }) {
  const [pixels, setPixels] = useState({
    meta_pixel_id: store?.meta_pixel_id || '',
    tiktok_pixel_id: store?.tiktok_pixel_id || '',
    google_tag_id: store?.google_tag_id || ''
  })
  
  const [loading, setLoading] = useState(false)

  const onChange = (key: string, val: string) => setPixels(p => ({ ...p, [key]: val }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Actions.updatePixels(pixels)
      toast.success('Pixels de tracking mis à jour avec succès')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER TECH (Gradients Cyan/Blue Profonds) === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#022C22] overflow-hidden">
          {/* Gradients Héroïques */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F766E] opacity-90"></div>
          
          {/* Grille Tech Background */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(rgba(20, 184, 166, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 184, 166, 0.2) 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }}
          ></div>
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(20,184,166,0.15)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Injecter les Pixels
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-slate-900 to-[#022C22] flex items-center justify-center relative border border-slate-800">
                  <div className="absolute inset-0 bg-teal-500/10 animate-pulse duration-1000"></div>
                  <Target size={56} strokeWidth={1} className="text-teal-400 group-hover:scale-110 transition-transform duration-700 relative z-10" />
                </div>
              </div>
            </div>

            {/* Banner Explicatif */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:p-6 text-sm rounded-2xl border border-emerald-100 shadow-inner flex items-start gap-4 max-w-lg mb-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-400"></div>
              <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <div>
                <p className="font-black text-emerald-950 text-[15px] mb-1">Boostez votre ROI Cible</p>
                <p className="text-emerald-800/80 font-medium leading-relaxed">
                  L'intégration de vos pixels permet aux algorithmes de Meta et TikTok de suivre les visiteurs ("ViewContent") et d'optimiser l'apprentissage publicitaire ("Purchase").
                </p>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-10 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Tracking & Analytiques
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[12px] rounded-full border border-slate-200 uppercase tracking-wide">
                <Fingerprint size={14} /> Pixels Actifs
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Connectez vos ID pour traquer les évènements de conversion de vos clients.</span>
            </div>
          </div>

          {/* === FORM FIELDS EN CARTES GLASS LUMINEUX === */}
          <div className="flex flex-col gap-6 w-full max-w-4xl">
            
            {/* Meta Pixel Card */}
            <div className="bg-white border border-gray-200/60 rounded-[2rem] p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-500 group relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 group-hover:bg-emerald-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 transition-colors duration-500 pointer-events-none"></div>
               
               <div className="flex items-start gap-5 flex-1 w-full relative z-10">
                 <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-500">
                   <Facebook size={28} strokeWidth={1.5} className="text-emerald-600" />
                 </div>
                 <div className="pt-1">
                   <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                     Pixel Meta
                     {pixels.meta_pixel_id && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-in zoom-in">Actif</span>}
                   </h3>
                   <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed max-w-xs xl:max-w-sm">
                     Traquez les conversions Facebook & Insta. Entrez uniquement l'ID numérique.
                   </p>
                 </div>
               </div>

               {/* Input Area (Clean & Bright) */}
               <div className="w-full lg:w-auto lg:min-w-[340px] relative z-10">
                 <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                   <Fingerprint size={16} className={pixels.meta_pixel_id ? "text-emerald-500" : "text-gray-400"} />
                 </div>
                 <input 
                   type="text"
                   value={pixels.meta_pixel_id}
                   onChange={(e) => onChange('meta_pixel_id', e.target.value)}
                   className="w-full bg-gray-50/50 hover:bg-white focus:bg-white px-5 pl-12 py-4 rounded-[1.2rem] border-2 border-gray-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[15px] font-bold text-gray-900 placeholder:text-gray-400 font-mono tracking-widest transition-all duration-300 shadow-sm"
                   placeholder="1029384756"
                 />
               </div>
            </div>

            {/* TikTok Pixel Card */}
            <div className="bg-white border border-gray-200/60 rounded-[2rem] p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-500 group relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/5 group-hover:bg-teal-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 transition-colors duration-500 pointer-events-none"></div>
               
               <div className="flex items-start gap-5 flex-1 w-full relative z-10">
                 <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-500">
                   <span className="font-black font-mono text-3xl text-teal-600 select-none pb-1">t</span>
                 </div>
                 <div className="pt-1">
                   <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                     Pixel TikTok
                     {pixels.tiktok_pixel_id && <span className="bg-teal-100 text-teal-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-in zoom-in">Actif</span>}
                   </h3>
                   <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed max-w-xs xl:max-w-sm">
                     Code alphanumérique pour optimiser vos annonces de contenu court (vidéo).
                   </p>
                 </div>
               </div>

               {/* Input Area (Clean & Bright) */}
               <div className="w-full lg:w-auto lg:min-w-[340px] relative z-10">
                 <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                   <Fingerprint size={16} className={pixels.tiktok_pixel_id ? "text-teal-500" : "text-gray-400"} />
                 </div>
                 <input 
                   type="text"
                   value={pixels.tiktok_pixel_id}
                   onChange={(e) => onChange('tiktok_pixel_id', e.target.value)}
                   className="w-full bg-gray-50/50 hover:bg-white focus:bg-white px-5 pl-12 py-4 rounded-[1.2rem] border-2 border-gray-200 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 text-[15px] font-bold text-gray-900 placeholder:text-gray-400 font-mono tracking-widest transition-all duration-300 shadow-sm"
                   placeholder="CDX123456789ABC"
                 />
               </div>
            </div>

            {/* Google Tag Card */}
            <div className="bg-white border border-gray-200/60 rounded-[2rem] p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-500 group relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 group-hover:bg-emerald-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 transition-colors duration-500 pointer-events-none"></div>
               
               <div className="flex items-start gap-5 flex-1 w-full relative z-10">
                 <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-500">
                   <Search size={26} strokeWidth={2} className="text-emerald-600" />
                 </div>
                 <div className="pt-1">
                   <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                     Google Tag
                     {pixels.google_tag_id && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-in zoom-in">Actif</span>}
                   </h3>
                   <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed max-w-xs xl:max-w-sm">
                     L'identifiant global Ads/Analytics commence généralement par G- ou AW-.
                   </p>
                 </div>
               </div>

               {/* Input Area (Clean & Bright) */}
               <div className="w-full lg:w-auto lg:min-w-[340px] relative z-10">
                 <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                   <Fingerprint size={16} className={pixels.google_tag_id ? "text-emerald-500" : "text-gray-400"} />
                 </div>
                 <input 
                   type="text"
                   value={pixels.google_tag_id}
                   onChange={(e) => onChange('google_tag_id', e.target.value)}
                   className="w-full bg-gray-50/50 hover:bg-white focus:bg-white px-5 pl-12 py-4 rounded-[1.2rem] border-2 border-gray-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[15px] font-bold text-gray-900 placeholder:text-gray-400 font-mono tracking-widest transition-all duration-300 shadow-sm"
                   placeholder="G-XXXXXX890"
                 />
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Injecter les Pixels
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
