'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from '@/lib/toast'
import { ExternalLink, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2, XCircle, LayoutGrid, List, ChevronRight, MessageSquare, ShieldAlert } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ComplaintRow {
  id:          string
  type:        string
  description: string
  status:      'pending' | 'investigating' | 'resolved' | 'dismissed'
  created_at:  string
  store_id:    string | null
  product_id:  string | null
  reporter_id: string | null
  evidence_url: string | null
  admin_notes: string | null
  Store:       { name: string } | null
}

interface ComplaintsClientProps {
  complaints: ComplaintRow[]
  isDemoMode?: boolean
}

type StatusFilter = 'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'
type DateFilter = 'all' | '7days' | '30days'

// ─── Badges statut ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ComplaintRow['status'] }) {
  const styles: Record<ComplaintRow['status'], string> = {
    pending:       'bg-amber-50 text-amber-600 border-amber-200 shadow-sm',
    investigating: 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm',
    resolved:      'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20 shadow-sm',
    dismissed:     'bg-white/60 text-gray-500 border-gray-200 shadow-sm',
  }
  const labels: Record<ComplaintRow['status'], string> = {
    pending:       '⏳ En attente',
    investigating: '🔍 En cours',
    resolved:      '✅ Résolu',
    dismissed:     '❌ Rejeté',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

// ─── Type label ────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  plagiat:             '©️ Plagiat',
  fraude:              '🚨 Fraude',
  contenu_inapproprie: '⛔ Contenu',
  autre:               '❓ Autre',
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
export default function ComplaintsClient({ complaints, isDemoMode = false }: ComplaintsClientProps) {
  const [localComplaints, setLocalComplaints] = useState<ComplaintRow[]>(complaints)
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('CARDS')
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRow | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (selectedComplaint) setAdminNotes(selectedComplaint.admin_notes || '')
  }, [selectedComplaint])

  const handleSaveNotes = async () => {
    if (!selectedComplaint) return
    if (isDemoMode) {
      setLocalComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, admin_notes: adminNotes } : c))
      toast.success('Note sauvegardée (Mode Démo)')
      return
    }
    const promise = fetch(`/api/admin/complaints/${selectedComplaint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: adminNotes })
    }).then(async res => { if (!res.ok) throw new Error() })
    
    toast.promise(promise, { loading: 'Sauvegarde...', success: 'Note sauvegardée', error: 'Erreur lors de la sauvegarde' })
    promise.then(() => {
      setLocalComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, admin_notes: adminNotes } : c))
    }).catch((e) => { console.error('[Complaints] Save notes failed:', e) })
  }

  const handleStatusChange = async (newStatus: ComplaintRow['status']) => {
    if (!selectedComplaint) return
    if (isDemoMode) {
      setLocalComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: newStatus } : c))
      setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success(`Statut passé à ${newStatus} (Mode Démo)`)
      return
    }
    const promise = fetch(`/api/admin/complaints/${selectedComplaint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).then(async res => { if (!res.ok) throw new Error() })

    toast.promise(promise, { loading: 'Mise à jour...', success: 'Statut du litige mis à jour', error: 'Erreur lors de la mise à jour' })
    promise.then(() => {
      setLocalComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: newStatus } : c))
      setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null)
    }).catch((e) => { console.error('[Complaints] Status change failed:', e) })
  }
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => { setCurrentPage(1) }, [statusFilter, dateFilter])

  // Filtrage
  const now = new Date()
  const filtered = localComplaints.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (dateFilter !== 'all') {
      const created = new Date(c.created_at)
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (dateFilter === '7days' && diffDays > 7) return false
      if (dateFilter === '30days' && diffDays > 30) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const FILTERS: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all',           label: `Toutes (${complaints.length})` },
    { id: 'pending',       label: `En attente (${complaints.filter(c => c.status === 'pending').length})` },
    { id: 'investigating', label: `En cours (${complaints.filter(c => c.status === 'investigating').length})` },
    { id: 'resolved',      label: `Résolues (${complaints.filter(c => c.status === 'resolved').length})` },
    { id: 'dismissed',     label: `Rejetées (${complaints.filter(c => c.status === 'dismissed').length})` },
  ]

  const ICONS: Record<StatusFilter, React.ElementType> = {
    all: AlertTriangle,
    pending: AlertCircle,
    investigating: RefreshCw,
    resolved: CheckCircle2,
    dismissed: XCircle
  }

  return (
    <div className="flex flex-col gap-6 w-full relative z-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── TABLE & FILTERS LAYOUT ── */}
      
      {/* ── NAVIGATION (Top Tabs) ── */}
      <div className="w-full relative z-20">
        <div className="w-full bg-white/80 backdrop-blur-3xl border border-gray-200 rounded-[2rem] lg:rounded-3xl p-3 lg:p-5 shadow-sm flex flex-col md:flex-row gap-6">
          
          {/* Filtre par statut */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 overflow-hidden w-full max-w-2xl">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2 shrink-0 hidden md:block">Statut</h2>
            <div className="w-full overflow-x-auto scrollbar-hide lg:overflow-visible">
              <nav className="flex flex-row gap-2 w-full min-w-max lg:min-w-0 p-1">
                {FILTERS.map(f => {
                  const Icon = ICONS[f.id]
                  const isSelected = statusFilter === f.id
                  
                  let activeStyle = 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-md shadow-[#0F7A60]/20'
                  if (f.id === 'pending') activeStyle = 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/20'
                  else if (f.id === 'investigating') activeStyle = 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20'
                  else if (f.id === 'dismissed') activeStyle = 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20'

                  return (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 shrink-0 ${isSelected ? activeStyle : 'bg-transparent text-gray-500 hover:bg-slate-50 hover:text-gray-900 border border-transparent hover:shadow-sm'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-300'}`} />
                        <Icon className="w-4 h-4 hidden sm:block" /> 
                        <span className="whitespace-nowrap">{f.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          <div className="hidden md:block w-px h-auto bg-gray-200 shrink-0"></div>

          {/* Filtre par période */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 overflow-hidden w-full max-w-sm">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2 shrink-0 hidden md:block">Période</h2>
            <div className="w-full overflow-x-auto scrollbar-hide lg:overflow-visible">
              <nav className="flex flex-row gap-2 w-full min-w-max lg:min-w-0 p-1">
                {[
                  { id: 'all', label: 'Toutes les dates' },
                  { id: '7days', label: '7 derniers jours' },
                  { id: '30days', label: '30 derniers jours' }
                ].map(df => {
                  const isSelected = dateFilter === df.id
                  return (
                    <button
                      key={df.id}
                      onClick={() => setDateFilter(df.id as DateFilter)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 shrink-0 ${isSelected ? 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-md shadow-[#0F7A60]/20' : 'bg-transparent text-gray-500 hover:bg-slate-50 hover:text-gray-900 border border-transparent hover:shadow-sm'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-300'}`} />
                        <span className="whitespace-nowrap">{df.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
        
        {isDemoMode && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-3xl flex items-center gap-4 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm font-medium">
              <strong className="font-black text-amber-900">MODE DÉMO ACTIVÉ :</strong> Vous naviguez actuellement avec de fausses plaintes générées aléatoirement car votre base de données ne contient aucun ticket.
            </p>
          </div>
        )}

        {/* En-tête de page intégré */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden gap-4">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/10 text-red-500 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">
                Plaintes & Signalements
                {filtered.length > 0 && (
                  <span className="ml-3 text-xs font-black text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg px-2.5 py-1 align-middle shadow-sm">
                    {filtered.length}
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-14 font-medium">Traitez les signalements de fraude, plagiat et contenus inappropriés sur la marketplace.</p>
          </div>

          <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-100 shrink-0 relative z-10 shadow-sm">
             <button 
               title="Vue Cartes"
               onClick={() => setViewMode('CARDS')}
               className={`p-1.5 rounded-lg transition-colors ${viewMode === 'CARDS' ? 'bg-gray-100 shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
             >
               <LayoutGrid size={18} strokeWidth={2.5} />
             </button>
             <button 
               title="Vue Tableau"
               onClick={() => setViewMode('TABLE')}
               className={`p-1.5 rounded-lg transition-colors ${viewMode === 'TABLE' ? 'bg-gray-100 shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
             >
               <List size={18} strokeWidth={2.5} />
             </button>
          </div>
        </header>

        {/* Le Contenu Hybride (Table/Cards) commence ici */}

        {viewMode === 'TABLE' && (
        <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in fade-in">
        {/* Subtle Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-y-1/3"></div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-xs font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Boutique visée</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5 text-center">Statut</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {paginated.map(complaint => (
                <tr key={complaint.id} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">
                  {/* Type */}
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-[#1A1A1A] group-hover:text-red-600 transition-colors">
                      {TYPE_LABELS[complaint.type] ?? complaint.type}
                    </span>
                  </td>

                  {/* Boutique */}
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-gray-600">
                      {complaint.Store?.name ?? complaint.store_id ?? '—'}
                    </span>
                  </td>

                  {/* Description tronquée */}
                  <td className="px-6 py-5 max-w-xs">
                    <p className="text-[13px] font-medium text-gray-500 truncate" title={complaint.description}>
                      {complaint.description.slice(0, 80)}{complaint.description.length > 80 ? '...' : ''}
                    </p>
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-5 text-center">
                    <StatusBadge status={complaint.status} />
                  </td>

                  {/* Date */}
                  <td className="px-6 py-5 text-xs font-semibold text-gray-400">
                    {format(new Date(complaint.created_at), 'dd MMM yyyy', { locale: fr })}
                  </td>

                  {/* Lien voir détails transformé en Bouton Tiroir */}
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F7A60]/10 text-[#0F7A60] hover:bg-[#0F7A60] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Voir <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative border border-white/50">
                      <AlertCircle className="w-10 h-10 text-gray-300" />
                      <div className="absolute -inset-4 bg-red-400/10 rounded-full blur-xl -z-10" />
                    </div>
                    <p className="text-lg font-bold text-gray-700">Aucune plainte trouvée</p>
                    <p className="text-sm mt-2 text-gray-500">Essayez de modifier vos filtres de recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-8 py-5 border-t border-white/20 bg-white/40 relative z-10">
            <span className="text-sm font-semibold text-gray-500">
              Page {currentPage} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm font-bold bg-white/80 border border-white/50 rounded-xl hover:bg-white disabled:opacity-50 transition-colors shadow-sm text-gray-700"
                title="Page Précédente"
              >
                Précédent
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-sm font-bold bg-white/80 border border-white/50 rounded-xl hover:bg-white disabled:opacity-50 transition-colors shadow-sm text-gray-700"
                title="Page Suivante"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
        </div>
        )}
        
        {/* VUE KANBAN / CARDS */}
        {viewMode === 'CARDS' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
            {paginated.map(complaint => (
              <div key={complaint.id} className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -z-10 group-hover:bg-red-500/10 transition-colors"></div>
                
                <div className="flex items-start justify-between">
                  <StatusBadge status={complaint.status} />
                  <span className="text-xs font-black text-gray-400 border border-gray-100 px-2 py-1 rounded-lg bg-gray-50">{format(new Date(complaint.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                    {complaint.type === 'fraude' && <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"></span>}
                    {complaint.type === 'plagiat' && <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>}
                    {(complaint.type !== 'fraude' && complaint.type !== 'plagiat') && <span className="w-2 h-2 rounded-full bg-gray-400"></span>}
                    {TYPE_LABELS[complaint.type] ?? complaint.type}
                  </h3>
                  <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-xs">🏪</div>
                    <span className="text-xs font-bold text-gray-700 truncate">{complaint.Store?.name ?? complaint.store_id ?? 'Boutique Inconnue'}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 font-medium line-clamp-3 flex-1 leading-relaxed">
                  "{complaint.description}"
                </p>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  {complaint.evidence_url ? (
                    <span className="text-xs font-bold text-[#0F7A60] bg-[#0F7A60]/10 px-2.5 py-1.5 rounded-lg border border-[#0F7A60]/20 flex items-center gap-1.5">
                      <ExternalLink size={12} /> Preuve jointe
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400 italic">Aucune preuve</span>
                  )}
                  <button 
                    onClick={() => setSelectedComplaint(complaint)}
                    className="text-xs font-black text-white bg-gray-900 hover:bg-emerald-600 px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 transform active:scale-95 group-hover:bg-[#0F7A60]"
                  >
                    Instruire <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full py-24 text-center">
                 <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative border border-white/50">
                    <AlertCircle className="w-10 h-10 text-gray-300" />
                 </div>
                 <p className="text-lg font-bold text-gray-700">Aucune plainte trouvée</p>
                 <p className="text-sm mt-2 text-gray-500">Essayez de modifier vos filtres de recherche.</p>
              </div>
            )}
          </div>
        )}
      {/* ── TIROIR (DRAWER) DE RÉSOLUTION ── */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay Flou */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer" onClick={() => setSelectedComplaint(null)}></div>
          
          {/* Le Tiroir */}
          <div className="w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 relative flex flex-col border-l border-gray-200">
            {/* Header du tiroir */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Dossier de résolution</h2>
                  <p className="text-xs font-bold text-gray-500">Clé d'identification : <span className="font-mono text-gray-400">#{selectedComplaint.id.slice(0, 8).toUpperCase()}</span></p>
                </div>
              </div>
              <button title="Fermer" onClick={() => setSelectedComplaint(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date d'ouverture</h3>
                  <p className="text-sm font-bold text-gray-900">{format(new Date(selectedComplaint.created_at), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
                </div>
                <StatusBadge status={selectedComplaint.status} />
              </div>

              {/* Box Info Boutique */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">Boutique Signalée</h3>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-900 text-lg">{selectedComplaint.Store?.name ?? selectedComplaint.store_id}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/admin/vendeurs`} className="flex-1 py-2 text-xs font-bold text-[#0F7A60] bg-[#0F7A60]/10 hover:bg-[#0F7A60]/20 rounded-xl transition-colors border border-[#0F7A60]/20 text-center block">
                      Voir Profil
                    </Link>
                    <button onClick={() => toast.success('Redirection vers WhatsApp vendeur...')} className="flex-1 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200">
                      Contacter
                    </button>
                  </div>
                </div>
              </div>

              {/* Motif de la plainte */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  Déclaration du plaignant
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-lg">{TYPE_LABELS[selectedComplaint.type]}</span>
                </h3>
                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl"></div>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed italic relative z-10 whitespace-pre-line">
                    "{selectedComplaint.description}"
                  </p>
                </div>
              </div>

              {/* Preuve jointe */}
              {selectedComplaint.evidence_url && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Preuve Fournie</h3>
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                    {/* Assuming it's an image, in production checking mime-type is better */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedComplaint.evidence_url} alt="Preuve" className="w-full h-auto rounded-xl max-h-64 object-contain bg-gray-100" />
                    <a href={selectedComplaint.evidence_url} target="_blank" rel="noreferrer" className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                      <ExternalLink size={14} /> Ouvrir la pièce jointe
                    </a>
                  </div>
                </div>
              )}

              {/* Section Notes Administrateur */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} /> Cahier d'Audit (Privé)
                </h3>
                <textarea 
                  className="w-full bg-white border border-gray-200 shadow-inner rounded-2xl p-4 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#0F7A60] focus:border-[#0F7A60] outline-none min-h-[140px] resize-none"
                  placeholder="Note interne sur l'état d'avancement de cette enquête... (ex: Appel passé à l'acheteur)."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                <div className="flex justify-end">
                  <button onClick={handleSaveNotes} className="text-xs font-bold text-white bg-gray-900 px-4 py-2 rounded-xl shadow-sm hover:bg-black transition-colors">Sauvegarder la note</button>
                </div>
              </div>
            </div>

            {/* Actions critiques en sticky bottom */}
            <div className="p-6 border-t border-gray-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)] space-y-3 shrink-0">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center mb-1">Actions Décisionnelles</h4>
              <button 
                onClick={() => {
                  handleStatusChange('investigating')
                  toast.success("Suspension : Action redirigée vers la page vendeur")
                }}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-red-600/20 flex justify-center items-center gap-2 group"
              >
                <XCircle size={18} className="group-hover:rotate-90 transition-transform" /> Suspendre la Boutique
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    handleStatusChange('resolved')
                    toast.success("Remboursement Auto : Backend en construction")
                  }}
                  className="w-full py-3 border border-gray-900 hover:border-black text-gray-900 hover:bg-gray-50 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center"
                >
                  Rembourser
                </button>
                <button 
                  onClick={() => handleStatusChange('dismissed')}
                  className="w-full py-3 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  Classer sans suite
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  )
}
