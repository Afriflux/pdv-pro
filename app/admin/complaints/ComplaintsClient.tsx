'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExternalLink, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider ${styles[status]}`}>
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
export default function ComplaintsClient({ complaints }: ComplaintsClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => { setCurrentPage(1) }, [statusFilter, dateFilter])

  // Filtrage
  const now = new Date()
  const filtered = complaints.filter(c => {
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

  const ICONS: Record<StatusFilter, any> = {
    all: AlertTriangle,
    pending: AlertCircle,
    investigating: RefreshCw,
    resolved: CheckCircle2,
    dismissed: XCircle
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* ── COLONNE GAUCHE : ONGLETS LATÉRAUX ── */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1 sticky top-24 z-10">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Filtrer par Statut</h2>
        
        <nav className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-3 flex flex-col gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {FILTERS.map(f => {
            const Icon = ICONS[f.id]
            const isSelected = statusFilter === f.id
            
            let gradientClass = 'from-gray-800 to-black text-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] border-gray-800/50'
            let indicatorColor = 'bg-white'
            
            if (f.id === 'pending') {
              gradientClass = 'from-[#C9A84C] to-amber-500 text-white shadow-[0_4px_15px_rgba(201,168,76,0.3)] border-[#C9A84C]/50'
              indicatorColor = 'bg-white'
            }
            else if (f.id === 'investigating') {
              gradientClass = 'from-blue-500 to-indigo-500 text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)] border-blue-500/50'
              indicatorColor = 'bg-white'
            }
            else if (f.id === 'resolved') {
              gradientClass = 'from-[#0F7A60] to-teal-500 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border-[#0F7A60]/50'
              indicatorColor = 'bg-white'
            }
            else if (f.id === 'dismissed') {
              gradientClass = 'from-gray-500 to-slate-600 text-white shadow-[0_4px_15px_rgba(100,116,139,0.3)] border-gray-500/50'
              indicatorColor = 'bg-white'
            }

            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group border ${
                  isSelected ? `bg-gradient-to-r ${gradientClass}` : 'bg-transparent text-gray-500 border-transparent hover:bg-white/80 hover:text-gray-900'
                }`}
              >
                {isSelected && <div className="absolute inset-0 bg-white/20 hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 relative z-10 shadow-sm ${isSelected ? indicatorColor : 'bg-gray-300'}`} />
                <Icon className="w-4 h-4 relative z-10" /> 
                <span className="flex-1 text-left relative z-10">{f.label}</span>
              </button>
            )
          })}
        </nav>

        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3 mt-8">Période</h2>
        <nav className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-3 flex flex-col gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {[
            { id: 'all', label: 'Toutes les dates' },
            { id: '7days', label: '7 derniers jours' },
            { id: '30days', label: '30 derniers jours' }
          ].map(df => (
            <button
              key={df.id}
              onClick={() => setDateFilter(df.id as DateFilter)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-left border ${
                dateFilter === df.id 
                  ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] border-gray-800/50' 
                  : 'bg-transparent text-gray-500 border-transparent hover:bg-white/80 hover:text-gray-900'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${dateFilter === df.id ? 'bg-white' : 'bg-gray-300'}`} />
              <span className="flex-1">{df.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── COLONNE DROITE : CONTENU ── */}
      <div className="flex-1 w-full space-y-6">
        {/* En-tête de page intégré */}
        <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
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
        </header>

        {/* Tableau */}
      <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Subtle Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none -translate-y-1/3"></div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-[10px] font-black tracking-widest">
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

                  {/* Lien voir détails */}
                  <td className="px-6 py-5 text-center">
                    <Link
                      href={`/admin/complaints/${complaint.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F7A60]/10 text-[#0F7A60] hover:bg-[#0F7A60] hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Voir <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
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
      </div>
    </div>
  )
}
