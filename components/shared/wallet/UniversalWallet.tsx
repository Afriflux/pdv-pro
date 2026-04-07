/* eslint-disable react/forbid-dom-props, jsx-a11y/control-has-associated-label, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, jsx-a11y/anchor-is-valid */
'use client'

import { useState, useMemo, useTransition } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subDays, isAfter, parseISO, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from '@/lib/toast'
import { handleUniversalWithdraw, handleUniversalDeposit } from '@/app/actions/wallet'
import { AutoWithdrawSettings } from '@/app/dashboard/wallet/AutoWithdrawSettings'

export interface TransactionRow {
  id: string
  type: 'order' | 'withdrawal' | 'deposit' | 'cashback'
  created_at: string
  amount: number
  platform_fee?: number
  subtotal?: number
  status: string
  label: string
  notes?: string
}

interface UniversalWalletProps {
  ownerType: 'vendor' | 'affiliate' | 'closer' | 'client'
  ownerId: string // The ID matching the owner type (Wallet ID, Affiliate ID, User ID)
  balance: number
  pending: number
  totalEarned: number
  totalWithdrawn?: number
  monthlyGoal: number
  transactions: TransactionRow[]
  
  // Withdrawal settings
  autoWithdrawEnabled?: boolean
  autoWithdrawThreshold?: number
  hasWithdrawalAccount?: boolean
  methodLabel?: string
  withdrawalMethod?: string
  withdrawalNumber?: string
  withdrawalName?: string
  kycStatus?: string
  
  // Labeling configs
  vocab: {
    title: string
    balance: string
    earned: string
    pending: string
    chartTitle: string
    chartSubtitle: string
    txLabel: string
  }
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function formatDateLabel(iso: string): string {
  const now  = new Date()
  const date = new Date(iso)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'hier'
  return format(date, 'dd MMM à HH:mm', { locale: fr })
}

export function UniversalWallet({
  ownerType,
  ownerId,
  balance,
  pending,
  totalEarned,
  totalWithdrawn = 0,
  monthlyGoal,
  transactions,
  autoWithdrawEnabled,
  autoWithdrawThreshold,
  // hasWithdrawalAccount,
  // methodLabel,
  withdrawalMethod = 'wave',
  withdrawalNumber = '',
  // withdrawalName = '',
  kycStatus = 'verified',
  vocab
}: UniversalWalletProps) {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview')
  const [filter, setFilter] = useState<'all' | '30d' | '7d' | 'today'>('all')

  // Modals state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  
  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000)
  const [withdrawInputValue, setWithdrawInputValue] = useState<string>('5000')
  const withdrawMethod = withdrawalMethod
  const withdrawPhone = withdrawalNumber
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [depositGateway, setDepositGateway] = useState({ id: 'wave', name: 'Wave Mobile Money', fee: 0.01, icon: '🌊' })
  const [isPending, startTransition] = useTransition()

  const QUICK_AMOUNTS = [5000, 10000, 25000, balance]
  const QUICK_LABELS  = ['5K', '10K', '25K', 'Max']
  const DEPOSIT_GATEWAYS = [
    { id: 'wave', name: 'Wave Mobile Money', fee: 0.01, icon: '🌊' },
    { id: 'cinetpay', name: 'Orange Money / CinetPay', fee: 0.02, icon: '🟠' },
    { id: 'paytech', name: 'Carte bancaire / PayTech', fee: 0.02, icon: '💳' },
  ]

