'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Package, Truck, CheckCircle2, Home, MapPin, MessageCircle, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react'

// Steps logic
const STEPS = [
  { id: 'confirmed', label: 'Confirmée', icon: CheckCircle2 },
  { id: 'processing', label: 'En préparation', icon: Package },
  { id: 'shipped', label: 'Expédiée', icon: Truck },
  { id: 'delivered', label: 'Livrée', icon: Home }
]

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialRef = searchParams?.get('ref') || ''

  const [ref, setRef] = useState(initialRef)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)

  // Auto-focus phone input if ref is already filled from URL
  useEffect(() => {
    if (initialRef && !phone) {
      document.getElementById('phone-input')?.focus()
    }
  }, [initialRef, phone])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ref.trim() || !phone.trim()) {
      setError('Veuillez renseigner votre référence et votre numéro de téléphone.')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/track?ref=${encodeURIComponent(ref.trim())}&phone=${encodeURIComponent(phone.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Commande introuvable avec ces informations.')
      }

      setOrder(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Détermine l'index de l'étape actuelle
  const getCurrentStepIndex = (status: string) => {
    if (status === 'pending' || status === 'confirmed') return 0
    if (status === 'processing') return 1
    if (status === 'shipped') return 2
    if (status === 'delivered') return 3
    return -1
  }

  const stepIndex = order ? getCurrentStepIndex(order.status) : -1

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Retours */}
        <div className="flex flex-col items-center justify-center space-y-3 relative mb-10">
          <div className="absolute left-0 top-0">
            <Link href="/" className="text-gray-400 hover:text-gray-900 font-medium text-sm transition-colors border-b border-transparent hover:border-gray-900 border-dashed pb-0.5">
              ← Retour à l'accueil
            </Link>
          </div>
          <div className="w-16 h-16 bg-[#0F7A60]/10 text-[#0F7A60] rounded-full flex items-center justify-center mx-auto mt-4 md:mt-0">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 text-center">Suivre ma commande</h1>
          <p className="text-gray-500 text-center max-w-md">
            Entrez votre référence et numéro de téléphone utilisé lors de l'achat pour voir l'état de votre livraison en temps réel.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <label htmlFor="ref-input" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Référence Commande
              </label>
              <input 
                id="ref-input"
                type="text" 
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Ex: 550e8400..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/20 font-mono text-sm outline-none transition-all"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="phone-input" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Téléphone (Acheteur)
              </label>
              <input 
                id="phone-input"
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numéro utilisé pour la commande"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/20 outline-none transition-all font-medium"
                required
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={loading || !ref.trim() || !phone.trim()}
                className="w-full md:w-auto px-8 py-3 bg-[#0F7A60] hover:bg-[#0D5C4A] text-white font-black rounded-xl shadow-lg shadow-[#0F7A60]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[50px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Suivre</>}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-5 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Order Details & Stepper */}
        {order && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Order Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Détails de la commande</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-mono font-black text-gray-900">#{order.id.split('-')[0].toUpperCase()}</p>
                  {order.status === 'cancelled' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                      Annulée
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                  Placée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Stepper Amazon-style */}
            {order.status !== 'cancelled' && (
              <div className="p-6 md:p-10 border-b border-gray-100 overflow-x-auto">
                <div className="min-w-[600px] max-w-2xl mx-auto pl-4 pr-4">
                  <div className="relative flex justify-between items-center">
                    {/* Background Line */}
                    <div className="absolute top-5 left-4 right-4 h-1.5 bg-gray-100 rounded-full" />
                    
                    {/* Progress Line */}
                    <div 
                      className="absolute top-5 left-4 h-1.5 bg-[#0F7A60] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `calc(${stepIndex >= 0 ? (stepIndex / (STEPS.length - 1)) * 100 : 0}% - 16px)` }}
                    />
                    
                    {/* Steps */}
                    {STEPS.map((step, idx) => {
                      const Icon = step.icon
                      const isPast = idx < stepIndex
                      const isCurrent = idx === stepIndex
                      
                      return (
                        <div key={step.id} className="relative flex flex-col items-center w-24">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[4px] border-white shadow-sm z-10 transition-all duration-500
                            ${isPast ? 'bg-[#0F7A60] text-white' : isCurrent ? 'bg-white border-[#0F7A60] text-[#0F7A60] shadow-lg shadow-[#0F7A60]/20 scale-110' : 'bg-gray-100 text-gray-400'}
                          `}>
                            {isPast ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Icon size={20} strokeWidth={isCurrent ? 2.5 : 2} />}
                          </div>
                          <span className={`mt-4 text-xs font-black tracking-wide uppercase text-center 
                            ${isCurrent ? 'text-[#0F7A60]' : isPast ? 'text-gray-900' : 'text-gray-400'}
                          `}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Content Grid */}
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Left Column: Articles & Pricing */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-gray-900 font-black flex items-center gap-2 mb-4 text-lg">
                    <ShoppingBag className="w-5 h-5 text-gray-400" /> Vos articles
                  </h3>
                  {order.product ? (
                    <div className="flex gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl md:hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                        📦
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="font-bold text-gray-900 leading-snug line-clamp-2">{order.product.name}</p>
                        <p className="text-sm font-medium text-gray-500 mt-1">Qté : {order.quantity}</p>
                      </div>
                      <div className="font-black text-gray-900 flex items-center">
                        {(order.product.price * order.quantity).toLocaleString('fr-FR')} F
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Article indisponible</p>
                  )}
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border border-gray-100">
                  <div className="flex justify-between text-gray-500 font-medium text-sm">
                    <span>Sous-total articles</span>
                    <span>{order.subtotal?.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium text-sm">
                    <span>Frais de livraison</span>
                    <span>{order.delivery_fee?.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between font-black text-gray-900 text-lg">
                    <span>Total payé</span>
                    <span className="text-[#0F7A60]">{order.total?.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Delivery & Vendor */}
              <div className="space-y-8">
                {order.delivery_address || order.deliveryZone ? (
                  <div>
                    <h3 className="text-gray-900 font-black flex items-center gap-2 mb-4 text-lg">
                      <MapPin className="w-5 h-5 text-gray-400" /> Livraison
                    </h3>
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm space-y-3 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                       
                       {order.deliveryZone && (
                         <div className="flex gap-3">
                           <span className="text-blue-600/70 font-bold uppercase tracking-widest w-20 shrink-0 text-xs mt-0.5">Zone</span>
                           <span className="font-bold text-gray-900">{order.deliveryZone.name}</span>
                         </div>
                       )}
                       {order.delivery_address && (
                         <div className="flex gap-3">
                           <span className="text-blue-600/70 font-bold uppercase tracking-widest w-20 shrink-0 text-xs mt-0.5">Adresse</span>
                           <span className="font-medium text-gray-700 leading-relaxed">{order.delivery_address}</span>
                         </div>
                       )}
                       {order.deliveryZone?.duration && order.status !== 'delivered' && order.status !== 'cancelled' && (
                         <div className="flex gap-3 mt-4 pt-4 border-t border-blue-200/60">
                           <span className="text-blue-600 font-black uppercase tracking-widest text-xs mt-1">Délai estimé</span>
                           <span className="font-black text-blue-900 text-base">{order.deliveryZone.duration}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ) : null}

                {order.store && (
                  <div>
                    <h3 className="text-gray-900 font-black flex items-center gap-2 mb-4 text-lg">
                      <Home className="w-5 h-5 text-gray-400" /> Vendeur
                    </h3>
                    <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-gray-900 text-lg mb-1">{order.store.name}</p>
                          <Link href={`/${order.store.slug}`} prefetch={false} className="text-[#0F7A60] hover:text-[#0D5C4A] hover:underline text-sm font-bold transition-colors inline-block">
                            Visiter la boutique →
                          </Link>
                        </div>
                      </div>
                      
                      {order.store.whatsapp && (
                        <a 
                          href={`https://wa.me/${order.store.whatsapp}?text=Bonjour, je vous contacte depuis PDV Pro concernant ma commande n°${order.id.split('-')[0].toUpperCase()}.`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full bg-[#25D366] text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black hover:bg-[#20b858] transition-all shadow-md shadow-[#25D366]/20 active:scale-95"
                        >
                          <MessageCircle size={20} />
                          Contacter sur WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F7A60]" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}
