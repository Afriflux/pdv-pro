'use client'

import { useState } from 'react'
import { Sparkles, X, Loader2, BookOpen } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (generatedArticle: any) => void
}

export default function GenerateMasterclassModal({ isOpen, onClose, onSuccess }: Props) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Veuillez décrire le sujet du cours.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/admin/masterclass/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Cours généré avec succès ! Vous pouvez maintenant le vérifier.")
      
      // On referme cette modal et on déclenche l'ouverture de la modal d'édition pré-remplie
      onSuccess(data.article)
      setPrompt('')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between relative z-10 bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <Sparkles className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-black text-gray-900 text-lg leading-tight">Générer un Mini-Cours</h3>
               <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-widest mt-0.5">Propulsé par Claude 3.5</p>
             </div>
          </div>
          <button onClick={onClose} title="Fermer la modale" aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 relative z-10 flex flex-col gap-6">
          <div>
             <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
               Sujet du cours & Instructions spécifiques
             </label>
             <textarea
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Ex: Rédige un module d'environ 5 étapes sur 'L'art du closing sur WhatsApp'. Sois précis et donne des conseils applicables immédiatement."
               className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none min-h-[140px] shadow-inner"
             />
             <p className="text-[11px] text-gray-400 font-medium mt-3 italic flex items-center gap-1.5">
               <BookOpen className="w-3.5 h-3.5" /> L'IA structurera le cours avec un Titre, un Emoji, une Intro et des Étapes détaillées.
             </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Construction du cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Générer la Masterclass
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
