'use client'

import { toast } from 'sonner';

import { useState, useMemo, useEffect } from 'react'
import { Search, Download, CheckSquare, Square, ChevronDown, Loader2, MapPin, Phone as PhoneIcon, Clock as ClockIcon, Package, Target, ClipboardList, LayoutGrid, List as ListIcon, ArrowRightCircle, CheckCircle2, Users, Rocket, X, Link as LinkIcon, Trash2, UserPlus } from 'lucide-react'
import Image from 'next/image'
import { bulkUpdateOrdersStatus } from '@/app/actions/orders'
import { assignDelivererToOrderAction, createDelivererAction, deleteDelivererAction } from './actions'

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeBg: string }> = {
  confirmed: { label: 'Confirmée', color: 'text-amber-600', badgeBg: 'bg-amber-100 border-amber-200' },
  preparing: { label: 'En préparation', color: 'text-blue-600', badgeBg: 'bg-blue-100 border-blue-200' },
  shipped: { label: 'Expédiée', color: 'text-purple-600', badgeBg: 'bg-purple-100 border-purple-200' },
  delivered: { label: 'Livrée', color: 'text-[#0F7A60]', badgeBg: 'bg-emerald/20 border-emerald/30' },
}

// Les statuts sélectionnables pour la progression logistique
const UPDATEABLE_STATUSES = [
  { id: 'preparing', label: 'En préparation' },
  { id: 'shipped', label: 'Expédiée' },
  { id: 'delivered', label: 'Livrée' },
  { id: 'cancelled', label: 'Retournée / Annulée' }
]

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}

interface DeliveryOrder {
  id: string
  created_at: string
  buyer_name: string
  buyer_phone: string
  delivery_address: string
  delivery_zone_id: string | null
  deliverer_id?: string | null
  status: string
  total: number
  deliveryZone?: { name: string } | null
  product?: { name: string, images: string[] } | null
  deliverer?: { id: string, name: string, phone: string } | null
}

