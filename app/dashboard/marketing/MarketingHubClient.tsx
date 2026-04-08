'use client'

import { useState } from 'react'
import { LayoutDashboard, Target, PenTool, Radio, Mail, ChevronRight } from 'lucide-react'

// Imports des différentes sections
import MarketingStats from './MarketingStats'
import MarketingClient from './MarketingClient' // L'ancienne vue qui contient les outils de partage
import SocialKit from './SocialKit'
import ScriptsIA from './ScriptsIA'
import PixelSettings from './PixelSettings'
import EmailMarketing from './EmailMarketing'
import UgcStudio from './UgcStudio'

interface MarketingHubClientProps {
  store: { 
    id: string; 
    name: string; 
    slug: string; 
    meta_pixel_id: string | null; 
    tiktok_pixel_id: string | null;
    google_tag_id: string | null;
    whatsapp: string | null;
    whatsapp_abandoned_cart: boolean;
  }
  products: { id: string; name: string; type: string; views?: number }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links: any[]
  domain: string
}

type TabType = 'overview' | 'channels' | 'studio' | 'pixels' | 'automations'

export default function MarketingHubClient({ store, products, links, domain }: MarketingHubClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard, desc: "Performances et KPIs" },
    { id: 'channels', label: "Canaux & Liens", icon: Target, desc: "Partage et distribution" },
    { id: 'studio', label: "Studio Créatif", icon: PenTool, desc: "Générateur de posts et pubs IA" },
    { id: 'pixels', label: "Audiences & Pixels", icon: Radio, desc: "Tracking Meta et TikTok" },
    { id: 'automations', label: "Automatisations", icon: Mail, desc: "Séquences email & WhatsApp" },
  ] as const

  const storeUrl = `https://${domain}/${store.slug}`

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-72 shrink-0 space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-4 px-2">Menu</h3>
        <nav className="flex flex-col space-y-1 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                  isActive 
                  ? 'bg-[#0F7A60] text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#0F7A60]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${isActive ? 'bg-white/10' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-[#1A1A1A]'}`}>{tab.label}</p>
                    <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${isActive ? 'text-white/50' : 'text-gray-400'}`}>{tab.desc}</p>
                  </div>
                </div>
                {isActive && <ChevronRight size={16} className="text-white/50" />}
              </button>
            )
          })}
        </nav>

        {/* Info card motivante */}
        <div className="mt-8 bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-emerald-800">
          <span className="text-2xl mb-2 block">💡</span>
          <h4 className="font-bold text-sm mb-1">Stratégie du jour</h4>
          <p className="text-xs font-medium text-emerald-700 leading-relaxed">
            Astuce : Installez vos Pixels puis générez un Script Pub IA. Vous pourrez ainsi cibler exactement les personnes intéressées par vos produits.
          </p>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-w-0">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Performances Marketing</h2>
              <p className="text-sm text-gray-500 font-medium">Suivez l'impact de vos campagnes et de vos partages sur les 7 derniers jours.</p>
            </div>
            <MarketingStats storeId={store.id} links={links} />
            
            {/* Quick Share Widget inside Overview */}
            <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gold/10 rounded-full blur-3xl group-hover:bg-gold/20 transition-all duration-700" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-block bg-gold/10 text-gold-rich text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-3">ACTION RAPIDE</span>
                  <h3 className="text-xl font-black text-[#1A1A1A]">Lien de votre boutique</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm font-medium">Copiez ce lien pour le coller dans la section "Site Web" de votre bio Instagram ou l'envoyer par WhatsApp.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#FAFAF7] border border-gray-200 p-2 rounded-2xl w-full md:w-auto">
                  <span className="px-4 py-2 font-mono text-sm font-bold text-[#1A1A1A] truncate max-w-[200px]">{domain}/{store.slug}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(storeUrl);
                      alert("Lien copié dans le presse-papier !");
                    }}
                    className="bg-[#0F7A60] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#0D5C4A] transition-colors shrink-0"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHANNELS & DISTRIBUTION */}
        {activeTab === 'channels' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Canaux & Distribution</h2>
              <p className="text-sm text-gray-500 font-medium">Récupérez les liens directs et les codes QR spécifiques pour chacun de vos produits, et suivez les clics générés.</p>
            </div>
            {/* We reuse the MarketingClient which has the grid of products and links */}
            <MarketingClient store={store} products={products} links={links} domain={domain} />
          </div>
        )}

        {/* TAB 3: STUDIO CRÉATIF */}
        {activeTab === 'studio' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Studio Créatif IA</h2>
              <p className="text-sm text-gray-500 font-medium max-w-2xl">L'intelligence artificielle rédige pour vous des scripts publicitaires accrocheurs pour TikTok/Meta, et génère des posts complets avec emojis pour animer votre communauté.</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              <ScriptsIA />
              <div className="space-y-8 lg:space-y-12">
                <SocialKit storeName={store.name} storeUrl={storeUrl} />
                <UgcStudio storeName={store.name} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PIXELS & AUDIENCES */}
        {activeTab === 'pixels' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <PixelSettings 
              storeId={store.id} 
              initialMetaId={store.meta_pixel_id} 
              initialTiktokId={store.tiktok_pixel_id} 
              initialGoogleTagId={store.google_tag_id}
            />
          </div>
        )}

        {/* TAB 5: AUTOMATISATIONS */}
        {activeTab === 'automations' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Automatisations</h2>
              <p className="text-sm text-gray-500 font-medium max-w-2xl">Fidélisez votre clientèle automatiquement. Configurez des séquences de remerciement et de relance sans effort grâce à nos intégrations Email & WhatsApp.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <a href="/dashboard/marketing/sms" className="bg-gradient-to-br from-[#0F7A60] to-emerald-800 rounded-3xl p-6 text-white hover:scale-[1.02] transition-transform shadow-lg shadow-emerald-900/10 block group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                 <span className="text-3xl block mb-4">📱</span>
                 <h3 className="font-black text-xl mb-1">Passer au SMS Marketing</h3>
                 <p className="text-sm text-emerald-100 font-medium max-w-64">98% de taux d'ouverture. Envoyez vos promos et rappels directement sur le téléphone de vos clients locaux.</p>
               </a>
               <a href="/dashboard/workflows" className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-[#0F7A60] transition-colors block group relative overflow-hidden">
                 <span className="text-3xl block mb-4">🤖</span>
                 <h3 className="font-black text-xl text-gray-900 mb-1">Gérer les scénarios</h3>
                 <p className="text-sm text-gray-500 font-medium max-w-64">Construisez vos emails et envois automatiques via l'éditeur visuel (Panier abandonné, Reçu).</p>
               </a>
            </div>

            <EmailMarketing store={store} />
          </div>
        )}
      </div>
    </div>
  )
}
