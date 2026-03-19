/* eslint-disable react/forbid-dom-props */
'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Download, CheckSquare, Square, Filter, ChevronDown, MessageCircle, AlertCircle, Loader2 } from 'lucide-react'
import { bulkUpdateOrdersStatus } from '@/app/actions/orders'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:         { label: 'En attente',    color: 'bg-amber-100 text-amber-700' },
  paid:            { label: 'Payée',          color: 'bg-emerald-100 text-emerald-700' },
  confirmed:       { label: 'Confirmée',      color: 'bg-blue-100 text-blue-700' },
  processing:      { label: 'En préparation', color: 'bg-indigo-100 text-indigo-700' },
  shipped:         { label: 'Expédiée',      color: 'bg-purple-100 text-purple-700' },
  delivered:       { label: 'Livrée',        color: 'bg-emerald-100 text-emerald-700' },
  cancelled:       { label: 'Annulée',       color: 'bg-red-100 text-red-700' },
  completed:       { label: 'Terminée',      color: 'bg-emerald-200 text-emerald-800' },
  cod_pending:     { label: 'COD en attente', color: 'bg-orange-100 text-orange-700' },
  cod_confirmed:   { label: 'COD confirmée',  color: 'bg-emerald-100 text-emerald-700' },
  no_answer:       { label: 'Pas de réponse', color: 'bg-gray-100 text-gray-500' },
}

// Seulement les statuts manuels sélectionnables par les vendeurs
const UPDATEABLE_STATUSES = [
  { id: 'confirmed',  label: 'Confirmée' },
  { id: 'processing', label: 'En préparation' },
  { id: 'shipped',    label: 'Expédiée' },
  { id: 'delivered',  label: 'Livrée' },
  { id: 'completed',  label: 'Terminée' },
  { id: 'cancelled',  label: 'Annulée' },
  { id: 'no_answer',  label: 'Pas de réponse' }
]

interface Order {
  id: string
  buyer_name: string
  buyer_phone: string
  total: number
  status: string
  payment_method: string
  created_at: string
  product: {
    name: string
    images: string[]
  } | null
}

interface OrdersViewProps {
  initialOrders: Order[]
  storeName?: string
  storeId?: string // Nécessaire pour la Server Action
}

