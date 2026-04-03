"use client"

import { useState } from 'react'
import { PhoneCall, Calendar, Search, Filter, MessageCircle, Target, Inbox, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CloserCallsClientProps {
  activeLeads: any[];
}

export default function CloserCallsClient({ activeLeads: initialLeads }: CloserCallsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [leads] = useState(initialLeads)

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.phone && l.phone.includes(searchQuery))
  )

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="w-full relative min-h-screen bg-[#FAFAF7] font-sans pb-20 overflow-hidden">
      
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#0F7A60]/10 blur-[150px] pointer-events-none" />

      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full pt-12 pb-10 px-4 sm:px-8 md:px-12 relative z-10"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm text-gray-500 text-xs font-black mb-4">
              <PhoneCall size={14} className="text-amber-500" />
              Carnet d'Appels Actifs
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Appels & Relances
            </h1>
            <p className="text-gray-500 font-medium mt-3 max-w-xl text-lg">
               Votre carnet de prospection en cours. Relancez-les pour fermer vos ventes.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0 relative z-20">
             <div className="relative w-full sm:w-72 group">
               <div className="absolute inset-0 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all pointer-events-none border border-gray-100 group-hover:border-[#0F7A60]/30" />
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F7A60] transition-colors" />
               <input 
                 type="text" 
                 placeholder="Chercher (nom, numéro)..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-11 pr-4 py-3.5 text-sm font-bold bg-transparent text-gray-900 border-none focus:outline-none focus:ring-0 placeholder:text-gray-400 relative z-10"
               />
             </div>
             <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-100 hover:border-gray-200 text-gray-700 hover:text-gray-900 rounded-2xl text-sm font-bold transition-all shadow-sm">
                <Filter size={16} /> <span className="hidden sm:inline">Filtres</span>
             </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 md:px-12 relative z-20">
         <motion.div 
           variants={containerVars}
           initial="hidden"
           animate="show"
           className="grid grid-cols-1 gap-4"
         >
           <AnimatePresence>
             {filteredLeads.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white p-16 flex flex-col items-center justify-center text-center shadow-sm"
               >
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6 border border-gray-100 shadow-inner">
                    <Inbox size={48} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Aucun appel en attente</h2>
                  <p className="text-base text-gray-500 max-w-sm">Réservez de nouveaux clients depuis votre Terminal de Vente pour remplir votre carnet d'appels.</p>
               </motion.div>
             ) : (
               filteredLeads.map((lead) => (
                 <motion.div 
                   variants={itemVars}
                   layout
                   key={lead.id} 
                   className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(15,122,96,0.08)] hover:border-[#0F7A60]/20 transition-all duration-300 group relative overflow-hidden"
                 >
                   
                   {/* priority indicator line */}
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
  
                   <div className="flex items-start lg:items-center gap-6 pl-2 lg:w-1/3">
                     <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-xl font-black text-amber-600 border border-amber-100/50 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                       {lead.name.substring(0, 2).toUpperCase()}
                     </div>
                     
                     <div>
                       <div className="flex items-center gap-2 mb-1.5">
                         <h3 className="text-xl font-black text-gray-900 group-hover:text-[#0F7A60] transition-colors line-clamp-1">{lead.name}</h3>
                       </div>
                       <div className="flex flex-col gap-1.5 text-xs font-medium text-gray-500">
                         <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400"/> Reçu le {new Date(lead.created_at || new Date()).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1.5"><Target size={14} className="text-gray-400"/> Domicilié: {lead.city || 'Inconnu'}</span>
                       </div>
                     </div>
                   </div>
  
                   <div className="flex flex-col lg:items-center justify-center lg:w-1/3 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                     <div className="text-sm font-bold text-gray-700 mb-1.5 text-center flex items-center gap-2 justify-center">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       {lead.Product?.name || 'Produit inconnu'}
                     </div>
                     <div className="text-xs font-black text-emerald-600 uppercase tracking-widest text-center">
                       Valeur: {lead.Product?.price ? `${lead.Product.price.toLocaleString()} FCFA` : 'N/A'}
                     </div>
                   </div>
  
                   <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-1/3 pt-4 border-t border-gray-100 lg:border-t-0 lg:pt-0">
                      <a href={`tel:${lead.phone}`} title="Appeler" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 hover:border-[#0F7A60] hover:bg-[#0F7A60] text-gray-700 hover:text-white rounded-xl font-black transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        <PhoneCall size={18} /> <span className="lg:hidden xl:inline">Appeler</span>
                      </a>
                      <a href={`https://wa.me/${lead.phone}?text=Bonjour ${lead.name},`} target="_blank" rel="noreferrer" title="Message WhatsApp" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-xl font-black transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        <MessageCircle size={18} /> <span className="lg:hidden xl:inline">WhatsApp</span>
                      </a>
                      
                      <button className="flex-none p-4 text-gray-400 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all border border-gray-100 hover:border-amber-200 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md" title="Rappeler plus tard">
                        <Clock size={18} />
                      </button>
                   </div>
                   
                 </motion.div>
               ))
             )}
           </AnimatePresence>
         </motion.div>
      </div>
    </div>
  )
}
