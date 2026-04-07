'use client'

import { useState, useEffect } from 'react'
import { Truck, Loader2 } from 'lucide-react'
import LivraisonsView from './LivraisonsView'
import { getDeliveriesDataAction } from './actions'

export default function LivraisonsDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [deliverers, setDeliverers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [store, setStore] = useState<{ id: string, name: string } | null>(null)

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const res = await getDeliveriesDataAction()
      
      if (!res.success) {
        throw new Error(res.error || 'Erreur inconnue')
      }

      setStore(res.store || null)
      setOrders(res.orders || [])
      setDeliverers(res.deliverers || [])
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#0F7A60]" />
        <p className="text-gray-500 font-medium animate-pulse">Chargement de votre station de tri logistique...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white shadow-2xl shadow-[#0F7A60]/5 sticky top-2 z-20 overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#0F7A60] to-[#0A5240] text-white flex items-center justify-center shadow-lg shadow-[#0F7A60]/20">
              <Truck size={24} className="md:w-7 md:h-7" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-ink tracking-tight">
              Centre de Livraisons
            </h1>
          </div>
          <p className="text-dust text-sm md:text-base font-medium max-w-xl pl-16 md:pl-18">
            Triez, expédiez et générez les bordereaux de vos commandes validées.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 shadow-sm">
          {error}
        </div>
      ) : (
        <LivraisonsView 
          initialOrders={orders} 
          deliverers={deliverers}
          storeName={store?.name} 
          storeId={store?.id || ''} 
        />
      )}
    </div>
  )
}

