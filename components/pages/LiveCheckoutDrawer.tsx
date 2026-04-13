'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, Lock, CheckCircle2 } from 'lucide-react'
import { Product, Theme, THEME_MAP } from '@/components/pages/PageRenderers'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface LiveCheckoutDrawerProps {
  pageId: string
  products: Product[]
  theme: Theme
  storeName?: string
}

export function LiveCheckoutDrawer({ pageId, products, theme }: LiveCheckoutDrawerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutProductId = searchParams.get('checkout')
  
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })

  // Le produit sélectionné
  const product = checkoutProductId ? products.find(p => p.id === checkoutProductId) : null

  useEffect(() => {
    if (product) {
       setIsOpen(true)
       setSuccess(false)
       document.body.style.overflow = 'hidden' // Empêcher le scroll
    } else {
       setIsOpen(false)
       document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [product])

  const closeDrawer = () => {
    setIsOpen(false)
    setTimeout(() => {
        router.replace(window.location.pathname, { scroll: false })
    }, 300)
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setLoading(true)

    try {
      const supabase = createClient()
      
      // 1. Incrémenter les stats de la page de vente
      const { data: pageData } = await supabase.from('SalePage').select('sales_count, store_id').eq('id', pageId).single()
      if (pageData) {
         await supabase.from('SalePage').update({ sales_count: (pageData.sales_count || 0) + 1 }).eq('id', pageId)

         // 2. Enregistrement en tant que Lead direct (Intégration base de données)
         await supabase.from('Lead').insert([{
           store_id: pageData.store_id,
           product_id: product.id,
           first_name: formData.name.split(' ')[0] || '',
           last_name: formData.name.split(' ').slice(1).join(' ') || '',
           phone: formData.phone,
           source: 'live_checkout',
           status: 'new'
         }])
      }

      setSuccess(true)
      
      // Fermeture automatique après succès
      setTimeout(() => {
         closeDrawer()
      }, 4000)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen && !product) return null

  const colors = THEME_MAP[theme.color] || THEME_MAP.orange

  return (
    <div className="relative z-50">
      {/* Overlay sombre */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={closeDrawer} 
      />

      {/* Le Tiroir (Slide-over) */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[480px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Tiroir */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 font-display">Finaliser ma commande</h2>
          <button onClick={closeDrawer} aria-label="Fermer" title="Fermer" className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm border border-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {product && !success && (
          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8">
            {/* Résumé Produit */}
            <div className={`flex gap-4 p-4 rounded-2xl ${colors.bgLight} border border-${theme.color}-100`}>
              {product.images?.[0] ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm">
                  <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={product.images[0]} alt={product.name} fill className="object-cover" />
                </div>
              ) : (
                <div className={`w-20 h-20 ${colors.bgPrimary} opacity-50 rounded-xl flex items-center justify-center text-white`}>📦</div>
              )}
              <div className="flex flex-col justify-center">
                <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                <p className={`text-lg font-black mt-1 ${colors.textPrimary}`}>
                  {product.price.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>

            {/* Badges Confiance */}
            <div className="flex items-center justify-center gap-6 text-sm font-medium text-gray-600 bg-gray-50 py-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1.5">
                 <Lock size={16} className="text-gray-400" /> Paiement Sécurisé
              </div>
              <div className="flex items-center gap-1.5">
                 <span>🤝</span> Livraison Garantie
              </div>
            </div>

            {/* Formulaire Express */}
            <form onSubmit={handleOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nom Complet</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Jean Dupont" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all outline-none font-medium" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Numéro de Téléphone</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+221 XX XXX XX XX" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all outline-none font-medium" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Adresse de livraison détaillée</label>
                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={3} placeholder="Ville, Quartier, Rue, Repères..." className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all outline-none font-medium resize-none" />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full flex items-center justify-center py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-transform active:scale-95 ${colors.bgPrimary} ${colors.bgHover} ${colors.shadow}`}
                >
                  {loading ? 'Traitement...' : 'Commander maintenant'}
                </button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Commande Confirmée !</h3>
            <p className="text-gray-500 leading-relaxed max-w-sm">Merci pour votre confiance. Votre commande a été enregistrée avec succès et sera traitée rapidement.</p>
          </div>
        )}

      </div>
    </div>
  )
}
