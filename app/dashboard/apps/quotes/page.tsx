'use client'

import { toast } from 'sonner';

import { useState, useEffect } from 'react'
import { Trash2, FileText, ChevronLeft, User, DollarSign, Calendar, Activity, CheckCircle2, Send, Plus } from 'lucide-react'
import Link from 'next/link'
import { getQuotesAction, createQuoteAction, deleteQuoteAction, updateQuoteStatusAction } from './actions'

type QuoteItem = { description: string, quantity: number, unit_price: number }

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Form State
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    setLoading(true)
    const res = await getQuotesAction()
    if (res.success && res.quotes) {
      setQuotes(res.quotes)
    }
    setLoading(false)
  }

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
  }

  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || items.some(i => !i.description || i.quantity <= 0 || i.unit_price <= 0)) {
      toast("Veuillez remplir tous les champs obligatoires des articles.")
      return
    }
    
    setIsSubmitting(true)
    const res = await createQuoteAction({
      client_name: clientName,
      client_email: clientEmail,
      items
    })
    
    if (res.success) {
      setIsCreating(false)
      setClientName('')
      setClientEmail('')
      setItems([{ description: '', quantity: 1, unit_price: 0 }])
      loadQuotes()
    } else {
      toast.error(res.error || "Une erreur est survenue")
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Voulez-vous vraiment supprimer ce devis ?')) return
    setQuotes(quotes.filter(q => q.id !== id))
    await deleteQuoteAction(id)
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, status } : q))
    await updateQuoteStatusAction(id, status)
  }

  const handleCopy = (id: string) => {
    const url = `${window.location.origin}/quote/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-600'
      case 'SENT': return 'bg-blue-100 text-blue-600'
      case 'ACCEPTED': return 'bg-emerald-100 text-emerald-600'
      case 'REJECTED': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const totalPreview = items.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0)

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/apps" className="hover:text-ink transition-colors flex items-center gap-1">
              <ChevronLeft size={14} /> Applications
            </Link>
          </div>
          <h1 className="text-3xl font-black text-ink flex items-center gap-3">
            <FileText className="text-[#0F7A60]" size={32} />
            Devis & Factures
          </h1>
          <p className="text-gray-500 font-medium mt-1">Générez des devis professionnels et facturez vos clients directement.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 bg-[#0F7A60] hover:bg-[#0F7A60]/90 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#0F7A60]/20"
        >
          <Plus size={20} />
          Créer un Devis
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-line shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0F7A60]"></div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ink">Nouveau Devis</h2>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500 transition-colors">Annuler</button>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 max-w-4xl">
            {/* Infos Client */}
            <div className="bg-[#FAFAF7] p-5 rounded-2xl border border-line grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate flex items-center gap-2"><User size={16}/> Client / Entreprise</label>
                 <input 
                   type="text" required value={clientName} onChange={e => setClientName(e.target.value)}
                   placeholder="Ex: Agence digitale SN" 
                   className="w-full bg-white border border-line rounded-xl px-4 py-2 text-ink font-medium focus:border-[#0F7A60] outline-none"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate">Email (Optionnel)</label>
                 <input 
                   type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                   placeholder="contact@agence.sn" 
                   className="w-full bg-white border border-line rounded-xl px-4 py-2 text-ink font-medium focus:border-[#0F7A60] outline-none"
                 />
               </div>
            </div>

            {/* Lignes du devis */}
            <div className="space-y-3">
               <h3 className="text-sm font-bold text-slate flex items-center gap-2"><DollarSign size={16}/> Articles & Prestations</h3>
               
               {items.map((item, index) => (
                 <div key={index} className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 w-full space-y-1">
                       {index === 0 && <label className="text-xs font-bold text-gray-500">Description</label>}
                       <input 
                         type="text" required value={item.description}
                         onChange={e => handleUpdateItem(index, 'description', e.target.value)}
                         placeholder="Création site web vitrine" 
                         className="w-full bg-white border-2 border-line rounded-xl px-4 py-2.5 text-ink font-medium focus:border-[#0F7A60] outline-none"
                       />
                    </div>
                    <div className="w-full md:w-24 space-y-1">
                       {index === 0 && <label className="text-xs font-bold text-gray-500">Qté</label>}
                       <input 
                         type="number" required min="1" value={item.quantity}
                         aria-label="Quantité" title="Quantité"
                         onChange={e => handleUpdateItem(index, 'quantity', parseInt(e.target.value))}
                         className="w-full bg-white border-2 border-line rounded-xl px-3 py-2.5 text-ink font-medium focus:border-[#0F7A60] outline-none text-center"
                       />
                    </div>
                    <div className="w-full md:w-40 space-y-1">
                       {index === 0 && <label className="text-xs font-bold text-gray-500">Prix Unitaire</label>}
                       <input 
                         type="number" required min="1" value={item.unit_price}
                         aria-label="Prix Unitaire" title="Prix Unitaire"
                         onChange={e => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value))}
                         className="w-full bg-white border-2 border-line rounded-xl px-3 py-2.5 text-ink font-medium focus:border-[#0F7A60] outline-none text-right"
                       />
                    </div>
                    <button 
                      type="button" onClick={() => handleRemoveItem(index)}
                      aria-label="Supprimer la ligne"
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border-2 border-transparent hover:border-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               ))}
               
               <button 
                 type="button" onClick={handleAddItem}
                 className="text-sm font-bold text-[#0F7A60] hover:text-[#0F7A60]/80 flex items-center gap-1 mt-2"
               >
                 <Plus size={16} /> Ajouter une ligne
               </button>
            </div>

            <div className="border-t border-line pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-2xl font-black text-ink">
                 Total : {totalPreview.toLocaleString('fr-FR')} <span className="text-sm text-gray-500">FCFA</span>
               </div>
               <button
                 disabled={isSubmitting}
                 type="submit"
                 className="w-full md:w-auto bg-ink hover:bg-ink/90 text-white px-10 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
               >
                 {isSubmitting ? 'Génération...' : 'Générer le Devis'}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des devis */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Activity className="animate-spin text-[#0F7A60]" size={32} />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-16 bg-[#FAFAF7] border-2 border-line border-dashed rounded-3xl">
             <FileText size={48} className="text-gray-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-ink mb-2">Aucun devis créé</h3>
             <p className="text-gray-500 font-medium max-w-md mx-auto">Commencez à générer des devis professionnels et transformez-les en factures payables en 1 clic.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-line overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#FAFAF7] border-b border-line text-xs uppercase text-gray-500 font-black tracking-wider">
                     <th className="p-4">Détails Client</th>
                     <th className="p-4">Montant</th>
                     <th className="p-4">Statut</th>
                     <th className="p-4">Date</th>
                     <th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-line">
                    {quotes.map(quote => (
                      <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                           <p className="font-bold text-ink truncate max-w-[200px]">{quote.client_name}</p>
                           {quote.client_email && <p className="text-xs text-gray-500">{quote.client_email}</p>}
                        </td>
                        <td className="p-4">
                           <p className="font-black text-ink">{quote.total_amount.toLocaleString('fr-FR')} <span className="text-xs text-gray-500">FCFA</span></p>
                        </td>
                        <td className="p-4">
                           <select 
                             value={quote.status}
                             aria-label="Statut du devis" title="Statut du devis"
                             onChange={(e) => handleUpdateStatus(quote.id, e.target.value)}
                             className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer outline-none ${getStatusColor(quote.status)}`}
                           >
                             <option value="DRAFT">Brouillon</option>
                             <option value="SENT">Envoyé</option>
                             <option value="ACCEPTED">Facturé & Payé</option>
                             <option value="REJECTED">Refusé</option>
                           </select>
                        </td>
                        <td className="p-4">
                           <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                             <Calendar size={14}/>
                             {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                           </p>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                           <button
                             onClick={() => handleCopy(quote.id)}
                             title="Copier le lien d'envoi client"
                             className="p-2 text-ink hover:text-[#0F7A60] hover:bg-[#0F7A60]/10 rounded-lg transition-colors flex items-center gap-1 border border-line"
                           >
                             {copiedId === quote.id ? <CheckCircle2 size={16}/> : <Send size={16}/>}
                           </button>
                           <button
                             onClick={() => handleDelete(quote.id)}
                             aria-label="Supprimer le devis"
                             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                           >
                             <Trash2 size={18}/>
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
