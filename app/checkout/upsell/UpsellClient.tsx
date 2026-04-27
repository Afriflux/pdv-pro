'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Truck, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface UpsellClientProps {
  baseOrderId: string
  product: any
  discountedPrice: number
  originalPrice: number
  amountSaved: number
}

export default function UpsellClient({ baseOrderId, product, discountedPrice, originalPrice, amountSaved }: UpsellClientProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handleAccept = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/checkout/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_order_id: baseOrderId,
          upsell_product_id: product.id,
          price: discountedPrice
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur inconnue')
      }
      
      router.push(`/checkout/success?order=${baseOrderId}&cod=true`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleDecline = () => {
    router.push(`/checkout/success?order=${baseOrderId}&cod=true`)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-4 border-emerald-500 overflow-hidden relative"
    >
      {/* ── TIMER RIBBON ── */}
      <div className="bg-emerald-600 text-white py-3 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-bold text-center">
        <span className="uppercase tracking-widest text-sm">Offre Expire Dans :</span>
        <div className="flex gap-2 text-2xl font-mono tracking-wider">
          <span className="bg-black/20 px-2 py-1 rounded">{minutes.toString().padStart(2, '0')}</span>
          <span>:</span>
          <span className="bg-black/20 px-2 py-1 rounded">{seconds.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* ── IMAGE SECTION ── */}
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500 rounded-3xl rotate-3 scale-105 transition-transform group-hover:rotate-6 opacity-20 blur-xl"></div>
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white group-hover:scale-105 transition-transform duration-500">
            {product.images && product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                <span className="text-4xl">📦</span>
              </div>
            )}
            
            {/* Badge Promo */}
            <div className="absolute top-4 right-4 bg-red-600 text-white font-black px-4 py-2 rounded-full rotate-12 shadow-xl border-2 border-white text-xl">
              -{Math.round(100 - (discountedPrice/originalPrice*100))}%
            </div>
          </div>
        </div>

        {/* ── DETAILS & ACTIONS ── */}
        <div className="flex flex-col h-full justify-center">
          <div className="mb-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h2>
            <div className="w-16 h-1.5 bg-emerald-500 rounded-full"></div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {product.description || "Ne laissez pas passer cette offre exclusive réservée à nos meilleurs clients juste après leur achat."}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 p-8 pt-0 bg-yellow-100/50 blur-3xl rounded-full"></div>
             <p className="text-gray-500 font-medium line-through decoration-red-500/50 decoration-2 mb-1">
               Prix Public: {originalPrice.toLocaleString('fr-FR')} FCFA
             </p>
             <p className="text-4xl font-black text-gray-900">
               {discountedPrice.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span>
             </p>
             <p className="text-emerald-600 font-bold text-sm mt-2">
               Vous économisez {amountSaved.toLocaleString('fr-FR')} FCFA aujourd'hui !
             </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
             <button 
               onClick={handleAccept}
               disabled={loading || timeLeft <= 0}
               className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[0_8px_0_0_#047857] hover:shadow-[0_4px_0_0_#047857] hover:translate-y-1 transition-all text-white py-5 px-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:shadow-none active:translate-y-2 uppercase tracking-wide group"
             >
               {loading ? 'Ajout en cours...' : (
                 <>
                   OUI, J'AJOUTE À MA COMMANDE !
                   <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                 </>
               )}
             </button>

             <button
               onClick={handleDecline}
               disabled={loading}
               className="w-full py-4 text-gray-400 font-medium text-sm hover:text-gray-600 underline decoration-gray-300 hover:decoration-gray-500 transition-colors flex items-center justify-center gap-2"
             >
               Non merci, je refuse cette offre unique au risque de payer plein pot plus tard.
             </button>
          </div>
          
          <div className="mt-8 flex justify-between px-2 text-xs text-gray-400 font-medium">
             <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500"/> Garantie 30j</div>
             <div className="flex items-center gap-1.5"><Truck size={14} className="text-emerald-500"/> Expédition Inclus</div>
             <div className="flex items-center gap-1.5"><Lock size={14} className="text-emerald-500"/> 100% Sécurisé</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
