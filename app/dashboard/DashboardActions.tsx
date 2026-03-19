'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'

// Props : slug: string, storeName: string
// Bouton 1 : Copier lien → navigator.clipboard.writeText(url) + toast "Lien copié !"
// Bouton 2 : WhatsApp → window.open(`https://wa.me/?text=...`)
// Style : même apparence que les 2 autres boutons d'action

export function CopyLinkQuickAction({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://pdvpro.com/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col items-center gap-2 hover:border-[#0F7A60] transition group text-[#1A1A1A] w-full"
    >
      <div className="relative">
        <Copy size={24} className={`transition-all duration-300 text-gray-400 group-hover:scale-110 ${copied ? 'opacity-0 scale-50' : 'opacity-100'}`} />
        <Check size={24} className={`absolute inset-0 text-[#0F7A60] transition-all duration-300 ${copied ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>
      <span className="text-xs font-bold text-center">
        {copied ? 'Copié !' : 'Copier le lien'}
      </span>
    </button>
  )
}

export function WhatsAppQuickAction({ slug }: { slug: string }) {
  const handleShare = () => {
    const text = encodeURIComponent(`Découvrez mon catalogue en ligne : https://pdvpro.com/${slug}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <button
      onClick={handleShare}
      className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col items-center gap-2 hover:border-[#25D366] transition group text-[#1A1A1A] w-full"
    >
      <MessageCircle size={24} className="text-gray-400 group-hover:scale-110 group-hover:text-[#25D366] transition duration-300" />
      <span className="text-xs font-bold text-center">Partager WhatsApp</span>
    </button>
  )
}
