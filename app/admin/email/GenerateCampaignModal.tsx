'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Loader2, Users } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function GenerateCampaignModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [targetLists, setTargetLists] = useState<number[]>([]) // Vide = Aucun, 1 = Acheteurs, 2 = Vendeurs
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleToggleList = (listId: number) => {
    setTargetLists(prev => 
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    )
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Veuillez entrer une description pour votre email.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/admin/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, targetLists })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message)
      setPrompt('')
      setTargetLists([])
      router.refresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération IA")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Blur */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow magique */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between relative z-10 bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <Sparkles className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-black text-gray-900 text-lg leading-tight">Générer une Campagne</h3>
               <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mt-0.5">Propulsé par Claude 3.5</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer la modale"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10 flex flex-col gap-6">
          
          {/* Prompt */}
          <div>
             <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
               Sujet & Consignes de la Newsletter
             </label>
             <textarea
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Ex: Rédige un email très court annonçant les promotions du week-end sur le matériel informatique. Ton enthousiaste et pressant."
               className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:bg-white focus:border-[#0D5C4A] focus:ring-2 focus:ring-[#0D5C4A]/10 outline-none transition-all resize-none min-h-[120px] shadow-inner"
             />
          </div>

          {/* Listes Cibles */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
             <label className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Optionnel : Pré-attacher aux Listes Brevo
             </label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetLists.includes(1) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-100'}`}>
                   <input type="checkbox" className="accent-[#0D5C4A] w-4 h-4 cursor-pointer" checked={targetLists.includes(1)} onChange={() => handleToggleList(1)} />
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">Liste 1 - Acheteurs</span>
                   </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetLists.includes(2) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-100'}`}>
                   <input type="checkbox" className="accent-[#0D5C4A] w-4 h-4 cursor-pointer" checked={targetLists.includes(2)} onChange={() => handleToggleList(2)} />
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">Liste 2 - Vendeurs</span>
                   </div>
                </label>
             </div>
             <p className="text-xs text-gray-400 font-medium mt-3 italic">
               Si aucune liste n'est sélectionnée, la campagne ciblera 0 contact et restera à l'état de brouillon vierge sur Brevo.
             </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-[#0D5C4A] hover:bg-[#083D31] text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création en cours par l'IA...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Générer et Pousser sur Brevo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
