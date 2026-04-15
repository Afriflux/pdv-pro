'use client'

import { useState, useTransition } from 'react'
import { UserPlus, ArrowUpRight, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { assignTicketAction, escalateTicketAction, updateTicketStatusAction } from './actions'

interface AdminUser {
  id: string
  name: string
  role: string
}

interface Props {
  ticketId: string
  currentStatus: string
  assignedAdminId: string | null
  assignedAdminName: string | null
  admins: AdminUser[]
}

export default function TicketActions({ ticketId, currentStatus, assignedAdminId, assignedAdminName, admins }: Props) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [assignedTo, setAssignedTo] = useState(assignedAdminName)
  const [showAssign, setShowAssign] = useState(false)

  const handleAssign = (adminId: string, adminName: string) => {
    startTransition(async () => {
      const res = await assignTicketAction(ticketId, adminId)
      if (res.success) {
        setAssignedTo(adminName)
        setStatus('IN_PROGRESS')
        setShowAssign(false)
      }
    })
  }

  const handleUnassign = () => {
    startTransition(async () => {
      const res = await assignTicketAction(ticketId, null)
      if (res.success) {
        setAssignedTo(null)
        setStatus('OPEN')
      }
    })
  }

  const handleEscalate = () => {
    startTransition(async () => {
      const res = await escalateTicketAction(ticketId)
      if (res.success) {
        setAssignedTo(res.escalatedTo || 'Super Admin')
        setStatus('IN_PROGRESS')
      }
    })
  }

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const res = await updateTicketStatusAction(ticketId, newStatus)
      if (res.success) {
        setStatus(newStatus)
      }
    })
  }

  return (
    <div className="flex items-center gap-2 relative" onClick={e => e.stopPropagation()}>
      {isPending && (
        <Loader2 size={14} className="animate-spin text-emerald-600" />
      )}

      {/* Assigned Admin Badge */}
      {assignedTo ? (
        <button
          onClick={handleUnassign}
          title={`Assigné à ${assignedTo} — Cliquer pour retirer`}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group"
        >
          <UserPlus size={11} className="group-hover:hidden" />
          <XCircle size={11} className="hidden group-hover:block" />
          <span className="max-w-[80px] truncate">{assignedTo}</span>
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowAssign(!showAssign)}
            title="Assigner un admin"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
          >
            <UserPlus size={11} />
            Assigner
          </button>
          
          {showAssign && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 min-w-[200px] py-2 animate-in fade-in zoom-in-95 duration-150">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-4 py-2">Assigner à</p>
              {admins.map(admin => (
                <button
                  key={admin.id}
                  onClick={() => handleAssign(admin.id, admin.name)}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{admin.name}</span>
                  {admin.role === 'super_admin' && (
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-auto">SA</span>
                  )}
                </button>
              ))}
              {admins.length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-400 font-medium">Aucun admin disponible</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Escalate Button */}
      {status !== 'RESOLVED' && status !== 'CLOSED' && (
        <button
          onClick={handleEscalate}
          title="Escalader au Super Admin"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
        >
          <ArrowUpRight size={11} />
          Escalader
        </button>
      )}

      {/* Status Actions */}
      {status === 'IN_PROGRESS' && (
        <button
          onClick={() => handleStatusChange('RESOLVED')}
          title="Marquer comme résolu"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
        >
          <CheckCircle2 size={11} />
          Résoudre
        </button>
      )}

      {status === 'RESOLVED' && (
        <button
          onClick={() => handleStatusChange('CLOSED')}
          title="Fermer le ticket"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
        >
          <XCircle size={11} />
          Fermer
        </button>
      )}

      {status === 'CLOSED' && (
        <button
          onClick={() => handleStatusChange('OPEN')}
          title="Réouvrir le ticket"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
        >
          <Clock size={11} />
          Réouvrir
        </button>
      )}
    </div>
  )
}
