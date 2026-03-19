'use client'

import { useState } from 'react'
import { processClosingRequest } from '@/lib/closing/closingActions'
import { toast } from 'sonner'
import { Phone as PhoneIcon, Calendar as CalendarIcon, CheckCircle2 as CheckCircleIcon, XCircle as XCircleIcon, Clock as ClockIcon } from 'lucide-react'

type ClosingRequest = {
  id: string
  orderId: string
  status: string
  createdAt: string
  callAttempts: number
  closingFee: number
  buyerName: string
  buyerPhone: string
  productName: string
  storeName: string
  orderTotal: number
  score?: {
    total_orders: number
    success_orders: number
    refused_orders: number
  } | null
}

export function ClosingView({ initialRequests }: { initialRequests: ClosingRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'VALIDATED' | 'REJECTED' | 'NO_REPLY' | 'CANCELLATION_REQUESTED') => {
    setLoading(id)
    try {
      await processClosingRequest(id, action)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r))
      toast.success(action === 'VALIDATED' ? 'Commande validée !' : 'Statut mis à jour.')
    } catch (e) {
      toast.error((e as Error).message || 'Une erreur est survenue.')
    } finally {
      setLoading(null)
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">En Attente</span>
      case 'CANCELLATION_REQUESTED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">Vérifier Annulation</span>
      case 'VALIDATED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Validé</span>
      case 'REJECTED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Rejeté / Annulé (Décharge)</span>
      case 'NO_REPLY': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Injoignable</span>
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{s}</span>
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Aucune demande de validation téléphonique pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-line text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">Confiance</th>
                  <th className="px-6 py-4">Montant COD</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{req.buyerName}</div>
                      <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        <a href={`tel:${req.buyerPhone}`} className="hover:text-primary transition-colors">{req.buyerPhone}</a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{req.productName}</div>
                      <div className="text-gray-500 text-xs">{req.storeName}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {req.score ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">{req.score.total_orders} commandes réseau</span>
                          {req.score.refused_orders > 0 ? (
                            <span className="text-xs font-semibold text-red-600">{req.score.refused_orders} refus passés ⚠️</span>
                          ) : (
                            <span className="text-xs font-semibold text-green-600">Client sérieux ✅</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Nouveau profil</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{req.orderTotal.toLocaleString('fr-FR')} FCFA</div>
                      <div className="text-xs text-gray-500">Frais d&apos;appel: -{req.closingFee} F</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(req.status === 'PENDING' || req.status === 'CANCELLATION_REQUESTED') && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, 'NO_REPLY')}
                            disabled={loading === req.id}
                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Injoignable"
                          >
                            <ClockIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'REJECTED')}
                            disabled={loading === req.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border hover:border-red-200 flex items-center gap-1"
                            title="Confirmer Décharge / Annulation"
                          >
                            <XCircleIcon className="w-4 h-4" /> <span className="text-xs">Décharge</span>
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'VALIDATED')}
                            disabled={loading === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-gray-800 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            {loading === req.id ? '...' : 'Valider'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
