'use client'

import { useState } from 'react'

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

  return (
    <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-line max-w-3xl mx-auto mt-12">
      <div className="text-center mb-8 bg-pearl border-b border-line p-6 -mt-6 -mx-6 md:-mt-10 md:-mx-10 rounded-t-2xl">
        <h3 className="text-sm font-mono text-emerald uppercase tracking-widest mb-2 font-bold">Simulateur de revenus</h3>
        <p className="text-slate text-sm font-light">Déplacez le curseur pour voir votre commission selon votre CA mensuel.</p>
      </div>

      <div className="mb-10 mt-6">
        <div className="flex justify-between items-center mb-4">
          <label className="font-mono text-dust text-xs uppercase tracking-wider font-bold">Chiffre d&apos;Affaires mensuel</label>
          <span className="text-2xl font-mono font-bold text-emerald">{monthlySales.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <input 
          aria-label="Estimation du Chiffre d'Affaires Mensuel"
          type="range" 
          min="0" 
          max="2000000" 
          step="10000"
          value={monthlySales} 
          onChange={(e) => setMonthlySales(Number(e.target.value))}
          className="w-full h-3 bg-cream border border-line rounded-lg appearance-none cursor-pointer accent-emerald focus:border-emerald focus:ring-1 focus:ring-emerald/20 outline-none"
        />
        <div className="flex justify-between text-[10px] text-dust mt-2 font-mono font-bold uppercase tracking-tighter">
          <span>0 F</span>
          <span>100K (7%)</span>
          <span>500K (6%)</span>
          <span>1M (5%)</span>
          <span>2M+ (4%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-pearl rounded-xl p-6 border border-line relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
          <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">Commission estimée</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-mono font-bold text-red-500">{estimatedCommission.toLocaleString('fr-FR')}</p>
            <p className="text-sm text-slate">FCFA</p>
          </div>
          <p className="text-[10px] text-slate mt-2 font-bold uppercase tracking-widest">Taux appliqué : {(currentRate * 100).toFixed(0)}%</p>
        </div>

        <div className="rounded-xl p-6 border border-line bg-emerald-subtle/30 border-emerald-border/50 relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald"></div>
          <p className="text-xs font-bold text-emerald uppercase tracking-wider mb-1">Votre Revenu Net Garanti</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-mono font-bold text-emerald-rich">{(monthlySales - estimatedCommission).toLocaleString('fr-FR')}</p>
            <p className="text-sm text-emerald">FCFA</p>
          </div>
          <p className="text-[10px] text-emerald mt-2 font-bold uppercase tracking-widest">Reçu directement sans délai</p>
        </div>
      </div>

      <div className="bg-cream text-slate p-4 rounded-xl text-center font-bold text-sm border border-line">
        PDV Pro absorbe tous les frais (passerelles + retrait). Vous ne payez que cette commission nette.<br />
        <span className="text-emerald text-xs mt-2 block font-normal">Paiement à la livraison (COD) : 5% fixe (commission prélevée sur le wallet du vendeur).</span>
      </div>
    </div>
  )
}
