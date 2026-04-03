'use client'

import { useState } from 'react'
import { Search, Filter, ArrowUpDown, ExternalLink, Package, Calendar, Tag, CheckCircle2, Clock, XCircle, AlertTriangle, Truck } from 'lucide-react'

// --- Types ---
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

interface OrderRow {
  id: string
  created_at: string
  total: number
  affiliate_amount: number | null
  status: OrderStatus
  Product?: { name: string } | null
}

interface SalesClientProps {
  orders: OrderRow[]
}

// --- Status Badge Helper ---
function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'delivered':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-full border border-emerald-200"><CheckCircle2 size={14} /> Livré & Payé</span>
    case 'confirmed':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-bold text-[12px] rounded-full border border-blue-200"><Clock size={14} /> Validé</span>
    case 'shipped':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-[12px] rounded-full border border-indigo-200"><Truck size={14} /> En Expédition</span>
    case 'pending':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-bold text-[12px] rounded-full border border-amber-200"><AlertTriangle size={14} /> En Attente COD</span>
    case 'cancelled':
    case 'returned':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 font-bold text-[12px] rounded-full border border-red-200"><XCircle size={14} /> Annulé/Retourné</span>
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 font-bold text-[12px] rounded-full border border-gray-200">{status}</span>
  }
}

export default function SalesClient({ orders }: SalesClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const safeOrders = orders || []

  const filteredOrders = safeOrders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.Product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Statistiques rapides
  const totalSalesCount = safeOrders.length
  const totalCommissionPotentielle = safeOrders.reduce((sum, o) => sum + (o.affiliate_amount || 0), 0)
  const totalCommissionValidee = safeOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.affiliate_amount || 0), 0)

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700">
      
      {/* 🌟 STATS RAPIDES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 mb-4">
            <Package size={22} />
          </div>
          <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Ventes</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-900">{totalSalesCount}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-4">
            <Clock size={22} />
          </div>
          <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gains Potentiels</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-900">{totalCommissionPotentielle.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm shadow-emerald-900/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-4 relative z-10">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-[13px] font-bold text-emerald-900/60 uppercase tracking-widest mb-1 relative z-10">Gains Sécurisés (Livrés)</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-3xl font-black text-emerald-900">{totalCommissionValidee.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></h3>
          </div>
        </div>
      </div>

      {/* 🌟 FILTRES & RECHERCHE */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher par ID ou Produit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrer par statut"
                className="w-full appearance-none pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="all">Tous les statuts</option>
                <option value="delivered">Livré & Payé</option>
                <option value="confirmed">Validé</option>
                <option value="pending">En attente (COD)</option>
                <option value="cancelled">Annulé/Retourné</option>
              </select>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                <Filter size={16} />
              </div>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                <ArrowUpDown size={14} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🌟 TABLEAU DES VENTES */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-400 mb-6 border border-gray-100">
              <Package size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Aucune vente trouvée</h3>
            <p className="text-gray-500 font-medium">Continuez à promouvoir vos liens pour générer vos premières commissions !</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-5 text-[12px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">ID Commande</th>
                  <th className="px-6 py-5 text-[12px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Produit</th>
                  <th className="px-6 py-5 text-[12px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="px-6 py-5 text-[12px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Commission</th>
                  <th className="px-6 py-5 text-[12px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Statut Vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">#{order.id.split('-')[0].toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 max-w-[200px] sm:max-w-xs transition-all">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                          <Tag size={18} className="text-gray-400" />
                        </div>
                        <span className="text-[14px] font-bold text-gray-700 truncate">{order.Product?.name || 'Produit Inconnu'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[14px] font-medium text-gray-500">
                        <Calendar size={14} />
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[15px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        +{(order.affiliate_amount || 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(order.status)}
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
