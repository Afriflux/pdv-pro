'use client'

import { useState } from 'react'
import { MessageSquare, Zap, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react'
// Suposons une intégration /api/checkout/initiate commune
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface SmsRechargePortalProps {
  currentCredits: number
  storeId: string
}

export function SmsRechargePortal({ currentCredits, storeId }: SmsRechargePortalProps) {
  const router = useRouter()
  const [loadingCode, setLoadingCode] = useState<string | null>(null)

  const packages = [
    { code: 'sms_50', count: 50, price: 2500, label: 'Débutant', color: 'from-blue-500 to-cyan-500', popular: false },
    { code: 'sms_200', count: 200, price: 9000, label: 'Essentiel', color: 'from-emerald-500 to-teal-500', popular: true },
    { code: 'sms_1000', count: 1000, price: 40000, label: 'Pro', color: 'from-indigo-500 to-purple-600', popular: false },
  ]

  const handlePurchase = async (pkg: typeof packages[0]) => {
    try {
      setLoadingCode(pkg.code)
      // Call to internal checkout API. Assuming we can pass a dummy product or generic billing.
      const res = await fetch('/api/billing/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms_recharge',
          packageCode: pkg.code,
          storeId: storeId,
          amount: pkg.price
        })
      })

      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error("Action réussie ou erreur, veuillez vérifier.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'initialisation du paiement.")
    } finally {
      setLoadingCode(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] p-6 lg:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <MessageSquare className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black mb-2 flex items-center gap-3">
               Achat de Crédits SMS <Zap className="w-6 h-6 text-yellow-400" />
            </h1>
            <p className="text-gray-300 font-medium max-w-md text-sm leading-relaxed">
              Vos SMS de sécurité (Cash On Delivery) restent 100% gratuits ! 
              Achetez des crédits ici pour propulser vos campagnes Marketing et relances paniers.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0 text-center min-w-[200px]">
            <p className="text-xs text-gray-300 uppercase tracking-widest font-bold mb-1">Solde Actuel</p>
            <div className="text-4xl font-black text-emerald-400">{currentCredits}</div>
            <p className="text-[10px] text-gray-400 mt-1">SMS Simples Restants</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div 
            key={pkg.code} 
            className={`relative bg-white rounded-3xl border ${pkg.popular ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-gray-100 shadow-sm'} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-sm">
                Plus Populaire
              </div>
            )}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white mb-4 shadow-inner`}>
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{pkg.label}</h3>
            <div className="my-4">
              <span className="text-3xl font-black text-gray-900">{pkg.price.toLocaleString('fr-FR')}</span>
              <span className="text-sm text-gray-500 font-bold ml-1">FCFA</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /> {pkg.count} SMS Inclus
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /> {(pkg.price / pkg.count).toFixed(0)}F / Unité
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" /> Sans expiration
              </li>
            </ul>
            <button 
              onClick={() => handlePurchase(pkg)}
              disabled={loadingCode === pkg.code}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                pkg.popular 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {loadingCode === pkg.code ? 'Redirection...' : (
                <>Acheter ce Pack <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 mx-auto">
        <CreditCard className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Paiement Sécurisé</h4>
          <p className="text-xs text-blue-700/80 leading-relaxed mt-1 font-medium">
            Les rechargements sont effectués via les portefeuilles locaux (Wave, Orange Money) de manière instantanée et chiffrée. Les crédits s'ajoutent à votre solde automatiquement.
          </p>
        </div>
      </div>
    </div>
  )
}
