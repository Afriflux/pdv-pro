'use client'

import React, { useState } from 'react'
import { Briefcase, Plus, FileText, Trash, Copy, CheckCircle2, Clock, Loader2, X, PlusCircle, MinusCircle } from 'lucide-react'
import { createQuoteAction, updateQuoteStatusAction, deleteQuoteAction } from './actions'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

interface QuoteItem {
  name: string
  quantity: number
  unit_price: number
}

interface QuoteData {
  id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  items: QuoteItem[]
  total_amount: number
  status: string
  expires_at: string | null
  created_at: string
}

export default function QuotesClient({ storeId, quotes: initialQuotes }: { storeId: string, storeSlug: string, quotes: QuoteData[] }) {
  const [quotes, setQuotes] = useState<QuoteData[]>(initialQuotes)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([{ name: '', quantity: 1, unit_price: 0 }])
  const [expiresIn, setExpiresIn] = useState(15)

  const calcTotal = () => items.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0)

  const handleAddItem = () => setItems([...items, { name: '', quantity: 1, unit_price: 0 }])
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleCreate = async () => {
    if (!clientName.trim() || items.some(i => !i.name.trim() || i.unit_price <= 0)) {
      toast.error('Veuillez remplir le nom du client et les informations de tous les articles.')
      return
    }
    
    setIsSubmitting(true)
    const total = calcTotal()
    const res = await createQuoteAction(storeId, {
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      items,
      total_amount: total,
      expires_in_days: expiresIn
    })

    if (res.success) {
      toast.success('Facture / Devis B2B créé !')
      setQuotes([{
        id: res.quoteId!,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        items,
        total_amount: total,
        status: 'DRAFT',
        expires_at: new Date(Date.now() + expiresIn * 24 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }, ...quotes])
      setIsModalOpen(false)
      setClientName('')
      setClientEmail('')
      setClientPhone('')
      setItems([{ name: '', quantity: 1, unit_price: 0 }])
    } else {
      toast.error(res.error)
    }
    setIsSubmitting(false)
  }

  const handleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'DRAFT' ? 'PUBLISHED' : current === 'PUBLISHED' ? 'PAID' : 'DRAFT'
    setIsSubmitting(true)
    const res = await updateQuoteStatusAction(id, storeId, nextStatus)
    if (res.success) {
       setQuotes(quotes.map(q => q.id === id ? { ...q, status: nextStatus } : q))
       toast.success(`Statut mis à jour : ${nextStatus}`)
    } else {
       toast.error(res.error)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({ title: 'Confirmation', text: 'Supprimer ce devis ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler' })
    if (!res.isConfirmed) return
    setIsSubmitting(true)
    const delRes = await deleteQuoteAction(id, storeId)
    if (delRes.success) {
       setQuotes(quotes.filter(q => q.id !== id))
       toast.success("Devis supprimé")
    }
    setIsSubmitting(false)
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/quote/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Lien du devis copié !')
  }

  return (
    <div className="space-y-6 font-sans pb-32">
       {/* HEADER */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-gradient-to-br from-[#0F7A60] to-emerald-800 text-white rounded-2xl shadow-lg">
                <Briefcase size={26} />
             </div>
             <h1 className="text-3xl font-display font-black text-ink tracking-tight">Devis & B2B</h1>
          </div>
          <p className="text-dust font-medium text-sm mt-1 max-w-xl">
             Génèrez des devis et factures pro, partageables en un lien et payables en ligne par vos clients B2B.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-ink hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Créer un Devis</span>
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {quotes.length === 0 ? (
           <div className="text-center py-16 bg-white/50 rounded-3xl border border-line border-dashed flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <FileText size={32} />
             </div>
             <p className="text-ink font-black text-lg">Aucun devis généré</p>
             <p className="text-slate text-sm max-w-sm mt-2">Passez au niveau supérieur avec vos clients B2B.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quotes.map(q => (
               <div key={q.id} className="bg-white border border-line rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-black uppercase text-dust tracking-wider">#{q.id.split('-')[0]}</span>
                         <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${q.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : q.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {q.status === 'PAID' && <CheckCircle2 size={10}/>}
                            {q.status === 'DRAFT' && <Clock size={10}/>}
                            {q.status}
                         </span>
                      </div>
                      <h3 className="font-bold text-ink text-lg">{q.client_name}</h3>
                      <p className="text-xs font-medium text-slate">{q.client_email || 'Sans email'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-[#0F7A60]">{q.total_amount.toLocaleString('fr-FR')} XOF</p>
                       <p className="text-[10px] text-dust font-bold uppercase tracking-widest">{q.items.length} Article(s)</p>
                    </div>
                  </div>

                  <div className="border-t border-line mt-4 pt-4 flex flex-wrap gap-2 justify-between items-center bg-[#FAFAF7] -mx-5 -mb-5 px-5 py-4 rounded-b-3xl">
                     <button onClick={() => copyLink(q.id)} title="Copier" className="flex items-center gap-1.5 text-xs font-bold text-ink bg-white border border-line px-3 py-1.5 rounded-lg hover:border-slate-300 transition">
                        <Copy size={14} /> Lien
                     </button>
                     <div className="flex items-center gap-2">
                        <button onClick={() => handleStatus(q.id, q.status)} title="Changer statut" disabled={isSubmitting} className="text-xs font-bold text-slate-600 bg-white border border-line px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                           Changer Statut
                        </button>
                        <button onClick={() => handleDelete(q.id)} title="Supprimer" disabled={isSubmitting} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                           <Trash size={14} />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 relative my-auto">
            
            <div className="flex justify-between items-center p-6 border-b border-line">
              <h2 className="text-xl font-black text-ink">Éditer un Devis / Facture pro</h2>
              <button onClick={() => setIsModalOpen(false)} title="Fermer" className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition">
                 <X size={16} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-1.5">Nom du Client / Entreprise *</label>
                  <input type="text" title="Client name" placeholder="Nom du Client" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F7A60]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-1.5">Email du Client</label>
                  <input type="email" title="Client email" placeholder="Email du Client" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F7A60]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-3">Articles & Prestations</label>
                <div className="space-y-3">
                   {items.map((it, idx) => (
                      <div key={idx} className="flex flex-wrap gap-2 items-end bg-slate-50 p-3 rounded-xl border border-line relative">
                         <div className="flex-1 min-w-[200px]">
                            <span className="text-[10px] uppercase text-dust font-bold mb-1 block">Désignation</span>
                            <input title="Désignation" placeholder="Désignation" type="text" value={it.name} onChange={e => { const newItems = [...items]; newItems[idx].name = e.target.value; setItems(newItems) }} className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none bg-white"/>
                         </div>
                         <div className="w-20">
                            <span className="text-[10px] uppercase text-dust font-bold mb-1 block">Qté</span>
                            <input title="Quantité" placeholder="1" type="number" min="1" value={it.quantity} onChange={e => { const newItems = [...items]; newItems[idx].quantity = Number(e.target.value); setItems(newItems) }} className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none bg-white text-center"/>
                         </div>
                         <div className="w-32">
                            <span className="text-[10px] uppercase text-dust font-bold mb-1 block">PU (XOF)</span>
                            <input title="Prix Unitaire" placeholder="1000" type="number" min="0" value={it.unit_price} onChange={e => { const newItems = [...items]; newItems[idx].unit_price = Number(e.target.value); setItems(newItems) }} className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none bg-white"/>
                         </div>
                         {items.length > 1 && (
                            <button onClick={() => handleRemoveItem(idx)} title="Retirer" className="pb-2 text-red-500 hover:text-red-700">
                               <MinusCircle size={20} />
                            </button>
                         )}
                      </div>
                   ))}
                </div>
                <button onClick={handleAddItem} title="Ajouter option" className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0F7A60] bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">
                   <PlusCircle size={14} /> Ajouter une ligne
                </button>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex justify-between items-center">
                 <span className="text-sm font-black text-amber-900">Total Devis (XOF)</span>
                 <span className="text-2xl font-black text-amber-600">{calcTotal().toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <div className="p-6 border-t border-line bg-[#FAFAF7] flex justify-end">
               <button 
                  onClick={handleCreate}
                  disabled={isSubmitting || !clientName.trim() || calcTotal() <= 0}
                  className="bg-ink hover:bg-slate-800 text-white font-black px-6 py-3 rounded-xl disabled:opacity-50 transition active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> Enregistrer Brouillon</>}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
