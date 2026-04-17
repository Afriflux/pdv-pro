'use client'

/* eslint-disable react/forbid-dom-props */

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2, Heart, X } from 'lucide-react'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'

interface BioLinkClientModulesProps {
  storeId: string
  theme: string
  brandColor: string
  ctaTextColor: string
  newsletterActive: boolean
  newsletterText?: string
  tipActive: boolean
  tipText?: string
  whatsappNumber?: string // Pour le tip si dispo
  phoneActive?: boolean
  phoneNumber?: string
  phoneText?: string
}

export function BioLinkClientModules({
  storeId,
  theme,
  brandColor,
  ctaTextColor,
  newsletterActive,
  newsletterText,
  tipActive,
  tipText,
  whatsappNumber,
  phoneActive,
  phoneNumber,
  phoneText
}: BioLinkClientModulesProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Tipping states
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)
  const [tipAmount, setTipAmount] = useState<number>(0)
  const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000]

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return

    setLoading(true)
    try {
      const res = await fetch('/api/leads/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, email })
      })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        toast.success(data.message)
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleTip = () => {
    // On ouvre le modal de don
    setTipAmount(1000) // Default
    setIsTipModalOpen(true)
  }

  const handlePhone = () => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  return (
    <>
      {newsletterActive && (
        <div 
          className={`w-full p-6 rounded-3xl mt-8 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 ![animation-delay:600ms] ![animation-fill-mode:both] ${
            theme === 'dark' ? 'bg-[#2A2A2A] text-white' : 
            theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-white' : 
            'bg-white border border-gray-100 text-gray-900'
          }`}
        >
          <h4 className="font-black text-lg mb-4">{newsletterText || 'Abonnez-vous'}</h4>
          
          {success ? (
            <div className="bg-green-500/10 text-green-500 p-4 rounded-xl font-bold flex items-center justify-center gap-2">
              Merci pour votre inscription ! 🎉
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse e-mail" 
                required
                className={`flex-1 min-w-0 rounded-xl px-4 py-3 font-medium text-sm focus:ring-2 focus:outline-none transition-all ${
                  theme === 'dark' ? 'bg-[#1A1A1A] border-none text-white focus:ring-white/20' : 
                  theme === 'glass' ? 'bg-white/20 border border-white/10 text-white placeholder-white/50 focus:ring-white/30' : 
                  'bg-[#FAFAF7] border border-gray-200 text-gray-900 focus:ring-[#0F7A60]/20'
                }`}
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                ref={el => {
                  if (el) {
                    el.style.backgroundColor = brandColor;
                    el.style.color = ctaTextColor;
                  }
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Valider'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* CTA Calls to action group */}
      <div className="w-full flex flex-col gap-3 mt-6">
        {phoneActive && phoneNumber && (
          <button 
            onClick={handlePhone}
            className={`w-full py-4 px-6 rounded-[20px] font-black text-base flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-700 ![animation-delay:650ms] ![animation-fill-mode:both] ${
              theme === 'dark' ? 'bg-[#2A2A2A] border hover:bg-[#333] border-gray-700 text-blue-500' : 
              theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-blue-300' : 
              'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600 shadow-sm hover:shadow-md'
            }`}
          >
            {phoneText || 'Appeler Maintenant 📞'}
          </button>
        )}

        {tipActive && (
          <button 
            onClick={handleTip}
            className={`w-full py-4 px-6 rounded-[20px] font-black text-base flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-700 ![animation-delay:700ms] ![animation-fill-mode:both] ${
              theme === 'dark' ? 'bg-[#2A2A2A] border hover:bg-[#333] border-gray-700 text-yellow-500' : 
              theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-yellow-300' : 
              'bg-[#FAFAF7] border hover:bg-gray-50 border-gray-200 text-yellow-600 shadow-sm hover:shadow-md'
            }`}
          >
            {tipText || 'Soutenir (Café ☕️)'}
          </button>
        )}
      </div>

      {/* Tip Modal */}
      {isTipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 pb-0 sm:pb-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTipModalOpen(false)} />
          
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300 shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                  <Heart size={20} className="fill-rose-500" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">Faire un don</h3>
                  <p className="text-xs font-bold text-gray-400">Soutenez ce vendeur</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTipModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                title="Fermer"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 ml-1">
                Choisissez le montant (FCFA)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTipAmount(amt)}
                    className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-sm font-black transition-all ${
                      tipAmount === amt 
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {amt.toLocaleString('fr-FR')}
                  </button>
                ))}
              </div>

              <div className="relative mb-8">
                <input
                  type="number"
                  min="100"
                  value={tipAmount || ''}
                  onChange={(e) => setTipAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-rose-300 focus:bg-white rounded-2xl py-4 px-5 text-xl font-black text-gray-900 outline-none transition-all placeholder:text-gray-300"
                  placeholder="Montant libre..."
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">FCFA</span>
              </div>

              {tipAmount >= 100 ? (
                <PaymentMethodSelector 
                  amount={tipAmount} 
                  storeId={storeId}
                  paymentApiEndpoint="/api/payments/tips/initiate"
                  onSuccess={(url) => {
                    window.location.href = url
                  }} 
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-sm font-bold text-gray-400">Le don minimum est de 100 FCFA</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function TrackedLink({ href, className, style, children, slug }: any) {
  return (
    <a 
      href={href || '#'} 
      className={className}
      ref={el => {
        if (el && style) {
          Object.assign(el.style, style);
        }
      }}
      onClick={() => {
        if (slug) {
          fetch(`/api/leads/click`, { method: 'POST', body: JSON.stringify({ slug }) }).catch(() => {})
        }
      }}
    >
      {children}
    </a>
  )
}
