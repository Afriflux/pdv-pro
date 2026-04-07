// Removed ts-nocheck
'use client'

import { useState } from 'react'
import { 
  Ticket, Search, Trash2, Power, Calendar, Target, ShoppingBag, Plus, Zap, 
  TrendingUp, Activity, Tag, Clock, ArrowRight, Megaphone,
  Truck, Gift, Users
} from 'lucide-react'
import { PromotionData, PromotionType, DiscountType, BundleConfig } from '@/lib/promotions/promotionType'
import { createPromotion, togglePromotionActive, updateStoreAnnouncement, updateStoreBoosters } from '@/lib/promotions/promotionActions'
import { PromoCodeData, createPromoCode, togglePromoCodeActive, deletePromoCode } from '@/lib/promotions/promoCodeActions'
import { toast } from '@/lib/toast'
import { MobileSimulator } from '@/components/shared/simulator/MobileSimulator'

export type AffiliateBase = {
  id: string;
  code: string;
  user?: { name?: string | null } | null;
}

interface PromotionsClientProps {
  storeId: string
  promotions: PromotionData[]
  promoCodes: PromoCodeData[]
  products: { id: string; name: string }[]
  affiliates?: AffiliateBase[]
  storeSettings?: {
    announcement_active: boolean
    announcement_text: string | null
    announcement_bg_color: string | null
    free_shipping_threshold?: number | null
    gamification_active?: boolean
    gamification_config?: Record<string, unknown> | null
  }
}

const PROMO_LABELS: Record<PromotionType, string> = {
  flash: '⚡ Vente Flash',
  seasonal: '🎉 Saisonnière',
  bundle: '📦 Pack / Bundle',
  conditional: '🚚 Conditionnelle',
  first_order: '👋 1ère Commande',
  ai: '🤖 IA Suggérée'
}

