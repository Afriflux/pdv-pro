'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  UserCheck, 
  Edit3,
  MessageSquare
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  created_at: string
  details: { reason?: string } | any
  admin: {
    email: string
    role: string
  }
}

interface VendorAuditLogsProps {
  logs: AuditLog[]
}

export default function VendorAuditLogs({ logs }: VendorAuditLogsProps) {
  
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'APPROVE_KYC':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Validation KYC' }
      case 'REJECT_KYC':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejet KYC' }
      case 'SUSPEND_VENDOR':
        return { icon: UserMinus, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Suspension Compte' }
      case 'ACTIVATE_VENDOR':
        return { icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Réactivation Compte' }
      case 'EDIT_VENDOR_INFO':
        return { icon: Edit3, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Modification Admin' }
      default:
        return { icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-100', label: action }
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gray-50 rounded-xl text-gray-500">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">Logs d'Audit & Historique</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Traçabilité des actions administratives sur ce vendeur.</p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
        {logs.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm font-medium">
            Aucune action administrative enregistrée.
          </div>
        ) : (
          logs.map((log) => {
            const config = getActionConfig(log.action)
            const Icon = config.icon

            return (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Icône Centrale (Timeline) */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${config.bg} ${config.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Carte de Date/Motif */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${config.color} px-2 py-1 ${config.bg} rounded-md`}>
                      {config.label}
                    </span>
                    <time className="text-[11px] font-bold text-gray-400 font-mono">
                      {format(new Date(log.created_at), 'dd MMM yyyy • HH:mm', { locale: fr })}
                    </time>
                  </div>
                  
                  {log.details?.reason && (
                    <div className="mt-3 bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2 relative">
                      <MessageSquare className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-gray-700 italic">"{log.details.reason}"</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span>Par:</span>
                    <span className="text-gray-600 font-bold truncate max-w-[150px]">{log.admin.email}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
