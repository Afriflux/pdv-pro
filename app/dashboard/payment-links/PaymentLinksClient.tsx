'use client'

import React, { useState } from 'react'
import { Link as LinkIcon, Plus, Copy, Trash, ExternalLink, Filter, Loader2, CheckCircle2, Banknote, X } from 'lucide-react'
import { createPaymentLinkAction, togglePaymentLinkAction, deletePaymentLinkAction } from './actions'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import Link from 'next/link'

interface PLink {
  id: string
  title: string
  description: string | null
  amount: number
  currency: string
  is_active: boolean
  created_at: string
}

export default function PaymentLinksClient({ storeId, storeSlug, links: initialLinks }: { storeId: string, storeSlug: string, links: PLink[] }) {
  const [links, setLinks] = useState<PLink[]>(initialLinks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!title.trim() || !amount) {
      toast.error('Veuillez renseigner le titre et le montant.')
      return
    }
    setIsSubmitting(true)
    const res = await createPaymentLinkAction(storeId, {
      title,
      description,
      amount: Number(amount),
      currency: 'XOF'
    })

    if (res.success) {
      toast.success('Lien de paiement créé !')
      setLinks([{
        id: res.linkId!,
        title,
        description,
        amount: Number(amount),
        currency: 'XOF',
        is_active: true,
        created_at: new Date().toISOString()
      }, ...links])
      setIsModalOpen(false)
      setTitle('')
      setDescription('')
      setAmount('')
    } else {
      toast.error(res.error)
    }
    setIsSubmitting(false)
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    setLinks(links.map(l => l.id === id ? { ...l, is_active: !currentActive } : l))
    await togglePaymentLinkAction(id, storeId, !currentActive)
  }

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({ title: 'Confirmation', text: 'Voulez-vous vraiment supprimer ce lien ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler' })
    if (!res.isConfirmed) return
    setLinks(links.filter(l => l.id !== id))
    await deletePaymentLinkAction(id, storeId)
  }

  const copyToClipboard = (id: string) => {
    // Generate public URL format (we'll assume a /pay/[id] dynamic router configures the checkout)
    const url = `${window.location.origin}/pay/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Lien copié dans le presse-papier !')
  }

  return (
    <div className="space-y-6 font-sans pb-32">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-gradient-to-br from-[#0F7A60] to-emerald-800 text-white rounded-2xl shadow-lg">
                <Banknote size={26} />
             </div>
             <h1 className="text-3xl font-display font-black text-ink tracking-tight">Liens de Paiement</h1>
          </div>
          <p className="text-dust font-medium text-sm mt-1 max-w-xl">
             Encaissez vos prestations personnalisées sans créer de page produit. Idéal pour le SAV, les extensions de garantie ou le freelancing.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-ink hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Nouveau Lien</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-3xl shadow-xl shadow-slate-200/20 flex flex-col relative overflow-hidden">
             <p className="text-xs font-black text-dust uppercase tracking-widest mb-1">Liens Actifs</p>
             <p className="text-3xl font-display font-black text-ink">{links.filter(l => l.is_active).length}</p>
             <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100" size={50} />
         </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {links.length === 0 ? (
           <div className="text-center py-16 bg-white/50 rounded-3xl border border-line border-dashed flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Banknote size={32} />
             </div>
             <p className="text-ink font-black text-lg">Aucun lien de paiement</p>
             <p className="text-slate text-sm max-w-sm mt-2">Créez votre premier lien de paiement rapide pour commencer à encaisser.</p>
             <button onClick={() => setIsModalOpen(true)} className="mt-4 px-5 py-2.5 bg-white border border-line rounded-xl text-sm font-bold shadow-sm hover:border-slate-300 transition">Créer un lien</button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {links.map(link => (
               <div key={link.id} className="bg-white border border-line rounded-3xl p-5 shadow-sm hover:shadow-md transition relative group flex flex-col">
                 
                 <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl ${link.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                       <Banknote size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         title="Activer/Désactiver"
                         onClick={() => handleToggle(link.id, link.is_active)}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F7A60] focus:ring-offset-2 ${link.is_active ? 'bg-[#0F7A60]' : 'bg-slate-200'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${link.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                    </div>
                 </div>

                 <h3 className="text-lg font-black text-ink truncate mb-1">{link.title}</h3>
                 <p className="text-2xl font-black text-[#0F7A60] mb-4">{link.amount.toLocaleString('fr-FR')} {link.currency}</p>
                 
                 <p className="text-xs text-dust line-clamp-2 min-h-[32px] mb-4">
                   {link.description || "Aucune description fournie."}
                 </p>

                 <div className="mt-auto border-t border-line pt-4 flex items-center justify-between">
                    <button 
                      title="Copier le lien"
                      onClick={() => copyToClipboard(link.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-ink transition"
                    >
                      <Copy size={14} /> <span>Copier le lien</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <a href={`/pay/${link.id}`} title="Voir le lien" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition bg-slate-50 rounded-lg hover:bg-blue-50">
                        <ExternalLink size={16} />
                      </a>
                      <button onClick={() => handleDelete(link.id)} title="Supprimer" className="p-2 text-slate-400 hover:text-red-600 transition bg-slate-50 rounded-lg hover:bg-red-50">
                        <Trash size={16} />
                      </button>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 relative p-6">
            
            <button onClick={() => setIsModalOpen(false)} title="Fermer" className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition">
              <X size={16} />
            </button>
            
            <h2 className="text-xl font-black text-ink mb-2">Nouveau Lien de Paiement</h2>
            <p className="text-sm text-slate mb-6">Demandez facilement un paiement spécifique à votre client.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-1.5">Titre ou Motif</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Ex: Facture Coaching Mars" 
                  className="w-full border border-line rounded-xl px-4 py-3 text-sm focus:border-[#0F7A60] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-1.5">Montant ({'XOF'})</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(Number(e.target.value))} 
                    placeholder="25000" 
                    className="w-full border border-line rounded-xl pl-4 pr-16 py-3 text-sm focus:border-[#0F7A60] outline-none font-black text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">XOF</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dust uppercase tracking-wider mb-1.5">Description (Falcultatif)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Détails de la prestation..." 
                  className="w-full border border-line rounded-xl px-4 py-3 text-sm min-h-[80px] focus:border-[#0F7A60] outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleCreate}
                  disabled={isSubmitting || !title.trim() || !amount}
                  className="w-full bg-[#0F7A60] hover:bg-emerald-700 text-white font-black py-4 rounded-xl disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> Créer le lien</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
