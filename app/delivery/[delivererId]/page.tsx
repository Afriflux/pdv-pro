'use client'

import { toast } from 'sonner';

import React, { useEffect, useState } from 'react'
import { getDelivererDataAction, markOrderAsDeliveredAction } from './actions'
import { Loader2, MapPin, Phone, Package, CheckCircle2, Navigation2, Rocket, Clock } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DelivererPortal({ params }: { params: { delivererId: string } }) {
  const [deliverer, setDeliverer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'delivered'>('pending')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getDelivererDataAction(params.delivererId)
        if (res.success) {
          setDeliverer(res.deliverer)
          setOrders(res.orders)
        } else {
          setError(res.error || 'Erreur lors du chargement des données')
        }
      } catch {
        setError('Erreur réseau')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.delivererId])

  const handleDeliver = async (orderId: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation de Livraison',
      text: 'Certifiez-vous avoir bien livré ce colis ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, certifier',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#0F7A60'
    })
    if (!result.isConfirmed) return
    const res = await markOrderAsDeliveredAction(orderId, params.delivererId)
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
    } else {
      toast.error(res.error || 'Erreur')
    }
    setUpdatingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex flex-col items-center justify-center space-y-4">
         <Loader2 className="w-10 h-10 animate-spin text-[#0F7A60]" />
         <p className="text-gray-500 font-bold animate-pulse">Chargement de votre flotte...</p>
      </div>
    )
  }

  if (error || !deliverer) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex flex-col items-center justify-center p-6 text-center space-y-4">
         <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
            <Package size={32} />
         </div>
         <h1 className="text-2xl font-black text-ink">Accès Refusé</h1>
         <p className="text-slate font-medium">{error}</p>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const displayOrders = activeTab === 'pending' ? pendingOrders : deliveredOrders

  return (
    <div className="min-h-screen bg-[#f4f4f5] pb-24 font-sans">
       {/* Header */}
       <div className="bg-ink text-white p-5 pt-8 rounded-b-[32px] shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner">
               <Rocket size={24} className="text-[#0F7A60]" />
             </div>
             <div>
                <p className="text-xs uppercase font-black tracking-widest text-[#0F7A60] mb-0.5">Portail Livreur</p>
                <h1 className="text-xl font-black">{deliverer.name}</h1>
                <p className="text-xs font-medium text-cream/70 opacity-80 pt-1">Boutique: {deliverer.store.name}</p>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
             <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs text-cream uppercase font-bold mb-1">A livrer</p>
                <p className="text-2xl font-black text-white">{pendingOrders.length}</p>
             </div>
             <div className="bg-emerald/10 rounded-xl p-3 border border-emerald/20">
                <p className="text-xs text-cream uppercase font-bold mb-1">Terminées</p>
                <p className="text-2xl font-black text-[#0F7A60]">{deliveredOrders.length}</p>
             </div>
          </div>
       </div>

       {/* Tabs */}
       <div className="flex mt-6 px-4">
         <div className="bg-white/50 p-1 rounded-2xl flex w-full shadow-sm">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 text-xs uppercase font-black rounded-xl transition ${activeTab === 'pending' ? 'bg-white shadow-sm text-ink' : 'text-slate'}`}
            >
              En cours ({pendingOrders.length})
            </button>
            <button 
              onClick={() => setActiveTab('delivered')}
              className={`flex-1 py-3 text-xs uppercase font-black rounded-xl transition ${activeTab === 'delivered' ? 'bg-[#0F7A60] shadow-sm text-white' : 'text-slate'}`}
            >
              Historique ({deliveredOrders.length})
            </button>
         </div>
       </div>

       {/* List of Orders */}
       <div className="p-4 space-y-4">
         {displayOrders.length === 0 ? (
           <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-slate">
                 <CheckCircle2 size={24} />
              </div>
              <h2 className="text-lg font-black text-ink mb-1">Aucune course</h2>
              <p className="text-sm font-medium text-slate">Vous êtes à jour dans vos livraisons.</p>
           </div>
         ) : (
           displayOrders.map(order => {
             const waMsg = `Bonjour ${order.buyer_name.split(' ')[0]}, c'est ${deliverer.name}, votre livreur de ${deliverer.store.name}. Je suis en route !`
             const waUrl = `https://wa.me/${order.buyer_phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(waMsg)}`
             const navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`

             return (
               <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-line">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <span className="font-mono text-xs font-black bg-[#f4f4f5] text-slate px-2 py-1 rounded-md">
                       #{order.id.split('-')[0].toUpperCase()}
                     </span>
                     <h3 className="text-lg font-black text-ink mt-2 leading-tight">{order.buyer_name}</h3>
                     <p className="text-xs uppercase font-bold text-slate flex items-center gap-1 mt-1">
                        <Clock size={12} /> {format(new Date(order.created_at), 'dd MMM à HH:mm', { locale: fr })}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="text-xl font-black text-ink">{order.total.toLocaleString('fr-FR')}</p>
                     <p className="text-xs uppercase font-black text-slate tracking-wider">CFA À ENCAISSER</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-3 bg-[#fcfcfc] border border-line p-3 rounded-2xl mb-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                     {order.product?.images?.[0] ? (
                       <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={order.product.images[0]} alt="product" width={40} height={40} className="object-cover" />
                     ) : <Package size={16} className="text-slate" />}
                   </div>
                   <p className="text-sm font-black text-ink line-clamp-1">{order.product?.name || 'Produit'}</p>
                 </div>

                 <div className="flex items-start gap-3 mb-5 pl-1">
                   <MapPin size={16} className="text-[#0F7A60] shrink-0 mt-0.5" />
                   <div>
                     <p className="text-xs font-bold text-ink leading-snug">
                       {order.deliveryZone?.name ? <span className="text-[#0F7A60]">{order.deliveryZone?.name} — </span> : ''}
                       {order.delivery_address || 'Adresse inconnue'}
                     </p>
                   </div>
                 </div>

                 {activeTab === 'pending' ? (
                   <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-2 col-span-2">
                        <a suppressHydrationWarning href={`tel:${order.buyer_phone}`} className="flex-1 bg-ink text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm active:scale-95 transition shadow-md">
                          <Phone size={16} /> Appeler
                        </a>
                        <a suppressHydrationWarning href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm active:scale-95 transition shadow-sm">
                          WhatsApp
                        </a>
                        <a suppressHydrationWarning href={navUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#FAFAF7] border border-line text-ink py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-sm active:scale-95 transition shadow-sm">
                          <Navigation2 size={16} /> GPS
                        </a>
                      </div>
                      
                      <button 
                        disabled={updatingId === order.id}
                        onClick={() => handleDeliver(order.id)}
                        className="col-span-2 mt-2 bg-[#0F7A60] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-black text-lg active:scale-95 transition shadow-lg shadow-[#0F7A60]/20"
                      >
                        {updatingId === order.id ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> Valider Livraison</>}
                      </button>
                   </div>
                 ) : (
                   <div className="bg-emerald/10 text-[#0F7A60] font-black text-sm p-4 rounded-xl flex justify-center items-center gap-2">
                      <CheckCircle2 size={18} /> Validé par vous
                   </div>
                 )}
               </div>
             )
           })
         )}
       </div>
    </div>
  )
}
