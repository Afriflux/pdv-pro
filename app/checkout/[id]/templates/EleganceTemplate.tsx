'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ChevronRight } from 'lucide-react'

// Ceci est un template de test/placeholder complet pour voir si l'intégration marche
export function EleganceTemplate({ 
  product, 
  accent: _accent, 
  bunnyVideoId: _bunnyVideoId, 
  bunnyLibraryId: _bunnyLibraryId,
  groupedVariants: _groupedVariants,
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode: _imageGalleryNode
}: any) {
  const coverImage = product.images?.[0]

  return (
    <div className="min-h-screen bg-[#0A1A1F] text-white relative flex flex-col md:flex-row">
      
      {/* Colonne Gauche : Image et Ambiance */}
      <div className="md:w-1/2 min-h-[40vh] md:min-h-screen relative flex flex-col justify-end p-8 md:p-12 lg:p-20 md:fixed md:top-0 md:bottom-0 md:left-0">
        {coverImage ? (
          <div className="absolute inset-0 bg-cover bg-center brightness-50" style={{ backgroundImage: `url(${coverImage})`, transition: 'background-image 0.5s ease-in-out' }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-[#0A1A1F]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A1F] via-[#0A1A1F]/40 to-transparent" />
        
        <div className="relative z-10 hidden md:block">
           <Link href={`/${product.store.slug}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
             <ArrowLeft className="w-5 h-5" />
             Retour à {product.store.name}
           </Link>
           <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-none tracking-tight mb-4">{product.name}</h1>
           <div className="text-3xl lg:text-4xl font-light text-emerald-400 mb-8">{basePrice} FCFA</div>
           <div className="flex gap-4">
             <div className="flex -space-x-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-[#0A1A1F] backdrop-blur-md" />
               ))}
             </div>
             <div className="text-sm text-emerald-400/80 my-auto uppercase tracking-widest font-bold">Produit Premium</div>
           </div>
        </div>
      </div>

      {/* Colonne Droite : Achat */}
      <div className="md:w-1/2 md:ml-auto min-h-screen bg-[#0A1A1F] p-6 md:p-12 lg:p-20 relative z-20">
         <div className="max-w-xl mx-auto">
            {/* Header Mobile */}
            <div className="md:hidden mb-8">
               <h1 className="text-3xl font-black leading-none tracking-tight mb-2">{product.name}</h1>
               <div className="text-2xl font-light text-emerald-400">{basePrice} FCFA</div>
            </div>

            <div className="prose prose-invert prose-emerald prose-lg mb-12 opacity-80 leading-relaxed font-light">
               {product.description || 'Une description captivante pour un produit d\'exception...'}
            </div>

            {/* Formulaire & Checkout */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
               {!showForm ? (
                  <div className="space-y-6">
                    <button 
                      onClick={() => handleOpenForm('online')}
                      className="w-full flex items-center justify-between bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest px-8 py-5 rounded-2xl transition-all transform hover:scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                    >
                       <span>Acheter maintenant</span>
                       <ChevronRight className="w-6 h-6" />
                    </button>
                    {product.cash_on_delivery && (
                       <button 
                          onClick={() => handleOpenForm('cod')}
                          className="w-full border border-white/20 hover:bg-white/10 text-white font-semibold flex items-center justify-center gap-2 px-8 py-4 rounded-2xl transition-colors"
                       >
                          Payer à la livraison
                       </button>
                    )}
                    <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                       <Lock className="w-4 h-4" />
                       Paiement 100% sécurisé
                    </div>
                  </div>
               ) : (
                  <div id="checkout-form-section">
                     {checkoutFormNode}
                  </div>
               )}
            </div>
         </div>
      </div>

    </div>
  )
}
