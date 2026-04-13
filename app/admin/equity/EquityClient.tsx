'use client'

import React, { useState } from 'react'
import { PlusCircle, Search, User, Percent, Calculator, Crown, Coins } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { distributeDividends } from '@/lib/admin/financeActions'

interface Shareholder {
  id: string
  userId: string
  name: string
  email: string
  percent: number
  startDate: string
  endDate: string | null
  alreadyPaid: number
}

export default function EquityClient({ 
  initialShareholders, 
  netProfit 
}: { 
  initialShareholders: Shareholder[]
  netProfit: number 
}) {
  const router = useRouter()
  const [shareholders] = useState<Shareholder[]>(initialShareholders)
  const [searchQuery, setSearchQuery] = useState('')
  const [payoutModal, setPayoutModal] = useState<{isOpen: boolean, shareholder: Shareholder | null, amount: number}>({ isOpen: false, shareholder: null, amount: 0 })
  const [method, setMethod] = useState('Wave')
  const [reference, setReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePayout = async () => {
    if (!payoutModal.shareholder) return
    setIsSubmitting(true)
    try {
      await distributeDividends({
        shareholderId: payoutModal.shareholder.id,
        amount: payoutModal.amount,
        paymentMethod: method,
        reference: reference
      })
      alert("Dividende distribué et isolé comptablement avec succès !")
      setPayoutModal({ isOpen: false, shareholder: null, amount: 0 })
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = shareholders.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-black-[0.02] border border-gray-100 overflow-hidden">
      <div className="p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 bg-zinc-50/50">
        <div>
          <h2 className="text-xl font-black text-gray-900">Membres du Board</h2>
          <p className="text-sm font-bold text-gray-500 mt-1">
             Gérez les parts (Equity) attribuées aux co-fondateurs ou associés de façon dynamique.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Rechercher un associé..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-zinc-800 transition-colors placeholder:text-gray-400 placeholder:font-medium"
            />
          </div>
          
          <button onClick={() => alert('Future Server Action pour ajouter un associé')} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap">
            <PlusCircle size={16}/> Nouvel Associé
          </button>
        </div>
      </div>

      {shareholders.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
             <Crown className="w-8 h-8 text-zinc-400" />
           </div>
           <h3 className="text-lg font-black text-gray-900 mb-2">Aucun associé déclaré</h3>
           <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
             La structure financière vous appartient à 100%. Vous pouvez inviter un membre et lui allouer un pourcentage des revenus nets (ex: 20% pour votre épouse).
           </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-center gap-2 text-sm text-emerald-800 font-bold">
            <Calculator size={16} /> 
            Simulation des Dividendes actuels sur la trésorerie nette de <span className="font-black bg-white px-2 py-0.5 rounded border border-emerald-200">{netProfit.toLocaleString('fr-FR')} CFA</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Associé(e)</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Date d'intégration</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Parts (% Equity)</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">Gains Actuels Calculés</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(shareholder => {
                const totalGain = netProfit * (shareholder.percent / 100)
                const calculatedGain = Math.max(0, totalGain - shareholder.alreadyPaid)
                
                return (
                  <tr key={shareholder.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 font-black shadow-inner border border-zinc-200">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{shareholder.name}</p>
                          <p className="text-xs font-bold text-gray-500">{shareholder.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">Depuis le {format(new Date(shareholder.startDate), 'dd MMM yyyy', { locale: fr })}</span>
                        {!shareholder.endDate ? (
                           <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Durée Indéterminée</span>
                        ) : (
                           <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                             Jusqu'au {format(new Date(shareholder.endDate), 'dd MMM yyyy', { locale: fr })}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black text-zinc-800 bg-zinc-100 border border-zinc-200">
                        {shareholder.percent} <Percent size={14}/>
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {calculatedGain > 0 ? (
                          <span className="text-lg font-black text-emerald-600 flex items-center gap-2">
                            {calculatedGain.toLocaleString('fr-FR')} CFA
                            <span className="text-xs uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 rounded">À reverser</span>
                          </span>
                        ) : (
                          <span className="text-sm font-black text-gray-300">À jour (Total: {totalGain.toLocaleString('fr-FR')} CFA)</span>
                        )}
                        {shareholder.alreadyPaid > 0 && (
                          <span className="text-xs font-bold text-gray-400 border border-gray-100 bg-gray-50 px-2 py-0.5 rounded-md">
                            Déjà versé : {shareholder.alreadyPaid.toLocaleString('fr-FR')} CFA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button 
                         onClick={() => {
                           if (calculatedGain > 0) {
                             setPayoutModal({ isOpen: true, shareholder, amount: calculatedGain })
                           } else {
                             alert("Aucun gain à reverser.")
                           }
                         }}
                         title="Verser le dividende"
                         aria-label="Verser le dividende"
                         className={`p-2 rounded-lg transition-colors border ${calculatedGain > 0 ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 shadow-sm' : 'text-zinc-400 border-transparent hover:border-zinc-200'}`}
                       >
                         <Coins size={16} />
                       </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payout Modal */}
      {payoutModal.isOpen && payoutModal.shareholder && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full relative">
            <h3 className="text-xl font-black text-gray-900 mb-1">Distribuer des dividendes</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Validez le paiement physique pour {payoutModal.shareholder.name}.</p>

            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center mb-6">
               <span className="text-xs font-black uppercase tracking-widest">Montant Actuel</span>
               <span className="text-xl font-black">{(payoutModal.amount || 0).toLocaleString('fr-FR')} F</span>
            </div>

            <label className="block text-sm font-bold text-gray-700 mb-2">Méthode de paiement</label>
            <select 
              value={method} 
              onChange={e => setMethod(e.target.value)}
              title="Méthode de paiement"
              aria-label="Méthode de paiement"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 transition-colors mb-4"
            >
              <option value="Wave">Wave</option>
              <option value="Orange Money">Orange Money</option>
              <option value="Virement Bancaire">Virement Bancaire</option>
              <option value="Espèces">Espèces</option>
            </select>

            <label className="block text-sm font-bold text-gray-700 mb-2">Référence (Optionnel)</label>
            <input 
              type="text" 
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex: TR-10045"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 transition-colors mb-8"
            />

            <div className="flex gap-4">
               <button 
                 onClick={() => setPayoutModal({ isOpen: false, shareholder: null, amount: 0 })}
                 className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                 disabled={isSubmitting}
               >
                 Annuler
               </button>
               <button 
                 onClick={handlePayout}
                 className="flex-1 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2"
                 disabled={isSubmitting}
               >
                 {isSubmitting ? (
                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                 ) : (
                   <>Confirmer le paiement</>
                 )}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
