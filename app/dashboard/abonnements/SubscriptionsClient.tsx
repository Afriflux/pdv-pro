'use client'

import { useState } from 'react'
import { Check, Download, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface SubscriptionsClientProps {
  storeId: string
  isPro: boolean
  subscriptions: any[]
}

export default function SubscriptionsClient({ storeId, subscriptions }: SubscriptionsClientProps) {
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [monthlyRevenue, setMonthlyRevenue] = useState(250000)

  const handleSubscribeCOD = async (paymentMethod: 'cinetpay' | 'wave' | 'card') => {
    setLoading(true)
    try {
      // Simulation API Call
      await new Promise(r => setTimeout(r, 1500))
      
      toast.success('Redirection vers la passerelle de paiement...')
      console.log('Initiating COD subscription via', paymentMethod, 'for store', storeId)
      setShowPaymentModal(false)
    } catch (err) {
      toast.error('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  // Calculateur de commission dégressive
  const getCommissionRate = (revenue: number) => {
    if (revenue <= 100000) return 0.07
    if (revenue <= 500000) return 0.06
    if (revenue <= 1000000) return 0.05
    return 0.04
  }

  const currentRate = getCommissionRate(monthlyRevenue)
  const estimatedCommission = monthlyRevenue * currentRate

  return (
    <div className="space-y-8 pb-12">
      {/* Modal de Sélection de Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-ink">Activer l'option COD</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-dust hover:text-ink transition-colors">✕</button>
              </div>
              
              <p className="text-sm text-dust mb-8 font-medium">Choisissez votre moyen de paiement pour activer les ventes à la livraison (9 900 FCFA/mois).</p>
              
              <div className="space-y-3">
                <PaymentOption 
                  label="Wave Mobile Money" 
                  icon="🌊" 
                  onClick={() => handleSubscribeCOD('wave')}
                  disabled={loading}
                />
                <PaymentOption 
                  label="Orange Money / CinetPay" 
                  icon="🍊" 
                  onClick={() => handleSubscribeCOD('cinetpay')}
                  disabled={loading}
                />
                <PaymentOption 
                  label="Carte bancaire" 
                  icon="💳" 
                  onClick={() => handleSubscribeCOD('card')}
                  disabled={loading}
                />
              </div>

              <div className="mt-8 flex items-center gap-2 justify-center text-[10px] font-black text-dust uppercase tracking-widest">
                <Check size={12} className="text-emerald" /> Paiement 100% sécurisé
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BARÈME DES COMMISSIONS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { range: '0 - 100K', rate: '7%', color: 'bg-gray-100 text-gray-500' },
          { range: '100K - 500K', rate: '6%', color: 'bg-emerald/10 text-emerald' },
          { range: '500K - 1M', rate: '5%', color: 'bg-emerald/20 text-emerald-rich' },
          { range: '+1M', rate: '4%', color: 'bg-emerald-rich text-white' },
        ].map((tier, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-transparent text-center space-y-1 ${tier.color}`}>
            <p className="text-xs font-black uppercase tracking-wider opacity-80">{tier.range} F</p>
            <p className="text-3xl font-black">{tier.rate}</p>
          </div>
        ))}
      </div>

      {/* ── PLAN GRATUIT & OPTION COD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Plan Gratuit */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Plan Actuel</span>
            </div>
            <h2 className="text-3xl font-black text-ink">Plan Gratuit</h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">Vendez sans abonnement. Nous ne gagnons que si vous gagnez.</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 text-sm font-medium text-gray-700 items-center">
              <div className="w-5 h-5 bg-emerald/10 rounded-full flex items-center justify-center text-emerald">
                <Check size={12} strokeWidth={3} />
              </div>
              Commission dégressive (7% à 4%)
            </li>
            <li className="flex gap-3 text-sm font-medium text-gray-700 items-center">
              <div className="w-5 h-5 bg-emerald/10 rounded-full flex items-center justify-center text-emerald">
                <Check size={12} strokeWidth={3} />
              </div>
              PDV Pro absorbe tous les frais (passerelles + retrait)
            </li>
            <li className="flex gap-3 text-sm font-medium text-gray-700 items-center">
              <div className="w-5 h-5 bg-emerald/10 rounded-full flex items-center justify-center text-emerald">
                <Check size={12} strokeWidth={3} />
              </div>
              Fonds disponibles immédiatement
            </li>
            <li className="flex gap-3 text-sm font-medium text-gray-700 items-center opacity-50">
              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <Check size={12} strokeWidth={3} />
              </div>
              Paiement à la livraison (En option)
            </li>
          </ul>
        </div>

        {/* Option COD */}
        <div className="bg-emerald-deep border-4 border-emerald-rich shadow-2xl shadow-emerald/20 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-rich opacity-20 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-rich text-turquoise px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Option Supplémentaire</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">0 F</span>
              <span className="text-emerald-light/60 font-medium tracking-tight">/mois</span>
            </div>
            <h2 className="text-2xl font-black text-turquoise mt-1">Ventes par COD</h2>
            <p className="text-sm text-emerald-light/80 mt-2 font-medium">Débloquez le paiement à la livraison et boostez vos ventes physiques.</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 text-sm font-medium text-emerald-light items-center">
              <div className="w-5 h-5 bg-turquoise/20 rounded-full flex items-center justify-center text-turquoise">
                <Check size={12} strokeWidth={3} />
              </div>
              Commission fixe de 5% au succès
            </li>
            <li className="flex gap-3 text-sm font-medium text-emerald-light items-center">
              <div className="w-5 h-5 bg-turquoise/20 rounded-full flex items-center justify-center text-turquoise">
                <Check size={12} strokeWidth={3} />
              </div>
              Aucun frais d'activation mensuel
            </li>
            <li className="flex gap-3 text-sm font-medium text-emerald-light items-center text-turquoise font-bold">
              <div className="w-5 h-5 bg-turquoise/20 rounded-full flex items-center justify-center text-turquoise">
                <TrendingUp size={12} strokeWidth={3} />
              </div>
              Déjà actif sur votre boutique
            </li>
          </ul>
        </div>
      </div>

      {/* ── CALCULATEUR DE COMMISSION ── */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={120} />
        </div>
        
        <h3 className="text-xl font-black text-ink mb-2">Simulez vos revenus.</h3>
        <p className="text-gray-500 mb-10 font-medium">Déplacez le curseur pour voir votre commission selon votre CA mensuel.</p>

        <div className="mb-10 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Chiffre d'Affaires Mensuel</p>
              <p className="text-3xl font-black text-emerald">{new Intl.NumberFormat('fr-FR').format(monthlyRevenue)} <span className="text-sm">FCFA</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Taux appliqué</p>
              <p className="text-3xl font-black text-ink">{(currentRate * 100).toFixed(0)}%</p>
            </div>
          </div>
          
          <input 
            title="Estimation du Chiffre d'Affaires Mensuel"
            type="range" 
            min="0" 
            max="2000000" 
            step="10000"
            value={monthlyRevenue} 
            onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
            className="w-full h-4 bg-gray-100 rounded-full appearance-none cursor-pointer accent-emerald"
          />
          <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-tighter">
            <span>0 F</span>
            <span>100K (7%)</span>
            <span>500K (6%)</span>
            <span>1M (5%)</span>
            <span>2M+ (4%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase">Commission estimée</p>
            <p className="text-2xl font-black text-red-500">{new Intl.NumberFormat('fr-FR').format(estimatedCommission)} F</p>
            <p className="text-[10px] text-gray-400">Frais de retrait et passerelle inclus (0 F en sus)</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase">Revenu Net Garanti (93% - 96%)</p>
            <p className="text-2xl font-black text-emerald-rich">{new Intl.NumberFormat('fr-FR').format(monthlyRevenue - estimatedCommission)} F</p>
            <p className="text-[10px] text-emerald font-medium">Reçu directement sur votre compte sans délai.</p>
          </div>
        </div>
      </div>

      {/* ── HISTORIQUE FACTURES (Simplement filtré pour ne pas casser si des Pro+ existent déjà) ── */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-sm font-black text-ink uppercase tracking-wider">Historique des Paiements</h3>
          <Download size={16} className="text-gray-300" />
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white">
            <p className="text-sm font-medium">Aucun paiement d'option pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 bg-white">
            {subscriptions.map((sub: any) => (
              <div key={sub.id} className="p-5 flex items-center justify-between hover:bg-cream/50 transition duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald/10 rounded-full flex items-center justify-center text-emerald">
                    <Check size={18} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-ink tracking-tight uppercase text-xs">Option {sub.plan?.toUpperCase() || 'COD'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(sub.created_at).toLocaleDateString('fr-FR')} • {sub.payment_ref || 'TRX-DEFAULT'}</p>
                  </div>
                </div>
                <button className="text-gray-300 hover:text-emerald transition p-2" title="Reçu PDF">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function PaymentOption({ label, icon, onClick, disabled }: { label: string; icon: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-4 bg-gray-50 hover:bg-emerald/5 border border-gray-100 hover:border-emerald/20 p-4 rounded-2xl transition-all group disabled:opacity-50"
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
        {icon}
      </div>
      <div className="text-left">
        <p className="font-bold text-ink text-sm">{label}</p>
        <p className="text-[10px] text-dust font-bold uppercase tracking-widest">Activer maintenant</p>
      </div>
      <div className="ml-auto text-gray-300 group-hover:text-emerald transition-colors">
        →
      </div>
    </button>
  )
}
