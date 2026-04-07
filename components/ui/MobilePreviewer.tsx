'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface MobilePreviewerProps {
  name: string
  price: string
  description: string
  images: string[]
  template: string
  type: string
}

export function MobilePreviewer({ name, price, description, images, template, type: _type }: MobilePreviewerProps) {
  // Rendu selon le template
  const renderTemplate = () => {
    switch (template) {
      case 'elegance':
        return (
          <div className="h-full w-full bg-[#0A1A1F] text-white relative">
            {images.length > 0 ? (
              <div 
                className="absolute inset-0 bg-cover bg-center brightness-50"
                style={{ backgroundImage: `url(${images[0]})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-teal-900" />
            )}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 w-full text-center shadow-2xl">
                <h3 className="text-xl font-bold mb-2">{name || 'Nom du produit'}</h3>
                <p className="text-emerald-400 font-black text-2xl mb-4">{price ? `${price} FCFA` : '0 FCFA'}</p>
                <div className="text-xs text-white/60 mb-6 line-clamp-3">
                  {description || 'Description de votre produit...'}
                </div>
                <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition">
                  Acheter maintenant
                </button>
              </div>
            </div>
          </div>
        )

      case 'sales_letter':
        return (
          <div className="h-full w-full bg-white text-gray-900 overflow-y-auto no-scrollbar relative flex flex-col">
            {images.length > 0 ? (
              <div 
                className="w-full h-48 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${images[0]})` }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-gray-400 uppercase tracking-widest text-xs font-bold font-mono">Cover Image</span>
              </div>
            )}
            
            <div className="p-6">
              <h1 className="text-2xl font-black text-center mb-6 leading-tight">{name || 'TITRE ACCROCHEUR QUI CAPTIVE L\'ATTENTION'}</h1>
              <div className="prose prose-sm prose-gray max-w-none mb-24 line-clamp-[10]">
                {description || (
                  <div className="space-y-4">
                     <p className="font-semibold text-lg">Chère entrepreneuse, cher entrepreneur,</p>
                     <p>Ici débute votre lettre de vente qui va convertir vos prospects en clients...</p>
                     <p>Voici les bénéfices massifs de ce produit digital.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pb-8">
              <button className="w-full bg-[#111] text-white font-bold py-4 rounded-full text-lg shadow-xl shadow-black/20 flex flex-col items-center">
                <span>Accéder immédiatement</span>
                <span className="text-xs text-white/50">{price ? `${price} FCFA` : '0 FCFA'}</span>
              </button>
            </div>
          </div>
        )

      case 'default':
      default:
        return (
          <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden">
            {/* Header simple */}
            <div className="bg-white p-4 text-center border-b border-gray-100 shrink-0">
              <span className="font-bold text-xs uppercase tracking-widest text-gray-800">Checkout Sécurisé</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                 {images.length > 0 && (
                   <div className="relative w-full h-32 mb-3">
                     <Image src={images[0]} alt="Product" fill className="object-cover rounded-xl" unoptimized />
                   </div>
                 )}
                 <h2 className="font-bold text-gray-900 leading-tight">{name || 'Nom du produit'}</h2>
                 <p className="text-gold font-bold text-lg mt-1">{price ? `${price} FCFA` : '0 FCFA'}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                 <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                 <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                 <button className="w-full bg-black text-white py-3 rounded-xl font-bold mt-2">
                   Valider le paiement
                 </button>
              </div>

              <div className="text-center text-[10px] text-gray-400 font-medium">Propulsé par Yayyam</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="relative mx-auto w-[320px] h-[650px] bg-black rounded-[3rem] p-3 shadow-2xl ring-1 ring-white/10 shadow-black/50">
      {/* Encoche iPhone */}
      <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50">
        <div className="w-32 h-6 bg-black rounded-b-[1rem] relative">
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-800 rounded-full" />
        </div>
      </div>

      {/* Écran */}
      <div className="relative overflow-hidden w-full h-full bg-white rounded-[2.25rem]">
        {renderTemplate()}
      </div>

      {/* Label indicateur */}
      <div className="absolute -bottom-8 inset-x-0 flex justify-center">
        <div className="bg-black/5 text-gray-400 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Rendu en temps réel
        </div>
      </div>
    </div>
  )
}
