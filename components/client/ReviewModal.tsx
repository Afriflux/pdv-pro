'use client'

import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { submitReview } from '@/app/client/orders/actions'

interface ReviewModalProps {
  orderId: string
  storeId: string
  productId?: string
  buyerName: string
  existingReview?: { rating: number }
}

export function ReviewModal({ orderId, storeId, productId, buyerName, existingReview }: ReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (existingReview) {
    return (
      <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200" title="Votre avis vérifié">
        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        <span className="text-xs font-black text-amber-700">{existingReview.rating}.0</span>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('orderId', orderId)
    formData.append('storeId', storeId)
    if (productId) formData.append('productId', productId)
    formData.append('rating', rating.toString())
    formData.append('comment', comment)
    formData.append('buyerName', buyerName)

    const res = await submitReview(formData)
    setIsSubmitting(false)
    if (res?.error) {
      alert(res.error)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-11 h-11 sm:w-auto sm:px-4 sm:h-11 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-sm hover:shadow-lg hover:shadow-amber-500/20"
        title="Laisser un avis"
      >
        <Star size={18} className="sm:hidden" />
        <span className="hidden sm:inline">Évaluer</span>
        <Star size={16} className="hidden sm:inline" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white text-center mb-1">Votre avis compte</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              Faites savoir au vendeur et à la communauté ce que vous pensez de cet achat.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
              
              {/* Étoiles Interactives */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    title={`Noter ${star} sur 5`}
                    aria-label={`Noter ${star} sur 5`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                  >
                    <Star 
                      className={`w-10 h-10 transition-colors ${
                        (hoveredRating !== null ? star <= hoveredRating : star <= rating) 
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]' 
                          : 'text-white/20 fill-white/10'
                      }`} 
                    />
                  </button>
                ))}
              </div>

              {/* Commentaire Optionnel */}
              <div className="w-full relative mb-8 group">
                <div className="absolute left-4 top-4 text-white/40 group-focus-within:text-amber-400 transition-colors">
                  <MessageSquare size={18} />
                </div>
                <textarea
                  placeholder="Partagez votre expérience (optionnel)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-4 pl-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none min-h-[100px] transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm border border-white/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-[#1A1A1A] text-center font-black rounded-xl transition-all text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? 'Envoi...' : 'Publier mon avis'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
