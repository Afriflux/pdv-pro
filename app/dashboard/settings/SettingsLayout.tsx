'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Globe, Palette, Store as StoreIcon, Share2, 
  Target, ShieldCheck, Bell, Wallet, CheckCircle2, 
  FileText, AlertTriangle
} from 'lucide-react'

// Imports des Tabs
import { ProfileTab } from './tabs/ProfileTab'
import { StoreLinkTab } from './tabs/StoreLinkTab'
import { AppearanceTab } from './tabs/AppearanceTab'
import { VendorTypeTab } from './tabs/VendorTypeTab'
import { SocialLinksTab } from './tabs/SocialLinksTab'
import { PixelsTab } from './tabs/PixelsTab'
import { SecurityTab } from './tabs/SecurityTab'
import { NotificationsTab } from './tabs/NotificationsTab'
import { FinanceTab } from './tabs/FinanceTab'
import { KycTab } from './tabs/KycTab'
import { ContractTab } from './tabs/ContractTab'
import { DangerZoneTab } from './tabs/DangerZoneTab'

export function SettingsLayout({ store, profile, userId }: any) {
  const [activeSection, setActiveSection] = useState('profil')
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
      case 'profil': return <ProfileTab profile={profile} userId={userId} />
      case 'lien': return <StoreLinkTab store={store} />
      case 'apparence': return <AppearanceTab store={store} />
      case 'vendor': return <VendorTypeTab store={store} />
      case 'reseaux': return <SocialLinksTab store={store} />
      case 'pixels': return <PixelsTab store={store} />
      case 'securite': return <SecurityTab profile={profile} />
      case 'notifications': return <NotificationsTab store={store} />
      case 'retrait': return <FinanceTab store={store} />
      case 'kyc': return <KycTab store={store} />
      case 'contrat': return <ContractTab store={store} />
      case 'danger': return <DangerZoneTab />
      default: return <ProfileTab profile={profile} userId={userId} />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      
      {/* ── MENU LATÉRAL ── */}
      <aside className="lg:w-80 flex-shrink-0 lg:block overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 z-20">
        <nav className="flex lg:flex-col gap-1.5 sticky top-32 min-w-max lg:min-w-0 bg-white/40 backdrop-blur-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-4 rounded-[2rem] lg:bg-transparent lg:shadow-none lg:border-none lg:backdrop-blur-none lg:p-0">
          <MenuBtn active={activeSection === 'profil'} icon={<User size={18}/>} label="Général" onClick={() => setActiveSection('profil')} />
          <MenuBtn active={activeSection === 'lien'} icon={<Globe size={18}/>} label="Lien Boutique" onClick={() => setActiveSection('lien')} />
          <MenuBtn active={activeSection === 'apparence'} icon={<Palette size={18}/>} label="Apparence" onClick={() => setActiveSection('apparence')} />
          <MenuBtn active={activeSection === 'vendor'} icon={<StoreIcon size={18}/>} label="Type de Vendeur" onClick={() => setActiveSection('vendor')} />
          <div className="hidden lg:block h-6" />
          <MenuBtn active={activeSection === 'reseaux'} icon={<Share2 size={18}/>} label="Réseaux Sociaux" onClick={() => setActiveSection('reseaux')} />
          <MenuBtn active={activeSection === 'pixels'} icon={<Target size={18}/>} label="Tracking & Pixels" onClick={() => setActiveSection('pixels')} />
          <MenuBtn active={activeSection === 'securite'} icon={<ShieldCheck size={18}/>} label="Sécurité" onClick={() => setActiveSection('securite')} />
          <MenuBtn active={activeSection === 'notifications'} icon={<Bell size={18}/>} label="Notifications" onClick={() => setActiveSection('notifications')} />
          <div className="hidden lg:block h-6" />
          <MenuBtn active={activeSection === 'retrait'} icon={<Wallet size={18}/>} label="Retraits" onClick={() => setActiveSection('retrait')} />
          <MenuBtn active={activeSection === 'kyc'} icon={<CheckCircle2 size={18}/>} label="Vérification KYC" onClick={() => setActiveSection('kyc')} />
          <MenuBtn active={activeSection === 'contrat'} icon={<FileText size={18}/>} label="Contrat Partenaire" onClick={() => setActiveSection('contrat')} />
          <div className="hidden lg:block h-6" />
          <button 
            onClick={() => setActiveSection('danger')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-sm font-bold transition-all duration-300 ${
              activeSection === 'danger' ? 'bg-red-50 text-red-600 ring-1 ring-red-200 shadow-sm' : 'text-red-400 hover:bg-white/80 hover:text-red-600 hover:translate-x-1 hover:shadow-sm'
            }`}
          >
            <AlertTriangle size={18} /> <span className="hidden lg:inline">Danger Zone</span>
          </button>
          
          <div className="hidden lg:block mt-10 p-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:shadow-[0_4px_30px_rgb(0,0,0,0.06)] transition-all">
            <p className="text-[12px] font-black text-gray-900 mb-3 tracking-widest uppercase">Progression</p>
            <div className="w-full bg-gray-100/50 rounded-full h-2 mb-3 overflow-hidden shadow-inner">
              <div className="bg-[#0F7A60] h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(15,122,96,0.5)]" style={{ width: `${completionPercent}%` }}></div>
            </div>
            <p className="text-[12px] font-medium text-gray-500">{completionPercent === 100 ? 'Boutique parfaitement configurée ! 🎉' : 'Complétez votre profil pour vendre.'}</p>
          </div>
        </nav>
      </aside>

      {/* ── CONTENU (Sections) ── */}
      <div className="flex-1 max-w-4xl relative z-10">
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

function MenuBtn({ active, icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 px-5 py-4 rounded-[1.2rem] text-[14.5px] transition-all duration-400 lg:w-full shrink-0 outline-none group overflow-hidden
        ${active ? 'font-bold text-[#0F7A60] bg-white/90 backdrop-blur-xl shadow-[0_8px_20px_rgb(15,122,96,0.1)] border border-white scale-[1.03]' : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-white/60 hover:backdrop-blur-lg hover:shadow-sm hover:translate-x-1 hover:border hover:border-white/50 lg:hover:translate-x-1.5'}
      `}
    >
      <div className={`relative z-10 transition-transform duration-300 ${active ? 'text-[#0F7A60] scale-110 drop-shadow-[0_2px_8px_rgba(15,122,96,0.4)]' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {icon}
      </div>
      <span className={`relative z-10 ${!active ? 'hidden lg:inline' : 'inline'}`}>{label}</span>
      {active && (
         <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0F7A60] z-10 shadow-[0_0_12px_rgba(15,122,96,0.8)] animate-pulse" />
      )}
    </button>
  )
}
