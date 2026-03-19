/* eslint-disable react/forbid-dom-props */
'use client'

// ─── Page Produit Premium — Style Shopify ─────────────────────────────────────
// Galerie d'images, variants, sticky bar mobile, slide-down formulaire,
// badges de confiance et intégration SocialProofBanner.

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Shield, RotateCcw, Truck, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { CheckoutForm } from './CheckoutForm'
import SocialProofBanner from '@/components/widgets/SocialProofBanner'
import { ReviewWidget } from '@/components/reviews/ReviewWidget'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import type { PromotionData } from '@/lib/promotions/promotionType'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  dimension_1: string | null
  value_1: string | null
  dimension_2: string | null
  value_2: string | null
  stock: number
  price_adjust: number
}

interface ProductPageProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    type: string
    images: string[]
    cash_on_delivery: boolean
    resale_allowed?: boolean
    resale_commission?: number | null
    store: {
      id: string
      name: string
      slug: string
      logo_url: string | null
      primary_color: string | null
      vendor_type: 'digital' | 'physical' | 'hybrid' | null
    }
  }
  variants: Variant[]
  computedPrice: {
    originalPrice: number
    finalPrice: number
    hasDiscount: boolean
    activePromo: PromotionData | null
  }
  vendorPlan?: 'gratuit' | 'pro'
  storeId: string
}

// ─── Composant Galerie ────────────────────────────────────────────────────────

