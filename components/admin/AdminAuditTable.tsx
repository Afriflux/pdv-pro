'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  UserCheck, 
  ShieldAlert,
  Edit3,
  Search,
  MessageSquare,
  ArrowRight,
  Download,
  X
} from 'lucide-react'

interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: { reason?: string } | any
  created_at: string
  admin: { email: string, role: string }
}

interface AdminAuditTableProps {
  logs: AdminLog[]
  count: number
  totalPages: number
  currentPage: number
  currentAction: string
  period: string
  q: string
}

const PERIOD_TYPES = [
  { value: 'ALL', label: 'Toutes les périodes' },
  { value: 'TODAY', label: "Aujourd'hui" },
  { value: '7DAYS', label: '7 derniers jours' },
  { value: '30DAYS', label: '30 derniers jours' }
]

const ACTION_TYPES = [
  { value: 'ALL', label: 'Toutes les actions' },
  { value: 'APPROVE_KYC', label: 'Validation KYC' },
  { value: 'REJECT_KYC', label: 'Rejets KYC' },
  { value: 'SUSPEND_VENDOR', label: 'Suspensions' },
  { value: 'ACTIVATE_VENDOR', label: 'Réactivations' },
  { value: 'EDIT_VENDOR_INFO', label: 'Modifs Infos' }
]

export default function AdminAuditTable({ logs, count, totalPages, currentPage, currentAction, period, q }: AdminAuditTableProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(q)

  useEffect(() => {
    setSearchValue(q)
  }, [q])

  const applyFilters = (newAction?: string, newPeriod?: string, newQ?: string) => {
    const params = new URLSearchParams()
    if (newAction || currentAction !== 'ALL') params.set('action', newAction ?? currentAction)
    if (newPeriod || period !== 'ALL') params.set('period', newPeriod ?? period)
    const finalQ = newQ !== undefined ? newQ : searchValue
    if (finalQ) params.set('q', finalQ)
    router.push(`/admin/audit?${params.toString()}`)
  }

  const handleExportCSV = () => {
    const headers = ["Date", "Heure", "Action", "AuteurEmail", "AuteurRole", "Motif", "CibleType", "CibleID"]
    const csvContent = logs.map(l => {
        return [
            format(new Date(l.created_at), 'yyyy-MM-dd'),
            format(new Date(l.created_at), 'HH:mm:ss'),
            l.action,
            l.admin.email,
            l.admin.role,
            `"${(l.details?.reason || '').replace(/"/g, '""')}"`,
            l.target_type || '',
            l.target_id || ''
        ].join(',')
    })
    
    const csv = [headers.join(','), ...csvContent].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    link.click()
  }

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'APPROVE_KYC':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Validation KYC' }
      case 'REJECT_KYC':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejet KYC' }
      case 'SUSPEND_VENDOR':
        return { icon: UserMinus, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Suspension' }
      case 'ACTIVATE_VENDOR':
        return { icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Réactivation' }
      case 'EDIT_VENDOR_INFO':
        return { icon: Edit3, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Modif Infos' }
      default:
        return { icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-100', label: action }
    }
  }

  return (
    <div className="w-full flex flex-col">
      {/* ── HEADER: FILTRES ── */}
      <div className="px-6 lg:px-8 py-5 border-b border-gray-100 bg-white rounded-t-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900">Activité de Gouvernance</h2>
          <p className="text-xs text-gray-500 font-medium">({count} logs enregistrés)</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          
          <form 
            onSubmit={(e) => { e.preventDefault(); applyFilters(undefined, undefined, searchValue); }}
            className="relative flex items-center"
          >
            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Chercher motif, ID cible..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                if (e.target.value === '') {
                  applyFilters(undefined, undefined, '')
                }
              }}
              className="w-full sm:w-64 pl-9 pr-10 py-2.5 text-sm font-bold text-gray-900 bg-[#FAFAF7] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all placeholder:font-medium placeholder:text-gray-400"
            />
            {searchValue && (
              <button 
                type="button"
                onClick={() => {
                  setSearchValue('')
                  applyFilters(undefined, undefined, '')
                }}
                className="absolute right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <select
            value={period}
            onChange={(e) => applyFilters(undefined, e.target.value, undefined)}
            aria-label="Filtrer par période"
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
          >
            {PERIOD_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={currentAction}
            onChange={(e) => applyFilters(e.target.value, undefined, undefined)}
            aria-label="Filtrer par type d'action"
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer shadow-sm"
          >
            {ACTION_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            title="Exporter ces logs en CSV"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm ml-auto sm:ml-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter (CSV)</span>
          </button>
        </div>
      </div>

      {/* ── TABLEAU ── */}
      <div className="w-full overflow-x-auto bg-white">
        <table className="w-full text-left whitespace-nowrap min-w-[900px]">
          <thead>
            <tr className="bg-[#FAFAF7] border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date / Heure</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Auteur (Admin)</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Motif Justificatif</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                  Aucun log ne correspond à ce filtre.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const config = getActionConfig(log.action)
                const Icon = config.icon

                return (
                  <tr key={log.id} className="hover:bg-[#FAFAF7]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">
                          {format(new Date(log.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config.bg} ${config.color} rounded-lg border border-current/[0.1]`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-black tracking-wider">{config.label}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{log.admin.email}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">{log.admin.role}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-[300px]">
                      {log.details?.reason ? (
                        <div className="flex items-start gap-2 text-gray-600 truncate">
                          <MessageSquare className="w-3 h-3 text-gray-300 mt-1 shrink-0" />
                          <span className="italic truncate" title={log.details.reason}>{log.details.reason}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {log.target_type === 'vendor' ? (
                        <Link 
                          href={`/admin/vendeurs/${log.target_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-bold text-xs rounded-xl border border-gray-200 hover:border-emerald-200 transition-all"
                        >
                          Vendeur <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs font-mono">{log.target_id || '-'}</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-100 flex items-center justify-center gap-2 bg-[#FAFAF7]/50 lg:rounded-b-3xl">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/audit?page=${i + 1}&action=${currentAction}&period=${period}&q=${q}`}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-all duration-300 shadow-sm border ${
                currentPage === i + 1
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)] border-transparent'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-800/30 hover:text-gray-800 hover:shadow-md'
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
