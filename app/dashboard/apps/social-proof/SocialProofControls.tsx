'use client'

import { useState, useTransition } from 'react'
import { toggleSocialProofAction, saveSocialProofConfigAction } from './actions'
import { toast } from '@/lib/toast'
import { Settings2, Save } from 'lucide-react'

export function SocialProofControls({ 
  initialActive, 
  initialConfig 
}: { 
  initialActive: boolean
  initialConfig: any 
}) {
  const [isActive, setIsActive] = useState(initialActive)
  const [isPending, startTransition] = useTransition()
  
  // Default config
  const parsedConfig = typeof initialConfig === 'string' ? JSON.parse(initialConfig) : (initialConfig || {})
  const [config, setConfig] = useState({
    cycleSeconds: parsedConfig.cycleSeconds || 15,
    displaySeconds: parsedConfig.displaySeconds || 6,
    position: parsedConfig.position || 'bottom-left',
    theme: parsedConfig.theme || 'light',
    useFakeData: parsedConfig.useFakeData || false,
    customMessage: parsedConfig.customMessage || "a acheté"
  })

  const [savingConfig, setSavingConfig] = useState(false)

  const handleToggle = () => {
    const newActiveState = !isActive
    setIsActive(newActiveState)
    startTransition(async () => {
      const res = await toggleSocialProofAction(newActiveState)
      if (res.success) {
        toast.success(newActiveState ? "Pop-ups de vente activés !" : "Pop-ups désactivés.")
      } else {
        toast.error("Une erreur s'est produite au niveau du serveur.")
        setIsActive(!newActiveState)
      }
    })
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    const res = await saveSocialProofConfigAction(config)
    setSavingConfig(false)
    if (res.success) {
      toast.success("Configuration avancée sauvegardée !")
    } else {
      toast.error("Impossible de sauvegarder la configuration.")
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Main Switch ── */}
      <div className="flex md:items-center flex-col md:flex-row justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div className="flex flex-col">
          <span className="font-bold text-[#1A1A1A] text-base">{isActive ? "L'extension est activée" : "L'extension est désactivée"}</span>
          <span className={`text-xs font-medium ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
            {isActive ? "Le système s'affiche sur votre vitrine publique." : "Aucun pop-up ne tourne pour le moment."}
          </span>
        </div>
        
        {/* eslint-disable-next-line */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`${
            isActive ? 'bg-[#0F7A60]' : 'bg-gray-200'
          } relative inline-flex h-8 w-14 shrink-0 appearance-none items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F7A60] focus:ring-offset-2 disabled:opacity-50`}
          role="switch"
          aria-checked={isActive ? 'true' : 'false'}
        >
          <span className="sr-only">Activer Preuve Sociale</span>
          <span
            className={`${
              isActive ? 'translate-x-7' : 'translate-x-1'
            } inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm`}
          />
        </button>
      </div>

      {/* ── Advanced Configuration (Hybrid) ── */}
      {isActive && (
        <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 size={18} className="text-gray-400" />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Configuration Avancée</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Action Text */}
            <div className="bg-gray-50/50 p-5 rounded-[20px] border border-gray-100">
              <label htmlFor="customMessage" className="block text-xs font-bold text-gray-500 mb-2">Texte d'action (Optionnel)</label>
              <input 
                id="customMessage"
                type="text" 
                value={config.customMessage}
                onChange={e => setConfig({...config, customMessage: e.target.value})}
                className="w-full bg-white border border-gray-200 text-sm font-bold text-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]"
                placeholder="Ex: a acheté, a réservé..."
              />
            </div>

            {/* Timing */}
            <div className="bg-gray-50/50 p-5 rounded-[20px] border border-gray-100">
              <label htmlFor="cycleSeconds" className="block text-xs font-bold text-gray-500 mb-4">Rythme d'apparition (cycle total)</label>
              <div className="flex items-center gap-4">
                <input 
                  id="cycleSeconds"
                  type="range" 
                  min="5" max="60" step="5"
                  value={config.cycleSeconds}
                  onChange={e => setConfig({...config, cycleSeconds: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F7A60]"
                  title="Rythme d'apparition (secondes)"
                />
                <span className="text-sm font-black text-[#0F7A60] shrink-0 w-10">{config.cycleSeconds}s</span>
              </div>
            </div>

            {/* Position */}
            <div className="bg-gray-50/50 p-5 rounded-[20px] border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 mb-3">Position sur l'écran</label>
              <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setConfig({...config, position: 'bottom-left'})}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${config.position === 'bottom-left' ? 'bg-ink text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Gauche
                </button>
                <button 
                  onClick={() => setConfig({...config, position: 'bottom-right'})}
                  className={`flex-1 py-2 text-sm font-bold border-l border-gray-200 transition-colors ${config.position === 'bottom-right' ? 'bg-ink text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Droite
                </button>
              </div>
            </div>

            {/* Fake Data Toggle */}
            <div className="bg-rose-50/20 p-5 rounded-[20px] border border-rose-100 flex items-center justify-between">
              <div>
                <label className="block text-[13px] font-black text-rose-900 mb-0.5">Mode Simulateur</label>
                <p className="text-xs uppercase font-bold tracking-wider text-rose-500">Génère de fausses ventes</p>
              </div>
              {/* eslint-disable-next-line */}
              <button
                onClick={() => setConfig({...config, useFakeData: !config.useFakeData})}
                className={`${
                  config.useFakeData ? 'bg-rose-500' : 'bg-gray-200'
                } relative inline-flex h-7 w-12 appearance-none items-center rounded-full transition-colors`}
                title="Mode Simulateur"
                role="switch"
                aria-checked={config.useFakeData ? 'true' : 'false'}
                aria-label="Générer de fausses ventes"
              >
                <span className={`${config.useFakeData ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm`} />
              </button>
            </div>
          </div>

          <button 
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#1A1A1A] text-white rounded-xl font-bold text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 shadow-xl shadow-black/10"
          >
            {savingConfig ? "Sauvegarde en cours..." : <><Save size={18} /> Enregistrer mes configurations</>}
          </button>
        </div>
      )}
    </div>
  )
}
