// @ts-nocheck
'use client'

import { useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

interface PixelSettingsProps {
  storeId: string
  initialMetaId: string | null
  initialTiktokId: string | null
  initialGoogleTagId: string | null
}

export default function PixelSettings({ storeId, initialMetaId, initialTiktokId, initialGoogleTagId }: PixelSettingsProps) {
  const [metaId, setMetaId] = useState(initialMetaId || '')
  const [tiktokId, setTiktokId] = useState(initialTiktokId || '')
  const [googleTagId, setGoogleTagId] = useState(initialGoogleTagId || '')
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/marketing/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          metaPixelId: metaId,
          tiktokPixelId: tiktokId,
          googleTagId: googleTagId
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] p-8 rounded-3xl shadow-xl border border-gray-800 text-white relative flex flex-col items-center text-center">
        <h2 className="text-3xl font-black mb-2">Audiences & Pixels</h2>
        <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xl">
          Installez vos IDs de tracking pour optimiser vos publicités automatiquement. <strong>Les pixels s'intègrent instantanément et de façon invisible sur toute votre boutique.</strong>
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8 space-y-8">
        
        {/* LIGNE 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-2xl p-5 hover:border-blue-500/30 transition-colors">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" fill="currentColor" height="16" width="16"><path d="M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1.6.3v-10h4.8l.9-5h-5.7v-3.7c0-1.8.4-2.8 2.8-2.8h2.9v-4.6c-.7-.1-1.9-.2-3.4-.2-3.8 0-6.1 2.3-6.1 6.5v4.8h-4.3v5h4.3v10l-1.6-.3z"></path></svg>
               </div>
               <span className="font-bold">Meta Pixel (Facebook/Instagram)</span>
             </div>
             <input
                type="text"
                value={metaId}
                onChange={(e) => setMetaId(e.target.value)}
                placeholder="Ex: 1234567890123456"
                className="w-full bg-[#FAFAF7] border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] outline-none"
              />
          </div>

          <div className="border border-gray-100 rounded-2xl p-5 hover:border-black/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-full bg-gray-50 text-black flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" height="16" width="16"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path></svg>
               </div>
               <span className="font-bold">TikTok Pixel</span>
             </div>
             <input
                type="text"
                value={tiktokId}
                onChange={(e) => setTiktokId(e.target.value)}
                placeholder="Ex: C8BCDXXXXX"
                className="w-full bg-[#FAFAF7] border border-gray-200 focus:border-[#1A1A1A] rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] outline-none"
              />
          </div>
        </div>

        {/* LIGNE 2 */}
        <div className="border border-gray-100 rounded-2xl p-5 hover:border-green-500/30 transition-colors max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl">
                🏷️
             </div>
             <span className="font-bold">Google Tag Manager / Analytics</span>
           </div>
           <input
              type="text"
              value={googleTagId}
              onChange={(e) => setGoogleTagId(e.target.value)}
              placeholder="Ex: GTM-XXXXX"
              className="w-full bg-[#FAFAF7] border border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] outline-none"
            />
        </div>

        <div className="pt-6 border-t border-gray-50 flex flex-col items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-3.5 bg-[#0F7A60] text-white font-black rounded-2xl hover:bg-[#0A5240] transition-colors disabled:opacity-50 shadow-md"
          >
            {isSaving ? 'Enregistrement en cours...' : 'Sauvegarder les ID Pixels'}
          </button>
          
          {saveStatus === 'success' && (
            <span className="text-sm font-bold text-emerald-600 animate-in fade-in">
              ✅ Vos identifiants ont été mis à jour.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
