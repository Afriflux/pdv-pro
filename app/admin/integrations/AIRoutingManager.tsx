'use client'

import { useState } from 'react'
import { Server, Save, Zap, BrainCircuit, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AIProvider } from '@/lib/ai/types'

export type AIRoutingConfig = {
  eco: AIProvider[]
  creative: AIProvider[]
  reasoning: AIProvider[]
}

const DEFAULT_PREFS: AIRoutingConfig = {
  eco: ['gemini', 'openai', 'anthropic'],
  creative: ['anthropic', 'openai', 'gemini'],
  reasoning: ['openai', 'anthropic', 'gemini']
}

const PROVIDERS = [
  { id: 'anthropic', label: 'Claude 3 (Anthropic)', color: 'text-violet-600' },
  { id: 'openai', label: 'GPT-4o (OpenAI)', color: 'text-emerald-600' },
  { id: 'gemini', label: 'Gemini 1.5 (Google)', color: 'text-blue-600' }
]

interface AIRoutingManagerProps {
  initialConfig?: string
}

export default function AIRoutingManager({ initialConfig }: AIRoutingManagerProps) {
  const [config, setConfig] = useState<AIRoutingConfig>(() => {
    if (initialConfig) {
      try {
        const parsed = JSON.parse(initialConfig)
        // Basic validation
        if (parsed.eco && parsed.creative && parsed.reasoning) {
          return parsed as AIRoutingConfig
        }
      } catch (e) {
        // Ignored
      }
    }
    return DEFAULT_PREFS
  })
  
  const [isSaving, setIsSaving] = useState(false)

  const handleProviderChange = (
    mode: keyof AIRoutingConfig,
    index: number,
    newValue: string
  ) => {
    setConfig(prev => {
      const newArray = [...prev[mode]]
      // Swap logic if the value is already in the array
      const existingIndex = newArray.indexOf(newValue as AIProvider)
      if (existingIndex !== -1 && existingIndex !== index) {
        newArray[existingIndex] = newArray[index]
      }
      newArray[index] = newValue as AIProvider
      return { ...prev, [mode]: newArray }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/integrations/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error("Erreur de sauvegarde")
      toast.success("Priorités de routing IA enregistrées.")
    } catch (e: any) {
      toast.error(e.message || "Impossible de sauvegarder la configuration.")
    } finally {
      setIsSaving(false)
    }
  }

  const renderRow = (
    title: string,
    desc: string,
    mode: keyof AIRoutingConfig,
    Icon: any,
    colorClass: string
  ) => (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 w-1/3 min-w-[280px]">
        <div className={`p-2 rounded-xl ${colorClass} bg-white shadow-sm border border-gray-100`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">{desc}</p>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-3 items-center w-full lg:w-2/3">
        {[0, 1, 2].map(index => (
          <div key={`${mode}-${index}`} className="flex-1 min-w-[140px] relative">
            <span className="absolute -top-2.5 left-3 px-1 bg-white text-xs font-black tracking-widest uppercase text-gray-400 z-10">
               Choix #{index + 1}
            </span>
            <select
              value={config[mode][index]}
              onChange={(e) => handleProviderChange(mode, index, e.target.value)}
              className="w-full relative z-0 appearance-none bg-gray-50 border border-gray-200 focus:border-[#0D5C4A] focus:ring-1 focus:ring-[#0D5C4A]/20 transition-all rounded-xl py-3 pl-4 pr-10 text-[13px] font-semibold text-gray-800 shadow-inner outline-none cursor-pointer"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none text-gray-400 text-xs">
              ▼
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 lg:p-8 relative overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
       
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl border border-indigo-100/50">
               <Server className="w-6 h-6 text-indigo-500" />
             </div>
             <div>
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Smart Router IA</h3>
               <p className="text-sm text-gray-500 mt-1 max-w-lg">
                 Définissez l'ordre de priorité des modèles d'IA pour optimiser les coûts et garantir la fluidité (fallback).
               </p>
             </div>
          </div>
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex items-center gap-2 bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm whitespace-nowrap"
          >
             {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
             Enregistrer
          </button>
       </div>

       <div className="bg-gray-50/50 rounded-2xl border border-gray-100 px-6 py-2">
         {renderRow(
           "Mode Éco / Standard", 
           "Privilégie la vitesse et les basses consommations.", 
           "eco", 
           Zap, 
           "text-amber-500"
         )}
         {renderRow(
           "Créativité / Copie", 
           "Excellent pour le copywriting et les descriptions.", 
           "creative", 
           Lightbulb, 
           "text-fuchsia-500"
         )}
         {renderRow(
           "Raisonnement Expert", 
           "Pour les analyses logiques et la détection d'anomalies.", 
           "reasoning", 
           BrainCircuit, 
           "text-indigo-500"
         )}
       </div>
    </div>
  )
}
