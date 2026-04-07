'use client'

import { useState, useEffect } from 'react'
import { Plus, Link as LinkIcon, Trash2, Copy, CheckCircle2, ChevronLeft, CreditCard, Activity, Coins } from 'lucide-react'
import Link from 'next/link'
import { getPaymentLinksAction, createPaymentLinkAction, togglePaymentLinkAction, deletePaymentLinkAction } from './actions'

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    setLoading(true)
    const res = await getPaymentLinksAction()
    if (res.success && res.links) {
      setLinks(res.links)
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return
    
    setIsSubmitting(true)
    const res = await createPaymentLinkAction({
      title,
      amount: parseFloat(amount),
      description
    })
    
    if (res.success) {
      setIsCreating(false)
      setTitle('')
      setAmount('')
      setDescription('')
      loadLinks()
    } else {
      alert(res.error || "Une erreur est survenue")
    }
    setIsSubmitting(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    setLinks(links.map(l => l.id === id ? { ...l, is_active: !current } : l))
    await togglePaymentLinkAction(id, !current)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce lien de paiement ?')) return
    setLinks(links.filter(l => l.id !== id))
    await deletePaymentLinkAction(id)
  }

  const handleCopy = (id: string) => {
    const url = `${window.location.origin}/pay-link/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
            <CreditCard className="text-[#0F7A60]" size={32} />
            Demandes de Paiement
          </h1>
          <p className="text-gray-500 font-medium mt-1">Créez des liens de paiement rapides sans affiliation ni closing.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 bg-[#0F7A60] hover:bg-[#0F7A60]/90 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#0F7A60]/20"
        >
          <Plus size={20} />
          Nouveau Lien
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-line shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0F7A60]"></div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ink">Générer un lien</h2>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500 transition-colors">Fermer</button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate">Titre de la demande</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Acompte Site Web, Consultation..."
                  className="w-full bg-[#FAFAF7] border-2 border-line rounded-xl px-4 py-3 text-ink font-medium focus:border-[#0F7A60] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate">Montant (FCFA)</label>
                <input 
                  type="number"
                  required
                  min="100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full bg-[#FAFAF7] border-2 border-line rounded-xl px-4 py-3 text-ink font-medium focus:border-[#0F7A60] outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate">Description (Optionnel)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Détails visibles par le client..."
                rows={2}
                className="w-full bg-[#FAFAF7] border-2 border-line rounded-xl px-4 py-3 text-ink font-medium focus:border-[#0F7A60] outline-none resize-none"
              />
            </div>

            <button
              disabled={isSubmitting}
              className="w-full md:w-auto bg-ink hover:bg-ink/90 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Génération...' : 'Créer le lien'}
            </button>
          </form>
        </div>
      )}

      {/* Liste des liens */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Activity className="animate-spin text-[#0F7A60]" size={32} />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 bg-[#FAFAF7] border-2 border-line border-dashed rounded-3xl">
             <LinkIcon size={48} className="text-gray-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-ink mb-2">Aucun lien de paiement</h3>
             <p className="text-gray-500 font-medium max-w-md mx-auto">Créez votre premier lien de paiement direct pour encaisser vos clients rapidement sans passer par la création d'un produit complet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map(link => (
              <div key={link.id} className={`bg-white rounded-3xl p-6 border-2 transition-all ${link.is_active ? 'border-line hover:border-[#0F7A60]/30 shadow-sm' : 'border-gray-100 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-ink text-lg truncate pr-4">{link.title}</h3>
                    <p className="text-2xl font-black text-[#0F7A60] mt-1">{link.amount.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggle(link.id, link.is_active)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${link.is_active ? 'bg-[#0F7A60]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${link.is_active ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
                
                {link.description && (
                  <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">{link.description}</p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-line">
                  <button
                    onClick={() => handleCopy(link.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FAFAF7] hover:bg-gray-100 text-ink font-bold py-2.5 rounded-xl transition-colors"
                  >
                    {copiedId === link.id ? (
                      <><CheckCircle2 size={18} className="text-[#0F7A60]" /> Copié</>
                    ) : (
                      <><Copy size={18} /> Copier le lien</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
