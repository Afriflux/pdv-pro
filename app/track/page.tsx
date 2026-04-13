'use client'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Package, Truck, CheckCircle2, Home, MapPin, MessageCircle, AlertCircle, ShoppingBag, Loader2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Steps logic
const STEPS = [
  { id: 'confirmed', label: 'Traitement', description: 'Commande validée', icon: Package },
  { id: 'processing', label: 'Préparation', description: 'En entrepôt', icon: ShoppingBag },
  { id: 'shipped', label: 'En Transit', description: 'Expédiée', icon: Truck },
  { id: 'delivered', label: 'Livrée', description: 'À destination', icon: Home }
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
    <div className="min-h-screen bg-[#F8FAFA] relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#0F7A60]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] rounded-full bg-[#0F7A60]/10 blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        
        {/* Header & Retours */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center space-y-4 mb-12 pt-6 sm:pt-0"
        >
           <div className="absolute left-0 top-0 w-full flex justify-between items-center z-10 pt-4 px-4 sm:px-0">
             <Link href="/" className="text-gray-400 hover:text-gray-800 font-medium text-sm transition-colors border-b border-transparent hover:border-gray-800 pb-0.5 flex items-center gap-1.5">
               <ArrowRight className="w-4 h-4 rotate-180" /> Accueil
             </Link>
             <Link href="/client/orders" className="text-white hover:text-white/90 font-bold text-xs sm:text-sm bg-[#0F7A60] hover:bg-[#0D5C4A] shadow-md shadow-[#0F7A60]/20 px-5 py-2 sm:py-2.5 rounded-full transition-colors flex items-center gap-1.5">
               Espace Client <ArrowRight className="w-4 h-4" />
             </Link>
           </div>
           
           <div className="w-20 h-20 bg-white shadow-xl shadow-[#0F7A60]/5 rounded-[2rem] border border-gray-100 flex items-center justify-center mx-auto mt-4 md:mt-0 relative group">
             <div className="absolute inset-0 bg-[#0F7A60] opacity-0 group-hover:opacity-10 rounded-[2rem] transition-opacity duration-500" />
             <Truck size={36} className="text-[#0F7A60] transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 text-center tracking-tight">Où est ma commande ?</h1>
           <p className="text-gray-500 text-center max-w-sm text-sm sm:text-base leading-relaxed">
             Saisissez les informations de votre achat pour suivre son expédition en temps réel.
           </p>
        </motion.div>

        {/* Search Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white"
        >
          <div className="bg-white p-6 md:p-8 rounded-[1.7rem] border border-gray-50">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-5 relative z-10">
              <div className="flex-1">
                <label htmlFor="ref-input" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Référence Commande
                </label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    id="ref-input"
                    type="text" 
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="Ex: 550e8400..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 font-mono text-sm outline-none transition-all placeholder:text-gray-300 font-bold text-gray-700"
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="phone-input" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Téléphone utilisé
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    id="phone-input"
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0F7A60]/10 text-sm outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={loading || !ref.trim() || !phone.trim()}
                  className="w-full md:w-auto px-10 py-4 bg-[#0F7A60] hover:bg-[#0D5C4A] text-white font-black rounded-2xl shadow-xl shadow-[#0F7A60]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[56px] hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Rechercher</>}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
               initial={{ opacity: 0, height: 0, marginTop: 0 }}
               animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
               exit={{ opacity: 0, height: 0, marginTop: 0 }}
               className="overflow-hidden"
            >
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Details & Stepper */}
        <AnimatePresence>
        {order && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden"
          >
            {/* Order Header */}
            <div className="px-6 md:px-10 py-8 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-[#0F7A60] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                   <span className="w-2 h-2 rounded-full bg-[#0F7A60] animate-pulse" />
                   Statut en direct
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl font-mono font-black text-gray-900">#{order.id.split('-')[0].toUpperCase()}</h2>
                  {order.status === 'cancelled' && (
                    <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-black border border-red-200 tracking-wide uppercase">
                      Annulée
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-400 mt-2">
                  Placée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Premium Stepper */}
            {order.status !== 'cancelled' && (
              <div className="px-4 md:px-10 py-12 md:py-16 border-b border-gray-50 overflow-x-auto relative">
                {/* Ligne d'arrière plan */}
                <div className="absolute top-1/2 -translate-y-1/2 left-10 right-10 h-1.5 bg-gray-100 rounded-full" />
                
                {/* Ligne de progression */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `calc(${stepIndex >= 0 ? (stepIndex / (STEPS.length - 1)) * 100 : 0}% - 20px)` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="absolute top-1/2 -translate-y-1/2 left-10 h-1.5 bg-[#0F7A60] rounded-full shadow-[0_0_15px_rgba(15,122,96,0.5)]"
                />
                
                <div className="min-w-[600px] max-w-3xl mx-auto flex justify-between relative z-10 px-4 md:px-0">
                  {STEPS.map((step, idx) => {
                    const Icon = step.icon
                    const isPast = idx < stepIndex
                    const isCurrent = idx === stepIndex
                    
                    return (
                      <div key={step.id} className="relative flex flex-col items-center w-28 group">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + (idx * 0.1) }}
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500
                          ${isPast ? 'bg-[#0F7A60] text-white shadow-[#0F7A60]/30' : isCurrent ? 'bg-white border-[#0F7A60] text-[#0F7A60] shadow-xl shadow-[#0F7A60]/20 scale-110 !rounded-full' : 'bg-gray-100 text-gray-300'}
                        `}>
                          {isPast ? <CheckCircle2 size={24} strokeWidth={3} /> : <Icon size={isCurrent ? 24 : 20} strokeWidth={isCurrent ? 2.5 : 2} />}
                        </motion.div>
                        <motion.span 
                           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + (idx * 0.1) }}
                           className={`mt-5 text-sm font-black tracking-wide text-center
                          ${isCurrent ? 'text-[#0F7A60]' : isPast ? 'text-gray-900' : 'text-gray-400'}
                        `}>
                          {step.label}
                        </motion.span>
                        <motion.span 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + (idx * 0.1) }}
                            className="text-xs text-gray-400 font-medium mt-1 text-center truncate w-full"
                        >
                            {step.description}
                        </motion.span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Content Grid */}
            <div className="p-6 md:p-10 grid md:grid-cols-2 gap-10 md:gap-16 bg-white shrink-0">
              
              {/* Left Column: Articles & Pricing */}
              <div className="space-y-6">
                <h3 className="text-gray-900 font-black flex items-center gap-2 text-xl mb-6">
                  Produits commandés
                </h3>
                {order.product ? (
                  <div className="flex gap-4 p-4 border border-gray-100/80 rounded-3xl hover:shadow-lg hover:shadow-gray-100 transition-shadow bg-white">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-100/50 rounded-[1.2rem] flex items-center justify-center text-3xl shadow-inner flex-shrink-0 relative overflow-hidden">
                      {order.product.images?.[0] ? (
                        <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={order.product.images[0]} alt={order.product.name} fill className="object-cover" />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-extrabold text-gray-900 leading-snug line-clamp-2 text-base">{order.product.name}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5 bg-gray-50 w-fit px-2 py-0.5 rounded-md text-[#0F7A60]">Qté : {order.quantity}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl">Article anonyme ou indisponible</p>
                )}

                <div className="bg-gray-50/50 p-6 rounded-[2rem] space-y-4 border border-gray-100">
                  <div className="flex justify-between text-gray-500 font-medium text-sm">
                    <span>Sous-total HT</span>
                    <span className="font-bold text-gray-700">{order.subtotal?.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium text-sm">
                    <span>Frais d'expédition</span>
                    <span className="font-bold text-gray-700">{order.delivery_fee?.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-200 border-dashed flex justify-between items-end">
                    <span className="font-black text-gray-400 uppercase tracking-widest text-xs">A payé</span>
                    <span className="text-2xl font-black text-[#0F7A60]">{order.total?.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Delivery & Vendor */}
              <div className="space-y-10">
                {order.delivery_address || order.deliveryZone ? (
                  <div>
                    <h3 className="text-gray-900 font-black flex items-center gap-2 text-xl mb-6">
                      Lieu d'expédition
                    </h3>
                    <div className="p-6 bg-blue-50/30 border border-blue-100/50 rounded-[2rem] text-sm space-y-5 relative overflow-hidden backdrop-blur-sm">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                       
                       {order.deliveryZone && (
                         <div className="flex gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center shrink-0">
                             <MapPin className="w-4 h-4 text-blue-600" />
                           </div>
                           <div className="pt-0.5">
                             <span className="block text-xs text-blue-500/70 font-black uppercase tracking-widest mb-0.5">Zone définie</span>
                             <span className="font-black text-gray-900 text-base">{order.deliveryZone.name}</span>
                           </div>
                         </div>
                       )}
                       {order.delivery_address && (
                         <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center shrink-0" />
                           <div className="pt-0.5 max-w-[200px]">
                             <span className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-0.5">Adresse de dépôt</span>
                             <span className="font-bold text-gray-600 leading-relaxed text-sm">{order.delivery_address}</span>
                           </div>
                         </div>
                       )}
                       {order.deliveryZone?.duration && order.status !== 'delivered' && order.status !== 'cancelled' && (
                         <div className="p-4 bg-white/60 rounded-2xl border border-white mt-2 flex items-center justify-between">
                           <span className="text-xs font-black uppercase tracking-widest text-[#0F7A60]">Est. Arrivée</span>
                           <span className="font-black text-gray-900 text-lg">{order.deliveryZone.duration}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ) : null}

                {order.store && (
                  <div>
                    <h3 className="text-gray-900 font-black flex items-center gap-2 text-xl mb-6">
                      Le Vendeur
                    </h3>
                    <div className="p-6 border border-gray-100 rounded-[2rem] bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-shadow hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F7A60]/20 to-[#0F7A60]/5 border border-[#0F7A60]/10 flex items-center justify-center font-black text-[#0F7A60] text-xl shadow-inner shrink-0">
                          {order.store.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-xl tracking-tight">{order.store.name}</p>
                          <Link href={`/${order.store.slug}`} prefetch={false} className="text-[#0F7A60] hover:text-[#0D5C4A] text-xs font-bold transition-colors mt-0.5 inline-block">
                            Voir la vitrine ↗
                          </Link>
                        </div>
                      </div>
                      
                      {order.store.whatsapp && (
                        <a 
                          href={`https://wa.me/${order.store.whatsapp}?text=Bonjour, je vous contacte depuis Yayyam concernant ma commande n°${order.id.split('-')[0].toUpperCase()}.`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full sm:w-auto bg-[#25D366] text-white py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 font-black hover:bg-[#20b858] transition-all shadow-lg shadow-[#25D366]/20 active:scale-95 shrink-0 whitespace-nowrap"
                        >
                          <MessageCircle size={18} />
                          Message
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFA] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0F7A60]" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}
