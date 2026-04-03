'use client'

import { useState } from 'react'
import Image from 'next/image'

export function ClientWalletContent({
  userId,
  clientBalance,
  initialMethod,
  initialNumber
}: {
  userId: string
  clientBalance: number
  initialMethod: string
  initialNumber: string
}) {
  const [method, setMethod] = useState(initialMethod)
  const [number, setNumber] = useState(initialNumber)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg('')
    try {
      const res = await fetch('/api/user/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, number })
      })
      if (res.ok) {
        setSuccessMsg('Moyen de paiement enregistré avec succès !')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Balance Card (Optional gamification) */}
      <div className="bg-gradient-to-br from-[#052e22] to-[#0a4a38] rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-[#23D99A]/20">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#23D99A]/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 flex-1 w-full text-center md:text-left">
          <p className="text-[#23D99A] text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Solde Cashback</p>
          <div className="flex flex-col md:flex-row md:items-baseline gap-3 justify-center md:justify-start">
            <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight drop-shadow-lg">
              {new Intl.NumberFormat('fr-FR').format(clientBalance)} <span className="text-2xl md:text-3xl text-emerald-100/70 font-bold ml-1">FCFA</span>
            </h2>
          </div>
          <p className="text-emerald-100/60 text-[13px] mt-3 font-medium max-w-sm mx-auto md:mx-0">
            Utilisez ce solde pour vos prochains achats ou vos remboursements.
          </p>
        </div>
      </div>

      {/* Payment Method Settings */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-[#E5E7EB]">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
          💳 Mon mode de paiement préféré
        </h3>
        
        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMethod('wave')}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${method === 'wave' ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-white hover:border-gray-200'} shadow-sm relative`}
            >
              <Image src="/wave.png" alt="Wave" width={40} height={40} className="mb-2" />
              <span className={`text-sm font-bold ${method === 'wave' ? 'text-[#0F7A60]' : 'text-gray-500'}`}>Wave</span>
              {method === 'wave' && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[#0F7A60] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setMethod('orange_money')}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${method === 'orange_money' ? 'border-[#0F7A60] bg-[#0F7A60]/5' : 'border-gray-100 bg-white hover:border-gray-200'} shadow-sm relative`}
            >
              {/* Fallback image style as generic circle if orange money icon missing */}
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black mb-2">OM</div>
              <span className={`text-sm font-bold ${method === 'orange_money' ? 'text-[#0F7A60]' : 'text-gray-500'}`}>Orange Money</span>
              {method === 'orange_money' && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[#0F7A60] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Numéro de téléphone
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ex: 77 123 45 67"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-center py-3.5 bg-gradient-to-r from-[#0F7A60] to-[#0A5240] text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(15,122,96,0.2)] hover:shadow-[0_8px_25px_rgba(15,122,96,0.4)] hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer mon portefeuille'}
          </button>
          
          {successMsg && (
            <p className="text-center text-sm font-medium text-emerald-600 bg-emerald-50 py-2 rounded-lg">{successMsg}</p>
          )}
        </form>
      </div>
    </div>
  )
}
