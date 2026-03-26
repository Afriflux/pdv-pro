// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Mail, Clock, CheckCircle2, Send, MessageCircle, AlertCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function EmailMarketing({ store }: { store: any }) {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Brevo state
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // WhatsApp state
  const [waNumber, setWaNumber] = useState(store?.whatsapp || '')
  const [waActive, setWaActive] = useState(store?.whatsapp_abandoned_cart || false)
  const [savingWa, setSavingWa] = useState(false)

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/brevo/campaign')
      const data = await res.json()
      if (res.ok) setCampaigns(data.campaigns || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/brevo/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent, listId: 2 })
      })
      if (res.ok) {
        toast.success("Campagne créée !")
        setShowForm(false)
        setSubject('')
        setHtmlContent('')
        loadCampaigns()
      } else throw new Error("Erreur")
    } catch {
      toast.error("Erreur de création.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveWhatsApp = async () => {
    setSavingWa(true)
    try {
      const res = await fetch('/api/marketing/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storeId: store.id,
          whatsapp: waNumber,
          whatsappAbandonedCart: waActive
        })
      })
      if (res.ok) {
        toast.success("Configuration WhatsApp sauvegardée !")
      } else {
         const data = await res.json()
         throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde.")
    } finally {
      setSavingWa(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER EMAILS */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] p-8 rounded-3xl text-white shadow-xl relative flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
             <Mail className="w-8 h-8 opacity-80" /> Automatisations Email
          </h2>
          <p className="text-gray-400 text-sm font-medium max-w-md leading-relaxed">
            Communiquez avec vos clients par email. Configurez des newsletters manuelles ou l'email de bienvenue post-achat.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-[#1A1A1A] px-6 py-3.5 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-transform shrink-0 flex items-center gap-2"
        >
          {showForm ? 'Annuler' : <><Plus size={16}/> Nouvelle Campagne</>}
        </button>
      </div>

      {/* NEW CAMPAIGN FORM */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
           <h3 className="text-lg font-black text-[#1A1A1A] mb-6 flex items-center gap-2">
             <Send size={18} className="text-[#0F7A60]" /> Créer une Newsletter
           </h3>
           <div className="space-y-4">
             <div>
               <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Sujet de l'email</label>
               <input 
                 autoFocus required
                 value={subject} onChange={e => setSubject(e.target.value)}
                 className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:border-[#0F7A60] outline-none"
               />
             </div>
             <div>
               <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Contenu Message</label>
               <textarea 
                 required rows={5}
                 value={htmlContent} onChange={e => setHtmlContent(e.target.value)}
                 placeholder="Tapez le contenu de votre email ici..."
                 className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#0F7A60] outline-none resize-none font-medium"
               />
             </div>
             <div className="pt-2">
               <button disabled={submitting} type="submit" className="w-full bg-[#0F7A60] text-white py-4 rounded-xl font-black text-sm disabled:opacity-50 hover:bg-[#0C634E] transition-colors shadow-sm">
                 {submitting ? 'Envoi en cours...' : 'Planifier la campagne'}
               </button>
             </div>
           </div>
        </form>
      )}

      {/* NEW SECTION : WHATSAPP ABANDONED CART */}
      <div className="bg-white border-2 border-[#25D366]/20 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
         <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#25D366]/5 rounded-full blur-3xl" />
         
         <div className="relative z-10 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center">
                    <MessageCircle size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-[#1A1A1A]">Relance Panier sur WhatsApp</h3>
                   <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">+98% Taux d'ouverture</p>
                 </div>
               </div>
               
               <p className="text-sm text-gray-500 font-medium leading-relaxed">
                 Activez les relances automatiques pour les clients qui ont commencé leur commande sans la finaliser. Ils recevront un rappel amical sur WhatsApp au nom de votre boutique.
               </p>

               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4 mt-6">
                 <Phone className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                 <div className="flex-1 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Numéro WhatsApp Service Client</label>
                   <input
                     value={waNumber}
                     onChange={(e) => setWaNumber(e.target.value)}
                     placeholder="Ex: 771234567"
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all"
                   />
                 </div>
               </div>

               <button
                 onClick={() => setWaActive(!waActive)}
                 className={`w-full py-4 flex items-center justify-center gap-3 rounded-xl font-black text-sm transition-all ${
                   waActive 
                   ? 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/20' 
                   : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300'
                 }`}
               >
                 {waActive ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                 {waActive ? 'Relance Automatique Activée' : 'Activer la relance Panier'}
               </button>

               <button
                 onClick={handleSaveWhatsApp}
                 disabled={savingWa || (!waNumber.trim() && waActive)}
                 className="w-full text-center text-xs font-bold text-gray-500 hover:text-[#1A1A1A] disabled:opacity-50"
               >
                 {savingWa ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
               </button>
            </div>

            {/* PREVIEW */}
            <div className="md:w-[320px] shrink-0 bg-[#EFEAE2] p-4 rounded-[32px] border-4 border-gray-100 shadow-inner relative flex flex-col h-[400px]">
               <div className="bg-[#075E54] text-white p-4 rounded-t-2xl flex items-center gap-3 absolute top-0 left-0 right-0 z-10">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">{store?.name?.charAt(0) || 'S'}</div>
                 <div>
                   <p className="text-sm font-bold">{store?.name || 'Votre Boutique'}</p>
                   <p className="text-[10px] opacity-80">Bot automatisé</p>
                 </div>
               </div>
               
               <div className="flex-1 mt-16 mt-auto flex flex-col justify-end pb-2">
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 relative">
                   Salut 👋 <br/><br/>
                   On a remarqué que tu avais laissé des articles dans ton panier chez <b>{store?.name}</b> !<br/><br/>
                   Ton stock est mis de côté, voici le lien pour finaliser ta commande avant rupture : <br/>
                   <span className="text-blue-500 underline mt-1 block">Finaliser l'achat</span>
                   <span className="text-[10px] text-gray-400 absolute bottom-1.5 right-2">Maintenant</span>
                 </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
