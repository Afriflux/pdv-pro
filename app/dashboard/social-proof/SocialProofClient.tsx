'use client'

import { useState } from 'react'
import { BellRing, Save, Power, Check, Eye } from 'lucide-react'
import { toast } from '@/lib/toast'

export function SocialProofClient({ 
  initialActive, 
  initialConfig,
  onToggle,
  onSave
}: { 
  initialActive: boolean
  initialConfig: any
  onToggle: (v: boolean) => Promise<void>
  onSave: (config: any) => Promise<void>
}) {
  const [active, setActive] = useState(initialActive)
  const [config, setConfig] = useState(initialConfig || {
    style: 'modern',
    durationSeconds: 5,
    delaySeconds: 10,
    textTemplate: "{buyer_name} vient d'acheter {product_name}"
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      await onToggle(!active)
      setActive(!active)
      toast.success(active ? 'Preuve sociale désactivée.' : 'Preuve sociale activée !')
    } catch (e: any) {
      toast.error('Erreur lors du changement de statut.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await onSave(config)
      toast.success('Configuration sauvegardée avec succès.')
    } catch (e: any) {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Form */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">

        {/* Global Toggle */}
        <div className="bg-white border text-sm border-gray-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
           <div>
             <h3 className="font-black text-lg text-[#1A1A1A]">Statut du Booster</h3>
             <p className="text-gray-500 font-medium text-sm mt-1">Affichez les ventes récentes sur vos pages pour rassurer vos visiteurs.</p>
           </div>
           <button 
             onClick={handleToggle}
             disabled={loading}
             className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
               active 
                ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' 
                : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600'
             }`}
           >
             {active ? <><Power size={18} /> Désactiver</> : <><Power size={18} /> Activer</>}
           </button>
        </div>

        {/* Configurations */}
        <div className={`bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6 transition-all ${!active ? 'opacity-50 pointer-events-none' : ''}`}>
           <h3 className="text-lg font-black text-[#1A1A1A] border-b border-gray-100 pb-4">Configuration Graphique</h3>

           <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Message Type
              </label>
              <input
                type="text"
                title="Format de notification"
                value={config.textTemplate}
                onChange={(e) => setConfig({...config, textTemplate: e.target.value})}
                placeholder="Ex: {buyer_name} vient d'acheter {product_name}"
                className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-[#1A1A1A] outline-none focus:border-rose-400 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">Variables: <span className="font-bold text-gray-800">{'{buyer_name}'}</span>, <span className="font-bold text-gray-800">{'{product_name}'}</span>, <span className="font-bold text-gray-800">{'{time_ago}'}</span></p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Délai d'apparition (secondes)</label>
                <input
                  type="number"
                  title="Délai apparition"
                  placeholder="10"
                  min="1"
                  value={config.delaySeconds}
                  onChange={(e) => setConfig({...config, delaySeconds: parseInt(e.target.value) || 10})}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-[#1A1A1A] outline-none focus:border-rose-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Durée d'affichage (secondes)</label>
                <input
                  type="number"
                  title="Durée affichage"
                  placeholder="5"
                  min="1"
                  value={config.durationSeconds}
                  onChange={(e) => setConfig({...config, durationSeconds: parseInt(e.target.value) || 5})}
                  className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-[#1A1A1A] outline-none focus:border-rose-400 transition-colors"
                />
              </div>
           </div>

           <button
             onClick={handleSaveConfig}
             disabled={saving || !active}
             className="w-full py-4 mt-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 text-sm shadow-xl"
           >
             <Save size={18} /> Sauvegarder les Réglages
           </button>
        </div>
      </div>

      {/* Simulator Right Column */}
      <div className="w-full lg:w-[40%] flex flex-col">
         <div className="sticky top-6">
            <h3 className="font-black text-lg text-[#1A1A1A] mb-4 flex items-center gap-2"><Eye size={20} className="text-gray-400"/> Aperçu Virtuel</h3>
            
            <div className="h-[400px] border-4 border-[url('/iphone-frame.png')] border-solid bg-[#FAFAF7] rounded-[3rem] p-6 relative overflow-hidden flex items-end shadow-2xl pb-10">
               {/* Faux contenu page */}
               <div className="absolute inset-x-6 top-8 bottom-0 space-y-4 pt-6">
                 <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
                 <div className="w-3/4 h-6 bg-gray-200 rounded-md animate-pulse"></div>
                 <div className="w-full h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                 <div className="w-1/2 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                 <div className="w-full h-40 bg-gray-200 rounded-xl animate-pulse"></div>
               </div>

               {/* La popup de démonstration */}
               <div className={`w-full z-10 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center gap-4 transition-all duration-500 transform ${active ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                    <img src="https://source.unsplash.com/random/100x100/?product,box" alt="Product" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[13px] text-gray-500">{config.textTemplate.replace('{buyer_name}', 'Awa').replace('{product_name}', 'Robe Wax Premium').replace('{time_ago}', '2h')}</p>
                    <p className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1"><Check size={12}/> Achat Vérifié</p>
                  </div>
               </div>
            </div>
            
            <p className="text-xs text-center text-gray-400 font-medium mt-6">Aperçu du comportement sur Mobile de {config.durationSeconds} secondes après un délai de {config.delaySeconds}s.</p>
         </div>
      </div>
    </div>
  )
}
