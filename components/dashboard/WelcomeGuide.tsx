'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Link as LinkIcon, DollarSign, X } from 'lucide-react'

export default function WelcomeGuide() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('pdvpro_welcome_seen')
    if (!hasSeen) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('pdvpro_welcome_seen', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-black text-[#1A1A1A]">Bienvenue sur PDV Pro ! 🎉</h2>
            <button 
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fermer le guide"
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-500 mb-8">
            Félicitations pour la création de votre boutique ! Voici 3 étapes rapides pour bien démarrer :
          </p>

          <div className="space-y-6 mb-8">
            {/* Etape 1 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#0F7A60]/10 text-[#0F7A60] rounded-2xl flex items-center justify-center shrink-0">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-1">Étape 1 : Ajoutez votre premier produit</h3>
                <p className="text-sm text-gray-500 mb-2">Créez votre première fiche produit en quelques clics.</p>
                <Link 
                  href="/dashboard/products/new" 
                  onClick={handleClose}
                  className="text-xs font-bold text-[#0F7A60] hover:underline"
                >
                  Ajouter un produit →
                </Link>
              </div>
            </div>

            {/* Etape 2 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                <LinkIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-1">Étape 2 : Partagez votre lien</h3>
                <p className="text-sm text-gray-500 mb-2">Envoyez le lien de votre boutique ou produit sur WhatsApp.</p>
                <Link 
                  href="/dashboard/marketing" 
                  onClick={handleClose}
                  className="text-xs font-bold text-amber-500 hover:underline"
                >
                  Outils marketing →
                </Link>
              </div>
            </div>

            {/* Etape 3 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A1A] mb-1">Étape 3 : Vos premières ventes !</h3>
                <p className="text-sm text-gray-500">Attendez que vos clients passent commande et encaissez vos revenus.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="w-full bg-[#0F7A60] hover:bg-[#0D6B53] text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-[#0F7A60]/20 transform active:scale-[0.98]"
          >
            C&apos;est parti !
          </button>
        </div>
      </div>
    </div>
  )
}
