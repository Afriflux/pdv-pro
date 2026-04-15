"use client"

import { useState } from 'react'
import { Target, Search, Filter, TrendingUp, Store, Inbox, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface CloserTargetsClientProps {
  stores: any[];
}

export default function CloserTargetsClient({ stores: initialStores }: CloserTargetsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'partners'>('all')

  const filteredStores = initialStores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVars: any = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="w-full relative min-h-screen bg-[#FAFAF7] font-sans pb-24 overflow-hidden">
      
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-0 left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-br from-[#0F7A60]/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-[-10%] w-[40vw] h-[40vw] bg-gradient-to-tl from-emerald-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER PREMIUM */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full pt-12 pb-8 px-4 sm:px-8 md:px-12 relative z-10"
      >
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm text-gray-500 text-xs font-black mb-4">
              <Target size={14} className="text-[#0F7A60]" />
              Réseau de Partenariat
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Trouvez vos <span className="text-[#0F7A60]">cibles</span>
            </h1>
            <p className="text-gray-500 font-medium mt-3 max-w-2xl text-lg">
               Explorez les vendeurs ouvrant leur système aux closers. Analysez les opportunités, les paniers abandonnés et vos futures commissions.
            </p>
          </div>
          
          <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-4 md:mt-0 text-sm font-bold">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'all' ? 'bg-[#0F7A60] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Tous les Vendeurs
            </button>
            <button 
              onClick={() => setActiveTab('partners')}
              className={`px-5 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'partners' ? 'bg-[#0F7A60] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Mes Partenaires
            </button>
          </div>
        </div>
      </motion.div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 relative z-20 pb-20">
         
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white/70 backdrop-blur-xl p-2.5 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex items-center justify-between gap-4 mb-10 sticky top-4 z-30"
         >
            <div className="relative flex-1 group">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F7A60] transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher une boutique..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-14 pr-4 py-3.5 text-base font-bold text-gray-900 focus:outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="h-10 w-px bg-gray-200/50 hidden sm:block"></div>
            <button className="hidden sm:flex items-center gap-2 px-6 py-3.5 text-gray-600 font-black text-sm hover:bg-white rounded-[1.5rem] transition-all hover:shadow-sm">
              <Filter size={18} /> Par commission
            </button>
         </motion.div>

         {/* GRILLE DES VENDEURS */}
         <motion.div 
           variants={containerVars}
           initial="hidden"
           animate="show"
           className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
         >
           <AnimatePresence>
             {filteredStores.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-sm rounded-[3rem] border border-white border-dashed"
               >
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                   <Target size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">Aucun Vendeur Trouvé</h3>
                 <p className="text-gray-500 font-medium max-w-md">Réessayez avec un autre mot flou, ou revenez plus tard quand de nouveaux vendeurs activeront le programme.</p>
               </motion.div>
             ) : (
               filteredStores.map(store => (
                  <motion.div 
                    variants={itemVars}
                    layout
                    key={store.id} 
                    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(15,122,96,0.12)] hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between overflow-hidden relative"
                  >
                     {/* Éclat émeraude au survol */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                     <div>
                       <div className="flex items-start justify-between mb-6 relative z-10">
                         <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl text-[#0F7A60] border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {store.name.charAt(0).toUpperCase()}
                         </div>
                         <div className="text-right">
                           <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 rounded-xl text-xs font-black border border-emerald-100/50 shadow-sm group-hover:shadow-md transition-all">
                              <TrendingUp size={14} /> {(store.closer_margin! * 100).toFixed(0)}%
                           </div>
                           <p className="text-xs uppercase font-black text-gray-400 tracking-widest mt-1.5">Comm. Globale</p>
                         </div>
                       </div>
                       
                       <h2 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-[#0F7A60] transition-colors relative z-10 leading-tight">{store.name}</h2>
                       <p className="text-sm text-gray-500 mb-8 line-clamp-2 relative z-10 font-medium">Boutique e-commerce proposant {store._count.products} produits certifiés sur le réseau Yayyam.</p>
                       
                       {/* STATS */}
                       <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
                         <div className="bg-[#FAFAF7] group-hover:bg-emerald-50/50 transition-colors p-4 rounded-[1.5rem] border border-gray-100/80 group-hover:border-emerald-100/50">
                           <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                             <Inbox size={14} className="text-emerald-500" />
                             <span className="text-xs font-black uppercase tracking-wider">Leads Frais</span>
                           </div>
                           <p className="text-3xl font-black text-gray-900">{store.newLeadsCount}</p>
                         </div>
                         <div className="bg-[#FAFAF7] group-hover:bg-emerald-50/50 transition-colors p-4 rounded-[1.5rem] border border-gray-100/80 group-hover:border-emerald-100/50">
                           <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                             <Store size={14} className="text-[#0F7A60]" />
                             <span className="text-xs font-black uppercase tracking-wider">Produits Actifs</span>
                           </div>
                           <p className="text-3xl font-black text-gray-900">{store._count.products}</p>
                         </div>
                       </div>
                     </div>
                     
                     <Link href="/closer/terminal" className="relative z-10 w-full py-4 bg-[#0F7A60] text-white hover:bg-[#0D5C4A] rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-xl hover:shadow-[#0F7A60]/20 group/btn">
                        Sécuriser les Leads <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                     </Link>
                  </motion.div>
               ))
             )}
           </AnimatePresence>
         </motion.div>
      </div>
    </div>
  )
}
