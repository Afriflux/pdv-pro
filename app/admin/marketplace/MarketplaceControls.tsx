'use client'

import { toast } from 'sonner';


import { useState } from 'react'
import { Activity, LayoutTemplate, Zap, BookOpen, Save, Lock } from 'lucide-react'
import { updateResourceMonetizationAction } from './actions'

type ResourceType = 'template' | 'workflow' | 'masterclass'

export default function MarketplaceControls({ 
  initialTemplates, initialWorkflows, initialMasterclasses 
}: { 
  initialTemplates: any[], initialWorkflows: any[], initialMasterclasses: any[] 
}) {
  const [activeTab, setActiveTab] = useState<ResourceType>('template')
  
  const [templates, setTemplates] = useState(initialTemplates)
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const [masterclasses, setMasterclasses] = useState(initialMasterclasses)

  const [savingId, setSavingId] = useState<string | null>(null)

  const handleUpdate = async (type: ResourceType, id: string, is_premium: boolean, price: number) => {
    setSavingId(id)
    const res = await updateResourceMonetizationAction(type, id, is_premium, price)
    
    if (res.success) {
      toast.success('Ressource mise à jour avec succès')
      if (type === 'template') {
        setTemplates(templates.map(t => t.id === id ? { ...t, is_premium, price } : t))
      } else if (type === 'workflow') {
        setWorkflows(workflows.map(w => w.id === id ? { ...w, is_premium, price } : w))
      } else {
        setMasterclasses(masterclasses.map(m => m.id === id ? { ...m, is_premium, price } : m))
      }
    } else {
      toast.error("Erreur: " + res.error)
    }
    setSavingId(null)
  }

  const renderTable = (items: any[], type: ResourceType) => {
    return (
      <div className="bg-white border-2 border-line rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAF7] border-b border-line text-xs uppercase text-gray-500 font-black tracking-wider">
              <th className="p-4">Ressource</th>
              <th className="p-4">Type / Catégorie</th>
              <th className="p-4 text-center">Modèle Freemium</th>
              <th className="p-4 text-right">Prix (FCFA)</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-ink">
                  {item.name || item.title || 'Sans nom'}
                </td>
                <td className="p-4 text-sm font-medium text-gray-500">
                  {item.category || item.type || '-'}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className={!item.is_premium ? "text-emerald-500 font-bold text-xs" : "text-gray-400 text-xs font-medium"}>Gratuit</span>
                    <button 
                      onClick={() => handleUpdate(type, item.id, !item.is_premium, item.price || 0)}
                      aria-label="Basculer Modèle Freemium"
                      role="switch"
                      aria-checked={!!item.is_premium}
                      className={`relative w-12 h-6 rounded-full transition-colors ${item.is_premium ? 'bg-amber-500' : 'bg-line'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${item.is_premium ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className={item.is_premium ? "text-amber-500 font-bold text-xs flex items-center gap-1" : "text-gray-400 text-xs font-medium flex items-center gap-1"}>
                      <Lock size={12} /> Payant
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <input 
                    type="number"
                    min="0"
                    aria-label="Prix en FCFA"
                    title="Prix en FCFA"
                    disabled={!item.is_premium}
                    value={item.price || 0}
                    onChange={(e) => {
                      if (type === 'template') setTemplates(templates.map(t => t.id === item.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t))
                      else if (type === 'workflow') setWorkflows(workflows.map(t => t.id === item.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t))
                      else setMasterclasses(masterclasses.map(t => t.id === item.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t))
                    }}
                    onBlur={() => handleUpdate(type, item.id, item.is_premium, item.price || 0)}
                    className="w-24 px-3 py-1.5 border-2 border-line rounded-lg text-right font-bold focus:border-amber-500 outline-none disabled:opacity-50"
                  />
                </td>
                <td className="p-4 text-right">
                  {savingId === item.id ? <Activity className="animate-spin text-ink mx-auto" size={16} /> : <Save className="text-gray-300 mx-auto" size={16} />}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
               <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Aucune ressource trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('template')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'template' ? 'bg-ink text-white' : 'bg-white text-gray-500 border border-line hover:bg-gray-50'
          }`}
        >
          <LayoutTemplate size={16} /> Templates
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'workflow' ? 'bg-ink text-white' : 'bg-white text-gray-500 border border-line hover:bg-gray-50'
          }`}
        >
          <Zap size={16} /> Workflows
        </button>
        <button
          onClick={() => setActiveTab('masterclass')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'masterclass' ? 'bg-ink text-white' : 'bg-white text-gray-500 border border-line hover:bg-gray-50'
          }`}
        >
          <BookOpen size={16} /> Masterclass
        </button>
      </div>

      <div>
        {activeTab === 'template' && renderTable(templates, 'template')}
        {activeTab === 'workflow' && renderTable(workflows, 'workflow')}
        {activeTab === 'masterclass' && renderTable(masterclasses, 'masterclass')}
      </div>
    </div>
  )
}
