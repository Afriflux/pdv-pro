'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Send, Store, GraduationCap, PartyPopper, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UserActionMenuProps {
  user: any
  detailLink: string
}

export default function UserActionMenu({ user, detailLink }: UserActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingType, setLoadingType] = useState<string | null>(null)

  const handleTrigger = async (type: string, label: string) => {
    if (!user.email) {
      toast.error('Cet utilisateur n\'a pas d\'adresse e-mail.')
      return
    }

    setLoadingType(type)
    setIsOpen(false)

    try {
      const response = await fetch('/api/admin/email/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          email: user.email,
          contextData: {
            storeName: user.name || 'Votre Boutique',
            vendorName: user.name || 'Vendeur',
            productName: 'Nouveau Produit',
            amount: 15000
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur API')
      }

      toast.success(`E-mail "${label}" envoyé avec succès à ${user.name}`)
    } catch (error) {
      console.error(error)
      toast.error('Échec de l\'envoi.')
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        {detailLink !== '#' && (
          <Link
            href={detailLink}
            className="text-xs font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all inline-block"
          >
            Voir espace →
          </Link>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          title="Actions rapides Email"
        >
          {loadingType ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
            <div className="px-4 py-3">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">E-mails Automatisés</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => handleTrigger('WELCOME', 'Bienvenue')}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <PartyPopper className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" aria-hidden="true" />
                Bienvenue
              </button>
              <button
                onClick={() => handleTrigger('FIRST_SALE', 'Première Vente')}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Send className="mr-3 h-4 w-4 text-gray-400 group-hover:text-emerald-500" aria-hidden="true" />
                1ère Vente
              </button>
              <button
                onClick={() => handleTrigger('EMPTY_STORE', 'Boutique Vide')}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
              >
                <Store className="mr-3 h-4 w-4 text-gray-400 group-hover:text-orange-500" aria-hidden="true" />
                Boutique Vide
              </button>
              <button
                onClick={() => handleTrigger('MASTERCLASS_REMINDER', 'Masterclass')}
                className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <GraduationCap className="mr-3 h-4 w-4 text-gray-400 group-hover:text-purple-500" aria-hidden="true" />
                Rappel Masterclass
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
