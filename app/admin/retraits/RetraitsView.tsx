'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import { 
  Search, Calendar, LayoutGrid, List, CheckCircle2, Clock, XCircle, AlertCircle, 
  FileSpreadsheet, CheckSquare, Square, Filter,
  Wallet, ExternalLink, Loader2, CreditCard
} from 'lucide-react'
import WithdrawalActions from './WithdrawalActions'

interface StoreRow {
  id: string
  name: string
}

interface WithdrawalRow {
  id: string
  amount: number
  payment_method: string
  phone_or_iban: string
  status: 'pending' | 'approved' | 'rejected' | 'insufficient_funds' | 'paid' | 'processing'
  requested_at: string
  processed_at: string | null
  store_id: string | null
  Store?: StoreRow | null
}

interface RetraitsViewProps {
  initialWithdrawals: WithdrawalRow[]
}

export function RetraitsView({ initialWithdrawals }: RetraitsViewProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>(initialWithdrawals)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'insufficient_funds'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH'>('ALL')
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'wave' | 'orange_money' | 'bank_transfer'>('ALL')
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  // STATS
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length
  const approvedCount = withdrawals.filter(w => ['approved', 'paid'].includes(w.status)).length
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length
  const insufficientCount = withdrawals.filter(w => w.status === 'insufficient_funds').length

  // FILTERING
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      // 1. Tab Filter
      if (activeTab === 'pending' && w.status !== 'pending') return false
      if (activeTab === 'approved' && !['approved', 'paid'].includes(w.status)) return false
      if (activeTab === 'rejected' && w.status !== 'rejected') return false
      if (activeTab === 'insufficient_funds' && w.status !== 'insufficient_funds') return false

      // 2. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const storeName = w.Store?.name?.toLowerCase() || ''
        const contact = w.phone_or_iban?.toLowerCase() || ''
        if (!storeName.includes(q) && !contact.includes(q)) return false
      }

      // 3. Date
      if (dateFilter !== 'ALL' && w.requested_at) {
        const reqDate = new Date(w.requested_at)
        const today = new Date()
        today.setHours(0,0,0,0)
        
        if (dateFilter === 'TODAY' && reqDate < today) return false
        if (dateFilter === 'YESTERDAY') {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          if (reqDate < yesterday || reqDate >= today) return false
        }
        if (dateFilter === 'LAST_7_DAYS') {
          const last7 = new Date(today)
          last7.setDate(last7.getDate() - 7)
          if (reqDate < last7) return false
        }
        if (dateFilter === 'THIS_MONTH') {
          if (reqDate.getMonth() !== today.getMonth() || reqDate.getFullYear() !== today.getFullYear()) return false
        }
      }

      // 4. Method
      if (methodFilter !== 'ALL') {
        if (w.payment_method?.toLowerCase() !== methodFilter) return false
      }

      return true
    })
  }, [withdrawals, activeTab, searchQuery, dateFilter, methodFilter])

  // SELECTION
  const handleSelectAll = () => {
    if (selectedIds.size === filteredWithdrawals.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredWithdrawals.map(w => w.id)))
    }
  }

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  // BULK ACTIONS
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    const idsToProcess = Array.from(selectedIds)
    
    // Check if they are all pending
    const invalid = idsToProcess.some(id => withdrawals.find(w => w.id === id)?.status !== 'pending')
    if (invalid) {
      toast.error("Vous ne pouvez approuver que des demandes 'En attente'.")
      return
    }

    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: `Confirmez-vous la validation de ${idsToProcess.length} retraits ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#10b981' // emerald-500
    })
    if (!result.isConfirmed) return

    setIsProcessingBulk(true)
    
    try {
      const res = await fetch(`/api/admin/retraits/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToProcess, action: 'approve' })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setWithdrawals(prev => prev.map(w => {
          if (idsToProcess.includes(w.id)) {
            const resultMatch = data.results?.find((r: any) => r.id === w.id)
            if (resultMatch && resultMatch.status === 'paid') return { ...w, status: 'paid' }
            if (resultMatch && resultMatch.status === 'failed') return { ...w, status: 'rejected' }
          }
          return w
        }))
        toast.success(`${data.approved} retraits validés avec succès !`)
        if (data.approved < idsToProcess.length) {
          toast.warning(`${idsToProcess.length - data.approved} retraits ont échoué.`)
        }
      } else {
        toast.error(data.error || "Erreur lors du traitement groupé.")
      }
    } catch (e: any) {
      toast.error("Erreur réseau inattendue.")
    } finally {
      setIsProcessingBulk(false)
      setSelectedIds(new Set())
    }
  }

  // EXPORT CSV
  const handleExportCSV = () => {
    if (filteredWithdrawals.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }
    
    const headers = ['ID', 'Boutique', 'Montant', 'Méthode', 'Contact/IBAN', 'Date', 'Statut']
    const csvContent = [
      headers.join(','),
      ...filteredWithdrawals.map(w => [
        w.id,
        `"${w.Store?.name || 'N/A'}"`,
        w.amount,
        w.payment_method || 'N/A',
        `"${w.phone_or_iban || 'N/A'}"`,
        `"${format(new Date(w.requested_at), 'yyyy-MM-dd HH:mm')}"`,
        w.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `retraits_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Export CSV généré")
  }

  const renderBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <span className="flex items-center w-fit gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-xs sm:text-xs font-black uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Payé</span>
      case 'pending':
        return <span className="flex items-center w-fit gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-md text-xs sm:text-xs font-black uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> En attente</span>
      case 'rejected':
        return <span className="flex items-center w-fit gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-600 rounded-md text-xs sm:text-xs font-black uppercase tracking-wider"><XCircle className="w-3.5 h-3.5" /> Rejeté</span>
      case 'insufficient_funds':
        return <span className="flex items-center w-fit gap-1.5 px-2.5 py-1 bg-orange-600/10 text-orange-600 rounded-md text-xs sm:text-xs font-black uppercase tracking-wider"><AlertCircle className="w-3.5 h-3.5" /> Insuffisant</span>
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 text-gray-600 rounded-md text-xs sm:text-xs font-black uppercase tracking-wider">{status}</span>
    }
  }

  const getMethodColor = (m: string) => {
    const raw = m?.toLowerCase() || ''
    if (raw.includes('wave')) return 'bg-blue-500/10 text-blue-600 border-blue-200'
    if (raw.includes('orange')) return 'bg-orange-500/10 text-orange-600 border-orange-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className="flex flex-col lg:flex-row items-start animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
      
      {/* ── ONGLETS LATÉRAUX (ACCOLÉS À LA SIDEBAR PRINCIPALE) ── */}
      <aside className="w-full lg:w-[300px] flex-shrink-0 sticky top-[64px] z-10 lg:h-[calc(100vh-64px)] overflow-y-auto bg-white/80 backdrop-blur-3xl border-r border-gray-200 p-5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col gap-6">
        <div>
          <h2 className="text-xs items-center gap-2 flex font-black uppercase text-gray-400 tracking-widest pl-2 mb-4">
            <Filter size={14} /> Filtres Rapides
          </h2>
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'all', label: 'Toutes les demandes', count: withdrawals.length, activeStyle: 'bg-gradient-to-r from-[#0F7A60] to-teal-600 text-white shadow-md shadow-[#0F7A60]/20' },
              { id: 'pending', label: 'En attente', count: pendingCount, activeStyle: 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/20' },
              { id: 'approved', label: 'Payés', count: approvedCount, activeStyle: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20' },
              { id: 'rejected', label: 'Rejetés', count: rejectedCount, activeStyle: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20' },
              { id: 'insufficient_funds', label: 'Fonds insuffisants', count: insufficientCount, activeStyle: 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/20' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'pending' | 'approved' | 'rejected' | 'insufficient_funds')}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? tab.activeStyle : 'bg-transparent text-gray-500 hover:bg-white hover:text-gray-900 border border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeTab === tab.id ? 'bg-white' : 'bg-gray-300'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Bulk Actions for Sidebar */}
        {selectedIds.size > 0 && activeTab === 'pending' && (
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl p-5 shadow-xl shadow-amber-500/20 animate-in slide-in-from-left text-white mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Wallet size={64}/></div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-2 relative z-10">Sélection Active</h3>
            <p className="font-bold text-2xl mb-5 relative z-10">{selectedIds.size}</p>
            <button 
              onClick={handleBulkApprove}
              disabled={isProcessingBulk}
              className="w-full bg-white text-amber-600 hover:bg-gray-50 font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 relative z-10"
            >
              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-amber-500"/>}
              Payer le lot
            </button>
          </div>
        )}
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        
        {/* BARRE DE RECHERCHE ET FILTRES MAX */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between bg-white/70 backdrop-blur-2xl p-4 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
           <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Chercher une boutique, un téléphone, ou un IBAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#0F7A60] focus:border-[#0F7A60] outline-none transition-all shadow-inner"
              />
           </div>

           <div className="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0 [scrollbar-width:none]">
              <select 
                value={dateFilter} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFilter(e.target.value as 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH')}
                className="bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 py-2.5 px-3 rounded-xl outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                title="Filtre par date"
              >
                <option value="ALL">Toutes les dates</option>
                <option value="TODAY">Aujourd'hui</option>
                <option value="YESTERDAY">Hier</option>
                <option value="LAST_7_DAYS">7 derniers jours</option>
                <option value="THIS_MONTH">Ce mois-ci</option>
              </select>

              <select 
                value={methodFilter} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethodFilter(e.target.value as 'ALL' | 'wave' | 'orange_money' | 'bank_transfer')}
                className="bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 py-2.5 px-3 rounded-xl outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                title="Moyen de paiement"
              >
                <option value="ALL">Canal de paiement</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="bank_transfer">Virement Bancaire</option>
              </select>

              <div className="w-px h-8 bg-gray-200 shrink-0 mx-1"></div>

              <button 
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>

              <div className="flex items-center bg-gray-50 p-1.5 rounded-xl border border-gray-100 shrink-0">
                 <button 
                   title="Vue Cartes"
                   onClick={() => setViewMode('CARDS')}
                   className={`p-1.5 rounded-lg transition-colors ${viewMode === 'CARDS' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
                 >
                   <LayoutGrid className="w-4 h-4" />
                 </button>
                 <button 
                   title="Vue Tableau"
                   onClick={() => setViewMode('TABLE')}
                   className={`p-1.5 rounded-lg transition-colors ${viewMode === 'TABLE' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
                 >
                   <List className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>

        {/* ── LISTING ── */}
        {filteredWithdrawals.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center bg-white/50 border border-dashed border-gray-300 rounded-[32px] shadow-sm">
            <Wallet size={48} className="text-gray-300 mb-4 animate-bounce" />
            <p className="font-display font-black text-gray-900 text-xl uppercase tracking-tight">Aucun Résultat</p>
            <p className="text-sm font-medium text-gray-500 mt-2 max-w-sm px-4">Modifiez vos filtres ou accédez à une autre section.</p>
          </div>
        ) : viewMode === 'TABLE' ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[32px] overflow-x-auto shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
             <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#0F7A60]/[0.02] border-b border-gray-100 text-xs font-black text-gray-500 uppercase tracking-widest">
                   <tr>
                      <th className="px-6 py-5 rounded-tl-[32px] w-12">
                        <button title="Sélectionner tout" onClick={handleSelectAll} className="p-1 hover:text-[#0F7A60] transition-colors">
                          {selectedIds.size === filteredWithdrawals.length ? <CheckSquare size={16} className="text-[#0F7A60]" /> : <Square size={16} /> }
                        </button>
                      </th>
                      <th className="px-3 py-5">Boutique</th>
                      <th className="px-6 py-5">Montant demandé</th>
                      <th className="px-6 py-5">Canal</th>
                      <th className="px-6 py-5">Contact / IBAN</th>
                      <th className="px-6 py-5">Date & Heure</th>
                      <th className="px-6 py-5">Statut</th>
                      <th className="px-6 py-5 text-right rounded-tr-[32px]">Gestion</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredWithdrawals.map(wr => {
                     const isSelected = selectedIds.has(wr.id)
                     return (
                         <tr key={wr.id} className={`hover:bg-[#0F7A60]/[0.02] transition-colors border-b border-gray-100 last:border-0 group ${isSelected ? 'bg-[#0F7A60]/[0.04]' : ''}`}>
                            <td className="px-6 py-5">
                              <button title="Sélectionner" onClick={() => toggleSelection(wr.id)} className={`p-1 transition-colors ${isSelected ? 'text-[#0F7A60]' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                              </button>
                            </td>
                            <td className="px-3 py-5">
                              <Link href={`/admin/vendeurs/${wr.store_id}`} className="flex flex-col group/link">
                                <span className="font-bold text-sm group-hover/link:text-[#0F7A60] transition-colors text-gray-900">{wr.Store?.name || 'N/A'}</span>
                                <span className="text-xs font-mono text-gray-400 group-hover/link:text-gray-500 flex items-center gap-1 mt-0.5">ID: {wr.id.slice(0, 8)} <ExternalLink size={10}/></span>
                              </Link>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-base font-black text-gray-900">
                                {wr.amount.toLocaleString()} <span className="text-xs font-bold text-gray-400">F</span>
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${getMethodColor(wr.payment_method)}`}>
                                {wr.payment_method || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-xs font-bold text-gray-600 font-mono tracking-tight bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                              {wr.phone_or_iban || 'N/A'}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col border-l-2 border-emerald-500/20 pl-3">
                                <span className="text-xs font-bold text-gray-900">{wr.requested_at ? format(new Date(wr.requested_at), 'dd MMM yyyy') : 'N/A'}</span>
                                <span className="text-xs text-gray-500 font-semibold uppercase">{wr.requested_at ? format(new Date(wr.requested_at), 'HH:mm') : ''}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {renderBadge(wr.status)}
                            </td>
                            <td className="px-6 py-5 text-right">
                              {wr.status === 'pending' ? (
                                <WithdrawalActions withdrawalId={wr.id} status={wr.status} />
                              ) : (
                                <span className="text-xs font-bold text-gray-400 italic">Traitée</span>
                              )}
                            </td>
                         </tr>
                     )
                   })}
                </tbody>
             </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredWithdrawals.map(wr => {
              const isSelected = selectedIds.has(wr.id)
              return (
                <div 
                  key={wr.id} 
                  className={`bg-white/80 backdrop-blur-xl border rounded-[28px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden ${isSelected ? 'border-[#0F7A60] shadow-[0_8px_30px_rgba(15,122,96,0.12)]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <button 
                    title="Sélectionner"
                    onClick={() => toggleSelection(wr.id)} 
                    className={`absolute top-6 left-6 z-10 p-1 bg-white rounded transition-colors ${isSelected ? 'text-[#0F7A60]' : 'text-gray-300 hover:text-gray-900'}`}
                  >
                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>

                  <div className="flex justify-between items-start pl-8 mb-4">
                    <Link href={`/admin/vendeurs/${wr.store_id}`} className="hover:opacity-80 transition-opacity">
                      <p className="text-xs uppercase font-black text-gray-400 tracking-wider">BOUTIQUE Vendeur</p>
                      <h3 className="font-black text-lg text-gray-900 line-clamp-1">{wr.Store?.name || 'N/A'}</h3>
                    </Link>
                    {renderBadge(wr.status)}
                  </div>

                  <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col gap-3 mb-5">
                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><CreditCard size={14}/> Montant</span>
                      <span className="font-black text-2xl text-gray-900">{wr.amount.toLocaleString()} <span className="text-sm text-gray-400">F</span></span>
                    </div>
                    <div className="h-px bg-gray-200 w-full" />
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-black uppercase tracking-wider px-2 py-0.5 rounded ${getMethodColor(wr.payment_method)}`}>{wr.payment_method || 'N/A'}</span>
                      <span className="font-mono font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-200">{wr.phone_or_iban || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                      <Calendar size={12} /> {wr.requested_at ? format(new Date(wr.requested_at), 'dd/MM/yy HH:mm') : ''}
                    </div>
                    
                    {wr.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                         <WithdrawalActions withdrawalId={wr.id} status={wr.status} />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">Demande Traitée</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
