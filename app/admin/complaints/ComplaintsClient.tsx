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
    pending:       'bg-amber-50 text-amber-600 border-amber-200',
    investigating: 'bg-blue-50 text-blue-600 border-blue-200',
    resolved:      'bg-[#0F7A60]/10 text-[#0F7A60] border-[#0F7A60]/20',
    dismissed:     'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<ComplaintRow['status'], string> = {
    pending:       '⏳ En attente',
    investigating: '🔍 En cours',
    resolved:      '✅ Résolu',
    dismissed:     '❌ Rejeté',
  }
  return (
    <span className={`px-2.5 py-1 border rounded-full text-[10px] font-black uppercase ${styles[status]}`}>
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
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1 sticky top-6">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Filtrer par Statut</h2>
        
        {FILTERS.map(f => {
          const Icon = ICONS[f.id]
          const isSelected = statusFilter === f.id
          
          let activeClass = 'bg-[#1A1A1A] text-white shadow-sm'
          if (f.id === 'pending') activeClass = 'bg-amber-500 text-white shadow-sm'
          else if (f.id === 'investigating') activeClass = 'bg-blue-500 text-white shadow-sm'
          else if (f.id === 'resolved') activeClass = 'bg-[#0F7A60] text-white shadow-sm'
          else if (f.id === 'dismissed') activeClass = 'bg-gray-200 text-gray-600 shadow-sm'

          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isSelected ? activeClass : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" /> {f.label}
            </button>
          )
        })}

        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3 mt-8">Période</h2>
        <div className="flex flex-col gap-1">
          {[
            { id: 'all', label: 'Toutes les dates' },
            { id: '7days', label: '7 derniers jours' },
            { id: '30days', label: '30 derniers jours' }
          ].map(df => (
            <button
              key={df.id}
              onClick={() => setDateFilter(df.id as DateFilter)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                dateFilter === df.id ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── COLONNE DROITE : CONTENU ── */}
      <div className="flex-1 w-full space-y-6">
        {/* En-tête de page intégré */}
        <header className="flex items-center justify-between border border-gray-200 bg-white p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">
                Plaintes & Signalements
                {filtered.length > 0 && (
                  <span className="ml-2 text-sm font-black text-white bg-red-500 rounded-full px-2 py-0.5 align-middle">
                    {filtered.length}
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-gray-400 ml-14">Traitez les signalements de fraude, plagiat et contenus inappropriés.</p>
          </div>
        </header>

        {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Boutique visée</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4 text-center">Statut</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(complaint => (
                <tr key={complaint.id} className="hover:bg-[#FAFAF7] transition-colors">
                  {/* Type */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      {TYPE_LABELS[complaint.type] ?? complaint.type}
                    </span>
                  </td>

                  {/* Boutique */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-600">
                      {complaint.Store?.name ?? complaint.store_id ?? '—'}
                    </span>
                  </td>

                  {/* Description tronquée */}
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-xs text-gray-500 truncate" title={complaint.description}>
                      {complaint.description.slice(0, 80)}{complaint.description.length > 80 ? '...' : ''}
                    </p>
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={complaint.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {format(new Date(complaint.created_at), 'dd MMM yyyy', { locale: fr })}
                  </td>

                  {/* Lien voir détails */}
                  <td className="px-5 py-4 text-center">
                    <Link
                      href={`/admin/complaints/${complaint.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F7A60] hover:underline"
                    >
                      Voir <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-400 text-sm">
                    Aucune plainte trouvée avec ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Page Précédente"
              >
                Précédent
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
