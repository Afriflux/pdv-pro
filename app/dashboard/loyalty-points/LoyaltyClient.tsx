'use client'

import React, { useState } from 'react'
import { Trophy, CheckCircle2, Loader2, Coins, Crown, Save, ShieldCheck } from 'lucide-react'
import { updateLoyaltyConfigAction } from './actions'
import { toast } from 'sonner'

interface LoyaltyConfig {
  enabled: boolean
  points_per_100: number
  max_redeem_pct: number
}

interface LoyaltyAccountRow {
  id: string
  phone: string
  total_earned: number
  balance: number
  tier: string
  created_at: string
}

export default function LoyaltyClient({ storeId, config, accounts }: { storeId: string, config: LoyaltyConfig, accounts: LoyaltyAccountRow[] }) {
  const [enabled, setEnabled] = useState(config.enabled)
  const [pointsPer100, setPointsPer100] = useState(config.points_per_100)
  const [maxRedeemPct, setMaxRedeemPct] = useState(config.max_redeem_pct)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    const res = await updateLoyaltyConfigAction(storeId, enabled, pointsPer100, maxRedeemPct)
    if (res.success) {
      toast.success('Configuration de fidélité sauvegardée.')
    } else {
      toast.error(res.error)
    }
    setIsSubmitting(false)
  }

  const getTierIcon = (tier: string) => {
    if (tier === 'gold') return <Crown size={16} className="text-yellow-500" />
    if (tier === 'silver') return <Crown size={16} className="text-slate-400" />
    return <ShieldCheck size={16} className="text-amber-700" /> // bronze
  }

  return (
    <div className="space-y-6 font-sans pb-32">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-gradient-to-br from-[#0F7A60] to-emerald-800 text-white rounded-2xl shadow-lg">
                <Trophy size={26} />
             </div>
             <h1 className="text-3xl font-display font-black text-ink tracking-tight">Fidélité & Points</h1>
          </div>
          <p className="text-dust font-medium text-sm mt-1 max-w-xl">
             Récompensez vos meilleurs clients. Pour chaque achat, l'acheteur cumule des points qu'il pourra utiliser comme réduction lors de sa prochaine commande.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-ink hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Sauvegarder</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
         {/* CONFIGURATION */}
         <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <div className="bg-white border border-line rounded-3xl p-6 shadow-sm">
               <h2 className="text-lg font-black text-ink mb-4 flex items-center gap-2">
                  <Coins size={20} className="text-emerald-600" /> Paramétrage Algorithmique
               </h2>

               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-line bg-[#FAFAF7]">
                     <div>
                        <p className="text-sm font-bold text-ink">Activer le programme</p>
                        <p className="text-xs text-dust">Afficher le compteur lors du checkout.</p>
                     </div>
                     <button 
                         title="Activer la fidélité"
                         onClick={() => setEnabled(!enabled)}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-[#0F7A60]' : 'bg-slate-200'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                  </div>

                  <div className={enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
                     <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-2">Points gagnés par tranche de 100 FCFA dépensée</label>
                     <div className="flex items-center gap-4">
                       <input 
                         type="number" 
                         title="Points par 100 FCFA"
                         placeholder="Ex: 5"
                         min="1"
                         value={pointsPer100} 
                         onChange={e => setPointsPer100(Number(e.target.value))} 
                         className="w-24 border border-line rounded-xl px-4 py-3 text-center text-lg font-black focus:border-[#0F7A60] outline-none"
                       />
                       <span className="text-sm text-slate font-medium">soit <strong className="text-ink">{pointsPer100} point(s)</strong> par 100 FCFA</span>
                     </div>
                  </div>

                  <div className={enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
                     <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-2">% Max de réduction via points sur un chariot</label>
                     <div className="relative w-full max-w-[150px]">
                       <input 
                         type="number" 
                         title="Max de réduction en point"
                         placeholder="Ex: 50"
                         min="1" max="100"
                         value={maxRedeemPct} 
                         onChange={e => setMaxRedeemPct(Number(e.target.value))} 
                         className="w-full border border-line rounded-xl px-4 py-3 text-center text-lg font-black focus:border-[#0F7A60] outline-none"
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                     </div>
                     <p className="text-xs text-dust mt-2">Plafonne la réduction pour ne pas que le client solde sa commande à 0 FCFA s'il a trop de cagnotte.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* LEADERBOARD */}
         <div className="w-full lg:w-2/3">
            <div className="bg-white border border-line rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col h-full">
               <h2 className="text-lg font-black text-ink mb-1">Leaderboard Clients</h2>
               <p className="text-xs text-dust mb-6">Liste des numéros ayant participé au cagnottage de points.</p>
               
               <div className="flex-1 overflow-y-auto">
                 {accounts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                       <Crown size={40} className="text-amber-100 mb-3" />
                       <p className="text-ink font-bold text-lg">Aucun VIP pour le moment</p>
                       <p className="text-dust text-sm max-w-xs mt-1">Personne n'a encore cumulé de points sur cette boutique.</p>
                    </div>
                 ) : (
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr>
                           <th className="border-b border-line pb-3 text-xs uppercase tracking-wider text-dust font-bold w-12">Rang</th>
                           <th className="border-b border-line pb-3 text-xs uppercase tracking-wider text-dust font-bold">Téléphone</th>
                           <th className="border-b border-line pb-3 text-xs uppercase tracking-wider text-dust font-bold text-center">Solde (PTS)</th>
                           <th className="border-b border-line pb-3 text-xs uppercase tracking-wider text-dust font-bold text-center">Total Historique</th>
                           <th className="border-b border-line pb-3 text-xs uppercase tracking-wider text-dust font-bold text-center">Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((acc, index) => (
                           <tr key={acc.id} className="group hover:bg-slate-50 transition">
                             <td className="py-4 border-b border-line text-sm font-black text-slate-400 w-12 text-center group-hover:text-ink">#{index + 1}</td>
                             <td className="py-4 border-b border-line text-sm font-bold text-ink">{acc.phone}</td>
                             <td className="py-4 border-b border-line text-sm font-black text-[#0F7A60] text-center">+{acc.balance.toLocaleString()}</td>
                             <td className="py-4 border-b border-line text-sm font-medium text-slate-500 text-center">{acc.total_earned.toLocaleString()}</td>
                             <td className="py-4 border-b border-line text-center">
                               <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${acc.tier === 'gold' ? 'bg-amber-100 text-yellow-600' : acc.tier === 'silver' ? 'bg-slate-200 text-slate-600' : 'bg-orange-50 text-orange-800'}`}>
                                  {getTierIcon(acc.tier)} {acc.tier}
                               </div>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                 )}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
