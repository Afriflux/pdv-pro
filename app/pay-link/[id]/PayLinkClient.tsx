'use client'

import { useState } from 'react'
import { Activity, ExternalLink } from 'lucide-react'

export default function PayLinkClient({ link, storeColor }: { link: any, storeColor: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'paytech' | 'cinetpay'>('wave')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/pay-link/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pay_link_id: link.id,
          buyer_name: name,
          buyer_phone: phone,
          payment_method: paymentMethod
        })
      })
      
      const data = await res.json()
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Une erreur est survenue lors de l'initialisation du paiement.")
      }
      
      if (data.success && data.redirectUrl) {
         window.location.href = data.redirectUrl
      }
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Champs d'infos */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate block focus-within:text-ink transition-colors">Votre nom complet</label>
          <input 
             type="text" 
             required 
             value={name}
             onChange={e => setName(e.target.value)}
             placeholder="Ex: Cheikh Diop" 
             className="w-full bg-[#FAFAF7] border-2 border-line rounded-xl px-4 py-3 text-ink font-medium focus:border-ink outline-none transition-all"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate block focus-within:text-ink transition-colors">Numéro de téléphone</label>
          <input 
             type="tel" 
             required 
             value={phone}
             onChange={e => setPhone(e.target.value)}
             placeholder="Ex: 77 123 45 67" 
             className="w-full bg-[#FAFAF7] border-2 border-line rounded-xl px-4 py-3 text-ink font-medium focus:border-ink outline-none transition-all"
          />
        </div>
      </div>

      {/* Choix du moyen de paiement */}
      <div className="space-y-2 pt-2">
        <label className="text-sm font-bold text-slate block">Moyen de paiement</label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'wave' ? 'border-[#1ebbf0] bg-[#1ebbf0]/5 shadow-sm' : 'border-line hover:border-gray-300 bg-[#FAFAF7]'}`}>
            <input type="radio" name="payment_method" value="wave" className="hidden" onChange={() => setPaymentMethod('wave')} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/wave-logo.png" alt="Wave" className="h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-xs font-bold whitespace-nowrap">Wave</span>
          </label>
          
          <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'paytech' ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-line hover:border-gray-300 bg-[#FAFAF7]'}`}>
            <input type="radio" name="payment_method" value="paytech" className="hidden" onChange={() => setPaymentMethod('paytech')} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/orange-money-logo.png" alt="Orange Money" className="h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-xs font-bold whitespace-nowrap">Mobile Money</span>
          </label>
        </div>
      </div>

      <button
        disabled={isLoading}
        type="submit"
        className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 mt-6"
        style={{ backgroundColor: storeColor }}
      >
        {isLoading ? (
           <Activity className="animate-spin" size={20} />
        ) : (
           <>
             Payer {link.amount.toLocaleString('fr-FR')} FCFA
             <ExternalLink size={18} />
           </>
        )}
      </button>
    </form>
  )
}
