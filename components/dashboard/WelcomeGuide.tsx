'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Settings, Share2, Send, BarChart3, ArrowRight, X, ChevronLeft, ChevronRight, Rocket, Truck, CreditCard } from 'lucide-react'

const STEPS = [
  {
    icon: Rocket,
    color: 'from-emerald-500 to-teal-500',
    title: 'Bienvenue sur Yayyam ! 🎉',
    description: 'Votre boutique en ligne est prête. En quelques étapes, vous serez opérationnel. 0 abonnement — vous ne payez que sur vos ventes.',
    cta: { label: 'C\'est parti !', href: '' },
    isIntro: true,
  },
  {
    icon: Package,
    color: 'from-blue-500 to-indigo-500',
    title: 'Ajoutez votre premier produit',
    description: 'Photos, prix, description — c\'est la base. Les clients ne peuvent acheter que ce qui est publié. Vous pouvez en ajouter autant que vous voulez.',
    cta: { label: 'Créer un produit', href: '/dashboard/products/new' },
  },
  {
    icon: Settings,
    color: 'from-amber-500 to-orange-500',
    title: 'Personnalisez votre boutique',
    description: 'Logo, couleurs de marque, bannière — donnez confiance dès le premier regard. Une boutique soignée vend 3x plus.',
    cta: { label: 'Mes paramètres', href: '/dashboard/settings' },
  },
  {
    icon: Truck,
    color: 'from-violet-500 to-purple-500',
    title: 'Configurez vos zones de livraison',
    description: 'Définissez vos zones (Dakar, Abidjan, Bamako...) avec les frais de livraison. Vos clients verront les tarifs avant d\'acheter.',
    cta: { label: 'Zones de livraison', href: '/dashboard/zones' },
  },
  {
    icon: CreditCard,
    color: 'from-pink-500 to-rose-500',
    title: 'Configurez vos retraits',
    description: 'Liez votre compte Wave, Orange Money ou autre pour recevoir vos paiements. Retraits rapides et sécurisés.',
    cta: { label: 'Configurer le retrait', href: '/dashboard/wallet' },
  },
  {
    icon: Send,
    color: 'from-cyan-500 to-blue-500',
    title: 'Liez un groupe Telegram (optionnel)',
    description: 'Vous vendez des formations ? Liez un groupe Telegram — vos clients y accèdent automatiquement après achat.',
    cta: { label: 'Configurer Telegram', href: '/dashboard/telegram' },
  },
  {
    icon: Share2,
    color: 'from-emerald-500 to-green-500',
    title: 'Partagez et vendez !',
    description: 'Copiez votre lien de boutique et partagez-le sur WhatsApp, Instagram, TikTok. Chaque vue est un client potentiel. À vous de jouer ! 💪',
    cta: { label: 'Outils marketing', href: '/dashboard/marketing' },
  },
]

export default function WelcomeGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeen = localStorage.getItem('yayyam_welcome_seen')
    if (!hasSeen) setIsOpen(true)
  }, [])

  const handleClose = () => {
    localStorage.setItem('yayyam_welcome_seen', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="bg-white max-w-lg w-full rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Gradient header band */}
        <div className={`h-2 bg-gradient-to-r ${step.color}`} />
        
        <div className="p-8">
          {/* Header — skip bien visible */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">
                {currentStep + 1} / {STEPS.length}
              </p>
              <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                {step.title}
              </h2>
            </div>
            <button 
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors font-bold"
              aria-label="Passer le guide"
            >
              Passer <X size={14} />
            </button>
          </div>

          {/* Progress bar segmented */}
          <div className="flex gap-1 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < currentStep ? 'bg-[#0F7A60]' : i === currentStep ? `bg-gradient-to-r ${step.color}` : 'bg-gray-100'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg text-white`}>
              <Icon size={32} strokeWidth={2} />
            </div>
            <p className="text-gray-500 leading-relaxed max-w-sm mx-auto text-[15px]">
              {step.description}
            </p>
          </div>

          {/* CTA */}
          {step.cta.href ? (
            <Link
              href={step.cta.href}
              onClick={handleClose}
              className={`block w-full bg-gradient-to-r ${step.color} text-white font-black py-4 rounded-xl text-center transition-all shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] mb-4`}
            >
              {step.cta.label} →
            </Link>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-full bg-gradient-to-r ${step.color} text-white font-black py-4 rounded-xl text-center transition-all shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] mb-4`}
            >
              {step.cta.label} →
            </button>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-bold"
            >
              <ChevronLeft size={16} /> Précédent
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1 text-sm text-[#0F7A60] font-black hover:underline"
              >
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex items-center gap-1 text-sm text-[#0F7A60] font-black hover:underline"
              >
                Commencer <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
