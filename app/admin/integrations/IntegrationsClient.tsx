'use client'

import { useState, useEffect } from 'react'
import { Puzzle, Search, Filter } from 'lucide-react'
import ServiceCard from './ServiceCard'
import { INTEGRATION_CATEGORIES } from './config'
import type { ConfigItem, ServiceStats } from './page'
import AIRoutingManager from './AIRoutingManager'

interface Props {
  configMap: Record<string, ConfigItem>
  statsMap: Record<string, ServiceStats>
  configuredCount: number
  totalCount: number
  aiRoutingPrefs?: string
}

export default function IntegrationsClient({ configMap, statsMap, configuredCount, totalCount, aiRoutingPrefs }: Props) {
  const [activeTab, setActiveTab]   = useState(INTEGRATION_CATEGORIES[0].category)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrage des services selon la recherche globale
  const filteredGroups = INTEGRATION_CATEGORIES.map(group => {
    const filteredServices = group.services.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return { ...group, services: filteredServices }
  }).filter(g => g.services.length > 0)

  // Auto-switch d'onglet si l'onglet actif est masqué par la recherche
  useEffect(() => {
    if (filteredGroups.length > 0 && !filteredGroups.find(g => g.category === activeTab)) {
      setActiveTab(filteredGroups[0].category)
    }
  }, [searchQuery, activeTab, filteredGroups])

  const currentGroup = filteredGroups.find(g => g.category === activeTab) || filteredGroups[0]

  // Fonction de détermination de santé globale pour un sous-menu
  const getGroupHealth = (groupCategory: string) => {
    const originalGroup = INTEGRATION_CATEGORIES.find(g => g.category === groupCategory)
    if (!originalGroup) return 'inactive'

    let isConfigured = false
    let hasActivity = false

    originalGroup.services.forEach(service => {
      const isServiceConfigured = service.fields.some(f => !!configMap[f.key]?.value || !!configMap[f.testKey || '']?.value)
      if (isServiceConfigured) isConfigured = true
      if (statsMap[service.id]?.volume30d > 0) hasActivity = true
    })

    if (!isConfigured) return 'inactive'
    if (isConfigured && hasActivity) return 'healthy'
    return 'warning' // Configuré mais aucun volume actif récent
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500 pb-0">
      
      {/* ── HEADER FULL-BLEED (COVER PREMIUM) ── */}
      <header className="w-full bg-gradient-to-r from-[#0D5C4A] via-[#0F7A60] to-teal-700 pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg z-10">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-[1900px] mx-auto w-full">
          {currentGroup ? (
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10 shrink-0">
                <Puzzle className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">{currentGroup.category}</h1>
                <p className="text-emerald-100/90 font-medium text-sm mt-1 max-w-lg">
                  Pilotez les {currentGroup.services.length} services associés à cette catégorie.
                </p>
              </div>
            </div>
          ) : (
             <div></div>
          )}

          <div className="relative w-full md:w-auto flex justify-start md:justify-end">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl z-50">
              <span className="text-xs font-black text-white tracking-widest uppercase">État Global</span>
              <div className="px-3 py-1.5 bg-white rounded-xl shadow-inner flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${configuredCount === totalCount ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                 <span className="text-sm font-black text-[#0D5C4A]">{configuredCount} / {totalCount}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── UNIFIED VIEW (Horizontal Nav & Content) ── */}
      <div className="flex flex-col gap-8 w-full relative z-20 px-6 lg:px-10 -mt-8 pb-20 max-w-[1900px] mx-auto">
        
        {/* -- HORIZONTAL FILTERS & SEARCH -- */}
        <div className="w-full bg-white/80 backdrop-blur-md border border-slate-200/50 p-3 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row gap-4 items-center justify-between animate-in slide-in-from-bottom-2 duration-300 z-10">
          
          <nav className="flex flex-row gap-2 overflow-x-auto hide-scrollbar w-full lg:w-auto p-1">
            {filteredGroups.map(group => {
              const isActive = activeTab === group.category
              const health = getGroupHealth(group.category)
              
              return (
                <button
                  key={group.category}
                  onClick={() => setActiveTab(group.category)}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-emerald-900 text-white shadow-sm ring-1 ring-emerald-900'
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shadow-sm ${
                    isActive && health === 'healthy' ? 'bg-emerald-400' :
                    isActive && health === 'warning' ? 'bg-amber-300' :
                    health === 'healthy' ? 'bg-emerald-500' : 
                    health === 'warning' ? 'bg-amber-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="whitespace-nowrap">{group.category}</span>
                </button>
              )
            })}
            
            {filteredGroups.length === 0 && (
              <div className="text-center py-2 px-4 text-gray-400 text-sm font-medium">
                Aucun service trouvé.
              </div>
            )}
          </nav>

          {/* BARRE DE RECHERCHE */}
          <div className="relative w-full lg:w-80 shrink-0">
             {/* Honeypots cachés pour piéger Chrome Autofill */}
             <input type="text" name="username_fake" className="hidden" aria-hidden="true" autoComplete="username" />
             <input type="password" name="password_fake" className="hidden" aria-hidden="true" autoComplete="current-password" />
             
             <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             <input 
               type="search" 
               name="integration_safe_search_val"
               id="integration_safe_search_val"
               placeholder="Rechercher un service..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               autoComplete="new-password"
               autoCorrect="off"
               spellCheck="false"
               data-lpignore="true"
               data-1p-ignore="true"
               className="w-full bg-slate-50 border border-slate-200/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all rounded-xl py-2.5 pl-11 pr-4 text-[14px] font-medium text-slate-800 outline-none shadow-inner"
             />
          </div>
        </div>

        {/* -- ZONE PRINCIPALE (Data Area) -- */}
        <main className="flex-1 min-w-0 w-full animate-in slide-in-from-bottom-2 duration-300 delay-75">
          <div className="space-y-6">
            
            {/* NOTE SÉCURITÉ */}
            {currentGroup?.category !== '📱 Notifications & Messaging' && (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_8px_30px_rgba(245,158,11,0.15)] relative overflow-hidden backdrop-blur-md">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-200/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
                <span className="text-2xl flex-shrink-0 p-3 bg-amber-100/80 rounded-2xl shadow-inner border border-amber-200/60 flex items-center justify-center">⚠️</span>
                <div className="relative z-10 pt-1">
                  <p className="text-sm font-bold text-amber-900 leading-snug">
                    Les clés affichées ici sont stockées de façon ultra-sécurisée (Table IntegrationKey).
                    Ne partagez jamais ces accès avec un membre non Super-Admin de votre équipe.
                  </p>
                </div>
              </div>
            )}

            {/* CUSTOM HUB : Notifications & Messaging */}
            {currentGroup?.category === '📱 Notifications & Messaging' && (
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-[2rem] p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="relative z-10 max-w-3xl">
                   <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-black tracking-widest text-emerald-100 uppercase">Hub de Communication IA</span>
                   </div>
                   <h2 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight">Le Cœur Battant de <span className="text-emerald-400">Yayyam</span></h2>
                   <p className="text-gray-400 text-base md:text-lg leading-relaxed font-medium mb-8">
                     Centralisez l'orchestration des flux vitaux (E-mails Transactionnels, Webhooks Meta, Notifs Telegram). Ces clés permettent au Smart Router d'envoyer des relances intelligentes, de livrer les accès 24/7 et de jouer les alertes Cha-Ching. ⚡️
                   </p>
                   
                   <div className="flex flex-wrap gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[200px] backdrop-blur-sm">
                         <span className="text-2xl mb-2 block">💬</span>
                         <h4 className="font-bold text-white mb-1">Passerelle Meta</h4>
                         <p className="text-xs text-gray-500 font-medium">Relais des Webhooks WhatsApp Business</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[200px] backdrop-blur-sm">
                         <span className="text-2xl mb-2 block">💌</span>
                         <h4 className="font-bold text-white mb-1">Passerelle Brevo</h4>
                         <p className="text-xs text-gray-500 font-medium">Infrastructure d'envois ultra-rapides</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[200px] backdrop-blur-sm">
                         <span className="text-2xl mb-2 block">✈️</span>
                         <h4 className="font-bold text-white mb-1">Passerelle Telegram</h4>
                         <p className="text-xs text-gray-500 font-medium">Gestion Privée des Communautés Acheteurs</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* MANAGER INTELLIGENCE ARTIFICIELLE (Priorités Routeur) */}
            {currentGroup?.category === '🤖 Intelligence Artificielle' && (
               <AIRoutingManager initialConfig={aiRoutingPrefs} />
            )}

            {/* VUE KANBAN / GRILLE */}
            {currentGroup && (
              <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards">
                <div className={`grid grid-cols-1 ${currentGroup.services.length > 1 ? 'xl:grid-cols-2' : ''} gap-6 items-start`}>
                  {currentGroup.services.map(service => (
                     <ServiceCard
                        key={service.id}
                        service={service}
                        configMap={configMap}
                        stats={statsMap[service.id]}
                     />
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  )
}
