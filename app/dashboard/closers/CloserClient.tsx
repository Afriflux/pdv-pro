'use client'

import { useState } from 'react'
import { Settings, Trash2, CheckCircle, PhoneCall, Plus, Package, Layers, Store } from 'lucide-react'
import { toast } from '@/lib/toast'
import { updateStoreCloserSettings, updateProductCloserSettings } from './actions'

export interface CloserPerformance {
  closer_id: string
  name: string
  contacted_count: number
  won_count: number
  lost_count: number
  total_commissions: number
}

export interface ProductOverride {
  id: string
  name: string
  closer_active: boolean | null
  closer_margin: number | null
}

export interface CloserClientProps {
  storeId: string
  initialActive: boolean
  initialMargin: number
  products: ProductOverride[]
  performances: CloserPerformance[]
}

function OverrideRow({ item, onSave, onRemove, isLoading }: { item: ProductOverride, onSave: (active: boolean|null, margin: number|null) => void, onRemove: () => void, isLoading: boolean }) {
  const initialActive = item.closer_active === false ? 'false' : 'true'
  const [localActive, setLocalActive] = useState<string>(initialActive)
  const [localMargin, setLocalMargin] = useState<string>(item.closer_margin != null ? String(item.closer_margin * 100) : '')
  
  const hasChanged = 
    (localActive === 'true' && item.closer_active !== true) ||
    (localActive === 'false' && item.closer_active !== false) ||
    (localActive === 'true' && (item.closer_margin ? String(item.closer_margin * 100) : '') !== localMargin)

  const canSave = localActive === 'false' || (localActive === 'true' && localMargin.trim() !== '')

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition">
      <td className="py-4 px-4 font-bold text-gray-900 max-w-[200px] truncate" title={item.name}>{item.name}</td>
      <td className="py-4 px-4">
        <select 
          aria-label="Statut du Closing pour ce produit"
          value={localActive} 
          onChange={e => setLocalActive(e.target.value)}
          className="bg-white border text-sm border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#0F7A60]/20 font-medium text-gray-700 w-full"
        >
          <option value="true">Personnalisé</option>
          <option value="false">Désactivé</option>
        </select>
      </td>
      <td className="py-4 px-4">
        {localActive !== 'false' ? (
          <div className="flex items-center gap-2">
            <input 
              aria-label="Commission personnalisée"
              type="number" min="0" max="100" step="0.1"
              placeholder="Ex: 20"
              value={localMargin}
              onChange={e => setLocalMargin(e.target.value)}
              className="bg-white border text-sm font-bold border-gray-200 rounded-xl px-3 py-2 w-24 outline-none focus:ring-2 focus:ring-[#0F7A60]/20 disabled:bg-gray-100 disabled:text-gray-400"
            />
            <span className="text-gray-400 font-bold">%</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm font-medium italic">Commission nulle</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-3">
          {hasChanged ? (
            <button 
              type="button"
              onClick={() => {
                const activeVal = localActive === 'true'
                const marginVal = localActive === 'true' && localMargin ? parseFloat(localMargin) : null
                onSave(activeVal, marginVal)
              }}
              disabled={isLoading || !canSave}
              className="bg-[#0F7A60] hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? '...' : 'Enregistrer'}
            </button>
          ) : (
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider px-2">À jour</span>
          )}
          <button 
            type="button"
            onClick={onRemove}
            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
            title="Supprimer cette exception (Retour à la normale)"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function CloserClient({ storeId, initialActive, initialMargin, products: initialProducts, performances }: CloserClientProps) {
  const [isActive, setIsActive] = useState(initialActive)
  const [mainTab, setMainTab] = useState<'general' | 'performances'>('general')
  const [margin, setMargin] = useState(initialMargin * 100) 
  const [products, setProducts] = useState<ProductOverride[]>(initialProducts)
  
  const [visibleProductIds, setVisibleProductIds] = useState<string[]>(
    initialProducts.filter(p => p.closer_active !== null || p.closer_margin !== null).map(p => p.id)
  )

  const [isSaving, setIsSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    const res = await updateStoreCloserSettings(storeId, isActive, margin / 100)
    if (res.success) toast.success('Paramètres sauvegardés avec succès')
    else toast.error(res.error || 'Erreur lors de la sauvegarde')
    setIsSaving(false)
  }

  const handleUpdateOverride = async (id: string, overrideActive: boolean | null, localMargin: number | null) => {
    setActionLoading(`override-${id}`)
    const res = await updateProductCloserSettings(id, overrideActive, localMargin ? localMargin / 100 : null)
    if (res.success) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, closer_active: overrideActive, closer_margin: localMargin ? localMargin / 100 : null } : p))
      toast.success("Règle produit mise à jour")
    } else {
      toast.error("Erreur de sauvegarde")
    }
    setActionLoading(null)
  }

  const handleRemoveOverride = async (id: string) => {
    const isAlreadyNull = products.find(p => p.id === id)?.closer_active === null 

    if (isAlreadyNull) {
      setVisibleProductIds(prev => prev.filter(pid => pid !== id))
      return
    }

    setActionLoading(`override-${id}`)
    const res = await updateProductCloserSettings(id, null, null)
    if (res.success) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, closer_active: null, closer_margin: null } : p))
      setVisibleProductIds(prev => prev.filter(pid => pid !== id))
      toast.success("Règle supprimée")
    } else {
      toast.error("Erreur de sauvegarde")
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── TABS DE NAVIGATION GLOBALE ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px mb-6 mt-4">
        <button 
          onClick={() => setMainTab('general')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${mainTab === 'general' ? 'border-[#0F7A60] text-[#0F7A60]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Gestion & Règles
        </button>
        <button 
          onClick={() => setMainTab('performances')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${mainTab === 'performances' ? 'border-[#0F7A60] text-[#0F7A60]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Performances de l'Équipe
        </button>
      </div>

      {mainTab === 'general' ? (
        <>
          {/* BANNIÈRE AIDE / CONSEIL */}
          <div className="bg-gradient-to-r from-[#0F7A60] to-[#0D5C4A] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
             <PhoneCall className="absolute right-10 text-white/5 w-40 h-40 transform -rotate-12 pointer-events-none hidden md:block" />
             
             <div className="relative z-10 max-w-2xl">
               <h3 className="text-xl font-black mb-2 text-white flex items-center gap-2">
                 Système de Closing 🔥
               </h3>
               <p className="text-sm text-white/70 leading-relaxed font-medium">
                 Confiez vos paniers abandonnés à des experts en négociation téléphonique sans coût fixe.
                 La règle globale transmet les leads automatiquement avec la commission fixée.
               </p>
             </div>
             
             <div className="relative z-10 flex flex-col gap-2 shrink-0 w-full md:w-auto">
               <div className="flex items-center gap-3 text-xs font-bold bg-white/[0.08] p-3 rounded-xl backdrop-blur-sm border border-white/[0.05]">
                 <CheckCircle size={16} className="text-[#0F7A60]" />
                 <span className="text-white/90">Paiement au résultat (CPA)</span>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#0F7A60]/10 text-[#0F7A60]' : 'bg-orange-50 text-orange-600'}`}>
                  <Settings size={22} className={isActive ? 'opacity-90' : 'animate-spin-slow'} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1A1A]">
                    Programme de Closing
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {isActive ? 'Activé (envoi automatique)' : 'Mode Manuel ou Désactivé'}
                  </p>
                </div>
              </div>

              <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner">
                <button 
                  onClick={() => setIsActive(true)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-white text-[#1A1A1A] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Store size={16} className={isActive ? 'text-[#0F7A60]' : 'text-gray-400'} />
                  Globale
                </button>
                <button 
                  onClick={() => setIsActive(false)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${!isActive ? 'bg-white text-[#1A1A1A] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Layers size={16} className={!isActive ? 'text-orange-500' : 'text-gray-400'} />
                  Personnalisée
                </button>
              </div>
            </div>

            {/* CONTENU MODE GLOBAL */}
            {isActive && (
              <div className="bg-white border-t border-gray-50 flex flex-col">
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6">
                  <div className="w-full md:w-64">
                    <label htmlFor="closer-margin" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
                      Commission par défaut
                    </label>
                    <div className="relative">
                      <input 
                        id="closer-margin"
                        type="number" min="0" max="100"
                        value={margin}
                        onChange={e => setMargin(Number(e.target.value))}
                        className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl py-3.5 px-5 pr-12 focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] font-black text-xl text-[#1A1A1A] transition-all"
                        aria-label="Commission par défaut pour les closers"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">%</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full md:w-auto bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer le mode global'}
                  </button>
                </div>
              </div>
            )}

            {/* CONTENU MODE PERSONNALISÉ (EXCEPTIONS) */}
            {!isActive && (
              <div className="animate-fade-in">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button className="px-4 py-1.5 rounded-md text-xs font-bold transition-colors bg-gray-100 text-[#1A1A1A]">
                      Exceptions par Produits
                    </button>
                  </div>

                  <div className="relative max-w-sm w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Plus size={16} />
                    </div>
                    <select 
                      aria-label="Sélectionner un produit pour ajouter une exception"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#1A1A1A] appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm"
                      value=""
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id) return;
                        if (!visibleProductIds.includes(id)) setVisibleProductIds([...visibleProductIds, id]);
                      }}
                    >
                      <option value="">Sélectionner un produit...</option>
                      {products.filter(p => !visibleProductIds.includes(p.id)).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4 border-b border-gray-100">Cible (Produit)</th>
                        <th className="px-6 py-4 border-b border-gray-100">Statut du Closing</th>
                        <th className="px-6 py-4 border-b border-gray-100">Commission (sur vente réussie)</th>
                        <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {visibleProductIds.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center bg-white">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                               <Package size={20} className="text-gray-400" />
                            </div>
                            <p className="text-[#1A1A1A] text-sm font-bold">Aucun produit configuré.</p>
                            <p className="text-xs text-gray-400 mt-1 font-medium">Les autres produits auront 0% car le mode global est désactivé.</p>
                          </td>
                        </tr>
                      )}
                      
                      {products.filter(p => visibleProductIds.includes(p.id)).map(p => (
                        <OverrideRow 
                          key={p.id} item={p} 
                          onSave={(active, marg) => handleUpdateOverride(p.id, active, marg)} 
                          onRemove={() => handleRemoveOverride(p.id)}
                          isLoading={actionLoading === `override-${p.id}`} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t border-gray-50 bg-[#FAFAF7]/50 flex justify-end">
                   <button 
                     onClick={handleSaveSettings}
                     disabled={isSaving}
                     className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
                   >
                     {isSaving ? 'Enregistrement...' : 'Valider le Mode Personnalisé'}
                   </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ONGLET PERFORMANCES */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
            <div>
              <h3 className="text-xl font-black text-[#1A1A1A]">Performances Closers</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">Analyse des équipes intervenant sur vos leads</p>
            </div>
            <div className="bg-[#FAFAF7] border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 shadow-sm">
              {performances.length} membre(s)
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#FAFAF7]/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Closer</th>
                  <th className="px-6 py-4 text-center">Négociation</th>
                  <th className="px-6 py-4 text-center">Taux Succès</th>
                  <th className="px-6 py-4 text-right">Commissions Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {performances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                      Aucun closer n'a encore traité vos leads.
                    </td>
                  </tr>
                ) : (
                  performances.map((perf, idx) => {
                    const totalResolved = perf.won_count + perf.lost_count
                    const winRate = totalResolved > 0 ? Math.round((perf.won_count / totalResolved) * 100) : 0
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400">
                              {perf.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-gray-900">{perf.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                            {perf.contacted_count} en cours
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                             <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full mb-1 overflow-hidden flex">
                               {/* eslint-disable-next-line react/forbid-dom-props */}
                               <div className="h-full bg-emerald-500" style={{ width: `${winRate}%` }}></div>
                               {/* eslint-disable-next-line react/forbid-dom-props */}
                               <div className="h-full bg-red-400" style={{ width: `${totalResolved > 0 ? 100 - winRate : 0}%` }}></div>
                             </div>
                             <span className="text-[10px] font-bold text-gray-500">{perf.won_count} / {totalResolved} ({winRate}%)</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-[#1A1A1A]">
                          {perf.total_commissions.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
