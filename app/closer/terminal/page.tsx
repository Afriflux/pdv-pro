"use client"

import { useState, useEffect } from 'react'
import { PhoneCall, Inbox, CheckCircle2, XOctagon, Search, Star, Target, LayoutGrid, List, Loader2, Sparkles, TrendingUp, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTerminalLeads, claimLead, updateLeadStatus, LeadStatusType } from './actions'

export default function TerminalPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    const res = await getTerminalLeads()
    if (res.success) {
      setLeads(res.leads || [])
    }
    setLoading(false)
  }

  const handleClaim = async (leadId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'contacted' } : l))
    const res = await claimLead(leadId)
    if (!res.success) {
      alert(res.error)
      fetchLeads() 
    }
  }

  const handleStatusChange = async (leadId: string, status: LeadStatusType) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
    const res = await updateLeadStatus(leadId, status)
    if (!res.success) {
      alert(res.error)
      fetchLeads()
    }
  }

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatusType) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-emerald-50/50', 'border-emerald-200', 'scale-[1.02]')
    if (!draggedLeadId) return
    
    const lead = leads.find(l => l.id === draggedLeadId)
    if (!lead) return

    if (lead.status === 'new' && targetStatus === 'contacted') {
       handleClaim(draggedLeadId)
    } else if (lead.status === 'contacted') {
       if (targetStatus === 'won' || targetStatus === 'lost') {
         handleStatusChange(draggedLeadId, targetStatus)
       }
    }
    setDraggedLeadId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    if (draggedLeadId) {
      target.classList.add('bg-emerald-50/50', 'border-emerald-200', 'scale-[1.02]')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('bg-emerald-50/50', 'border-emerald-200', 'scale-[1.02]')
  }

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.phone && l.phone.includes(searchQuery))
  )

  const newLeads = filteredLeads.filter(l => l.status === 'new')
  const activeLeads = filteredLeads.filter(l => l.status === 'contacted' || l.status === 'qualified')
  const wonLeads = filteredLeads.filter(l => l.status === 'won')
  const lostLeads = filteredLeads.filter(l => l.status === 'lost')

  // Animations
  const containerVars: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVars: any = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  if (loading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF7]">
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
           <Loader2 className="text-[#0F7A60]" size={40}/>
         </motion.div>
         <p className="mt-4 text-emerald-800 font-bold tracking-widest text-sm uppercase">Chargement du Terminal...</p>
       </div>
     )
  }

  return (
    <div className="w-full relative min-h-screen bg-[#FAFAF7] overflow-hidden font-sans pb-10">
      
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0F7A60]/5 to-transparent pointer-events-none" />
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#0F7A60]/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* HEADER PREMIUM */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full pt-12 pb-8 px-4 sm:px-8 md:px-12 relative z-10"
      >
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm text-gray-500 text-xs font-black mb-4">
              <Sparkles size={14} className="text-amber-500" />
              Interface CRM Intelligente
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Terminal de Vente
            </h1>
            <p className="text-gray-500 font-medium mt-3 max-w-xl text-lg">
              Saisissez les opportunités. Glissez, appelez, et <span className="font-bold text-[#0F7A60]">closez.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
            {/* SEARCH */}
            <div className="relative w-full sm:w-72 group">
               <div className="absolute inset-0 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgb(15,122,96,0.08)] transition-all pointer-events-none border border-gray-100 group-hover:border-[#0F7A60]/30" />
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F7A60] transition-colors" />
               <input 
                 type="text" 
                 placeholder="Rechercher (Nom, Tel)..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-11 pr-4 py-3.5 text-sm font-bold bg-transparent text-gray-900 border-none focus:outline-none focus:ring-0 placeholder:text-gray-400 relative z-10"
               />
               {searchQuery && (
                 <button title="Effacer la recherche" aria-label="Effacer la recherche" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-gray-100 rounded-full p-1">
                   <XOctagon size={12} />
                 </button>
               )}
            </div>

            {/* TOGGLE VIEW */}
            <div className="flex p-1.5 bg-white border border-gray-100 rounded-2xl shrink-0 shadow-sm relative z-10">
              <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-[#0F7A60] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <LayoutGrid size={16} /> <span className="hidden sm:inline">Kanban</span>
              </button>
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-[#0F7A60] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <List size={16} /> <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 relative z-20 flex flex-col flex-1 h-full min-h-[60vh]">

      {viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-12 snap-x scrollbar-hide items-start flex-1 h-full px-2 pt-2">
          
          {/* COLONNE NEW */}
          <div className="w-[350px] shrink-0 flex flex-col snap-start bg-white/70 backdrop-blur-xl rounded-[2rem] p-5 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full min-h-[600px]">
             <div className="flex items-center justify-between mb-6 px-1">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                   <Target size={20} />
                 </div>
                 <h3 className="font-black text-gray-900 tracking-tight text-lg">Leads Frais</h3>
               </div>
               <span className="bg-emerald-50 border border-emerald-100 text-[#0F7A60] px-3 py-1 rounded-lg text-sm font-black shadow-sm">{newLeads.length}</span>
             </div>
             <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-4 overflow-y-auto pr-2 pb-4 -mr-2">
               {newLeads.length === 0 ? (
                 <div className="text-center p-8 text-gray-400 text-sm font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
                   <Inbox size={32} className="mb-3 text-gray-300" />
                   Aucune nouvelle opportunité
                 </div>
               ) : (
                newLeads.map(lead => (
                  <motion.div 
                    variants={itemVars}
                    key={lead.id} 
                    draggable
                    onDragStart={() => setDraggedLeadId(lead.id)}
                    className="bg-white border border-gray-100 rounded-[1.5rem] p-5 hover:shadow-xl hover:shadow-[#0F7A60]/5 hover:border-[#0F7A60]/30 transition-all duration-300 cursor-grab active:cursor-grabbing group relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex items-start justify-between mb-4 relative z-10">
                       <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50 inline-flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> {lead.source}
                       </span>
                     </div>
                     <h4 className="font-black text-gray-900 mb-1.5 text-lg leading-tight relative z-10">{lead.name}</h4>
                     <p className="text-xs text-gray-500 mb-5 font-bold flex items-center gap-1.5 relative z-10 line-clamp-1">
                       <BoxIcon /> {lead.Product?.name || 'Produit non spécifié'}
                     </p>
                     <button onClick={() => handleClaim(lead.id)} className="relative z-10 w-full py-3 bg-gray-50 hover:bg-[#0F7A60] text-gray-700 hover:text-white text-[13px] font-black rounded-xl transition-all duration-300 group-hover:shadow-md flex items-center justify-center gap-2 border border-gray-100 hover:border-transparent">
                        <CheckCircle2 size={16} /> Réserver le Lead
                     </button>
                  </motion.div>
                ))
               )}
             </motion.div>
          </div>

          {/* COLONNE CONTACTED */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'contacted')}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className="w-[350px] shrink-0 flex flex-col snap-start bg-white/70 backdrop-blur-xl rounded-[2rem] p-5 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 h-full min-h-[600px] border-dashed hover:border-solid hover:border-amber-200"
          >
             <div className="flex items-center justify-between mb-6 px-1 pointer-events-none">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
                   <PhoneCall size={18} />
                 </div>
                 <h3 className="font-black text-gray-900 tracking-tight text-lg">En Négociation</h3>
               </div>
               <span className="bg-amber-50 border border-amber-100 text-amber-600 px-3 py-1 rounded-lg text-sm font-black shadow-sm">{activeLeads.length}</span>
             </div>
             
             <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-4 overflow-y-auto pr-2 pb-4 -mr-2 pointer-events-none">
               {activeLeads.length === 0 ? (
                 <div className="text-center p-8 text-gray-400 text-sm font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">Glissez une carte ici.</div>
               ) : (
                activeLeads.map(lead => (
                  <motion.div 
                    variants={itemVars}
                    key={lead.id} 
                    draggable
                    onDragStart={() => setDraggedLeadId(lead.id)}
                    className="bg-white border-[1.5px] border-[#0F7A60] rounded-[1.5rem] p-5 shadow-[0_8px_20px_rgb(15,122,96,0.08)] cursor-grab active:cursor-grabbing relative pointer-events-auto hover:-translate-y-1 transition-transform duration-300"
                  >
                     <div className="absolute top-0 right-0 w-2 h-full bg-[#0F7A60]" />
                     <h4 className="font-black text-gray-900 mb-1 text-lg leading-tight pr-4">{lead.name}</h4>
                     <p className="text-xs text-gray-500 mb-4 font-bold line-clamp-1">{lead.Product?.name || 'Produit'}</p>
                     
                     <div className="bg-[#FAFAF7] p-3 rounded-xl mb-5 border border-gray-100 flex items-center justify-between group-hover:bg-emerald-50/30 transition-colors">
                       <p className="text-sm text-gray-900 font-black tracking-widest truncate mr-2">{lead.phone}</p>
                       <div className="flex items-center gap-2 shrink-0">
                         <a suppressHydrationWarning href={`https://wa.me/${(lead.phone || '').replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Bonjour ${lead.name}, je vous contacte concernant votre commande sur Yayyam.`)}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${lead.name}`} className="w-9 h-9 flex items-center justify-center bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] rounded-xl shadow-sm hover:shadow-md hover:bg-[#25D366] hover:text-white transition-all">
                           <MessageCircle size={16} />
                         </a>
                         <a suppressHydrationWarning href={`tel:${lead.phone}`} aria-label={`Appeler le client ${lead.name} au ${lead.phone}`} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-[#0F7A60] rounded-xl shadow-sm hover:shadow-md hover:bg-[#0F7A60] hover:text-white transition-all">
                           <PhoneCall size={16} />
                         </a>
                       </div>
                     </div>
                     
                     <div className="flex gap-2.5">
                       <button onClick={() => handleStatusChange(lead.id, 'won')} className="flex-1 py-3 bg-[#0F7A60] hover:bg-[#0D5C4A] shadow-md shadow-[#0F7A60]/20 text-white text-[12px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all">
                         <Star size={14} className="fill-white/20"/> Clos
                       </button>
                       <button onClick={() => handleStatusChange(lead.id, 'lost')} className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all">
                         <XOctagon size={14}/> Lâcher
                       </button>
                     </div>
                  </motion.div>
                ))
               )}
             </motion.div>
          </div>

          {/* COLONNE WON */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'won')}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className="w-[350px] shrink-0 flex flex-col snap-start bg-white/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white transition-all shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-full min-h-[600px] hover:bg-white/60"
          >
             <div className="flex items-center justify-between mb-6 px-1 pointer-events-none opacity-80">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                   <Star size={18} className="fill-emerald-600" />
                 </div>
                 <h3 className="font-black text-gray-900 tracking-tight text-lg">Gagnés</h3>
               </div>
               <span className="bg-white text-emerald-700 px-3 py-1 rounded-lg text-sm font-black shadow-sm">{wonLeads.length}</span>
             </div>
             
             <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-3 overflow-y-auto pr-2 pb-4 -mr-2 pointer-events-auto">
               {wonLeads.map(lead => (
                 <motion.div variants={itemVars} key={lead.id} className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                   <h4 className="font-black text-gray-900 mb-1 line-clamp-1 relative z-10 text-[15px]">{lead.name}</h4>
                   <p className="text-xs uppercase font-black text-emerald-600 relative z-10 flex items-center gap-1 mt-2">
                     <TrendingUp size={12} /> {lead.commission_amount ? `${lead.commission_amount} FCFA` : 'Non défini'}
                   </p>
                 </motion.div>
               ))}
             </motion.div>
          </div>

          {/* COLONNE LOST */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'lost')}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className="w-[350px] shrink-0 flex flex-col snap-start bg-white/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white transition-all shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-full min-h-[600px] hover:bg-white/60 opacity-80 hover:opacity-100"
          >
             <div className="flex items-center justify-between mb-6 px-1 pointer-events-none">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                   <XOctagon size={18} />
                 </div>
                 <h3 className="font-black text-gray-900 tracking-tight text-lg">Perdus</h3>
               </div>
               <span className="bg-white text-red-700 px-3 py-1 rounded-lg text-sm font-black shadow-sm">{lostLeads.length}</span>
             </div>
             
             <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-3 overflow-y-auto pr-2 pb-4 -mr-2 pointer-events-auto">
               {lostLeads.map(lead => (
                 <motion.div variants={itemVars} key={lead.id} className="bg-red-50/40 border border-red-100/60 rounded-2xl p-4 shadow-sm grayscale-[0.5]">
                   <h4 className="font-bold text-gray-700 mb-1 line-clamp-1 text-sm">{lead.name}</h4>
                   <p className="text-xs text-gray-400 font-bold">Abandonné</p>
                 </motion.div>
               ))}
             </motion.div>
          </div>

        </div>
      ) : (
        /* VUE LISTE PREMIUM */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col"
        >
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#FAFAF7]/80 border-b border-gray-100 text-xs uppercase font-black tracking-widest text-gray-400">
                  <th className="px-8 py-5">Client</th>
                  <th className="px-8 py-5">Détails</th>
                  <th className="px-8 py-5 text-center">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                <AnimatePresence>
                  {filteredLeads.length === 0 && (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan={4} className="p-12 text-center text-gray-400 font-medium">
                        <div className="flex flex-col items-center justify-center">
                          <Search size={32} className="text-gray-300 mb-3" />
                          Aucun résultat trouvé pour "<span className="text-gray-900 font-bold">{searchQuery}</span>"
                        </div>
                      </td>
                    </motion.tr>
                  )}
                  {filteredLeads.map(lead => (
                    <motion.tr 
                      key={lead.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-[#0F7A60] font-black text-sm shrink-0 border border-emerald-200/50">
                             {lead.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <span className="font-black text-gray-900 text-base flex items-center gap-2">{lead.name}</span>
                             <span className="text-xs text-gray-500 font-black font-mono tracking-wider mt-0.5 block">{lead.phone}</span>
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-[13px]">{lead.Product?.name || 'Inconnu'}</span>
                          <span className="text-xs uppercase font-black tracking-widest text-[#0F7A60] bg-emerald-50 px-2 py-0.5 rounded-md self-start mt-1">Source: {lead.source}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        {lead.status === 'new' && <span className="inline-block text-xs font-black uppercase tracking-wider text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">Nouveau</span>}
                        {lead.status === 'contacted' && <span className="inline-block text-xs font-black uppercase tracking-wider text-amber-700 bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-amber-500"/>En Négociation</span>}
                        {lead.status === 'won' && <span className="inline-block text-xs font-black uppercase tracking-wider text-emerald-700 bg-gradient-to-r from-emerald-100 to-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm"><Star size={10} className="inline mr-1 -mt-0.5 fill-emerald-700"/>Gagné</span>}
                        {lead.status === 'lost' && <span className="inline-block text-xs font-black uppercase tracking-wider text-red-600 bg-red-50/80 px-3 py-1.5 rounded-lg border border-red-100">Perdu</span>}
                      </td>
                      <td className="px-8 py-5 flex justify-end gap-2 text-xs h-full items-center">
                        {lead.status === 'new' && (
                          <button onClick={() => handleClaim(lead.id)} className="px-5 py-2.5 bg-[#0F7A60] text-white hover:bg-[#0D5C4A] rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">Réserver</button>
                        )}
                        {(lead.status === 'contacted' || lead.status === 'qualified') && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleStatusChange(lead.id, 'won')} className="px-4 py-2.5 bg-[#0F7A60] shadow-md hover:bg-[#0D5C4A] text-white hover:shadow-xl rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center gap-1"><CheckCircle2 size={14}/> Clos</button>
                            <button onClick={() => handleStatusChange(lead.id, 'lost')} className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 rounded-xl font-bold transition-all shadow-sm">Lâcher</button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  )
}

function BoxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  )
}
