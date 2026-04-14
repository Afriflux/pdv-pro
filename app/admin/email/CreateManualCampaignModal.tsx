'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Users, PenTool, AlignLeft, Send, Type } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CreateManualCampaignModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  
  const [targetLists, setTargetLists] = useState<number[]>([]) // 1 = Acheteurs, 2 = Vendeurs, 3 = Newsletter
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleToggleList = (listId: number) => {
    setTargetLists(prev => 
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    )
  }

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.error('Veuillez remplir le nom, le sujet et le contenu.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/email/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, htmlContent, targetLists })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(data.message)
      setName('')
      setSubject('')
      setHtmlContent('')
      setTargetLists([])
      router.refresh()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur de création de la campagne")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Blur */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 shadow-sm">
                <PenTool className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-black text-gray-900 text-lg leading-tight">Campagne Manuelle</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Template Yayyam standard</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <div>
               <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                 Nom de la campagne
               </label>
               <input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="Ex: Newsletter Avril 2026"
                 className="w-full bg-[#FAFAF7] border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]/10 outline-none transition-all"
               />
               <p className="text-[11px] font-medium text-gray-400 mt-1">Usage interne sur Brevo</p>
            </div>
            
            {/* Sujet */}
            <div>
               <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
                 <Type className="w-4 h-4 text-emerald-600" /> Sujet de l'Email
               </label>
               <input
                 type="text"
                 value={subject}
                 onChange={(e) => setSubject(e.target.value)}
                 placeholder="Ex: Nouveautés sur la boutique ! 🎉"
                 className="w-full bg-[#FAFAF7] border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-900 focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]/10 outline-none transition-all"
               />
            </div>
          </div>

          {/* Contenu */}
          <div>
            <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
               <AlignLeft className="w-4 h-4" />
               Contenu de l'Email (Texte ou HTML)
            </label>
            <div className="relative">
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Rédigez le contenu de votre email ici. Le template global Yayyam (Logo, Footer) sera automatiquement ajouté autour de ce texte."
                className="w-full bg-[#FAFAF7] border-2 border-gray-100 rounded-xl p-4 text-sm focus:border-[#0F7A60] focus:ring-1 focus:ring-[#0F7A60]/10 outline-none transition-all resize-y min-h-[220px]"
              />
              {htmlContent.length > 0 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                  {htmlContent.length} chars
                </div>
              )}
            </div>
          </div>

          {/* Listes Cibles */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mt-2">
             <label className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Sélection des Listes Brevo
             </label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetLists.includes(1) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-100'}`}>
                   <input type="checkbox" className="accent-[#0D5C4A] w-4 h-4 cursor-pointer" checked={targetLists.includes(1)} onChange={() => handleToggleList(1)} />
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">1 - Acheteurs</span>
                   </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetLists.includes(2) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-100'}`}>
                   <input type="checkbox" className="accent-[#0D5C4A] w-4 h-4 cursor-pointer" checked={targetLists.includes(2)} onChange={() => handleToggleList(2)} />
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">2 - Vendeurs</span>
                   </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetLists.includes(3) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-100'}`}>
                   <input type="checkbox" className="accent-[#0D5C4A] w-4 h-4 cursor-pointer" checked={targetLists.includes(3)} onChange={() => handleToggleList(3)} />
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">3 - Newsletter</span>
                   </div>
                </label>
             </div>
             <p className="text-xs text-gray-400 font-medium mt-3">
               Si aucune liste n'est sélectionnée, la campagne ciblera 0 contact et restera à l'état de brouillon vierge sur Brevo.
             </p>
          </div>

        </div>
        
        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 sticky bottom-0 z-20 flex justify-end gap-3 rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitting || !name.trim() || !subject.trim() || !htmlContent.trim()}
            className="bg-black hover:bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                Sauvegarder et Envoyer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
