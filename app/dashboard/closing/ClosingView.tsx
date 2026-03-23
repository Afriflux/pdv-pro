'use client'

import { useState } from 'react'
import { processClosingRequest, lockClosingRequest, ClosingAction } from '@/lib/closing/closingActions'
import { toast } from 'sonner'
import { 
  Phone as PhoneIcon, Calendar as CalendarIcon, CheckCircle2 as CheckCircleIcon, 
  XCircle as XCircleIcon, ShieldAlert, ShieldCheck, 
  ShieldQuestion, Loader2,
  DollarSign, Target, ChevronDown, ChevronUp, ClipboardList, Lock, History, Edit3, Send,
  Search, LayoutGrid, List,
  Zap, Clock, Archive
} from 'lucide-react'

type ClosingHistory = {
  id: string
  action: string
  createdAt: string
  agentName: string | null
  details: string | null
}

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
  notes: string
  scheduledAt: string | null
  lockedBy: string | null
  lockedUntil: string | null
  history: ClosingHistory[]
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}

export function ClosingView({ initialRequests }: { initialRequests: ClosingRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SCHEDULED' | 'NO_REPLY' | 'PROCESSED'>('PENDING')
  
  const [openScriptId, setOpenScriptId] = useState<string | null>(null)
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null)
  
  const [scheduleDateMap, setScheduleDateMap] = useState<Record<string, string>>({})
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})

  // NEW FILTERS & VIEW STATE
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'NORMAL' | 'LOW'>('ALL')
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS')

  // STATS (GAMIFICATION)
  const caSecurise = requests.filter(r => r.status === 'VALIDATED').reduce((sum, r) => sum + r.orderTotal, 0)
  const nbValides = requests.filter(r => r.status === 'VALIDATED').length
  const nbRejetes = requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLATION_REQUESTED').length
  const tauxClosing = nbValides + nbRejetes > 0 ? Math.round((nbValides / (nbValides + nbRejetes)) * 100) : 0

  // COUNTS & FILTERING LOGIC
  const isScheduled = (r: ClosingRequest) => {
    return r.status === 'SCHEDULED' || (r.scheduledAt && new Date(r.scheduledAt) > new Date())
  }
  
  const isPending = (r: ClosingRequest) => {
    return r.status === 'PENDING' && !isScheduled(r)
  }

  const pendingCount = requests.filter(isPending).length
  const scheduledCount = requests.filter(isScheduled).length
  const noReplyCount = requests.filter(r => r.status === 'NO_REPLY').length
  const processedCount = requests.filter(r => ['VALIDATED', 'REJECTED', 'CANCELLATION_REQUESTED'].includes(r.status)).length

  const handleAction = async (id: string, action: ClosingAction, extraNote?: string, scheduledAt?: Date) => {
    setLoading(id)
    try {
      const res = await processClosingRequest(id, action, extraNote, scheduledAt)
      if (!res.success) throw new Error((res as any).error || 'Une erreur est survenue.')
      
      // Mettre à jour l'état local pour refléter le changement (optimistic UI simplifié)
      setRequests(prev => prev.map(r => {
        if (r.id === id) {
          const newH: ClosingHistory = {
            id: Math.random().toString(),
            action: action,
            createdAt: new Date().toISOString(),
            agentName: 'Moi',
            details: extraNote || null
          }
          return {
            ...r,
            status: action === 'NOTE_ADDED' ? r.status : action,
            notes: extraNote ? (r.notes ? r.notes + '\n---\n' + extraNote : extraNote) : r.notes,
            scheduledAt: scheduledAt ? scheduledAt.toISOString() : r.scheduledAt,
            history: [...r.history, newH]
          }
        }
        return r
      }))

      if (action === 'VALIDATED') toast.success('Magnifique ! Commande validée 💰')
      else if (action === 'SCHEDULED') toast.success('Rappel planifié ⏰')
      else if (action === 'NOTE_ADDED') toast.success('Note enregistrée 📝')
      else toast.success('Statut mis à jour.')

      if (action === 'NOTE_ADDED') {
        setNoteMap(prev => ({...prev, [id]: ''}))
      }
    } catch (e) {
      toast.error((e as Error).message || 'Une erreur est survenue.')
    } finally {
      setLoading(null)
    }
  }

  const startCall = async (id: string) => {
    setOpenScriptId(id)
    try {
      await lockClosingRequest(id)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, lockedBy: 'Moi', lockedUntil: new Date(Date.now() + 5 * 60000).toISOString() } : r))
    } catch(e) { /* ignore */ }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">En Attente</span>
      case 'SCHEDULED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">Planifié</span>
      case 'CANCELLATION_REQUESTED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">Annulation</span>
      case 'VALIDATED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">Validé</span>
      case 'REJECTED': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">Rejeté</span>
      case 'NO_REPLY': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">Injoignable</span>
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">{s}</span>
    }
  }

  const getPriority = (createdAt: string) => {
    const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (diffHours < 3) return { label: 'Urgente', color: 'text-rose-600 bg-rose-100 border-rose-200', icon: Zap }
    if (diffHours < 24) return { label: 'Normale', color: 'text-amber-600 bg-amber-100 border-amber-200', icon: Clock }
    return { label: 'Basse', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: Archive }
  }

  const filteredRequests = requests.filter(r => {
    // 1. Tab filter
    if (activeTab === 'PENDING' && !isPending(r)) return false
    if (activeTab === 'SCHEDULED' && !isScheduled(r)) return false
    if (activeTab === 'NO_REPLY' && r.status !== 'NO_REPLY') return false
    if (activeTab === 'PROCESSED' && !['VALIDATED', 'REJECTED', 'CANCELLATION_REQUESTED'].includes(r.status)) return false

    // 2. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!r.buyerName.toLowerCase().includes(q) && !r.buyerPhone.includes(q)) return false
    }

    // 3. Date filter
    if (dateFilter !== 'ALL') {
      const createdAt = new Date(r.createdAt)
      const today = new Date()
      today.setHours(0,0,0,0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      if (dateFilter === 'TODAY' && createdAt < today) return false
      if (dateFilter === 'YESTERDAY' && (createdAt < yesterday || createdAt >= today)) return false
      if (dateFilter === 'LAST_7_DAYS' && createdAt < lastWeek) return false
    }

    // 4. Priority filter
    if (priorityFilter !== 'ALL') {
      const diffHours = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60)
      if (priorityFilter === 'URGENT' && diffHours >= 3) return false
      if (priorityFilter === 'NORMAL' && (diffHours < 3 || diffHours >= 24)) return false
      if (priorityFilter === 'LOW' && diffHours < 24) return false
    }

    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 pb-32">
      
      {/* 📊 BARRE DE GAMIFICATION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F7A60]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#0F7A60]/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-[#0F7A60]/10 text-[#0F7A60] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"><DollarSign size={24} /></div>
              <div>
                <p className="text-[11px] font-black text-[#0F7A60] uppercase tracking-wider mb-1">CA Sécurisé</p>
                <p className="font-display font-black text-[#1A1A1A] text-2xl truncate">{caSecurise.toLocaleString('fr-FR')} <span className="text-sm font-bold text-gray-400">F</span></p>
              </div>
            </div>
         </div>
         
         <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500"><CheckCircleIcon size={24} /></div>
              <div>
                <p className="text-[11px] font-black text-blue-500 uppercase tracking-wider mb-1">Validés</p>
                <p className="font-display font-black text-3xl text-[#1A1A1A]">{nbValides}</p>
              </div>
            </div>
         </div>
         
         <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"><Target size={24} /></div>
              <div>
                <p className="text-[11px] font-black text-purple-600 uppercase tracking-wider mb-1">Tx Closing</p>
                <p className="font-display font-black text-3xl text-[#1A1A1A]">{tauxClosing}%</p>
              </div>
            </div>
         </div>
         
         <div className="relative overflow-hidden group bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 hover:shadow-gray-200/80 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-[#C9A84C]/10 transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500"><ClipboardList size={24} /></div>
              <div>
                <p className="text-[11px] font-black text-[#C9A84C] uppercase tracking-wider mb-1">Total Traité</p>
                <p className="font-display font-black text-3xl text-[#1A1A1A]">{nbValides + nbRejetes}</p>
              </div>
            </div>
         </div>
      </div>

      {/* 📑 SYSTÈME D'ONGLETS */}
      <div className="flex gap-2 sm:gap-4 border-b border-line pb-px overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
         <button 
           onClick={() => setActiveTab('PENDING')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'PENDING' ? 'border-emerald text-emerald' : 'border-transparent text-dust hover:text-ink'}`}
         >
           🔥 À Traiter ({pendingCount})
         </button>
         <button 
           onClick={() => setActiveTab('SCHEDULED')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'SCHEDULED' ? 'border-blue-500 text-blue-600' : 'border-transparent text-dust hover:text-ink'}`}
         >
           ⏰ Rappels ({scheduledCount})
         </button>
         <button 
           onClick={() => setActiveTab('NO_REPLY')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'NO_REPLY' ? 'border-amber-500 text-amber-600' : 'border-transparent text-dust hover:text-ink'}`}
         >
           ⏳ Injoignables ({noReplyCount})
         </button>
         <button 
           onClick={() => setActiveTab('PROCESSED')}
           className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-colors whitespace-nowrap border-b-2 ${activeTab === 'PROCESSED' ? 'border-ink text-ink' : 'border-transparent text-dust hover:text-ink'}`}
         >
           ✅ Traités ({processedCount})
         </button>
      </div>

      {/* 🎛️ BARRE DE FILTRES OPTIMISÉE */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between bg-white p-3 rounded-2xl border border-line shadow-sm">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dust w-4 h-4" />
            <input 
              type="text"
              placeholder="Rechercher (Nom, Téléphone)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-line rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald focus:border-emerald outline-none transition-all"
            />
         </div>
         <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-line shrink-0">
               <CalendarIcon className="w-4 h-4 text-dust ml-2" />
               <select 
                 title="Filtrer par date"
                 value={dateFilter} 
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFilter(e.target.value as any)}
                 className="bg-transparent text-xs font-bold text-ink py-1.5 pl-2 pr-6 outline-none cursor-pointer appearance-none"
               >
                 <option value="ALL">Toutes les dates</option>
                 <option value="TODAY">Aujourd&apos;hui</option>
                 <option value="YESTERDAY">Hier</option>
                 <option value="LAST_7_DAYS">7 derniers jours</option>
               </select>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-line shrink-0">
               <Zap className={`w-4 h-4 ml-2 ${priorityFilter === 'ALL' ? 'text-dust' : priorityFilter === 'URGENT' ? 'text-rose-600' : priorityFilter === 'NORMAL' ? 'text-amber-500' : 'text-slate-500'}`} />
               <select 
                 title="Filtrer par priorité"
                 value={priorityFilter} 
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value as any)}
                 className="bg-transparent text-xs font-bold text-ink py-1.5 pl-2 pr-6 outline-none cursor-pointer appearance-none"
               >
                 <option value="ALL">Toutes priorités</option>
                 <option value="URGENT">Urgente (&lt; 3h)</option>
                 <option value="NORMAL">Normale (3h - 24h)</option>
                 <option value="LOW">Basse (&gt; 24h)</option>
               </select>
            </div>

            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-line shrink-0 ml-auto md:ml-4">
               <button 
                 onClick={() => setViewMode('CARDS')}
                 className={`p-1.5 rounded-lg transition-colors ${viewMode === 'CARDS' ? 'bg-white shadow-sm text-ink' : 'text-dust hover:text-ink'}`}
                 title="Vue Cartes"
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setViewMode('TABLE')}
                 className={`p-1.5 rounded-lg transition-colors ${viewMode === 'TABLE' ? 'bg-white shadow-sm text-ink' : 'text-dust hover:text-ink'}`}
                 title="Vue Tableau Compact"
               >
                 <List className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      {/* 🚀 LISTE DES DEMANDES */}
      {filteredRequests.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center bg-white border border-line rounded-3xl shadow-sm">
          <ShieldCheck size={48} className="text-emerald/40 mb-4 animate-bounce" />
          <p className="font-display font-black text-ink text-xl uppercase tracking-tight">C&apos;est tout bon !</p>
          <p className="text-sm font-medium text-slate mt-2 max-w-sm px-4">Aucune commande ne correspond à vos filtres. Naviguez vers un autre statut ou profitez de cette pause.</p>
        </div>
      ) : viewMode === 'TABLE' ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] overflow-x-auto shadow-xl shadow-gray-200/50">
           <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#FAFAF7] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 <tr>
                    <th className="px-6 py-5 rounded-tl-[32px]">Client</th>
                    <th className="px-6 py-5">Montant & Produit</th>
                    <th className="px-6 py-5">Score & Priorité</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5 text-right rounded-tr-[32px]">Actions Rapides</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {filteredRequests.map(req => {
                    const temp = getPriority(req.createdAt)
                    const isLocked = req.lockedUntil && new Date(req.lockedUntil) > new Date()
                    const lockBadge = isLocked ? <Lock size={12} className="text-amber-500 inline mr-1" aria-label={`Verrouillé par ${req.lockedBy}`}/> : null
                    const waMsg = `Bonjour ${req.buyerName}, nous avons tenté de vous joindre concernant votre commande pour le ${req.productName} d'un montant de ${req.orderTotal.toLocaleString('fr-FR')} FCFA. Merci de nous confirmer par ce message pour que le livreur puisse partir vous livrer ! 🚀`
                    const waLink = `https://wa.me/${req.buyerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
                    return (
                       <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-5">
                             <div className="flex flex-col gap-1.5">
                                <span className="font-black text-[#1A1A1A] text-[15px]">{lockBadge}{req.buyerName}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <a href={`tel:${req.buyerPhone}`} onClick={() => startCall(req.id)} className="font-mono text-[11px] text-gray-500 hover:text-[#0F7A60] font-bold flex items-center gap-1.5 bg-gray-100 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"><PhoneIcon size={12}/>{req.buyerPhone}</a>
                                   <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-[#25D366] to-[#1EBE5C] hover:shadow-md px-2.5 py-1 font-bold text-[10px] sm:text-xs rounded-md shadow-sm shadow-[#25D366]/20 transition-transform active:scale-95" title="WhatsApp">
                                      <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                                   </a>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex flex-col gap-1">
                                <span className="font-black text-[#0F7A60] text-[15px]">{req.orderTotal.toLocaleString('fr-FR')} F</span>
                                <span className="text-xs font-bold text-gray-500 max-w-[200px] truncate" title={req.productName}>{req.productName}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex flex-col items-start gap-1.5">
                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${temp.color}`}>
                                   <temp.icon size={10} /> {temp.label}
                                </span>
                                {req.score && req.score.refused_orders === 0 && (
                                   <span className="flex items-center gap-1.5 text-[10px] text-[#0F7A60] font-bold"><ShieldCheck size={14}/> Fiable</span>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             {getStatusBadge(req.status)}
                          </td>
                          <td className="px-6 py-5 text-right">
                             <button onClick={() => setViewMode('CARDS')} className="bg-gradient-to-br from-[#1A1A1A] to-gray-800 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-sm inline-flex items-center gap-2">
                                <LayoutGrid size={14} /> Traiter
                             </button>
                          </td>
                       </tr>
                    )
                 })}
              </tbody>
           </table>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            
            const temp = getPriority(req.createdAt)
            const waMsg = `Bonjour ${req.buyerName}, nous avons tenté de vous joindre concernant votre commande pour le ${req.productName} d'un montant de ${req.orderTotal.toLocaleString('fr-FR')} FCFA. Merci de nous confirmer par ce message pour que le livreur puisse partir vous livrer ! 🚀`
            const waLink = `https://wa.me/${req.buyerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
            const isLocked = req.lockedUntil && new Date(req.lockedUntil) > new Date()
            const lockedByMe = isLocked && req.lockedBy === 'Moi'

            return (
              <div key={req.id} className="bg-white border border-line rounded-2xl p-5 sm:p-6 flex flex-col gap-4 sm:gap-6 hover:shadow-xl hover:shadow-emerald/5 transition-all duration-300 relative group overflow-hidden">
                 
                 {/* Ligne d'accentuation à gauche */}
                 {(activeTab === 'PENDING' || activeTab === 'SCHEDULED') && (
                   <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald opacity-20 group-hover:opacity-100 transition-opacity" />
                 )}

                 {/* Contenu de la carte (En haut) */}
                 <div className="flex flex-col xl:flex-row gap-6">
                   {/* Col 1: Utilisateur & Confiance */}
                   <div className="flex flex-col gap-4 xl:w-[35%] relative">
                      {isLocked && !lockedByMe && (
                        <div className="absolute -top-6 -left-6 -right-6 px-6 py-2 bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center gap-2 mb-4 xl:-mx-8 xl:-mt-8 xl:mb-6 rounded-t-2xl xl:rounded-none">
                          <Lock size={14} /> En cours de traitement par {req.lockedBy}
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mt-2 xl:mt-0">
                        <div>
                           <div className="flex items-center gap-2">
                             <h3 className="font-black text-ink text-lg sm:text-xl truncate">{req.buyerName}</h3>
                             <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider shrink-0 ${temp.color}`}>
                               <temp.icon size={10} /> {temp.label}
                             </span>
                           </div>
                           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3">
                             <a href={`tel:${req.buyerPhone}`} onClick={() => startCall(req.id)} className="flex-1 inline-flex items-center justify-center gap-2 text-slate hover:text-emerald font-black px-4 py-2.5 bg-slate-100 hover:bg-emerald/10 rounded-xl transition-all border border-transparent hover:border-emerald/20 text-sm">
                                <PhoneIcon size={16} />
                                {req.buyerPhone}
                             </a>
                             <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#1EBE5C] font-black px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#25D366]/20 text-sm hover:-translate-y-0.5" title="Lancer une discussion WhatsApp">
                                <WhatsAppIcon className="w-4 h-4" /> Message Direct
                             </a>
                           </div>
                        </div>
                        <div className="xl:hidden">
                          {getStatusBadge(req.status)}
                        </div>
                      </div>

                      {/* Panneau Score de Confiance */}
                      <div className={`rounded-xl p-3.5 border ${req.score ? (req.score.refused_orders > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald/5 border-emerald/10') : 'bg-slate-50 border-line'}`}>
                         {req.score ? (
                            req.score.refused_orders > 0 ? (
                              <div className="flex items-start gap-3 text-red-600">
                                 <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                                 <div>
                                   <p className="text-xs font-black uppercase tracking-wider mb-0.5">Attention Recommandée</p>
                                   <p className="text-xs font-bold opacity-80">{req.score.refused_orders} refus sur {req.score.total_orders} commandes réseau.</p>
                                 </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3 text-emerald">
                                 <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                                 <div>
                                   <p className="text-xs font-black uppercase tracking-wider mb-0.5">Client Très Fiable</p>
                                   <p className="text-xs font-bold opacity-80">{req.score.total_orders} commandes récupérées. Taux refus 0%.</p>
                                 </div>
                              </div>
                            )
                         ) : (
                            <div className="flex items-start gap-3 text-amber-500">
                               <ShieldQuestion size={20} className="shrink-0 mt-0.5" />
                               <div>
                                 <p className="text-xs font-black uppercase tracking-wider mb-0.5">Nouveau Profil</p>
                                 <p className="text-xs font-bold opacity-80">Aucun historique sur le réseau PDV Pro.</p>
                               </div>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Col 2: Détails Commande */}
                   <div className="flex flex-col gap-2 xl:w-[30%] xl:px-8 xl:border-x border-dashed border-line">
                      <div className="flex items-center gap-2 text-dust text-xs font-bold mb-1">
                         <CalendarIcon size={14} />
                         Cmd: {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="font-bold text-ink text-sm sm:text-base leading-tight">{req.productName}</p>
                      <p className="text-xs text-slate font-bold uppercase tracking-wider mt-1">{req.storeName}</p>
                      
                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-dashed border-line xl:border-none xl:pt-6">
                         <div>
                           <p className="text-[10px] uppercase font-black text-dust tracking-wider">Montant à encaisser</p>
                           <p className="font-black text-emerald text-xl sm:text-2xl">{req.orderTotal.toLocaleString('fr-FR')} <span className="text-sm">F</span></p>
                         </div>
                      </div>
                   </div>

                   {/* Col 3: Actions & Status (Droite) */}
                   <div className="flex flex-col justify-center gap-4 xl:w-[35%] mt-4 xl:mt-0 relative">
                      <div className="hidden xl:flex justify-end mb-2">
                        {getStatusBadge(req.status)}
                      </div>
                      
                      {['PENDING', 'SCHEDULED'].includes(req.status) ? (
                        <>
                           {!openScriptId || openScriptId !== req.id ? (
                             <div className="flex-1 flex flex-col items-center justify-center p-4">
                               <button 
                                 onClick={() => startCall(req.id)}
                                 className="w-full bg-ink hover:bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-ink/20"
                               >
                                 <PhoneIcon className="w-5 h-5" /> Démarrer l&apos;Appel
                               </button>
                               <p className="text-xs font-bold text-dust mt-3 text-center">Cliquez ici quand ça sonne pour verrouiller le client à votre nom et ouvrir le script de vente.</p>
                             </div>
                           ) : (
                             <div className="flex flex-col gap-3 h-full justify-end animate-in fade-in">
                               <button 
                                 onClick={() => handleAction(req.id, 'VALIDATED')}
                                 disabled={loading !== null}
                                 className="w-full bg-emerald hover:bg-emerald/90 text-white font-black py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald/20 disabled:opacity-50"
                               >
                                 {loading === req.id ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5" />}
                                 Valider l&apos;Expédition
                               </button>
                               <div className="grid grid-cols-2 gap-3">
                                 <button 
                                   onClick={() => handleAction(req.id, 'NO_REPLY')}
                                   disabled={loading !== null}
                                   className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-[10px] sm:text-xs disabled:opacity-50"
                                 >
                                   <Clock className="w-4 h-4" /> Injoignable
                                 </button>
                                 <button 
                                   onClick={() => handleAction(req.id, 'CANCELLATION_REQUESTED')}
                                   disabled={loading !== null}
                                   className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-[10px] sm:text-xs disabled:opacity-50"
                                 >
                                   <XCircleIcon className="w-4 h-4" /> Annuler / Refus
                                 </button>
                               </div>

                               {/* ⏰ Planifier un rappel */}
                               <div className="flex items-center gap-2 mt-2">
                                 <input 
                                   type="datetime-local" 
                                   value={scheduleDateMap[req.id] || ''}
                                   onChange={(e) => setScheduleDateMap({...scheduleDateMap, [req.id]: e.target.value})}
                                   className="flex-1 bg-slate-50 border border-line text-ink text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald focus:border-emerald outline-none" 
                                 />
                                 <button 
                                   onClick={() => {
                                      if(!scheduleDateMap[req.id]) { toast.error('Veuillez choisir une date'); return; }
                                      handleAction(req.id, 'SCHEDULED', undefined, new Date(scheduleDateMap[req.id]))
                                   }}
                                   disabled={loading !== null || !scheduleDateMap[req.id]}
                                   className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-xs disabled:opacity-50"
                                 >
                                   Planifier
                                 </button>
                               </div>

                             </div>
                           )}
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-line text-dust font-bold text-sm min-h-[100px] p-6 text-center">
                           <CheckCircleIcon size={24} className="mb-2 opacity-50 text-emerald" />
                           Demande traitée
                        </div>
                      )}
                   </div>
                 </div>

                 {/* 🎙️ SCRIPT D'APPEL DIRECT */}
                 {openScriptId === req.id && (['PENDING', 'SCHEDULED'].includes(req.status)) && (
                   <div className="mt-2 pt-4 border-t border-dashed border-line animate-in slide-in-from-top-2">
                      <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 opacity-10"><PhoneIcon size={48} /></div>
                         <p className="text-sm sm:text-base font-medium text-slate leading-relaxed">
                            &quot;<span className="font-bold text-ink">Bonjour {req.buyerName}</span>, c&apos;est l&apos;équipe de <span className="font-bold text-ink">{req.storeName}</span>. Je vous appelle pour vous confirmer l&apos;expédition immédiate de votre commande pour le <span className="font-bold text-ink">{req.productName}</span>. Le livreur vous demandera un total de <span className="font-black text-emerald bg-emerald/10 px-1 rounded">{req.orderTotal.toLocaleString('fr-FR')} FCFA</span> à la livraison. L&apos;adresse de livraison que vous avez renseigné est-elle toujours <span className="italic font-bold">100% correcte</span> pour vous livrer aujourd'hui ?&quot;
                         </p>
                      </div>
                   </div>
                 )}

                 {/* 💬 BOUTON RELANCE WHATSAPP */}
                 {req.status === 'NO_REPLY' && (
                   <div className="mt-2 pt-4 border-t border-dashed border-line animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-ink flex items-center gap-2">
                            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" /> Relance WhatsApp
                          </p>
                          <p className="text-xs text-slate mt-1 max-w-lg">
                            75% des injoignables réagissent via WhatsApp.
                          </p>
                        </div>
                        <a 
                          href={waLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-[#25D366] hover:bg-[#1EBE5C] text-white font-black py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-[#25D366]/20 shrink-0 text-sm"
                        >
                          Envoyer un message pré-écrit
                        </a>
                      </div>
                   </div>
                 )}

                 {/* 📝 SECTION NOTES & HISTORIQUE */}
                 <div className="mt-1 pt-4 border-t border-dashed border-line flex flex-col xl:flex-row gap-4">
                    <div className="flex-1">
                      <button 
                        onClick={() => setOpenHistoryId(openHistoryId === req.id ? null : req.id)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-dust hover:text-ink transition-colors w-fit mb-3"
                      >
                         <History size={14} /> Timeline d&apos;Historique ({req.history.length}) {openHistoryId === req.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                      
                      {openHistoryId === req.id && (
                        <div className="space-y-3 pl-3 border-l-2 border-line ml-1 animate-in fade-in mb-4">
                           {req.history.map((h, i) => (
                             <div key={h.id || i} className="relative">
                               <div className="absolute -left-[1.35rem] top-1.5 w-2 h-2 rounded-full bg-slate-300 border-2 border-white"></div>
                               <p className="text-xs text-slate font-medium">
                                 <span className="font-bold text-ink">{h.agentName}</span> a marqué comme <span className="font-black">{h.action}</span>
                                 <span className="text-[10px] text-dust ml-2">{new Date(h.createdAt).toLocaleString('fr-FR')}</span>
                               </p>
                               {h.details && (
                                 <p className="text-xs text-slate bg-slate-50 p-2 rounded block mt-1 italic border border-line border-l-amber-400 border-l-4">{h.details}</p>
                               )}
                             </div>
                           ))}
                           {req.history.length === 0 && <p className="text-xs text-dust italic">Aucun historique récent.</p>}
                        </div>
                      )}
                    </div>
                    
                    {/* ADD NOTE INPUT */}
                    <div className="xl:w-1/3 flex gap-2 items-start">
                       <div className="relative flex-1">
                          <Edit3 size={14} className="absolute left-3 top-3 text-dust" />
                          <textarea 
                            value={noteMap[req.id] || ''}
                            onChange={(e) => setNoteMap({...noteMap, [req.id]: e.target.value})}
                            placeholder="Ajouter une note de suivi..."
                            className="w-full bg-slate-50 border border-line text-ink text-xs rounded-xl pl-9 pr-3 py-2.5 min-h-[44px] max-h-[100px] focus:ring-2 focus:ring-emerald focus:border-emerald outline-none resize-none transition-all"
                            rows={1}
                          />
                       </div>
                       <button 
                         onClick={() => {
                            if (!noteMap[req.id]?.trim()) return
                            handleAction(req.id, 'NOTE_ADDED', noteMap[req.id])
                         }}
                         disabled={!noteMap[req.id]?.trim() || loading !== null}
                         className="bg-slate-100 hover:bg-emerald text-slate hover:text-white disabled:opacity-50 p-3 rounded-xl transition-all"
                       >
                         {loading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                       </button>
                    </div>
                 </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
