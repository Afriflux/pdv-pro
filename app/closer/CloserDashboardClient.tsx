'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, Users, DollarSign, Award, PhoneCall, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CloserDashboardClientProps {
  user: any;
  activeLeads: any[];
  totalCommissions: number;
  totalResolved: number;
  winRate: number;
  pipelineValue: number;
}

const mockChartData = [
  { name: 'Lun', gains: 12000 },
  { name: 'Mar', gains: 19000 },
  { name: 'Mer', gains: 15000 },
  { name: 'Jeu', gains: 28000 },
  { name: 'Ven', gains: 22000 },
  { name: 'Sam', gains: 35000 },
  { name: 'Dim', gains: 42000 },
];

export default function CloserDashboardClient({
  user,
  activeLeads,
  totalCommissions,
  totalResolved,
  winRate,
  pipelineValue
}: CloserDashboardClientProps) {

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="w-full relative min-h-screen bg-[#FAFAF7] pb-24 font-sans overflow-hidden">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0F7A60]/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#0F7A60]/10 blur-[120px] pointer-events-none" />

      {/* HERO SECTION */}
      <div className="pt-12 pb-12 px-4 sm:px-8 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#0F7A60]/20 text-[#0F7A60] text-xs font-black mb-4 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F7A60] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F7A60]"></span>
              </span>
              Mode Closer Activé
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Salut, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F7A60] to-teal-400">{user?.user_metadata?.first_name || 'Closer'}</span> 👋
            </h1>
            <p className="text-gray-500 font-medium mt-3 max-w-xl leading-relaxed">
              Voici votre impact direct sur les ventes. Continuez à convertir vos leads et observez vos commissions grimper en temps réel.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-shrink-0"
          >
             <button className="bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-[#0F7A60]/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 group">
               <TrendingUp size={18} className="group-hover:rotate-12 transition-transform" /> Rapport Détaillé
             </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 relative z-20">
        
        {/* KPI CARDS STAGGERED */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 w-full"
        >
          {/* Card 1 */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-xl hover:border-[#0F7A60]/30 transition-all duration-300 hover:-translate-y-1 cursor-default">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#0F7A60]/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-gray-500 font-bold tracking-tight">Commissions</span>
              <div className="bg-emerald-50 text-[#0F7A60] p-2.5 rounded-2xl group-hover:bg-[#0F7A60] group-hover:text-white transition-colors duration-300">
                <DollarSign size={20} />
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none mb-2 z-10 relative">
              {totalCommissions.toLocaleString('fr-FR')} <span className="text-lg text-gray-400 font-bold">FCFA</span>
            </h2>
            <p className="text-xs text-[#0F7A60] font-bold flex items-center gap-1.5 mt-4 z-10 relative bg-emerald-50 inline-flex px-2 py-1 rounded-md">
              <TrendingUp size={14} /> Gain validé
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 cursor-default">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-gray-500 font-bold tracking-tight">Leads Actifs</span>
              <div className="bg-amber-50 text-amber-500 p-2.5 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                <Users size={20} />
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none mb-2 z-10 relative">
              {activeLeads.length}
            </h2>
            <p className="text-xs text-amber-600 font-bold flex items-center gap-1.5 mt-4 z-10 relative bg-amber-50 inline-flex px-2 py-1 rounded-md">
               <Target size={14} /> ~{Math.round(pipelineValue).toLocaleString('fr-FR')} FCFA potent.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 cursor-default">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-gray-500 font-bold tracking-tight">Appels Prévus</span>
              <div className="bg-blue-50 text-blue-500 p-2.5 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                <PhoneCall size={20} />
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none mb-2 z-10 relative">
              {activeLeads.length}
            </h2>
            <p className="text-xs text-blue-600 font-bold flex items-center gap-1.5 mt-4 z-10 relative line-clamp-1 bg-blue-50 inline-flex px-2 py-1 rounded-md">
               {activeLeads.length > 0 ? `${activeLeads[0].name} prochainement` : 'Aucun appel'}
            </p>
          </motion.div>

          {/* Card 4 - Gamified */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#0F7A60] to-teal-800 rounded-[2rem] p-6 border border-teal-700 shadow-[0_8px_30px_rgba(15,122,96,0.2)] relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-700 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-emerald-100 font-bold tracking-tight">Taux de Closing</span>
              <div className="bg-white/20 text-white backdrop-blur-md p-2.5 rounded-2xl">
                <Award size={20} />
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-none mb-2 relative z-10">
              {winRate}%
            </h2>
            <p className="text-xs text-emerald-100 font-bold flex items-center gap-1.5 mt-4 relative z-10 bg-black/10 inline-flex px-2 py-1 rounded-md backdrop-blur-sm">
               <Award size={14} /> Sur {totalResolved} lead(s) traité(s)
            </p>
          </motion.div>
        </motion.div>

        {/* GRAPHS AND ACTIVITY */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          
          {/* Main Chart Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-[2] bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col min-h-[450px] relative overflow-hidden"
          >
            <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Performance Hebdomadaire</h3>
                <p className="text-gray-500 font-medium text-sm mt-1">Vos gains générés sur les 7 derniers jours.</p>
              </div>
              <div className="flex gap-2">
                {['Mois', 'Semaine'].map((t, i) => (
                  <button key={t} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${i === 1 ? 'bg-[#0F7A60] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 w-full h-full min-h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7A60" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0F7A60" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    itemStyle={{ color: '#0F7A60', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Gains']}
                  />
                  <Area type="monotone" dataKey="gains" stroke="#0F7A60" strokeWidth={4} fillOpacity={1} fill="url(#colorGains)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0F7A60' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Activity / CRM Mini */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex-1 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900">Leads Prioritaires</h3>
              <button aria-label="Plus d'options" className="text-[#0F7A60] hover:bg-emerald-50 p-2 rounded-xl transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
               {activeLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Target size={32} className="text-gray-300 mb-3" />
                    <p className="text-gray-600 font-bold text-sm">Votre pipeline est vide</p>
                    <p className="text-gray-400 text-xs mt-1">Allez sur le terminal pour récupérer des leads.</p>
                  </div>
               ) : (
                  activeLeads.slice(0, 4).map((lead, index) => (
                    <div key={lead.id} className={`group relative overflow-hidden border rounded-[1.5rem] p-5 cursor-pointer transition-all duration-300 ${index === 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200/50 hover:shadow-md hover:-translate-y-0.5' : 'bg-white border-gray-100 hover:border-[#0F7A60]/30 hover:shadow-md hover:-translate-y-0.5'}`}>
                      {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />}
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${index === 0 ? 'text-amber-700 bg-amber-200/50' : 'text-gray-500 bg-gray-100'}`}>
                          {index === 0 ? '🔥 Chaud' : 'En cours'}
                        </span>
                        <div className={`p-1.5 rounded-lg ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-[#0F7A60]'} transition-colors`}>
                          <PhoneCall size={14} />
                        </div>
                      </div>
                      <h4 className="font-black text-gray-900 text-base mb-1">{lead.name}</h4>
                      <p className={`text-xs font-medium line-clamp-1 ${index === 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                        Intéressé par: {lead.Product?.name || lead.source}
                      </p>
                    </div>
                  ))
               )}
            </div>
            
            {activeLeads.length > 0 && (
              <button className="w-full mt-6 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                Voir tous les leads
              </button>
            )}
          </motion.div>
          
        </div>
      </div>
    </div>
  )
}
