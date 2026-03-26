'use client'

import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subDays, isAfter, parseISO, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Link from 'next/link'
import Image from 'next/image'
import { AutoWithdrawSettings } from './AutoWithdrawSettings'

export interface TransactionRow {
  id: string
  type: 'order' | 'withdrawal'
  created_at: string
  amount: number
  platform_fee?: number
  delivery_fee?: number
  subtotal?: number
  status: string
  label: string
  notes?: string
}

interface WalletDashboardClientProps {
  balance:      number
  pending:      number
  totalEarned:  number
  initialTransactions: TransactionRow[]
  autoWithdrawEnabled?: boolean
  autoWithdrawThreshold?: number
  monthlyGoal: number
  walletId: string
  hasWithdrawalAccount: boolean
  canWithdraw: boolean
  methodLabel: string
  withdrawalMethod: string
  withdrawalNumber: string
  withdrawalName: string
  storeId: string
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function formatDateLabel(iso: string): string {
  const now  = new Date()
  const date = new Date(iso)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60)    return "à l'instant"
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'hier'

  return format(date, 'dd MMM à HH:mm', { locale: fr })
}

export function WalletDashboardClient({
  balance,
  pending,
  totalEarned,
  initialTransactions,
  monthlyGoal,
  walletId,
  autoWithdrawEnabled,
  autoWithdrawThreshold,
  hasWithdrawalAccount,
  methodLabel,
  withdrawalMethod,
  withdrawalNumber,
  withdrawalName,
}: WalletDashboardClientProps) {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview')
  const [filter, setFilter] = useState<'all' | '30d' | '7d' | 'today'>('all')

  // Gamification Goal State
  const [activeGoal, setActiveGoal] = useState(monthlyGoal || 1000000)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editGoalValue, setEditGoalValue] = useState(activeGoal.toString())
  const [isGoalSaving, setIsGoalSaving] = useState(false)

  const handleSaveGoal = async () => {
    const val = Number(editGoalValue)
    if (val < 1000 || isNaN(val)) {
      setIsEditingGoal(false)
      return
    }
    
    setIsGoalSaving(true)
    try {
      const res = await fetch('/api/wallet/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, monthly_goal: val })
      })
      if (res.ok) {
        setActiveGoal(val)
      }
    } finally {
      setIsEditingGoal(false)
      setIsGoalSaving(false)
    }
  }

  // 1. Filtrage des transactions temporelles
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    return initialTransactions.filter(t => {
      const d = parseISO(t.created_at)
      if (filter === '7d') return isAfter(d, subDays(now, 7))
      if (filter === '30d') return isAfter(d, subDays(now, 30))
      if (filter === 'today') return isAfter(d, startOfDay(now))
      return true
    })
  }, [initialTransactions, filter])

  // 2. Préparation des données pour le Graphique (Recharts) - Uniquement VENTES
  const chartData = useMemo(() => {
    const incomeOrders = filteredTransactions.filter(t => t.type === 'order')
    if (incomeOrders.length === 0) return []

    const chronological = [...incomeOrders].reverse()
    const grouped: Record<string, number> = {}

    chronological.forEach(t => {
      const day = format(parseISO(t.created_at), 'dd MMM', { locale: fr })
      grouped[day] = (grouped[day] || 0) + Number(t.amount)
    })

    return Object.entries(grouped).map(([date, total]) => ({ date, total }))
  }, [filteredTransactions])

  // 3. Logique d'exportation
  const handleExportCSV = () => {
    const csvData = filteredTransactions.map(t => ({
      'ID Transaction': t.id,
      'Type': t.type === 'order' ? 'Vente' : 'Retrait',
      'Libellé': t.label,
      'Date': format(parseISO(t.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      'Statut': t.status,
      'Montant (FCFA)': t.type === 'withdrawal' ? -t.amount : t.amount
    }))
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Releve_Transactions_${format(new Date(), 'dd_MM_yyyy')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.setTextColor(15, 122, 96)
    doc.text("Relevé des Transactions", 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Émis le : ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, 14, 30)
    const periodLabel = filter === 'all' ? 'Toutes les transactions' 
      : filter === '30d' ? '30 Derniers Jours'
      : filter === '7d' ? '7 derniers jours' : "Aujourd'hui"
    doc.text(`Période : ${periodLabel}`, 14, 36)

    const tableData = filteredTransactions.map(t => [
      t.label,
      t.type === 'order' ? 'Vente' : 'Retrait',
      format(parseISO(t.created_at), 'dd/MM/yyyy HH:mm'),
      t.type === 'withdrawal' ? `-${new Intl.NumberFormat('fr-FR').format(t.amount)} FCFA` : `+${new Intl.NumberFormat('fr-FR').format(t.amount)} FCFA`
    ])

    // @ts-expect-error - types
    doc.autoTable({
      startY: 42,
      head: [['Libellé', 'Type', 'Date', 'Montant']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 122, 96] }, // Vert PDV Pro
      styles: { fontSize: 9 },
    })

    doc.save(`Releve_Transactions_${format(new Date(), 'dd_MM_yyyy')}.pdf`)
  }

  const handleExportPlatformInvoice = () => {
    const doc = new jsPDF()
    doc.setFontSize(24)
    doc.setTextColor(26, 26, 26) // #1A1A1A
    doc.text("FACTURE PDV PRO", 14, 22)
    
    doc.setFontSize(12)
    doc.setTextColor(15, 122, 96) // Vert PDV Pro
    doc.text("Frais de Plateforme & Commissions", 14, 30)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Facturé au : ${format(new Date(), 'dd/MM/yyyy')}`, 14, 40)
    doc.text(`Période : ${filter === 'all' ? 'Globale' : 'Période Sélectionnée'}`, 14, 46)

    const incomeOrders = filteredTransactions.filter(t => t.type === 'order')
    const invoiceRows = incomeOrders.map(t => {
      const brut = t.subtotal || 0
      const fee = t.platform_fee || 0
      const rate = brut > 0 ? ((fee / brut) * 100).toFixed(1).replace('.0', '') + '%' : '-'
      return [
        t.label,
        format(parseISO(t.created_at), 'dd/MM/yyyy'),
        `${new Intl.NumberFormat('fr-FR').format(brut)} FCFA`,
        rate,
        `${new Intl.NumberFormat('fr-FR').format(fee)} FCFA`
      ]
    })

    const totalFees = incomeOrders.reduce((acc, t) => acc + (t.platform_fee || 0), 0)

    // @ts-expect-error - third party types
    doc.autoTable({
      startY: 55,
      head: [['Commande', 'Date', 'Montant Client', 'Taux', 'Frais Prélevés']],
      body: invoiceRows,
      theme: 'grid',
      headStyles: { fillColor: [26, 26, 26] },
      styles: { fontSize: 9 },
      foot: [['', '', '', 'TOTAL FRAIS:', `${new Intl.NumberFormat('fr-FR').format(totalFees)} FCFA`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [26, 26, 26], fontStyle: 'bold' }
    })

    doc.save(`Facture_Frais_PDV_PRO_${format(new Date(), 'MM_yyyy')}.pdf`)
  }

  return (
    <div className="w-full space-y-6 lg:space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* ── Tabs Navigation ── */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm mx-auto lg:mx-0 overflow-x-auto max-w-full hide-scrollbar">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-white/40'}`}
        >
          <span className="text-lg">📊</span> Vue d'ensemble
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'transactions' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-white/40'}`}
        >
          <span className="text-lg">🧾</span> Transactions
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-white/40'}`}
        >
          <span className="text-lg">⚙️</span> Config. Retraits
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          {/* 3 Cards stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 relative">
            <div className="absolute inset-0 bg-[#0F7A60]/5 rounded-[32px] blur-3xl -z-10 pointer-events-none"></div>

            {/* Solde disponible */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0F7A60] to-[#0A5240] rounded-[32px] p-6 lg:p-8 text-white shadow-2xl shadow-[#0F7A60]/20 group transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-700 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-white/90 uppercase tracking-wider">
                    Solde disponible
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <span className="text-lg">🏧</span>
                  </div>
                </div>
                <div>
                  <p className="text-4xl lg:text-5xl font-black leading-none tracking-tight drop-shadow-sm">
                    {formatAmount(balance)}
                  </p>
                  <p className="text-sm text-white/80 mt-2 font-black uppercase tracking-wider">FCFA</p>
                </div>
              </div>
            </div>

            {/* En attente */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs font-black text-dust uppercase tracking-wider">
                  En attente
                </p>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase shadow-sm border border-amber-200">
                  Ventes en cours
                </span>
              </div>
              <p className="text-4xl lg:text-5xl font-black text-[#C9A84C] leading-none tracking-tight relative z-10 drop-shadow-[0_2px_10px_rgba(201,168,76,0.2)]">
                {formatAmount(pending)}
              </p>
              <div className="flex items-center gap-2 mt-3 relative z-10">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">FCFA</p>
                {pending > 0 && (
                  <span className="text-[10px] text-[#0F7A60] font-black bg-[#0F7A60]/10 border border-[#0F7A60]/20 px-2.5 py-1 rounded-md mt-0.5 shadow-sm">
                    ⚡ Dispo dès réception client
                  </span>
                )}
              </div>
            </div>

            {/* Total gagné & Gamification (Objectif) */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 lg:p-8 shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-dust uppercase tracking-wider">
                    Total gagné
                  </p>
                  <div className="w-10 h-10 border border-gray-100 rounded-xl bg-gray-50/50 flex items-center justify-center text-lg shadow-sm">📈</div>
                </div>
                <p className="text-4xl lg:text-5xl font-black text-ink leading-none tracking-tight drop-shadow-sm">
                  {formatAmount(totalEarned)}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 relative z-10 w-full animate-in fade-in">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Objectif 🎯</span>
                    {!isEditingGoal && (
                      <button 
                        onClick={() => { setIsEditingGoal(true); setEditGoalValue(activeGoal.toString()); }} 
                        className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-400 hover:text-[#0F7A60] hover:bg-[#0F7A60]/10 text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border border-gray-100"
                      >
                        ✏️ Modifier
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-[#0F7A60]">
                    {Math.min(100, (totalEarned / Math.max(1, activeGoal)) * 100).toFixed(0)}% Atteint
                  </span>
                </div>
                
                {isEditingGoal ? (
                  <div className="flex items-center gap-2 mb-1 animate-in slide-in-from-top-1">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        value={editGoalValue}
                        onChange={e => setEditGoalValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveGoal()
                          if (e.key === 'Escape') setIsEditingGoal(false)
                        }}
                        className="w-full bg-[#FAFAF7] border-2 border-[#0F7A60]/30 text-xs font-black text-[#1A1A1A] rounded-lg pl-3 pr-10 py-1.5 outline-none focus:border-[#0F7A60] transition-colors shadow-sm"
                        placeholder="Montant cible (ex: 1000000)"
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">FCFA</span>
                    </div>
                    <button 
                      onClick={handleSaveGoal}
                      disabled={isGoalSaving}
                      className="px-3 py-1.5 bg-[#0F7A60] text-white text-[11px] font-bold rounded-lg hover:bg-[#0A5240] transition-colors disabled:opacity-50 flex-shrink-0 shadow-sm"
                    >
                      {isGoalSaving ? '...' : 'Valider'}
                    </button>
                    <button 
                      onClick={() => setIsEditingGoal(false)}
                      disabled={isGoalSaving}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 border border-gray-200"
                      title="Annuler"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1 mb-1">
                    <div 
                      className="h-full bg-[#0F7A60] rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${Math.min(100, (totalEarned / Math.max(1, activeGoal)) * 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                    </div>
                  </div>
                )}
                
                {!isEditingGoal && (
                  <div className="flex justify-between items-center mt-1.5 text-[10px] font-medium text-gray-400">
                    <span>0</span>
                    <button 
                      onClick={() => { setIsEditingGoal(true); setEditGoalValue(activeGoal.toString()); }}
                      className="flex items-center gap-1 font-bold text-gray-500 hover:text-[#0F7A60] transition-colors group cursor-pointer"
                      title="Cliquez pour modifier le montant"
                    >
                      <span className="border-b border-dashed border-gray-300 group-hover:border-[#0F7A60]">{formatAmount(activeGoal)} FCFA</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Graphique d'évolution */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-[#0F7A60]/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] flex items-center gap-3">
                  <span className="text-2xl drop-shadow-sm">📊</span> Évolution des revenus
                </h2>
                <p className="text-sm text-dust mt-1">Revenus liés aux ventes (sans retraits)</p>
              </div>
              
              <div className="bg-cream/50 backdrop-blur-sm p-1.5 rounded-2xl hidden sm:flex space-x-1 border border-line shadow-inner">
                {['all', '30d', '7d', 'today'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as 'all' | '30d' | '7d' | 'today')}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                      filter === f 
                        ? 'bg-white text-ink shadow-md border border-white' 
                        : 'text-dust hover:text-ink hover:bg-white/40'
                    }`}
                  >
                    {f === 'all' ? 'Tout' : f === '30d' ? '30 Jours' : f === '7d' ? '7 Jours' : "Aujourd'hui"}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F7A60" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0F7A60" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#9ca3af' }} 
                      dy={10}
                    />
                    <YAxis 
                      hide={true}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      // @ts-expect-error - third party types - third party types
                      formatter={(value: number) => [`${new Intl.NumberFormat('fr-FR').format(value)} FCFA`, 'Revenus']}
                      labelStyle={{ fontWeight: 'bold', color: '#1A1A1A', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#0F7A60" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      activeDot={{ r: 6, fill: '#0F7A60', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] w-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <span className="text-2xl mb-2 opacity-50">📉</span>
                <p className="text-sm font-bold text-gray-400">Aucun revenu sur cette période</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          {/* Factures & Frais Plateforme */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#1A1A1A] flex items-center gap-2">
                <span className="text-xl">🧾</span> Factures & Frais Plateforme
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                Générez et téléchargez le récapitulatif mensuel détaillé des commissions prélevées par PDV Pro pour votre comptabilité.
              </p>
            </div>
            <button 
              onClick={handleExportPlatformInvoice}
              disabled={filteredTransactions.filter(t => t.type === 'order').length === 0}
              className="shrink-0 px-4 py-2.5 bg-[#FAFAF7] border border-gray-200 text-[#1A1A1A] text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📥</span> Télécharger le Relevé
            </button>
          </div>

          {/* Tableau des Transactions */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAFAF7]/50">
              <h2 className="text-base font-black text-[#1A1A1A] flex items-center gap-2">
                <span className="text-xl">💳</span> Historique des transactions
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex bg-white/60 p-1 rounded-lg border border-gray-200 shadow-inner mr-2">
                  {['all', '30d', '7d', 'today'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as 'all' | '30d' | '7d' | 'today')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${
                        filter === f 
                          ? 'bg-gray-800 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {f === 'all' ? 'Tout' : f === '30d' ? '30J' : f === '7d' ? '7J' : "Auj"}
                    </button>
                  ))}
                </div>

                {filteredTransactions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <span>📊</span> CSV
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <span>📄</span> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile filter dropdown */}
            <div className="sm:hidden px-6 py-3 border-b border-gray-50 bg-[#FAFAF7]">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | '30d' | '7d' | 'today')}
                className="w-full bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-xl px-3 py-2 outline-none focus:border-[#0F7A60]"
                title="Période"
              >
                <option value="all">Toutes les dates</option>
                <option value="30d">30 Derniers Jours</option>
                <option value="7d">7 Derniers Jours</option>
                <option value="today">Aujourd'hui</option>
              </select>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📭</span>
                </div>
                <p className="text-base font-bold text-gray-600 mb-1">Aucune transaction trouvée</p>
                <p className="text-sm text-gray-400">Essayez de modifier la période de filtrage.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold border-b border-gray-100">Client / Action</th>
                      <th className="px-6 py-4 font-semibold border-b border-gray-100">Date</th>
                      <th className="px-6 py-4 font-semibold border-b border-gray-100">Statut</th>
                      <th className="px-6 py-4 font-semibold text-right border-b border-gray-100">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FAFAF7] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {tx.type === 'withdrawal' ? (
                                <div className="relative w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-[13px] border border-gray-200 overflow-hidden">
                                  {tx.label.includes('Wave') ? (
                                    <Image src="/wave.svg" alt="Wave" fill className="object-cover" unoptimized />
                                  ) : tx.label.includes('Orange') ? (
                                    <Image src="/orange-money.svg" alt="Orange Money" fill className="object-cover bg-orange-500" unoptimized />
                                  ) : (
                                    <span className="grayscale opacity-80">🏦</span>
                                  )}
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#0F7A60]/10 flex items-center justify-center flex-shrink-0 text-xs font-black text-[#0F7A60]">
                                  {tx.label?.[0]?.toUpperCase() ?? 'C'}
                                </div>
                            )}
                            <span className="font-bold text-[#1A1A1A]">
                              {tx.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">
                          {formatDateLabel(tx.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          {tx.type === 'order' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0F7A60]/10 text-[#0F7A60]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A60] animate-pulse"></span>
                              Terminée
                            </span>
                          ) : (
                            tx.status === 'pending' && tx.notes?.startsWith('ALERT:') ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 cursor-help" title={tx.notes.replace('ALERT:', '')}>
                                 ⚠️ Retardé
                               </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                {tx.status === 'processing' ? 'En cours' : tx.status === 'paid' || tx.status === 'completed' || tx.status === 'approved' ? 'Traité' : tx.status === 'rejected' ? 'Échoué' : tx.status === 'pending' ? 'En attente' : tx.status}
                              </span>
                            )
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-black ${tx.type === 'withdrawal' ? 'text-[#1A1A1A]' : 'text-[#0F7A60]'}`}>
                            {tx.type === 'withdrawal' ? '-' : '+'}{formatAmount(Number(tx.amount))}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">FCFA</span>
                          {tx.type === 'order' && tx.subtotal !== undefined && tx.subtotal > 0 && (
                            <div className="text-[10px] text-gray-400 font-medium mt-1">
                              Brut {formatAmount(tx.subtotal)} — Frais {formatAmount(tx.platform_fee || 0)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: WITHDRAWALS & SETTINGS ── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Composant de paramétrage de retraits automatisés */}
          {hasWithdrawalAccount && (
            <AutoWithdrawSettings 
              walletId={walletId}
              initialEnabled={autoWithdrawEnabled}
              initialThreshold={autoWithdrawThreshold}
            />
          )}

          {/* Compte de retrait (readonly) */}
          {hasWithdrawalAccount && (
            <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full pointer-events-none blur-xl group-hover:bg-white/10 transition-colors duration-500" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <p className="text-sm font-bold text-white/90">Compte de retrait</p>
                </div>
                <Link
                  href="/dashboard/settings#retrait"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-inner"
                  title="Modifier"
                >
                  <span className="text-[11px]">✏️</span>
                </Link>
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Opérateur</p>
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 rounded-sm bg-white/10 flex items-center justify-center text-sm shadow-inner backdrop-blur-sm overflow-hidden">
                      {withdrawalMethod === 'wave' ? (
                        <Image src="/wave.svg" alt="Wave" fill className="object-cover" unoptimized />
                      ) : withdrawalMethod === 'orange_money' ? (
                        <Image src="/orange-money.svg" alt="Orange Money" fill className="object-cover bg-orange-500" unoptimized />
                      ) : (
                        '🏦'
                      )}
                    </div>
                    <p className="text-base font-black">{methodLabel}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Numéro de réception</p>
                  <p className="text-lg font-mono tracking-widest text-[#FFF] opacity-95">{withdrawalNumber}</p>
                </div>

                {withdrawalName && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Bénéficiaire</p>
                    <p className="text-sm font-bold truncate text-white/80">{withdrawalName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
