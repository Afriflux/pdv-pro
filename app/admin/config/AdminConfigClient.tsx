'use client'

import { useState } from 'react'
import { AdminPlatformConfig, updatePlatformConfig } from '@/lib/admin/adminActions'

interface Props {
  initialConfig: AdminPlatformConfig
}

export default function AdminConfigClient({ initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: Number(value) }))
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updatePlatformConfig({
        fee_percentage: config.fee_percentage,
        fee_fixed: config.fee_fixed,
        min_withdrawal: config.min_withdrawal
      })
      alert("Configuration globale mise à jour avec succès.")
      setHasChanges(false)
      // On met à jour manuellement la date de la modif
      setConfig(prev => ({ ...prev, updated_at: new Date().toISOString() }))
    } catch (error: any) {
      alert(error.message || "Erreur lors de la sauvegarde de la configuration.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
      <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-orange-50/30">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paramètres Financiers</h2>
          <p className="text-sm text-gray-500 mt-1">Dernière modification : {new Date(config.updated_at).toLocaleString('fr-FR')}</p>
        </div>
        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
          ⚙️
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        
        {/* Section Commissions */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Commissions PDV Pro (Par défaut)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Commission Variable (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    name="fee_percentage"
                    value={config.fee_percentage}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 font-bold">%</div>
                </div>
                <p className="text-xs text-gray-400">Pourcentage prélevé sur chaque transaction réussie.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Commission Fixe (FCFA)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    name="fee_fixed"
                    value={config.fee_fixed}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 font-bold">F</div>
                </div>
                <p className="text-xs text-gray-400">Montant fixe ajouté en plus du pourcentage.</p>
              </div>

            </div>
          </div>
        </div>

        {/* Section Retraits */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Politique de Retrait Vendeur</h3>
            
            <div className="space-y-2 max-w-sm">
              <label className="block text-sm font-semibold text-gray-700">Montant Minimum (FCFA)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="min_withdrawal"
                  value={config.min_withdrawal}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500 font-bold">F</div>
              </div>
              <p className="text-xs text-gray-400">Le solde disponible doit atteindre ce montant pour demander un retrait.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={!hasChanges || isSaving}
            className={`px-8 py-3 rounded-xl text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-orange-500/20 ${
              !hasChanges || isSaving 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
          </button>
        </div>

      </form>
    </div>
  )
}
