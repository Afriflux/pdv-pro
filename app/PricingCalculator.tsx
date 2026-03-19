'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PricingCalculator() {
  const [monthlySales, setMonthlySales] = useState<number>(250000)

  // Commission dégressive
  const getCommissionRate = (revenue: number) => {
    if (revenue <= 100000) return 0.07
    if (revenue <= 500000) return 0.06
    if (revenue <= 1000000) return 0.05
    return 0.04
  }

  const currentRate = getCommissionRate(monthlySales)
  const estimatedCommission = monthlySales * currentRate
  const vendorNet = monthlySales - estimatedCommission
  const vendorPercent = 100 - (currentRate * 100)

  // Comparaison Concurrence
  const shopifyCost = (monthlySales * 0.029) + (monthlySales > 0 ? (300 + 20000) : 20000) // Formule approximative en FCFA (2.9% + fix + abo)
  const otherPlatformCost = monthlySales * 0.12 // ~12% moyenne sur d'autres plateformes

  return (
    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-ink/5 border border-line max-w-4xl mx-auto mt-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center mb-12 relative z-10">
        <h3 className="text-3xl md:text-5xl font-display font-black text-ink mb-3 tracking-tight">Simulez vos revenus</h3>
        <p className="text-slate font-light text-xl">Glissez le curseur pour voir combien vous gagnez réellement</p>
      </div>

      <div className="mb-14 relative z-10">
        <input 
          aria-label="Simulation de revenus"
          type="range" 
          min="0" 
          max="2000000" 
          step="10000"
          value={monthlySales} 
          onChange={(e) => setMonthlySales(Number(e.target.value))}
          className="w-full h-4 rounded-full appearance-none outline-none shadow-inner cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-emerald [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
          // eslint-disable-next-line
          style={{
            background: `linear-gradient(to right, #10B981 0%, #047857 ${(monthlySales / 2000000) * 100}%, #F1F5F9 ${(monthlySales / 2000000) * 100}%, #F1F5F9 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-dust mt-4 font-mono font-bold uppercase tracking-wider relative px-2">
          <span>0 F</span>
          <span className="absolute left-[5%] -translate-x-1/2 hidden md:inline">100K</span>
          <span className="absolute left-[25%] -translate-x-1/2 hidden md:inline">500K</span>
          <span className="absolute left-[50%] -translate-x-1/2">1M</span>
          <span>2M+ FCFA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 relative z-10">
        {/* Card Votre CA */}
        <div className="bg-pearl rounded-2xl p-6 border border-line flex flex-col justify-center items-center text-center shadow-sm">
          <p className="text-sm font-bold text-slate uppercase tracking-wider mb-2">Votre CA</p>
          <p className="text-3xl font-black text-ink">{monthlySales.toLocaleString('fr-FR')} FCFA</p>
        </div>

        {/* Card Commission */}
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-amber-400"></div>
          <p className="text-sm font-bold text-amber-600/70 uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
            Commission PDV Pro
            <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full text-xs">{(currentRate * 100).toFixed(0)}%</span>
          </p>
          <p className="text-3xl font-black text-amber-600">{estimatedCommission.toLocaleString('fr-FR')} F</p>
        </div>

        {/* Card Vous recevez */}
        <div className="bg-emerald/5 rounded-2xl p-6 border border-emerald/20 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
          <div className="absolute top-0 w-full h-1 bg-emerald"></div>
          <p className="text-sm font-bold text-emerald/70 uppercase tracking-wider mb-2">Vous recevez</p>
          <p className="text-4xl font-black text-emerald">{vendorNet.toLocaleString('fr-FR')} F</p>
          <p className="text-[10px] text-emerald mt-2 font-bold uppercase tracking-widest bg-emerald/10 px-3 py-1 rounded-full text-center">soit {vendorPercent}% de vos ventes</p>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-12 relative z-10 w-full">
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-pearl shadow-inner p-0.5 border border-line">
          <div 
            className="h-full bg-emerald rounded-full transition-all duration-500 ease-out shadow-sm"
            // eslint-disable-next-line
            style={{ width: `${monthlySales > 0 ? vendorPercent : 100}%` }}
          ></div>
          <div 
            className="h-full bg-amber-400 rounded-r-lg transition-all duration-500 ease-out"
            // eslint-disable-next-line
            style={{ width: `${monthlySales > 0 ? (currentRate * 100) : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-3 text-xs font-bold uppercase tracking-wider">
          <span className="text-emerald">Vous ({monthlySales > 0 ? vendorPercent : 100}%)</span>
          <span className="text-amber-500">PDV Pro ({(currentRate * 100).toFixed(0)}%)</span>
        </div>
      </div>

      {/* Concurrents */}
      <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-10 text-sm font-medium text-slate relative z-10">
        <p className="font-bold text-charcoal mb-4 uppercase tracking-wider text-xs">Ailleurs, pour générer ce CA, vous paieriez :</p>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span>Shopify (2.9% + fix + abonnement)</span>
            <span className="font-bold text-charcoal">~ {shopifyCost.toLocaleString('fr-FR')} FCFA / mois</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span>Autres plateformes locales (12%)</span>
            <span className="font-bold text-charcoal">~ {otherPlatformCost.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-emerald font-bold">PDV Pro ({(currentRate * 100).toFixed(0)}% tout inclus)</span>
            <span className="font-bold text-emerald text-lg text-right">{estimatedCommission.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>

      <div className="text-center relative z-10">
        <Link 
          href="/register" 
          className="block w-full text-center py-5 bg-emerald hover:bg-emerald-rich text-white font-bold rounded-xl transition-all shadow-xl shadow-emerald/20 text-lg hover:-translate-y-1"
        >
          Créer ma boutique gratuite →
        </Link>
      </div>
    </div>
  )
}
