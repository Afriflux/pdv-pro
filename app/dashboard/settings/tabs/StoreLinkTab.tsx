'use client'

import React, { useState, useEffect } from 'react'
import { Globe, Loader2, CheckCircle2, XCircle, Link as LinkIcon, ArrowUpRight, Copy, Share2 } from 'lucide-react'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'

export function StoreLinkTab({ store }: { store: any }) {
  const [slug, setSlug] = useState(store?.slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [loading, setLoading] = useState(false)
  const baseUrl = 'yayyam.com/'

  const checkSlugDispo = async (val: string) => {
    if (!val || val === store?.slug) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    try {
      const res = await fetch(`/api/check-slug?slug=${val}`)
      const data = await res.json()
      setSlugStatus(data.available ? 'available' : 'taken')
    } catch {
      setSlugStatus('idle')
    }
  }

  useEffect(() => {
    if (!slug || slug === store?.slug) {
      setSlugStatus('idle')
      return
    }
    const timer = setTimeout(() => {
      checkSlugDispo(slug)
    }, 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const handleSlugChange = (val: string) => {
    const formatted = val.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(formatted)
    if (!formatted || formatted === store?.slug) {
      setSlugStatus('idle')
    } else {
      setSlugStatus('checking')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (slugStatus === 'taken' || slugStatus === 'checking') return
    
    setLoading(true)
    try {
      await Actions.updateSlug(slug)
      toast.success('Lien de vente mis à jour')
      setSlugStatus('idle')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${baseUrl}${slug || store?.slug || ''}`)
    toast.success('Lien copié dans le presse-papier')
  }

  const handleShare = async () => {
    const url = `https://${baseUrl}${slug || store?.slug || ''}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: store?.name || 'Boutique Yayyam',
          url: url
        })
      } catch (err) {
        console.error('Erreur partage', err)
      }
    } else {
      handleCopy()
    }
  }

  const isSaveDisabled = slugStatus === 'taken' || slugStatus === 'checking' || slug === store?.slug

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-md md:backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER ABSTRAIT === */}
        <div className="h-48 sm:h-72 w-full relative bg-[#022c22] overflow-hidden">
          {/* Gradients Flous Complexes Héroïques (Emeraude/Teal) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#022c22] to-[#0F766E] opacity-90"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[40px] md:blur-[80px] -translate-y-1/2 translate-x-1/3 md:animate-pulse duration-[10000ms]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-[30px] md:blur-[60px] translate-y-1/2 -translate-x-1/4"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading || isSaveDisabled}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(255,255,255,0.1)] transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Réserver le lien
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative border border-emerald-100/50">
                  <Globe size={56} strokeWidth={1} className="text-emerald-500 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-8 space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Lien de Vente
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-100 uppercase tracking-wide">
                <LinkIcon size={14} /> URL Unique
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Invitez vos clients sur votre propre espace de vente.</span>
            </div>
          </div>

          {/* === FORM FIELDS EN CARTES GLASS === */}
          <div className="flex flex-col gap-6 w-full">
            
            {/* Carte Aperçu du Lien (Card Massive) */}
            <div className="bg-gradient-to-r from-gray-50 to-white backdrop-blur-md rounded-[2rem] border border-gray-200/80 p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-500 group">
              <div className="flex-1 w-full overflow-hidden">
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3">Aperçu en direct</p>
                <div className="flex items-center text-xl sm:text-2xl lg:text-3xl md:text-5xl font-black text-gray-900 truncate tracking-tight">
                  <span className="text-gray-300 select-none">yayyam.com/</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 drop-shadow-sm truncate">
                    {slug || store?.slug || 'votre-boutique'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-[14px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <Copy size={18} /> Copier
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-6 py-3.5 bg-white border border-gray-200 text-emerald-600 hover:bg-emerald-50 rounded-2xl text-[14px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <Share2 size={18} /> Partager
                </button>
                <button 
                  type="button"
                  onClick={() => window.open(`https://yayyam-pro.com/${slug}`, '_blank')}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[14px] font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  Ouvrir <ArrowUpRight size={18} />
                </button>
              </div>
            </div>

            {/* Carte Identifiant (Slug Input) */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-emerald-200/60 hover:bg-white/60 transition-all duration-500 group">
              <div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <LinkIcon size={18} className="text-emerald-500" /> Identifiant de boutique (Slug)
                </h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed max-w-2xl">
                  Choisissez un nom court et mémorable. Seuls les lettres minuscules, les chiffres et les tirets sont autorisés.
                </p>
              </div>
              
              <div className="relative mt-2 max-w-3xl">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[1.2rem] blur opacity-0 focus-within:opacity-20 transition duration-500"></div>
                 
                 <div className="relative flex bg-white/80 border border-gray-200/80 rounded-[1rem] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm overflow-hidden group/input">
                    <span className="px-5 py-4 bg-gray-50/80 border-r border-gray-200/80 text-gray-500 text-[15px] font-bold flex items-center select-none font-mono tracking-tight">
                      yayyam.com/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="flex-1 px-4 py-4 w-full text-[15px] font-black text-gray-900 focus:outline-none placeholder:text-gray-300 placeholder:font-normal bg-transparent pattern-letter-number tracking-tight"
                      placeholder="ma-boutique"
                    />
                    <div className="px-5 flex items-center bg-gray-50/50 border-l border-gray-200/80 backdrop-blur-sm min-w-[120px] justify-center">
                      {slugStatus === 'idle' && <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Neutre</span>}
                      {slugStatus === 'checking' && <span className="text-xs font-black text-emerald-500 animate-pulse flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap"><Loader2 size={12} className="animate-spin" /> Verif...</span>}
                      {slugStatus === 'available' && <span className="text-xs font-black text-teal-600 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap"><CheckCircle2 size={12} /> Libre</span>}
                      {slugStatus === 'taken' && <span className="text-xs font-black text-red-500 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap"><XCircle size={12} /> Indisponible</span>}
                    </div>
                 </div>
                 
                 <div className="mt-10 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading || slug === store?.slug || !(slugStatus === 'available' || slugStatus === 'idle')}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      Sauvegarder l'adresse
                    </button>
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  )
}
