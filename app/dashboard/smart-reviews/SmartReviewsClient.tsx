'use client'

import { useState } from 'react'
import { MessageCircle, Power, Settings2, Star, ThumbsUp } from 'lucide-react'
import { toast } from '@/lib/toast'

export function SmartReviewsClient({ 
  initialActive, 
  recentReviews,
  onToggle
}: { 
  initialActive: boolean
  recentReviews: any[]
  onToggle: (v: boolean) => Promise<void>
}) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      await onToggle(!active)
      setActive(!active)
      toast.success(active ? 'Récolte automatique désactivée.' : 'Récolte automatique activée !')
    } catch (e: any) {
      toast.error('Erreur lors du changement de statut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Form */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">

        {/* Global Toggle */}
        <div className="bg-white border text-sm border-gray-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
           <div>
             <h3 className="font-black text-lg text-[#1A1A1A]">Le Bot "Avis 5 Étoiles"</h3>
             <p className="text-gray-500 font-medium text-sm mt-1">Demande automatiquement l'avis de vos clients VIP via WhatsApp, 48h après livraison.</p>
           </div>
           <button 
             onClick={handleToggle}
             disabled={loading}
             className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
               active 
                ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
             }`}
           >
             {active ? <><Power size={18} /> Désactiver</> : <><Power size={18} /> Activer le Bot</>}
           </button>
        </div>

        {/* Configurations View */}
        <div className={`bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6 transition-all ${!active ? 'opacity-50 pointer-events-none' : ''}`}>
           <h3 className="text-lg font-black text-[#1A1A1A] border-b border-gray-100 pb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-500"/> Scénario WhatsApp
           </h3>

           <div className="p-4 bg-[#FAFAF7] rounded-2xl border border-gray-200 relative">
             <p className="text-[13px] font-bold text-gray-800 leading-relaxed">
               Bonjour {'{client}'} ! 👋<br/><br/>
               J'espère que vous appréciez votre commande de {'{produit}'}. Votre avis compte énormément pour nous !<br/><br/>
               Prenez 10 secondes pour nous laisser un avis en répondant simplement avec une note de 1 à 5 étoiles sur ce lien : {'{lien_avis}'}
             </p>
             <div className="absolute top-4 right-4 bg-gray-200 text-gray-500 text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md">Template Standard</div>
           </div>
           <p className="text-xs font-medium text-gray-500">Le Bot enverra ce message via notre intégration WhatsApp officielle, 48h après que la commande soit marquée comme "Livrée".</p>
        </div>

        {/* Derniers avis */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
           <h3 className="text-lg font-black text-[#1A1A1A] border-b border-gray-100 pb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-emerald-500"/> Derniers Avis Récoltés
           </h3>
           <div className="space-y-4">
             {recentReviews.length === 0 ? (
               <div className="p-6 text-center text-gray-400 font-medium">Aucun avis récolté pour le moment. Activez le Bot pour commencer !</div>
             ) : (
               recentReviews.map((review, idx) => (
                 <div key={review.id || idx} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                     <span className="font-bold text-[#1A1A1A]">{review.buyer_name}</span>
                     <span className="text-xs text-gray-400 font-medium">{new Date(review.created_at).toLocaleDateString()}</span>
                   </div>
                   <div className="flex gap-1">
                     {[...Array(5)].map((_, i) => (
                       <Star key={i} size={14} className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                     ))}
                   </div>
                   {review.comment && <p className="text-[13px] text-gray-600 italic mt-1">"{review.comment}"</p>}
                 </div>
               ))
             )}
           </div>
        </div>
      </div>

      {/* Simulator Right Column */}
      <div className="w-full lg:w-[40%] flex flex-col">
         <div className="sticky top-6">
            <h3 className="font-black text-lg text-[#1A1A1A] mb-4 flex items-center gap-2"><Settings2 size={20} className="text-gray-400"/> Aperçu Client</h3>
            
            <div className="h-[auto] border-4 border-[url('/iphone-frame.png')] border-solid bg-[#FAFAF7] rounded-[3rem] p-6 shadow-2xl pb-10">
               <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                 <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                 <div>
                   <p className="font-bold text-[14px]">Boutique Officielle</p>
                   <p className="text-[11px] text-emerald-600 font-medium">Compte Professionnel (Via l'API)</p>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 max-w-[85%]">
                   <p className="text-[13px] text-gray-800">
                     Bonjour Awa ! 👋<br/><br/>
                     J'espère que vous appréciez votre commande de Robe. Votre avis compte énormément pour nous !
                   </p>
                 </div>
                 
                 <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 max-w-[85%] flex flex-col gap-2">
                   <p className="text-[13px] text-gray-800">Cliquez ici pour noter votre expérience :</p>
                   <div className="w-full h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center text-amber-600 font-bold text-xs gap-1">
                      <Star fill="currentColor" size={12}/>
                      <Star fill="currentColor" size={12}/>
                      <Star fill="currentColor" size={12}/>
                      <Star fill="currentColor" size={12}/>
                      <Star fill="currentColor" size={12}/>
                   </div>
                 </div>

                 <div className="flex justify-end pt-4">
                   <div className="bg-emerald-100 text-emerald-900 p-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                     <p className="text-[13px]">C'est fait ! La qualité est vraiment incroyable ❤️</p>
                     <p className="text-[9px] text-right mt-1 opacity-60 font-bold">14:02 ✓✓</p>
                   </div>
                 </div>
               </div>
            </div>
            
            <p className="text-xs text-center text-gray-400 font-medium mt-6">Aperçu de l'expérience conversationnelle du client.</p>
         </div>
      </div>
    </div>
  )
}