export default function OrdersView({ initialOrders, storeName, storeId = '' }: OrdersViewProps) {
  // États de données (pour supporter l'optimistic UI)
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  // Filtres
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all') // 'all', 'today', '7days', '30days'
  
  // Actions Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  // Mettre à jour `orders` si `initialOrders` change (props)
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // --- FILTRAGE ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Recherche texte (nom, tel, id)
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        !searchLower ||
        order.buyer_name.toLowerCase().includes(searchLower) ||
        order.buyer_phone.includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) ||
        (order.product?.name || '').toLowerCase().includes(searchLower)
      
      // 2. Filtre Statut
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      // 3. Filtre Période
      let matchesPeriod = true
      if (periodFilter !== 'all') {
        const orderDate = new Date(order.created_at).getTime()
        const now = new Date().getTime()
        const diffDays = (now - orderDate) / (1000 * 3600 * 24)

        if (periodFilter === 'today') {
          // On compare formatté au jour courant (pour éviter soucis de fuseau horaire strict)
          matchesPeriod = new Date(order.created_at).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
        } else if (periodFilter === '7days') {
          matchesPeriod = diffDays <= 7
        } else if (periodFilter === '30days') {
          matchesPeriod = diffDays <= 30
        }
      }
      
      return matchesSearch && matchesStatus && matchesPeriod
    })
  }, [orders, search, statusFilter, periodFilter])

  // --- STATISTIQUES (Sur la sélection filtrée) ---
  const stats = useMemo(() => {
    const totalCa = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)
    const nbCommandes = filteredOrders.length
    
    const countCompleted = filteredOrders.filter(o => ['completed', 'delivered'].includes(o.status)).length
    const txCompletion = nbCommandes > 0 ? Math.round((countCompleted / nbCommandes) * 100) : 0
    
    const countPending = filteredOrders.filter(o => ['pending', 'cod_pending', 'pending_payment'].includes(o.status)).length

    return { totalCa, nbCommandes, countCompleted, txCompletion, countPending }
  }, [filteredOrders])

  // --- ACTIONS BULK ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const executeBulkUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0 || !storeId) return
    
    setIsUpdating(true)
    setShowStatusMenu(false)

    try {
      const arrIds = Array.from(selectedIds)
      const res = await bulkUpdateOrdersStatus(arrIds, newStatus, storeId)
      
      if (res.success) {
        // Optimistic UI Update
        setOrders(prev => prev.map(o => 
          arrIds.includes(o.id) ? { ...o, status: newStatus } : o
        ))
        setSelectedIds(new Set()) // Reset 
        alert(`✅ ${res.updated} commande(s) mise(s) à jour en "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
      } else {
        alert(`❌ Erreur: ${res.error}`)
      }
    } catch {
      alert("Erreur lors de la mise à jour")
    } finally {
      setIsUpdating(false)
    }
  }

  // --- EXPORT CSV ---
  const exportCSV = () => {
    if (filteredOrders.length === 0) return

    const headers = ['ID', 'Date', 'Acheteur', 'Téléphone', 'Produit', 'Statut', 'Méthode Paiement', 'Montant (FCFA)']
    
    const rows = filteredOrders.map(o => [
      o.id.split('-')[0],
      new Date(o.created_at).toLocaleDateString('fr-FR'),
      `"${o.buyer_name}"`, // Quote pour éviter les pbs de virgules
      o.buyer_phone,
      `"${o.product?.name || 'Inconnu'}"`,
      STATUS_CONFIG[o.status]?.label || o.status,
      o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method,
      o.total
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `commandes_${storeName || 'boutique'}_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-24 relative min-h-screen">
      
      {/* 1. STATS RAPIDES */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
            <p className="text-xs font-black text-dust uppercase tracking-wider mb-1">💰 CA Total</p>
            <p className="font-display text-2xl font-black text-emerald">
              {stats.totalCa.toLocaleString('fr-FR')} <span className="text-sm">F</span>
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
            <p className="text-xs font-black text-dust uppercase tracking-wider mb-1">📦 Commandes</p>
            <p className="font-display text-2xl font-black text-ink">{stats.nbCommandes}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
            <p className="text-xs font-black text-dust uppercase tracking-wider mb-1">✅ Complétées</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-black text-ink">{stats.countCompleted}</p>
              <p className="text-sm font-bold text-emerald">({stats.txCompletion}%)</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
             <p className="text-xs font-black text-dust uppercase tracking-wider mb-1">⏳ En attente</p>
            <p className={`font-display text-2xl font-black ${stats.countPending > 0 ? 'text-amber-500' : 'text-slate'}`}>
              {stats.countPending}
            </p>
          </div>

        </div>
      </div>

      {/* 2. FILTRES INTELLIGENTS */}
      <div className="px-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" size={16} />
            <input 
              type="text"
              placeholder="Rechercher nom, n° téléphone, ou Commande..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-line rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald/10 focus:border-emerald transition-all outline-none shadow-sm"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {/* Filtre Période */}
            <div className="relative min-w-[140px] flex-shrink-0">
               <select 
                aria-label="Filtre par période"
                title="Filtre par période"
                value={periodFilter} 
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-line rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald/10 shadow-sm"
              >
                 <option value="all">Période: Tout</option>
                 <option value="today">Aujourd&apos;hui</option>
                 <option value="7days">7 derniers jours</option>
                 <option value="30days">30 derniers jours</option>
               </select>
               <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
            </div>

            {/* Filtre Statut */}
            <div className="relative min-w-[150px] flex-shrink-0">
               <select 
                aria-label="Filtre par statut"
                title="Filtre par statut"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-line rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald/10 shadow-sm"
              >
                 <option value="all">Statut: Tous</option>
                 {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                   <option key={key} value={key}>{config.label}</option>
                 ))}
               </select>
               <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
            </div>

            {/* Export CSV */}
            <button 
              onClick={exportCSV}
              disabled={filteredOrders.length === 0}
              className="bg-[#FAFAF7] border border-line text-ink hover:bg-white hover:border-emerald/30 font-bold px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm whitespace-nowrap disabled:opacity-50"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

        </div>
      </div>

      {/* 3. TABLEAU (LISTE COMPACTE) */}
      <div className="px-6">
        
        {/* Header colonnes (Desktop) */}
        {filteredOrders.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-[#FAFAF7] border border-line rounded-t-xl text-[10px] font-black uppercase text-dust tracking-wider">
             <div className="col-span-1 flex items-center justify-center">
               <button onClick={toggleAll} className="text-dust hover:text-ink">
                 {selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? <CheckSquare size={16}/> : <Square size={16}/>}
               </button>
             </div>
             <div className="col-span-3">Client</div>
             <div className="col-span-3">Produit</div>
             <div className="col-span-2">Date</div>
             <div className="col-span-1 text-right">Montant</div>
             <div className="col-span-1 text-center">Status</div>
             <div className="col-span-1 text-right">Action</div>
          </div>
        )}

        <div className="space-y-3 md:space-y-0 md:bg-white md:border md:border-t-0 border-line md:rounded-b-xl shadow-sm">
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <AlertCircle size={40} className="text-dust opacity-30 mb-4" />
              <p className="font-bold text-ink text-lg">Aucune commande trouvée</p>
              <p className="text-sm text-dust mt-1">Modifiez vos filtres ou effectuez une nouvelle recherche.</p>
            </div>
          ) : (
             filteredOrders.map((order) => {
               const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-500' }
               const isSelected = selectedIds.has(order.id)
               const waLink = `https://wa.me/${order.buyer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Bonjour ${order.buyer_name.split(' ')[0]}, je vous contacte au sujet de votre commande sur PDV Pro.`
               )}`

               return (
                 <div 
                  key={order.id} 
                  className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 md:items-center bg-white md:bg-transparent rounded-xl md:rounded-none border border-line md:border-0 md:border-b last:border-0 transition-colors ${isSelected ? 'bg-emerald/5 md:bg-emerald/5 border-emerald/20' : 'hover:bg-[#FAFAF7]'}`}
                >
                   
                   {/* Checkbox (Mobile + Desktop) */}
                   <div className="absolute md:relative right-4 top-4 md:right-auto md:top-auto md:col-span-1 flex items-center md:justify-center">
                      <button onClick={() => toggleSelection(order.id)} className={isSelected ? 'text-emerald' : 'text-slate hover:text-ink'}>
                        {isSelected ? <CheckSquare size={20} className="md:w-4 md:h-4"/> : <Square size={20} className="md:w-4 md:h-4"/>}
                      </button>
                   </div>

                   {/* Client */}
                   <div className="md:col-span-3 flex flex-col pt-1 md:pt-0">
                     <Link href={`/dashboard/orders/${order.id}`} className="font-bold text-ink hover:text-emerald text-sm truncate">
                        {order.buyer_name}
                     </Link>
                     <p className="text-xs text-dust">{order.buyer_phone}</p>
                   </div>

                   {/* Produit */}
                   <div className="md:col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cream flex-shrink-0 border border-line overflow-hidden hidden md:block">
                        {order.product?.images?.[0] ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={order.product!.images[0]} alt="" className="w-full h-full object-cover" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📦</div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-ink line-clamp-2 md:line-clamp-1">
                        {order.product?.name ?? '—'}
                      </p>
                   </div>

                   {/* Date */}
                   <div className="md:col-span-2 hidden md:block text-xs text-dust font-medium">
                     {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit' })}
                   </div>

                   {/* Montant */}
                   <div className="md:col-span-1 md:text-right hidden md:block">
                      <p className="font-black text-emerald text-sm">{order.total.toLocaleString('fr-FR')} F</p>
                   </div>

                   {/* Mobile Montant + Date + Status row */}
                   <div className="md:hidden flex items-center justify-between border-t border-dashed border-line pt-3 mt-1">
                      <div>
                        <p className="font-black text-emerald text-sm">{order.total.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-[10px] text-dust">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                   </div>

                   {/* Status (Desktop) */}
                   <div className="md:col-span-1 hidden md:flex items-center justify-center">
                     <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md text-center inline-block w-full ${statusConfig.color} truncate`}>
                        {statusConfig.label}
                      </span>
                   </div>

                   {/* Actions */}
                   <div className="md:col-span-1 flex items-center justify-end gap-2 md:gap-3">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 md:p-1.5 text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-lg transition"
                        title="Contacter sur WhatsApp"
                      >
                         <MessageCircle size={18} className="md:w-4 md:h-4" />
                      </a>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="p-2 md:p-1.5 text-ink bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        title="Voir détail"
                      >
                        <ArrowRight size={18} className="md:w-4 md:h-4" />
                      </Link>
                   </div>

                 </div>
               )
             })
          )}
        </div>
      </div>

      {/* 4. ACTIONS BULK (Panel Fixe en bas) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink rounded-2xl p-4 shadow-2xl flex items-center gap-6 text-white border border-white/10 animate-in slide-in-from-bottom-5">
           <div className="flex items-center gap-3 border-r border-white/20 pr-6">
             <div className="w-6 h-6 rounded-md bg-emerald flex items-center justify-center text-xs font-black">
               {selectedIds.size}
             </div>
             <span className="text-sm font-bold opacity-80 hidden sm:inline">commandes sélectionnées</span>
           </div>

           <div className="flex items-center gap-3 relative">
             <button
               onClick={() => setShowStatusMenu(!showStatusMenu)}
               disabled={isUpdating}
               className="bg-white text-ink hover:bg-cream px-4 py-2 rounded-xl text-sm font-black transition shadow-sm flex items-center gap-2"
             >
               {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Changer le statut'}
               <ChevronDown size={14} className={showStatusMenu ? "rotate-180" : ""} />
             </button>

             <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-bold text-white/50 hover:text-white underline transition"
             >
               Annuler
             </button>

             {/* Menu Doulant Status */}
             {showStatusMenu && (
               <div className="absolute bottom-full mb-3 left-0 w-48 bg-white text-ink rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 border border-line py-1">
                 {UPDATEABLE_STATUSES.map(st => (
                   <button
                     key={st.id}
                     onClick={() => executeBulkUpdate(st.id)}
                     className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-emerald/5 hover:text-emerald transition"
                   >
                     {st.label}
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      )}

    </div>
  )
}
