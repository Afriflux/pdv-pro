'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Settings, Share2, Send, BarChart3, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: Package,
    color: 'bg-[#0F7A60]/10 text-[#0F7A60]',
    title: 'Ajoutez votre premier produit',
    description: 'Photos, prix, description — c\'est la base de votre boutique. Les clients ne peuvent acheter que ce qui est publié.',
    cta: { label: 'Créer un produit', href: '/dashboard/products/new' },
  },
  {
    icon: Settings,
    color: 'bg-amber-500/10 text-amber-500',
    title: 'Personnalisez votre boutique',
    description: 'Logo, couleurs, bannière, description — donnez confiance dès le premier regard. Une boutique soignée vend 3x plus.',
    cta: { label: 'Mes paramètres', href: '/dashboard/settings' },
  },
  {
    icon: Send,
    color: 'bg-blue-500/10 text-blue-500',
    title: 'Liez un groupe Telegram',
    description: 'Vous vendez des formations ou du coaching ? Liez un groupe Telegram privé — vos clients y accèdent automatiquement après achat.',
    cta: { label: 'Configurer Telegram', href: '/dashboard/telegram' },
  },
  {
    icon: Share2,
    color: 'bg-pink-500/10 text-pink-500',
    title: 'Partagez votre lien',
    description: 'Copiez votre lien de boutique et partagez-le sur WhatsApp, Instagram, TikTok. Chaque vue est un client potentiel.',
    cta: { label: 'Outils marketing', href: '/dashboard/marketing' },
  },
  {
    icon: BarChart3,
    color: 'bg-purple-500/10 text-purple-500',
    title: 'Suivez vos ventes',
    description: 'Tableau de bord en temps réel, analytics, et insights IA pour optimiser votre boutique chaque semaine.',
    cta: { label: 'Mes analytics', href: '/dashboard/analytics' },
  },
]

export default function WelcomeGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeen = localStorage.getItem('yayyampro_welcome_seen')
    if (!hasSeen) setIsOpen(true)
  }, [])

  const handleClose = () => {
    localStorage.setItem('yayyampro_welcome_seen', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A]">
                {currentStep === 0 ? 'Bienvenue sur Yayyam !' : step.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Étape {currentStep + 1} sur {STEPS.length}
              </p>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fermer le guide"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= currentStep ? 'bg-[#0F7A60]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <Icon size={28} />
            </div>
            <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
              {step.description}
            </p>
          </div>

          {/* CTA */}
          <Link
            href={step.cta.href}
            onClick={handleClose}
            className="block w-full bg-[#0F7A60] hover:bg-[#0D6B53] text-white font-bold py-4 rounded-xl text-center transition-all shadow-md shadow-[#0F7A60]/20 mb-4"
          >
            {step.cta.label} →
          </Link>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Précédent
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1 text-sm text-[#0F7A60] font-bold hover:underline"
              >
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex items-center gap-1 text-sm text-[#0F7A60] font-bold hover:underline"
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