export default function LivraisonsView({ storeId, storeName, initialOrders, deliverers: initialDeliverers }: { storeId: string, storeName?: string, initialOrders: DeliveryOrder[], deliverers: Array<{id: string, name: string, phone: string}> }) {
  const [orders, setOrders] = useState<DeliveryOrder[]>(initialOrders)
  const [deliverers, setDeliverers] = useState<Array<{id: string, name: string, phone: string}>>(initialDeliverers)

  // Mods Flotte & Livraison
  const [showDeliverersModal, setShowDeliverersModal] = useState(false)
  const [isDeliveryMode, setIsDeliveryMode] = useState(false)
  const [deliveryModeTab, setDeliveryModeTab] = useState<'pending' | 'delivered'>('pending')
  const [newDelivererName, setNewDelivererName] = useState('')
  const [newDelivererPhone, setNewDelivererPhone] = useState('')
  const [newDelivererExpiration, setNewDelivererExpiration] = useState<string>('definitif')
  const [isCreatingDeliverer, setIsCreatingDeliverer] = useState(false)

  // Filtres
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL', 'confirmed', 'preparing', 'shipped'
  
  // Vues
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')

  // Actions Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // --- FILTRAGE ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Recherche
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        !searchLower ||
        order.buyer_name.toLowerCase().includes(searchLower) ||
        (order.buyer_phone && order.buyer_phone.includes(searchLower)) ||
        order.id.toLowerCase().includes(searchLower) ||
        (order.product?.name || '').toLowerCase().includes(searchLower)
      
      // 2. Filtre Onglet
      const matchesTab = activeTab === 'ALL' || order.status === activeTab
      
      return matchesSearch && matchesTab
    })
  }, [orders, search, activeTab])

  // --- STATISTIQUES ---
  const stats = useMemo(() => {
    const list = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    const nbConfirmed = list.filter(o => o.status === 'confirmed').length
    const nbPreparing = list.filter(o => o.status === 'preparing').length
    const nbShipped = list.filter(o => o.status === 'shipped').length
    const totalActive = list.length

    return { nbConfirmed, nbPreparing, nbShipped, totalActive }
  }, [orders])

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

  // --- ACTIONS SIMPLES ---
  const getNextStatus = (currentStatus: string): string | null => {
    if (currentStatus === 'confirmed') return 'preparing'
    if (currentStatus === 'preparing') return 'shipped'
    if (currentStatus === 'shipped') return 'delivered'
    return null
  }

  const handleSingleUpdate = async (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus)
    if (!nextStatus || !storeId) return

    setIsUpdating(true)
    try {
      const res = await bulkUpdateOrdersStatus([orderId], nextStatus, storeId)
      if (res.success) {
        if (nextStatus === 'delivered' || nextStatus === 'cancelled') {
           setOrders(prev => prev.filter(o => o.id !== orderId))
        } else {
           setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
        }
      } else {
        toast.error(`❌ Erreur: ${res.error}`)
      }
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssignDeliverer = async (orderId: string, delivererId: string) => {
    try {
      if (!storeId) return
      const assignedId = delivererId === 'none' ? null : delivererId
      const res = await assignDelivererToOrderAction(orderId, assignedId)
      if (res.success) {
        const assignedDeliverer = deliverers.find(d => d.id === assignedId) || null
        setOrders(prev => prev.map(o => {
           if (o.id === orderId) {
             return { ...o, deliverer_id: assignedId, deliverer: assignedDeliverer }
           }
           return o
        }))
      }
    } catch (_e) {
      toast.error('Erreur assignation livreur')
    }
  }

  const handleCreateDeliverer = async () => {
    if (!newDelivererName || !newDelivererPhone) return
    setIsCreatingDeliverer(true)
    const res = await createDelivererAction(newDelivererName, newDelivererPhone, newDelivererExpiration)
    if (res.success && res.deliverer) {
      setDeliverers(prev => [res.deliverer, ...prev])
      setNewDelivererName('')
      setNewDelivererPhone('')
      setNewDelivererExpiration('definitif')
    } else {
      toast.error(`Erreur: ${res.error}`)
    }
    setIsCreatingDeliverer(false)
  }

  const handleDeleteDeliverer = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm("Supprimer ce livreur ? Il n'aura plus accès aux commandes assignées.")) return
    const res = await deleteDelivererAction(id)
    if (res.success) {
      setDeliverers(prev => prev.filter(d => d.id !== id))
    }
  }

  const copyMagicLink = (delivererId: string) => {
    const link = `${window.location.origin}/delivery/${delivererId}`
    navigator.clipboard.writeText(link)
    toast("Lien copié ! Vous pouvez l'envoyer au livreur sur WhatsApp.")
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
        if (newStatus === 'delivered' || newStatus === 'cancelled') {
           setOrders(prev => prev.filter(o => !arrIds.includes(o.id)))
        } else {
           setOrders(prev => prev.map(o => arrIds.includes(o.id) ? { ...o, status: newStatus } : o))
        }
        setSelectedIds(new Set()) // Reset 
        toast.success(`✅ ${res.updated} colis mis à jour en "${UPDATEABLE_STATUSES.find(s=>s.id === newStatus)?.label || newStatus}"`)
      } else {
        toast.error(`❌ Erreur: ${res.error}`)
      }
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsUpdating(false)
    }
  }

  // --- EXPORT CSV ---
  const exportCSV = () => {
    if (filteredOrders.length === 0) return

    const headers = ['ID', 'Date', 'Client', 'Téléphone', 'Produit', 'Adresse', 'Zone', 'Statut', 'Livreur', 'Montant (FCFA)']
    
    const rows = filteredOrders.map(o => [
      o.id.split('-')[0],
      new Date(o.created_at).toLocaleDateString('fr-FR'),
      `"${o.buyer_name}"`,
      o.buyer_phone || '',
      `"${o.product?.name || 'Inconnu'}"`,
      `"${o.delivery_address || ''}"`,
      `"${o.deliveryZone?.name || ''}"`,
      STATUS_CONFIG[o.status]?.label || o.status,
      `"${o.deliverer?.name || 'Non assigné'}"`,
      o.total
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `livraisons_${storeName || 'boutique'}_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- IMPRESSION BORDEREAUX ---
  const printSelectedBordereaux = () => {
    const selectedOrdersData = filteredOrders.filter(o => selectedIds.has(o.id))
    if (selectedOrdersData.length === 0) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bordereaux d'Expédition - ${storeName || 'Boutique'}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1a1a1a; margin: 0; background: #f0f0f0; }
            .page { page-break-after: always; display: flex; flex-direction: column; height: 100vh; max-height: 100vh; box-sizing: border-box; padding: 15mm; margin: 0 auto 20px auto; max-width: 210mm; background: white; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.1); justify-content: flex-start; }
            .page:last-child { page-break-after: auto; }
            .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .shop-name { font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
            .order-id { font-size: 18px; font-weight: bold; padding: 6px 12px; border: 2px solid #1a1a1a; border-radius: 6px; font-family: monospace; background: #fafafa; }
            .content { flex-grow: 1; }
            
            .section { margin-bottom: 40px; }
            .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; font-weight: 900; margin-bottom: 10px; }
            .box { border: 2px solid #1a1a1a; padding: 25px; border-radius: 12px; background: #fff; position: relative; }
            
            .recipient-name { font-size: 36px; font-weight: 900; margin: 0 0 15px 0; letter-spacing: -0.5px; line-height: 1.1; }
            .recipient-phone { font-size: 24px; font-weight: 900; margin: 0 0 20px 0; display: inline-block; padding: 8px 16px; background: #f4f4f5; border-radius: 6px; letter-spacing: 1px; border: 1px solid #e4e4e7; }
            .recipient-address { font-size: 22px; line-height: 1.5; margin: 0; font-weight: 600; color: #333; }
            .zone { margin-top: 25px; font-size: 22px; font-weight: 900; color: #1a1a1a; border-top: 2px dashed #ccc; padding-top: 25px; display: flex; align-items: center; }
            
            .product-box { border: 3px solid #1a1a1a; padding: 20px 25px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
            .product-name { font-size: 22px; font-weight: 900; margin: 0; max-width: 60%; }
            .price { font-size: 32px; font-weight: 900; margin: 0; color: #1a1a1a; }
            
            .footer { margin-top: auto; font-size: 12px; font-weight: bold; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; text-transform: uppercase; letter-spacing: 2px; }
            
            @media print {
              body { padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { size: A4 portrait; margin: 0; }
              .page { height: 297mm; width: 210mm; padding: 15mm; border: none; box-shadow: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${selectedOrdersData.map(order => {
            const waMsg = `Bonjour ${order.buyer_name}, c'est le livreur. Je suis en route pour votre commande (${storeName || 'La boutique'}).`
            const waLink = `https://wa.me/${order.buyer_phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(waMsg)}`
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=1&color=0F7A60&data=${encodeURIComponent(waLink)}`

            return `
            <div class="page">
              <div class="header">
                <div class="shop-name">${storeName || 'Boutique'}</div>
                <div class="order-id">#${order.id.split('-')[0].toUpperCase()}</div>
              </div>
              
              <div class="content">
                <div class="section">
                  <div class="section-title">📦 DESTINATAIRE / LIVRAISON</div>
                  <div class="box" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1; padding-right: 20px;">
                      <h2 class="recipient-name">${order.buyer_name}</h2>
                      <div class="recipient-phone">📞 ${order.buyer_phone}</div>
                      <p class="recipient-address">📍 ${order.delivery_address || 'Aucune adresse renseignée'}</p>
                    </div>
                    <div style="text-align: center; border: 2px dashed #ccc; padding: 10px; border-radius: 12px; background: #fafafa; flex-shrink: 0;">
                      <img src="${qrUrl}" width="120" height="120" style="display: block; margin: 0 auto 8px auto;" alt="QR Code WhatsApp" />
                      <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #1a1a1a;">Scan = WhatsApp Livreur</span>
                    </div>
                  </div>
                  <div class="zone" style="border: 2px solid #1a1a1a; border-top: none; border-radius: 0 0 12px 12px; margin-top: -12px; padding: 15px 25px; background: #f4f4f5; font-size: 18px; font-weight: bold; display: flex; justify-content: space-between;">
                    <span>📍 Zone : ${order.deliveryZone?.name || 'Non spécifiée'}</span>
                    <span>🛵 Livreur : ${order.deliverer?.name || 'Non assigné'}${order.deliverer?.phone ? ` (${order.deliverer.phone})` : ''}</span>
                  </div>
                </div>
                
                <div class="section">
                  <div class="section-title">💰 INFORMATIONS COLIS & PAIEMENT</div>
                  <div class="product-box">
                    <h3 class="product-name">${order.product?.name || 'Produit non spécifié'}</h3>
                    <div class="price">${order.total.toLocaleString('fr-FR')} FCFA</div>
                  </div>
                  <p style="text-align: right; font-size: 14px; font-weight: 900; margin-top: 15px; color: #e11d48; text-transform: uppercase;">* À ENCAISSER EN ESPÈCES À LA LIVRAISON</p>
                </div>
              </div>
              
              <div class="footer">
                Bordereau généré électroniquement via Yayyam
              </div>
            </div>
          `}).join('')}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

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
    <div className="space-y-6 w-full pb-32">
      
      {/* 1. GAMIFICATION / STATS KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative">
        <div className="absolute inset-0 bg-[#0F7A60]/5 rounded-[32px] blur-3xl -z-10 pointer-events-none"></div>
         <div className="bg-white/80 backdrop-blur-2xl p-5 md:p-6 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 flex items-center gap-4 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-ink/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-ink/5 text-ink flex items-center justify-center shrink-0 shadow-inner">
               <ClipboardList size={26} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="relative z-10">
              <p className="text-xs md:text-xs font-black text-dust uppercase tracking-wider mb-1">Total à gérer</p>
              <p className="font-display font-black text-ink text-2xl md:text-3xl">{stats.totalActive}</p>
            </div>
         </div>
         <div className="bg-white/80 backdrop-blur-2xl p-5 md:p-6 rounded-[32px] border border-white shadow-xl shadow-amber-500/5 flex items-center gap-4 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
               <Target size={26} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="relative z-10">
              <p className="text-xs md:text-xs font-black text-dust uppercase tracking-wider mb-1">Confirmées</p>
              <p className="font-display font-black text-ink text-2xl md:text-3xl">{stats.nbConfirmed}</p>
            </div>
         </div>
         <div className="bg-white/80 backdrop-blur-2xl p-5 md:p-6 rounded-[32px] border border-white shadow-xl shadow-blue-500/5 flex items-center gap-4 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
               <Package size={26} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="relative z-10">
              <p className="text-xs md:text-xs font-black text-dust uppercase tracking-wider mb-1">En Préparation</p>
              <p className="font-display font-black text-ink text-2xl md:text-3xl">{stats.nbPreparing}</p>
            </div>
         </div>
         <div className="bg-white/80 backdrop-blur-2xl p-5 md:p-6 rounded-[32px] border border-white shadow-xl shadow-purple-500/5 flex items-center gap-4 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
               <MapPin size={26} className="group-hover:scale-110 transition-transform duration-300 animate-bounce" />
            </div>
            <div className="relative z-10">
              <p className="text-xs md:text-xs font-black text-dust uppercase tracking-wider mb-1">Expédiées</p>
              <p className="font-display font-black text-ink text-2xl md:text-3xl">{stats.nbShipped}</p>
            </div>
         </div>
      </div>

      {/* 2. ONGLETS DE STATUTS */}
      <div className="flex gap-2 sm:gap-4 border-b border-line pb-px overflow-x-auto scrollbar-hide">
         <button 
           onClick={() => setActiveTab('ALL')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'ALL' ? 'border-ink text-ink' : 'border-transparent text-dust hover:text-ink'}`}
         >
           Toutes ({stats.totalActive})
         </button>
         <button 
           onClick={() => setActiveTab('confirmed')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'confirmed' ? 'border-amber-500 text-amber-600' : 'border-transparent text-dust hover:text-ink'}`}
         >
           Confirmées ({stats.nbConfirmed})
         </button>
         <button 
           onClick={() => setActiveTab('preparing')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'preparing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-dust hover:text-ink'}`}
         >
           En Préparation ({stats.nbPreparing})
         </button>
         <button 
           onClick={() => setActiveTab('shipped')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'shipped' ? 'border-purple-500 text-purple-600' : 'border-transparent text-dust hover:text-ink'}`}
         >
           Expédiées ({stats.nbShipped})
         </button>
      </div>

      {/* 3. BARRE DE RECHERCHE & OUTILS */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" size={16} />
          <input 
            type="text"
            placeholder="Rechercher (Nom, Tél, IDs)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-line rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all outline-none shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 sm:gap-3 shrink-0 flex-wrap">
          <div className="bg-[#FAFAF7] border border-line rounded-xl p-1 flex items-center shadow-sm">
             <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-ink font-bold' : 'text-dust hover:text-ink'}`}
                title="Vue Liste"
             >
                <ListIcon size={16} />
             </button>
             <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${viewMode === 'board' ? 'bg-white shadow-sm text-ink font-bold' : 'text-dust hover:text-ink'}`}
                title="Vue Kanban"
             >
                <LayoutGrid size={16} />
             </button>
          </div>

          <button 
            onClick={() => setShowDeliverersModal(true)}
            className="bg-[#FAFAF7] border border-line text-ink hover:bg-white hover:border-line font-bold px-3 sm:px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm whitespace-nowrap"
          >
            <Users size={16} /> <span className="hidden sm:inline">Gérer Flotte</span>
          </button>

          <button 
             onClick={() => setIsDeliveryMode(true)}
             className="bg-[#0F7A60] border border-[#0F7A60]/30 text-white hover:bg-[#0D6B53] font-bold px-3 sm:px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm whitespace-nowrap group animate-pulse hover:animate-none"
          >
             🚀 <span className="hidden sm:inline">Mode Livraison</span>
          </button>

          <button 
            onClick={exportCSV}
            disabled={filteredOrders.length === 0}
            className="bg-[#FAFAF7] border border-line text-ink hover:bg-white hover:border-[#0F7A60]/30 font-bold px-3 sm:px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm whitespace-nowrap disabled:opacity-50"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exporter Colis</span>
          </button>
        </div>
      </div>

      {/* 4. VUES */}
      {viewMode === 'list' ? (
      <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#FAFAF7]/80 backdrop-blur-md border-b border-line text-xs font-black text-slate uppercase tracking-wider">
              <tr>
              <th className="px-4 py-4 w-10 text-center">
                <button onClick={toggleAll} className={`text-slate hover:text-ink transition-colors ${selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? 'text-[#0F7A60]' : ''}`} title="Tout sélectionner">
                  {selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? <CheckSquare size={16} className="text-[#0F7A60]" /> : <Square size={16} />}
                </button>
              </th>
              <th className="px-4 py-4">Commande</th>
              <th className="px-4 py-4">Client</th>
              <th className="px-4 py-4">Destination</th>
              <th className="px-4 py-4">Produit & Montant</th>
              <th className="px-4 py-4">Statut & Flotte</th>
              <th className="px-4 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-24 text-center">
                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#0F7A60]/10 to-transparent rounded-full flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-[#0F7A60]/20 blur-xl rounded-full animate-pulse" />
                    <Package size={48} className="text-[#0F7A60] relative z-10 drop-shadow-md" />
                  </div>
                  <p className="font-display font-black text-ink text-2xl uppercase tracking-tight mb-2">Aucun colis</p>
                  <p className="text-sm font-medium text-slate text-center">
                    Toutes les commandes pour cet onglet ont été traitées ou n'existent pas encore.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            filteredOrders.map((order) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed
              const isSelected = selectedIds.has(order.id)
              
              const waLink = `https://wa.me/${order.buyer_phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
               `Bonjour ${order.buyer_name.split(' ')[0]}, je vous contacte au sujet de la livraison de votre commande de Yayyam.`
              )}`

              return (
                <tr 
                  key={order.id} 
                  className={`group transition-colors ${isSelected ? 'bg-[#0F7A60]/5' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-4 w-10 text-center" onClick={(e) => { e.stopPropagation(); toggleSelection(order.id) }}>
                    <button className={`transition-colors ${isSelected ? 'text-[#0F7A60]' : 'text-slate hover:text-ink'}`}>
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-4" onClick={() => toggleSelection(order.id)}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink bg-cream px-2 py-1 rounded-md">#{order.id.split('-')[0].toUpperCase()}</span>
                    </div>
                    <div className="text-xs uppercase font-bold text-slate mt-1.5 flex items-center gap-1">
                      <ClockIcon size={10} /> {getTimeAgo(order.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-ink text-sm truncate max-w-[150px]">{order.buyer_name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <a suppressHydrationWarning href={`tel:${order.buyer_phone}`} onClick={e => e.stopPropagation()} className="text-xs text-slate hover:text-[#0F7A60] font-bold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md transition-colors"><PhoneIcon size={10}/>{order.buyer_phone || 'N/A'}</a>
                        <a suppressHydrationWarning href={waLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-white bg-[#25D366] hover:bg-[#1EBE5C] p-1 font-bold text-xs rounded-md shadow-sm transition-transform active:scale-95" title="Contacter par WhatsApp">
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5 max-w-[200px]">
                      <span className="font-bold text-sm text-ink truncate">{order.deliveryZone?.name || 'Zone non spécifiée'}</span>
                      <span className="text-xs font-medium text-slate truncate" title={order.delivery_address}>{order.delivery_address || 'Aucune adresse'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-lg bg-cream flex-shrink-0 border border-line overflow-hidden hidden sm:flex items-center justify-center">
                        {order.product?.images?.[0] ? (
                          <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={order.product.images[0]} alt={order.product?.name || "Image produit"} fill className="object-cover" unoptimized />
                        ) : (
                          <Package size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-[100px]">
                        <span className="font-black text-[#0F7A60] text-sm">{order.total.toLocaleString('fr-FR')} F</span>
                        <span className="text-xs font-bold text-slate truncate max-w-[150px]" title={order.product?.name ?? ''}>{order.product?.name ?? '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${statusConf.badgeBg} ${statusConf.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-current mr-1.5 ${order.status !== 'delivered' ? 'animate-pulse' : ''}`}></span>
                        {statusConf.label}
                      </span>
                      <select
                        aria-label="Assigner un livreur"
                        onChange={(e) => handleAssignDeliverer(order.id, e.target.value)}
                        value={order.deliverer_id || 'none'}
                        onClick={e => e.stopPropagation()}
                        className="bg-cream border border-line text-ink text-xs font-bold rounded-md px-2 py-1 outline-none focus:border-[#0F7A60]/50"
                      >
                        <option value="none">Assigner un Livreur...</option>
                        {(deliverers || []).map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    {getNextStatus(order.status) ? (
                      <button
                        onClick={() => handleSingleUpdate(order.id, order.status)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-white to-gray-50 border border-gray-200 text-ink hover:text-[#0F7A60] hover:border-[#0F7A60]/50 px-4 py-2 rounded-[14px] text-[10.5px] font-black shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap group-hover:bg-[#0F7A60]/5"
                      >
                         Passer en '{STATUS_CONFIG[getNextStatus(order.status)!]?.label}' <ArrowRightCircle size={14} className="text-dust group-hover:text-[#0F7A60] transition-colors" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center bg-emerald/10 px-3 py-1.5 rounded-xl border border-emerald/20 text-[10.5px] font-black text-[#0F7A60] shadow-sm">
                        <CheckCircle2 size={14} className="mr-1.5" /> Terminé
                      </span>
                    )}
                  </td>
                </tr>
              )
            })
          )}
          </tbody>
        </table>
        </div>
      </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x relative lg:grid lg:grid-cols-3 lg:snap-none scrollbar-hide">
           {['confirmed', 'preparing', 'shipped'].map(columnStatus => {
             const colOrders = filteredOrders.filter(o => o.status === columnStatus)
             const colConf = STATUS_CONFIG[columnStatus]

             return (
               <div key={columnStatus} className="min-w-[320px] lg:min-w-0 w-[320px] lg:w-full shrink-0 flex flex-col snap-center">
                 <div className={`p-4 rounded-t-2xl border-x border-t border-line ${colConf.badgeBg} flex items-center justify-between`}>
                   <h3 className={`font-black uppercase tracking-wider text-xs flex items-center gap-2 ${colConf.color}`}>
                     {colConf.label} <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm">{colOrders.length}</span>
                   </h3>
                 </div>
                 <div className="bg-[#FAFAF7] border-x border-b border-line rounded-b-2xl p-3 flex flex-col gap-3 min-h-[400px]">
                   {colOrders.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-dust text-center py-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-200/50 to-transparent rounded-full flex items-center justify-center mb-4 relative">
                          <div className="absolute inset-0 bg-slate-200/30 blur-md rounded-full" />
                          <Package size={28} className="text-slate-400 relative z-10" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Aucun Colis</p>
                     </div>
                   ) : (
                     colOrders.map(order => {
                       const nextSt = getNextStatus(order.status)
                       const isSelected = selectedIds.has(order.id)
                       
                       const waLink = `https://wa.me/${order.buyer_phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
                        `Bonjour ${order.buyer_name.split(' ')[0]}, je vous contacte au sujet de la livraison de votre commande de Yayyam.`
                       )}`

                       return (
                         <div key={order.id} className={`bg-white p-4 rounded-xl border border-line shadow-sm flex flex-col group transition ${isSelected ? 'ring-2 ring-[#0F7A60]' : 'hover:border-[#0F7A60]/30 cursor-pointer'}`} onClick={() => toggleSelection(order.id)}>
                           <div className="flex items-start justify-between mb-3 border-b border-line pb-3">
                             <div>
                               <span className="font-mono text-xs font-black text-ink bg-cream px-2 py-1 rounded-md">#{order.id.split('-')[0].toUpperCase()}</span>
                               <p className="font-black text-ink text-sm mt-1">{order.buyer_name}</p>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                               <button className={`transition-colors ${isSelected ? 'text-[#0F7A60]' : 'text-slate hover:text-ink'}`} onClick={(e) => { e.stopPropagation(); toggleSelection(order.id) }}>
                                 {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                               </button>
                               <div className="text-xs uppercase font-bold text-slate flex items-center gap-1">
                                  <ClockIcon size={9} /> {getTimeAgo(order.created_at)}
                               </div>
                             </div>
                           </div>
                           
                           <div className="text-xs font-medium text-slate mb-4 space-y-2">
                             <div className="flex items-center gap-1.5" title={order.delivery_address || ''}>
                               <MapPin size={12} className="shrink-0" />
                               <span className="truncate line-clamp-1">{order.delivery_address || 'Adresse non spécifiée'}</span>
                             </div>
                             <div className="flex justify-between items-center pr-1 border-b border-line pb-2 mb-2">
                               <span className="font-black text-ink">💰 {order.total.toLocaleString('fr-FR')} FCFA</span>
                               {order.buyer_phone && (
                                 <div className="flex items-center gap-1.5">
                                   <a aria-label="Appeler l'acheteur" href={`tel:${order.buyer_phone}`} className="hover:text-[#0F7A60] transition-colors p-1" onClick={e => e.stopPropagation()}>📞</a>
                                   <a aria-label="Contacter sur WhatsApp" href={waLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[#25D366] hover:text-[#1EBE5C] p-0.5 transition-transform active:scale-95">
                                     <WhatsAppIcon className="w-3.5 h-3.5" />
                                   </a>
                                 </div>
                               )}
                             </div>
                             
                             {/* Selector Flotte */}
                             <div className="pt-1">
                                <select
                                  aria-label="Assigner un livreur"
                                  onChange={(e) => handleAssignDeliverer(order.id, e.target.value)}
                                  value={order.deliverer_id || 'none'}
                                  onClick={e => e.stopPropagation()}
                                  className="w-full bg-[#f4f4f5] border border-line/50 text-slate text-[10.5px] font-bold rounded-lg px-2 py-1.5 outline-none focus:border-[#0F7A60]/50"
                                >
                                  <option value="none">Livreur : Aucun</option>
                                  {(deliverers || []).map(d => (
                                    <option key={d.id} value={d.id}>Livré par : {d.name}</option>
                                  ))}
                                </select>
                             </div>
                           </div>

                           {nextSt ? (
                             <button
                               onClick={(e) => { e.stopPropagation(); handleSingleUpdate(order.id, order.status) }}
                               disabled={isUpdating}
                               className="w-full justify-center flex items-center gap-2 bg-[#FAFAF7] border border-line text-ink hover:text-[#0F7A60] hover:border-[#0F7A60] font-black px-4 py-2.5 rounded-lg text-xs transition active:scale-95 disabled:opacity-50 mt-auto shadow-sm"
                             >
                               Passer en '{STATUS_CONFIG[nextSt]?.label}' <ArrowRightCircle size={14} />
                             </button>
                           ) : (
                             <div className="w-full justify-center flex items-center gap-2 bg-emerald/10 text-[#0F7A60] font-black px-4 py-2.5 rounded-lg text-xs mt-auto">
                               <CheckCircle2 size={14} /> Terminé
                             </div>
                           )}
                         </div>
                       )
                     })
                   )}
                 </div>
               </div>
             )
           })}
        </div>
      )}

    {/* 5. ACTIONS BULK (Panel Fixe en bas) */}
      {selectedIds.size > 0 && !isDeliveryMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink rounded-2xl p-4 shadow-2xl flex items-center gap-6 text-white border border-white/10 animate-in slide-in-from-bottom-5">
           <div className="flex items-center gap-3 border-r border-white/20 pr-6">
             <div className="w-6 h-6 rounded-md bg-[#0F7A60] flex items-center justify-center text-xs font-black">
               {selectedIds.size}
             </div>
             <span className="text-sm font-bold opacity-80 hidden sm:inline">colis sélectionnés</span>
           </div>

           <div className="flex items-center gap-3 relative flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto mt-4 sm:mt-0">
             <button
               onClick={printSelectedBordereaux}
               disabled={isUpdating}
               className="bg-[#0F7A60] text-white hover:bg-[#0D6B53] px-4 py-2 rounded-xl text-sm font-black transition shadow-sm flex items-center gap-2"
               title="Imprimer automatiquement un PDF A4 découpable pour les colis sélectionnés"
             >
               🖨️ Imprimer Étiquettes
             </button>

             <button
               onClick={() => setShowStatusMenu(!showStatusMenu)}
               disabled={isUpdating}
               className="bg-white text-ink hover:bg-cream px-4 py-2 rounded-xl text-sm font-black transition shadow-sm flex items-center gap-2"
             >
               {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Traiter / Acheminer'}
               <ChevronDown size={14} className={showStatusMenu ? "rotate-180" : ""} />
             </button>

             <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-bold text-white/50 hover:text-white underline transition"
             >
               Annuler
             </button>

             {/* Menu Déroulant Status */}
             {showStatusMenu && (
               <div className="absolute bottom-full mb-3 left-0 w-48 bg-white text-ink rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 border border-line py-1">
                 {UPDATEABLE_STATUSES.map(st => (
                   <button
                     key={st.id}
                     onClick={() => executeBulkUpdate(st.id)}
                     className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#0F7A60]/5 hover:text-[#0F7A60] transition"
                   >
                     {st.label}
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      )}

      {/* 6. MODAL GESTION FLOTTE (DeliverersModal) */}
      {showDeliverersModal && (
        <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95">
             <div className="p-6 border-b border-line flex justify-between items-center bg-[#FAFAF7] sticky top-0 z-10">
               <div>
                  <h2 className="text-xl font-black text-ink">Flotte de Livreurs</h2>
                  <p className="text-sm text-slate font-medium">Gérez vos coursiers externes et internes.</p>
               </div>
               <button onClick={() => setShowDeliverersModal(false)} title="Fermer" className="w-10 h-10 bg-white border border-line rounded-xl flex justify-center items-center text-slate hover:text-ink transition active:scale-95 shadow-sm">
                 <X size={20} />
               </button>
             </div>

             <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                <div className="p-5 bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl flex flex-col gap-3">
                   <h3 className="font-black text-[#0F7A60] text-sm flex items-center gap-2">
                     <UserPlus size={16} /> Ajouter un Livreur
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                     <input 
                        type="text" 
                        placeholder="Nom du livreur" 
                        value={newDelivererName}
                        onChange={e => setNewDelivererName(e.target.value)}
                        className="w-full bg-white border border-[#0F7A60]/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F7A60] font-medium"
                     />
                     <input 
                        type="tel" 
                        placeholder="Tél (ex: 77...)" 
                        value={newDelivererPhone}
                        onChange={e => setNewDelivererPhone(e.target.value)}
                        className="w-full bg-white border border-[#0F7A60]/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F7A60] font-medium"
                     />
                   </div>
                   <div className="w-full">
                      <select
                         title="Expiration du lien"
                         value={newDelivererExpiration === 'definitif' || newDelivererExpiration === '24' || newDelivererExpiration === '48' ? newDelivererExpiration : 'custom'}
                         onChange={e => setNewDelivererExpiration(e.target.value)}
                         className="w-full bg-white border border-[#0F7A60]/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F7A60] font-medium mb-3"
                      >
                         <option value="definitif">Accès Définitif (Employé Interne)</option>
                         <option value="24">Accès Temporaire (24 Heures)</option>
                         <option value="48">Accès Temporaire (48 Heures)</option>
                         <option value="custom">Délai personnalisé...</option>
                      </select>
                      {newDelivererExpiration !== 'definitif' && newDelivererExpiration !== '24' && newDelivererExpiration !== '48' && (
                        <input
                           type="number"
                           min="1"
                           placeholder="Nombre d'heures (ex: 5)"
                           value={newDelivererExpiration !== 'custom' ? newDelivererExpiration : ''}
                           onChange={e => setNewDelivererExpiration(e.target.value)}
                           className="w-full bg-white border border-[#0F7A60]/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F7A60] font-medium"
                        />
                      )}
                   </div>
                   <button 
                     onClick={handleCreateDeliverer}
                     disabled={isCreatingDeliverer || !newDelivererName || !newDelivererPhone}
                     className="bg-[#0F7A60] text-white font-bold text-sm px-4 py-2.5 rounded-xl w-full flex justify-center items-center gap-2 hover:bg-[#0D6B53] disabled:opacity-50 transition"
                   >
                     {isCreatingDeliverer ? <Loader2 size={16} className="animate-spin" /> : "Ajouter à la flotte"}
                   </button>
                </div>

                <div className="space-y-3">
                   <h3 className="font-black text-ink text-sm">Livreurs Actifs ({deliverers.length})</h3>
                   {deliverers.length === 0 ? (
                     <p className="text-sm font-medium text-slate text-center py-4">Aucun livreur pour le moment.</p>
                   ) : (
                     deliverers.map(d => (
                       <div key={d.id} className="bg-white border border-line rounded-xl p-4 flex items-center justify-between shadow-sm">
                         <div>
                            <p className="font-black text-ink text-sm">{d.name}</p>
                            <p className="text-xs text-slate font-bold">{d.phone}</p>
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => copyMagicLink(d.id)}
                             className="bg-[#FAFAF7] hover:bg-[#0F7A60]/10 border border-line hover:border-[#0F7A60]/30 text-[#0F7A60] px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 shadow-sm"
                           >
                             <LinkIcon size={12} /> Copier Portail
                           </button>
                           <button 
                             title="Supprimer livreur"
                             onClick={() => handleDeleteDeliverer(d.id)}
                             className="bg-red-50 hover:bg-red-100 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center transition"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 7. FULLSCREEN: MODE LIVRAISON (Mobile-First Interface) */}
      {isDeliveryMode && (
        <div className="fixed inset-0 z-[200] bg-[#f4f4f5] flex flex-col animate-in slide-in-from-bottom-full overflow-hidden">
           {/* Header Livraison */}
           <div className="bg-[#0F7A60] text-white p-4 pt-safe-top flex items-center justify-between shrink-0 shadow-md z-10 sticky top-0">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-xl flex flex-col items-center justify-center">
                 <Rocket size={20} className="text-white" />
               </div>
               <div>
                 <h1 className="font-black text-lg uppercase tracking-wider leading-none">Acheminement</h1>
                 <p className="text-white/70 text-xs font-bold tracking-widest mt-0.5">MODE LIVRAISON YAYYAM</p>
               </div>
             </div>
             <button onClick={() => setIsDeliveryMode(false)} title="Fermer mode livraison" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition">
               <X size={20} />
             </button>
           </div>

           {/* Tabs */}
           <div className="flex border-b border-line bg-white shrink-0 shadow-sm sticky top-[72px] z-10">
              <button 
                onClick={() => setDeliveryModeTab('pending')}
                className={`flex-1 py-4 text-sm tracking-widest uppercase font-black transition border-b-2 ${deliveryModeTab === 'pending' ? 'text-[#0F7A60] border-[#0F7A60]' : 'text-slate border-transparent'}`}
              >
                 En Route <span className="ml-1 bg-ink text-white px-2 py-0.5 rounded-full text-xs">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</span>
              </button>
              <button 
                onClick={() => setDeliveryModeTab('delivered')}
                className={`flex-1 py-4 text-sm tracking-widest uppercase font-black transition border-b-2 ${deliveryModeTab === 'delivered' ? 'text-ink border-ink' : 'text-slate border-transparent'}`}
              >
                 Livrées <span className="ml-1 bg-cream text-ink px-2 py-0.5 rounded-full text-xs shadow-sm">{orders.filter(o => o.status === 'delivered').length}</span>
              </button>
           </div>

           {/* Liste Colis */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-24">
             {orders
               .filter(o => deliveryModeTab === 'pending' ? (o.status !== 'delivered' && o.status !== 'cancelled') : o.status === 'delivered')
               .map(order => {
                  const waLink = `https://wa.me/${order.buyer_phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
                    `Bonjour ${order.buyer_name.split(' ')[0]}, c'est le livreur Yayyam. Je suis en route avec votre commande !`
                  )}`
                  const addressNavUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`

                  return (
                    <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-line flex flex-col gap-4 relative overflow-hidden">
                       <div className="flex justify-between items-start">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-mono text-xs font-black text-ink bg-cream px-2.5 py-1 rounded-lg">#{order.id.split('-')[0].toUpperCase()}</span>
                             <span className="text-xs font-black uppercase text-dust">{getTimeAgo(order.created_at)}</span>
                           </div>
                           <h3 className="font-black tracking-tight text-xl text-ink leading-none mt-2">{order.buyer_name}</h3>
                         </div>
                         <div className="text-right">
                           <p className="font-black text-2xl tracking-tighter text-[#0F7A60]">{order.total.toLocaleString('fr-FR')}</p>
                           <p className="text-xs font-black text-slate uppercase">FCFA À PERCEVOIR</p>
                         </div>
                       </div>

                       <div className="bg-[#fcfcfc] border border-line rounded-2xl p-3 flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-line overflow-hidden shrink-0 flex items-center justify-center">
                             {order.product?.images?.[0] ? (
                               <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={order.product.images[0]} alt="img" width={48} height={48} className="object-cover" />
                             ) : <Package size={20} className="text-slate" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-ink truncate shrink-0 px-2">{order.product?.name || 'Produit non spécifié'}</p>
                          </div>
                       </div>

                       <div className="flex gap-2 border-y border-line py-3">
                         <div className="flex-1">
                           <p className="text-xs uppercase font-black text-slate mb-0.5">📍 Zone & Adresse</p>
                           <p className="text-xs font-bold text-ink line-clamp-2 leading-tight">
                             {order.deliveryZone?.name ? <span className="text-[#0F7A60]">{order.deliveryZone.name} — </span> : ''}
                             {order.delivery_address || 'Adresse introuvable'}
                           </p>
                         </div>
                         <a href={addressNavUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir dans Maps" aria-label="Ouvrir dans Maps" className="w-10 h-10 bg-cream text-ink rounded-xl flex items-center justify-center border border-line shrink-0 active:scale-95 transition">
                           <MapPin size={18} />
                         </a>
                       </div>

                       {deliveryModeTab === 'pending' ? (
                         <div className="flex gap-2">
                            <a suppressHydrationWarning href={`tel:${order.buyer_phone}`} aria-label="Appeler l'acheteur" className="flex-1 bg-ink text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm active:scale-95 transition shadow-lg shadow-ink/20">
                              <PhoneIcon size={18} /> Appeler
                            </a>
                            <a suppressHydrationWarning href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Contacter sur WhatsApp" className="w-14 shrink-0 bg-[#25D366] text-white py-4 rounded-2xl flex items-center justify-center font-black active:scale-95 transition shadow-lg shadow-[#25D366]/20">
                              <WhatsAppIcon className="w-6 h-6" />
                            </a>
                            <button 
                              onClick={() => {
                                handleSingleUpdate(order.id, 'shipped') // shipped -> delivered via nextState
                              }}
                              disabled={isUpdating}
                              className="flex-[1.5] bg-[#0F7A60] text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm active:scale-95 transition shadow-lg shadow-[#0F7A60]/20"
                            >
                              {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Livré</>}
                            </button>
                         </div>
                       ) : (
                         <div className="bg-emerald/10 text-[#0F7A60] border border-emerald/20 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm">
                           <CheckCircle2 size={18} /> Colis livré au client
                         </div>
                       )}
                    </div>
                  )
               })}
             {orders.filter(o => deliveryModeTab === 'pending' ? (o.status !== 'delivered' && o.status !== 'cancelled') : o.status === 'delivered').length === 0 && (
               <div className="flex flex-col items-center justify-center text-center py-24 px-6 relative top-1/2 -translate-y-1/2">
                 <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mb-6">
                   <Target size={32} className="text-dust" />
                 </div>
                 <h2 className="font-black text-ink text-2xl uppercase tracking-tighter">Votre Course est vide</h2>
                 <p className="text-sm font-medium text-slate mt-2 max-w-[250px]">Aucun colis {deliveryModeTab === 'pending' ? 'en attente de livraison' : 'livré'} ne se trouve dans cette liste.</p>
               </div>
             )}
           </div>
        </div>
      )}

    </div>
  )
}
