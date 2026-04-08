'use client'

import React, { useState } from 'react'
import { TrendingUp, Diamond, Wallet, CreditCard } from 'lucide-react'

export function PricingCards() {
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [activeRow, setActiveRow] = useState<number | null>(null)

  const toggleCard = (index: number) => {
    setActiveCard(activeCard === index ? null : index)
  }

  const hoverHeaderClass = (rowIndex: number) => 
    `h-12 flex items-center gap-3 transition-all duration-300 md:-mx-4 md:px-4 rounded-xl cursor-default relative z-10 ${activeRow === rowIndex ? 'bg-gold/30 scale-105 shadow-md border border-gold/20' : 'border border-transparent'}`
  
  const hoverCardClass = (rowIndex: number, customClasses = '') => 
    `flex flex-col md:h-12 md:flex-row items-center justify-center transition-all duration-300 md:-mx-4 md:px-4 rounded-xl relative z-10 ${customClasses} ${activeRow === rowIndex ? 'bg-gold/30 scale-110 shadow-md border border-gold/20' : 'border border-transparent'}`

  return (
    <div className="w-full pb-8 mb-4 pt-4">
      <div className="flex flex-col md:grid md:grid-cols-5 items-stretch gap-6 md:gap-4 px-2 pt-8">
        
        {/* Headers - Desktop Only */}
        <div className="hidden md:flex flex-col sticky left-0 z-20 bg-pearl/90 backdrop-blur-sm self-stretch pt-[104px] pb-6 pr-8">
          <div className="space-y-6 w-full">
            <div 
              className={hoverHeaderClass(0)}
              onMouseEnter={() => setActiveRow(0)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald shadow-sm">
                  <TrendingUp size={14} strokeWidth={2.5} />
               </div>
               <span className="text-[11px] font-black text-emerald-rich uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-emerald/10 shadow-sm shadow-emerald/5">Votre CA mensuel</span>
            </div>
            
            <div 
              className={hoverHeaderClass(1)}
              onMouseEnter={() => setActiveRow(1)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink shadow-sm">
                  <Diamond size={14} strokeWidth={2.5} />
               </div>
               <span className="text-[11px] font-bold text-ink uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-line shadow-sm shadow-ink/5">Commission Yayyam</span>
            </div>
            
            <div 
              className={hoverHeaderClass(2) + ' md:mt-2'}
              onMouseEnter={() => setActiveRow(2)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold-rich shadow-sm">
                  <Wallet size={14} strokeWidth={2.5} />
               </div>
               <span className="text-[11px] font-bold text-ink uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-line shadow-sm shadow-ink/5">Vous recevez</span>
            </div>
            
            <div 
              className={hoverHeaderClass(3)}
              onMouseEnter={() => setActiveRow(3)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <div className="w-8 h-8 rounded-full bg-slate/10 flex items-center justify-center text-slate shadow-sm">
                  <CreditCard size={14} strokeWidth={2.5} />
               </div>
               <span className="text-[11px] font-bold text-slate uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-line shadow-sm shadow-ink/5">Frais passerelle</span>
            </div>
          </div>
        </div>

        {/* Card 1 */}
        <div 
          onClick={() => toggleCard(1)}
          className="bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative cursor-help group"
        >
          <div className={`absolute inset-0 rounded-3xl bg-ink/95 backdrop-blur-md text-white p-6 md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 z-50 flex flex-col justify-center text-center pointer-events-none ${activeCard === 1 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <h4 className="font-bold text-gold mb-3 text-lg">Palier Débutant</h4>
            <p className="text-sm text-cream/90 leading-relaxed">Activé par défaut ou si votre chiffre d'affaires mensuel (N-1) est inférieur à 100 000 FCFA. Une commission unique de 8% s'applique. Zéro abonnement.</p>
          </div>
          <div className="text-center pb-6 border-b border-line mb-6">
            <h3 className="font-display font-black text-2xl text-ink">Débutant</h3>
          </div>
          <div className="space-y-4 md:space-y-6 flex-1 text-center">
            <div 
              className={hoverCardClass(0)}
              onMouseEnter={() => setActiveRow(0)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Votre CA Mensuel</span>
               <span className="font-mono text-sm font-bold text-charcoal">0 - 100K FCFA</span>
            </div>
            <div 
              className={hoverCardClass(1)}
              onMouseEnter={() => setActiveRow(1)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Commission Yayyam</span>
               <span className="text-5xl font-display font-black text-ink">8%</span>
            </div>
            <div 
              className={hoverCardClass(2, 'md:mt-2')}
              onMouseEnter={() => setActiveRow(2)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest mt-2">Vous recevez</span>
               <span className="font-bold text-emerald text-xl">92%</span>
            </div>
            <div 
              className={hoverCardClass(3)}
              onMouseEnter={() => setActiveRow(3)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Frais passerelle</span>
               <span className="text-sm font-medium text-slate">Inclus</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => toggleCard(2)}
          className="bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative cursor-help group"
        >
          <div className={`absolute inset-0 rounded-3xl bg-ink/95 backdrop-blur-md text-white p-6 md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 z-50 flex flex-col justify-center text-center pointer-events-none ${activeCard === 2 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <h4 className="font-bold text-gold mb-3 text-lg">Palier Actif</h4>
            <p className="text-sm text-cream/90 leading-relaxed">Dès que vous dépassez les 100 000 FCFA de ventes le mois précédent, le système abaisse automatiquement votre commission à 7%. Vous gagnez plus.</p>
          </div>
          <div className="text-center pb-6 border-b border-line mb-6">
            <h3 className="font-display font-black text-2xl text-ink">Actif</h3>
          </div>
          <div className="space-y-4 md:space-y-6 flex-1 text-center">
            <div 
              className={hoverCardClass(0)}
              onMouseEnter={() => setActiveRow(0)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Votre CA Mensuel</span>
               <span className="font-mono text-sm font-bold text-charcoal">100K - 500K FCFA</span>
            </div>
            <div 
              className={hoverCardClass(1)}
              onMouseEnter={() => setActiveRow(1)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Commission Yayyam</span>
               <span className="text-5xl font-display font-black text-ink">7%</span>
            </div>
            <div 
              className={hoverCardClass(2, 'md:mt-2')}
              onMouseEnter={() => setActiveRow(2)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest mt-2">Vous recevez</span>
               <span className="font-bold text-emerald text-xl">93%</span>
            </div>
            <div 
              className={hoverCardClass(3)}
              onMouseEnter={() => setActiveRow(3)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Frais passerelle</span>
               <span className="text-sm font-medium text-slate">Inclus</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => toggleCard(3)}
          className="bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative cursor-help group"
        >
          <div className={`absolute inset-0 rounded-3xl bg-ink/95 backdrop-blur-md text-white p-6 md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 z-50 flex flex-col justify-center text-center pointer-events-none ${activeCard === 3 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <h4 className="font-bold text-gold mb-3 text-lg">Palier Pro</h4>
            <p className="text-sm text-cream/90 leading-relaxed">Réservé aux e-commerçants confirmés avec plus de 500 000 FCFA de volumes mensuels (N-1). Vous passez à 6% et gardez 94% du chiffre d'affaires net.</p>
          </div>
          <div className="text-center pb-6 border-b border-line mb-6">
            <h3 className="font-display font-black text-2xl text-ink">Pro</h3>
          </div>
          <div className="space-y-4 md:space-y-6 flex-1 text-center">
            <div 
              className={hoverCardClass(0)}
              onMouseEnter={() => setActiveRow(0)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Votre CA Mensuel</span>
               <span className="font-mono text-sm font-bold text-charcoal">500K - 1M FCFA</span>
            </div>
            <div 
              className={hoverCardClass(1)}
              onMouseEnter={() => setActiveRow(1)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Commission Yayyam</span>
               <span className="text-5xl font-display font-black text-ink">6%</span>
            </div>
            <div 
              className={hoverCardClass(2, 'md:mt-2')}
              onMouseEnter={() => setActiveRow(2)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest mt-2">Vous recevez</span>
               <span className="font-bold text-emerald text-xl">94%</span>
            </div>
            <div 
              className={hoverCardClass(3)}
              onMouseEnter={() => setActiveRow(3)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Frais passerelle</span>
               <span className="text-sm font-medium text-slate">Inclus</span>
            </div>
          </div>
        </div>

        {/* Card 4 (Expert) */}
        <div 
          onClick={() => toggleCard(4)}
          className="bg-pearl rounded-3xl border-2 border-emerald shadow-xl p-6 flex flex-col md:transform md:hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative cursor-help group"
        >
          <div className={`absolute inset-0 rounded-3xl bg-emerald-deep/95 backdrop-blur-md text-white p-6 md:group-hover:opacity-100 md:group-hover:visible transition-all duration-300 z-50 flex flex-col justify-center text-center pointer-events-none ${activeCard === 4 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <h4 className="font-bold text-emerald-light mb-3 text-lg">Palier Expert</h4>
            <p className="text-sm text-cream/90 leading-relaxed">Le grade d'élite. En dépassant 1 Million FCFA mensuels, vous obtenez notre meilleur taux de 5%. Frais Wave/Orange Money inclus. Zéro plafond de facturation.</p>
          </div>
          <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-gold text-ink text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full shadow-md whitespace-nowrap pointer-events-none z-[60] border border-gold-dark/30">
            Meilleur taux (Populaire)
          </div>
          <div className="text-center pb-6 border-b border-emerald/20 mb-6 relative z-0 mt-2">
            <h3 className="font-display font-black text-2xl text-emerald-rich">Expert</h3>
          </div>
          <div className="space-y-4 md:space-y-6 flex-1 text-center relative z-0">
            <div 
              className={hoverCardClass(0)}
              onMouseEnter={() => setActiveRow(0)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Votre CA Mensuel</span>
               <span className="font-mono text-sm font-bold text-charcoal">+ 1M FCFA</span>
            </div>
            <div 
              className={hoverCardClass(1)}
              onMouseEnter={() => setActiveRow(1)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest">Commission Yayyam</span>
               <span className={`text-5xl font-display font-black text-emerald md:scale-110 transition-transform ${activeRow === 1 ? 'scale-110' : ''}`}>5%</span>
            </div>
            <div 
              className={hoverCardClass(2, 'md:mt-2')}
              onMouseEnter={() => setActiveRow(2)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest mt-2">Vous recevez</span>
               <span className={`font-bold text-emerald-rich text-xl md:text-2xl mt-2 md:mt-0 bg-emerald/10 rounded-full md:scale-110 px-4 py-1 transition-transform ${activeRow === 2 ? 'scale-110' : ''}`}>95%</span>
            </div>
            <div 
              className={hoverCardClass(3)}
              onMouseEnter={() => setActiveRow(3)}
              onMouseLeave={() => setActiveRow(null)}
            >
               <span className="md:hidden text-[10px] uppercase text-slate font-bold mb-1 tracking-widest mt-2 md:mt-0">Frais passerelle</span>
               <span className="text-sm font-bold text-emerald">Inclus</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
