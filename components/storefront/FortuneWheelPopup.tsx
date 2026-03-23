'use client'

import { useState, useEffect } from 'react'
import { Gift, X, CheckCircle, Ticket } from 'lucide-react'

export function FortuneWheelPopup({
  storeId,
  active,
  config
}: {
  storeId: string
  active: boolean
  config: any
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const prizeCode = config?.prize_code

  useEffect(() => {
    if (!active || !prizeCode) return

    const played = localStorage.getItem(`fortune_wheel_${storeId}`)
    if (played) return

    // Show popup after 8 seconds of engagement
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 8000)

    return () => clearTimeout(timer)
  }, [active, prizeCode, storeId])

  const handleSpin = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 8) {
      setError('Numéro WhatsApp invalide.')
      return
    }
    setError('')
    setIsSpinning(true)

    // Simulate wheel spin animation
    setTimeout(() => {
      setIsSpinning(false)
      setHasWon(true)
      localStorage.setItem(`fortune_wheel_${storeId}`, 'true')
      // NOTE: In a real app, we would send the phone number to an API here.
    }, 3000)
  }

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem(`fortune_wheel_${storeId}`, 'skipped')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-[32px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/50 rounded-full transition-colors text-ink backdrop-blur"
        >
          <X size={16} />
        </button>

        {/* Header - Gamified */}
        <div className="bg-pink-500 pt-10 pb-16 px-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10 flex flex-col items-center">
            {hasWon ? (
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4 border border-white/30 animate-bounce">
                <CheckCircle size={40} className="text-white" />
              </div>
            ) : (
              <div className={`w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4 transition-transform border-[4px] border-white shadow-xl ${isSpinning ? 'animate-spin' : ''}`}>
                <Gift size={40} className="text-white" />
              </div>
            )}

            <h2 className="text-2xl font-black mb-1">
              {hasWon ? 'Félicitations ! 🎉' : 'Tournez & Gagnez !'}
            </h2>
            <p className="text-white/80 text-sm font-medium px-4">
              {hasWon ? 'Voici votre code cadeau exclusif.' : 'Tentez de remporter un coupon de réduction exclusif sur votre commande.'}
            </p>
          </div>
          
          {/* Curve Divider */}
          <div className="absolute -bottom-8 left-0 right-0 h-16 bg-white" style={{ borderRadius: '50% 50% 0 0' }} />
        </div>

        {/* Content Body */}
        <div className="px-8 pb-8 pt-4 text-center">
          {hasWon ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 text-center transform scale-110 shadow-sm relative">
                <p className="text-xs font-black text-pink-400 uppercase tracking-widest mb-2">Code Promo</p>
                <p className="text-3xl font-black text-pink-600 tracking-wider flex items-center justify-center gap-2">
                  <Ticket className="w-6 h-6" /> {prizeCode}
                </p>
              </div>
              <p className="text-xs text-gray-500 font-medium">Appliquez ce code lors de la commande.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition shadow-lg"
              >
                Super, merci !
              </button>
            </div>
          ) : (
            <form onSubmit={handleSpin} className="space-y-4">
              {error && <p className="text-sm text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
              
              <div className="text-left space-y-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Numéro WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">📱</span>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: +221 77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSpinning}
                    className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl p-3.5 pl-12 text-ink font-bold outline-none focus:border-pink-500 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSpinning || !phone}
                className={`w-full py-4 text-white font-black rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 ${isSpinning ? 'bg-pink-400' : 'bg-pink-500 hover:bg-pink-600 hover:scale-[1.02] shadow-pink-500/20'}`}
              >
                {isSpinning ? 'Ça tourne... 🎡' : 'Tenter ma chance !'}
              </button>
              
              <p className="text-[10px] text-gray-400">En participant, vous acceptez d'être contacté sur WhatsApp pour la livraison.</p>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
