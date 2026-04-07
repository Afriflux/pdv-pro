'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, AlertTriangle, MessageSquare } from 'lucide-react'
import { toast } from '@/lib/toast'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface WithdrawalActionsProps {
  withdrawalId: string
  status: string
}

export default function WithdrawalActions({ withdrawalId, status }: WithdrawalActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null)
  const [reason, setReason] = useState('')
  const router = useRouter()

  if (status !== 'pending') return null

  const openModal = (type: 'approved' | 'rejected') => {
    setActionType(type)
    setIsModalOpen(true)
    setReason('')
  }

  const handleAction = async () => {
    if (!actionType) return
    if (!reason.trim()) {
      toast.error('Un motif de validation/rejet est obligatoire.')
      return
    }

    setLoading(actionType)
    setIsModalOpen(false)

    try {
      const res = await fetch(`/api/admin/retraits/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionType, reason: reason.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'action')
      }

      toast.success(actionType === 'approved' ? 'Retrait approuvé, transaction démarrée !' : 'Retrait rejeté et fonds réattribués !')
      router.refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Une erreur est survenue'
      toast.error(msg)
    } finally {
      setLoading(null)
      setActionType(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => openModal('approved')}
          disabled={!!loading}
          className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg transition-all disabled:opacity-50"
          title="Approuver & Payer"
        >
          {loading === 'approved' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => openModal('rejected')}
          disabled={!!loading}
          className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-all disabled:opacity-50"
          title="Rejeter & Recréditer"
        >
          {loading === 'rejected' ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
        </button>
      </div>

      {isModalOpen && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-white/50 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${actionType === 'approved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${actionType === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {actionType === 'approved' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {actionType === 'approved' ? 'Valider le paiement' : 'Rejeter la demande'}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">La raison sera inscrite dans le journal d'audit.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100/50">
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} className="text-gray-400" />
                  Motif de la décision <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={actionType === 'approved' ? "Transaction effectuée via le portail bancaire..." : "Numéro invalide, suspicion de fraude, etc."}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal h-28 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  disabled={!reason.trim()}
                  onClick={handleAction}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'approved' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 hover:scale-[1.02]' 
                    : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 hover:scale-[1.02]'
                  }`}
                >
                  {actionType === 'approved' ? 'Confirmer' : 'Rejeter'}
                </button>
              </div>

            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