export default function PromotionsClient({ 
  storeId, 
  promotions: initialPromotions, 
  promoCodes: initialPromoCodes,
  products,
  affiliates = [],
  storeSettings
}: PromotionsClientProps) {
  const [activeTab, setActiveTab] = useState<'flash' | 'codes' | 'bandeau'>('flash')
  const [promotions, setPromotions] = useState<PromotionData[]>(initialPromotions)
  const [promoCodes, setPromoCodes] = useState<PromoCodeData[]>(initialPromoCodes)
  const [search, setSearch] = useState('')
  
  // Modals
  const [showFlashModal, setShowFlashModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  
  // -- Form State Flash Promo --
  const [fType, setFType] = useState<PromotionType>('flash')
  const [fTitle, setFTitle] = useState('')
  const [fDiscountType, setFDiscountType] = useState<DiscountType>('percentage')
  const [fDiscountValue, setFDiscountValue] = useState<number>(10)
  const [fProductId, setFProductId] = useState<string>('all')
  const [fDuration, setFDuration] = useState<number>(24)
  
  // Custom states for BOGO & Bundles
  const [bBuyQuantity, setBBuyQuantity] = useState<number>(2)
  const [bRewardType, setBRewardType] = useState<'free_item' | 'percentage_off'>('percentage_off')
  const [bRewardValue, setBRewardValue] = useState<number>(50)

  // -- Form State Promo Code --
  const [cCode, setCCode] = useState('')
  const [cType, setCType] = useState<'percentage' | 'fixed'>('percentage')
  const [cValue, setCValue] = useState(10)
  const [cMinOrder, setCMinOrder] = useState<string>('')
  const [cMaxUses, setCMaxUses] = useState<string>('')
  const [cExpiresAt, setCExpiresAt] = useState('')
  const [cProductId, setCProductId] = useState<string>('all')
  const [cAffiliateId, setCAffiliateId] = useState<string>('')
  const [cError, setCError] = useState<string | null>(null)

  // -- Form State Boosters --
  const [bandeauActive, setBandeauActive] = useState(storeSettings?.announcement_active ?? false)
  const [bandeauText, setBandeauText] = useState(storeSettings?.announcement_text || 'LIVRAISON GRATUITE SUR TOUTE LA BOUTIQUE')
  const [bandeauColor, setBandeauColor] = useState(storeSettings?.announcement_bg_color || '#1A1A1A')
  
  const [bFreeShipping, setBFreeShipping] = useState<number>(storeSettings?.free_shipping_threshold || 0)
  const [bGamificationActive, setBGamificationActive] = useState<boolean>(storeSettings?.gamification_active || false)
  const [bGamificationPrize, setBGamificationPrize] = useState<string>((storeSettings?.gamification_config?.prize_code as string) || '')

  const [isSavingBandeau, setIsSavingBandeau] = useState(false)

  // KPIs Calculation
  const totalRevenue = promotions.reduce((acc, p) => acc + p.revenue_generated, 0)
  const activeCount = 
    promotions.filter(p => p.active && (!p.ends_at || new Date(p.ends_at) > new Date())).length + 
    promoCodes.filter(c => c.active && (!c.expires_at || new Date(c.expires_at) > new Date())).length

  // ── LOGIQUE PROMOTIONS FLASH ───────────────────────────────────────
  
  const handleToggleFlash = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const ok = await togglePromotionActive(id, newStatus)
    if (ok) {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: newStatus } : p))
    }
  }

  const handleSubmitFlash = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeploying(true)

    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setHours(endsAt.getHours() + fDuration)

    const productIds = fProductId === 'all' ? [] : [fProductId]

    let bundleConfig: BundleConfig | undefined = undefined
    if (fType === 'bundle') {
      bundleConfig = {
        buyQuantity: bBuyQuantity,
        rewardType: bRewardType,
        rewardValue: bRewardType === 'free_item' ? 1 : bRewardValue
      }
    }

    const newPromo = await createPromotion({
      storeId,
      type: fType,
      title: fTitle,
      discountType: fType === 'bundle' ? 'percentage' : fDiscountType,
      discountValue: fType === 'bundle' ? 0 : fDiscountValue,
      productIds,
      bundleConfig,
      startsAt,
      endsAt,
    })

    if (newPromo) {
      let updatedPromos = promotions
      if (productIds.length > 0) {
        updatedPromos = updatedPromos.map(p => {
          if (p.product_ids?.some(id => productIds.includes(id))) {
            return { ...p, active: false }
          }
          return p
        })
      }
      setPromotions([newPromo, ...updatedPromos])
      setShowFlashModal(false)
      toast.success("Opération déployée !")
      setFTitle('')
      setFType('flash')
      setFDiscountValue(10)
    }
    setIsDeploying(false)
  }

  // ── LOGIQUE CODES PROMO ───────────────────────────────────────────

  const handleToggleCode = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const res = await togglePromoCodeActive(id, newStatus)
    if (res.success) {
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, active: newStatus } : p))
    }
  }

  const handleDeleteCode = async (id: string) => {
    if(!confirm("Supprimer ce coupon ?")) return
    const res = await deletePromoCode(id)
    if (res.success) {
      setPromoCodes(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeploying(true)
    setCError(null)

    const productIds = cProductId === 'all' ? [] : [cProductId]
    const expiresAt = cExpiresAt ? new Date(cExpiresAt) : null

    const payload = {
      storeId,
      code: cCode.trim().toUpperCase(),
      type: cType,
      value: cValue,
      min_order: cMinOrder ? parseFloat(cMinOrder) : null,
      max_uses: cMaxUses ? parseInt(cMaxUses, 10) : null,
      expires_at: expiresAt,
      product_ids: productIds,
      affiliate_id: cAffiliateId || null
    }

    const res = await createPromoCode(payload)

    if (res.success && res.data) {
      setPromoCodes([res.data, ...promoCodes])
      setShowCodeModal(false)
      toast.success("Nouveau Coupon généré !")
      setCCode('')
      setCValue(10)
      setCMinOrder('')
      setCMaxUses('')
      setCExpiresAt('')
      setCProductId('all')
      setCAffiliateId('')
    } else {
      setCError(res.error || "Une erreur est survenue")
    }
    setIsDeploying(false)
  }

  // ── LOGIQUE BANDEAU WEB & BOOSTERS ───────────────────────────────────────────

  const handleSaveBandeauAndBoosters = async () => {
    setIsSavingBandeau(true)
    
    const [successBandeau, successBoosters] = await Promise.all([
      updateStoreAnnouncement(storeId, {
        active: bandeauActive,
        text: bandeauText,
        bgColor: bandeauColor
      }),
      updateStoreBoosters(storeId, {
        freeShippingThreshold: bFreeShipping,
        gamificationActive: bGamificationActive,
        gamificationConfig: { prize_code: bGamificationPrize }
      })
    ])
    
    setIsSavingBandeau(false)
    if (successBandeau && successBoosters) {
      toast.success("Réglages marketing sauvegardés avec succès !")
    } else {
      toast.error("Erreur lors de la sauvegarde des réglages.")
    }
  }

  // -- Helpers --
  const filteredFlash = promotions.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  const filteredCodes = promoCodes.filter(p => p.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- KPI SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center shrink-0">
               <TrendingUp size={24} />
            </div>
            <div>
               <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-1">Impact Total (Revenus)</p>
               <p className="text-3xl font-black text-[#1A1A1A]">{totalRevenue.toLocaleString('fr-FR')} F</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
               <Activity size={24} />
            </div>
            <div>
               <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-1">Campagnes Actives</p>
               <p className="text-3xl font-black text-[#1A1A1A]">{activeCount}</p>
            </div>
         </div>
         <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] p-6 rounded-3xl border border-gray-800 flex items-center gap-5 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-gold flex items-center justify-center shrink-0">
               <Zap size={24} />
            </div>
            <div>
               <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-1">Taux de Conv. Global</p>
               <p className="text-3xl font-black text-white">+18.4%</p>
            </div>
         </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 w-full max-w-[500px]">
        <button 
          onClick={() => setActiveTab('flash')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'flash' ? 'bg-white text-ink shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Zap size={16} className={activeTab === 'flash' ? "text-gold" : ""} />
          <span>Campagnes</span>
        </button>
        <button 
          onClick={() => setActiveTab('codes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'codes' ? 'bg-white text-ink shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Ticket size={16} className={activeTab === 'codes' ? "text-emerald" : ""} />
          <span>Coupons</span>
        </button>
        <button 
          onClick={() => setActiveTab('bandeau')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'bandeau' ? 'bg-white text-ink shadow-sm ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Megaphone size={16} className={activeTab === 'bandeau' ? "text-blue-500" : ""} />
          <span>Popups & Boosters</span>
        </button>
      </div>

      {/* --- CONTENT FLASH SALES & BUNDLES --- */}
      {activeTab === 'flash' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
           
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" placeholder="Rechercher une opération..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:border-gold outline-none transition-all shadow-sm"
                />
              </div>
              <button 
                onClick={() => setShowFlashModal(true)}
                className="w-full md:w-auto bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition hover:shadow-lg hover:shadow-gold/30 hover:-translate-y-0.5"
              >
                <Plus size={20} /> Nouveau Push
              </button>
           </div>

           {/* Empty State Premium */}
           {promotions.length === 0 && !search && (
              <div className="w-full bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center mt-8">
                 <div className="w-24 h-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-white shadow-xl shadow-gold/10">
                    <Zap size={40} className="text-gold" />
                 </div>
                 <h3 className="text-2xl font-black text-ink mb-3">Créez l'urgence</h3>
                 <p className="text-gray-400 max-w-sm mb-8">Les ventes flash limitées dans le temps sont le meilleur moyen de booster vos conversions sur une période courte.</p>
                 <button 
                   onClick={() => setShowFlashModal(true)}
                   className="bg-ink text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"
                 >
                   Déployer ma première Vente <ArrowRight size={18} />
                 </button>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredFlash.map(promo => {
               const isExpired = promo.ends_at ? new Date(promo.ends_at) < new Date() : false
               const active = isExpired ? false : promo.active
               const isBundle = promo.type === 'bundle'
               const bConfig = promo.bundle_config as BundleConfig | null

               return (
                 <div key={promo.id} className={`group bg-white rounded-3xl border p-1 transition-all hover:shadow-xl ${!active ? 'border-gray-100 opacity-80' : 'border-gold/30 shadow-lg shadow-gold/5'}`}>
                    <div className="bg-gray-50 rounded-[28px] p-6 h-full relative overflow-hidden flex flex-col">
                       
                       {/* Background decoration for active promos */}
                       {active && (
                          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-all duration-500 ${isBundle ? 'bg-purple-500/10 group-hover:bg-purple-500/20' : 'bg-gold/10 group-hover:bg-gold/20'}`}></div>
                       )}

                       <div className="relative z-10 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${active ? (isBundle ? 'bg-purple-500/10 text-purple-600' : 'bg-gold/10 text-gold') : 'bg-gray-200 text-gray-500'}`}>
                              {isBundle ? <ShoppingBag size={14} fill={active ? "currentColor" : "none"} /> : <Zap size={14} fill={active ? "currentColor" : "none"} />}
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {PROMO_LABELS[promo.type] || 'Promotion'}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleToggleFlash(promo.id, promo.active)}
                              disabled={isExpired}
                              title="Basculer le statut"
                              className={`w-12 h-6 rounded-full relative transition-colors ${promo.active ? (isBundle ? 'bg-purple-500' : 'bg-gold') : 'bg-gray-300'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${promo.active ? 'left-7 shadow-sm' : 'left-1'}`} />
                            </button>
                          </div>

                          <h3 className="font-display font-black text-ink text-xl mb-1 line-clamp-1">{promo.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-8">
                             <Target size={14} className="text-gray-400" />
                             {(!promo.product_ids || promo.product_ids.length === 0) ? 'Valable sur toute la boutique' : `Ciblé sur ${promo.product_ids.length} produit(s)`}
                          </div>

                          <div className={`rounded-2xl p-4 flex items-center justify-between border shadow-sm mb-4 mt-auto ${isBundle ? 'bg-purple-50 border-purple-100/50' : 'bg-white border-gray-100/50'}`}>
                             <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Offre</p>
                                <p className="text-xl font-black text-[#1A1A1A]">
                                  {isBundle ? (
                                    bConfig?.rewardType === 'free_item' 
                                      ? `1 Acheté = 1 Offert` 
                                      : `-${bConfig?.rewardValue}% sur le ${bConfig?.buyQuantity ? bConfig.buyQuantity + 1 : 'prochain'}eme`
                                  ) : (
                                    promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-${promo.discount_value} F`
                                  )}
                                </p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Revenus</p>
                                <p className="text-xl font-black text-emerald">+{promo.revenue_generated.toLocaleString('fr-FR')}</p>
                             </div>
                          </div>

                          {promo.ends_at && !isExpired && (
                             <div className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase">
                                <Clock size={14} className="animate-pulse" /> Se termine bientôt
                             </div>
                          )}

                          {isExpired && (
                             <div className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-black uppercase">
                                Opération terminée
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               )
             })}
           </div>
        </div>
      )}

      {/* --- CONTENT COUPONS --- */}
      {activeTab === 'codes' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
           
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" placeholder="Rechercher par code (Ex: NOEL25)..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:border-emerald outline-none transition-all shadow-sm"
                />
              </div>
              <button 
                onClick={() => setShowCodeModal(true)}
                className="w-full md:w-auto bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition hover:shadow-xl hover:-translate-y-0.5"
              >
                <Ticket size={20} /> Nouveau Code Promo
              </button>
           </div>

           {promoCodes.length === 0 && !search && (
              <div className="w-full bg-white rounded-[32px] border border-gray-100 p-12 text-center flex flex-col items-center justify-center mt-8">
                 <div className="w-24 h-24 bg-gradient-to-br from-emerald/10 to-teal/5 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-xl shadow-emerald/10">
                    <Ticket size={40} className="text-emerald" />
                 </div>
                 <h3 className="text-2xl font-black text-ink mb-3">Récompensez vos meilleurs clients</h3>
                 <p className="text-gray-400 max-w-sm mb-8">Fournissez des bons d'achats ou des réductions aux influenceurs et clients fidèles avec des codes uniques.</p>
                 <button 
                   onClick={() => setShowCodeModal(true)}
                   className="bg-emerald text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition shadow-lg shadow-emerald/20"
                 >
                   Créer un code
                 </button>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredCodes.map(promo => {
               const expired = promo.expires_at ? new Date(promo.expires_at) < new Date() : false
               const active = expired ? false : promo.active

               return (
                 <div key={promo.id} className={`bg-white rounded-[24px] border transition-all hover:-translate-y-1 ${!active ? 'border-gray-100 opacity-80' : 'border-gray-200 shadow-xl shadow-black/5 hover:border-emerald/30'}`}>
                    
                    {/* Ticket Header */}
                    <div className="p-6 border-b border-dashed border-gray-200 bg-[#FAFAF7] rounded-t-[24px]">
                       <div className="flex justify-between items-start mb-4">
                         <div className="bg-emerald/10 text-emerald px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                           Coupon
                         </div>
                         <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200/50 shadow-sm">
                           <button 
                             onClick={() => handleToggleCode(promo.id, promo.active)}
                             disabled={expired}
                             className={`p-1.5 rounded-md transition-colors ${promo.active ? 'text-emerald bg-emerald/10' : 'text-gray-400 hover:bg-gray-100'}`}
                             title={promo.active ? 'Désactiver' : 'Activer'}
                           >
                             <Power size={14} />
                           </button>
                           <div className="w-px h-4 bg-gray-200"></div>
                           <button 
                             onClick={() => handleDeleteCode(promo.id)}
                             className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                             title="Supprimer"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                       
                       <div className="flex items-center justify-between">
                         <h3 className="font-mono font-black text-[#1A1A1A] text-2xl tracking-[0.1em] uppercase">{promo.code}</h3>
                         <div className="text-right">
                           <p className="text-3xl font-black text-emerald">
                             {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value}F`}
                           </p>
                         </div>
                       </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="p-6 space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            <Tag size={14} className="text-gray-500" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Cible</p>
                            <p className="text-sm font-medium text-ink truncate">
                               {(promo.product_ids && promo.product_ids.length > 0) ? products.find(p=>p.id===promo.product_ids[0])?.name || `${promo.product_ids.length} produits` : 'Toute la boutique'}
                            </p>
                         </div>
                       </div>

                       {promo.affiliate_id && (
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center shrink-0">
                              <Users size={14} className="text-emerald" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Ambassadeur Assigné</p>
                              <p className="text-sm font-black text-emerald truncate">
                                 {affiliates.find(a => a.id === promo.affiliate_id)?.user?.name || affiliates.find(a => a.id === promo.affiliate_id)?.code || promo.affiliate_id}
                              </p>
                           </div>
                         </div>
                       )}

                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            <ShoppingBag size={14} className="text-gray-500" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Utilisations</p>
                            <p className="text-sm font-medium text-ink">
                               <strong className="text-ink">{promo.uses}</strong> / {promo.max_uses || 'Illimité'}
                            </p>
                         </div>
                       </div>

                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            <Calendar size={14} className="text-gray-500" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Validité</p>
                            <p className={`text-sm font-medium ${expired ? 'text-red-500' : 'text-ink'}`}>
                               {promo.expires_at ? `Jusqu'au ${new Date(promo.expires_at).toLocaleDateString('fr-FR')}` : 'À vie'}
                            </p>
                         </div>
                       </div>
                    </div>

                 </div>
               )
             })}
           </div>
        </div>
      )}

      {/* --- CONTENT BANDEAU WEB --- */}
      {activeTab === 'bandeau' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
           
           <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
              <div className="flex items-start gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Megaphone size={32} />
                 </div>
                 <div className="flex-1 pt-1">
                    <h2 className="text-2xl font-black text-ink mb-2">Bandeau d'Annonce Web</h2>
                    <p className="text-gray-500 max-w-xl">
                      Attirez l'attention de vos visiteurs dès leur arrivée. Une barre colorée s'affichera en haut de toutes vos pages de ventes.
                    </p>
                 </div>
              </div>

              <div className="mt-10 max-w-4xl grid md:grid-cols-2 gap-10">
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#FAFAF7] rounded-2xl border border-gray-200">
                       <label className="font-bold text-ink cursor-pointer" htmlFor="toggle-bandeau">Activer le bandeau</label>
                       <button 
                         id="toggle-bandeau"
                         onClick={() => setBandeauActive(!bandeauActive)}
                         title="Activer ou désactiver le bandeau"
                         className={`w-14 h-8 rounded-full relative transition-colors ${bandeauActive ? 'bg-emerald' : 'bg-gray-300'}`}
                       >
                         <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${bandeauActive ? 'left-7 shadow-sm' : 'left-1'}`} />
                       </button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Message du bandeau</label>
                       <input 
                         type="text" 
                         value={bandeauText} 
                         onChange={e => setBandeauText(e.target.value)}
                         placeholder="Ex: LIVRAISON GRATUITE SUR TOUTE LA BOUTIQUE AUJOURD'HUI"
                         maxLength={80}
                         className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-blue-500 transition-all"
                       />
                       <p className="text-xs text-right text-gray-400 font-medium">{bandeauText.length}/80</p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Couleur de fond</label>
                       <div className="flex items-center gap-3">
                          {['#1A1A1A', '#FF3B30', '#007AFF', '#34C759', '#FF9500', '#D3A45C'].map(color => (
                            <button
                               key={color}
                               onClick={() => setBandeauColor(color)}
                               className={`w-10 h-10 rounded-full transition-transform outline-none ${bandeauColor === color ? 'scale-110 ring-4 ring-offset-2 ring-gray-200' : 'hover:scale-105'}`}
                               aria-label={`Sélectionner la couleur de fond ${color}`}
                               title={`Couleur : ${color}`}
                               ref={el => { if (el) el.style.backgroundColor = color; }}
                            />
                          ))}
                       </div>
                    </div>

                    <div className="pt-4">
                       <button 
                         onClick={handleSaveBandeauAndBoosters}
                         disabled={isSavingBandeau}
                         className="w-full py-4 text-white font-black bg-blue-600 rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 shadow-xl shadow-blue-500/20"
                       >
                         {isSavingBandeau ? 'Sauvegarde...' : 'Sauvegarder et Appliquer'}
                       </button>
                    </div>

                    <div className="h-px bg-gray-200 w-full my-6"></div>

                    {/* Jauge Livraison Gratuite */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                           <Truck size={20} />
                         </div>
                         <div>
                           <h3 className="font-bold text-ink">Jauge Livraison Gratuite</h3>
                           <p className="text-xs text-gray-500">Augmente le panier moyen incitant l'acheteur à ajouter + de produits au panier.</p>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Seuil à atteindre (FCFA)</label>
                         <div className="relative">
                           <input 
                             type="number" min={0}
                             title="Seuil à atteindre" placeholder="0"
                             value={bFreeShipping} onChange={e => setBFreeShipping(Number(e.target.value))}
                             className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-3 pr-16 text-ink font-bold outline-none focus:border-orange-500 transition-all"
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">FCFA</div>
                         </div>
                         <p className="text-[10px] text-gray-400 italic">Mettez 0 pour désactiver la jauge sur le checkout.</p>
                       </div>
                    </div>

                    <div className="h-px bg-gray-200 w-full my-6"></div>

                    {/* Roue de la Fortune (Gamification) */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                             <Gift size={20} />
                           </div>
                           <div>
                             <h3 className="font-bold text-ink">Popup Roue de la Fortune</h3>
                             <p className="text-xs text-gray-500">Capture des leads WhatsApp contre un code promo.</p>
                           </div>
                         </div>
                         <button 
                           onClick={() => setBGamificationActive(!bGamificationActive)}
                           title="Activer roue de la fortune"
                           className={`w-12 h-6 rounded-full relative transition-colors ${bGamificationActive ? 'bg-pink-500' : 'bg-gray-300'}`}
                         >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${bGamificationActive ? 'left-7 shadow-sm' : 'left-1'}`} />
                         </button>
                       </div>
                       
                       {bGamificationActive && (
                         <div className="bg-pink-50/50 border border-pink-100 p-4 rounded-xl space-y-3">
                           <label className="block text-[10px] font-black text-pink-700 uppercase tracking-widest pl-1">Sélectionnez le code à faire gagner</label>
                           <select 
                             value={bGamificationPrize} onChange={e => setBGamificationPrize(e.target.value)}
                             title="Sélectionner le code à faire gagner"
                             className="w-full bg-white border border-pink-200 rounded-lg p-3 text-ink font-bold appearance-none outline-none focus:border-pink-500 transition-all shadow-sm"
                           >
                             <option value="">Sélectionnez un coupon existant...</option>
                             {promoCodes.filter(c => c.active).map(c => (
                               <option key={c.id} value={c.code}>{c.code} (-{c.type === 'percentage' ? c.value + '%' : c.value + 'F'})</option>
                             ))}
                           </select>
                           <p className="text-[10px] text-pink-500 font-medium">Les visiteurs de la boutique pourront gagner ce code en faisant tourner la roue après avoir laissé leur numéro WhatsApp.</p>
                         </div>
                       )}
                    </div>

                 </div>

                 <div className="hidden lg:block w-[360px] shrink-0 sticky top-24">
                    <MobileSimulator title="Aperçu (Boutique)">
                      <div className="w-full flex flex-col items-center min-h-[600px] bg-white relative overflow-hidden">
                        
                         {/* Le Bandeau Preview */}
                         {bandeauActive ? (
                           <div 
                             className="w-full py-2.5 px-4 text-center text-white text-[10px] font-black tracking-wider shadow-sm transition-colors duration-300"
                             ref={el => { if (el) el.style.backgroundColor = bandeauColor; }}
                           >
                              {bandeauText || "Votre message d'annonce sera ici"}
                           </div>
                         ) : (
                           <div className="w-full py-2.5 px-4 text-center bg-gray-100 border-b text-gray-400 text-xs font-bold border-dashed border-gray-300">
                              Bandeau inactif
                           </div>
                         )}
                         
                         {/* Faux contenu store */}
                         <div className="w-full p-6 space-y-4">
                            <div className="w-24 h-4 bg-gray-200 rounded-full"></div>
                            
                            {/* Free Shipping Progress bar mock */}
                            {bFreeShipping > 0 && (
                               <div className="w-full mb-6 mt-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] font-bold text-orange-600">Plus que {(bFreeShipping / 2).toLocaleString()} F pour la livraison gratuite</span>
                                     <Truck size={12} className="text-orange-500" />
                                  </div>
                                  <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
                                     <div className="h-full bg-orange-500 w-1/2"></div>
                                  </div>
                               </div>
                            )}

                            <div className="flex gap-4 pt-4">
                               <div className="w-20 h-24 bg-gray-100 rounded-xl"></div>
                               <div className="flex-1 space-y-2">
                                  <div className="w-3/4 h-3 bg-gray-200 rounded-full"></div>
                                  <div className="w-1/2 h-3 bg-gray-100 rounded-full"></div>
                               </div>
                            </div>
                            <div className="flex gap-4">
                               <div className="w-20 h-24 bg-gray-100 rounded-xl"></div>
                               <div className="flex-1 space-y-2">
                                  <div className="w-3/4 h-3 bg-gray-200 rounded-full"></div>
                                  <div className="w-1/2 h-3 bg-gray-100 rounded-full"></div>
                               </div>
                            </div>

                            {/* Gamification popup mock */}
                            {bGamificationActive && (
                               <div className="mt-8 p-4 border border-pink-200 bg-pink-50 rounded-2xl flex flex-col items-center text-center">
                                  <Gift size={24} className="text-pink-500 mb-2" />
                                  <p className="text-[10px] font-black text-pink-700 uppercase mb-1">Faites tourner la roue</p>
                                  <p className="text-xs text-pink-600/80 mb-3 font-medium">Gagnez potentiellement le code {bGamificationPrize || 'SURPRISE'}.</p>
                                  <div className="bg-pink-500 text-white w-full py-2 rounded-lg text-xs font-bold">Tourner (WhatsApp requis)</div>
                               </div>
                            )}

                         </div>
                      </div>
                    </MobileSimulator>
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* --- MODAL FLASH PROMO & BUNDLES --- */}
      {showFlashModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all overflow-y-auto pt-24 pb-12">
           <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 m-auto overflow-hidden">
             
             {/* Header Modal */}
             <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] p-8 text-white relative flex-shrink-0">
                <div className="absolute -right-10 -top-10 text-white/5">
                   <Zap size={150} />
                </div>
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
                      {fType === 'bundle' ? <ShoppingBag size={24} className="text-purple-400" /> : <Zap size={24} className="text-gold" />}
                   </div>
                   <h2 className="text-3xl font-black mb-1">Nouvelle Opération</h2>
                   <p className="text-white/60 text-sm font-medium">Ventes flash ou offres groupées (1 acheté = 1 offert).</p>
                </div>
             </div>

             {/* Body Modal */}
             <div className="p-8 max-h-[60vh] overflow-y-auto">
               <form onSubmit={handleSubmitFlash} className="space-y-6">
                 
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Type d'opération marketing</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button
                         type="button"
                         onClick={() => { setFType('flash'); setBRewardType('percentage_off'); }}
                         className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${fType === 'flash' ? 'border-gold bg-gold/5 ring-1 ring-gold shadow-sm' : 'border-gray-200 hover:border-gold/30'}`}
                       >
                          <Zap size={20} className={fType === 'flash' ? 'text-gold' : 'text-gray-400'} />
                          <div>
                            <p className="font-bold text-ink">Vente Flash</p>
                            <p className="text-xs text-gray-500 font-medium leading-tight mt-1">Réduction simple avec compte à rebours (FOMO).</p>
                          </div>
                       </button>
                       <button
                         type="button"
                         onClick={() => setFType('bundle')}
                         className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${fType === 'bundle' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500 shadow-sm' : 'border-gray-200 hover:border-purple-300'}`}
                       >
                          <ShoppingBag size={20} className={fType === 'bundle' ? 'text-purple-600' : 'text-gray-400'} />
                          <div>
                            <p className="font-bold text-ink">BOGO / Pack</p>
                            <p className="text-xs text-gray-500 font-medium leading-tight mt-1">Ex: 1 acheté = 1 offert, ou -50% sur le 2ème.</p>
                          </div>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Titre Interne de l'Opération</label>
                   <input 
                     type="text" required placeholder={fType === 'bundle' ? "Ex: Promo Saint Valentin (1A = 1O)" : "Ex: Black Friday Flash"}
                     value={fTitle} onChange={e => setFTitle(e.target.value)}
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-ink transition-all"
                   />
                 </div>

                 {/* Configuration Vente Flash */}
                 {fType === 'flash' && (
                   <div className="grid grid-cols-2 gap-4 bg-yellow-50/50 p-5 rounded-2xl border border-yellow-100">
                     <div className="space-y-1.5">
                       <label className="block text-[10px] font-black text-yellow-800 uppercase tracking-widest pl-1">Réduction</label>
                       <select 
                         value={fDiscountType} onChange={e => setFDiscountType(e.target.value as DiscountType)}
                         title="Type de réduction"
                         className="w-full bg-white border border-yellow-200 rounded-xl p-3 text-ink font-bold appearance-none outline-none focus:border-gold transition-all shadow-sm"
                       >
                         <option value="percentage">% Pourcentage</option>
                         <option value="fixed">F CFA Fixe</option>
                       </select>
                     </div>
                     <div className="space-y-1.5">
                       <label className="block text-[10px] font-black text-yellow-800 uppercase tracking-widest pl-1">Valeur</label>
                       <input 
                         type="number" required min={1}
                         title="Valeur de la réduction" placeholder="Ex: 10"
                         value={fDiscountValue} onChange={e => setFDiscountValue(Number(e.target.value))}
                         className="w-full bg-white border border-yellow-200 rounded-xl p-3 text-ink font-black outline-none focus:border-gold transition-all shadow-sm"
                       />
                     </div>
                   </div>
                 )}

                 {/* Configuration Bundle / BOGO */}
                 {fType === 'bundle' && (
                   <div className="space-y-4 bg-purple-50/50 p-5 rounded-2xl border border-purple-100 w-full overflow-hidden">
                      <p className="text-xs text-purple-800 font-bold mb-2">Configurez la règle mathématique du pack :</p>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                         <div className="flex-1 space-y-1.5 w-full">
                           <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest pl-1">Quantité Achetée</label>
                           <div className="relative">
                             <input 
                               type="number" required min={1}
                               title="Quantité Achetée" placeholder="Ex: 2"
                               value={bBuyQuantity} onChange={e => setBBuyQuantity(Number(e.target.value))}
                               className="w-full bg-white border border-purple-200 rounded-xl p-3 pr-8 text-ink font-black outline-none focus:border-purple-500 transition-all shadow-sm"
                             />
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-sm">ACHETÉ(S)</div>
                           </div>
                         </div>
                      </div>
                      
                      <div className="h-px w-full bg-purple-200/50 my-2"></div>
                      
                      <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                         <div className="flex-[2] space-y-1.5 w-full">
                           <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest pl-1">Récompense (Sur le {bBuyQuantity + 1}ème)</label>
                           <select 
                             value={bRewardType} onChange={e => setBRewardType(e.target.value as 'free_item' | 'percentage_off')}
                             title="Type de récompense"
                             className="w-full bg-white border border-purple-200 rounded-xl p-3 text-ink font-bold appearance-none outline-none focus:border-purple-500 transition-all shadow-sm"
                           >
                             <option value="free_item">🎁 Offert Gratuitement (BOGO)</option>
                             <option value="percentage_off">📉 Réduction en %</option>
                           </select>
                         </div>
                         {bRewardType === 'percentage_off' && (
                           <div className="flex-1 space-y-1.5 w-full">
                             <label className="block text-[10px] font-black text-purple-800 uppercase tracking-widest pl-1">Réduction (%)</label>
                             <input 
                               type="number" required min={1} max={99}
                               title="Réduction (%)" placeholder="Ex: 50"
                               value={bRewardValue} onChange={e => setBRewardValue(Number(e.target.value))}
                               className="w-full bg-white border border-purple-200 rounded-xl p-3 text-ink font-black outline-none focus:border-purple-500 transition-all shadow-sm"
                             />
                           </div>
                         )}
                      </div>

                      <div className="mt-4 p-3 bg-purple-100/50 rounded-xl border border-purple-200/50 text-center text-sm font-bold text-purple-900 shadow-inner">
                        💡 Résultat : "Achetez-en {bBuyQuantity}, et obtenez le {bBuyQuantity + 1}ème {bRewardType === 'free_item' ? 'GRATUITEMENT' : `à -${bRewardValue}%`}."
                      </div>
                   </div>
                 )}

                 <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">S'applique au catalogue</label>
                   <select 
                     value={fProductId} onChange={e => setFProductId(e.target.value)}
                     title="Produit concerné"
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold appearance-none outline-none focus:border-ink transition-all"
                   >
                     <option value="all">📦 S'applique à toute la boutique</option>
                     {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                 </div>

                 <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Durée et Pression (En Heures)</label>
                   <input 
                     type="number" required min={1} max={720}
                     title="Durée de l'opération (Heures)" placeholder="Ex: 24"
                     value={fDuration} onChange={e => setFDuration(Number(e.target.value))}
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-ink transition-all"
                   />
                 </div>

                 {/* Sticky Footer Hack inside the modal body */}
                 <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 mt-8 flex justify-end gap-3 z-20">
                   <button 
                     type="button" onClick={() => setShowFlashModal(false)}
                     className="px-6 py-3.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                   >
                     Annuler
                   </button>
                   <button 
                     type="submit" disabled={isDeploying}
                     className={`px-8 py-3.5 text-white font-black rounded-xl transition disabled:opacity-50 shadow-lg flex items-center gap-2 ${fType === 'bundle' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-gold hover:bg-gold-light shadow-gold/20'}`}
                   >
                     {isDeploying ? 'Déploiement...' : 'Déployer l\'Opération'} <ArrowRight size={18} />
                   </button>
                 </div>
               </form>
             </div>
           </div>
        </div>
      )}

      {/* --- MODAL COUPON CODE --- */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all overflow-y-auto pt-24 pb-12">
           <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 m-auto">
             
             {/* Header Modal */}
             <div className="bg-emerald-50 p-8 rounded-t-[32px] border-b border-emerald-100/50 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-emerald-100">
                   <Ticket size={120} />
                </div>
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-emerald">
                      <Ticket size={24} />
                   </div>
                   <h2 className="text-3xl font-black text-emerald-950 mb-1">Générer un Coupon</h2>
                   <p className="text-emerald-700/80 text-sm font-medium">Récompensez vos meilleurs clients avec des réductions.</p>
                </div>
             </div>

             <div className="p-8">
               {cError && <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-xl font-bold flex items-center gap-2 border border-red-100">⚠️ {cError}</div>}

               <form onSubmit={handleSubmitCode} className="space-y-6">
                 
                 <div className="space-y-1.5">
                   <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Le Code Promo</label>
                   <div className="relative">
                      <input 
                        type="text" required placeholder="EX: VENTE20"
                        value={cCode} onChange={e => setCCode(e.target.value)}
                        className="w-full font-mono text-xl uppercase bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 pl-12 text-ink font-black outline-none focus:border-emerald transition-all"
                      />
                      <Ticket size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Type de remise</label>
                     <select 
                       value={cType} onChange={e => setCType(e.target.value as 'percentage' | 'fixed')}
                       title="Type de remise coupon"
                       className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-emerald transition-all appearance-none"
                     >
                       <option value="percentage">% Pourcentage</option>
                       <option value="fixed">F CFA Fixe</option>
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Valeur</label>
                     <input 
                       type="number" required min={1}
                       title="Valeur de la remise" placeholder="Ex: 2000"
                       value={cValue} onChange={e => setCValue(Number(e.target.value))}
                       className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-black outline-none focus:border-emerald transition-all"
                     />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Produit ciblé</label>
                   <select 
                     value={cProductId} onChange={e => setCProductId(e.target.value)}
                     title="Produit ciblé"
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-emerald transition-all appearance-none"
                   >
                     <option value="all">📦 Tout le catalogue</option>
                     {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                 </div>

                 <div className="space-y-1.5">
                   <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Assigner à un Affilié (Optionnel)</label>
                   <select 
                     value={cAffiliateId} onChange={e => setCAffiliateId(e.target.value)}
                     title="Affilié assigné"
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-emerald transition-all appearance-none"
                   >
                     <option value="">Aucun affilié (Code générique)</option>
                     {affiliates.map((a: AffiliateBase) => (
                       <option key={a.id} value={a.id}>
                         {a.user?.name || 'Inconnu'} - {a.code}
                       </option>
                     ))}
                   </select>
                   <p className="text-[10px] text-gray-400 font-medium pl-1 leading-tight">
                     Si assigné, toutes les ventes via ce code seront attribuées à cet affilié, même s'il n'y a pas eu de clic sur son lien d'affiliation.
                   </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Panier Min. (Opt.)</label>
                     <input 
                       type="number" placeholder="Aucun" min={0}
                       value={cMinOrder} onChange={e => setCMinOrder(e.target.value)}
                       className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-emerald transition-all"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Limite Usages</label>
                     <input 
                       type="number" placeholder="Illimité" min={1}
                       value={cMaxUses} onChange={e => setCMaxUses(e.target.value)}
                       className="w-full bg-[#FAFAF7] border border-gray-200 rounded-2xl p-4 text-ink font-bold outline-none focus:border-emerald transition-all"
                     />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Date d'Expiration (Opt.)</label>
                   <input 
                     type="datetime-local" 
                     title="Date d'expiration" placeholder="JJ/MM/AAAA"
                     value={cExpiresAt} onChange={e => setCExpiresAt(e.target.value)}
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-4 text-ink font-bold outline-none focus:border-emerald transition-all"
                   />
                 </div>

                 <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                   <button 
                     type="button" onClick={() => setShowCodeModal(false)}
                     className="px-6 py-3.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                   >
                     Annuler
                   </button>
                   <button 
                     type="submit" disabled={isDeploying || !cCode.trim()}
                     className="px-8 py-3.5 text-white font-black bg-emerald rounded-xl hover:bg-emerald-600 transition disabled:opacity-50 shadow-lg shadow-emerald/20 flex items-center gap-2"
                   >
                     {isDeploying ? 'Création...' : 'Générer le Code'} <ArrowRight size={18} />
                   </button>
                 </div>
               </form>
             </div>
           </div>
        </div>
      )}
    </div>
  )
}
