'use client'

import React, { useState } from 'react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { Settings, MessageCircle, Bot, Cloud, Loader2, X, Search, Activity, ReceiptText } from 'lucide-react'

type StoreProp = {
  id: string
  store_name: string | null
  ai_credits: number
  user: { name: string; phone: string | null }
  sms_credits: { credits: number; used: number } | null
  subscriptions: { plan: string }[]
}

type ConfigProp = {
  key: string | null
  value: string | null
}

type PurchaseProp = {
  id: string
  store_id: string
  asset_type: string
  asset_id: string
  amount_paid: number
  purchased_at: Date
  store: { store_name: string | null; user: { name: string } }
}

interface Props {
  initialStores: StoreProp[]
  configs: ConfigProp[]
  initialPurchases: PurchaseProp[]
}

export default function MonetizationClient({ initialStores, configs, initialPurchases }: Props) {
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'gestion' | 'historique'>('gestion')
  const [searchTerm, setSearchTerm] = useState('')
  
  const getConf = (key: string, def: string) => configs.find(c => c.key === key)?.value || def
  
  // Nouveaux volumes
  const smsVolume = parseInt(getConf('VOLUME_SMS_PACK', '1000'))
  const aiVolume = parseInt(getConf('VOLUME_AI_PACK', '100'))
  
  // Prix existants (avec fallback sur les anciennes configs de projet)
  const smsPrice = parseInt(getConf('PRICE_SMS_PACK', getConf('PRICE_SMS_PACK_1000', '5000')))
  const aiPrice = parseInt(getConf('PRICE_AI_PACK', getConf('PRICE_AI_PACK_100', '3000')))
  const cloudPrice = parseInt(getConf('PRICE_CLOUD_EXTENSION', '9900'))

  // Modal Editing
  const [editingConfig, setEditingConfig] = useState<{
    priceKey: string, 
    volumeKey?: string, 
    label: string, 
    priceVal: string, 
    volumeVal?: string
  } | null>(null)
  
  const [configPriceValue, setConfigPriceValue] = useState('')
  const [configVolumeValue, setConfigVolumeValue] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredStores = initialStores.filter(s => 
    (s.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredPurchases = initialPurchases.filter(p =>
    (p.store.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.store.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.asset_type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleUpdateConfig = async () => {
    if (!editingConfig || !configPriceValue) return
    setLoading(true)
    
    // Preparer la structure bulk (multiple update)
    const updates = [{ key: editingConfig.priceKey, value: configPriceValue }]
    
    if (editingConfig.volumeKey && configVolumeValue) {
       updates.push({ key: editingConfig.volumeKey, value: configVolumeValue })
    }
    
    try {
      const res = await fetch('/api/admin/monetization/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      
      if (res.ok) {
        toast.success('Configuration ajustée avec succès !')
        setEditingConfig(null)
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const openConfigModal = (priceKey: string, label: string, priceVal: string, volumeKey?: string, volumeVal?: string) => {
    setConfigPriceValue(priceVal)
    if (volumeKey && volumeVal) setConfigVolumeValue(volumeVal)
    
    setEditingConfig({ priceKey, volumeKey, label, priceVal, volumeVal })
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#FAFAF7] min-h-screen text-gray-900">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 tracking-tight text-gray-900">Hub de Monétisation</h1>
          <p className="text-gray-500 font-medium flex items-center gap-2">
             Gestion des tarifs, des capacités et historique Yayyam.
          </p>
        </div>
        <div className="flex bg-gray-50 border border-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('gestion')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'gestion' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Activity size={16} /> Tarifs & Boutiques
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'historique' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ReceiptText size={16} /> Historique Financier
          </button>
        </div>
      </div>

      {activeTab === 'gestion' ? (
        <>
          {/* CARDS CONFIGURATION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] p-6 border border-gray-100 transition-colors relative overflow-hidden group hover:border-[#0F7A60]/30 hover:shadow-md">
              <div className="absolute top-0 right-0 p-8 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110">
                <MessageCircle className="text-[#0F7A60] w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 relative z-10">Pack WhatsApp/SMS</h3>
              <p className="text-sm font-bold text-[#0F7A60] mt-1 mb-6 relative z-10 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg">{smsVolume} msg inclus / pack</p>
              <div className="flex items-end gap-2 mb-6 relative z-10">
                <span className="text-3xl font-black tracking-tight">{Number(smsPrice).toLocaleString('fr-FR')}</span>
                <span className="text-gray-500 font-bold mb-1">FCFA</span>
              </div>
              <button 
                onClick={() => openConfigModal('PRICE_SMS_PACK', 'Pack SMS', smsPrice.toString(), 'VOLUME_SMS_PACK', smsVolume.toString())}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-[#0F7A60] hover:text-white text-gray-700 rounded-xl font-bold transition-all border border-gray-100 hover:border-transparent group-hover:bg-[#0F7A60] group-hover:text-white"
              >
                <Settings size={18} /> Configurer le Pack
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] p-6 border border-gray-100 transition-colors relative overflow-hidden group hover:border-indigo-200 hover:shadow-md">
              <div className="absolute top-0 right-0 p-8 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110">
                <Bot className="text-indigo-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 relative z-10">Pack Tokens IA</h3>
              <p className="text-sm font-bold text-indigo-600 mt-1 mb-6 relative z-10 bg-indigo-50 inline-block px-2 py-0.5 rounded-lg">{aiVolume} tokens inclus / pack</p>
              <div className="flex items-end gap-2 mb-6 relative z-10">
                <span className="text-3xl font-black tracking-tight">{Number(aiPrice).toLocaleString('fr-FR')}</span>
                <span className="text-gray-500 font-bold mb-1">FCFA</span>
              </div>
              <button 
                onClick={() => openConfigModal('PRICE_AI_PACK', 'Tokens IA', aiPrice.toString(), 'VOLUME_AI_PACK', aiVolume.toString())}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-700 rounded-xl font-bold transition-all border border-gray-100 hover:border-transparent group-hover:bg-indigo-600 group-hover:text-white"
              >
                <Settings size={18} /> Configurer le Pack
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] p-6 border border-gray-100 transition-colors relative overflow-hidden group hover:border-purple-200 hover:shadow-md">
              <div className="absolute top-0 right-0 p-8 bg-purple-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110">
                <Cloud className="text-purple-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 relative z-10">Extension Cloud</h3>
              <p className="text-sm font-bold text-gray-400 mt-1 mb-6 relative z-10 bg-gray-50 border border-gray-100 inline-block px-2 py-0.5 rounded-lg">Abonnement Mensuel</p>
              <div className="flex items-end gap-2 mb-6 relative z-10">
                <span className="text-3xl font-black tracking-tight">{Number(cloudPrice).toLocaleString('fr-FR')}</span>
                <span className="text-gray-500 font-bold mb-1">FCFA / mois</span>
              </div>
              <button 
                onClick={() => openConfigModal('PRICE_CLOUD_EXTENSION', 'Abonnement Cloud', cloudPrice.toString())}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-purple-600 hover:text-white text-gray-700 rounded-xl font-bold transition-all border border-gray-100 hover:border-transparent group-hover:bg-purple-600 group-hover:text-white"
              >
                <Settings size={18} /> Configurer le Tarif
              </button>
            </div>

          </div>

          {/* RECHERCHE ET LISTE BOUTIQUES */}
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-black">Ressources par Boutique</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher une boutique..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0F7A60] focus:border-[#0F7A60] transition-all outline-none text-sm placeholder:text-gray-400"
                  title="Rechercher"
                  aria-label="Rechercher une boutique"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                 <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                   <tr>
                     <th className="px-6 py-4 border-b border-gray-100">Boutique</th>
                     <th className="px-6 py-4 border-b border-gray-100">Crédits IA</th>
                     <th className="px-6 py-4 border-b border-gray-100">Crédits SMS</th>
                     <th className="px-6 py-4 border-b border-gray-100">Abonnement(s)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {filteredStores.map(store => (
                     <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-6 py-4">
                         <p className="font-black text-gray-900 text-base">{store.store_name || 'Boutique Sans Nom'}</p>
                         <p className="text-sm font-medium text-gray-500">{store.user.name} • {store.user.phone}</p>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs ${store.ai_credits > 0 ? "bg-indigo-50 text-indigo-700 tracking-wider" : "bg-gray-100 text-gray-500"}`}>
                           {store.ai_credits} TOKENS
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs ${((store.sms_credits?.credits || 0) > 0) ? "bg-[#0F7A60]/10 text-[#0F7A60] tracking-wider" : "bg-gray-100 text-gray-500"}`}>
                           {store.sms_credits?.credits || 0} MSG
                         </span>
                       </td>
                       <td className="px-6 py-4 flex gap-1 flex-wrap">
                         {store.subscriptions.length > 0 
                           ? store.subscriptions.map((s, i) => <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg uppercase tracking-wider">{s.plan}</span>)
                           : <span className="text-gray-400 italic font-medium">Gratuit</span>
                         }
                       </td>
                     </tr>
                   ))}
                   {filteredStores.length === 0 && (
                      <tr>
                         <td colSpan={4} className="text-center py-12 text-gray-400 font-medium h-48">
                           Aucune boutique trouvée.
                         </td>
                      </tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // HISTORIQUE FINANCIER
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Historique des Transactions</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Revenu total généré affiché : <span className="text-[#0F7A60] font-black">{initialPurchases.reduce((acc, curr) => acc + curr.amount_paid, 0).toLocaleString('fr-FR')} FCFA</span>
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0F7A60] focus:border-[#0F7A60] transition-all outline-none text-sm placeholder:text-gray-400"
                title="Rechercher"
                aria-label="Rechercher une transaction"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
               <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                 <tr>
                   <th className="px-6 py-4 border-b border-gray-100">Date</th>
                   <th className="px-6 py-4 border-b border-gray-100">Boutique</th>
                   <th className="px-6 py-4 border-b border-gray-100">Type de Monétisation</th>
                   <th className="px-6 py-4 border-b border-gray-100 text-right">Montant Réglé</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredPurchases.map(purchase => (
                   <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                       {new Date(purchase.purchased_at).toLocaleDateString('fr-FR', {
                         day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                       })}
                     </td>
                     <td className="px-6 py-4">
                       <p className="font-bold text-gray-900">{purchase.store.store_name}</p>
                       <p className="text-xs text-gray-500">{purchase.store.user.name}</p>
                     </td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-black text-[10px] uppercase tracking-wider">
                         {purchase.asset_type.replace(/_/g, ' ')}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right font-black text-gray-900 text-base">
                       {purchase.amount_paid.toLocaleString('fr-FR')} FCFA
                     </td>
                   </tr>
                 ))}
                 {filteredPurchases.length === 0 && (
                    <tr>
                       <td colSpan={4} className="text-center py-12 text-gray-400 font-medium h-48">
                         Aucun achat de SaaS enregistré.
                       </td>
                    </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CONFIG PACk */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !loading && setEditingConfig(null)} />
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button title="Fermer" aria-label="Fermer" onClick={() => !loading && setEditingConfig(null)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-50 p-2 rounded-full">
              <X size={20} />
            </button>
            <h3 className="text-xl font-black text-gray-900 mb-1">Configuration {editingConfig.label}</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Ajustez les modalités du produit servi.</p>
            
            <div className="space-y-4">
              
              {/* CHAMP VOLUME */}
              {editingConfig.volumeKey && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Volume inclus (Unités)</label>
                  <input 
                    type="number"
                    title="Volume alloué par pack"
                    placeholder="Ex: 1000"
                    value={configVolumeValue}
                    onChange={e => setConfigVolumeValue(e.target.value)}
                    className="w-full text-lg font-black px-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0F7A60] focus:border-[#0F7A60] transition-colors"
                  />
                  <p className="text-[11px] text-gray-500 font-medium mt-1">Crédits/Tokens reçus par vos vendeurs lors de l'achat de ce pack.</p>
                </div>
              )}

              {/* CHAMP PAIEMENT */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prix de vente (FCFA)</label>
                <input 
                  type="number"
                  title="Montant en FCFA"
                  placeholder="Ex: 5000"
                  value={configPriceValue}
                  onChange={e => setConfigPriceValue(e.target.value)}
                  className="w-full text-lg font-black px-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#0F7A60] focus:border-[#0F7A60] transition-colors"
                />
              </div>

              <button 
                onClick={handleUpdateConfig}
                disabled={loading || !configPriceValue || (!!editingConfig.volumeKey && !configVolumeValue)}
                className="w-full mt-2 bg-[#0F7A60] text-white rounded-xl py-3.5 font-bold hover:bg-[#0D5C4A] disabled:opacity-50 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#0F7A60]/20"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Sauvegarder le Produit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
