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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SettingsLayout({ store, profile, userId }: { store: any, profile?: { name?: string; phone?: string; email?: string | null }, userId: string }) {
  const [activeSection, setActiveSection] = useState('profil')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '')
      if (['profil', 'lien', 'apparence', 'vendor', 'reseaux', 'securite', 'notifications', 'retrait', 'kyc', 'seo', 'contrat', 'whatsapp-bot', 'loyalty', 'anti-fraude'].includes(hash)) {
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
      case 'profil': return <ProfileTab profile={profile} userId={userId!} />
      case 'lien': return <StoreLinkTab store={store} />
      case 'apparence': return <AppearanceTab store={store} />
      case 'vendor': return <VendorTypeTab store={store} />
      case 'reseaux': return <SocialLinksTab store={store} />
      case 'securite': return <SecurityTab profile={profile} />
      case 'notifications': return <NotificationsTab store={store} />
      case 'retrait': return <FinanceTab store={store} />
      case 'kyc': return <KycTab store={store} />
      case 'seo': return <SeoTab store={store} />
      case 'contrat': return <ContractTab store={store} />
      case 'whatsapp-bot': return <WhatsappBotTab store={store} />
      case 'loyalty': return <LoyaltyTab store={store} />
      case 'danger': return <DangerZoneTab />
      default: return <ProfileTab profile={profile} userId={userId!} />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full pb-20 items-start relative z-20">
      
      {/* ── MENU LATÉRAL ACCOLÉ ── */}
      <aside className="w-full lg:w-[300px] flex-shrink-0 sticky top-[80px] z-10 lg:h-[calc(100vh-80px)] overflow-y-auto bg-white/80 backdrop-blur-3xl border-r border-gray-200 p-5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col gap-6">
        <nav className="flex lg:flex-col gap-1.5 min-w-max lg:min-w-0" aria-label="Menu des paramètres du vendeur">
          <MenuBtn active={activeSection === 'profil'} icon={<User className="w-5 h-5" />} label="Général" onClick={() => setActiveSection('profil')} />
          <MenuBtn active={activeSection === 'lien'} icon={<Globe className="w-5 h-5" />} label="Lien Boutique" onClick={() => setActiveSection('lien')} />
          <MenuBtn active={activeSection === 'apparence'} icon={<Palette className="w-5 h-5" />} label="Apparence" onClick={() => setActiveSection('apparence')} />
          <MenuBtn active={activeSection === 'vendor'} icon={<StoreIcon className="w-5 h-5" />} label="Type de Vendeur" onClick={() => setActiveSection('vendor')} />
          <div className="hidden lg:block h-6" />
          <MenuBtn active={activeSection === 'reseaux'} icon={<Share2 className="w-5 h-5" />} label="Réseaux Sociaux" onClick={() => setActiveSection('reseaux')} />
          <MenuBtn active={activeSection === 'seo'} icon={<Search className="w-5 h-5" />} label="Référencement & SEO" onClick={() => setActiveSection('seo')} />
          <MenuBtn active={activeSection === 'securite'} icon={<ShieldCheck className="w-5 h-5" />} label="Sécurité" onClick={() => setActiveSection('securite')} />
          <MenuBtn active={activeSection === 'notifications'} icon={<Bell className="w-5 h-5" />} label="Notifications" onClick={() => setActiveSection('notifications')} />
          <div className="hidden lg:block h-6" />
          <MenuBtn active={activeSection === 'retrait'} icon={<Wallet className="w-5 h-5" />} label="Retraits" onClick={() => setActiveSection('retrait')} />
          <MenuBtn active={activeSection === 'kyc'} icon={<CheckCircle2 className="w-5 h-5" />} label="Vérification KYC" onClick={() => setActiveSection('kyc')} />
          <MenuBtn active={activeSection === 'contrat'} icon={<FileText className="w-5 h-5" />} label="Contrat Partenaire" onClick={() => setActiveSection('contrat')} />
          
          {store?.installedApps?.some((a: { app_id: string; status: string }) => a.app_id === 'whatsapp-bot' && a.status === 'active') && (
            <MenuBtn active={activeSection === 'whatsapp-bot'} icon={<Phone className="w-5 h-5" />} label="WhatsApp Bot" onClick={() => setActiveSection('whatsapp-bot')} />
          )}

          {store?.installedApps?.some((a: { app_id: string; status: string }) => a.app_id === 'loyalty-points' && a.status === 'active') && (
            <MenuBtn active={activeSection === 'loyalty'} icon={<Trophy className="w-5 h-5" />} label="Fidélité (Points)" onClick={() => setActiveSection('loyalty')} />
          )}

          <div className="hidden lg:block h-6" />
          <button 
            onClick={() => setActiveSection('danger')}
            aria-current={activeSection === 'danger' ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 ${
              activeSection === 'danger' ? 'bg-red-50 text-red-600 ring-1 ring-red-200 shadow-sm' : 'text-red-400 hover:bg-white/80 hover:text-red-600 hover:translate-x-1 hover:shadow-sm'
            }`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" /> <span className={activeSection !== 'danger' ? 'hidden lg:inline' : 'inline'}>Zone de Danger</span>
          </button>
          
          <div className="hidden lg:block mt-10 p-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:shadow-[0_4px_30px_rgb(0,0,0,0.06)] transition-all">
            <p className="text-[12px] font-black text-gray-900 mb-3 tracking-widest uppercase">Progression</p>
            <div className="w-full bg-gray-100/50 rounded-full h-2 mb-3 overflow-hidden shadow-inner">
              {/* eslint-disable-next-line */}
              <div className={`bg-[#0F7A60] h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(15,122,96,0.5)] ${completionPercent === 0 ? 'w-0' : completionPercent === 20 ? 'w-1/5' : completionPercent === 40 ? 'w-2/5' : completionPercent === 60 ? 'w-3/5' : completionPercent === 80 ? 'w-4/5' : 'w-full'}`}></div>
            </div>
            <p className="text-[12px] font-medium text-gray-500">{completionPercent === 100 ? 'Boutique parfaitement configurée ! 🎉' : 'Complétez votre profil pour vendre.'}</p>
          </div>
        </nav>
      </aside>

      {/* ── CONTENU (Sections) ── */}
      <div className="flex-1 w-full relative z-10 p-4 md:p-6 lg:p-8 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.96, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: -20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="w-full relative"
          >
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>
      </div>

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
