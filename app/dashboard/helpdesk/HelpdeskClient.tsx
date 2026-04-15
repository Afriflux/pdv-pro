'use client'

import React, { useState } from 'react'
import { MessageSquare, AlertTriangle, CheckCircle2, Clock, X, Search, Filter, Loader2, Info } from 'lucide-react'
import { updateComplaintStatusAction, addComplaintNoteAction } from './actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface ComplaintData {
  id: string
  type: string
  description: string
  status: string
  evidence_url: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  product: { name: string, image: string | null } | null
}

const STATUS_CONFIG: Record<string, { label: string, color: string, badgeBg: string }> = {
  pending: { label: 'En attente', color: 'text-amber-600', badgeBg: 'bg-amber-100 border-amber-200' },
  investigating: { label: 'En cours', color: 'text-blue-600', badgeBg: 'bg-blue-100 border-blue-200' },
  resolved: { label: 'Résolu', color: 'text-[#0F7A60]', badgeBg: 'bg-emerald-100 border-emerald-200' },
  dismissed: { label: 'Rejeté', color: 'text-slate-600', badgeBg: 'bg-slate-200 border-slate-300' }
}

export default function HelpdeskClient({ storeId, complaints: initialComplaints }: { storeId: string, complaints: ComplaintData[] }) {
  const [complaints, setComplaints] = useState<ComplaintData[]>(initialComplaints)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [newNote, setNewNote] = useState('')

  const filtered = complaints.filter(c => {
    const matchSearch = c.description.toLowerCase().includes(search.toLowerCase()) || 
                       c.id.toLowerCase().includes(search.toLowerCase()) || 
                       (c.product?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    resolved: complaints.filter(c => c.status === 'resolved').length
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedComplaint) return
    setIsUpdating(true)
    const res = await updateComplaintStatusAction(selectedComplaint.id, storeId, newStatus)
    if (res.success) {
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: newStatus } : c))
      setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success('Statut mis à jour.')
    } else {
      toast.error(res.error)
    }
    setIsUpdating(false)
  }

  const handleAddNote = async () => {
    if (!selectedComplaint || !newNote.trim()) return
    setIsUpdating(true)
    const res = await addComplaintNoteAction(selectedComplaint.id, storeId, newNote.trim())
    if (res.success) {
      const updatedNotes = selectedComplaint.admin_notes 
         ? `${selectedComplaint.admin_notes}\n---\n[Vendeur] ${new Date().toLocaleDateString()}: ${newNote.trim()}`
         : `[Vendeur] ${new Date().toLocaleDateString()}: ${newNote.trim()}`
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, admin_notes: updatedNotes } : c))
      setSelectedComplaint(prev => prev ? { ...prev, admin_notes: updatedNotes } : null)
      setNewNote('')
      toast.success('Note partagée avec l\'administration.')
    } else {
      toast.error(res.error)
    }
    setIsUpdating(false)
  }

  return (
    <div className="space-y-6 w-full font-sans pb-32">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-gradient-to-br from-[#0F7A60] to-emerald-800 text-white rounded-2xl shadow-lg">
                <MessageSquare size={26} />
             </div>
             <h1 className="text-3xl font-display font-black text-ink tracking-tight">Helpdesk & SAV</h1>
          </div>
          <p className="text-dust font-medium text-sm mt-1 max-w-xl">Traitez les réclamations clients, communiquez avec l'équipe Yayyam en Admin et maintenez une excellente réputation.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-3xl shadow-xl shadow-slate-200/20 flex flex-col relative overflow-hidden">
             <p className="text-xs font-black text-dust uppercase tracking-widest mb-1">Total</p>
             <p className="text-3xl font-display font-black text-ink">{stats.total}</p>
             <MessageSquare className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100" size={50} />
         </div>
         <div className="bg-amber-50/50 backdrop-blur-md border border-white p-5 rounded-3xl shadow-xl shadow-amber-500/10 flex flex-col relative overflow-hidden">
             <p className="text-xs font-black text-amber-600/70 uppercase tracking-widest mb-1">A traiter</p>
             <p className="text-3xl font-display font-black text-amber-600">{stats.pending}</p>
             <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-100" size={50} />
         </div>
         <div className="bg-emerald-50/50 backdrop-blur-md border border-white p-5 rounded-3xl shadow-xl shadow-emerald-500/10 flex flex-col relative overflow-hidden">
             <p className="text-xs font-black text-[#0F7A60]/70 uppercase tracking-widest mb-1">Résolus</p>
             <p className="text-3xl font-display font-black text-[#0F7A60]">{stats.resolved}</p>
             <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-100" size={50} />
         </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-3">
         <div className="relative flex-1">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" size={16} />
           <input 
             type="text"
             placeholder="Rechercher ticket ou produit..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-white border border-line rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all outline-none shadow-sm"
           />
         </div>
         <div className="flex gap-2">
           <select
             title="Filtrer par statut"
             aria-label="Filtrer par statut"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="bg-white border border-line text-ink rounded-xl px-4 py-3 text-sm font-bold focus:border-[#0F7A60] outline-none shadow-sm"
           >
             <option value="all">Tous les Statuts</option>
             <option value="pending">En attente</option>
             <option value="investigating">En cours</option>
             <option value="resolved">Résolus</option>
           </select>
         </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
           <div className="text-center py-16 bg-white/50 rounded-3xl border border-line border-dashed">
             <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-3" />
             <p className="text-ink font-black text-lg">Zéro Plainte</p>
             <p className="text-slate text-sm">Tout semble sous contrôle pour ces critères.</p>
           </div>
        ) : (
          filtered.map(c => {
             const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending
             return (
               <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-white border border-line rounded-2xl p-4 shadow-sm hover:border-[#0F7A60]/30 hover:shadow-md transition cursor-pointer group flex flex-col md:flex-row gap-4 md:items-center justify-between">
                 <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${st.badgeBg} ${st.color}`}>
                       {c.status === 'resolved' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase text-dust tracking-wider">#{c.id.split('-')[0]}</span>
                        <span className="text-[10px] font-black text-slate uppercase bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={10}/> {new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-ink text-sm md:text-base line-clamp-1">{c.type}</h3>
                      <p className="text-slate text-xs mt-0.5 font-medium line-clamp-1">{c.description}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 border-t border-line md:border-none pt-3 md:pt-0">
                    {c.product && (
                       <div className="flex items-center gap-2 bg-[#FAFAF7] pr-3 rounded-xl border border-line overflow-hidden max-w-[150px]">
                          <div className="w-8 h-8 bg-slate-100 flex-shrink-0 relative overflow-hidden">
                             {c.product.image ? <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={c.product.image} fill className="object-cover" alt="img" unoptimized/> : <div className="w-full h-full bg-slate-200"></div>}
                          </div>
                          <p className="text-[10px] font-bold text-ink truncate">{c.product.name}</p>
                       </div>
                    )}
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${st.badgeBg} ${st.color} shrink-0`}>
                      {st.label}
                    </span>
                 </div>
               </div>
             )
          })
        )}
      </div>

      {/* MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 relative">
            
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-line bg-[#FAFAF7]">
              <div>
                <h2 className="text-lg font-black text-ink">Ticket #{selectedComplaint.id.split('-')[0]}</h2>
                <p className="text-xs font-bold text-dust uppercase tracking-wider mt-0.5">{new Date(selectedComplaint.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} title="Fermer" className="w-10 h-10 bg-white border border-line rounded-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-sm">
                 <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
               <div>
                  <h3 className="text-xs font-black uppercase text-dust tracking-widest mb-2">Sujet / Type</h3>
                  <p className="text-base font-bold text-ink bg-slate-50 p-3 rounded-xl border border-line">{selectedComplaint.type}</p>
               </div>

               <div>
                  <h3 className="text-xs font-black uppercase text-dust tracking-widest mb-2">Description Client</h3>
                  <p className="text-sm font-medium text-ink bg-amber-50/50 p-4 rounded-xl border border-amber-100 whitespace-pre-wrap">{selectedComplaint.description}</p>
               </div>
               
               {selectedComplaint.evidence_url && (
                  <div>
                    <a href={selectedComplaint.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0F7A60] underline">Voir la preuve / Image attachée</a>
                  </div>
               )}

               <div className="border-t border-line pt-6">
                  <h3 className="text-xs font-black uppercase text-dust tracking-widest mb-3 flex items-center gap-2"><Info size={14}/> Notes & Communications (Admin Yayyam)</h3>
                  <div className="bg-[#f4f4f5] p-4 rounded-2xl border border-line min-h-[100px] max-h-[250px] overflow-y-auto text-sm font-mono text-ink whitespace-pre-wrap">
                     {selectedComplaint.admin_notes ? selectedComplaint.admin_notes : <span className="text-slate-400 italic">Aucune note pour le moment.</span>}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                     <input 
                       type="text"
                       placeholder="Ajouter une réponse ou un détail..."
                       value={newNote}
                       onChange={e => setNewNote(e.target.value)}
                       className="flex-1 border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F7A60]"
                     />
                     <button 
                       onClick={handleAddNote}
                       disabled={isUpdating || !newNote.trim()}
                       className="bg-ink text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 active:scale-95 transition"
                     >
                       {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Envoyer'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-5 border-t border-line bg-[#FAFAF7] flex flex-wrap gap-2 justify-end">
               <span className="text-xs font-bold text-dust self-center mr-auto">Changer le statut :</span>
               {['pending', 'investigating', 'resolved'].map(st => {
                  const conf = STATUS_CONFIG[st]
                  const isCurrent = selectedComplaint.status === st
                  return (
                    <button 
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      disabled={isUpdating || isCurrent}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${isCurrent ? `${conf.badgeBg} ${conf.color} ring-1 ring-current cursor-default` : 'bg-white border border-line text-slate hover:border-slate-400'}`}
                    >
                      {conf.label}
                    </button>
                  )
               })}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
