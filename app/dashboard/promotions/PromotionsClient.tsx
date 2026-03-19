'use client'

import { useState } from 'react'
import { 
  Ticket, 
  Search, 
  Trash2, 
  Power, 
  Calendar, 
  Target, 
  ShoppingBag, 
  Plus, 
  Zap, 
  Tags 
} from 'lucide-react'
import { PromotionData, PromotionType, DiscountType } from '@/lib/promotions/promotionType'
import { createPromotion, togglePromotionActive } from '@/lib/promotions/promotionActions'
import { PromoCodeData, createPromoCode, togglePromoCodeActive, deletePromoCode } from '@/lib/promotions/promoCodeActions'

interface PromotionsClientProps {
  storeId: string
  promotions: PromotionData[]
  promoCodes: PromoCodeData[]
  products: { id: string; name: string }[]
}

const PROMO_LABELS: Record<PromotionType, string> = {
  flash: '⚡ Vente Flash',
  seasonal: '🎉 Saisonnière',
  bundle: '📦 Bundle',
  conditional: '🚚 Conditionnelle',
  first_order: '👋 1ère Commande',
  ai: '🤖 IA Suggérée'
}

export default function PromotionsClient({ 
  storeId, 
  promotions: initialPromotions, 
  promoCodes: initialPromoCodes,
  products 
}: PromotionsClientProps) {
  const [activeTab, setActiveTab] = useState<'flash' | 'codes'>('flash')
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

  // -- Form State Promo Code --
  const [cCode, setCCode] = useState('')
  const [cType, setCType] = useState<'percentage' | 'fixed'>('percentage')
  const [cValue, setCValue] = useState(10)
  const [cMinOrder, setCMinOrder] = useState<string>('')
  const [cMaxUses, setCMaxUses] = useState<string>('')
  const [cExpiresAt, setCExpiresAt] = useState('')
  const [cProductId, setCProductId] = useState<string>('all')
  const [cError, setCError] = useState<string | null>(null)

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

    const newPromo = await createPromotion({
      storeId,
      type: fType,
      title: fTitle,
      discountType: fDiscountType,
      discountValue: fDiscountValue,
      productIds,
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
      product_ids: productIds
    }

    const res = await createPromoCode(payload)

    if (res.success && res.data) {
      setPromoCodes([res.data, ...promoCodes])
      setShowCodeModal(false)
      setCCode('')
      setCValue(10)
      setCMinOrder('')
      setCMaxUses('')
      setCExpiresAt('')
      setCProductId('all')
    } else {
      setCError(res.error || "Une erreur est survenue")
    }
    setIsDeploying(false)
  }

  // -- Helpers --
  const filteredFlash = promotions.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  const filteredCodes = promoCodes.filter(p => p.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* TABS SELECTOR */}
      <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full max-w-lg mx-auto">
        <button 
          onClick={() => setActiveTab('flash')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'flash' ? 'bg-white text-gold shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Zap size={18} />
          <span>Offres Flash</span>
        </button>
        <button 
          onClick={() => setActiveTab('codes')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'codes' ? 'bg-white text-gold shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Tags size={18} />
          <span>Coupons & Codes</span>
        </button>
      </div>

      {activeTab === 'flash' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder="Rechercher une promo..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-gold/10 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFlashModal(true)}
              className="w-full md:w-auto bg-gold hover:bg-gold-light text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-gold/20"
            >
              <Plus size={20} />
              <span>Nouvelle Offre Flash</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlash.map(promo => {
              const isExpired = promo.ends_at ? new Date(promo.ends_at) < new Date() : false
              const active = isExpired ? false : promo.active

              return (
                <div key={promo.id} className={`bg-white rounded-[32px] border p-6 transition-all ${!active ? 'opacity-70 border-gray-100' : 'border-gold/20 shadow-xl shadow-gold/5'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-gold/10 px-3 py-1 rounded-full">
                      <span className="text-[10px] font-black uppercase text-gold">
                        {PROMO_LABELS[promo.type]}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleToggleFlash(promo.id, promo.active)}
                      disabled={isExpired}
                      className={`w-12 h-6 rounded-full relative transition-colors ${promo.active ? 'bg-gold' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${promo.active ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <h3 className="font-display font-black text-ink text-xl mb-1 truncate">{promo.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mb-6">
                    {promo.product_ids.length === 0 ? 'Tout la boutique' : `Sur ${promo.product_ids.length} produit(s)`}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-dashed border-gray-100">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Réduction</p>
                      <p className="text-2xl font-black text-emerald">
                        {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-${promo.discount_value} F`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Impact</p>
                      <p className="text-xl font-black text-ink">{promo.revenue_generated.toLocaleString('fr-FR')} F</p>
                    </div>
                  </div>

                  {isExpired && (
                    <div className="mt-4 py-2 bg-red-50 rounded-xl text-center text-red-500 font-bold text-[10px] uppercase tracking-widest">
                      Offre Expirée
                    </div>
                  )}
                </div>
              )
            })}
            
            {promotions.length === 0 && (
              <div className="col-span-full bg-white rounded-[32px] border border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-gold" />
                </div>
                <h3 className="font-bold text-ink">Prêt pour votre première vente flash ?</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto mb-6">Les offres limitées dans le temps doublent le taux de conversion.</p>
                <button 
                  onClick={() => setShowFlashModal(true)}
                  className="bg-gold hover:bg-gold-light text-white px-8 py-3 rounded-2xl font-bold transition shadow-lg shadow-gold/10"
                >
                  Créer une vente flash
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder="Rechercher un coupon..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-gold/10 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowCodeModal(true)}
              className="w-full md:w-auto bg-gold hover:bg-gold-light text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-gold/20"
            >
              <Plus size={20} />
              <span>Créer un Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCodes.map(promo => {
              const expired = promo.expires_at ? new Date(promo.expires_at) < new Date() : false
              const active = expired ? false : promo.active

              return (
                <div key={promo.id} className={`bg-white rounded-[32px] border p-6 transition-all ${!active ? 'opacity-70 border-gray-100' : 'border-gold/20 shadow-xl shadow-gold/5'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-emerald/10 px-3 py-1 rounded-full">
                      <span className="text-[10px] font-black uppercase text-emerald">Coupon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleCode(promo.id, promo.active)}
                        disabled={expired}
                        className={`p-2 rounded-xl transition-colors ${promo.active ? 'text-gold hover:bg-gold/10' : 'text-gray-300 hover:bg-gray-100'}`}
                      >
                        <Power size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCode(promo.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-mono font-black text-ink text-2xl tracking-[0.2em] uppercase mb-1 truncate">{promo.code}</h3>
                  <p className="text-2xl font-black text-emerald mb-6">
                    {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value} F`}
                  </p>

                  <div className="space-y-3 pt-6 border-t border-dashed border-gray-100">
                    <div className="flex items-center gap-3">
                      <Target size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                        {promo.product_ids.length > 0 ? products.find(p=>p.id===promo.product_ids[0])?.name : 'Toute la boutique'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                        {promo.uses} / {promo.max_uses || '∞'} utilisations
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-gray-400" />
                      <span className={`text-xs font-bold uppercase tracking-widest leading-none ${expired ? 'text-red-500' : 'text-gray-500'}`}>
                        {promo.expires_at ? `Fin le ${new Date(promo.expires_at).toLocaleDateString('fr-FR')}` : 'Pas d\'expiration'}
                      </span>
                    </div>
                  </div>

                  {expired && (
                    <div className="mt-4 py-2 bg-red-50 rounded-xl text-center text-red-500 font-bold text-[10px] uppercase tracking-widest">
                      Coupon Expiré
                    </div>
                  )}
                </div>
              )
            })}

            {promoCodes.length === 0 && (
              <div className="col-span-full bg-white rounded-[32px] border border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket size={32} className="text-emerald" />
                </div>
                <h3 className="font-bold text-ink">Distribuez vos premiers coupons</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto mb-6">Créez des codes personnalisés pour remercier vos clients ou vos partenaires.</p>
                <button 
                  onClick={() => setShowCodeModal(true)}
                  className="bg-gold hover:bg-gold-light text-white px-8 py-3 rounded-2xl font-bold transition shadow-lg shadow-gold/10"
                >
                  Générer un coupon
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL FLASH PROMO --- */}
      {showFlashModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-black text-ink mb-6">Lancer une offre flash</h2>
            
            <form onSubmit={handleSubmitFlash} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Type d&apos;offre</label>
                <select 
                  value={fType} onChange={e => setFType(e.target.value as PromotionType)}
                  className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                >
                  <option value="flash">⚡ Vente Flash</option>
                  <option value="seasonal">🎉 Offre Saisonnière</option>
                  <option value="first_order">👋 Bienvenue (1ère commande)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Titre (Interne)</label>
                <input 
                  type="text" required placeholder="Ex: Black Friday 2026"
                  value={fTitle} onChange={e => setFTitle(e.target.value)}
                  className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Réduction</label>
                  <select 
                    value={fDiscountType} onChange={e => setFDiscountType(e.target.value as DiscountType)}
                    className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold appearance-none outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                  >
                    <option value="percentage">% Pourcent</option>
                    <option value="fixed">F Fixe</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Valeur</label>
                  <input 
                    type="number" required min={1}
                    value={fDiscountValue} onChange={e => setFDiscountValue(Number(e.target.value))}
                    className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-black outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">S&apos;applique à</label>
                <select 
                  value={fProductId} onChange={e => setFProductId(e.target.value)}
                  className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold appearance-none outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                >
                  <option value="all">📦 Toute la boutique</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Durée (Heures)</label>
                <input 
                  type="number" required min={1} max={720}
                  value={fDuration} onChange={e => setFDuration(Number(e.target.value))}
                  className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowFlashModal(false)}
                  className="flex-1 py-4 text-ink font-bold bg-cream rounded-2xl hover:bg-gray-100 transition"
                >
                  Fermer
                </button>
                <button 
                  type="submit" disabled={isDeploying}
                  className="flex-1 py-4 text-white font-black bg-gold rounded-2xl hover:bg-gold-light transition disabled:opacity-50 shadow-xl shadow-gold/20"
                >
                  {isDeploying ? '...' : 'Déployer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL COUPON CODE --- */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-black text-ink mb-6">Créer un coupon</h2>
            
            {cError && <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-2xl font-medium">⚠️ {cError}</div>}

            <form onSubmit={handleSubmitCode} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Code du coupon</label>
                <input 
                  type="text" required placeholder="EX: VENTE20"
                  value={cCode} onChange={e => setCCode(e.target.value)}
                  className="w-full font-mono uppercase bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none focus:ring-4 focus:ring-gold/5 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Détail</label>
                  <select 
                    value={cType} onChange={e => setCType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none transition-all font-bold appearance-none"
                  >
                    <option value="percentage">% Pourcent</option>
                    <option value="fixed">F Fixe</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Valeur</label>
                  <input 
                    type="number" required min={1}
                    value={cValue} onChange={e => setCValue(Number(e.target.value))}
                    className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-black outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Cible</label>
                <select 
                  value={cProductId} onChange={e => setCProductId(e.target.value)}
                  className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none transition-all appearance-none"
                >
                  <option value="all">📦 Tout le catalogue</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Panier Min. (F)</label>
                  <input 
                    type="number" placeholder="0" min={0}
                    value={cMinOrder} onChange={e => setCMinOrder(e.target.value)}
                    className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Utilisations Max</label>
                  <input 
                    type="number" placeholder="∞" min={1}
                    value={cMaxUses} onChange={e => setCMaxUses(e.target.value)}
                    className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Expiration</label>
                <input 
                  type="datetime-local" 
                  value={cExpiresAt} onChange={e => setCExpiresAt(e.target.value)}
                  className="w-full bg-cream border border-gray-100 rounded-2xl p-4 text-ink font-bold outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowCodeModal(false)}
                  className="flex-1 py-4 text-ink font-bold bg-cream rounded-2xl hover:bg-gray-100 transition"
                >
                  Fermer
                </button>
                <button 
                  type="submit" disabled={isDeploying || !cCode.trim()}
                  className="flex-1 py-4 text-white font-black bg-gold rounded-2xl hover:bg-gold-light transition shadow-xl shadow-gold/20"
                >
                  {isDeploying ? '...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
