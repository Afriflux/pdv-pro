'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Globe, Palette, Store as StoreIcon, Share2, 
  ShieldCheck, Bell, Wallet, CheckCircle2, 
  FileText, AlertTriangle, Search, Phone, Trophy
} from 'lucide-react'

// Imports des Tabs
import { ProfileTab } from './tabs/ProfileTab'
import { StoreLinkTab } from './tabs/StoreLinkTab'
import { AppearanceTab } from './tabs/AppearanceTab'
import { VendorTypeTab } from './tabs/VendorTypeTab'
import { SocialLinksTab } from './tabs/SocialLinksTab'
import { SecurityTab } from './tabs/SecurityTab'
import { NotificationsTab } from './tabs/NotificationsTab'
import { FinanceTab } from './tabs/FinanceTab'
import { KycTab } from './tabs/KycTab'
import { ContractTab } from './tabs/ContractTab'
import { DangerZoneTab } from './tabs/DangerZoneTab'
import { SeoTab } from './tabs/SeoTab'
import { WhatsappBotTab } from './tabs/WhatsappBotTab'
import { LoyaltyTab } from './tabs/LoyaltyTab'
import { GeoFencingTab } from './tabs/GeoFencingTab'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SettingsLayout({ store, profile, userId }: { store: any, profile?: { name?: string; phone?: string; email?: string | null }, userId: string }) {
  const [activeSection, setActiveSection] = useState('profil')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '')
      if (['profil', 'lien', 'apparence', 'vendor', 'reseaux', 'securite', 'notifications', 'retrait', 'kyc', 'seo', 'contrat', 'whatsapp-bot', 'loyalty', 'anti-fraude', 'geofence'].includes(hash)) {
        if (hash === 'anti-fraude') setActiveSection('securite')
        else setActiveSection(hash)
      }
    }
  }, [])
  const [completionPercent, setCompletionPercent] = useState(0)

  useEffect(() => {
    let completed = 0
    if (profile?.name && profile?.phone) completed += 1
    if (store?.slug) completed += 1
    if (store?.logo_url || store?.banner_url) completed += 1
    if (store?.kyc_status === 'verified') completed += 1
    if (store?.withdrawal_number) completed += 1
    
    setCompletionPercent((completed / 5) * 100)
  }, [profile, store])

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profil': return <ProfileTab profile={profile} userId={userId!} store={store} />
      case 'lien': return <StoreLinkTab store={store} />
      case 'apparence': return <AppearanceTab store={store} />
      case 'vendor': return <VendorTypeTab store={store} />
      case 'reseaux': return <SocialLinksTab store={store} />
      case 'securite': return <SecurityTab profile={profile} store={store} />
      case 'notifications': return <NotificationsTab store={store} />
      case 'retrait': return <FinanceTab store={store} />
      case 'kyc': return <KycTab store={store} />
      case 'seo': return <SeoTab store={store} />
      case 'contrat': return <ContractTab store={store} />
      case 'whatsapp-bot': return <WhatsappBotTab store={store} />
      case 'loyalty': return <LoyaltyTab store={store} />
      case 'geofence': return <GeoFencingTab store={store} />
      case 'danger': return <DangerZoneTab />
      default: return <ProfileTab profile={profile} userId={userId!} store={store} />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full gap-6 lg:gap-8 pb-20 relative z-20 px-4 md:px-6 lg:px-8 mx-auto">
      
      {/* ── MENU HYBRIDE ── */}
      <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start z-20">
        
        {/* PROGRESS BAR DANS SIDEBAR (Desktop seulement, optionnel) ou en haut */}
        <div className="hidden lg:block px-6 py-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-gray-900 tracking-widest uppercase">Progression</span>
            <span className="text-[11px] font-bold text-gray-500">{completionPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#0F7A60] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(15,122,96,0.5)]" {...{ style: { width: `${completionPercent}%` } }}></div>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide lg:overflow-visible bg-white/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-2 lg:p-0 rounded-2xl lg:rounded-none border border-gray-200/50 lg:border-none shadow-[0_4px_15px_rgba(0,0,0,0.02)] lg:shadow-none">
          <nav className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 min-w-max lg:min-w-0" aria-label="Menu des paramètres du vendeur">
            <MenuBtn active={activeSection === 'profil'} icon={<User size={16} />} label="Général" onClick={() => setActiveSection('profil')} />
            <MenuBtn active={activeSection === 'lien'} icon={<Globe size={16} />} label="Lien Boutique" onClick={() => setActiveSection('lien')} />
            <MenuBtn active={activeSection === 'apparence'} icon={<Palette size={16} />} label="Apparence" onClick={() => setActiveSection('apparence')} />
            <MenuBtn active={activeSection === 'vendor'} icon={<StoreIcon size={16} />} label="Vendeur" onClick={() => setActiveSection('vendor')} />
            <MenuBtn active={activeSection === 'geofence'} icon={<Globe size={16} />} label="Ciblage Pays" onClick={() => setActiveSection('geofence')} />
            <MenuBtn active={activeSection === 'reseaux'} icon={<Share2 size={16} />} label="Réseaux" onClick={() => setActiveSection('reseaux')} />
            <MenuBtn active={activeSection === 'seo'} icon={<Search size={16} />} label="SEO" onClick={() => setActiveSection('seo')} />
            <MenuBtn active={activeSection === 'securite'} icon={<ShieldCheck size={16} />} label="Sécurité" onClick={() => setActiveSection('securite')} />
            <MenuBtn active={activeSection === 'notifications'} icon={<Bell size={16} />} label="Notifications" onClick={() => setActiveSection('notifications')} />
            <MenuBtn active={activeSection === 'retrait'} icon={<Wallet size={16} />} label="Retraits" onClick={() => setActiveSection('retrait')} />
            <MenuBtn active={activeSection === 'kyc'} icon={<CheckCircle2 size={16} />} label="Vérification KYC" onClick={() => setActiveSection('kyc')} />
            <MenuBtn active={activeSection === 'contrat'} icon={<FileText size={16} />} label="Contrat" onClick={() => setActiveSection('contrat')} />
            
            {store?.installedApps?.some((a: { app_id: string; status: string }) => a.app_id === 'whatsapp-bot' && a.status === 'active') && (
              <MenuBtn active={activeSection === 'whatsapp-bot'} icon={<Phone size={16} />} label="WhatsApp" onClick={() => setActiveSection('whatsapp-bot')} />
            )}
            {store?.installedApps?.some((a: { app_id: string; status: string }) => a.app_id === 'loyalty-points' && a.status === 'active') && (
              <MenuBtn active={activeSection === 'loyalty'} icon={<Trophy size={16} />} label="Fidélité" onClick={() => setActiveSection('loyalty')} />
            )}

            <button 
              onClick={() => setActiveSection('danger')}
              aria-current={activeSection === 'danger' ? 'page' : undefined}
              className={`relative flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-[14.5px] transition-all duration-300 lg:w-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-red-500 overflow-hidden ${
                activeSection === 'danger' ? 'font-bold text-red-600 bg-red-50/90 shadow-sm border border-red-100 scale-[1.03]' : 'font-medium text-red-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm hover:-translate-y-0.5 lg:hover:translate-x-1 border border-transparent'
              }`}
            >
              <div className="relative z-10 transition-transform duration-300 flex-shrink-0 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <span className={`relative z-10 ${activeSection !== 'danger' ? 'hidden lg:inline' : 'inline'}`}>Danger</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* ── CONTENU (Sections) ── */}
      <main className="flex-1 w-full min-w-0 relative z-10 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full relative"
          >
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  )
}

function MenuBtn({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-[14.5px] transition-all duration-400 lg:w-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0F7A60] focus-visible:ring-offset-2 group overflow-hidden
        ${active ? 'font-bold text-[#0F7A60] bg-white/90 backdrop-blur-xl shadow-[0_8px_20px_rgb(15,122,96,0.1)] border border-white scale-[1.03]' : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-white/60 hover:backdrop-blur-lg hover:shadow-sm hover:translate-x-1 hover:border hover:border-white/50 lg:hover:translate-x-1.5'}
      `}
    >
      <div className={`relative z-10 transition-transform duration-300 flex-shrink-0 flex items-center justify-center ${active ? 'text-[#0F7A60] scale-110 drop-shadow-[0_2px_8px_rgba(15,122,96,0.4)]' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {icon}
      </div>
      <span className={`relative z-10 ${!active ? 'hidden lg:inline' : 'inline'}`}>{label}</span>
      {active && (
         <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0F7A60] z-10 shadow-[0_0_12px_rgba(15,122,96,0.8)] animate-pulse" />
      )}
    </button>
  )
}
