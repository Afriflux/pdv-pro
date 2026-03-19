'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'

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

  // Filtrage
  const filtered = statusFilter === 'all'
    ? complaints
    : complaints.filter(c => c.status === statusFilter)

  const FILTERS: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all',           label: `Toutes (${complaints.length})` },
    { id: 'pending',       label: `En attente (${complaints.filter(c => c.status === 'pending').length})` },
    { id: 'investigating', label: `En cours (${complaints.filter(c => c.status === 'investigating').length})` },
    { id: 'resolved',      label: `Résolues (${complaints.filter(c => c.status === 'resolved').length})` },
    { id: 'dismissed',     label: `Rejetées (${complaints.filter(c => c.status === 'dismissed').length})` },
  ]

  return (
    <div className="space-y-4">
      {/* Filtres par statut */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              statusFilter === f.id
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

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
              {filtered.map(complaint => (
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
                    Aucune plainte {statusFilter !== 'all' ? `avec le statut "${statusFilter}"` : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
