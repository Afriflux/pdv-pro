'use client'

import { Activity, Clock } from 'lucide-react'

export interface AuditLog {
  id: string
  action: string
  created_at: string
  target_type: string | null
  target_id: string | null
  details: Record<string, any> | null
  User: { name: string | null; email: string } | null
}

export default function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Aucune action enregistrée.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm mt-6">
      <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-700">Journal d'Audit des Administrateurs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Administrateur</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {logs.map((log) => {
              const d = new Date(log.created_at)
              const dateStr = d.toLocaleDateString('fr-FR')
              const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              const adminName = log.User?.name || log.User?.email || 'Système'

              return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">{dateStr} {timeStr}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-gray-700">{adminName}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium text-xs border border-blue-100">
                      {log.action}
                    </span>
                    {log.target_type && (
                      <span className="ml-2 text-xs text-gray-400 font-medium">
                        [{log.target_type}]
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono truncate max-w-[200px]" title={JSON.stringify(log.details)}>
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
