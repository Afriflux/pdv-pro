'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Loader2, Palette, Paintbrush, Image as ImageIcon, Trash2, Camera, DownloadCloud } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'

export function AppearanceTab({ store }: { store: Record<string, any> }) {
  const [primaryColor, setPrimaryColor] = useState(store?.primary_color ?? '#0F7A60')
  const [colorInput, setColorInput] = useState(store?.primary_color ?? '#0F7A60')
  const [logoPreview, setLogoPreview] = useState<string | null>(store?.logo_url || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(store?.banner_url || null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (type === 'logo') {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    } else {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let finalLogo = store?.logo_url || null
      if (logoFile && store?.id) {
        const ext = logoFile.name.split('.').pop()
        finalLogo = await uploadFile(logoFile, 'logos', `${store.id}/logo_${Date.now()}.${ext}`)
      }

      let finalBanner = store?.banner_url || null
      if (bannerFile && store?.id) {
        const ext = bannerFile.name.split('.').pop()
        finalBanner = await uploadFile(bannerFile, 'banners', `${store.id}/banner_${Date.now()}.${ext}`)
      } else if (bannerPreview === null) {
        finalBanner = null
      }

      await Actions.updateAppearance({ 
        logoUrl: finalLogo, 
        primaryColor,
        bannerUrl: finalBanner ?? null
      })
      toast.success('Apparence mise à jour avec succès')
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  // Helper pour s'assurer que primaryColor est valide avant de l'injecter dans le style
  const safeColor = /^#[0-9A-F]{6}$/i.test(primaryColor) ? primaryColor : '#0F7A60'

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        
        {/* === HEADER / BANNER DYNAMIQUE === */}
        {/* eslint-disable-next-line */}
        <div 
          className="h-48 sm:h-72 w-full relative overflow-hidden transition-colors duration-700" 
          ref={el => { if (el) el.style.backgroundColor = safeColor; }}
        >
          {/* Gradients Flous Complexes Héroïques (Adaptatifs) */}
          <div className="absolute inset-0 bg-black/20 mix-blend-overlay transition-opacity duration-700"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-pulse duration-[10000ms] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay pointer-events-none"></div>

          {/* Top Actions flottantes */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-[14px] shadow-[0_0_20px_rgb(255,255,255,0.15)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Appliquer le thème
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-12 pb-12 relative z-10 w-full">
          
          {/* === ICON OVERLAP === */}
          <div className="relative -mt-16 sm:-mt-24 mb-6">
            <div className="relative group max-w-fit">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                {/* eslint-disable-next-line */}
                <div 
                  className="w-full h-full rounded-[1.5rem] overflow-hidden flex items-center justify-center relative border border-gray-100/50 transition-colors duration-700"
                  ref={el => { if (el) el.style.backgroundColor = `${safeColor}10`; }}
                >
                  {/* eslint-disable-next-line */}
                  <Palette size={56} strokeWidth={1} style={{ color: safeColor }} className="group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
            
          {/* Titre & Statut */}
          <div className="pb-8 space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Identité Visuelle
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line */}
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 font-bold text-[12px] rounded-full uppercase tracking-wide transition-colors duration-700"
                ref={el => { if (el) { el.style.backgroundColor = `${safeColor}15`; el.style.color = safeColor; el.style.border = `1px solid ${safeColor}30`; } }}
              >
                <Palette size={14} /> Aperçu en direct
              </span>
              <span className="text-[14px] text-gray-500 font-medium">Démarquez la vitrine avec vos couleurs de marque et vos logos.</span>
            </div>
          </div>

          {/* === FORM FIELDS EN CARTES GLASS === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* Carte Logo */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:bg-white/60 transition-all duration-500 group">
              <div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <ImageIcon size={18} style={{ color: safeColor }} /> Logo de la boutique
                </h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">
                  Image carrée ou rectangulaire (fond transparent PNG recommandé).
                </p>
              </div>

              <div className="mt-auto relative w-full h-40 rounded-2xl border-2 border-dashed border-gray-200/80 bg-white/50 hover:bg-white/80 transition-all flex flex-col items-center justify-center overflow-hidden group/upload">
                {logoPreview ? (
                  <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={logoPreview} alt="Logo" fill unoptimized className="object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover/upload:scale-105" />
                ) : (
                  <>
                    <div className="w-14 h-14 bg-gray-50 shadow-sm rounded-full flex items-center justify-center text-gray-400 mb-3 group-hover/upload:scale-110 transition-transform duration-500">
                      <Camera size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-[14px] font-bold text-gray-600">Choisir un fichier</p>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Max 2MB</p>
                  </>
                )}
                
                <input 
                  type="file" 
                  title="Téléverser le logo"
                  aria-label="Téléverser le logo"
                  accept="image/png, image/jpeg, image/webp" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileChange(e, 'logo')}
                />
                
                {logoPreview && (
                  <button 
                    type="button"
                    title="Supprimer le logo"
                    aria-label="Supprimer le logo"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogoPreview(null); setLogoFile(null); }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm border border-red-100 text-red-600 hover:bg-red-50 rounded-lg shadow-sm z-20 hover:scale-105 transition-all opacity-0 group-hover/upload:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Carte Couleur Primaire */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:bg-white/60 transition-all duration-500 group">
              <div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Palette size={18} style={{ color: safeColor }} /> Couleur Dominante
                </h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">
                  Utilisée pour les boutons d'achat, les accents et l'interface client.
                </p>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-[1.2rem] p-1.5 shadow-sm items-center relative group/color focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <div className="relative w-12 h-12 rounded-[0.9rem] overflow-hidden shadow-inner border border-black/5 shrink-0 transition-transform duration-300 group-hover/color:scale-105">
                    <input 
                      type="color" 
                      title="Choisir la couleur dominante"
                      aria-label="Choisir la couleur dominante"
                      value={primaryColor} 
                      onChange={(e) => {
                        setPrimaryColor(e.target.value)
                        setColorInput(e.target.value)
                      }}
                      className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer p-0 border-0" 
                    />
                  </div>
                  <input 
                    type="text" 
                    title="Saisir l'hexadécimal de la couleur dominante"
                    aria-label="Saisir l'hexadécimal de la couleur dominante"
                    value={colorInput} 
                    onChange={(e) => {
                      setColorInput(e.target.value)
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) setPrimaryColor(e.target.value)
                    }}
                    className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-[15px] font-black text-gray-700 uppercase tracking-wider font-mono placeholder:text-gray-300"
                    placeholder="#0F7A60"
                  />
                </div>

                {/* Live Preview Btn */}
                {/* eslint-disable-next-line */}
                <div 
                  className="w-full py-4 px-4 rounded-[1rem] flex items-center justify-center font-bold text-white shadow-lg transition-transform hover:scale-[1.02] cursor-default select-none text-center text-sm md:text-base leading-tight"
                  ref={el => { if (el) { el.style.backgroundColor = safeColor; el.style.boxShadow = `0 8px 25px -4px ${safeColor}60`; } }}
                >
                  <span className="flex items-center justify-center gap-2 flex-wrap">Votre bouton ressemblera à ça <CheckCircle2 size={16} className="shrink-0" /></span>
                </div>
              </div>
            </div>

            {/* Carte Bannière */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-gray-200/50 p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:bg-white/60 transition-all duration-500 group">
              <div>
                <h4 className="text-[16px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <ImageIcon size={18} style={{ color: safeColor }} /> Bannière Promotionnelle
                </h4>
                <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed">
                  S'affiche tout en haut de votre page de vente. Idéal pour annoncer les offres en cours (Format horizontal 1200x400).
                </p>
              </div>

              <div className="relative w-full h-48 sm:h-64 rounded-[1.5rem] border-2 border-dashed border-gray-300/80 bg-gradient-to-br from-gray-50/50 to-white hover:bg-gray-50/80 transition-all flex flex-col items-center justify-center overflow-hidden group/upload shadow-inner">
                {bannerPreview ? (
                  <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={bannerPreview} alt="Bannière" fill unoptimized className="object-cover transition-transform duration-700 group-hover/upload:scale-105" />
                ) : (
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-400 mb-4 group-hover/upload:scale-110 group-hover/upload:-translate-y-2 transition-all duration-500">
                      <DownloadCloud size={28} strokeWidth={1.5} />
                    </div>
                    <p className="text-[16px] font-black text-gray-700">Déposer l'image ou cliquer</p>
                    <p className="text-[12px] font-bold text-gray-400 mt-1 uppercase tracking-widest">JPEG, PNG • Max 5MB</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  title="Téléverser la bannière"
                  aria-label="Téléverser la bannière"
                  accept="image/png, image/jpeg, image/webp" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileChange(e, 'banner')}
                />
                
                {bannerPreview && (
                  <button 
                    type="button"
                    title="Supprimer la bannière"
                    aria-label="Supprimer la bannière"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBannerPreview(null); setBannerFile(null); }}
                    className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md border border-red-100 text-red-600 hover:bg-red-50 rounded-xl shadow-lg z-20 hover:scale-110 transition-all opacity-0 group-hover/upload:opacity-100"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                )}
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Paintbrush size={18} />}
              Appliquer le thème
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
