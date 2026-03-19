'use client'

import { useState } from 'react'
import { Copy, Check, Users, Trophy, Wallet, TrendingUp, ChevronRight, Info, PlusCircle, ArrowUpRight, ArrowDownLeft, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { AffiliateStats, AffiliateTransaction, AffiliateReferral, Affiliate } from '@/lib/affiliation/affiliate-service'

// ----------------------------------------------------------------
// COMPOSANT PRINCIPAL CLIENT
// ----------------------------------------------------------------
export default function AffiliateClient({ initialStats }: { initialStats: AffiliateStats }) {
  const [stats, setStats] = useState(initialStats)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  
  const affiliate = stats.affiliate
  const referralLink = `https://pdvpro.com/register?ref=${affiliate.code}`

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header & Referral Link */}
      <HeaderSection affiliate={affiliate} referralLink={referralLink} />

      {/* 2. Stats Cards */}
      <StatsGrid stats={stats} onWithdrawClick={() => setIsWithdrawModalOpen(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 3. Tiers Progression */}
          <CommissionTiers activeReferrals={affiliate.active_referred} currentRate={affiliate.commission_rate} />
          
          {/* 4. Referrals Table */}
          <ReferralsTable referrals={stats.referrals} />
        </div>

        <div className="space-y-8">
          {/* 5. Recent Transactions */}
          <TransactionsList transactions={stats.recentTransactions} />
          
          {/* 6. Info Card */}
          <HowItWorksCard />
        </div>
      </div>

      {/* 7. Modal Retrait */}
      {isWithdrawModalOpen && (
        <WithdrawalModal 
          balance={affiliate.balance} 
          onClose={() => setIsWithdrawModalOpen(false)} 
          onSuccess={(newBalance) => {
            setStats(prev => ({
              ...prev,
              affiliate: { ...prev.affiliate, balance: newBalance }
            }))
            setIsWithdrawModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// SOUS-COMPOSANTS CLIENT
// ----------------------------------------------------------------

function HeaderSection({ affiliate, referralLink }: { affiliate: Affiliate, referralLink: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Lien copié dans le presse-papier !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Programme d'Affiliation</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${affiliate.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            {affiliate.is_active ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <p className="text-gray-500">Parrainez de nouveaux vendeurs et gagnez des commissions à vie.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="bg-[#FAFAF7] border border-gray-200 px-4 py-2.5 rounded-xl flex items-center justify-between sm:justify-start gap-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Votre Code</span>
          <span className="font-mono font-bold text-gray-900">{affiliate.code}</span>
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-[#0F7A60] hover:bg-[#0D5C4A] text-white px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-200"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>Copier mon lien</span>
        </button>
      </div>
    </div>
  )
}

function StatsGrid({ stats, onWithdrawClick }: { stats: AffiliateStats, onWithdrawClick: () => void }) {
  const affiliate = stats.affiliate

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-emerald-50 text-[#0F7A60] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Wallet className="w-5 h-5" />
          </div>
          <button 
            onClick={onWithdrawClick}
            disabled={affiliate.balance < 5000}
            className="text-xs font-bold text-[#0F7A60] hover:underline disabled:opacity-30 disabled:no-underline"
          >
            Retirer
          </button>
        </div>
        <p className="text-gray-500 text-sm font-medium">Solde disponible</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{affiliate.balance.toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group">
        <div className="w-10 h-10 bg-amber-50 text-[#C9A84C] rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <Trophy className="w-5 h-5" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Total gagné</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{affiliate.total_earned.toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group">
        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <Users className="w-5 h-5" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Filleuls actifs / total</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{affiliate.active_referred} <span className="text-gray-300 mx-1">/</span> {affiliate.total_referred}</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group">
        <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Gains ce mois</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{stats.thisMonthEarnings.toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
      </div>
    </div>
  )
}

function CommissionTiers({ activeReferrals, currentRate }: { activeReferrals: number, currentRate: number }) {
  const tiers = [
    { label: 'Palier 1', min: 0, max: 5, rate: 5 },
    { label: 'Palier 2', min: 6, max: 20, rate: 8 },
    { label: 'Palier 3', min: 21, max: Infinity, rate: 12 },
  ]

  let nextTier = null
  if (activeReferrals <= 5) nextTier = { ...tiers[1], needed: 6 - activeReferrals }
  else if (activeReferrals <= 20) nextTier = { ...tiers[2], needed: 21 - activeReferrals }

  const progress = Math.min((activeReferrals / 21) * 100, 100)

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Progression des commissions</h3>
        <span className="bg-amber-50 text-[#C9A84C] px-3 py-1 rounded-full text-sm font-bold">
          Taux actuel : {currentRate}%
        </span>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="relative h-4 bg-[#FAFAF7] rounded-full overflow-hidden border border-gray-100">
          <div 
            className="absolute top-0 left-0 h-full bg-[#0F7A60] transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Tiers Legend */}
        <div className="grid grid-cols-3 text-center">
          {tiers.map((tier, idx) => (
            <div key={idx} className="space-y-1">
              <p className={`text-xs font-bold ${currentRate === tier.rate ? 'text-[#0F7A60]' : 'text-gray-400'}`}>
                {tier.label}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                {tier.max === Infinity ? '21+' : `${tier.min}-${tier.max}`} filleuls
              </p>
              <p className={`text-sm font-black ${currentRate === tier.rate ? 'text-[#0F7A60]' : 'text-gray-300'}`}>
                {tier.rate}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {nextTier && (
        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
          <Info className="w-5 h-5 text-[#0F7A60] shrink-0" />
          <p className="text-sm text-gray-600">
            Encore <span className="font-bold text-gray-900">{nextTier.needed} filleuls actifs</span> pour passer au palier de <span className="font-bold text-[#0F7A60]">{nextTier.rate}%</span> de commission.
          </p>
        </div>
      )}
    </div>
  )
}

function ReferralsTable({ referrals }: { referrals: AffiliateReferral[] }) {
  const [showAll, setShowAll] = useState(false)
  const displayedReferrals = showAll ? referrals : referrals.slice(0, 5)

  if (referrals.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-[#FAFAF7] text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusCircle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Aucun filleul pour le moment</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">Commencez par partager votre lien pour construire votre réseau et gagner des commissions.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Vos Filleuls</h3>
        <span className="text-xs font-bold text-gray-400">{referrals.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#FAFAF7] text-gray-400 text-[10px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Boutique</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Commandes</th>
              <th className="px-6 py-4 text-right">CA Généré</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayedReferrals.map((ref) => (
              <tr key={ref.id} className="hover:bg-[#FAFAF7]/50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#0F7A60] transition-colors">{ref.Store?.name}</p>
                  <p className="text-[10px] text-gray-400">{new Date(ref.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    ref.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    ref.status === 'pending' ? 'bg-gray-100 text-gray-500' :
                    'bg-red-50 text-red-500'
                  }`}>
                    {ref.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                  {ref.total_orders}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-gray-900">{Math.round(ref.total_revenue).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 ml-1">F</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {referrals.length > 5 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="w-full py-4 text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-[#FAFAF7] transition-all flex items-center justify-center gap-2 group"
        >
          {showAll ? 'Réduire la liste' : 'Voir tous les filleuls'}
          <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      )}
    </div>
  )
}

function TransactionsList({ transactions }: { transactions: AffiliateTransaction[] }) {
  if (transactions.length === 0) return null

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50">
        <h3 className="font-bold text-gray-900">Activité Récente</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 flex items-start justify-between hover:bg-[#FAFAF7]/50 transition-colors">
            <div className="flex gap-3">
              <div className={`mt-1 p-2 rounded-xl border ${
                tx.type === 'commission' ? 'bg-emerald-50 border-emerald-100 text-[#0F7A60]' : 
                tx.type === 'withdrawal' ? 'bg-amber-50 border-amber-100 text-[#C9A84C]' : 
                'bg-gray-50 border-gray-100 text-gray-400'
              }`}>
                {tx.type === 'commission' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{tx.description}</p>
                <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${tx.type === 'commission' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {tx.type === 'commission' ? '+' : '-'}{tx.amount.toLocaleString()}F
              </p>
              <p className="text-[9px] font-black uppercase text-gray-300">{tx.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HowItWorksCard() {
  return (
    <div className="bg-emerald-900 p-6 rounded-3xl text-white space-y-4 shadow-xl shadow-emerald-900/10">
      <h3 className="font-bold text-lg">Comment ça marche ?</h3>
      <ul className="space-y-4 text-emerald-100/80 text-sm">
        <li className="flex gap-3">
          <span className="w-5 h-5 bg-emerald-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
          Partagez votre lien d'affiliation unique à votre réseau.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 bg-emerald-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
          Lorsqu'un vendeur s'inscrit, il devient votre filleul à vie.
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 bg-emerald-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
          Gagnez jusqu'à 12% des commissions perçues par PDV Pro sur ses ventes.
        </li>
      </ul>
      <div className="pt-2 border-t border-emerald-800">
        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Paiement garanti</p>
        <p className="text-xs mt-1 text-emerald-100/60">Retrait dès 5 000 FCFA sur Wave, Orange Money ou Virement.</p>
      </div>
    </div>
  )
}

type WithdrawMethod = 'wave' | 'orange_money' | 'bank'

function WithdrawalModal({ balance, onClose, onSuccess }: { balance: number, onClose: () => void, onSuccess: (newBal: number) => void }) {
  const [formData, setFormData] = useState({ amount: balance, method: 'wave' as WithdrawMethod, phone: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.amount < 5000) { toast.error('Minimum 5 000 FCFA'); return }
    if (formData.phone.length < 5) { toast.error('Coordonnées invalides'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/affiliation/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount,
          method: formData.method,
          phoneOrIban: formData.phone
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Demande de retrait envoyée !')
      onSuccess(data.newBalance)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-900">Demander un retrait</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Montant (Min 5 000F)</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                max={balance}
                min={5000}
                className="w-full bg-[#FAFAF7] border-0 px-4 py-3 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#0F7A60] transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">FCFA</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 px-1">Solde actuel : <span className="font-bold text-gray-600">{balance.toLocaleString()} F</span></p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Méthode de retrait</label>
            <div className="grid grid-cols-3 gap-2">
              {['wave', 'orange_money', 'bank'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, method: m as WithdrawMethod }))}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                    formData.method === m ? 'border-[#0F7A60] bg-emerald-50 text-[#0F7A60]' : 'border-gray-50 bg-[#FAFAF7] text-gray-400 hover:border-gray-100'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              {formData.method === 'bank' ? 'IBAN / Coordonnées bancaires' : 'Numéro de téléphone'}
            </label>
            <input 
              type="text" 
              placeholder={formData.method === 'bank' ? 'SN00 1234...' : '77 123 45 67'}
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-[#FAFAF7] border-0 px-4 py-3 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#0F7A60] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || formData.amount < 5000 || formData.amount > balance}
            className="w-full bg-[#0F7A60] hover:bg-[#0D5C4A] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer le retrait'}
          </button>
        </form>
      </div>
    </div>
  )
}
