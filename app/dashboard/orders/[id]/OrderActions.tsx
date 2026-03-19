'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus } from '@/app/actions/orders'
import { Check, Package, Truck, Home, CreditCard, X, Loader2, Receipt, type LucideIcon } from 'lucide-react'

const STATUS_ACTIONS: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  confirmed:     { label: 'Confirmer la commande',  color: 'bg-emerald hover:bg-emerald-rich text-white', icon: Check },
  shipped:       { label: 'Marquer comme expédiée',  color: 'bg-blue-600 hover:bg-blue-700 text-white', icon: Truck },
  delivered:     { label: 'Confirmer la livraison', color: 'bg-emerald hover:bg-emerald-rich text-white', icon: Home },
  cod_confirmed: { label: 'Confirmer Paiement COD', color: 'bg-gold hover:bg-yellow-600 text-white', icon: CreditCard },
  completed:     { label: 'Archiver la commande',   color: 'bg-emerald hover:bg-emerald-rich text-white', icon: Package },
  cancelled:     { label: 'Annuler la commande',    color: 'bg-red-500 hover:bg-red-600 text-white', icon: X },
}

interface OrderActionsProps {
  orderId: string
  currentStatus: string
  availableTransitions: string[]
  isCod: boolean
  invoiceUrl?: string
}

export function OrderActions({ orderId, currentStatus, availableTransitions, isCod, invoiceUrl }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading]         = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [showCancel, setShowCancel]   = useState(false)

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(newStatus)
    setError(null)

    try {
      const res = await updateOrderStatus(orderId, newStatus)
      if (!res.success) {
        setError('Erreur lors de la mise à jour.')
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setLoading(null)
    }
  }

  // Filtrer les transitions
  const mainTransitions  = availableTransitions.filter(s => s !== 'cancelled')
  const canCancel        = availableTransitions.includes('cancelled')

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-line">
      <h2 className="font-display font-black text-ink text-lg uppercase tracking-tight">Actions de statut</h2>
      
      {invoiceUrl && (
        <a 
          href={invoiceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition border border-slate-200 text-sm"
        >
          <Receipt size={20} />
          Télécharger la facture PDF
        </a>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 font-bold">
          {error}
        </div>
      )}

      {/* COD info message */}
      {(isCod && currentStatus === 'delivered') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
          <p className="font-black uppercase tracking-wide">💵 Paiement à la livraison</p>
          <p>Confirmez que vous avez reçu l&apos;argent avant de clôturer. La commission sera alors validée.</p>
        </div>
      )}
      
      {(isCod && currentStatus === 'pending') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
          <p className="font-black uppercase tracking-wide">ℹ️ Commande COD</p>
          <p>Contactez le client pour valider l&apos;adresse avant de confirmer.</p>
        </div>
      )}

      {/* Transitions principales */}
      {mainTransitions.length > 0 && (
        <div className="grid gap-3">
          {mainTransitions.map(s => {
            const action = STATUS_ACTIONS[s]
            if (!action) return null
            const Icon = action.icon
            return (
              <button
                key={s}
                onClick={() => handleUpdateStatus(s)}
                disabled={loading !== null}
                className={`w-full flex items-center justify-center gap-2 ${action.color} disabled:opacity-50 font-bold py-4 rounded-2xl transition shadow-lg shadow-emerald/10 text-sm`}
              >
                {loading === s ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Icon size={20} />
                )}
                {action.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Bouton Annulation */}
      {canCancel && !showCancel && (
        <button
          onClick={() => setShowCancel(true)}
          className="w-full border-2 border-red-50 text-red-500 hover:bg-red-50 font-bold py-3.5 rounded-2xl transition-colors text-sm"
        >
          Annuler la commande
        </button>
      )}

      {/* Confirmation Annulation */}
      {showCancel && (
        <div className="border-2 border-red-100 rounded-2xl p-5 space-y-4 bg-red-50/30">
          <div className="text-center">
            <p className="text-sm text-red-700 font-black uppercase">Confirmer l&apos;annulation ?</p>
            <p className="text-xs text-red-600/80 mt-1 font-medium">Cette action est irréversible.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancel(false)}
              className="flex-1 bg-white border border-line text-slate py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
            >
              Retour
            </button>
            <button
              onClick={() => { setShowCancel(false); handleUpdateStatus('cancelled') }}
              disabled={loading !== null}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
            >
              {loading === 'cancelled' ? 'Annulation…' : 'Oui, annuler'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
