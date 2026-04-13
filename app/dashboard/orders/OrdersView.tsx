/* eslint-disable react/forbid-dom-props */
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Download, CheckSquare, Square, ChevronDown, Loader2, LayoutGrid, List as ListIcon, Clock as ClockIcon, Phone as PhoneIcon, PackageOpen, ArrowRight, Filter } from 'lucide-react'
import Image from 'next/image'
import { bulkUpdateOrdersStatus } from '@/app/actions/orders'
import { OrderDetailsDrawer } from './OrderDetailsDrawer'

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
    id: string
    name: string
    images: string[]
    type: string
    price: number
  } | null
  delivery_address?: string
  subtotal?: number
  platform_fee?: number
  vendor_amount?: number
  payment_ref?: string
  variant?: {
    value_1: string | null
    value_2: string | null
    dimension_1: string | null
    dimension_2: string | null
  } | null
  invoices?: { pdf_url: string }[] | null
}

interface OrdersViewProps {
  initialOrders: Order[]
  storeName?: string
  storeId?: string // Nécessaire pour la Server Action
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}

const KANBAN_COLUMNS = [
  { id: 'pending', label: 'Nouveau', statuses: ['pending', 'cod_pending', 'pending_payment'] },
  { id: 'confirmed', label: 'Confirmé', statuses: ['confirmed'] },
  { id: 'processing', label: 'En Préparation', statuses: ['processing'] },
  { id: 'shipped', label: 'Expédié', statuses: ['shipped'] },
  { id: 'delivered', label: 'Livré / Terminé', statuses: ['delivered', 'cod_confirmed', 'completed'] }
]

