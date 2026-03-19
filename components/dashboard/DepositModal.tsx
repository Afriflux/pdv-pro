'use client'

import { useState } from 'react'

const GATEWAYS = [
  { id: 'wave', name: 'Wave Mobile Money', fee: 0.01, icon: '🌊' },
  { id: 'cinetpay', name: 'Orange Money / CinetPay', fee: 0.02, icon: '🟠' },
  { id: 'paytech', name: 'Carte bancaire / PayTech', fee: 0.02, icon: '💳' },
]

export function DepositModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [gateway, setGateway] = useState(GATEWAYS[0])

  const feeAmount = amount * gateway.fee
  const totalAmount = amount + feeAmount

  const handleDeposit = () => {
    alert(`Redirection vers la passerelle ${gateway.name} pour un montant total de ${totalAmount.toLocaleString('fr-FR')} FCFA...`)
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 bg-white border border-emerald/20 text-[#0F7A60] font-bold rounded-2xl hover:bg-emerald/5 transition shadow-sm"
      >
        ➕ Recharger mon solde
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-black text-ink">Recharger mon solde</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate hover:text-ink transition text-2xl">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-dust uppercase tracking-wider block mb-2">Montant à recharger (FCFA)</label>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-pearl border border-line rounded-xl px-5 py-4 font-display font-bold text-2xl focus:border-emerald outline-none transition"
                    placeholder="Ex: 5000"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-dust uppercase tracking-wider block mb-2">Choisir une passerelle</label>
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
                        <span className="text-[10px] font-mono text-dust">+{g.fee * 100}%</span>
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

              <button
                disabled={amount <= 0}
                onClick={handleDeposit}
                className="w-full py-5 bg-emerald hover:bg-emerald-rich disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition shadow-lg shadow-emerald/20 flex items-center justify-center gap-3"
              >
                🚀 Recharger maintenant
              </button>
              
              <p className="text-[10px] text-center text-slate font-light leading-relaxed">
                Les frais de transaction sont à la charge du vendeur pour les recharges de solde. 
                Le traitement est instantané.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
