'use client'

import { useState } from 'react'
import { Copy, MessageCircle, Share2 } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function SocialKit({ storeName, storeUrl }: { storeName: string, storeUrl: string }) {
  const templates = [
    { id: 'promo', label: '🔥 Promo Flash', text: `⚡ PROMO FLASH — 24H SEULEMENT !\n\n🔥 -20% sur toute la boutique ${storeName}\n🛒 Stocks limités — Ne ratez pas ça !\n\n👉 Profitez-en : ${storeUrl}\n\n#PromoFlash #BonsPlans` },
    { id: 'new', label: '🚀 Nouveau', text: `🚀 NOUVEAU CHEZ ${storeName.toUpperCase()} !\n\n✨ Découvrez notre toute nouvelle collection !\n🎁 Qualité premium, prix imbattable\n\n👉 Commandez maintenant : ${storeUrl}\n\n#Nouveauté #Shopping` },
    { id: 'relaunch', label: '🛒 Panier', text: `🛒 Vous avez oublié quelque chose ?\n\nVotre commande chez ${storeName} vous attend !\nOn garde vos articles de côté 😊\n\n👉 Finalisez vite : ${storeUrl}` },
  ]
  
  const [activeTab, setActiveTab] = useState(templates[0])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeTab.text)
    toast.success("Texte copié avec succès !")
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Share2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A]">Modèles Prêts-à-poster</h2>
          <p className="text-sm text-gray-500">Copiez et collez sur vos réseaux sociaux.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {templates.map(t => (
          <button
             key={t.id}
             onClick={() => setActiveTab(t)}
             className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab.id === t.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#FAFAF7] text-gray-500 hover:text-[#1A1A1A]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative group flex-1 flex flex-col">
        <textarea
          readOnly
          value={activeTab.text}
          className="w-full flex-1 min-h-[160px] bg-[#FAFAF7] border border-gray-200 rounded-2xl p-5 text-sm font-medium text-[#1A1A1A] resize-none outline-none focus:border-blue-300 transition-colors cursor-text"
        />
        
        <div className="grid grid-cols-2 gap-3 mt-4">
           <button 
             onClick={handleCopy}
             className="flex items-center justify-center gap-2 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] rounded-xl font-black text-sm transition-colors"
           >
             <Copy size={16} /> Copier
           </button>
           <a 
             suppressHydrationWarning
             href={`https://wa.me/?text=${encodeURIComponent(activeTab.text)}`}
             target="_blank" rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-xl font-black text-sm transition-colors shadow-sm"
           >
             <MessageCircle size={16} /> WhatsApp
           </a>
        </div>
      </div>
    </div>
  )
}