export default function OrdersView({ initialOrders, storeName, storeId = '' }: OrdersViewProps) {
  // États de données (pour supporter l'optimistic UI)
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  // Filtres
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all') // 'all', 'today', '7days', '30days'
  
  // UI & Views
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
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
        
        // Update selectedOrder if it's currently open in the Drawer
        if (selectedOrder && arrIds.includes(selectedOrder.id)) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
        
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          
          <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F7A60]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#0F7A60]/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col">
              <p className="text-xs font-black text-[#0F7A60] uppercase tracking-wider mb-2">💰 CA Total</p>
              <p className="font-display text-xl lg:text-3xl font-black text-[#1A1A1A]">
                {stats.totalCa.toLocaleString('fr-FR')} <span className="text-base text-gray-400">F</span>
              </p>
            </div>
          </div>
          
          <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col">
              <p className="text-xs font-black text-blue-500 uppercase tracking-wider mb-2">📦 Commandes</p>
              <p className="font-display text-xl lg:text-3xl font-black text-[#1A1A1A]">{stats.nbCommandes}</p>
            </div>
          </div>
          
          <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col">
              <p className="text-xs font-black text-purple-500 uppercase tracking-wider mb-2">✅ Complétées</p>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-xl lg:text-3xl font-black text-[#1A1A1A]">{stats.countCompleted}</p>
                <p className="text-sm font-bold text-gray-400">({stats.txCompletion}%)</p>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#C9A84C]/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col">
              <p className="text-xs font-black text-[#C9A84C] uppercase tracking-wider mb-2">⏳ En attente</p>
              <p className={`font-display text-xl lg:text-3xl font-black ${stats.countPending > 0 ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                {stats.countPending}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. FILTRES INTELLIGENTS & TOGGLE VUE */}
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

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            
            {/* Toggle View */}
            <div className="flex items-center bg-[#FAFAF7] border border-line rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white shadow-sm text-ink' : 'text-slate hover:text-ink'}`}
              >
                <ListIcon size={14} /> Liste
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'board' ? 'bg-white shadow-sm text-ink' : 'text-slate hover:text-ink'}`}
              >
                <LayoutGrid size={14} /> Kanban
              </button>
            </div>

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

      {/* 3. VUES (LISTE OU KANBAN) */}
      <div className="px-6">
        
        {viewMode === 'list' ? (
          <>
            {/* VUE TABLEAU DE BORD (DATA-GRID) */}
            <div className="bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-gray-200/50 rounded-[32px] overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#FAFAF7] border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-5 w-10 text-center">
                      <button onClick={toggleAll} className={`text-slate hover:text-[#1A1A1A] transition-colors ${selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? 'text-[#0F7A60]' : ''}`} title="Tout sélectionner">
                        {selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? <CheckSquare size={16} className="text-[#0F7A60]" /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="px-5 py-5">Commande</th>
                    <th className="px-5 py-5">Client</th>
                    <th className="px-5 py-5">Produit & Montant</th>
                    <th className="px-5 py-5">Statut</th>
                    <th className="px-5 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#0F7A60]/10 to-transparent rounded-full flex items-center justify-center mb-6 relative">
                          <div className="absolute inset-0 bg-[#0F7A60]/20 blur-xl rounded-full animate-pulse" />
                          <PackageOpen size={48} className="text-[#0F7A60] relative z-10 drop-shadow-md" />
                        </div>
                        <p className="font-display font-black text-ink text-2xl uppercase tracking-tight mb-2">Aucune commande</p>
                        <p className="text-sm font-medium text-slate text-center">
                          Modifiez vos filtres ou effectuez une nouvelle recherche. Si vous venez de lancer votre boutique, partagez votre lien pour obtenir votre première vente !
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-500' }
                    const isSelected = selectedIds.has(order.id)
                    const isPendingUrgent = ['pending', 'cod_pending'].includes(order.status) && (new Date().getTime() - new Date(order.created_at).getTime() > 24 * 60 * 60 * 1000)
                    
                    const waLink = `https://wa.me/${order.buyer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                     `Bonjour ${order.buyer_name.split(' ')[0]}, je vous contacte au sujet de votre commande sur Yayyam.`
                    )}`

                    const getTimeAgo = (dateStr: string) => {
                      const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
                      if (diffMins < 60) return `${diffMins || 1} min`
                      const diffHours = Math.floor(diffMins / 60)
                      if (diffHours < 24) return `${diffHours}h`
                      const diffDays = Math.floor(diffHours / 24)
                      if (diffDays === 1) return `Hier`
                      return `${diffDays} jrs`
                    }

                    return (
                      <tr 
                        key={order.id} 
                        className={`group cursor-pointer transition-colors ${isSelected ? 'bg-[#0F7A60]/5' : 'hover:bg-gray-50/50'}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-5 py-4 w-10 text-center" onClick={(e) => { e.stopPropagation(); toggleSelection(order.id) }}>
                          <button className={`transition-colors ${isSelected ? 'text-[#0F7A60]' : 'text-gray-400 hover:text-[#1A1A1A]'}`}>
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1A1A1A] bg-gray-100 px-2.5 py-1 rounded-lg">#{order.id.split('-')[0].toUpperCase()}</span>
                            {isPendingUrgent && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="En attente depuis +24h" />}
                          </div>
                          <div className="text-xs uppercase font-bold text-gray-400 mt-2 flex items-center gap-1.5 tracking-wider">
                            <ClockIcon size={12} /> {getTimeAgo(order.created_at)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-black text-[#1A1A1A] text-[15px]">{order.buyer_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a suppressHydrationWarning href={`tel:${order.buyer_phone}`} onClick={e => e.stopPropagation()} className="font-mono text-xs text-gray-500 hover:text-[#0F7A60] font-bold flex items-center gap-1.5 bg-gray-100 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"><PhoneIcon size={12}/>{order.buyer_phone}</a>
                              <a suppressHydrationWarning href={waLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-[#25D366] to-[#1EBE5C] px-2.5 py-1 font-bold text-xs rounded-md shadow-sm shadow-[#25D366]/20 transition-transform active:scale-95 hover:shadow-md" title="WhatsApp">
                                <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden hidden sm:flex items-center justify-center shrink-0">
                              {order.product?.images?.[0] ? (
                                <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={order.product.images[0]} alt={order.product?.name || "Image produit"} fill className="object-cover" unoptimized />
                              ) : (
                                <span className="text-gray-300 text-xs">📦</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 min-w-[120px]">
                              <span className="font-black text-[#0F7A60] text-sm">{order.total.toLocaleString('fr-FR')} F</span>
                              <span className="text-xs font-bold text-gray-500 truncate max-w-[160px]" title={order.product?.name ?? ''}>{order.product?.name ?? '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest ${statusConfig.color} shadow-sm border border-black/5`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                             className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1A1A1A] rounded-xl transition-all ml-auto hover:shadow-sm"
                             title="Voir détail"
                           >
                             <ArrowRight size={14} />
                           </button>
                        </td>
                      </tr>
                    )
                  })
                )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* VUE KANBAN (BOARD) */
          <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
            {KANBAN_COLUMNS.map(column => {
              const columnOrders = filteredOrders.filter(o => column.statuses.includes(o.status))
              
              const handleDrop = async (e: React.DragEvent) => {
                e.preventDefault()
                const orderId = e.dataTransfer.getData('orderId')
                if (!orderId || !storeId) return
                
                const orderIndex = orders.findIndex(o => o.id === orderId)
                if (orderIndex === -1) return
                if (column.statuses.includes(orders[orderIndex].status)) return // Already in this column
                
                // Optimistic UI Update -> on déplace vers le 1er status de la colonne cible (ex: pending, confirmed, processing, shipped, delivered)
                const newStatus = column.statuses[0]
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
                
                // Background Call
                await bulkUpdateOrdersStatus([orderId], newStatus, storeId)
              }

              return (
                <div 
                  key={column.id} 
                  className="flex-shrink-0 w-80 bg-[#FAFAF7] border border-line rounded-2xl flex flex-col h-[70vh]"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-line flex items-center justify-between bg-white rounded-t-2xl shadow-sm">
                    <h3 className="font-black text-ink text-sm uppercase tracking-tight">{column.label}</h3>
                    <span className="bg-cream text-slate text-xs font-bold px-2 py-1 rounded-lg">{columnOrders.length}</span>
                  </div>
                  
                  {/* Column Body / Cards */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {columnOrders.map(order => {
                      const isPendingUrgent = ['pending', 'cod_pending'].includes(order.status) && (new Date().getTime() - new Date(order.created_at).getTime() > 24 * 60 * 60 * 1000)
                      return (
                        <div 
                          key={order.id}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('orderId', order.id)
                            e.currentTarget.classList.add('opacity-50', 'ring-2', 'ring-emerald')
                          }}
                          onDragEnd={e => {
                            e.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-emerald')
                          }}
                          onClick={() => setSelectedOrder(order)}
                          className={`bg-white p-4 rounded-xl shadow-sm border ${isPendingUrgent ? 'border-red-200' : 'border-line'} hover:shadow-md hover:border-emerald/30 transition-all cursor-grab active:cursor-grabbing relative group`}
                        >
                          {isPendingUrgent && (
                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="En attente depuis +24h" />
                          )}
                          <p className="text-xs font-black text-slate uppercase tracking-wider mb-1">
                            #{order.id.split('-')[0]}
                          </p>
                          <p className="font-bold text-ink text-sm mb-1">{order.buyer_name}</p>
                          <p className="text-xs text-dust mb-3">{order.product?.name ?? '—'}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/50">
                            <span className="font-black text-emerald text-sm">{order.total.toLocaleString('fr-FR')} F</span>
                            <span className="text-xs uppercase font-bold text-dust">
                              {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. TIREUR DE DÉTAILS (SLIDE-OVER) */}
      <OrderDetailsDrawer 
        isOpen={!!selectedOrder} 
        order={selectedOrder} 
        onClose={() => {
          setSelectedOrder(null)
          // Mettre un refresh si on veut s'assurer des modifs, mais optimistic UI s'en charge.
        }} 
      />

      {/* 5. ACTIONS BULK (Panel Fixe en bas) */}
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
