'use client'

import { useState } from 'react'
import { ShieldAlert, Save, Users, CreditCard } from 'lucide-react'
import { toast } from '@/lib/toast'

type Config = {
  ambassador_reward_client: string
  ambassador_reward_pro: string
  ambassador_require_purchase: string
  ambassador_active: string
  ambassador_min_revenue_vendor: string
  ambassador_min_days_active: string
}

export default function AmbassadorSettingsClient({ initialConfig }: { initialConfig: Config }) {
  const [config, setConfig] = useState(initialConfig)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: config })
      })
      if (res.ok) toast.success('Configuration sauvegardée avec succès !')
      else toast.error('Erreur lors de la sauvegarde.')
    } catch {
      toast.error('Erreur réseau.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-[#0F7A60]" /> Programme d'Acquisition (Tous Profils)
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">Configurez les primes de parrainage et la sécurité anti-fraude.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={config.ambassador_active === 'true'} onChange={(e) => setConfig({...config, ambassador_active: e.target.checked ? 'true' : 'false'})} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F7A60]"></div>
            <span className="ml-3 text-xs font-bold text-gray-900">Actif partout</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Prime pour un nouveau Client (CFA)</label>
          <div className="relative">
            <input 
              type="number" 
              value={config.ambassador_reward_client}
              onChange={(e) => setConfig({...config, ambassador_reward_client: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-[#0F7A60] focus:border-[#0F7A60]" 
            />
            <CreditCard size={16} className="absolute right-4 top-3.5 text-gray-400" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Sera crédité dans le wallet de l'apporteurs.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Prime pour un Vendeur/Pro (CFA)</label>
          <div className="relative">
            <input 
              type="number" 
              value={config.ambassador_reward_pro}
              onChange={(e) => setConfig({...config, ambassador_reward_pro: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-[#C9A84C] focus:border-[#C9A84C]" 
            />
            <Users size={16} className="absolute right-4 top-3.5 text-gray-400" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Concerne les Vendeurs, Affiliés et Closers.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Conditions de C.A. minimum pour la prime finale (CFA)</label>
          <div className="relative">
            <input 
              type="number" 
              value={config.ambassador_min_revenue_vendor}
              onChange={(e) => setConfig({...config, ambassador_min_revenue_vendor: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-[#0F7A60] focus:border-[#0F7A60]" 
            />
            <CreditCard size={16} className="absolute right-4 top-3.5 text-gray-400" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Ex: Le filleul doit réaliser au moins 50.000 FCFA pour valider la prime du parrain.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Période minimale d'activité (Jours)</label>
          <div className="relative">
            <input 
              type="number" 
              value={config.ambassador_min_days_active}
              onChange={(e) => setConfig({...config, ambassador_min_days_active: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-[#C9A84C] focus:border-[#C9A84C]" 
            />
            <Users size={16} className="absolute right-4 top-3.5 text-gray-400" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Ex: La boutique du filleul doit être active depuis au moins 30 jours.</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 mt-6">
        <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Protection Anti-Fraude Obligatoire</h4>
          <p className="text-xs text-amber-700 mt-1 mb-3 leading-relaxed">
            Pour éviter que des utilisateurs ne créent de faux comptes uniquement pour récolter la prime, nous vous recommandons d'exiger une <strong>première commande payée</strong> ou <strong>première vente</strong> avant de reverser la commission.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" 
              checked={config.ambassador_require_purchase === 'true'}
              onChange={(e) => setConfig({...config, ambassador_require_purchase: e.target.checked ? 'true' : 'false'})}
            />
            <span className="text-xs font-bold text-amber-900">Verser la prime UNIQUEMENT après la première transaction validée</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="px-6 py-3 bg-[#0F7A60] hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={16} /> 
          {loading ? 'Sauvegarde...' : 'Sauvegarder les règles'}
        </button>
      </div>
    </div>
  )
}
