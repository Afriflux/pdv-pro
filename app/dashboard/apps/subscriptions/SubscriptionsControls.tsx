'use client'

import React, { useState } from 'react'
import { Repeat, XCircle, Users, Activity, ExternalLink, Calendar, Search } from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cancelSubscriptionAction } from './actions'
import Link from 'next/link'

interface SubscriptionOrder {
  id: string
  buyer_name: string
  buyer_email: string | null
  buyer_phone: string
  total: number
  created_at: Date
  next_billing_at: Date | null
  product: { name: string, recurring_interval?: string | null }
}

interface Props {
  subscriptions: SubscriptionOrder[]
}

export default function SubscriptionsControls({ subscriptions }: Props) {
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Calculate MRR (Monthly Recurring Revenue)
  // Simple heuristic: If recurring_interval is "month", add total. If "year", add total/12. If "week", add total*4.
  const mrr = subscriptions.reduce((acc, sub) => {
    const val = sub.total
    const interval = sub.product.recurring_interval
    if (interval === 'year') return acc + (val / 12)
    if (interval === 'week') return acc + (val * 4)
    return acc + val // default to month
  }, 0)

  // Statistiques
  
  const overdueBilling = subscriptions.filter(s => s.next_billing_at && isPast(new Date(s.next_billing_at)))

  const filteredSubs = subscriptions.filter(s => {
    if (!search) return true
    const term = search.toLowerCase()
    return s.buyer_name.toLowerCase().includes(term) || s.product.name.toLowerCase().includes(term)
  })

  const handleCancel = async (id: string) => {
    // eslint-disable-next-line no-alert
    if(!confirm("Êtes-vous sûr de vouloir annuler de force cet abonnement ? Le client ne sera plus relancé.")) return
    setCancelingId(id)
    await cancelSubscriptionAction(id)
    setCancelingId(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price).replace('XOF', 'FCFA')
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-blue-50 shrink-0">
              <Repeat size={32} className="text-blue-500 max-w-full drop-shadow-sm" />
           </div>
           <div>
              <h2 className="text-xl font-black text-blue-950 flex items-center gap-2">
                Abonnements & SaaS
              </h2>
              <p className="text-sm font-medium text-blue-900/80 mt-1 max-w-lg leading-relaxed">
                Suivez votre MRR (Revenu Mensuel Récurrent), gérez vos membres actifs et suivez vos encaissements programmés.
              </p>
           </div>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="col-span-1 md:col-span-2 bg-gray-900 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
            <p className="text-xs uppercase font-black tracking-wider text-gray-400">MRR (Revenu Mensuel)</p>
            <h3 className="text-xl lg:text-3xl font-black mt-2 leading-none">{formatPrice(mrr)}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-300">
              <Activity size={16} className="text-emerald-400" /> Vos revenus sont prédictibles.
            </div>
         </div>
         <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs uppercase font-black text-gray-400 tracking-wider">Abonnés Actifs</p>
            <h3 className="text-4xl font-black text-gray-900 mt-2 leading-none">{subscriptions.length}</h3>
            <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <Users size={14} /> Total clients
            </div>
         </div>
         <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs uppercase font-black text-rose-400 tracking-wider">En Retard</p>
            <h3 className="text-4xl font-black text-rose-600 mt-2 leading-none">{overdueBilling.length}</h3>
            <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <Calendar size={14} /> Paiements échus
            </div>
         </div>
      </div>

      {/* LISTE DES ABONNEMENTS */}
      <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Membres Actifs</h3>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un abonné ou produit..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
         </div>

         <div className="overflow-x-auto">
           {filteredSubs.length === 0 ? (
             <div className="p-16 text-center text-gray-500">
               <Repeat size={32} className="mx-auto mb-3 text-gray-300" />
               <p className="font-medium text-sm">Aucun abonnement actif trouvé.</p>
             </div>
           ) : (
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-gray-50 text-xs font-black uppercase tracking-wider text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Client</th>
                   <th className="px-6 py-4">Forfait / Produit</th>
                   <th className="px-6 py-4">Tarif</th>
                   <th className="px-6 py-4">Prochain Échéancier</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredSubs.map(s => {
                   const isDelayed = s.next_billing_at && isPast(new Date(s.next_billing_at))
                   const isSoon = s.next_billing_at && differenceInDays(new Date(s.next_billing_at), new Date()) <= 7 && !isPast(new Date(s.next_billing_at))

                   return (
                     <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{s.buyer_name}</div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{s.buyer_phone}</div>
                          <Link href={`/dashboard/orders/${s.id}`} className="text-xs text-blue-500 font-black flex items-center gap-1 mt-1 hover:underline">
                            Voir commande originelle <ExternalLink size={10} />
                          </Link>
                       </td>
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{s.product.name}</div>
                          <div className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase font-black tracking-widest inline-block mt-1">
                            Cycle : {s.product.recurring_interval || 'Mois'}
                          </div>
                       </td>
                       <td className="px-6 py-4 font-black text-gray-900">
                          {formatPrice(s.total)}
                       </td>
                       <td className="px-6 py-4">
                          {s.next_billing_at ? (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                              isDelayed ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              isSoon ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              <Calendar size={12} />
                              {format(new Date(s.next_billing_at), 'dd MMM yyyy', { locale: fr })}
                              {isDelayed && ' (En Retard)'}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Non défini</span>
                          )}
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleCancel(s.id)}
                            disabled={cancelingId === s.id}
                            className="text-xs font-bold text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5"
                          >
                            {cancelingId === s.id ? <Activity size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Désabonner
                          </button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           )}
         </div>
      </div>
    </div>
  )
}
