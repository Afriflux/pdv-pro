'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, Package, CheckCircle2, MapPin, Loader2, ArrowRightCircle } from 'lucide-react'

// Configuration des badges par statut
const STATUS_CONFIG: Record<string, { label: string, color: string, badgeBg: string }> = {
  confirmed: { label: 'Confirmée', color: 'text-amber-600', badgeBg: 'bg-amber-100 border-amber-200' },
  preparing: { label: 'En préparation', color: 'text-blue-600', badgeBg: 'bg-blue-100 border-blue-200' },
  shipped: { label: 'Expédiée', color: 'text-purple-600', badgeBg: 'bg-purple-100 border-purple-200' },
  delivered: { label: 'Livrée', color: 'text-[#0F7A60]', badgeBg: 'bg-emerald/20 border-emerald/30' },
}

export default function LivraisonsDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer la boutique
      const { data: store, error: storeError } = await supabase
        .from('Store')
        .select('id')
        .eq('vendor_id', user.id)
        .single()

      if (storeError) throw new Error('Boutique introuvable')

      // Récupérer les commandes avec les statuts pertinents
      const { data: ordersData, error: ordersError } = await supabase
        .from('Order')
        .select('id, created_at, buyer_name, delivery_address, delivery_zone_id, status, total, deliveryZone:DeliveryZone(name)')
        .eq('store_id', store.id)
        .in('status', ['confirmed', 'preparing', 'shipped'])
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      setOrders(ordersData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Obtenir le statut suivant logique
  const getNextStatus = (currentStatus: string) => {
    if (currentStatus === 'confirmed') return 'preparing'
    if (currentStatus === 'preparing') return 'shipped'
    if (currentStatus === 'shipped') return 'delivered'
    return null
  }

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus)
    if (!nextStatus) return

    setUpdatingId(orderId)
    setError('')

    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, new_status: nextStatus })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Si le nouveau statut est 'delivered', on l'enlève de la liste (ou on le garde selon le choix. Ici, on demande de récupérer confirmed, preparing, shipped)
      if (nextStatus === 'delivered') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#0F7A60]" />
        <p className="text-gray-500 font-medium animate-pulse">Chargement de vos expéditions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-[#0F7A60]" />
            Suivi des Expéditions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez la préparation et l'expédition de vos commandes physiques en temps réel.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {orders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Package className="w-10 h-10" />
            </div>
            <p className="font-black text-gray-900 text-xl">Aucune livraison en cours</p>
            <p className="text-gray-500 text-sm mt-2 max-w-sm">
              Vous n'avez actuellement aucune commande confirmée, en préparation ou expédiée.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-500">
                  <th className="p-5 font-black">Commande</th>
                  <th className="p-5 font-black">Client & Adresse</th>
                  <th className="p-5 font-black">Statut Actuel</th>
                  <th className="p-5 font-black text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed
                  const nextStatus = getNextStatus(order.status)
                  const nextStatusConf = nextStatus ? STATUS_CONFIG[nextStatus] : null
                  const zone = Array.isArray(order.deliveryZone) ? order.deliveryZone[0] : order.deliveryZone

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Commande Info */}
                      <td className="p-5">
                        <p className="font-mono font-black text-gray-900">
                          #{order.id.split('-')[0].toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-2">
                          {order.total?.toLocaleString('fr-FR')} FCFA
                        </p>
                      </td>

                      {/* Client Info */}
                      <td className="p-5">
                        <p className="font-bold text-gray-900">{order.buyer_name}</p>
                        <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-600 max-w-[250px]">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            {zone && <span className="font-bold block text-gray-800">{zone.name}</span>}
                            <span className="truncate block mt-0.5">{order.delivery_address || 'Aucune adresse'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Statut Badge */}
                      <td className="p-5">
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider inline-flex items-center gap-2 ${statusConf.badgeBg} ${statusConf.color}`}>
                          <span className={`w-2 h-2 rounded-full bg-current ${order.status !== 'delivered' ? 'animate-pulse' : ''}`}></span>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="p-5 text-center">
                        {nextStatusConf ? (
                          <button
                            onClick={() => handleUpdateStatus(order.id, order.status)}
                            disabled={updatingId === order.id}
                            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                              ${updatingId === order.id 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-[#0F7A60] hover:text-[#0F7A60] active:scale-95'
                              }`}
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                Passer en '{nextStatusConf.label}' <ArrowRightCircle className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 text-sm font-black text-[#0F7A60] bg-emerald/10 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 mr-1" /> Terminé
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
