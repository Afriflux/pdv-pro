'use client'

import { useState } from 'react'
import { AdminWithdrawal, processWithdrawal } from '@/lib/admin/adminActions'

interface Props {
  initialWithdrawals: AdminWithdrawal[]
}

export default function AdminWithdrawalsClient({ initialWithdrawals }: Props) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals)
  const [filter, setFilter] = useState('pending')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Modal Rejet
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const filteredData = withdrawals.filter(w => filter === 'all' || w.status === filter)

  const handleApprove = async (w: AdminWithdrawal) => {
    if (!confirm(`Valider l'envoi de ${w.amount.toLocaleString()} FCFA à ${w.vendor_name} via ${w.payment_method} ?\nCette action est irréversible et déclenche l'API PayTech Transfer.`)) return
    
    setLoadingId(w.id)
    try {
      const res = await processWithdrawal(w.id, 'approve')
      alert(res.message)
      // Mettre à jour l'UI localement
      setWithdrawals(prev => prev.map(item => item.id === w.id ? { ...item, status: 'completed' } : item))
    } catch (error: any) {
      alert(`Erreur : ${error.message}`)
      // En cas d'erreur de transfert, on le repasse en 'failed' UI
      setWithdrawals(prev => prev.map(item => item.id === w.id ? { ...item, status: 'failed', notes: error.message } : item))
    } finally {
      setLoadingId(null)
    }
  }

  const handleOpenReject = (w: AdminWithdrawal) => {
    setSelectedWithdrawal(w)
    setRejectReason('')
    setIsRejectModalOpen(true)
  }

  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWithdrawal) return

    setLoadingId(selectedWithdrawal.id)
    try {
      const res = await processWithdrawal(selectedWithdrawal.id, 'reject', rejectReason)
      setWithdrawals(prev => prev.map(item => item.id === selectedWithdrawal.id ? { ...item, status: 'rejected', notes: rejectReason } : item))
      setIsRejectModalOpen(false)
      alert(res.message)
    } catch (error: any) {
      alert(`Erreur : ${error.message}`)
    } finally {
      setLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-xs">En attente</span>
      case 'processing': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold rounded-full text-xs animate-pulse">En cours</span>
      case 'completed': return <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-xs">Terminé</span>
      case 'failed': return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-xs">Échoué</span>
      case 'rejected': return <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-full text-xs">Rejeté</span>
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-full text-xs">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* ── FILTERS ── */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['pending', 'completed', 'failed', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f === 'pending' ? 'À traiter' : 
             f === 'completed' ? 'Validés' : 
             f === 'failed' ? 'Échecs API' : 
             f === 'rejected' ? 'Rejetés' : 'Tous'}
          </button>
        ))}
      </div>

      {/* ── LISTE ── */}
      <div className="grid grid-cols-1 gap-4">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100">
             Aucun retrait dans cette catégorie.
          </div>
        ) : filteredData.map(w => (
          <div key={w.id} className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-sm transition">
            
            {/* Montant & Identité */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                {getStatusBadge(w.status)}
                <span className="font-mono text-gray-400 text-xs">Réf: {w.id.split('-')[0]}</span>
                <span className="text-gray-400 text-xs">{new Date(w.requested_at).toLocaleString('fr-FR')}</span>
              </div>
              
              <div>
                <p className="text-2xl font-black text-gray-900">{w.amount.toLocaleString('fr-FR')} FCFA</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-gray-700">{w.vendor_name}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500 font-mono">{w.vendor_phone}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{w.store_name}</span>
                </div>
              </div>

              {/* Méthode & Notes */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm mt-4 inline-block min-w-[250px]">
                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">Méthode de réception</p>
                <p className="font-mono text-gray-900 font-medium">{w.payment_method}</p>
                
                {w.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-500 mb-0.5">Note système :</p>
                    <p className={`text-xs ${w.status === 'failed' || w.status === 'rejected' ? 'text-red-600' : 'text-gray-600'}`}>
                      {w.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Administrateur */}
            {w.status === 'pending' && (
              <div className="flex flex-col gap-3 justify-center md:border-l border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-56 shrink-0">
                <button
                  onClick={() => handleApprove(w)}
                  disabled={loadingId === w.id}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                >
                  {loadingId === w.id ? 'Transfert...' : 'Approuver & Payer'}
                </button>
                <button
                  onClick={() => handleOpenReject(w)}
                  disabled={loadingId === w.id}
                  className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                >
                  Rejeter
                </button>
              </div>
            )}
            
          </div>
        ))}
      </div>

      {/* ── MODAL DE REJET ── */}
      {isRejectModalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-gray-100 bg-red-50/30 flex justify-between items-center">
               <h3 className="font-bold text-lg text-red-900">Rejeter le retrait</h3>
               <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600">✖</button>
             </div>
             
             <form onSubmit={submitReject} className="p-6 space-y-6">
               <p className="text-sm text-gray-600">
                 Vous êtes sur le point de rejeter un retrait de <strong className="text-gray-900">{selectedWithdrawal.amount.toLocaleString()} FCFA</strong> pour <strong>{selectedWithdrawal.vendor_name}</strong>. Les fonds seront retournés sur sa balance.
               </p>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Motif du rejet (Sera envoyé par WhatsApp)</label>
                 <textarea
                   required
                   rows={3}
                   className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                   placeholder="Ex: Compte non vérifié, RIB invalide, etc."
                   value={rejectReason}
                   onChange={e => setRejectReason(e.target.value)}
                 />
               </div>

               <div className="flex gap-3">
                 <button type="button" onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition">
                   Annuler
                 </button>
                 <button type="submit" disabled={loadingId === selectedWithdrawal.id || !rejectReason} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition disabled:opacity-50">
                   {loadingId === selectedWithdrawal.id ? 'Rejet...' : 'Confirmer le rejet'}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}

    </div>
  )
}
