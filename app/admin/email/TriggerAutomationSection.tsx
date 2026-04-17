'use client'

import { useState } from 'react'
import { Send, Store, GraduationCap, PartyPopper, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AutomationButtonProps {
  type: string
  label: string
  icon: any
  description: string
  color: string
}

export default function TriggerAutomationSection() {
  const [loadingType, setLoadingType] = useState<string | null>(null)
  
  // Remplacer par l'email de l'admin pour le test. En prod, l'admin peut taper son email.
  const adminTestEmail = 'test@yayyam.com' 

  const automations: AutomationButtonProps[] = [
    {
      type: 'WELCOME',
      label: 'Bienvenue',
      icon: PartyPopper,
      description: 'L\'email envoyé juste après la création d\'une boutique.',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
    },
    {
      type: 'FIRST_SALE',
      label: 'Première Vente',
      icon: Send,
      description: 'Félicitations pour la toute première vente sur Yayyam.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
    },
    {
      type: 'EMPTY_STORE',
      label: 'Boutique Vide',
      icon: Store,
      description: 'Relance pour un vendeur inactif sans produits.',
      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
    },
    {
      type: 'MASTERCLASS_REMINDER',
      label: 'Masterclass',
      icon: GraduationCap,
      description: 'Invitation / Relance pour suivre la masterclass Yayyam.',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
    }
  ]

  const handleTestTrigger = async (type: string, label: string) => {
    setLoadingType(type)
    
    // eslint-disable-next-line no-alert
    const customEmail = window.prompt(`À quelle adresse voulez-vous tester l'e-mail ${label} ?`, adminTestEmail)
    if (!customEmail) {
      setLoadingType(null)
      return
    }

    try {
      const response = await fetch('/api/admin/email/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          email: customEmail,
          contextData: {
            storeName: 'Ma Super Boutique',
            productName: 'Chaussures Premium',
            amount: 25000,
            vendorName: 'Jean Vendeur'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors du déclenchement.')
      }

      toast.success(`E-mail de test "${label}" envoyé à ${customEmail}`)
    } catch (error: any) {
      console.error(error)
      toast.error('Échec de l\'envoi.')
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/60 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Automatisations & Transactionnel</h2>
          <p className="text-sm text-gray-500 mt-1">Testez les modèles d'e-mails envoyés automatiquement par le système, directement sur votre adresse personnelle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {automations.map((auto) => {
          const Icon = auto.icon
          const isLoading = loadingType === auto.type

          return (
            <div key={auto.type} className={`border rounded-2xl p-5 flex flex-col items-start gap-3 transition-colors ${auto.color.replace(/hover:[^ ]+/g, '')} hover:border-gray-300 bg-white`}>
              <div className={`p-2.5 rounded-xl ${auto.color} bg-opacity-50`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{auto.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{auto.description}</p>
              </div>
              <button 
                onClick={() => handleTestTrigger(auto.type, auto.label)}
                disabled={isLoading}
                className={`mt-auto w-full py-2 px-4 rounded-xl text-xs font-black shadow-sm transition-all border outline-none
                  ${isLoading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : auto.color} 
                `}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Tester l\'e-mail'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