function ImageGallery({
  images,
  productName,
  accent,
}: {
  images: string[]
  productName: string
  accent: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  const prev = () => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1))

  // Aucune image → placeholder
  if (!images || images.length === 0) {
    return (
      <div
        className="w-full aspect-square rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}11` }}
      >
        <ShoppingBag className="w-20 h-20 opacity-20" style={{ color: accent }} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Image principale */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`${productName} — image ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />

        {/* Navigation flèches (visible si plusieurs images) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Image précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Image suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Dots indicateurs (mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Image ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === activeIndex
                    ? 'w-5 h-2'
                    : 'w-2 h-2 bg-white/50'
                }`}
                style={i === activeIndex ? { backgroundColor: accent } : {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniatures (desktop seulement) */}
      {images.length > 1 && (
        <div className="hidden lg:flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Miniature ${i + 1}`}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIndex ? 'scale-105' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={i === activeIndex ? { borderColor: accent } : {}}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Composant Principal ──────────────────────────────────────────────────────

export default function ProductPage({
  product,
  variants,
  computedPrice,
  vendorPlan = 'gratuit',
  storeId,
}: ProductPageProps) {
  const accent = product.store.primary_color || '#0F7A60'

  // États UI
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  )
  const [quantity, setQuantity]       = useState(1)
  const [showForm, setShowForm]       = useState(false)
  const [formMode, setFormMode]       = useState<'online' | 'cod'>('online')

  const showCOD = product.type === 'physical' 
    && product.cash_on_delivery === true 
    && (product.store.vendor_type === 'physical' || product.store.vendor_type === 'hybrid')

  // Variant sélectionné
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null
  const variantStock    = selectedVariant?.stock ?? 99

  // Prix calculé avec variant
  const baseProductPrice = computedPrice.hasDiscount
    ? computedPrice.finalPrice
    : product.price
  const finalPrice = baseProductPrice + (selectedVariant?.price_adjust ?? 0)

  // Badge réduction
  const discountBadge = () => {
    if (!computedPrice.hasDiscount || !computedPrice.activePromo) return null
    const promo = computedPrice.activePromo
    if (promo.discount_type === 'percentage') {
      return `-${promo.discount_value ?? 0}%`
    }
    return `-${(promo.discount_value ?? 0).toLocaleString('fr-FR')} FCFA`
  }

  // Ouvrir le formulaire de commande
  const handleOpenForm = (mode: 'online' | 'cod') => {
    setFormMode(mode)
    setShowForm(true)
    // Scroll vers le formulaire après l'animation
    setTimeout(() => {
      document.getElementById('checkout-form-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  // ─── Grouper les variants par dimension ────────────────────────────────
  const groupedVariants = variants.reduce<Record<string, Variant[]>>((acc, v) => {
    const key = v.dimension_1 ?? 'Option'
    if (!acc[key]) acc[key] = []
    acc[key].push(v)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#FAFAF7]">

      {/* ── Header boutique ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + Nom boutique */}
          <Link href={`/${product.store.slug}`} className="flex items-center gap-2.5 group">
            {product.store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.store.logo_url}
                alt={product.store.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                style={{ backgroundColor: accent }}
              >
                {product.store.name[0]}
              </div>
            )}
            <span className="font-bold text-gray-800 text-sm group-hover:opacity-70 transition-opacity">
              {product.store.name}
            </span>
          </Link>

          {/* Retour boutique */}
          <Link
            href={`/${product.store.slug}`}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </header>

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">

          {/* ═══ Colonne gauche — Galerie ════════════════════════════════════ */}
          <div className="lg:sticky lg:top-24 lg:self-start mb-6 lg:mb-0">
            <ImageGallery
              images={product.images ?? []}
              productName={product.name}
              accent={accent}
            />
          </div>

          {/* ═══ Colonne droite — Infos produit ══════════════════════════════ */}
          <div className="space-y-6">

            {/* ── Nom produit ────────────────────────────────────────────── */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* ── Prix ───────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
              {computedPrice.hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
              )}
              <span className="text-3xl font-black" style={{ color: accent }}>
                {finalPrice.toLocaleString('fr-FR')}{' '}
                <span className="text-base font-medium opacity-60">FCFA</span>
              </span>
              {discountBadge() && (
                <span
                  className="text-sm font-black px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: accent }}
                >
                  {discountBadge()}
                </span>
              )}
            </div>

            {/* ── Variants ───────────────────────────────────────────────── */}
            {variants.length > 0 && (
              <div className="space-y-3">
                {Object.entries(groupedVariants).map(([dimension, dimVariants]) => (
                  <div key={dimension}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {dimension}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dimVariants.map((v) => {
                        const isSelected = v.id === selectedVariantId
                        const isOutOfStock = v.stock === 0
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`
                              px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                              ${isOutOfStock ? 'opacity-40 cursor-not-allowed line-through text-gray-400 border-gray-200' : ''}
                              ${isSelected && !isOutOfStock ? 'scale-105 shadow-md' : !isOutOfStock ? 'border-gray-200 text-gray-600 hover:border-gray-400' : ''}
                            `}
                            style={
                              isSelected && !isOutOfStock
                                ? { borderColor: accent, backgroundColor: `${accent}10`, color: accent }
                                : {}
                            }
                          >
                            {v.value_1}
                            {v.value_2 ? ` / ${v.value_2}` : ''}
                            {v.price_adjust !== 0 && (
                              <span className="ml-1 opacity-60 text-xs">
                                {v.price_adjust > 0 ? `+${v.price_adjust}` : v.price_adjust}
                              </span>
                            )}
                            {isOutOfStock && <span className="ml-1 text-xs">épuisé</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Stock affiché */}
                {selectedVariant && (
                  <p
                    className={`text-xs font-bold ${
                      variantStock < 5 ? 'text-red-500' : variantStock < 15 ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  >
                    {variantStock === 0
                      ? '❌ Rupture de stock'
                      : variantStock < 5
                      ? `⚠️ Plus que ${variantStock} en stock !`
                      : variantStock < 15
                      ? `🔥 ${variantStock} pièces restantes`
                      : `✅ En stock`}
                  </p>
                )}
              </div>
            )}

            {/* ── Quantité (produit physique) ─────────────────────────── */}
            {product.type === 'physical' && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Quantité
                </p>
                <div className="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="w-12 text-center font-black text-gray-800">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Augmenter la quantité"
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            {/* ── SocialProofBanner ───────────────────────────────────── */}
            <SocialProofBanner
              storeId={storeId}
              productId={product.id}
              stock={variantStock}
              stockThreshold={10}
            />

            {/* ── Boutons d'action — DESKTOP ──────────────────────────── */}
            {!showForm && (
              <div className="hidden lg:space-y-3 lg:block">
                <button
                  type="button"
                  onClick={() => handleOpenForm('online')}
                  className="w-full text-white font-black py-4 rounded-2xl text-base transition-all shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: accent }}
                >
                  🛒 Commander maintenant
                </button>

                {showCOD && (
                  <button
                    type="button"
                    onClick={() => handleOpenForm('cod')}
                    className="w-full font-bold py-3.5 rounded-2xl text-sm border-2 transition-all hover:opacity-80"
                    style={{ borderColor: accent, color: accent }}
                  >
                    💵 Payer à la livraison
                  </button>
                )}
              </div>
            )}

            {/* ── Badges de confiance ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Livraison rapide' },
                { icon: Shield, label: 'Paiement sécurisé' },
                { icon: RotateCcw, label: 'Retour facile' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 border border-gray-100 text-center"
                >
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Badge droit de revente ──
                Visible uniquement si le produit autorise la revente par l'acheteur */}
            {product.resale_allowed && (
              <div className="flex items-center gap-3 bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-4">
                <span className="text-2xl flex-shrink-0">🔄</span>
                <div>
                  <p className="text-sm font-bold text-[#0F7A60]">Droits de revente inclus</p>
                  <p className="text-xs text-[#0F7A60]/70 mt-0.5">
                    Achetez une fois, revendez à vos clients et gagnez de l&apos;argent.
                    {product.resale_commission && product.resale_commission > 0
                      ? ` ${product.resale_commission}% reversé au créateur.`
                      : ' Aucune commission au créateur.'}
                  </p>
                </div>
              </div>
            )}

            {/* ── Description ────────────────────────────────────────── */}
            {product.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Description
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {product.description.split('\n').map((line, i) =>
                    line.trim() ? (
                      <p key={i} className="mb-2 text-sm leading-relaxed">{line}</p>
                    ) : (
                      <br key={i} />
                    )
                  )}
                </div>
              </div>
            )}

            {/* ── Avis clients ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <ReviewWidget
                storeId={storeId}
                productId={product.id}
                showForm={true}
              />
            </div>

            {/* ── Formulaire slide-down ───────────────────────────────── */}
            <div
              id="checkout-form-section"
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showForm ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {showForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Titre section */}
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-sm font-black text-gray-800">📋 Vos informations</h2>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-bold"
                    >
                      ✕ Fermer
                    </button>
                  </div>
                  {/* CheckoutForm — réutilise le composant existant tel quel */}
                  <CheckoutForm
                    product={{ ...product, store: product.store }}
                    variants={variants}
                    computedPrice={computedPrice}
                    vendorPlan={vendorPlan}
                    defaultUseCOD={formMode === 'cod'}
                    defaultVariantId={selectedVariantId}
                    defaultQuantity={quantity}
                  />
                </div>
              )}
            </div>

          </div>
          {/* fin colonne droite */}
        </div>
      </div>

      {/* Badge PDV Pro */}
      <PoweredByBadge />

      {/* ── Sticky bar mobile ──────────────────────────────────────────────── */}
      {!showForm && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 safe-area-inset-bottom">
          <div className="flex items-center gap-3">
            {/* Prix */}
            <div className="flex-shrink-0">
              {computedPrice.hasDiscount && (
                <p className="text-[10px] text-gray-400 line-through leading-none">
                  {product.price.toLocaleString('fr-FR')} F
                </p>
              )}
              <p className="font-black text-lg leading-none" style={{ color: accent }}>
                {finalPrice.toLocaleString('fr-FR')}{' '}
                <span className="text-xs font-medium opacity-60">FCFA</span>
              </p>
            </div>

            {/* Bouton commander */}
            <button
              type="button"
              onClick={() => handleOpenForm('online')}
              className="flex-1 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-lg active:scale-95"
              style={{ backgroundColor: accent }}
            >
              🛒 Commander maintenant
            </button>
          </div>
        </div>
      )}

      {/* Espace pour la sticky bar mobile */}
      {!showForm && <div className="lg:hidden h-24" />}
    </div>
  )
}
