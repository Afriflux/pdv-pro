'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  Truck,
  MessageSquare,
  RefreshCcw,
  CreditCard
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  created_at: string
  details?: { reason?: string, new_status?: string, [key: string]: unknown }
  admin: {
    email: string
    role: string
  }
}

interface OrderAuditLogsProps {
  logs: AuditLog[]
}

export default function OrderAuditLogs({ logs }: OrderAuditLogsProps) {
  
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'pending': return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: 'En attente' }
      case 'pending_payment': return { icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Attente Paiement' }
      case 'paid': return { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Payée' }
      case 'processing': return { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', label: 'En traitement' }
      case 'shipped': return { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Expédiée' }
      case 'delivered': return { icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-100', label: 'Livrée' }
      case 'completed': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Complétée' }
      case 'cancelled': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Annulée' }
      case 'refunded': return { icon: RefreshCcw, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Remboursée' }
      default: return { icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Mise à jour' }
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 mt-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[80px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 rounded-xl text-[#0F7A60] shadow-sm">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1A1A1A]">Historique d'Audit</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Traçabilité des changements de statut sur cette commande.</p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100/50 before:to-transparent z-10">
        {logs.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm font-medium">
            Aucune modification enregistrée pour cette commande.
          </div>
        ) : (
          logs.map((log) => {
            const config = getStatusConfig(log.details?.new_status)
            const Icon = config.icon

            return (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Icône Centrale (Timeline) */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${config.bg} ${config.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Carte de Date/Motif */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black uppercase tracking-widest ${config.color} px-2 py-1 ${config.bg} rounded-md`}>
                      {log.action === 'UPDATE_STATUS' ? 'Statut actualisé' : config.label}
                    </span>
                    <time className="text-xs font-bold text-gray-400 font-mono">
                      {format(new Date(log.created_at), 'dd MMM yyyy • HH:mm', { locale: fr })}
                    </time>
                  </div>
                  
                  {log.details?.new_status && (
                     <div className="mb-2">
                        <span className="text-xs font-bold text-gray-700">Nouveau statut : </span>
                        <span className={`text-xs uppercase font-black px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>{config.label}</span>
                     </div>
                  )}

                  {log.details?.reason && (
                    <div className="mt-3 bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2 relative">
                      <MessageSquare className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-gray-700 italic">"{log.details.reason}"</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-gray-400 font-medium">
                    <span>Par:</span>
                    <span className="text-gray-600 font-bold truncate max-w-[150px]">{log.admin?.email ?? 'Système'}</span>
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
