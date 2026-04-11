'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Star, CheckCircle, ChevronDown, ShieldCheck, Zap, Users, Award } from 'lucide-react'

/**
 * SalesLetterTemplate — Template long-form persuasif
 * Style copywriting : header impact → storytelling → social proof → CTA
 * Couleurs 100% dynamiques via product.store.primary_color
 * Idéal pour : Formations, coaching, programmes, produits digitaux
 */
export function SalesLetterTemplate({ 
  product, 
  basePrice,
  handleOpenForm,
  showForm,
  checkoutFormNode,
  imageGalleryNode: _imageGalleryNode
}: any) {
  const coverImage = product.images?.[0]
  const accent = product.store?.primary_color || '#0F7A60'
  const accentLight = accent + '15'

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-gray-900 pb-24">
      
      {/* ── Cover : Header impact ─────────────────────────────────── */}
      <div className="relative overflow-hidden" {...{ style: { backgroundColor: accent } }}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-[100px]" {...{ style: { backgroundColor: accent } }} />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-24 text-center text-white">
          <Link href={`/${product.store.slug}`} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm uppercase tracking-widest font-bold">
            <ArrowLeft className="w-4 h-4" />
            {product.store.name}
          </Link>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-8 tracking-tight">
            {product.name}
          </h1>
          
          <div className="flex justify-center mb-8">
            <div className="bg-white/15 backdrop-blur-md px-6 py-2.5 rounded-full inline-flex items-center gap-2 border border-white/20">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-sm">{typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA</span>
            </div>
          </div>

          {/* Social proof rapide */}
          <div className="flex items-center justify-center gap-6 text-white/70 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> +200 clients</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Qualité garantie</span>
            <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:block" />
            <span className="flex items-center gap-1.5 hidden sm:flex"><ShieldCheck className="w-4 h-4" /> 100% sécurisé</span>
          </div>
        </div>
      </div>

      {/* ── Corps principal ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Image cover si dispo */}
          {coverImage && (
            <div className="w-full aspect-[16/9] md:aspect-[21/9] relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 md:p-12">
            
            {/* Description avec parsing intelligent */}
            <div className="prose prose-lg md:prose-xl prose-gray max-w-none text-gray-700 leading-relaxed">
              {product.description ? (
                product.description.split('\n').map((line: string, i: number) => {
                  const trimmed = line.trim()
                  if (trimmed.startsWith('✨') || trimmed.startsWith('##') || trimmed.startsWith('**')) {
                    return <h3 key={i} className="font-black text-gray-900 text-2xl mt-12 mb-6 tracking-tight">{trimmed.replace(/[✨#*]/g, '').trim()}</h3>
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    return (
                      <div key={i} className="flex gap-3 my-4">
                        <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" {...{ style: { color: accent } }} />
                        <span className="font-medium text-gray-800">{trimmed.substring(2)}</span>
                      </div>
                    )
                  }
                  if (trimmed === '') return <div key={i} className="h-4" />
                  return <p key={i} className="my-4 text-[17px] leading-[1.8]">{trimmed}</p>
                })
              ) : (
                <p className="text-lg text-gray-500 italic">Découvrez comment transformer votre quotidien avec cette offre exclusive.</p>
              )}
            </div>

            {/* ── Bandeau garantie ───────────────────────────────────── */}
            <div className="my-12 rounded-2xl p-6 flex items-center gap-4 border" {...{ style: { backgroundColor: accentLight, borderColor: accent + '30' } }}>
              <ShieldCheck className="w-10 h-10 flex-shrink-0" {...{ style: { color: accent } }} />
              <div>
                <p className="font-black text-gray-900">Garantie Satisfait ou Remboursé</p>
                <p className="text-sm text-gray-600 mt-0.5">Si le produit ne vous convient pas, contactez-nous sous 7 jours pour un remboursement complet.</p>
              </div>
            </div>

            <div className="my-12 border-t border-gray-200" />

            {/* ── Section CTA ──────────────────────────────────────── */}
            {!showForm ? (
              <div className="space-y-6 max-w-xl mx-auto text-center">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 tracking-tight">Prêt à passer à l&apos;action ?</h3>
                
                <button 
                  onClick={() => handleOpenForm('online')}
                  className="w-full text-white font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-1 text-lg"
                  {...{ style: { backgroundColor: accent, boxShadow: `0 20px 40px ${accent}30` } }}
                >
                  <span className="flex items-center gap-2"><Zap className="w-5 h-5" /> Accéder maintenant</span>
                  <span className="text-sm font-medium opacity-80 normal-case tracking-normal">
                    Paiement unique de {typeof basePrice === 'number' ? basePrice.toLocaleString('fr-FR') : basePrice} FCFA
                  </span>
                </button>
                
                {product.cash_on_delivery && (
                  <button 
                    onClick={() => handleOpenForm('cod')}
                    className="mt-4 font-bold hover:underline text-sm"
                    {...{ style: { color: accent } }}
                  >
                    Ou je préfère payer à la livraison
                  </button>
                )}
                
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-6">
                  <Lock className="w-4 h-4" />
                  Transaction 100% sécurisée
                </div>
              </div>
            ) : (
              <div id="checkout-form-section" className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100">
                {checkoutFormNode}
              </div>
            )}

            {/* ── FAQ rapide ──────────────────────────────────────── */}
            <div className="mt-16 space-y-3">
              <h3 className="text-lg font-black text-gray-900 mb-6 text-center">Questions fréquentes</h3>
              {[
                { q: 'Comment accéder au produit après achat ?', a: 'Vous recevrez un email et/ou une notification WhatsApp avec les détails d\'accès immédiatement après le paiement.' },
                { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Wave, Orange Money, Free Money, cartes bancaires et paiement à la livraison (pour les produits physiques).' },
                { q: 'Puis-je obtenir un remboursement ?', a: 'Oui, nous offrons une garantie satisfait ou remboursé sous 7 jours. Contactez le vendeur via WhatsApp.' },
              ].map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-2xl border border-gray-100 [&_summary::-webkit-details-marker]:hidden group">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-gray-800 select-none text-sm">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-2" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer minimal ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <p className="text-gray-400 text-xs font-medium">
          Propulsé par <span className="text-gray-600 font-bold">Yayyam</span>
          {product.store?.name && <span className="opacity-50"> · {product.store.name}</span>}
        </p>
      </div>
    </div>
  )
}
