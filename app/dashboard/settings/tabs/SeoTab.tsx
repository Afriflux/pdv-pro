'use client'

import React, { useState } from 'react'
import { CheckCircle2, Loader2, Globe, Search, BarChart3, Fingerprint, RefreshCcw } from 'lucide-react'
import * as Actions from '@/app/actions/settings'
import { toast } from '@/lib/toast'

export function SeoTab({ store }: { store: Record<string, any> }) {
  const [seoTitle, setSeoTitle] = useState(store?.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(store?.seo_description || '')
  
  const [metaPixelId, setMetaPixelId] = useState(store?.meta_pixel_id || '')
  const [metaCapiToken, setMetaCapiToken] = useState(store?.meta_capi_token || '')
  const [tiktokPixelId, setTiktokPixelId] = useState(store?.tiktok_pixel_id || '')
  const [googleTagId, setGoogleTagId] = useState(store?.google_tag_id || '')

  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Actions.updateSEO({ 
        seo_title: seoTitle,
        seo_description: seoDescription,
        meta_pixel_id: metaPixelId,
        meta_capi_token: metaCapiToken,
        tiktok_pixel_id: tiktokPixelId,
        google_tag_id: googleTagId
      })
      toast.success('Paramètres SEO et Tracking mis à jour avec succès')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const generatedPreviewTitle = seoTitle || store?.name || "Votre Boutique"
  const generatedPreviewDescription = seoDescription || store?.description?.substring(0, 150) || "Découvrez nos meilleurs produits et offrez-vous une expérience unique sur notre boutique officielle."

  return (
    <form onSubmit={onSubmit} className="animate-in fade-in zoom-in-95 duration-700 relative w-full xl:col-span-3">
      {/* 🌟 Master Container Glassmorphism 🌟 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative p-8 sm:p-12">
        
        {/* Titre & Statut */}
        <div className="pb-8 space-y-2 border-b border-gray-100 mb-8">
          <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100 shadow-inner">
            <Search size={32} strokeWidth={2} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Référencement & Tracking
          </h2>
          <p className="text-[15px] text-gray-500 font-medium">Contrôlez la façon dont votre boutique apparaît sur Google et branchez vos pixels publicitaires.</p>
        </div>

        {/* Section Google SEO Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full mb-10">
          
          <div className="space-y-6">
            <div>
              <label className="text-[14px] font-black text-gray-900 flex items-center gap-2 mb-2">
                <Globe size={16} className="text-indigo-600" /> Titre de la page (SEO)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Ex: Ma Boutique • Vêtements de luxe à Dakar"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-gray-900 font-medium placeholder:text-gray-400"
                maxLength={60}
              />
              <p className="text-[12px] text-gray-400 font-medium mt-2 text-right">{seoTitle.length}/60 recommandés</p>
            </div>

            <div>
              <label className="text-[14px] font-black text-gray-900 flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-indigo-600" /> Meta Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Décrivez en 1 ou 2 phrases ce que vous vendez. Cela s'affichera sous le titre bleu dans Google..."
                rows={4}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-gray-900 font-medium placeholder:text-gray-400 resize-none"
                maxLength={160}
              />
              <p className="text-[12px] text-gray-400 font-medium mt-2 text-right">{seoDescription.length}/160 recommandés</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200/50 flex flex-col items-start justify-center relative overflow-hidden">
             {/* Filigrane Google Desktop */}
             <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200/80 p-5 font-sans relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">G</div>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-[#202124] leading-none">yayyam.com</span>
                    <span className="text-[12px] text-[#202124] leading-none mt-1 opacity-70">https://yayyam.com/{store?.slug || 'boutique'}</span>
                  </div>
                </div>
                <h3 className="text-[20px] text-[#1a0dab] group-hover:underline cursor-pointer leading-[1.3] truncate max-w-[280px] sm:max-w-full">
                  {generatedPreviewTitle}
                </h3>
                <p className="text-[14px] text-[#4d5156] mt-1.5 leading-[1.58] line-clamp-2 break-words">
                  {generatedPreviewDescription}
                </p>
             </div>
             <p className="text-center text-[12px] font-bold text-gray-400 uppercase tracking-widest w-full mt-4 flex items-center justify-center gap-2"><RefreshCcw size={12} /> Aperçu Google en direct</p>
          </div>

        </div>

        {/* Section Pixels de Tracking */}
        <div className="pt-8 border-t border-gray-100/80">
           <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Fingerprint size={20} className="text-emerald-600" /> Tracking Publicitaire</h3>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Meta Pixel */}
              <div className="bg-white border text-center border-gray-200/60 p-5 rounded-[1.5rem] shadow-sm hover:border-blue-400/50 group transition-all duration-300">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-600 flex items-center justify-center rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
                </div>
                <h4 className="font-bold text-gray-900 text-[14px] mb-1">Pixel Meta</h4>
                <p className="text-[12px] text-gray-500 mb-3">Facebook & Instagram Ads</p>
                <input 
                  type="text" 
                  value={metaPixelId} 
                  onChange={(e) => setMetaPixelId(e.target.value)} 
                  placeholder="ID du Pixel" 
                  className="w-full text-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
                <input 
                  type="password" 
                  value={metaCapiToken} 
                  onChange={(e) => setMetaCapiToken(e.target.value)} 
                  placeholder="Token API (CAPI)" 
                  className="w-full text-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* TikTok Pixel */}
              <div className="bg-white border text-center border-gray-200/60 p-5 rounded-[1.5rem] shadow-sm hover:border-gray-800/50 group transition-all duration-300">
                <div className="w-10 h-10 mx-auto bg-gray-100 text-gray-900 flex items-center justify-center rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.351c-.01 3.235-2.181 5.992-5.351 6.505-1.144.185-2.316.035-3.376-.407-1.155-.483-2.138-1.353-2.73-2.457-.594-1.11-.789-2.417-.552-3.666.23-1.217.88-2.31 1.83-3.111 1.05-.884 2.45-1.341 3.82-1.282V14.92c-.75-.02-1.5.17-2.14.56-.63.39-1.13.98-1.4 1.67-.27.7-.27 1.48 0 2.18.28.71.79 1.31 1.43 1.69.64.38 1.41.56 2.15.51.74-.04 1.44-.3 2.01-.73.57-.43 1.01-1.02 1.25-1.7.23-.69.24-1.44.02-2.14-.14-.42-.36-.81-.66-1.14V.02z"/></svg>
                </div>
                <h4 className="font-bold text-gray-900 text-[14px] mb-1">Pixel TikTok</h4>
                <p className="text-[12px] text-gray-500 mb-3">Tiktok Ads Tracking</p>
                <input 
                  type="text" 
                  value={tiktokPixelId} 
                  onChange={(e) => setTiktokPixelId(e.target.value)} 
                  placeholder="ID du Pixel" 
                  className="w-full text-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-gray-800"
                />
              </div>

              {/* Google Tag */}
              <div className="bg-white border text-center border-gray-200/60 p-5 rounded-[1.5rem] shadow-sm hover:border-orange-400/50 group transition-all duration-300">
                <div className="w-10 h-10 mx-auto bg-orange-50 text-orange-600 flex items-center justify-center rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"/></svg>
                </div>
                <h4 className="font-bold text-gray-900 text-[14px] mb-1">Google Tag</h4>
                <p className="text-[12px] text-gray-500 mb-3">Google Analytics 4 & Ads</p>
                <input 
                  type="text" 
                  value={googleTagId} 
                  onChange={(e) => setGoogleTagId(e.target.value)} 
                  placeholder="G-XXXXXX" 
                  className="w-full text-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
           </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="mt-10 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-[15px] shadow-[0_8px_20px_rgb(79,70,229,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto hover:scale-[1.02]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Appliquer les paramètres
          </button>
        </div>

      </div>
    </form>
  )
}
