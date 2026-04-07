'use client'

import React, { useState } from 'react'
import { LifeBuoy, AlertCircle, CheckCircle, Clock, Search, MessageSquare, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { updateTicketStatusAction } from './actions'
import Link from 'next/link'

interface Ticket {
  id: string
  order_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  subject: string
  message: string
  status: string
  created_at: Date
}

interface Props {
  tickets: Ticket[]
}

export default function HelpdeskControls({ tickets }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED'>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const openTickets = tickets.filter(t => t.status === 'OPEN').length
  const processingTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const closedTickets = tickets.filter(t => t.status === 'CLOSED').length

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'ALL' && t.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return t.customer_name.toLowerCase().includes(s) || 
             t.subject.toLowerCase().includes(s) || 
             (t.order_id && t.order_id.toLowerCase().includes(s))
    }
    return true
  })

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    await updateTicketStatusAction(id, newStatus)
    setUpdatingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-md text-xs font-black uppercase tracking-wider"><AlertCircle size={12}/> Nouveau</span>
      case 'IN_PROGRESS':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md text-xs font-black uppercase tracking-wider"><Clock size={12}/> En cours</span>
      case 'CLOSED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-black uppercase tracking-wider"><CheckCircle size={12}/> Résolu</span>
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      
      {/* HEADER DE PRESENTATION */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-indigo-50 shrink-0">
              <LifeBuoy size={32} className="text-indigo-500 max-w-full drop-shadow-sm" />
           </div>
           <div>
              <h2 className="text-xl font-black text-indigo-950 flex items-center gap-2">
                Helpdesk & Service Client
              </h2>
              <p className="text-sm font-medium text-indigo-900/80 mt-1 max-w-lg leading-relaxed">
                Centralisez les requêtes et retours de vos clients pour offrir une assistance ultra-rapide. Un bon SAV garantit des clients récurrents.
              </p>
           </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:border-gray-300 transition-colors" onClick={() => setFilter('ALL')}>
            <p className="text-[11px] uppercase font-black text-gray-400 tracking-wider">Total Requêtes</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{tickets.length}</h3>
         </div>
         <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm cursor-pointer hover:border-red-300 transition-colors" onClick={() => setFilter('OPEN')}>
            <p className="text-[11px] uppercase font-black text-red-400 tracking-wider">Nouveaux</p>
            <h3 className="text-3xl font-black text-red-600 mt-1">{openTickets}</h3>
         </div>
         <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm cursor-pointer hover:border-amber-300 transition-colors" onClick={() => setFilter('IN_PROGRESS')}>
            <p className="text-[11px] uppercase font-black text-amber-400 tracking-wider">En cours (Traitement)</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{processingTickets}</h3>
         </div>
         <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setFilter('CLOSED')}>
            <p className="text-[11px] uppercase font-black text-emerald-400 tracking-wider">Traités / Résolus</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{closedTickets}</h3>
         </div>
      </div>

      {/* TABLEAU DES TICKETS */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher par nom, sujet, ou N° commande..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl w-max">
               {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map(f => (
                 <button 
                   key={f}
                   onClick={() => setFilter(f as any)}
                   className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   {f === 'ALL' ? 'Tous' : f === 'OPEN' ? 'Nouveaux' : f === 'IN_PROGRESS' ? 'En cours' : 'Résolus'}
                 </button>
               ))}
            </div>
         </div>

         <div className="overflow-x-auto">
           {filteredTickets.length === 0 ? (
             <div className="p-16 text-center text-gray-500">
               <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
               <p className="font-medium text-sm">Aucun ticket ne correspond à vos critères.</p>
             </div>
           ) : (
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-gray-50 text-xs font-black uppercase tracking-wider text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Client & Contact</th>
                   <th className="px-6 py-4">Commande</th>
                   <th className="px-6 py-4">Sujet & Message</th>
                   <th className="px-6 py-4">Statut</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredTickets.map(t => (
                   <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{t.customer_name}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">{t.customer_phone || t.customer_email || 'Aucun contact direct'}</div>
                     </td>
                     <td className="px-6 py-4">
                        {t.order_id ? (
                          <Link href={`/dashboard/orders/${t.order_id}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors">
                            {t.order_id.substring(0, 8)} <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Non liée</span>
                        )}
                     </td>
                     <td className="px-6 py-4 min-w-[300px] whitespace-normal">
                        <div className="font-bold text-gray-900">{t.subject}</div>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{t.message}</p>
                        <div className="text-[10px] text-gray-400 mt-2 font-medium">{format(new Date(t.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</div>
                     </td>
                     <td className="px-6 py-4">
                        {getStatusBadge(t.status)}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <select 
                          disabled={updatingId === t.id}
                          value={t.status}
                          aria-label="Statut du ticket"
                          title="Statut du ticket"
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className={`text-xs font-bold rounded-lg border px-3 py-1.5 outline-none cursor-pointer transition-colors ${updatingId === t.id ? 'opacity-50' : 'hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100'}`}
                        >
                          <option value="OPEN">Rouvrir le ticket</option>
                          <option value="IN_PROGRESS">Marquer En cours</option>
                          <option value="CLOSED">Clôturer (Résolu)</option>
                        </select>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
      </div>
    </div>
  )
}
