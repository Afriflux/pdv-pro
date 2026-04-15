'use client'

import { useState } from 'react'
import { Plus, Save, Power, Settings2, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

export function VolumeDiscountsClient({ 
  initialActive, 
  initialConfig,
  onToggle,
  onSave
}: { 
  initialActive: boolean
  initialConfig: any
  onToggle: (v: boolean) => Promise<void>
  onSave: (config: any) => Promise<void>
}) {
  const [active, setActive] = useState(initialActive)
  const defaultTiers = [
    { qty: 2, discount_pct: 10, label: 'Achetez-en 2 (Économisez 10%)' },
    { qty: 3, discount_pct: 20, label: 'Achetez-en 3 (Économisez 20%)' }
  ]
  const [discountTiers, setDiscountTiers] = useState<any[]>(initialConfig?.tiers || defaultTiers)
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      await onToggle(!active)
      setActive(!active)
      toast.success(active ? 'Prix de Gros désactivés.' : 'Prix de Gros activés !')
    } catch (e: any) {
      toast.error('Erreur lors du changement de statut.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      if (discountTiers.length === 0) { 
         toast.error('Vous devez avoir au moins 1 palier.')
         return
      }
      await onSave({ tiers: discountTiers })
      toast.success('Paliers sauvegardés avec succès.')
    } catch (e: any) {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const addTier = () => {
    setDiscountTiers([...discountTiers, { qty: 4, discount_pct: 30, label: 'Achetez-en 4 (Économisez 30%)' }])
  }

  const updateTier = (index: number, field: string, value: any) => {
    const newTiers = [...discountTiers]
    newTiers[index][field] = value
    setDiscountTiers(newTiers)
  }

  const removeTier = (index: number) => {
    const newTiers = [...discountTiers]
    newTiers.splice(index, 1)
    setDiscountTiers(newTiers)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Form */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">

        {/* Global Toggle */}
        <div className="bg-white border text-sm border-gray-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
           <div>
             <h3 className="font-black text-lg text-[#1A1A1A]">Statut B2B / Lots</h3>
             <p className="text-gray-500 font-medium text-sm mt-1">Affichez des réductions automatiques selon la quantité commandée.</p>
           </div>
           <button 
             onClick={handleToggle}
             disabled={loading}
             className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
               active 
                ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100' 
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
             }`}
           >
             {active ? <><Power size={18} /> Désactiver</> : <><Power size={18} /> Activer</>}
           </button>
        </div>

        {/* Configurations */}
        <div className={`bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6 transition-all ${!active ? 'opacity-50 pointer-events-none' : ''}`}>
           <div className="flex items-center justify-between border-b border-gray-100 pb-4">
             <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">Paliers de Réduction</h3>
             <button onClick={addTier} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700"><Plus size={16} /> Ajouter</button>
           </div>

           <div className="space-y-4">
             {discountTiers.map((tier, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 relative">
                  
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400">Titre Affiché</label>
                    <input type="text" title="Titre Palier" placeholder="Ex: Buy 2 get 10%" value={tier.label} onChange={e => updateTier(idx, 'label', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-bold focus:border-blue-400 outline-none" />
                  </div>

                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400">Quantité</label>
                    <input type="number" title="Quantité" placeholder="2" min="2" value={tier.qty} onChange={e => updateTier(idx, 'qty', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-center focus:border-blue-400 outline-none" />
                  </div>

                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400">Rémise (%)</label>
                    <input type="number" title="Remise" placeholder="10" min="1" max="100" value={tier.discount_pct} onChange={e => updateTier(idx, 'discount_pct', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-center text-emerald-600 focus:border-blue-400 outline-none" />
                  </div>

                  <button onClick={() => removeTier(idx)} title="Supprimer" className="mt-5 w-10 h-10 shrink-0 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
             ))}
           </div>

           <button
             onClick={handleSaveConfig}
             disabled={saving || !active}
             className="w-full py-4 mt-6 bg-gray-900 hover:bg-black text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 text-sm shadow-xl"
           >
             <Save size={18} /> Sauvegarder les Paliers
           </button>
        </div>
      </div>

      {/* Simulator Right Column */}
      <div className="w-full lg:w-[40%] flex flex-col">
         <div className="sticky top-6">
            <h3 className="font-black text-lg text-[#1A1A1A] mb-4 flex items-center gap-2"><Settings2 size={20} className="text-gray-400"/> Aperçu Client</h3>
            
            <div className="h-[auto] border-4 border-[url('/iphone-frame.png')] border-solid bg-[#FAFAF7] rounded-[3rem] p-6 shadow-2xl pb-10">
               <div className="w-full h-48 bg-gray-200 rounded-xl animate-pulse mb-6"></div>
               
               <h4 className="font-black text-xl text-gray-800 mb-1">Robe d'Été Blanche</h4>
               <p className="font-bold text-lg text-emerald-600 mb-6">15,000 XOF</p>

               <div className="space-y-3">
                 {/* Standard Option */}
                 <div className={`p-4 rounded-xl border-2 cursor-pointer ${!active ? 'border-gray-900 bg-white' : 'border-gray-200 bg-white'}`}>
                   <p className="font-bold text-gray-800 flex items-center gap-2">
                     <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!active ? 'border-gray-900' : 'border-gray-300'}`}>
                       {!active && <span className="w-2 h-2 rounded-full bg-gray-900"></span>}
                     </span>
                     1 Article
                   </p>
                   <p className="text-sm font-medium text-gray-500 ml-6">15,000 XOF au total</p>
                 </div>

                 {/* Volume Options */}
                 {active && discountTiers.map((tier, idx) => {
                   const originalPrice = 15000 * tier.qty;
                   const discountPrice = originalPrice * (1 - tier.discount_pct / 100);
                   
                   return (
                   <div key={idx} className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50 cursor-pointer relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl uppercase">Éco {tier.discount_pct}%</div>
                     <p className="font-bold text-gray-900 flex items-center gap-2">
                       <span className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                         <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                       </span>
                       {tier.label}
                     </p>
                     <p className="text-sm font-medium text-gray-500 ml-6 mt-1 flex items-center gap-2">
                       <span className="line-through text-gray-400">{originalPrice.toLocaleString('fr-FR')} XOF</span>
                       <span className="font-bold text-emerald-600">{discountPrice.toLocaleString('fr-FR')} XOF</span>
                     </p>
                   </div>
                 )})}
               </div>

               <button className="w-full mt-6 py-4 bg-gray-900 text-white rounded-xl font-black text-sm">Ajouter au panier</button>
            </div>
            
            <p className="text-xs text-center text-gray-400 font-medium mt-6">Aperçu du widget qui s'affichera sur vos pages produits.</p>
         </div>
      </div>
    </div>
  )
}
