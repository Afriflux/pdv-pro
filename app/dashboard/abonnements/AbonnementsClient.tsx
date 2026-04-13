'use client'

import React, { useState } from 'react'
import SimulateurCommission from '@/components/dashboard/SimulateurCommission'
import { Trophy, Clock, Target, BarChart3, Receipt, Wallet, Sparkles, Lock, ShieldCheck, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tier {
  name: string
  label: string
  min: number
  max: number | null
  rate: number
  color: string
}

interface MonthStat {
  label: string
  ca: number
  rate: number
  commission: number
  net: number
}

interface AbonnementsClientProps {
  storeName: string
  currentMonthCA: number
  rate: number
  commissionAmt: number
  vendorNet: number
  currentTierIdx: number
  nextTier: Tier | null
  missingForNextTier: number
  tierProgress: number
  monthStats: MonthStat[]
  tiers: Tier[]
}

const scaleUp: any = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }
}

export default function AbonnementsClient({
  storeName,
  currentMonthCA,
  rate,
  commissionAmt,
  vendorNet,
  currentTierIdx,
  nextTier,
  missingForNextTier,
  tierProgress,
  monthStats,
  tiers
}: AbonnementsClientProps) {
  const [activeTab, setActiveTab] = useState<string>('kanban')

  function fmt(n: number): string {
    return Math.round(n).toLocaleString('fr-FR')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-body relative overflow-hidden">
      
      {/* DECORATIVE BACKGROUND BLOBS */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#0F7A60]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] translate-x-1/3 pointer-events-none"></div>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-12 pb-0 relative z-10">
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white border border-[#0F7A60]/20 text-[#0F7A60] font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                <Sparkles size={14} className="text-amber-500" /> Modèle Gagnant-Gagnant
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-ink tracking-tight">
                Mon Statut & Commissions
              </h1>
              <p className="text-slate font-medium text-base max-w-2xl leading-relaxed">
                Zéro abonnement fixe. <strong className="text-ink">{storeName}</strong>, avec Yayyam, la commission s'adapte à votre succès. De <strong className="text-[#0F7A60]">{tiers[0].rate}% à {tiers[tiers.length - 1].rate}%</strong> au fur et à mesure que vous grandissez.
              </p>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar border-b border-gray-200/60 pb-px">
            {[
              { id: 'kanban', label: 'Ma Progression', icon: <Target size={18} /> },
              { id: 'simulator', label: 'Grille & Simulateur', icon: <BarChart3 size={18} /> },
              { id: 'history', label: 'Historique Facturation', icon: <Receipt size={18} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'kanban' | 'history' | 'simulator')}
                className={`relative flex items-center gap-2 px-4 py-4 font-bold text-sm transition-all shrink-0 overflow-hidden ${
                  activeTab === tab.id
                    ? 'text-[#0F7A60]'
                    : 'text-slate hover:text-ink'
                }`}
              >
                {tab.icon}
                {tab.label}
                {/* Active Indicator Line */}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0F7A60] rounded-t-full shadow-[0_-2px_8px_rgba(15,122,96,0.5)]"></motion.div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-10 relative z-10">
        <AnimatePresence mode="wait">
          {/* ── TAB: KANBAN PROGRESSION ──────────────────────────────────────────── */}
          {activeTab === 'kanban' && (
            <motion.div 
               key="kanban"
               variants={scaleUp} initial="hidden" animate="visible" exit="exit"
               className="space-y-12"
            >
              {/* KPI GLASS PANEL */}
              <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-2 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200/50">
                  {/* CA Box */}
                  <div className="p-8 hover:bg-white transition-colors duration-500 rounded-[2.2rem] group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <BarChart3 size={20} />
                      </div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">CA ce mois</p>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                       {/* Pourrions animer les nombres, mais en SSR simple on utilise fmt */}
                      <p className="text-4xl md:text-5xl font-display font-black text-ink tracking-tight">{fmt(currentMonthCA)}</p>
                      <p className="text-sm font-bold text-slate uppercase tracking-wider mb-1">FCFA</p>
                    </div>
                  </div>

                  {/* Commission Box */}
                  <div className="p-8 hover:bg-white transition-colors duration-500 rounded-[2.2rem] group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Wallet size={20} />
                      </div>
                      <p className="text-xs font-black text-amber-600/70 uppercase tracking-widest">Frais Plateforme</p>
                    </div>
                    <div className="flex items-end gap-3 mt-2">
                      <p className="text-4xl md:text-5xl font-display font-black text-amber-500 tracking-tight">{rate}%</p>
                      <div className="flex items-baseline gap-1.5 pb-2 border-b-2 border-amber-200/50 border-dotted mb-1">
                        <p className="text-base font-bold text-amber-600/60">Environ {fmt(commissionAmt)}</p>
                        <p className="text-xs font-bold text-amber-600/50 uppercase tracking-widest">FCFA</p>
                      </div>
                    </div>
                  </div>

                  {/* Net Box */}
                  <div className="p-8 bg-gradient-to-br from-[#0F7A60]/5 to-transparent hover:from-[#0F7A60]/10 transition-colors duration-500 rounded-[2.2rem] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#0F7A60]/10 rounded-full blur-2xl group-hover:bg-[#0F7A60]/20 transition-all duration-700"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-[#0F7A60] text-white flex items-center justify-center shadow-md shadow-[#0F7A60]/20 group-hover:scale-110 transition-transform">
                        <Trophy size={20} />
                      </div>
                      <p className="text-xs font-black text-[#0F7A60] uppercase tracking-widest">Votre Net Estimé</p>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <p className="text-4xl md:text-5xl font-display font-black text-[#0F7A60] tracking-tight">{fmt(vendorNet)}</p>
                      <p className="text-sm font-bold text-[#0F7A60]/60 uppercase tracking-wider mb-1">FCFA</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* KANBAN / PROGRESSION PATH - DARK IMMERSIVE THEME */}
              <div className="mt-16 bg-[#0B1511] rounded-[3rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl border border-white/5">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#0F7A60]/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 relative z-10 gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 border border-emerald-500/20">
                      <Sparkles size={14} /> Votre évolution sur Yayyam
                    </div>
                    <h3 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight">Feuille de Route</h3>
                    <p className="text-emerald-100/60 text-base mt-3 max-w-xl leading-relaxed">Boostez votre chiffre d&apos;affaires mensuel pour débloquer automatiquement un taux de rétention encore plus bas.</p>
                  </div>
                </div>

                {/* Seamless Path Container */}
                <div className="relative z-10 pb-8">
                  {/* Horizontal Connection Line (Greyed) */}
                  <div className="hidden lg:block absolute top-[160px] left-[12%] right-[12%] h-1 bg-white/5 rounded-full z-0"></div>
                  {/* Active Connection Line Fill (Glowing Emerald) */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((currentTierIdx + (tierProgress / 100)) / (tiers.length - 1)) * 76 + 12, 88)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="hidden lg:block absolute top-[160px] left-[12%] h-1 bg-emerald-500 rounded-full z-0 shadow-[0_0_20px_rgba(52,211,153,0.9)]"
                  />

                  {/* Grid of Tiers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {tiers.map((tier, idx) => {
                      const isPast = idx < currentTierIdx
                      const isCurrent = idx === currentTierIdx
                      const isFuture = idx > currentTierIdx

                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={tier.name} 
                          className={`flex flex-col h-[380px] rounded-[2rem] transition-all duration-500 relative group overflow-hidden ${
                            isCurrent 
                              ? "bg-gradient-to-br from-[#0B2519] to-[#04120D] shadow-[0_20px_60px_-15px_rgba(15,122,96,0.6)] border border-emerald-500/40 scale-105 z-20 hover:border-emerald-400/60" 
                              : isPast 
                                ? "bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 backdrop-blur-sm" 
                                : "bg-black/40 backdrop-blur-sm border border-white/5 border-dashed hover:border-white/10"
                          }`}
                        >
                          {/* Current Tier Intense Glow Effects */}
                          {isCurrent && (
                            <>
                              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-[40px] pointer-events-none"></div>
                              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-600/20 rounded-full blur-[40px] pointer-events-none"></div>
                            </>
                          )}

                          {/* Top Header Section */}
                          <div className={`p-6 pb-4 flex flex-col items-center justify-center text-center border-b ${isCurrent ? "border-emerald-500/20" : "border-white/5"}`}>
                            {/* Circular Badge Rate */}
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 ${
                              isCurrent 
                                ? "bg-gradient-to-br from-emerald-400 to-[#0F7A60] text-white shadow-[0_0_30px_rgba(52,211,153,0.5)] group-hover:scale-110" 
                                : isPast
                                  ? "bg-white/10 text-white border border-white/10"
                                  : "bg-transparent text-white/30 border border-white/10 border-dashed"
                            }`}>
                              <span className={`text-3xl font-display font-black ${isFuture ? "text-white/30" : "text-white"}`}>{tier.rate}%</span>
                            </div>
                            
                            <h4 className={`font-black uppercase tracking-widest text-xs mb-1 ${isCurrent ? "text-emerald-300" : isPast ? "text-white" : "text-white/40"}`}>
                              {tier.name}
                            </h4>
                            <p className={`text-xs font-medium leading-tight px-4 ${isCurrent ? "text-emerald-100/80" : "text-white/40"}`}>
                              {tier.label}
                            </p>
                          </div>

                          {/* Body Area */}
                          <div className="flex-1 p-6 relative flex flex-col justify-center">
                            {isCurrent && (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="h-full flex flex-col justify-center">
                                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/20 relative z-10 shadow-inner group-hover:bg-black/50 transition-colors">
                                  <div className="flex flex-col items-center text-center mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)] mb-2 border border-emerald-500/30">
                                      <Sparkles size={16} className="text-emerald-400" />
                                    </div>
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                                      Votre Palier
                                    </p>
                                  </div>
                                  
                                  {/* Progress to next */}
                                  {nextTier ? (
                                    <div className="space-y-2 mt-4">
                                      <div className="flex justify-between text-xs font-bold text-emerald-200/60 uppercase tracking-widest">
                                        <span>{fmt(currentMonthCA)} FCFA</span>
                                        <span>Objectif : {fmt(nextTier.min)} FCFA</span>
                                      </div>
                                      <div className="h-1.5 bg-black/80 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${tierProgress}%` }}
                                          transition={{ duration: 1.5, delay: 0.5 }}
                                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full shadow-[0_0_10px_rgba(167,243,208,0.8)]" 
                                        />
                                      </div>
                                      <p className="text-xs text-center text-emerald-100/70 leading-relaxed pt-2">
                                        Plus que <strong className="text-emerald-300">+ {fmt(missingForNextTier)} FCFA</strong> ce mois pour profiter du <span className="text-white font-black">{nextTier.rate}%</span>
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-center text-emerald-100 mt-2">
                                      <Trophy size={24} className="mx-auto mb-2 text-yellow-400 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                                      <p className="text-xs font-bold uppercase tracking-widest">Meilleur Palier Atteint</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {isPast && (
                              <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-emerald-400/80 mb-3 border border-white/10 shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform">
                                  <ShieldCheck size={20} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Palier Dépassé</span>
                                <span className="text-xs text-white/40 mt-1 block">Succès validé ce mois.</span>
                              </div>
                            )}

                            {isFuture && (
                              <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-3 border border-white/5 border-dashed backdrop-blur-sm group-hover:border-white/20 transition-colors">
                                  <Lock size={20} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-white/30">En attente</span>
                                {idx === currentTierIdx + 1 && (
                                  <span className="text-xs font-bold text-emerald-400 mt-3 block bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                                    Prochain Palier
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Info COD Box - Inside Dark Theme, integrated beautifully */}
                <div className="mt-8 bg-black/40 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-1/2 left-0 w-full h-[200px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0 border border-amber-400/20">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-display font-black text-white text-xl">Service Cash on Delivery</h4>
                          <span className="text-xs bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                            Exception <Lock size={10} />
                          </span>
                        </div>
                        <p className="text-xs text-white/50 max-w-2xl leading-relaxed mt-2">
                          Pour toutes vos ventes expédiées en Paiement à la Livraison, le taux de commission est <strong className="text-amber-400 font-bold">bloqué à 5%</strong>, quel que soit votre statut actuel. Le modèle le plus avantageux pour le e-commerce local.
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center p-5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                      <span className="text-4xl font-display font-black text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                        5%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TAB: SIMULATEUR ─────────────────────────────────────────────────── */}
          {activeTab === 'simulator' && (
            <motion.div key="simulator" variants={scaleUp} initial="hidden" animate="visible" exit="exit" className="w-full py-8">
               <div className="text-center mb-10">
                  <span className="inline-flex items-center gap-2 bg-[#0F7A60]/10 text-[#0F7A60] font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                    Outil de prévision
                  </span>
                  <h3 className="text-3xl md:text-5xl font-display font-black text-ink mb-3 tracking-tight">Simulateur de revenus</h3>
                  <p className="text-slate text-base">Estimez au centime près vos commissions en fonction de votre volume de ventes cible.</p>
               </div>
               <SimulateurCommission />
            </motion.div>
          )}

          {/* ── TAB: HISTORIQUE ─────────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <motion.div key="history" variants={scaleUp} initial="hidden" animate="visible" exit="exit" className="w-full">
              <div className="bg-white rounded-[2.5rem] border border-line shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                 <div className="px-8 py-8 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-ink"><Clock size={20} /></div>
                     <div>
                       <h2 className="font-black font-display text-2xl text-ink">Facturation mensuelle</h2>
                       <p className="text-sm text-slate mt-1">Détail des 3 derniers mois d'activité clôturés.</p>
                     </div>
                   </div>
                 </div>

                 <div className="divide-y divide-gray-100">
                   {monthStats.map((stat, i) => (
                     <div key={i} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-gray-50/50 transition-colors group">
                       {/* Month Badge */}
                       <div className="flex-1 min-w-[200px]">
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-[#0F7A60]"></div>
                           <p className="text-lg font-black text-ink capitalize tracking-tight">{stat.label}</p>
                         </div>
                         <p className="text-xs text-slate mt-2 pl-5">Cycle de facturation complet</p>
                       </div>
                       
                       {/* Stats Row */}
                       <div className="flex-1 flex items-center justify-between gap-6 flex-wrap bg-white rounded-2xl p-4 border border-gray-100 shadow-sm group-hover:border-[#0F7A60]/20 transition-colors">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate mb-1 font-bold">CA Ligne</p>
                            <p className="font-bold text-ink">{fmt(stat.ca)} <span className="text-xs font-medium text-gray-400 uppercase">FCFA</span></p>
                          </div>
                          <ChevronRight className="text-gray-200 hidden sm:block" size={16} />
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate mb-1 font-bold">Taux Appliqué</p>
                            <span className="inline-block bg-[#0F7A60]/10 text-[#0F7A60] font-black text-xs px-2 py-0.5 rounded-md">{stat.rate}%</span>
                          </div>
                          <ChevronRight className="text-gray-200 hidden sm:block" size={16} />
                          <div>
                            <p className="text-xs uppercase tracking-widest text-amber-600/70 mb-1 font-bold">Frais Yayyam</p>
                            <p className="font-bold text-amber-600">- {fmt(stat.commission)} <span className="text-xs font-medium text-amber-400 uppercase">FCFA</span></p>
                          </div>
                       </div>

                       {/* Result */}
                       <div className="text-right min-w-[150px] pl-4 lg:border-l border-gray-100">
                          <p className="text-xs uppercase tracking-widest text-[#0F7A60] mb-1 font-black">Net Encaissé</p>
                          <p className="font-black font-display text-[#0F7A60] text-3xl tracking-tight">{fmt(stat.net)}</p>
                          <p className="text-xs text-[#0F7A60]/60 font-medium">FCFA</p>
                       </div>
                     </div>
                   ))}
                   {monthStats.every(m => m.ca === 0) && (
                     <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                          <Receipt size={32} className="text-gray-300" />
                        </div>
                        <p className="font-display font-black text-xl text-ink">Aucune activité récente</p>
                        <p className="text-sm text-slate mt-2 max-w-sm">Dès que vous commencerez à générer des ventes en ligne, vos factures mensuelles apparaîtront ici.</p>
                     </div>
                   )}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
