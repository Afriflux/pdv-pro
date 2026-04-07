'use client'

import React, { useState } from 'react'
import { Check, Loader2, Zap, Save, HelpCircle, ShieldCheck } from 'lucide-react'
import { savePixelsConfigAction } from './actions'
import { useRouter } from 'next/navigation'

interface Props {
  initialConfig: {
    meta_pixel_id: string | null
    meta_capi_token: string | null
    tiktok_pixel_id: string | null
    google_tag_id: string | null
  }
}

export default function ServerSidePixelsControls({ initialConfig }: Props) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    meta_pixel_id: initialConfig.meta_pixel_id || '',
    meta_capi_token: initialConfig.meta_capi_token || '',
    tiktok_pixel_id: initialConfig.tiktok_pixel_id || '',
    google_tag_id: initialConfig.google_tag_id || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    const res = await savePixelsConfigAction({
      meta_pixel_id: form.meta_pixel_id,
      meta_capi_token: form.meta_capi_token,
      tiktok_pixel_id: form.tiktok_pixel_id,
      google_tag_id: form.google_tag_id,
    })

    setLoading(false)
    if (res.success) {
      setSuccessMsg("Configuration sauvegardée avec succès.")
      router.refresh()
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      setErrorMsg(res.error || "Erreur lors de la sauvegarde")
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      
      {/* HEADER EXPLANATION */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-indigo-50 shrink-0">
             <Zap size={32} className="text-indigo-600 drop-shadow-md" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-indigo-950 flex items-center gap-2">
              Suivi Server-Side API <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">Pro</span>
            </h2>
            <p className="text-sm font-medium text-indigo-900/80 mt-1 max-w-2xl leading-relaxed">
              En raison de la mise à jour iOS 14+ et des AdBlockers, les pixels classiques ratent jusqu'à 60% de vos ventes. Le <b>Server-Side Tracking</b> contourne ces restrictions en envoyant l'événement directement depuis notre serveur.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="bg-emerald-100 p-1 rounded-full"><Check size={16} /></div> 
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* META / FACEBOOK */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-[24px] p-6 space-y-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                 <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                 </svg>
               </div>
               <div>
                  <h3 className="font-bold text-gray-900 leading-tight">Meta (Facebook/Insta)</h3>
                  <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Pixel + API Conversions</p>
               </div>
             </div>
          </div>
          
          <div className="space-y-4">
             <div>
               <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">ID du Meta Pixel</label>
               <input 
                 type="text" 
                 name="meta_pixel_id"
                 value={form.meta_pixel_id}
                 onChange={handleChange}
                 placeholder="ex: 123456789101112"
                 className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
               />
             </div>
             
             <div className="relative">
               <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase flex items-center gap-1">
                 CAPI Access Token <ShieldCheck size={14} className="text-emerald-500" />
               </label>
               <input 
                 type="password" 
                 name="meta_capi_token"
                 value={form.meta_capi_token}
                 onChange={handleChange}
                 placeholder="Généré via Facebook Events Manager"
                 className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
               />
               <p className="text-[10px] text-gray-400 font-medium mt-2 leading-relaxed">
                 Assure un Tracking d'achats fiable à 99% en Server-to-Server sans dépendre du navigateur.
               </p>
             </div>
          </div>
        </div>

        {/* TIKTOK */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-[24px] p-6 space-y-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-300 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-inner">
                 <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12.525.02c1.31-.02 2.61-.01 3.91 0 .08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.58-1.54 5.16-3.86 6.55-2.43 1.46-5.59 1.55-8.12.35-2.58-1.2-4.51-3.69-4.83-6.5-.32-2.92 1.05-5.91 3.4-7.61 2.05-1.48 4.74-1.89 7.15-1.19v4.06c-1.25-.43-2.65-.34-3.81.3-1.27.7-2.15 2.1-2.09 3.55.05 1.51.99 2.93 2.38 3.53 1.48.65 3.28.46 4.58-.58 1.13-.91 1.77-2.35 1.77-3.8-.02-5.41-.01-10.82-.01-16.23Z"/>
                 </svg>
               </div>
               <div>
                  <h3 className="font-bold text-gray-900 leading-tight">TikTok</h3>
                  <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Pixel de Suivi</p>
               </div>
             </div>
          </div>
          
          <div className="space-y-4 flex-1">
             <div>
               <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">ID du Pixel TikTok</label>
               <input 
                 type="text" 
                 name="tiktok_pixel_id"
                 value={form.tiktok_pixel_id}
                 onChange={handleChange}
                 placeholder="ex: CABCDEF12345678"
                 className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
               />
             </div>
          </div>
        </div>

        {/* GOOGLE TAG MANAGER */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-[24px] p-6 space-y-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-300 md:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-inner">
                 <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-15v4H7v2h4v4h2v-4h4v-2h-4V7h-2z"/>
                 </svg>
               </div>
               <div>
                  <h3 className="font-bold text-gray-900 leading-tight">Google Analytics / GTM</h3>
                  <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mt-0.5">ID Google Tag</p>
               </div>
             </div>
          </div>
          
          <div className="space-y-4 max-w-md">
             <div>
               <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase flex items-center gap-1">
                 G-${'{TAG_ID}'} Ou GTM-${'{TAG_ID}'}
                 <HelpCircle size={14} className="text-gray-400" />
               </label>
               <input 
                 type="text" 
                 name="google_tag_id"
                 value={form.google_tag_id}
                 onChange={handleChange}
                 placeholder="ex: G-1A2B3C4D5E"
                 className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
               />
               <p className="text-[10px] text-gray-400 font-medium mt-2 leading-relaxed">
                 Déploie l'ID de suivi Google Global Site Tag pour analyser votre trafic via GA4.
               </p>
             </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-indigo-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Sauvegarder Configuration
        </button>
      </div>

    </div>
  )
}
