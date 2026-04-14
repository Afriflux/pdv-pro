'use client'

import { toast } from 'sonner';

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const GATEWAYS = [
  { id: 'wave', name: 'Wave Mobile Money', fee: 0.01, icon: '🌊' },
  { id: 'cinetpay', name: 'Orange Money / CinetPay', fee: 0.02, icon: '🟠' },
  { id: 'paytech', name: 'Carte bancaire / PayTech', fee: 0.02, icon: '💳' },
]

export function DepositModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [gateway, setGateway] = useState(GATEWAYS[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const feeAmount = amount * gateway.fee
  const totalAmount = amount + feeAmount

  const handleDeposit = () => {
    toast(`Redirection vers la passerelle ${gateway.name} pour un montant total de ${totalAmount.toLocaleString('fr-FR')} FCFA...`)
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative overflow-hidden w-full sm:w-auto px-6 py-3.5 bg-gradient-to-br from-[#0F7A60] to-[#094A3A] text-white rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 group ring-4 ring-[#0F7A60]/20 hover:ring-[#0F7A60]/40 shadow-[0_8px_30px_rgba(15,122,96,0.3)]"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
        
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all shadow-inner backdrop-blur-md relative z-10">
          <span className="text-base">⚡</span>
        </div>
        
        <div className="flex flex-col items-start text-left relative z-10">
          <span className="text-sm font-black leading-none mb-1">Recharger le solde</span>
          <span className="text-xs text-emerald-200 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.65 2 6.32 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% Sécurisé
          </span>
        </div>
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xl font-display font-black text-ink">Recharger mon solde</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate hover:text-ink transition text-2xl">×</button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                <div>
                  <label className="text-xs font-mono font-bold text-dust uppercase tracking-wider block mb-2">Montant à recharger (FCFA)</label>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-pearl border border-line rounded-xl px-5 py-4 font-display font-bold text-2xl focus:border-emerald outline-none transition"
                    placeholder="Ex: 5000"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-dust uppercase tracking-wider block mb-2">Choisir une passerelle</label>
                  <div className="grid grid-cols-1 gap-2">
                    {GATEWAYS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGateway(g)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          gateway.id === g.id 
                            ? 'border-emerald bg-emerald/5 shadow-sm' 
                            : 'border-line hover:border-emerald/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{g.icon}</span>
                          <span className="text-sm font-bold text-ink">{g.name}</span>
                        </div>
                        <span className="text-xs font-mono text-dust">+{g.fee * 100}%</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-pearl rounded-2xl p-5 space-y-2 border border-line">
                  <div className="flex justify-between text-xs text-slate">
                    <span>Montant recharge</span>
                    <span>{amount.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate">
                    <span>Frais ({gateway.fee * 100}%)</span>
                    <span>+{feeAmount.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-line">
                    <span className="font-bold text-ink">Total à payer</span>
                    <span className="font-black text-emerald text-lg">{totalAmount.toLocaleString('fr-FR')} F</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-2">
                <button
                  disabled={amount <= 0}
                  onClick={handleDeposit}
                  className="w-full py-5 bg-emerald hover:bg-emerald-rich disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-emerald/20 flex items-center justify-center gap-3"
                >
                  🚀 Recharger maintenant
                </button>
                
                <p className="text-xs text-center text-slate font-light leading-relaxed mt-4">
                  Les frais de transaction sont à la charge du vendeur pour les recharges de solde. 
                  Le traitement est instantané.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