  // Gamification
  const [activeGoal, setActiveGoal] = useState(monthlyGoal || 1000000)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editGoalValue, setEditGoalValue] = useState(activeGoal.toString())

  const handleSaveGoal = async () => {
    const val = Number(editGoalValue)
    if (val < 1000 || isNaN(val)) {
      setIsEditingGoal(false)
      return
    }
    setActiveGoal(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${ownerType}_monthly_goal`, val.toString())
    }
    setIsEditingGoal(false)
  }

  useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${ownerType}_monthly_goal`)
      if (saved) setActiveGoal(Number(saved))
    }
  }, [ownerType])

  // Handlers
  const handleWithdrawInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setWithdrawInputValue(raw)
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) setWithdrawAmount(parsed)
    else setWithdrawAmount(0)
  }

  const selectQuickWithdraw = (val: number) => {
    const clamped = Math.max(5000, Math.min(val, balance))
    setWithdrawAmount(clamped)
    setWithdrawInputValue(String(clamped))
  }

  const confirmWithdraw = () => {
    startTransition(async () => {
      const amt = Number(withdrawAmount)
      if (amt < 5000) {
        toast.error('Le retrait minimum est de 5000 FCFA')
        return
      }
      if (amt > balance) {
        toast.error('Solde insuffisant')
        return
      }
      const res = await handleUniversalWithdraw(ownerType, ownerId, amt, withdrawMethod, withdrawPhone)
      if (res.error) toast.error(res.error)
      else {
        toast.success(`Demande de retrait de ${amt.toLocaleString('fr-FR')} FCFA confirmée !`)
        setShowWithdrawModal(false)
        setWithdrawAmount(5000)
        setWithdrawInputValue('5000')
      }
    })
  }

  const confirmDeposit = () => {
    startTransition(async () => {
      const amt = Number(depositAmount)
      const res = await handleUniversalDeposit(ownerType, ownerId, amt)
      if (res.error) toast.error(res.error)
      else if (res.payment_url) {
        toast.loading('Redirection vers la page de paiement sécurisée...')
        window.location.href = res.payment_url
      }
    })
  }

  const isWithdrawAmountValid = withdrawAmount >= 5000 && withdrawAmount <= balance
  const feeAmount = depositAmount * depositGateway.fee
  const totalDepositAmount = depositAmount + feeAmount

  // Filters & Charts
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    return transactions.filter(t => {
      const d = parseISO(t.created_at)
      if (filter === '7d') return isAfter(d, subDays(now, 7))
      if (filter === '30d') return isAfter(d, subDays(now, 30))
      if (filter === 'today') return isAfter(d, startOfDay(now))
      return true
    })
  }, [transactions, filter])

  const chartData = useMemo(() => {
    // We plot Positive incoming transactions
    const incomeTypes = ['order', 'deposit', 'cashback']
    const incomeOrds = filteredTransactions.filter(t => incomeTypes.includes(t.type) && t.status !== 'rejected')
    if (incomeOrds.length === 0) return []

    const chronological = [...incomeOrds].reverse()
    const grouped: Record<string, number> = {}

    chronological.forEach(t => {
      const day = format(parseISO(t.created_at), 'dd MMM', { locale: fr })
      grouped[day] = (grouped[day] || 0) + Number(t.amount)
    })
    return Object.entries(grouped).map(([date, total]) => ({ date, total }))
  }, [filteredTransactions])

  return (
    <div className="w-full space-y-6 lg:space-y-8 animate-in fade-in duration-300 pb-12 relative">
      
      {/* ── Action Header (Déposer / Retirer) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-black text-[#1A1A1A] hidden sm:block">{vocab.title}</h2>
        
        <div className="relative z-10 shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          {/* DEPOSIT BUTTON REPLACEMENT */}
          <button
            onClick={() => setShowDepositModal(true)}
            className="relative overflow-hidden w-full sm:w-auto px-6 py-3.5 bg-gradient-to-br from-[#0F7A60] to-[#094A3A] text-white rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 group ring-4 ring-[#0F7A60]/20 hover:ring-[#0F7A60]/40 shadow-[0_8px_30px_rgba(15,122,96,0.3)]"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
            
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all shadow-inner backdrop-blur-md relative z-10">
              <span className="text-base">⚡</span>
            </div>
            
            <div className="flex flex-col items-start text-left relative z-10">
              <span className="text-sm font-black leading-none mb-1">Recharger le solde</span>
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.65 2 6.32 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% Sécurisé
              </span>
            </div>
          </button>

          {/* WITHDRAW BUTTON REPLACEMENT */}
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="relative overflow-hidden w-full sm:w-auto px-6 py-3.5 bg-gradient-to-br from-[#0F7A60] to-teal-800 text-white rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 group ring-4 ring-[#0F7A60]/10 hover:ring-[#0F7A60]/30 shadow-md"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
            
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all shadow-inner backdrop-blur-md relative z-10">
              <span className="text-base">💸</span>
            </div>
            
            <div className="flex flex-col items-start text-left relative z-10">
              <span className="text-sm font-black leading-none mb-1">Demander un retrait</span>
              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                Reçu instantanément
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm overflow-x-auto max-w-full hide-scrollbar mx-auto sm:mx-0">
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
          <span className="text-lg">🧾</span> Historique
        </button>
        {(ownerType === 'vendor' || ownerType === 'affiliate') && (
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-white/40'}`}
          >
            <span className="text-lg">⚙️</span> Paramètres
          </button>
        )}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 relative">
            <div className="absolute inset-0 bg-[#0F7A60]/5 rounded-[32px] blur-3xl -z-10 pointer-events-none"></div>

            {/* Solde Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0F7A60] to-[#0A5240] rounded-[32px] p-6 lg:p-8 text-white shadow-2xl shadow-[#0F7A60]/20 group transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-700 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-white/90 uppercase tracking-wider">{vocab.balance}</p>
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <span className="text-lg">🏧</span>
                  </div>
                </div>
                <div>
                  <p className="text-4xl lg:text-5xl font-black leading-none tracking-tight drop-shadow-sm">{formatAmount(balance)}</p>
                  <p className="text-sm text-white/80 mt-2 font-black uppercase tracking-wider">FCFA</p>
                </div>
              </div>
            </div>

            {/* En attente / Total Withdrawn Card */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{vocab.pending}</p>
              </div>
              <p className="text-4xl lg:text-5xl font-black text-[#C9A84C] xl:text-[#0F7A60] leading-none tracking-tight relative z-10">
                {formatAmount(ownerType === 'affiliate' ? totalWithdrawn : pending)}
              </p>
              <div className="flex items-center gap-2 mt-3 relative z-10">
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">FCFA</p>
              </div>
            </div>

            {/* Gamification Goal Card */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 lg:p-8 shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{vocab.earned}</p>
                  <div className="w-10 h-10 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-center text-lg">📈</div>
                </div>
                <p className="text-4xl lg:text-5xl font-black text-[#1A1A1A] leading-none tracking-tight">
                  {formatAmount(totalEarned)}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 relative z-10 w-full animate-in fade-in">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Objectif 🎯</span>
                    {!isEditingGoal && (
                      <button onClick={() => { setIsEditingGoal(true); setEditGoalValue(activeGoal.toString()) }} className="text-[9px] text-gray-400 border px-2 border-gray-100 rounded hover:bg-gray-50">Modifier</button>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-[#0F7A60]">
                    {Math.min(100, (totalEarned / Math.max(1, activeGoal)) * 100).toFixed(0)}%
                  </span>
                </div>
                {isEditingGoal ? (
                  <div className="flex gap-1 mt-1">
                    <input title="Montant de l'objectif" type="number" value={editGoalValue} onChange={e => setEditGoalValue(e.target.value)} className="w-full text-xs font-bold border rounded px-2" />
                    <button title="Enregistrer l'objectif" onClick={handleSaveGoal} className="px-2 bg-green-600 text-white rounded text-xs">V</button>
                  </div>
                ) : (
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 mb-1">
                    <style>{`.progress-fill { width: ${Math.min(100, (totalEarned / Math.max(1, activeGoal)) * 100)}% }`}</style>
                    <div className="h-full bg-[#0F7A60] rounded-full progress-fill" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 lg:p-8 shadow-xl relative overflow-hidden">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] flex items-center gap-3">
                  <span className="text-2xl">📊</span> {vocab.chartTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{vocab.chartSubtitle}</p>
              </div>
              <div className="bg-gray-50 p-1.5 rounded-2xl hidden sm:flex border border-gray-200">
                 {['all', '30d', '7d', 'today'].map(f => (
                   <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 text-xs font-black rounded-xl ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
                     {f === 'all' ? 'Tout' : f === '30d' ? '30 Jours' : f === '7d' ? '7 Jours' : "Auj"}
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
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                     <YAxis hide={true} domain={['auto', 'auto']} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${new Intl.NumberFormat('fr-FR').format(Number(value))} FCFA`, 'Gains']}
                        labelStyle={{ fontWeight: 'bold', color: '#1A1A1A' }}
                     />
                     <Area type="monotone" dataKey="total" stroke="#0F7A60" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            ) : (
               <div className="h-[250px] flex items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed">
                 <p className="text-sm font-bold text-gray-400">Aucune donnée disponible</p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
           <div className="px-6 py-5 border-b border-gray-50 flex justify-between bg-[#FAFAF7]/50">
             <h2 className="text-base font-black text-[#1A1A1A] flex items-center gap-2 text-xl">💳 Historique</h2>
           </div>
           {filteredTransactions.length === 0 ? (
             <div className="px-6 py-16 text-center text-gray-400 font-bold">Aucune transaction trouvée</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left whitespace-nowrap">
                 <thead>
                   <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                     <th className="px-6 py-4 border-b border-gray-100">Libellé</th>
                     <th className="px-6 py-4 border-b border-gray-100">Date</th>
                     <th className="px-6 py-4 border-b border-gray-100">Statut</th>
                     <th className="px-6 py-4 text-right border-b border-gray-100">Montant</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-sm">
                   {filteredTransactions.map(tx => (
                     <tr key={tx.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${tx.type === 'withdrawal' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {tx.type === 'withdrawal' ? '📤' : '📥'}
                         </div>
                         <span className="font-bold text-[#1A1A1A]">{tx.label}</span>
                       </td>
                       <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDateLabel(tx.created_at)}</td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex px-2 py-1 rounded-lg text-[11px] font-bold ${tx.status === 'paid' || tx.status === 'completed' || tx.status === 'approved' ? 'bg-green-100 text-green-700' : tx.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                           {tx.status}
                         </span>
                       </td>
                       <td className={`px-6 py-4 text-right font-black ${tx.type === 'withdrawal' ? 'text-black' : 'text-[#0F7A60]'}`}>
                         {tx.type === 'withdrawal' ? '-' : '+'}{formatAmount(tx.amount)} FCFA
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      )}

      {/* ── TAB 3: SETTINGS ── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          <AutoWithdrawSettings 
            walletId={ownerId}
            initialEnabled={autoWithdrawEnabled ?? false}
            initialThreshold={autoWithdrawThreshold ?? 100000}
            targetContext={ownerType === 'affiliate' ? 'affiliate' : ownerType === 'vendor' ? 'vendor' : 'closer'}
          />
        </div>
      )}

      {/* ── MODALS ── */}
      
      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-8 space-y-6 flex flex-col max-h-[90vh]">
               <div className="flex items-center justify-between shrink-0">
                 <h3 className="text-xl font-display font-black text-[#1A1A1A]">Retirer mes fonds</h3>
                 <button title="Fermer" onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-[#1A1A1A] transition text-2xl">×</button>
               </div>
               
               <div className="overflow-y-auto flex-1 pr-2 pb-2">
                 {kycStatus !== 'verified' ? (
                   <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                     <p className="text-sm font-bold text-red-700">Identité non vérifiée (KYC).</p>
                     <p className="text-xs text-red-600 mt-1">Vous devez valider votre KYC dans les paramètres avant de retirer.</p>
                   </div>
                 ) : balance < 5000 ? (
                   <div className="bg-[#FAFAF7] rounded-2xl p-5 text-center border border-gray-50 mt-4">
                     <div className="space-y-2 py-3">
                       <span className="text-3xl">🔒</span>
                       <p className="text-sm font-bold text-gray-600">Solde insuffisant</p>
                       <p className="text-[11px] text-gray-400 leading-relaxed">
                         Il vous manque <strong className="text-gray-600 font-bold">{formatAmount(5000 - balance)} FCFA</strong> pour atteindre le seuil de retrait minimum.
                       </p>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-5">
                     {/* ── Saisie du montant ── */}
                     <div>
                       <label htmlFor="withdraw-amount" className="block text-xs font-bold text-gray-600 mb-1.5">
                         Montant du retrait (FCFA)
                       </label>
                       <div className="relative">
                         <input
                           title="Montant du retrait"
                           id="withdraw-amount"
                           type="text"
                           inputMode="numeric"
                           value={withdrawInputValue}
                           onChange={handleWithdrawInputChange}
                           placeholder="5000"
                           className={`w-full px-4 py-3.5 text-lg font-black text-[#1A1A1A] bg-[#FAFAF7] border rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all pr-16 ${!isWithdrawAmountValid && withdrawAmount > 0 ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-[#0F7A60]/30 focus:border-[#0F7A60]'}`}
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">FCFA</span>
                       </div>
                       <div className="flex items-center justify-between mt-1.5 px-0.5">
                         <p className={`text-[11px] font-medium ${withdrawAmount < 5000 && withdrawAmount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                           Min : 5 000 FCFA
                         </p>
                         <p className={`text-[11px] font-medium ${withdrawAmount > balance ? 'text-red-400' : 'text-gray-400'}`}>
                           Disponible : <strong>{formatAmount(balance)} FCFA</strong>
                         </p>
                       </div>
                     </div>

                     {/* ── Boutons rapides ── */}
                     <div>
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Montants rapides</p>
                       <div className="grid grid-cols-4 gap-2">
                         {QUICK_AMOUNTS.map((val, i) => {
                           const isDisabled = val > balance
                           const isActive = withdrawAmount === val && !isDisabled
                           return (
                             <button
                               key={QUICK_LABELS[i]}
                               type="button"
                               onClick={() => !isDisabled && selectQuickWithdraw(val)}
                               disabled={isDisabled}
                               className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${isActive ? 'border-[#0F7A60] bg-[#0F7A60] text-white' : isDisabled ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' : 'border-gray-200 bg-[#FAFAF7] text-[#1A1A1A] hover:border-[#0F7A60]/40'}`}
                             >
                               {QUICK_LABELS[i]}
                             </button>
                           )
                         })}
                       </div>
                     </div>

                     {/* ── Compte de destination (readonly) ── */}
                     <div className="bg-[#FAFAF7] rounded-xl p-4 border border-gray-100">
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Compte de destination</p>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-xl">💳</span>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-[#1A1A1A]">{withdrawMethod}</p>
                           <p className="text-xs text-gray-500 font-mono truncate">{withdrawPhone || 'Non spécifié'}</p>
                         </div>
                       </div>
                       <p className="text-[10px] text-gray-400 mt-2 italic">Non modifiable ici — modifier dans les Paramètres</p>
                     </div>

                     <button
                       onClick={confirmWithdraw}
                       disabled={!isWithdrawAmountValid || isPending}
                       className="w-full py-3.5 text-sm font-bold text-white bg-[#0F7A60] hover:bg-[#0D6B53] rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                     >
                       {isPending ? 'Traitement en cours...' : `💸 Confirmer le retrait de ${isWithdrawAmountValid ? formatAmount(withdrawAmount) : '—'} FCFA`}
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-8 space-y-6 flex flex-col max-h-[90vh]">
               <div className="flex items-center justify-between shrink-0">
                 <h3 className="text-xl font-display font-black text-[#1A1A1A]">Recharger mon solde</h3>
                 <button title="Fermer" onClick={() => setShowDepositModal(false)} className="text-gray-400 hover:text-[#1A1A1A] transition text-2xl">×</button>
               </div>

               <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                  <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
                   Portail de Paiement Sécurisé
                 </p>
                 
                 <div>
                   <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block mb-2">Montant à recharger (FCFA)</label>
                   <input
                     title="Montant à recharger"
                     type="number"
                     value={depositAmount || ''}
                     onChange={(e) => setDepositAmount(Number(e.target.value))}
                     className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-5 py-4 font-display font-bold text-2xl focus:border-[#0F7A60] outline-none transition"
                     placeholder="Ex: 5000"
                   />
                 </div>

                 <div>
                   <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block mb-2">Choisir une passerelle</label>
                   <div className="grid grid-cols-1 gap-2">
                     {DEPOSIT_GATEWAYS.map((g) => (
                       <button
                         key={g.id}
                         onClick={() => setDepositGateway(g)}
                         className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                           depositGateway.id === g.id 
                             ? 'border-[#0F7A60] bg-[#0F7A60]/5 shadow-sm' 
                             : 'border-gray-200 hover:border-[#0F7A60]/30'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           <span className="text-xl">{g.icon}</span>
                           <span className="text-sm font-bold text-[#1A1A1A]">{g.name}</span>
                         </div>
                         <span className="text-[10px] font-mono text-gray-500">+{g.fee * 100}%</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="bg-[#FAFAF7] rounded-2xl p-5 space-y-2 border border-gray-100">
                   <div className="flex justify-between text-xs text-gray-500">
                     <span>Montant recharge</span>
                     <span>{formatAmount(depositAmount)} F</span>
                   </div>
                   <div className="flex justify-between text-xs text-gray-500">
                     <span>Frais ({depositGateway.fee * 100}%)</span>
                     <span>+{formatAmount(feeAmount)} F</span>
                   </div>
                   <div className="flex justify-between pt-2 border-t border-gray-200">
                     <span className="font-bold text-[#1A1A1A]">Total à payer</span>
                     <span className="font-black text-[#0F7A60] text-lg">{formatAmount(totalDepositAmount)} F</span>
                   </div>
                 </div>
               </div>

               <div className="shrink-0 pt-2">
                 <button
                   disabled={depositAmount <= 0 || isPending}
                   onClick={confirmDeposit}
                   className="w-full py-5 bg-[#0F7A60] hover:bg-[#0A5240] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-[#0F7A60]/20 flex items-center justify-center gap-3"
                 >
                   {isPending ? 'Validation...' : '🚀 Recharger maintenant'}
                 </button>
                 
                 <p className="text-[10px] text-center text-gray-400 font-light leading-relaxed mt-4">
                   Les frais de transaction sont à votre charge. Traitement instantané.
                 </p>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  )
}
