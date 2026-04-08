import React, { useState, useEffect } from 'react'
import { Trophy, Save, AlertCircle } from 'lucide-react'
import { toast } from '@/lib/toast'
import { getLoyaltyConfig, updateLoyaltyConfig } from '@/app/actions/loyalty'

export function LoyaltyTab({ store }: { store: Record<string, unknown> & { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [points, setPoints] = useState(1)
  const [maxPct, setMaxPct] = useState(20)

  useEffect(() => {
    if (store?.id) {
      getLoyaltyConfig(store.id).then(res => {
        if (res.success && res.config) {
          setEnabled(res.config.enabled)
          setPoints(res.config.points_per_100)
          setMaxPct(res.config.max_redeem_pct)
        }
        setLoading(false)
      })
    }
  }, [store])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateLoyaltyConfig(store.id, enabled, points, maxPct)
      if (res.success) toast.success("Configuration de fidélité sauvegardée")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur de sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Programme de Fidélité</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Configurez la récompense en points pour inciter vos clients à revenir.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Activer le programme de points</h3>
            <p className="text-sm text-gray-500">Les clients gagneront des points après chaque commande validée.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              title="Activer le programme de fidélité"
              aria-label="Activer le programme de fidélité"
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        <div className={`space-y-6 transition-all ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Points gagnés par 100 FCFA dépensé</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                title="Points gagnés par 100 FCFA dépensé"
                aria-label="Points gagnés par 100 FCFA dépensé"
                min={1} 
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-24 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
              />
              <span className="text-sm text-gray-500 font-medium">point(s) <span className="text-xs">(100 pts = 100 FCFA de réduction)</span></span>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
               <AlertCircle size={14}/> Exemple : Pour une commande de 15 000 FCFA, le client gagne {Math.floor(15000/100)*points} points (soit {Math.floor(15000/100)*points} FCFA de remise future).
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Utilisation maximum par commande (%)</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                title="Utilisation maximum par commande (%)"
                aria-label="Utilisation maximum par commande (%)"
                min={5} 
                max={100}
                value={maxPct}
                onChange={(e) => setMaxPct(Number(e.target.value))}
                className="w-24 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
              />
              <span className="text-sm text-gray-500 font-medium">% de la commande payables en points</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition flex items-center gap-2"
          >
            {saving ? 'Sauvegarde...' : <><Save size={18} /> Sauvegarder</>}
          </button>
        </div>
      </div>
    </div>
  )
}
