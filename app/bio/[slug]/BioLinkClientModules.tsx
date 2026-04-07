'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Loader2 } from 'lucide-react'

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
    // Si la boutique a configuré un WhatsApp, on lance Wave ou WhatsApp.
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber}?text=Salut,%20j'aimerais%20vous%20soutenir%20avec%20un%20don%20/pourboire%20!`, '_blank')
    } else {
      toast('Ce vendeur n\'a pas configuré son moyen de paiement public.')
    }
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
          className={`w-full p-6 rounded-3xl mt-8 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 ${
            theme === 'dark' ? 'bg-[#2A2A2A] text-white' : 
            theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-white' : 
            'bg-white border border-gray-100 text-gray-900'
          }`}
          style={{ animationDelay: '600ms', animationFillMode: 'both' }}
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
                style={{ backgroundColor: brandColor, color: ctaTextColor }}
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
            className={`w-full py-4 px-6 rounded-[20px] font-black text-base flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-700 ${
              theme === 'dark' ? 'bg-[#2A2A2A] border hover:bg-[#333] border-gray-700 text-blue-500' : 
              theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-blue-300' : 
              'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600 shadow-sm hover:shadow-md'
            }`}
            style={{ animationDelay: '650ms', animationFillMode: 'both' }}
          >
            {phoneText || 'Appeler Maintenant 📞'}
          </button>
        )}

        {tipActive && (
          <button 
            onClick={handleTip}
            className={`w-full py-4 px-6 rounded-[20px] font-black text-base flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-700 ${
              theme === 'dark' ? 'bg-[#2A2A2A] border hover:bg-[#333] border-gray-700 text-yellow-500' : 
              theme === 'glass' ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-yellow-300' : 
              'bg-[#FAFAF7] border hover:bg-gray-50 border-gray-200 text-yellow-600 shadow-sm hover:shadow-md'
            }`}
            style={{ animationDelay: '700ms', animationFillMode: 'both' }}
          >
            {tipText || 'Soutenir (Café ☕️)'}
          </button>
        )}
      </div>
    </>
  )
}

export function TrackedLink({ href, className, style, children, slug }: any) {
  return (
    <a 
      href={href || '#'} 
      className={className}
      style={style}
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
