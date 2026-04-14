'use client'

import React, { useState } from 'react'
import { Check, Loader2, Star, Trash2, Plus, MessageSquare } from 'lucide-react'
import { toggleSmartReviewsAction, createManualReviewAction, deleteReviewAction } from './actions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Review {
  id: string
  buyer_name: string
  rating: number
  comment: string | null
  verified: boolean | null
  created_at: Date | null
  product_id: string | null
}

interface Product {
  id: string
  name: string
}

interface Props {
  isActive: boolean
  reviews: Review[]
  products: Product[]
}

export default function SmartReviewsControls({ isActive, reviews, products }: Props) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    buyer_name: '',
    rating: 5,
    comment: '',
    product_id: ''
  })

  // Statistiques calculées
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  const count5Stars = reviews.filter(r => r.rating === 5).length

  const handleToggle = async () => {
    setLoading(true)
    const newActive = !active
    setActive(newActive)
    await toggleSmartReviewsAction(newActive)
    setLoading(false)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.buyer_name || !form.comment) return

    setAdding(true)
    await createManualReviewAction({
      buyer_name: form.buyer_name,
      rating: form.rating,
      comment: form.comment,
      product_id: form.product_id || undefined
    })
    setForm({ buyer_name: '', rating: 5, comment: '', product_id: '' })
    setShowAddForm(false)
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Supprimer cet avis ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) return
    setDeletingId(id)
    await deleteReviewAction(id)
    setDeletingId(null)
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      
      {/* HEADER / TOGGLE */}
      <div className="bg-gradient-to-br from-amber-50 to-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-amber-50 shrink-0">
              <Star size={32} className="text-amber-500 drop-shadow-sm fill-amber-500" />
           </div>
           <div>
              <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
                Avis 5 Étoiles Automatisés
              </h2>
              <p className="text-sm font-medium text-amber-900/80 mt-1 max-w-lg leading-relaxed">
                Affichez de la preuve sociale certifiée sur vos pages de vente. Boostez le taux de conversion jusqu'à <span className="font-bold">+35%</span>.
              </p>
           </div>
        </div>

        <div className="relative z-10 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div>
             <div className="text-sm font-black text-gray-800">Module Global</div>
             <div className="text-xs font-medium text-gray-500">{active ? "En ligne sur la vitrine" : "Désactivé"}</div>
           </div>
           <button 
             onClick={handleToggle}
             disabled={loading}
             className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-opacity-75 ${active ? 'bg-amber-500' : 'bg-gray-200'}`}
           >
             <span className="sr-only">Use setting</span>
             <span aria-hidden="true" className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-6' : 'translate-x-0'}`} />
           </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
               <Star size={24} className="text-amber-500 fill-amber-500" />
            </div>
            <div>
               <p className="text-xs uppercase font-black text-gray-400 tracking-wider">Note Moyenne</p>
               <h3 className="text-3xl font-black text-gray-900 leading-none mt-1">{avgRating} <span className="text-lg text-gray-400">/ 5</span></h3>
            </div>
         </div>
         <div className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
               <MessageSquare size={24} className="text-emerald-500" />
            </div>
            <div>
               <p className="text-xs uppercase font-black text-gray-400 tracking-wider">Total Avis</p>
               <h3 className="text-3xl font-black text-gray-900 leading-none mt-1">{reviews.length}</h3>
            </div>
         </div>
         <div className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
               <Check size={24} className="text-indigo-500" />
            </div>
            <div>
               <p className="text-xs uppercase font-black text-gray-400 tracking-wider">Avis 5 Étoiles</p>
               <h3 className="text-3xl font-black text-gray-900 leading-none mt-1">{count5Stars}</h3>
            </div>
         </div>
      </div>

      {/* REVIEWS MANAGER SECTION */}
      <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Base d'Avis Clients</h3>
              <p className="text-sm font-medium text-gray-500">Gérez, ajoutez ou supprimez les retours clients affichés publiquement.</p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-sm"
            >
              {showAddForm ? 'Fermer' : <><Plus size={16} /> Ajouter un Avis (Bootstrapper)</>}
            </button>
         </div>

         {/* ADD FORM */}
         {showAddForm && (
           <div className="p-6 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top-4">
             <form onSubmit={handleAddSubmit} className="space-y-4 max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="font-black text-gray-800 flex items-center gap-2 mb-4">
                  <Star size={18} className="text-amber-500 fill-amber-500" /> Nouvel Avis (Achat Vérifié)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Produit visé (Optionnel)</label>
                    <select 
                      value={form.product_id}
                      aria-label="Produit visé" title="Produit visé"
                      onChange={e => setForm({...form, product_id: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                       <option value="">Tous les produits</option>
                       {products.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Nom de l'acheteur</label>
                    <input 
                      type="text" required
                      value={form.buyer_name}
                      onChange={e => setForm({...form, buyer_name: e.target.value})}
                      placeholder="Ex: Amadou Fall"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase">Témoignage</label>
                   <textarea 
                     required rows={3}
                     value={form.comment}
                     onChange={e => setForm({...form, comment: e.target.value})}
                     placeholder="Ex: Livraison super rapide et produit conforme à mes attentes. Je recommande !"
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                   />
                </div>
                <div className="flex justify-end pt-2">
                   <button type="submit" disabled={adding} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md text-sm transition-all flex items-center gap-2">
                     {adding ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                     Publier l'avis
                   </button>
                </div>
             </form>
           </div>
         )}

         {/* REVIEWS LIST */}
         <div className="overflow-x-auto">
           {reviews.length === 0 ? (
             <div className="p-12 text-center text-gray-500">
               <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
               <p className="font-medium text-sm">Aucun avis enregistré pour le moment.</p>
             </div>
           ) : (
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-gray-50 text-xs font-black uppercase tracking-wider text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Acheteur</th>
                   <th className="px-6 py-4">Produit</th>
                   <th className="px-6 py-4">Avis</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {reviews.map(rev => {
                   const targetedProduct = products.find(p => p.id === rev.product_id)
                   return (
                     <tr key={rev.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{rev.buyer_name}</div>
                          {rev.verified && <div className="text-xs text-emerald-600 font-black uppercase flex items-center gap-1 mt-0.5"><Check size={10} /> Achat Vérifié</div>}
                       </td>
                       <td className="px-6 py-4 text-gray-500 font-medium">
                         {targetedProduct ? targetedProduct.name.substring(0, 25) + '...' : 'Global'}
                       </td>
                       <td className="px-6 py-4 min-w-[200px] whitespace-normal">
                          <div className="flex text-amber-500 mb-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star key={i} size={12} className={i < rev.rating ? 'fill-amber-500' : 'text-gray-300'} />
                            ))}
                          </div>
                          <p className="text-gray-600 text-[13px] leading-tight line-clamp-2">"{rev.comment}"</p>
                       </td>
                       <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                         {rev.created_at ? format(new Date(rev.created_at), 'dd MMM yyyy', { locale: fr }) : '-'}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleDelete(rev.id)}
                           disabled={deletingId === rev.id}
                           className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                         >
                           {deletingId === rev.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                         </button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           )}
         </div>
      </div>
    </div>
  )
}
