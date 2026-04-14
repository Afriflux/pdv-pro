'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X, Sparkles, Store, Package, Truck, Wallet, Settings, Newspaper } from 'lucide-react'

interface GettingStartedProps {
  hasProducts: boolean
  hasZones: boolean
  hasPromotions: boolean
  hasDeliveries?: boolean
  hasWallet?: boolean
  hasSettings?: boolean
}

export function GettingStartedChecklist({ 
  hasProducts, 
  hasZones, 
  hasPromotions, 
  hasDeliveries = false, 
  hasWallet = false, 
  hasSettings = false 
}: GettingStartedProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // On ignore storeSlug si non utilisé au final, ou on pourrait s'en servir plus tard.

  useEffect(() => {
    const hidden = localStorage.getItem('hide_getting_started')
    if (!hidden) setIsVisible(true)
  }, [])

  const hideGuide = () => {
    localStorage.setItem('hide_getting_started', 'true')
    setIsVisible(false)
  }

  const steps = [
    {
      id: 1,
      label: 'Créer un premier produit',
      desc: 'Ajoutez des photos, prix et description',
      done: hasProducts,
      href: '/dashboard/products/new',
      icon: <Package size={18} />
    },
    {
      id: 2,
      label: 'Configurer les livraisons',
      desc: 'Définissez vos prix par zone (ex: Dakar 2000F)',
      done: hasZones,
      href: '/dashboard/zones',
      icon: <Store size={18} />
    },
    {
      id: 3,
      label: 'Lancer une promotion',
      desc: 'Ventes flash ou codes promo (BOGO)',
      done: hasPromotions,
      href: '/dashboard/promotions',
      icon: <Sparkles size={18} />
    },
    {
      id: 4,
      label: 'Flotte & Livraisons',
      desc: 'Ajoutez et assignez vos livreurs',
      done: hasDeliveries,
      href: '/dashboard/livraisons',
      icon: <Truck size={18} />
    },
    {
      id: 5,
      label: 'Portefeuille & Retraits',
      desc: 'Connectez vos comptes pour être payé',
      done: hasWallet,
      href: '/dashboard/wallet',
      icon: <Wallet size={18} />
    },
    {
      id: 6,
      label: 'Paramètres Boutique',
      desc: 'Pixels, Branding, Modes de paiement',
      done: hasSettings,
      href: '/dashboard/settings',
      icon: <Settings size={18} />
    },
    {
      id: 7,
      label: 'Explorer les Nouveautés',
      desc: 'Conseils, IA, et nouvelles fonctionnalités',
      done: false,
      href: '/dashboard/tips',
      icon: <Newspaper size={18} />
    }
  ]

  const totalSteps = steps.length
  const completedSteps = steps.filter(s => s.done).length
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => setAnimatedProgress(progressPercent), 300)
    }
  }, [isVisible, progressPercent])

  if (!isVisible) return null

  // SVGs properties for Circular Progress
  const strokeWidth = 8
  const baseSize = 70 // reduced from 100 for compactness
  const radius = (baseSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  return (
    <div className="bg-white/70 backdrop-blur-3xl border border-white max-w-7xl mx-auto rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 lg:mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700 relative">
      <div 
        className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-ink hover:bg-gray-100 p-2 rounded-full transition-all z-20" 
        onClick={hideGuide} 
        title="Masquer définitivement"
      >
        <X size={20} />
      </div>

      <div className="p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-8">
        
        {/* Left Side: Progress & Intro */}
        <div className="flex flex-row lg:flex-col items-center lg:items-start lg:w-1/3 shrink-0 gap-4 lg:gap-0">
          <div className="relative flex items-center justify-center shrink-0">
            {/* Apple Fitness style circular progress */}
            <svg width={baseSize} height={baseSize} className="-rotate-90 drop-shadow-sm">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C9A84C" />
                  <stop offset="100%" stopColor="#E2C167" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle
                cx={baseSize / 2} cy={baseSize / 2} r={radius}
                stroke="#f3f4f6" strokeWidth={strokeWidth}
                fill="none"
              />
              <circle
                cx={baseSize / 2} cy={baseSize / 2} r={radius}
                stroke="url(#goldGradient)" strokeWidth={strokeWidth} strokeLinecap="round"
                fill="none"
                className="checklist-progress-ring"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-ink">{animatedProgress}%</span>
            </div>
          </div>
          
          <div className="flex-1 lg:mt-6">
            <h2 className="text-lg lg:text-3xl font-black text-ink mb-1 lg:mb-3 text-left tracking-tight">Checklist de<br className="hidden lg:block"/> Succès 🚀</h2>
            <p className="text-gray-500 text-xs lg:text-sm font-medium text-left leading-relaxed">
              Complétez ces étapes pour lancer votre business et encaisser vos paiements.
            </p>
          </div>
        </div>

        {/* Right Side: Steps Grid / Carousel */}
        <div className="flex-1 flex overflow-x-auto lg:grid lg:grid-cols-2 gap-3 lg:gap-5 pb-2 snap-x snap-mandatory hide-scrollbar">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`relative overflow-hidden border rounded-2xl transition-all duration-300 group snap-start shrink-0 w-[240px] sm:w-[280px] lg:w-auto
                ${step.done 
                  ? 'border-gray-200 bg-gray-50/50' 
                  : 'border-gray-100 bg-white hover:border-[#C9A84C]/40 hover:shadow-[0_4px_20px_rgb(201,168,76,0.1)]'
                }
              `}
            >
              {/* Optional background glow on hover */}
              {!step.done && <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}

              {step.href ? (
                <Link href={step.href} className="relative z-10 p-5 flex items-start gap-4 h-full">
                  <div className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center shadow-sm transition-colors border
                    ${step.done ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-gray-400 group-hover:border-[#C9A84C] group-hover:text-[#C9A84C]'}
                  `}>
                    {step.done ? <Check size={12} strokeWidth={4} /> : step.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={`text-sm font-bold truncate ${step.done ? 'text-gray-400 line-through' : 'text-ink group-hover:text-[#1A1A1A]'}`}>
                      {step.label}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${step.done ? 'text-gray-400 opacity-50' : 'text-gray-500'}`}>
                      {step.desc}
                    </p>
                  </div>

                  {!step.done && (
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:translate-x-1 group-hover:bg-[#C9A84C]/10 group-hover:text-[#C9A84C] transition-all">
                       <ChevronRight size={16} />
                     </div>
                  )}
                </Link>
              ) : (
                <div className="relative z-10 p-5 flex items-start gap-4 h-full">
                  <div className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center shadow-sm transition-colors border
                    ${step.done ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-gray-400'}
                  `}>
                    {step.done ? <Check size={12} strokeWidth={4} /> : step.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold truncate ${step.done ? 'text-gray-400 line-through' : 'text-ink'}`}>
                      {step.label}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${step.done ? 'text-gray-400 opacity-50' : 'text-gray-500'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
