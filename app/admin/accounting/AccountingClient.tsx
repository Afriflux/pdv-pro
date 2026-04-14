'use client'

import { toast } from 'sonner';

import React, { useState } from 'react'
import { PlusCircle, Search, Server, MonitorPlay, Users, ArrowRight, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Expense {
  id: string
  title: string
  category: string
  amount: number
  isRecurring: boolean
  frequency: string | null
  expenseDate: string
}

export default function AccountingClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses] = useState<Expense[]>(initialExpenses)
  const [searchQuery, setSearchQuery] = useState('')

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'SERVERS': return <Server size={18} className="text-blue-500" />
      case 'MARKETING': return <MonitorPlay size={18} className="text-purple-500" />
      case 'PAYROLL': return <Users size={18} className="text-emerald-500" />
      default: return <DollarSign size={18} className="text-gray-500" />
    }
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'SERVERS': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'MARKETING': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'PAYROLL': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const filtered = expenses.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl shadow-black-[0.02] border border-gray-100 overflow-hidden">
      <div className="p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">Registre des Dépenses</h2>
          <p className="text-sm font-bold text-gray-500 mt-1">
             Saisissez et suivez vos charges opérationnelles (Factures, Salaires, Abonnements).
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher une charge..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-[#0F7A60] transition-colors placeholder:text-gray-400 placeholder:font-medium"
            />
          </div>
          
          <button onClick={() => toast('Future Server Action pour ajouter une charge')} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap">
            <PlusCircle size={16}/> Saisir une charge
          </button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
             <TrendingUp className="w-8 h-8 text-gray-400" />
           </div>
           <h3 className="text-lg font-black text-gray-900 mb-2">Aucune dépense enregistrée</h3>
           <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
             La comptabilité interne est vide. Commencez par enregistrer vos premières factures d'hébergement ou campagnes marketing.
           </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Intitulé</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Catégorie</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Statut</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(expense => (
                <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      {format(new Date(expense.expenseDate), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-gray-900">{expense.title}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm ${getCategoryBadge(expense.category)}`}>
                        {getCategoryIcon(expense.category)}
                        {expense.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {expense.isRecurring ? (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 rounded-lg">
                        Récurrent ({expense.frequency})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-black uppercase tracking-wider text-gray-600 bg-gray-100 rounded-lg">
                        Ponctuel
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-black text-gray-900 bg-red-50 text-red-700 px-3 py-1 rounded-lg border border-red-100 font-mono">
                      - {expense.amount.toLocaleString('fr-FR')} CFA
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
