'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppFloatProps {
  phone: string
  storeName: string
}

export default function WhatsAppFloat({ phone, storeName }: WhatsAppFloatProps) {
  if (!phone) return null

  // Nettoyage de base du numéro
  const cleanPhone = phone.replace(/\+/g, '').replace(/\s+/g, '')
  const defaultMessage = `Bonjour ${storeName}, je suis intéressé par vos articles sur PDV Pro.`

  return (
    <a
      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-300 z-50 group hover:-translate-y-1"
      aria-label="Contacter sur WhatsApp"
    >
      {/* Anneau de "pulse" en arrière-plan */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" />
      
      {/* Icône WhatsApp locale (via Lucide) */}
      <MessageCircle size={32} className="relative z-10 fill-current ml-0.5 mb-0.5" />
      
      {/* Tooltip au survol */}
      <span className="absolute right-full mr-4 bg-white text-ink px-4 py-2 rounded-2xl text-xs font-black shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-100 italic pointer-events-none">
        Besoin d&apos;aide ?
      </span>
    </a>
  )
}
