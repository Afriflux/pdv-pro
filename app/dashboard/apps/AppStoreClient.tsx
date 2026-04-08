'use client'

import React, { useState } from 'react'
import { 
  Link as LinkIcon, Zap, BookOpen, Trophy, 
  CheckCircle2, Download, Blocks, Star, Users, Briefcase, Gem,
  MessageSquare, ShoppingBag, Truck, Calendar, CreditCard, Banknote
} from 'lucide-react'
import { MobileSimulator } from '@/components/shared/simulator/MobileSimulator'
import { installAppAction, uninstallAppAction } from './actions'
import { Loader2, ShieldCheck, Sparkles, Phone, Package } from 'lucide-react'

interface AppItem {
  id: string
  name: string
  category: string
  description: string
  icon: React.ReactNode
  isPro?: boolean
  features: string[]
}

import { MarketplaceApp } from '@prisma/client'
import { useRouter } from 'next/navigation'

export function AppStoreClient({ initialInstalled, dbApps }: { initialInstalled: string[], dbApps: MarketplaceApp[] }) {
  
  // Transform from DB to AppItem format
  const getIcon = (_name: string, id: string) => {
    switch (id) {
      case 'marketing': return <Zap className="w-8 h-8 text-blue-500" />
      case 'workflows': return <Zap className="w-8 h-8 text-rose-500" />
      case 'affilies': return <Trophy className="w-8 h-8 text-orange-500" />
      case 'promotions': return <ShoppingBag className="w-8 h-8 text-pink-500" />
      case 'telegram-alerts': return <Zap className="w-8 h-8 text-cyan-500" />
      case 'telegram': return <MessageSquare className="w-8 h-8 text-sky-500" />
      case 'ambassadeur': return <Gem className="w-8 h-8 text-emerald-400" />
      case 'links': return <LinkIcon className="w-8 h-8 text-indigo-500" />
      case 'ai-generator': return <Star className="w-8 h-8 text-amber-500" />
      case 'webhooks': return <Zap className="w-8 h-8 text-violet-500" />
      case 'customers': return <Users className="w-8 h-8 text-blue-400" />
      case 'livraisons': return <Truck className="w-8 h-8 text-slate-500" />
      case 'agenda': return <Calendar className="w-8 h-8 text-purple-500" />
      case 'tasks': return <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      case 'communautes': return <Users className="w-8 h-8 text-cyan-600" />
      case 'closers': return <Briefcase className="w-8 h-8 text-amber-600" />
      case 'academy': return <BookOpen className="w-8 h-8 text-emerald-600" />
      case 'quotes': return <Briefcase className="w-8 h-8 text-neutral-600" />
      case 'cinetpay': return <CreditCard className="w-8 h-8 text-green-500" />
      case 'paytech': return <Banknote className="w-8 h-8 text-indigo-400" />
      case 'intouch': return <CreditCard className="w-8 h-8 text-slate-800" />
      case 'payment-links': return <Banknote className="w-8 h-8 text-[#0F7A60]" />
      case 'server-side-pixels': return <Zap className="w-8 h-8 text-indigo-600" />
      case 'social-proof': return <Users className="w-8 h-8 text-rose-600" />
      case 'volume-discounts': return <ShoppingBag className="w-8 h-8 text-amber-600" />
      case 'smart-reviews': return <Star className="w-8 h-8 text-yellow-400" />
      case 'helpdesk': return <MessageSquare className="w-8 h-8 text-teal-600" />
      case 'subscriptions': return <CreditCard className="w-8 h-8 text-violet-600" />
      // Nouvelles Apps
      case 'fraud-cod': return <ShieldCheck className="w-8 h-8 text-red-500" />
      case 'coach-ia': return <Sparkles className="w-8 h-8 text-yellow-500" />
      case 'sms-marketing': return <MessageSquare className="w-8 h-8 text-blue-500" />
      case 'whatsapp-bot': return <Phone className="w-8 h-8 text-green-500" />
      case 'loyalty-points': return <Trophy className="w-8 h-8 text-orange-500" />
      case 'dropshipping': return <Package className="w-8 h-8 text-slate-700" />
      default: return <Blocks className="w-8 h-8 text-gray-500" />
    }
  }

  const STORE_APPS: AppItem[] = dbApps
    .filter(app => app.id !== 'dropshipping')
    .map(app => ({
      id: app.id,
      name: app.name,
      category: app.category,
      description: app.description || '',
      icon: getIcon(app.icon_url || 'blocks', app.id),
      isPro: app.is_premium,
      features: app.features as string[]
    }))

  const [installedAppIds, setInstalledAppIds] = useState<string[]>(initialInstalled)
  const [simulatedApp, setSimulatedApp] = useState<AppItem | null>(null)
  const [installingId, setInstallingId] = useState<string | null>(null)
  
  const [activeCategory, setActiveCategory] = useState<string>('Toutes')
  
  const categories = ['Toutes', ...Array.from(new Set(STORE_APPS.map(a => a.category)))]
  const router = useRouter()

  const toggleInstall = async (app: AppItem) => {
    if (installingId) return
    setInstallingId(app.id)

    const isCurrentlyInstalled = installedAppIds.includes(app.id)
    
    // Optimistic UI update
    if (isCurrentlyInstalled) {
      setInstalledAppIds(prev => prev.filter(id => id !== app.id))
    } else {
      setInstalledAppIds(prev => [...prev, app.id])
    }

    try {
      if (isCurrentlyInstalled) {
        const res = await uninstallAppAction(app.id)
          if (!res.success) throw new Error(res.error)
        } else {
          // Check if it's a payment gateway to possibly ask for API keys later
          const res = await installAppAction(app.id)
          if (!res.success) throw new Error(res.error)
        }
        router.refresh()
      } catch (e) {
        // Revert on failure
        console.error("Installation failure", e)
        alert("Echec de l'installation/désinstallation. Veuillez réessayer.")
        setInstalledAppIds(initialInstalled)
      } finally {
        setInstallingId(null)
      }
  }

  const filteredApps = STORE_APPS.filter(app => activeCategory === 'Toutes' || app.category === activeCategory)

  // Statistiques
  const appsEnVitrine = STORE_APPS.length
  const installCounts = installedAppIds.length

  return (
    <div className="flex w-full h-[calc(100vh-6rem)] overflow-hidden bg-[#FAFAF7] font-sans">
      
      {/* Principal Column */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-[#0F7A60] to-emerald-800 text-white rounded-2xl shadow-lg">
                  <Blocks size={28} />
                </div>
                <h1 className="text-4xl font-display font-black text-[#1A1A1A] tracking-tight">App Store Hub</h1>
              </div>
              <p className="text-gray-500 font-medium tracking-tight text-lg mt-3">Transformez votre boutique basique en empire modulaire. Installez et retirez les fonctionnalités en 1 clic.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm shrink-0">
               <div className="text-center px-4 border-r border-gray-100">
                  <p className="text-2xl font-black text-ink">{appsEnVitrine}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Apps Utiles</p>
               </div>
               <div className="text-center px-4">
                  <p className="text-2xl font-black text-emerald-600">{installCounts}</p>
                  <p className="text-[10px] uppercase font-bold text-emerald-600/60">Installées</p>
               </div>
            </div>
          </div>

          {/* Categories Pill Menu */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  activeCategory === cat
                    ? 'bg-ink text-white border-transparent'
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-ink border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredApps.map(app => {
              const isInstalled = installedAppIds.includes(app.id)

              return (
              <div 
                key={app.id} 
                onMouseEnter={() => setSimulatedApp(app)}
                onMouseLeave={() => setSimulatedApp(null)}
                className={`bg-white rounded-[24px] p-6 border-2 transition-all duration-300 flex flex-col h-full ${
                  isInstalled 
                    ? 'border-[#0F7A60] shadow-xl shadow-[#0F7A60]/10 scale-[1.02] bg-emerald-50/10' 
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <div className="flex justify-between items-start mb-5">
                  <div className={`p-4 rounded-[20px] shadow-inner ${isInstalled ? 'bg-gradient-to-br from-emerald-100 to-teal-50' : 'bg-gray-50'}`}>
                    {app.icon}
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    {app.isPro && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        <Star size={12} className="fill-amber-500" /> Premium
                      </span>
                    )}
                    {isInstalled && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                        Actif
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{app.category}</div>
                  <h3 className="font-black text-[#1A1A1A] text-lg mb-2 leading-tight">{app.name}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{app.description}</p>
                </div>
                
                <div className="mt-5 space-y-2 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  {app.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
                      <CheckCircle2 size={14} className={isInstalled ? 'text-[#0F7A60]' : 'text-gray-300'} />
                      <span className={isInstalled ? 'text-gray-800' : ''}>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => toggleInstall(app)}
                    disabled={installingId !== null}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      isInstalled 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 disabled:opacity-50' 
                        : 'bg-gradient-to-r from-ink to-slate text-white hover:from-black hover:to-ink shadow-lg shadow-black/10 disabled:opacity-50'
                    }`}
                  >
                    {installingId === app.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isInstalled ? (
                      'Retirer'
                    ) : (
                      <><Download size={16} /> Ajouter à la plateforme</>
                    )}
                  </button>
                  {isInstalled && (() => {
                    // Mapping des apps vers leurs vraies routes
                    const routeMap: Record<string, string> = {
                      'marketing': '/dashboard/marketing',
                      'workflows': '/dashboard/workflows',
                      'affilies': '/dashboard/affilies',
                      'promotions': '/dashboard/promotions',
                      'telegram-alerts': '/dashboard/telegram',
                      'telegram': '/dashboard/telegram',
                      'ambassadeur': '/dashboard/ambassadeur',
                      'links': '/dashboard/links',
                      'ai-generator': '/dashboard/ai-generator',
                      'webhooks': '/dashboard/webhooks',
                      'customers': '/dashboard/customers',
                      'livraisons': '/dashboard/livraisons',
                      'agenda': '/dashboard/agenda',
                      'tasks': '/dashboard/tasks',
                      'communautes': '/dashboard/communautes',
                      'closers': '/dashboard/closers',
                      'academy': '/dashboard/tips', // Yayyam Académie
                      'cinetpay': '/dashboard/settings',
                      'paytech': '/dashboard/settings',
                      'intouch': '/dashboard/settings',
                      // Nouvelles apps
                      'fraud-cod': '/dashboard/settings#anti-fraude',
                      'coach-ia': '/dashboard',
                      'sms-marketing': '/dashboard/marketing/sms',
                      'whatsapp-bot': '/dashboard/marketing/whatsapp',
                      'loyalty-points': '/dashboard/marketing/fidelity',
                      'dropshipping': '/dashboard/dropshipping',
                    };
                    const configRoute = routeMap[app.id] || `/dashboard/apps/${app.id}`;
                    return (
                      <a href={configRoute} className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-[#0F7A60] text-white hover:opacity-90 shadow-lg shadow-emerald-900/10">
                        Configurer
                      </a>
                    );
                  })()}
                </div>
              </div>
            )})}
          </div>

        </div>
      </div>

      {/* Simulator Column */}
      <div className="hidden lg:flex w-[400px] border-l border-gray-200 bg-white flex-col justify-center sticky top-0 h-full p-4 relative overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

        {simulatedApp ? (
          <div className="animate-in fade-in zoom-in-95 duration-300 relative h-full flex flex-col justify-center z-10 w-full max-w-[320px] mx-auto">
             <MobileSimulator title={simulatedApp.name}>
               <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-6 mt-10">
                 <div className="w-24 h-24 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white">
                   {simulatedApp.icon}
                 </div>
                 <div>
                   <h4 className="font-black text-[#1A1A1A] text-2xl mb-2">{simulatedApp.name}</h4>
                   <p className="text-[14px] text-gray-500 font-medium">Installez cette extension pour l'activer sur votre menu de bord gauche en temps-réel.</p>
                 </div>
                 
                 <div className="w-full space-y-3 mt-10 text-left bg-white/50 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white">
                   <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Atouts techniques</h5>
                   {simulatedApp.features.map((ft, i) => (
                     <div key={i} className="px-4 py-3 bg-white rounded-xl text-sm font-bold text-gray-700 shadow-sm flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {ft}
                     </div>
                   ))}
                 </div>
                 
               </div>
             </MobileSimulator>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 relative z-10">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
               <Blocks size={48} className="text-gray-300" />
            </div>
            <h3 className="font-black text-ink text-2xl mb-3">Expérience App Store</h3>
            <p className="text-[15px] leading-relaxed font-medium text-gray-500">
              Survolez une application pour lire un aperçu technique sur le simulateur.
              <br/><br/>
              Cliquez ensuite sur <span className="font-bold text-ink">Ajouter</span> pour l'injecter immédiatement dans votre Sidebar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
