'use client'

import React, { useState } from 'react'
import { AlertTriangle, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialActive: string
  initialMessage: string
}

export default function MaintenanceSwitch({ initialActive, initialMessage }: Props) {
  const [active, setActive] = useState(initialActive === 'true')
  const [message, setMessage] = useState(initialMessage || 'De retour dans quelques heures...')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const config = {
        maintenance_active: active ? 'true' : 'false',
        maintenance_message: message
      }
      
      const res = await fetch('/api/admin/settings/platform', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ config }),
      })

      if (!res.ok) throw new Error('Erreur de sauvegarde')
      toast.success('Paramètres de maintenance mis à jour ✓')
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`mt-8 relative overflow-hidden rounded-3xl p-6 border transition-colors ${active ? 'bg-red-50/50 border-red-200/60' : 'bg-gray-50/50 border-gray-200/60'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-2xl flex flex-shrink-0 items-center justify-center shadow-inner border ${active ? 'bg-red-100 border-red-200 text-red-600' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Kill-Switch Maintenance</h3>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Fermeture temporaire de la plateforme publique</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
           <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Statut d'accès</label>
           <select 
             value={active ? 'true' : 'false'}
             onChange={(e) => setActive(e.target.value === 'true')}
             className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none appearance-none cursor-pointer shadow-sm"
           >
             <option value="false">✅ Plateforme Ouverte (Public)</option>
             <option value="true">🛑 Plateforme en Maintenance (Bloqué)</option>
           </select>
        </div>

        <div>
           <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Message affiché à l'écran</label>
           <textarea
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             rows={2}
             className="w-full bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl py-3 px-4 text-sm font-medium text-gray-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none resize-none shadow-sm"
           />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all focus:ring-4 outline-none ${
            active 
              ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-600/20 focus:ring-red-600/20' 
              : 'bg-gray-900 text-white hover:bg-black hover:shadow-black/20 focus:ring-gray-900/20'
          }`}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder le cap'}
          <Save className="w-4 h-4 ml-1 opacity-80" />
        </button>
      </div>
    </div>
  )
}
