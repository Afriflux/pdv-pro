'use client'

import { useState } from 'react'
import { Activity, ExternalLink, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

interface QuoteData {
  id: string
  status: string
  client_phone?: string | null
  total_amount: number
}

export default function QuoteClient({ quote, storeColor }: { quote: QuoteData, storeColor: string }) {
  const [phone, setPhone] = useState(quote.client_phone || '')
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [methods, setMethods] = useState<any[]>([])
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/payments/available')
        const data = await res.json()
        if (data.methods && data.methods.length > 0) {
          setMethods(data.methods)
          setPaymentMethod(data.methods[0].id)
        }
      } catch (err) {
        console.error('Erreur chargement paiements:', err)
      } finally {
        setLoadingMethods(false)
      }
    }
    fetchMethods()
  }, [])

  if (quote.status === 'ACCEPTED') {
    return (
       <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-4">
             <CheckCircle2 size={32} />
          </div>
          <h3 className="text-2xl font-black text-emerald-800 mb-2">Facture Réglée</h3>
          <p className="text-emerald-600 font-medium max-w-md mx-auto">
             Cette facture a déjà été honorée par le client. Aucun paiement supplémentaire n'est requis.
          </p>
       </div>
    )
  }

  if (quote.status === 'REJECTED') {
    return (
       <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold text-red-800 mb-2">Devis Annulé</h3>
          <p className="text-red-600 font-medium">Ce devis a été annulé ou refusé par le vendeur.</p>
       </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/quote/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.id,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-line p-8 lg:p-14">
        <div className="text-center mb-8">
           <h3 className="text-2xl font-black text-ink mb-2">Accepter et Payer</h3>
           <p className="text-gray-500 font-medium">Validation avec paiement électronique sécurisé.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate block">Numéro de Mobile Money</label>
            <input 
               type="tel" 
               required 
               value={phone}
               onChange={e => setPhone(e.target.value)}
               placeholder="Ex: 77 123 45 67" 
               className="w-full bg-[#FAFAF7] border-2 border-line rounded-xl px-5 py-4 text-ink font-medium focus:border-ink outline-none transition-all text-lg"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate block">Mode de règlement</label>
            
            {loadingMethods ? (
               <div className="grid grid-cols-2 gap-3 animate-pulse">
                 <div className="h-20 bg-gray-100 rounded-xl"></div>
                 <div className="h-20 bg-gray-100 rounded-xl"></div>
               </div>
            ) : methods.length === 0 ? (
               <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-xs text-center font-medium">
                 Aucun moyen de paiement configuré.
               </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              {methods.map((method) => {
                const isSelected = paymentMethod === method.id
                return (
                  <label 
                    key={method.id} 
                    className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${isSelected ? 'shadow-sm' : 'border-line hover:border-gray-300 bg-[#FAFAF7]'}`}
                    {...{ style: isSelected ? { borderColor: storeColor, backgroundColor: `${storeColor}08` } : {} }}
                  >
                    <input type="radio" name="payment_method" value={method.id} className="hidden" onChange={() => setPaymentMethod(method.id)} />
                    {method.icon.startsWith('/') ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={method.icon} alt={method.label} className="h-8 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <span className="text-2xl">{method.icon}</span>
                    )}
                    <span className="text-sm font-bold whitespace-nowrap">{method.label}</span>
                  </label>
                )
              })}
            </div>
            )}
          </div>

          <button
            disabled={isLoading || !paymentMethod}
            type="submit"
            className="w-full flex items-center justify-center gap-2 text-white px-6 py-5 rounded-xl font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 mt-8 text-lg"
            {...{ style: { backgroundColor: storeColor } }}
          >
            {isLoading ? (
               <Activity className="animate-spin" size={24} />
            ) : (
               <>
                 Régler {quote.total_amount.toLocaleString('fr-FR')} FCFA
                 <ExternalLink size={20} />
               </>
            )}
          </button>
        </form>
    </div>
  )
}
