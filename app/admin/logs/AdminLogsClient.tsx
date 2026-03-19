'use client'

import { useState } from 'react'
import { AdminLogItem } from '@/app/admin/AdminOverviewClient'

interface Props {
  initialLogs: AdminLogItem[]
}

export default function AdminLogsClient({ initialLogs }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrer les logs par nom de l'admin, action ou cible
  const filteredLogs = initialLogs.filter(log => {
    const s = searchTerm.toLowerCase()
    return (
      (log.admin?.name || '').toLowerCase().includes(s) ||
      (log.admin?.email || '').toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      (log.target_type || '').toLowerCase().includes(s) ||
      (log.target_id || '').toLowerCase().includes(s)
    )
  })

  // Groupement par jour (Optionnel, mais plus lisible)
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, AdminLogItem[]>)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* ── HEADER & SEARCH ── */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">Historique d&apos;Activité ({filteredLogs.length})</h2>
        <input 
          type="search"
          placeholder="Rechercher action, admin, cible..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full sm:w-80 bg-white"
        />
      </div>

      {/* ── LISTE CHRONOLOGIQUE ── */}
      <div className="p-6">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="text-center p-10 text-gray-400">Aucun journal correspondant trouvé.</div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedLogs).map(dateKey => (
              <div key={dateKey}>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{dateKey}</h3>
                
                <div className="space-y-4">
                  {groupedLogs[dateKey].map(log => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                      
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {log.admin?.name ? log.admin.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <p className="text-sm font-bold text-gray-900">
                            {log.admin?.name || 'Administrateur'}
                          </p>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <p className="text-xs text-gray-500 font-mono">{log.admin?.email}</p>
                        </div>
                        
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium text-gray-500 mr-2">Action :</span>
                          {log.action}
                        </p>

                        {log.target_type && log.target_id && (
                          <div className="mt-2 text-xs font-mono bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md inline-block">
                            Cible: {log.target_type} ({log.target_id})
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 font-medium whitespace-nowrap pt-1">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
