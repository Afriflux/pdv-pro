'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Smartphone, LayoutTemplate, Workflow, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getVendorPurchasedAssetsAction, installAppAction, purchaseAssetAction } from './actions'
import { PlatformCheckoutModal } from '@/components/shared/billing/PlatformCheckoutModal'
import { toast } from '@/lib/toast'
import Link from 'next/link'

type AssetItem = {
  id: string
  name?: string
  title?: string
  description?: string
  intro?: string
  icon_url?: string
  emoji?: string
  preview_url?: string
  category?: string
  is_premium: boolean
  price: number
}

type MarketplaceClientProps = {
  wallet: { balance: number, total_earned: number }
  apps: AssetItem[]
  themes: AssetItem[]
  workflows: AssetItem[]
  courses: AssetItem[]
  userRole: string
}

export default function MarketplaceClient({ wallet, apps, themes, workflows, courses, userRole: _userRole }: MarketplaceClientProps) {
  const [activeTab, setActiveTab] = useState<'apps' | 'themes' | 'workflows' | 'academy'>('apps')
  const [searchQuery, setSearchQuery] = useState('')
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])
  const [installedAppIds, setInstalledAppIds] = useState<string[]>([])
  const [checkoutAsset, setCheckoutAsset] = useState<AssetItem | null>(null)
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function loadPurchases() {
      const res = await getVendorPurchasedAssetsAction()
      if (res.success) {
        setPurchasedIds(res.purchases || [])
        setInstalledAppIds(res.installedApps || [])
      }
      setIsInitializing(false)
    }
    loadPurchases()
  }, [])

  const handleInstallApp = async (app: AssetItem) => {
    if (loadingAction) return
    setLoadingAction(app.id)
    
    const res = await installAppAction(app.id, app.is_premium ? app.price : 0, app.name || 'Application')
    if (res.success) {
      toast.success(app.is_premium ? 'App achetée et installée !' : 'App installée !')
      setInstalledAppIds(prev => [...prev, app.id])
    } else {
      if (res.error?.includes('insuffisant')) {
        toast.error('Solde insuffisant ! Rechargez votre wallet.')
      } else {
        toast.error(res.error || 'Erreur lors de l\'installation')
      }
    }
    setLoadingAction(null)
  }

  const handlePurchaseAsset = async (asset: AssetItem, type: 'TEMPLATE' | 'WORKFLOW' | 'MASTERCLASS') => {
    if (loadingAction) return
    setLoadingAction(asset.id)
    
    const res = await purchaseAssetAction(asset.id, type, asset.is_premium ? asset.price : 0, asset.name || asset.title || 'Ressource')
    if (res.success) {
      toast.success('Ressource ajoutée à votre compte !')
      setPurchasedIds(prev => [...prev, asset.id])
    } else {
      if (res.error?.includes('insuffisant')) {
        toast.error('Solde insuffisant ! Rechargez votre wallet.')
      } else {
        toast.error(res.error || 'Erreur lors de l\'acquisition')
      }
    }
    setLoadingAction(null)
  }

  const tabs = [
    { id: 'apps', label: 'Applications', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'themes', label: 'Thèmes & Modèles', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'workflows', label: 'Automatisations', icon: <Workflow className="w-4 h-4" /> },
    { id: 'academy', label: 'Yayyam Académie', icon: <BookOpen className="w-4 h-4" /> },
  ]

  const getActiveItems = () => {
    let items: AssetItem[] = []
    if (activeTab === 'apps') items = apps
    if (activeTab === 'themes') items = themes
    if (activeTab === 'workflows') items = workflows
    if (activeTab === 'academy') items = courses

    if (!searchQuery) return items
    
    return items.filter(i => 
      (i.name || i.title || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description || i.intro || '')?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const renderInsufficientFundsWarning = () => {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm mb-8">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-amber-900 font-bold text-sm">Gérez votre portefeuille</h4>
          <p className="text-amber-700 text-xs font-medium mt-0.5">Pour débloquer les modules premium, utilisez votre solde ou payez via Wave/Cartes. Solde actuel : <strong className="text-ink">{wallet.balance} FCFA</strong></p>
        </div>
      </div>
    )
  }

  // Define checkout helper
  const handleFinalCheckout = async (asset: AssetItem) => {
      const type = activeTab === 'apps' ? 'APP' : activeTab === 'themes' ? 'TEMPLATE' : activeTab === 'workflows' ? 'WORKFLOW' : 'MASTERCLASS';
      if (type === 'APP') {
         const res = await installAppAction(asset.id, asset.price, asset.name || 'App');
         if(res.success) setInstalledAppIds(prev => [...prev, asset.id]);
         return res;
      } else {
         const res = await purchaseAssetAction(asset.id, type as any, asset.price, asset.name || asset.title || 'Ressource');
         if(res.success) setPurchasedIds(prev => [...prev, asset.id]);
         return res;
      }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto px-4 relative z-10">
      
      {/* Search & Tabs */}
      <div className="bg-white/80 backdrop-blur-2xl border border-gray-100 p-2 lg:p-4 rounded-[2rem] shadow-xl shadow-gray-200/50 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-4 z-30">
        <div className="flex overflow-x-auto w-full lg:w-auto gap-2 pb-2 lg:pb-0 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#0F7A60] text-white shadow-lg shadow-emerald-600/30' : 'bg-gray-50/80 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50 pointer-events-none" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Chercher dans ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
            className="w-full bg-[#0F7A60]/5 border border-emerald-100 focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/20 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-ink outline-none transition-all placeholder:text-emerald-900/30"
          />
        </div>
      </div>

      {wallet.balance < 1000 && renderInsufficientFundsWarning()}

      {/* Grid d'affichage dynamique */}
      <div className="min-h-[500px]">
        {isInitializing ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-emerald-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="font-bold text-sm uppercase tracking-widest">Chargement du Store...</p>
          </div>
        ) : getActiveItems().length === 0 ? (
          <div className="bg-white/50 border border-gray-100 rounded-[3rem] p-16 text-center shadow-inner flex flex-col items-center justify-center gap-3">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2">
               <Search className="w-8 h-8 text-gray-300" />
             </div>
             <h3 className="text-xl font-black text-gray-400">Aucun résultat trouvé</h3>
             <p className="text-sm font-medium text-gray-400">Essayez une autre recherche ou parcourez une autre catégorie.</p>
          </div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {getActiveItems().map(item => {
                
                const isOwned = 
                  (activeTab === 'apps' && installedAppIds.includes(item.id)) || 
                  (activeTab !== 'apps' && purchasedIds.includes(item.id))

                const typeLabel = activeTab === 'apps' ? 'APP' : activeTab === 'themes' ? 'THÈME' : activeTab === 'workflows' ? 'WORKFLOW' : 'COURS'
                
                const handleAcquire = () => {
                  if (item.is_premium && item.price > 0) {
                     setCheckoutAsset(item);
                  } else {
                    if (activeTab === 'apps') handleInstallApp(item)
                    else if (activeTab === 'themes') handlePurchaseAsset(item, 'TEMPLATE')
                    else if (activeTab === 'workflows') handlePurchaseAsset(item, 'WORKFLOW')
                    else if (activeTab === 'academy') handlePurchaseAsset(item, 'MASTERCLASS')
                  }
                }

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={item.id}
                    className="group bg-white border border-gray-100/80 rounded-[2.5rem] p-3 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:border-[#0F7A60]/30 transition-all duration-500 overflow-hidden flex flex-col h-[380px]"
                  >
                    {/* HAUT: Visuel */}
                    <div className="relative h-40 w-full mb-4 shrink-0 bg-slate-50 border border-gray-100/50 rounded-[2rem] overflow-hidden isolate flex items-center justify-center">
                      {/* Image ou Emoji */}
                      {item.preview_url ? (
                        <img src={item.preview_url} alt={item.name || item.title || ''} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="text-6xl drop-shadow-sm group-hover:scale-125 transition-transform duration-700 font-emoji">
                          {(item.icon_url || item.emoji) ? (item.icon_url || item.emoji) : '✨'}
                        </div>
                      )}
                      
                      {/* Overlay gradient pour lisibilité */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-ink text-xs font-black px-3 py-1.5 rounded-xl z-10 uppercase tracking-widest shadow-sm">
                        {item.category || typeLabel}
                      </div>

                      {item.is_premium ? (
                        <div className="absolute bottom-3 right-3 bg-amber-400 text-amber-950 text-xs font-black px-3 py-1.5 rounded-xl z-10 shadow-lg flex items-center gap-1.5 border border-amber-300">
                           ⭐ {item.price} FCFA
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 bg-emerald-50 text-[#0F7A60] border border-[#0F7A60]/30 text-xs font-black px-3 py-1.5 rounded-xl z-10 shadow-lg">
                           ⚡ GRATUIT
                        </div>
                      )}
                    </div>

                    {/* BAS: Contenu */}
                    <div className="px-4 pb-2 flex flex-col flex-1">
                      <h3 className="text-[17px] font-black text-ink leading-tight mb-2 group-hover:text-[#0F7A60] transition-colors">{item.name || item.title}</h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3 mb-4">{item.description || item.intro}</p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-50">
                        {isOwned ? (
                          <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-[#0F7A60] py-3 rounded-2xl font-black text-[13px] uppercase tracking-wide border border-[#0F7A60]/10">
                            <CheckCircle2 size={18} /> Déjà Acquis
                          </div>
                        ) : (
                          <button
                            onClick={handleAcquire}
                            disabled={loadingAction === item.id}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wide transition-all shadow-md hover:shadow-xl disabled:opacity-50
                              ${item.is_premium 
                                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-amber-400/20' 
                                : 'bg-[#0F7A60] hover:bg-[#094A3A] text-white shadow-[#0F7A60]/20'
                              }
                            `}
                          >
                            {loadingAction === item.id ? <Loader2 size={18} className="animate-spin" /> : null}
                            {!loadingAction && (activeTab === 'apps' ? 'Installer' : 'Acheter')}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {checkoutAsset && (
        <PlatformCheckoutModal 
          isOpen={!!checkoutAsset}
          onClose={() => setCheckoutAsset(null)}
          productDetails={{
            id: checkoutAsset.id,
            type: activeTab === 'apps' ? 'APP' : activeTab === 'themes' ? 'TEMPLATE' : activeTab === 'workflows' ? 'WORKFLOW' : 'MASTERCLASS',
            title: checkoutAsset.name || checkoutAsset.title || 'Ressource Premium',
            price: checkoutAsset.price,
            emoji: activeTab === 'apps' ? '📦' : activeTab === 'themes' ? '🎨' : activeTab === 'workflows' ? '⚙️' : '🎓'
          }}
          wallet={wallet}
          onPurchaseViaWallet={async () => {
             const res = await handleFinalCheckout(checkoutAsset);
             return res as any;
          }}
        />
      )}
    </div>
  )
}
