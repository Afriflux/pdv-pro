'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Star, CheckCircle } from 'lucide-react'

export function SalesLetterTemplate({ 
  product, 
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode: _imageGalleryNode
}: any) {
  const coverImage = product.images?.[0]

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-24">
      {/* Cover Type Lettre de vente */}
      <div className="bg-[#111] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-center">
           <Link href={`/${product.store.slug}`} className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
             <ArrowLeft className="w-4 h-4" />
             {product.store.name}
           </Link>
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-8">
             {product.name}
           </h1>
           <div className="flex justify-center mb-8">
             <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full inline-flex items-center gap-2 border border-white/20">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-sm">Le programme complet à {basePrice} FCFA</span>
             </div>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-12">
            {coverImage && (
              <div className="mb-10 rounded-2xl overflow-hidden shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt={product.name} className="w-full object-cover" />
              </div>
            )}

            <div className="prose prose-lg md:prose-xl prose-gray max-w-none text-gray-700 leading-relaxed font-serif">
              {product.description ? (
                product.description.split('\n').map((line: string, i: number) => {
                  if (line.trim().startsWith('✨')) return <h3 key={i} className="font-black text-gray-900 text-2xl mt-12 mb-6">{line}</h3>
                  if (line.trim().startsWith('- ')) return <div key={i} className="flex gap-3 my-4"><CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" /><span className="font-medium text-gray-800">{line.substring(2)}</span></div>
                  return <p key={i} className="my-6">{line}</p>
                })
              ) : (
                <p>Découvrez comment transformer votre quotidien avec cette offre exclusive.</p>
              )}
            </div>

            <div className="my-16 border-t border-gray-200"></div>

            {!showForm ? (
              <div className="space-y-6 max-w-xl mx-auto text-center">
                 <h3 className="text-2xl font-black text-gray-900 mb-8">Prêt à passer à l'action ?</h3>
                 <button 
                    onClick={() => handleOpenForm('online')}
                    className="w-full bg-[#111] hover:bg-gray-800 text-white font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all transform hover:scale-[1.02] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex flex-col items-center gap-1"
                 >
                    <span className="text-lg">Accéder au programme complet</span>
                    <span className="text-sm font-medium opacity-70">Paiement unique de {basePrice} FCFA</span>
                 </button>
                 
                 {product.cash_on_delivery && (
                   <button 
                     onClick={() => handleOpenForm('cod')}
                     className="mt-4 text-emerald-600 font-bold hover:underline"
                   >
                     Ou je préfère payer à la livraison
                   </button>
                 )}
                 <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-6">
                    <Lock className="w-4 h-4" />
                    Transaction 100% sécurisée
                 </div>
              </div>
            ) : (
              <div id="checkout-form-section" className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100">
                {checkoutFormNode}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
