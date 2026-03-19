/* eslint-disable react/forbid-dom-props */
'use client'

import { useState, useEffect } from 'react'
import { Copy, Plus, Sparkles, Star, ShoppingCart, MessageCircle, Instagram, Facebook, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface SocialKitProps {
  storeName: string
  storeUrl:  string
}

type TemplateId = 'nouveau_produit' | 'promo_flash' | 'temoignage' | 'relance_panier'
type PlatformId = 'whatsapp' | 'instagram' | 'tiktok' | 'facebook'

const TEMPLATES = [
  {
    id: 'nouveau_produit' as TemplateId,
    emoji: '🚀',
    label: 'Nouveau produit',
    color: 'emerald',
    icon: Plus,
    text: (storeName: string, storeUrl: string) => 
`🚀 NOUVEAU CHEZ ${storeName.toUpperCase()} !

✨ Découvrez notre toute nouvelle collection !
🎁 Qualité premium, prix imbattable
📦 Livraison rapide disponible

👉 Commandez maintenant : ${storeUrl}

#NouveauProduit #${storeName.replace(/\s/g,'')} #Shopping`
  },
  {
    id: 'promo_flash' as TemplateId,
    emoji: '⚡',
    label: 'Promo flash',
    color: 'amber',
    icon: Sparkles,
    text: (storeName: string, storeUrl: string) =>
`⚡ PROMO FLASH — 24H SEULEMENT !

🔥 -20% sur toute la boutique ${storeName}
⏰ Offre valable aujourd'hui uniquement !
🛒 Stocks limités — Ne ratez pas ça !

👉 Profitez-en : ${storeUrl}

#PromoFlash #Soldes #BonPlan`
  },
  {
    id: 'temoignage' as TemplateId,
    emoji: '⭐',
    label: 'Témoignage',
    color: 'gold',
    icon: Star,
    text: (storeName: string, storeUrl: string) =>
`⭐⭐⭐⭐⭐ AVIS CLIENT

"J'adore mes achats chez ${storeName} !
Livraison rapide, produits conformes,
service client au top. Je recommande 100% !"

— Client satisfait ✅

Rejoignez nos clients heureux 👉 ${storeUrl}`
  },
  {
    id: 'relance_panier' as TemplateId,
    emoji: '🛒',
    label: 'Relance panier',
    color: 'blue',
    icon: ShoppingCart,
    text: (storeName: string, storeUrl: string) =>
`🛒 Vous avez oublié quelque chose ?

Votre panier chez ${storeName} vous attend !
On garde vos articles de côté 😊

⚠️ Stock limité — commandez avant rupture !

👉 Finalisez votre commande : ${storeUrl}`
  },
]

const PLATFORMS = [
  { id: 'whatsapp' as PlatformId,  label: 'WhatsApp',  limit: 0,     color: '#25D366', icon: MessageCircle },
  { id: 'instagram' as PlatformId, label: 'Instagram', limit: 2200,  color: '#E1306C', icon: Instagram },
  { id: 'tiktok' as PlatformId,    label: 'TikTok',    limit: 150,   color: '#010101', icon: Share2 },
  { id: 'facebook' as PlatformId,  label: 'Facebook',  limit: 63206, color: '#1877F2', icon: Facebook },
]

export default function SocialKit({ storeName, storeUrl }: SocialKitProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('nouveau_produit')
  const [activePlatform, setActivePlatform] = useState<PlatformId>('instagram')
  const [content, setContent]               = useState('')

  // Mettre à jour le texte quand le template change
  useEffect(() => {
    const template = TEMPLATES.find(t => t.id === activeTemplate)
    if (template) {
      setContent(template.text(storeName, storeUrl))
    }
  }, [activeTemplate, storeName, storeUrl])

  const platform = PLATFORMS.find(p => p.id === activePlatform)!
  const charCount = content.length
  const isOverLimit = platform.limit > 0 && charCount > platform.limit

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Texte copié dans le presse-papier !")
    } catch {
      toast.error("Erreur lors de la copie.")
    }
  }

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(content)}`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full">
      
      {/* ── HEADER ── */}
      <div className="p-6 md:p-8 border-b border-gray-100">
        <h3 className="text-lg font-display font-black text-[#1A1A1A]">📱 Kit Réseaux Sociaux</h3>
        <p className="text-xs text-gray-400 mt-1">Générez des posts optimisés en un clic</p>

        {/* ── PLATFORMS TABS ── */}
        <div className="flex flex-wrap gap-2 mt-6">
          {PLATFORMS.map(p => {
            const isActive = activePlatform === p.id
            const Icon = p.icon
            return (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive 
                    ? 'border-transparent shadow-sm' 
                    : 'bg-[#FAFAF7] border-gray-100 text-gray-500 hover:border-gray-200 hover:text-[#1A1A1A]'
                }`}
                style={isActive ? { backgroundColor: p.color, color: 'white' } : {}}
              >
                <Icon size={14} /> {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
        
        {/* ── TEMPLATES MENU (Col Gauche) ── */}
        <div className="md:col-span-4 bg-[#FAFAF7] p-4 md:p-6 border-r border-gray-100 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Modèles</p>
          {TEMPLATES.map(t => {
            const isActive = activeTemplate === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
                  isActive
                    ? 'bg-white shadow-sm border border-gray-100'
                    : 'border border-transparent text-gray-500 hover:text-[#1A1A1A] hover:bg-gray-50'
                }`}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                <span className={`text-sm font-bold ${isActive ? 'text-[#1A1A1A]' : ''}`}>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── EDITOR (Col Droite) ── */}
        <div className="md:col-span-8 p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Personnaliser votre {platform.label}
            </label>
            
            {/* Compteur de caractères */}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              isOverLimit 
                ? 'bg-red-50 text-red-500' 
                : charCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400'
            }`}>
              {charCount} {platform.limit > 0 && `/ ${platform.limit}`}
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full flex-1 min-h-[200px] bg-[#FAFAF7] border rounded-2xl p-5 text-sm font-medium text-[#1A1A1A] resize-none focus:outline-none focus:ring-4 transition-all ${
              isOverLimit 
                ? 'border-red-300 focus:ring-red-100' 
                : 'border-gray-200 focus:border-[#0F7A60] focus:ring-[#0F7A60]/10'
            }`}
            placeholder="Écrivez votre post ici..."
          />

          {isOverLimit && (
            <p className="text-[10px] font-bold text-red-500 mt-2">
              ⚠️ Attention : Votre texte dépasse la limite autorisée sur {platform.label}.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none bg-[#1A1A1A] hover:bg-gray-800 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md shadow-black/5"
            >
              <Copy size={16} /> Copier le texte
            </button>

            {activePlatform === 'whatsapp' && (
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 flex-1 md:flex-none text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md hover:brightness-110"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={16} /> Partager WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
