"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, PhoneCall, Target, Star, BarChart3, Flame, Percent } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

interface CloserAnalyticsClientProps {
  stats: {
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    totalCommission: number;
    conversionRate: number;
  };
  chartData: any[];
  recentActivity: any[];
}

export default function CloserAnalyticsClient({ stats, chartData, recentActivity: _recentActivity }: CloserAnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVars: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="w-full relative min-h-screen bg-[#FAFAF7] font-sans pb-24 overflow-hidden">
      
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-br from-[#0F7A60]/10 via-[#0F7A60]/5 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-[-10%] w-[40vw] h-[40vw] bg-gradient-to-tl from-teal-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full pt-12 pb-8 px-4 sm:px-8 md:px-12 relative z-10"
      >
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm text-gray-500 text-xs font-black mb-4 uppercase tracking-widest">
              <Trophy size={14} className="text-[#0F7A60]" />
              Classement & Statistiques
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Performances <span className="text-[#0F7A60]">Closer</span>
            </h1>
            <p className="text-gray-500 font-medium mt-3 max-w-2xl text-lg">
              Décortiquez vos taux de conversion, suivez vos pics d'appels et surpassez vos objectifs pour débloquer de nouveaux vendeurs.
            </p>
          </div>
          
          <div className="flex-shrink-0 mt-4 md:mt-0 relative z-20 flex gap-2">
            {['7d', '30d', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border ${
                  timeRange === range 
                  ? 'bg-[#0F7A60] text-white border-[#0F7A60] ring-4 ring-[#0F7A60]/10' 
                  : 'bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 border-gray-200/60'
                }`}
              >
                {range === '7d' ? '7 Jours' : range === '30d' ? '30 Jours' : 'Global'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 relative z-20 space-y-6">
        
        {/* === CORE METRICS ROW === */}
        <motion.div 
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Taux de conversion */}
          <motion.div variants={itemVars} className="bg-gradient-to-br from-[#0F7A60] to-teal-800 p-6 sm:p-8 rounded-[2rem] text-white relative overflow-hidden shadow-lg group">
             <div className="absolute right-[-10%] top-[-10%] w-[60%] h-[120%] bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
             <Target className="absolute top-6 right-6 text-white/20 w-24 h-24 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none" />
             
             <div className="relative z-10 flex flex-col h-full justify-between gap-6">
               <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                 <Percent size={24} className="text-white" />
               </div>
               <div>
                 <p className="text-white/60 font-black tracking-widest text-xs uppercase mb-1">Taux de Conversion Actif</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black">{stats.conversionRate}<span className="text-2xl opacity-50">%</span></h3>
                 </div>
               </div>
             </div>
          </motion.div>

             {/* Volume d'appels traité */}
             <motion.div variants={itemVars} className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative group hover:border-[#0F7A60]/30 transition-colors">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0F7A60] flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
                 <PhoneCall size={24} />
               </div>
               <div>
                 <p className="text-gray-400 font-black tracking-widest text-xs uppercase mb-1">Total Leads Traités</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black text-gray-900">{stats.totalLeads}</h3>
                   <span className="text-sm font-bold text-gray-400">cibles</span>
                 </div>
               </div>
             </motion.div>

             {/* Réussite (Won) */}
             <motion.div variants={itemVars} className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative group hover:border-[#0F7A60]/30 transition-colors">
               <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center mb-6 border border-[#C9A84C]/20 group-hover:scale-110 transition-transform">
                 <Trophy size={24} />
               </div>
               <div>
                 <p className="text-gray-400 font-black tracking-widest text-xs uppercase mb-1">Ventes Conclues (Win)</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black text-gray-900">{stats.wonLeads}</h3>
                   <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
                 </div>
               </div>
             </motion.div>

             {/* Échecs (Lost) */}
             <motion.div variants={itemVars} className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative group hover:border-red-500/30 transition-colors">
               <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 group-hover:scale-110 transition-transform">
                 <Flame size={24} />
               </div>
               <div>
                 <p className="text-gray-400 font-black tracking-widest text-xs uppercase mb-1">Passés en Échec</p>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black text-gray-900">{stats.lostLeads}</h3>
                 </div>
               </div>
             </motion.div>
        </motion.div>

        {/* === CHARTS ROW === */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Area Chart */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[450px]">
             <div className="flex items-start justify-between mb-8">
               <div>
                 <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                   <BarChart3 className="text-[#0F7A60]" size={20} /> Évolution des Ventes
                 </h3>
                 <p className="text-[12px] font-medium text-gray-500 mt-1">Conversions journalières par rapport au volume total pris en charge.</p>
               </div>
             </div>
             
             <div className="flex-1 w-full relative min-h-0">
               {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#0F7A60" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#0F7A60" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.5}/>
                         <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.1}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                       dy={10}
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                       cursor={{ stroke: '#0F7A60', strokeWidth: 1, strokeDasharray: '4 4' }}
                     />
                     <Area type="monotone" dataKey="total" name="Pris en charge" stroke="#d1d5db" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                     <Area type="monotone" dataKey="won" name="Ventes (Win)" stroke="#0F7A60" strokeWidth={3} fillOpacity={1} fill="url(#colorWon)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0F7A60' }} />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                    <BarChart3 size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">Pas assez de données pour afficher le graphe.</p>
                 </div>
               )}
             </div>
          </div>

          {/* Leaderboard & Gamification Spotlight */}
          <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 border border-[#2A2A2A] shadow-xl text-white relative overflow-hidden flex flex-col h-[450px]">
             {/* Decorative glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-[80px]" />
             
             <div className="relative z-10 flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]">
                 <Star size={20} fill="currentColor" />
               </div>
               <h3 className="text-xl font-black">Niveau & Avantages</h3>
             </div>

             <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
               <div className="w-32 h-32 rounded-full border-4 border-[#C9A84C]/30 flex items-center justify-center relative mb-4 shadow-[0_0_40px_rgba(201,168,76,0.15)]">
                 <div className="absolute inset-0 rounded-full border-4 border-[#C9A84C] border-t-transparent animate-spin duration-3000 opacity-60"></div>
                 <div className="flex flex-col items-center">
                   <span className="text-4xl">🚀</span>
                 </div>
               </div>
               
               <h4 className="text-2xl font-black mb-2">Closer Junior</h4>
               <p className="text-sm font-medium text-gray-400 px-6">
                 Vous êtes à <span className="text-[#C9A84C] font-bold">15 Ventes</span> de débloquer le rang **Closer Expert**, qui vous donnera accès aux boutiques certifiées avec des commissions augmentées de +50%.
               </p>
             </div>

             <button className="w-full relative z-10 mt-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-colors">
               Voir mes avantages →
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
