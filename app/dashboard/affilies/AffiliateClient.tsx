'use client'

import { useState } from 'react'
import { Info, Settings, Trash2, TrendingUp, CheckCircle, Plus, Users, Award, Wallet, Search, MousePointer2, BadgeDollarSign, ExternalLink, MessageCircle, XCircle, Layers, Store, Packages, AppWindow, Package, Layout, AlertCircle } from 'lucide-react'
import { updateStoreAffiliateSettings, approveAffiliate, rejectAffiliate, updateProductAffiliateSettings, updateSalePageAffiliateSettings } from '@/lib/affiliates/affiliateActions'

import { toast } from 'sonner'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'

export interface AffiliateData {
  id:             string
  code:           string
  status:         string
  clicks:         number
  total_sales:    number
  total_earnings: number
  created_at:     string
  user: {
    id:    string
    name:  string | null
    email: string
    phone: string | null
} | null
}

export interface OverrideItem {
  id: string
  name: string
  affiliate_active: boolean | null
  affiliate_margin: number | null
}

export interface AffiliateClientProps {
  storeId: string
  storeSlug: string
  initialActive: boolean
  initialMargin: number
  affiliates: AffiliateData[]
  products: OverrideItem[]
  salePages: OverrideItem[]
}

function OverrideRow({ item, onSave, onRemove, isLoading }: { item: OverrideItem, onSave: (active: boolean|null, margin: number|null) => void, onRemove: () => void, isLoading: boolean }) {
  const initialActive = item.affiliate_active === false ? 'false' : 'true'
  const [localActive, setLocalActive] = useState<string>(initialActive)
  const [localMargin, setLocalMargin] = useState<string>(item.affiliate_margin != null ? String(item.affiliate_margin * 100) : '')
  
  const hasChanged = 
    (localActive === 'true' && item.affiliate_active !== true) ||
    (localActive === 'false' && item.affiliate_active !== false) ||
    (localActive === 'true' && (item.affiliate_margin ? String(item.affiliate_margin * 100) : '') !== localMargin)

  const canSave = localActive === 'false' || (localActive === 'true' && localMargin.trim() !== '')

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition">
      <td className="py-4 px-4 font-bold text-gray-900 max-w-[200px] truncate" title={item.name}>{item.name}</td>
      <td className="py-4 px-4">
        <select 
          aria-label="Statut d'affiliation"
          title="Statut d'affiliation"
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
              title="Commission personnalisée"
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
              title="Enregistrer la règle"
              aria-label="Enregistrer la règle"
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
            aria-label="Supprimer cette exception"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AffiliateClient({ storeId, storeSlug, initialActive, initialMargin, affiliates: initialAffiliates, products: initialProducts, salePages: initialSalePages }: AffiliateClientProps) {
  const [isActive, setIsActive] = useState(initialActive)
  const [margin, setMargin] = useState(initialMargin * 100) // stocké en décimal, affiché en %
  const [affiliates, setAffiliates] = useState<AffiliateData[]>(initialAffiliates)
  const [products, setProducts] = useState<OverrideItem[]>(initialProducts)
  const [salePages, setSalePages] = useState<OverrideItem[]>(initialSalePages)
  const [activeTab, setActiveTab] = useState<'products' | 'pages'>('products')
  
  const [visibleProductIds, setVisibleProductIds] = useState<string[]>(
    initialProducts.filter(p => p.affiliate_active !== null || p.affiliate_margin !== null).map(p => p.id)
  )
  const [visiblePageIds, setVisiblePageIds] = useState<string[]>(
    initialSalePages.filter(p => p.affiliate_active !== null || p.affiliate_margin !== null).map(p => p.id)
  )

  const [isSaving, setIsSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    await updateStoreAffiliateSettings(storeId, isActive, margin / 100)
    setIsSaving(false)
    toast.success('Paramètres sauvegardés avec succès')
  }

  const handleApprove = async (aff: AffiliateData) => {
    setActionLoading(aff.id)
    
    const res = await approveAffiliate(aff.id)
    
    if (res.success) {
      // Message via WA
      const waMsg = `Bonjour ! Votre code affilié PDV Pro est : ${aff.code}`
      const phone = aff.user?.phone?.replace(/\D/g, '') ?? ''

      if (phone) {
        const encodedMessage = encodeURIComponent(waMsg)
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
      } else {
        toast.info("L'affilié a été approuvé, mais aucun numéro WhatsApp n'est enregistré pour l'envoi du message.")
      }

      setAffiliates(prev => prev.map(a => a.id === aff.id ? { ...a, status: 'active' } : a))
      toast.success('Affilié accepté')
    } else {
      toast.error('Une erreur est survenue')
    }
    setActionLoading(null)
  }

  const handleReject = async (affiliateId: string, isSuspend = false) => {
    if (!confirm(isSuspend ? "Voulez-vous suspendre cet affilié actif ?" : "Voulez-vous vraiment refuser cet affilié ?")) return
    setActionLoading(affiliateId)
    const res = await rejectAffiliate(affiliateId)
    if (res.success) {
      setAffiliates(prev => prev.map(a => a.id === affiliateId ? { ...a, status: 'rejected' } : a))
      toast.success(isSuspend ? 'Affilié suspendu' : 'Affilié refusé')
    } else {
      toast.error('Une erreur est survenue')
    }
    setActionLoading(null)
  }

  const handleUpdateOverride = async (type: 'product' | 'page', id: string, overrideActive: boolean | null, margin: number | null) => {
    setActionLoading(`override-${id}`)
    if (type === 'product') {
      const res = await updateProductAffiliateSettings(id, overrideActive, margin ? margin / 100 : null)
      if (res.success) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, affiliate_active: overrideActive, affiliate_margin: margin ? margin / 100 : null } : p))
        toast.success("Règle produit mise à jour")
      } else toast.error("Erreur de sauvegarde")
    } else {
      const res = await updateSalePageAffiliateSettings(id, overrideActive, margin ? margin / 100 : null)
      if (res.success) {
        setSalePages(prev => prev.map(p => p.id === id ? { ...p, affiliate_active: overrideActive, affiliate_margin: margin ? margin / 100 : null } : p))
        toast.success("Règle page mise à jour")
      } else toast.error("Erreur de sauvegarde")
    }
    setActionLoading(null)
  }

  const handleRemoveOverride = async (type: 'product' | 'page', id: string) => {
    const isAlreadyNull = type === 'product' 
      ? products.find(p => p.id === id)?.affiliate_active === null 
      : salePages.find(p => p.id === id)?.affiliate_active === null

    if (isAlreadyNull) {
      if (type === 'product') setVisibleProductIds(prev => prev.filter(pid => pid !== id))
      else setVisiblePageIds(prev => prev.filter(pid => pid !== id))
      return
    }

    setActionLoading(`override-${id}`)
    if (type === 'product') {
      const res = await updateProductAffiliateSettings(id, null, null)
      if (res.success) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, affiliate_active: null, affiliate_margin: null } : p))
        setVisibleProductIds(prev => prev.filter(pid => pid !== id))
        toast.success("Règle supprimée")
      } else toast.error("Erreur de sauvegarde")
    } else {
      const res = await updateSalePageAffiliateSettings(id, null, null)
      if (res.success) {
        setSalePages(prev => prev.map(p => p.id === id ? { ...p, affiliate_active: null, affiliate_margin: null } : p))
        setVisiblePageIds(prev => prev.filter(pid => pid !== id))
        toast.success("Règle supprimée")
      } else toast.error("Erreur de sauvegarde")
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* BANNIÈRE AIDE / CONSEIL */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <TrendingUp className="absolute right-10 text-white/5 w-40 h-40 transform -rotate-12 pointer-events-none hidden md:block" />
        
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-xl font-black mb-2 text-white flex items-center gap-2">
            Conseil de croissance 🚀
          </h3>
          <p className="text-sm text-white/70 leading-relaxed font-medium">
            Recruter des affiliés développe vos ventes sans avancer de frais publicitaires. 
            Une commission de <strong>15% à 20%</strong> est le standard du marché. La règle <em>"Toute la boutique"</em> s'applique à tous vos produits, sauf si vous ajoutez des exceptions.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col gap-2 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-3 text-xs font-bold bg-white/[0.08] p-3 rounded-xl backdrop-blur-sm border border-white/[0.05]">
            <CheckCircle size={16} className="text-[#0F7A60]" />
            <span className="text-white/90">Zéro risque financier</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold bg-white/[0.08] p-3 rounded-xl backdrop-blur-sm border border-white/[0.05]">
            <CheckCircle size={16} className="text-[#0F7A60]" />
            <span className="text-white/90">Paiement après livraison</span>
          </div>
        </div>
      </div>

      {/* RÈGLES DE COMMISSIONS UNIFIÉES */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#0F7A60]/10 text-[#0F7A60]' : 'bg-orange-50 text-orange-600'}`}>
              <Settings size={22} className={isActive ? 'opacity-90' : 'animate-spin-slow'} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1A1A]">
                Mode d'Affiliation
              </h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                {isActive ? 'Globale (Toute la boutique)' : 'Sur-mesure (Exceptions)'}
              </p>
            </div>
          </div>

          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner">
            <button 
              onClick={() => setIsActive(true)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-white text-[#1A1A1A] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Store size={16} className={isActive ? 'text-[#0F7A60]' : 'text-gray-400'} />
              Toute la boutique
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
            {(visibleProductIds.length > 0 || visiblePageIds.length > 0) && (
               <div className="mx-6 md:mx-8 mt-6 bg-orange-50 text-orange-800 text-xs font-medium p-4 rounded-xl border border-orange-100 flex items-start md:items-center gap-3">
                 <AlertCircle size={16} className="shrink-0 mt-0.5 md:mt-0" />
                 <p>Vous avez <strong className="font-bold">{visibleProductIds.length + visiblePageIds.length}</strong> exceptions configurées. Notez qu'elles restent prioritaires sur cette règle globale.<br className="hidden md:block"/> Pour une commission 100% unifiée paramétrée ici, veuillez les supprimer via le mode Personnalisé.</p>
               </div>
            )}
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6">
              <div className="w-full md:w-64">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
                  Commission par défaut
                </label>
                <div className="relative">
                  <input 
                    aria-label="Commission par défaut pour toute la boutique"
                    title="Commission par défaut pour toute la boutique"
                    type="number" min="0" max="100"
                    value={margin}
                    onChange={e => setMargin(Number(e.target.value))}
                    className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl py-3.5 px-5 pr-12 focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] font-black text-xl text-[#1A1A1A] transition-all"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">%</span>
                </div>
              </div>
              
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full md:w-auto bg-[#1A1A1A] hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
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
                <button 
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'products' ? 'bg-gray-100 text-[#1A1A1A]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Produits
                </button>
                <button 
                  onClick={() => setActiveTab('pages')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'pages' ? 'bg-gray-100 text-[#1A1A1A]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Pages de vente
                </button>
              </div>

              <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Plus size={16} />
                </div>
                <select 
                  title="Ajouter une exception"
                  aria-label="Ajouter une exception"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#1A1A1A] appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-colors"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    if (activeTab === 'products') {
                      if (!visibleProductIds.includes(id)) setVisibleProductIds([...visibleProductIds, id]);
                    } else {
                      if (!visiblePageIds.includes(id)) setVisiblePageIds([...visiblePageIds, id]);
                    }
                  }}
                >
                  <option value="">Sélectionner {activeTab === 'products' ? 'un produit' : 'une page de vente'}...</option>
                  {activeTab === 'products' && products.filter(p => !visibleProductIds.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {activeTab === 'pages' && salePages.filter(p => !visiblePageIds.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-white text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 border-b border-gray-100">Cible (Produit / Page)</th>
                    <th className="px-6 py-4 border-b border-gray-100">Statut du lien</th>
                    <th className="px-6 py-4 border-b border-gray-100">Commission (sur config. finale)</th>
                    <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* LIGNES EXCEPTIONS */}
                  {activeTab === 'products' && visibleProductIds.length === 0 && (
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
                  {activeTab === 'products' && products.filter(p => visibleProductIds.includes(p.id)).map(p => (
                    <OverrideRow 
                      key={p.id} item={p} 
                      onSave={(active, marg) => handleUpdateOverride('product', p.id, active, marg)} 
                      onRemove={() => handleRemoveOverride('product', p.id)}
                      isLoading={actionLoading === `override-${p.id}`} 
                    />
                  ))}

                  {activeTab === 'pages' && visiblePageIds.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center bg-white">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                           <Layout size={20} className="text-gray-400" />
                        </div>
                        <p className="text-[#1A1A1A] text-sm font-bold">Aucune page configurée.</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Sélectionnez une page de vente depuis le menu déroulant.</p>
                      </td>
                    </tr>
                  )}
                  {activeTab === 'pages' && salePages.filter(p => visiblePageIds.includes(p.id)).map(p => (
                    <OverrideRow 
                      key={p.id} item={p} 
                      onSave={(active, marg) => handleUpdateOverride('page', p.id, active, marg)} 
                      onRemove={() => handleRemoveOverride('page', p.id)}
                      isLoading={actionLoading === `override-${p.id}`} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* BOUTON ENREGISTRER MODE PERSONNALISÉ SEUL */}
            <div className="p-4 border-t border-gray-50 bg-[#FAFAF7]/50 flex justify-end">
               <button 
                 onClick={handleSaveSettings}
                 disabled={isSaving}
                 className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 hover:shadow-orange-500/20 disabled:opacity-70"
               >
                 {isSaving ? 'Enregistrement...' : 'Valider le Mode Personnalisé'}
               </button>
            </div>
          </div>
        )}
      </div>

      {/* LISTE DES AFFILIÉS */}
      {isActive && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
          <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-lg md:text-xl font-black text-[#1A1A1A]">Votre réseau</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">Vos ambassadeurs</p>
            </div>
            <div className="bg-[#FAFAF7] border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 shadow-sm">
              {affiliates.length} total
            </div>
          </div>

          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#FAFAF7]/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Ambassadeur</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-right">Performances</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-right">Total Gains</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <Users size={32} className="text-gray-400" />
                    </div>
                    <p className="text-[#1A1A1A] text-base font-bold mb-1">Aucun affilié pour le moment</p>
                    <p className="text-gray-400 text-xs font-medium">Partagez votre lien d'inscription pour recruter vos premiers ambassadeurs.</p>
                  </td>
                </tr>
              ) : (
                affiliates.map(aff => (
                  <tr key={aff.id} className="hover:bg-[#FAFAF7] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#0F7A60]/5 text-[#0F7A60] overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xl shadow-inner border border-[#0F7A60]/10">
                          {aff.user?.name ? aff.user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#1A1A1A] truncate">{aff.user?.name || 'Inconnu'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <p className="text-[11px] text-gray-500 font-mono">{aff.user?.phone || '...'}</p>
                             <button 
                               aria-label="Contacter sur WhatsApp"
                               title="Contacter sur WhatsApp"
                               onClick={() => {
                                 const phone = aff.user?.phone?.replace(/\D/g, '') ?? ''
                                 if (!phone) { toast.error('Numéro WhatsApp non renseigné'); return }
                                 window.open(`https://wa.me/${phone}`, '_blank')
                               }}
                               className="text-[#25D366] hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 bg-[#25D366]/10 p-1 rounded hover:bg-[#25D366]/20"
                             >
                               <MessageCircle size={14} />
                             </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {aff.status === 'active' && (
                        <span className="inline-flex items-center gap-1.5 bg-[#0F7A60]/10 text-[#0F7A60] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ring-1 ring-[#0F7A60]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A60]"></span> Actif
                        </span>
                      )}
                      {aff.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ring-1 ring-orange-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span> En attente
                        </span>
                      )}
                      {aff.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ring-1 ring-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Refusé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-5 text-gray-500">
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-400">Clics</p>
                          <p className="text-[#1A1A1A] font-mono font-black flex items-center justify-end gap-1">
                            <MousePointer2 size={12} className="text-gray-400" /> {aff.clicks || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-400">Ventes</p>
                          <p className="text-[#1A1A1A] font-mono font-black flex items-center justify-end gap-1">
                            <TrendingUp size={12} className="text-gray-400" /> {aff.total_sales || 0}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-lg font-black text-[#0F7A60]">
                          {(aff.total_earnings || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-gray-400">FCFA</span>
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mt-0.5 flex items-center gap-1">
                          <BadgeDollarSign size={10} /> Gains générés
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {aff.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleApprove(aff)}
                            disabled={actionLoading === aff.id}
                            className="bg-[#0F7A60] hover:bg-[#0A5240] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                            title="Accepter l'affilié"
                          >
                            <CheckCircle size={14} /> Accepter
                          </button>
                          <button 
                            onClick={() => handleReject(aff.id, false)}
                            disabled={actionLoading === aff.id}
                            className="bg-white border border-gray-200 hover:bg-red-50 hover:border-red-100 hover:text-red-500 text-gray-500 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                            title="Refuser"
                          >
                            <XCircle size={14} /> Refuser
                          </button>
                        </div>
                      )}
                      {aff.status === 'active' && (
                        <div className="flex flex-col items-center justify-center gap-2">
                           <span className="text-[10px] text-gray-500 font-mono bg-[#FAFAF7] border border-gray-100 px-2 py-1 rounded-md font-bold">REF: {aff.code}</span>
                           <button 
                             onClick={async () => {
                               const link = `${appUrl}/s/${storeSlug}?ref=${aff.code}`
                               await navigator.clipboard.writeText(link)
                               toast.success('Lien copié !')
                             }}
                             className="text-[10px] text-[#0F7A60] font-bold hover:underline flex items-center gap-1 mt-1"
                           >
                             <ExternalLink size={10} /> Copier le lien
                           </button>
                           <button 
                             onClick={() => handleReject(aff.id, true)}
                             disabled={actionLoading === aff.id}
                             className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 mt-1"
                             title="Suspendre cet affilié"
                           >
                             <XCircle size={10} /> Suspendre
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
