'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

interface GettingStartedProps {
  hasProducts: boolean
  isPersonalized: boolean
  storeSlug: string
}

export function GettingStartedChecklist({ hasProducts, isPersonalized, storeSlug }: GettingStartedProps) {
  const [isVisible, setIsVisible] = useState(false)
  const fullLink = `https://pdvpro.com/${storeSlug}`

  useEffect(() => {
    // Vérifier si le guide n'a pas été masqué
    const hidden = localStorage.getItem('hide_getting_started')
    if (!hidden) setIsVisible(true)
  }, [])

  const hideGuide = () => {
    localStorage.setItem('hide_getting_started', 'true')
    setIsVisible(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(fullLink)
    toast.success('Lien de la boutique copié !')
  }

  if (!isVisible) return null

  const steps = [
    {
      label: 'Ajoutez votre premier produit',
      done: hasProducts,
      href: '/dashboard/products/new'
    },
    {
      label: 'Personnalisez votre boutique',
      done: isPersonalized,
      href: '/dashboard/settings'
    },
    {
      label: 'Partagez votre lien de boutique',
      done: false, // Pas traçable purement
      action: copyLink,
      extraUI: <button className="ml-auto bg-gray-100 px-3 py-1 rounded text-xs font-bold text-gray-500 hover:bg-emerald hover:text-white transition">Copier lien</button>
    },
    {
      label: 'Configurez vos zones de livraison',
      done: false, // On suppose false pour cet encart initial
      href: '/dashboard/zones'
    }
  ]

  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100)

  return (
    <div className="bg-white border text-left border-line rounded-3xl shadow-sm mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 relative">
      <div className="absolute top-4 right-4 cursor-pointer text-slate hover:text-ink transition" onClick={hideGuide} title="Masquer définitivement">
        <X size={20} />
      </div>

      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-display font-black text-ink mb-2">Bienvenue sur PDV Pro ! 👋</h2>
        <p className="text-slate text-sm mb-6 max-w-2xl">Voici les étapes essentielles pour réussir votre lancement et générer vos premières ventes.</p>

        {/* ProgressBar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-3 bg-cream rounded-full overflow-hidden border border-line">
            <div className="h-full bg-emerald rounded-full transition-all duration-1000" style={{ width: progress + '%' }}></div>
          </div>
          <span className="text-xs font-bold text-gray-400">{progress}% complété</span>
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex border border-line rounded-2xl overflow-hidden hover:border-emerald/30 transition-all bg-cream/50 group">
              <div className="w-12 flex items-center justify-center shrink-0 border-r border-line/50 bg-white">
                 {step.done ? <CheckCircle2 className="text-emerald" size={24} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>}
              </div>
              
              {step.href ? (
                <Link href={step.href} className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-white transition-colors">
                  <span className={`font-bold text-sm ${step.done ? 'text-gray-400 line-through' : 'text-ink'}`}>{step.label}</span>
                  <ChevronRight size={18} className="text-dust group-hover:text-emerald group-hover:translate-x-1 transition-all" />
                </Link>
              ) : (
                <div onClick={step.action} className="flex-1 px-4 py-3 flex items-center cursor-pointer hover:bg-white transition-colors">
                  <span className="font-bold text-sm text-ink">{step.label}</span>
                  {step.extraUI}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
