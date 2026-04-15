'use client'

import { toast } from 'sonner';

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LifeBuoy, X, Check, Loader2, Send } from 'lucide-react'

// Note: To submit securely to Prisma from a client component, we should call a Server Action
// Since the seller isn't logged in, we need a public action. 
import { submitTicketAction } from '@/app/dashboard/helpdesk/actions'

interface Props {
  storeId: string
  accentColor: string
}

export function HelpdeskWidget({ storeId, accentColor }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    order_id: '',
    subject: '',
    message: ''
  })

  // Couleurs dynamiques
  const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `${r}, ${g}, ${b}`;
  }
  const accentRgb = hexToRgb(accentColor)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.subject || !form.message) return

    setLoading(true)
    const res = await submitTicketAction({
      store_id: storeId,
      ...form
    })
    
    if (res.success) {
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setForm({ customer_name: '', customer_email: '', customer_phone: '', order_id: '', subject: '', message: '' })
      }, 3000)
    } else {
       toast.error("Erreur lors de l'envoi de la demande.")
    }
    setLoading(false)
  }

  return (
    <div {...{ style: { "--accent": accentColor, "--accent-rgb": accentRgb } as React.CSSProperties }}>
      <button onClick={() => setIsOpen(true)} aria-label="Aide" title="Aide"
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[80] w-14 h-14 rounded-full text-white shadow-[0_10px_25px_rgba(var(--accent-rgb),0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all bg-[var(--accent)]"
      >
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity rounded-full"></div>
        <LifeBuoy size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center sm:items-center sm:justify-end sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 0.9 }} 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-[400px] bg-white h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[32px] shadow-2xl overflow-y-auto flex flex-col"
            >
               {/* Header Section */}
               <div className="p-6 text-white shrink-0 relative overflow-hidden rounded-t-[32px] bg-[var(--accent)]">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl mix-blend-overlay"></div>
                 <button onClick={() => setIsOpen(false)} aria-label="Fermer" title="Fermer" className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full transition-colors backdrop-blur-sm">
                   <X size={16} />
                 </button>
                 <LifeBuoy size={32} className="mb-3 opacity-90" />
                 <h3 className="text-xl font-black">Besoin d'aide ?</h3>
                 <p className="text-sm opacity-90 font-medium leading-tight mt-1">
                   Une question ou un souci avec une commande ? Notre équipe vous répondra très vite.
                 </p>
               </div>

               {/* Form Section */}
               <div className="p-6 flex-1 bg-gray-50/50">
                 {success ? (
                   <div className="h-full flex flex-col items-center justify-center text-center py-10">
                     <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-4">
                       <Check size={32} strokeWidth={3} />
                     </div>
                     <h4 className="text-xl font-black text-gray-900">Demande Envoyée !</h4>
                     <p className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">
                       Notre service client a bien reçu votre ticket. Nous vous contacterons dans les plus brefs délais.
                     </p>
                   </div>
                 ) : (
                   <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase font-black text-gray-500 mb-1.5 ml-1 tracking-wider">Nom Complet <span className="text-red-400">*</span></label>
                          <input required type="text" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]" placeholder="Ex: Awa Diop" />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-black text-gray-500 mb-1.5 ml-1 tracking-wider">N° Commande</label>
                          <input type="text" value={form.order_id} onChange={e => setForm({...form, order_id: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]" placeholder="Optionnel" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs uppercase font-black text-gray-500 mb-1.5 ml-1 tracking-wider">Tél / WhatsApp <span className="text-red-400">*</span></label>
                        <input required type="tel" value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]" placeholder="+221 ..." />
                     </div>
                     <div>
                        <label className="block text-xs uppercase font-black text-gray-500 mb-1.5 ml-1 tracking-wider">Sujet <span className="text-red-400">*</span></label>
                        <select required aria-label="Sujet" title="Sujet" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-shadow cursor-pointer focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]">
                          <option value="">Sélectionnez un sujet</option>
                          <option value="Suivi de Commande">Suivi de Commande</option>
                          <option value="Problème Livraison">Problème à la livraison</option>
                          <option value="Retours / Remboursement">Retours & Remboursements</option>
                          <option value="Question Produit">Information Produit</option>
                          <option value="Autre">Autre Demande</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs uppercase font-black text-gray-500 mb-1.5 ml-1 tracking-wider">Message <span className="text-red-400">*</span></label>
                        <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-shadow resize-none focus:ring-2 focus:ring-[var(--accent)] border-[var(--accent)]" placeholder="Expliquez-nous votre problème en détails..."></textarea>
                     </div>

                     <button type="submit" disabled={loading} className="w-full mt-2 py-3.5 rounded-xl font-black text-sm text-white shadow-[0_8px_20px_rgba(var(--accent-rgb),0.3)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all bg-[var(--accent)]">
                       {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Envoyer la demande</>}
                     </button>
                   </form>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
