/* eslint-disable react/forbid-dom-props */
'use client'

// ─── Page Produit Premium — Style Shopify ─────────────────────────────────────
// Galerie d'images, variants, sticky bar mobile, slide-down formulaire,
// badges de confiance et intégration SocialProofBanner.

import { useState } from 'react'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, ShoppingBag, RotateCcw, Truck, ChevronLeft, ChevronRight, Minus, Plus, Lock, ShieldCheck, BadgeCheck, MessageCircle, ChevronDown, Facebook, Link2, Check } from 'lucide-react'
import { CheckoutForm } from './CheckoutForm'
import SocialProofBanner from '@/components/widgets/SocialProofBanner'
import { ReviewWidget } from '@/components/reviews/ReviewWidget'
import { ProductQA } from '@/components/reviews/ProductQA'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import { ProductJsonLd } from '@/components/seo/JsonLd'
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
    digital_files?: any[]
    store: {
      id: string
      name: string
      slug: string
      logo_url: string | null
      primary_color: string | null
      vendor_type: 'digital' | 'physical' | 'hybrid' | null
      kyc_status: string | null
      created_at: string
      productsCount: number
      social_links?: any
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
  deliveryZones?: { id: string; name: string; fee: number; delay: string | null; active: boolean }[]
  coachingSlots?: any[]
  similarProducts?: {
    id: string
    name: string
    price: number
    images: string[]
    category: string | null
    computedPrice: {
      hasDiscount: boolean
      finalPrice: number
      activePromo: PromotionData | null
    }
  }[]
  telegramCommunity?: {
    chat_title: string
    members_count: number
  } | null
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
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({})
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)',
    })
  }

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
      <div 
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 group lg:cursor-crosshair"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setZoomStyle({}) }}
        onMouseMove={handleMouseMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`${productName} — image ${activeIndex + 1}`}
          className={`w-full h-full object-cover transition-transform ${isHovering ? 'duration-150 ease-out' : 'duration-500 ease-in-out'}`}
          style={isHovering && window.innerWidth >= 1024 ? zoomStyle : {}} // Zoom only on desktop lg
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
                i === activeIndex 
                  ? 'border-transparent shadow-sm bg-white' 
                  : 'border-transparent opacity-60 bg-gray-100 hover:opacity-100 mix-blend-multiply'
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
  deliveryZones = [],
  coachingSlots = [],
  similarProducts = [],
  telegramCommunity,
}: ProductPageProps) {
  const accent = product.store.primary_color || '#0F7A60'

  const bunnyVideoId = product.digital_files?.find(
    (f: any) => f.bunny_video_id
  )?.bunny_video_id as string | undefined

  const bunnyLibraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID

  // États UI
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  )
  const [quantity, setQuantity]       = useState(1)
  const [showForm, setShowForm]       = useState(false)
  const [formMode, setFormMode]       = useState<'online' | 'cod'>('online')
  const [copied, setCopied]           = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />

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

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 pt-6 lg:pt-8 pb-2">
        <nav className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#0F7A60] hover:underline transition-colors">Accueil</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/${product.store.slug}`} className="hover:text-[#0F7A60] hover:underline transition-colors">{product.store.name}</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400 truncate">{product.name}</span>
        </nav>
      </div>

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-6 lg:pb-10 pt-2 lg:pt-4">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">

          {/* ═══ Colonne gauche — Galerie ════════════════════════════════════ */}
          <div className="lg:sticky lg:top-24 lg:self-start mb-6 lg:mb-0">
            {/* Player vidéo Bunny.net */}
            {bunnyVideoId && bunnyLibraryId && (
              <div className="rounded-2xl overflow-hidden bg-black aspect-video mb-4">
                <iframe
                  src={`https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}?autoplay=false&preload=true`}
                  title="Aperçu vidéo du produit"
                  loading="lazy"
                  className="w-full h-full border-0"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
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
              
              {/* ── Social Share ────────────────────────────────────────── */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Regarde ce produit sur PDV Pro ! ${window.location.href}`)}`, '_blank')}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#25D366] hover:text-white transition-all hover:scale-105"
                  title="Partager sur WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-[#1877F2] hover:text-white transition-all hover:scale-105"
                  title="Partager sur Facebook"
                >
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-800 hover:text-white transition-all hover:scale-105"
                  title="Copier le lien"
                >
                  {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> : <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
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

            {/* ── Urgent Stock & Livraison Estimée ────────────────────── */}
            {!showForm && (
              <div className="hidden lg:block space-y-4">
                {variantStock === 0 ? (
                  <p className="text-red-600 font-black text-sm">❌ Rupture de stock</p>
                ) : variantStock < 5 ? (
                  <p className="text-red-600 font-black text-sm animate-pulse">🔥 Plus que {variantStock} en stock — commandez vite !</p>
                ) : variantStock < 15 ? (
                  <p className="text-orange-500 font-bold text-sm">⚠️ Stock limité — {variantStock} disponibles</p>
                ) : null}

                <div className="space-y-3">
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
              </div>
            )}

            {/* ── Badges de confiance (améliorés) ─────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 leading-tight">Paiement sécurisé</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <Truck className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 leading-tight">Livraison suivie</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 leading-tight">Satisfait ou remboursé 7j</span>
              </div>
              {product.store.kyc_status === 'verified' && (
                <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-[#0F7A60]/20 text-center shadow-sm bg-[#0F7A60]/5">
                  <BadgeCheck className="w-5 h-5 text-[#0F7A60]" />
                  <span className="text-[10px] font-bold text-[#0F7A60] leading-tight">Vendeur vérifié</span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 leading-tight">Support WhatsApp</span>
              </div>
            </div>

            {/* ── Section Vendeur Etsy-style ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
              {product.store.logo_url ? (
                <img src={product.store.logo_url} alt={product.store.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-sm" style={{ backgroundColor: accent }}>
                  {product.store.name[0]}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-black text-gray-900 text-lg flex items-center justify-center sm:justify-start gap-1.5">
                  {product.store.name}
                  {product.store.kyc_status === 'verified' && <BadgeCheck className="w-4 h-4 text-[#0F7A60]" />}
                </h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">
                  {product.store.productsCount} produits 
                  {product.store.created_at && ` • Membre depuis ${format(new Date(product.store.created_at), 'MMM yyyy', { locale: fr })}`}
                </p>
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-500">
                  <Truck className="w-3.5 h-3.5" /> Livraison estimée : {format(addDays(new Date(), 2), 'EEEE d MMMM', { locale: fr })}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Link href={`/${product.store.slug}`} className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-center transition-colors">
                  Voir la boutique
                </Link>
                <a href={product.store.social_links?.whatsapp || `https://wa.me/`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl text-xs font-bold text-white text-center transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                  <MessageCircle className="w-4 h-4" />
                  Contacter
                </a>
              </div>
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

            {/* ── Badge Telegram Communauté ──
                Visible uniquement si telegramCommunity existe */}
            {telegramCommunity && (
              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-inner">
                  ✈️
                </div>
                <div>
                  <p className="text-sm font-black text-blue-900 leading-tight">Inclut l&apos;accès au groupe privé</p>
                  <p className="text-xs font-bold text-blue-700/80 mt-1 flex items-center gap-1.5">
                    <span className="truncate max-w-[150px] inline-block">{telegramCommunity.chat_title}</span>
                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                    <span className="flex items-center gap-1">👥 {telegramCommunity.members_count || 0} membres</span>
                  </p>
                </div>
              </div>
            )}

            {/* ── Description ────────────────────────────────────────── */}
            {product.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
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

            {/* ── Politique de retour ────────────────────────────────── */}
            <details className="bg-white rounded-2xl border border-gray-100 shadow-sm [&_summary::-webkit-details-marker]:hidden group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-gray-800 select-none">
                <span className="flex items-center gap-2"><RotateCcw className="w-5 h-5 text-gray-400" /> Politique de retour</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-50 mt-1 pt-4">
                Retour accepté sous 7 jours après réception. Le produit doit être dans son état d'origine. Contactez le vendeur via WhatsApp pour initier un retour.
              </div>
            </details>

            {/* ── Avis clients ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <ReviewWidget
                storeId={storeId}
                productId={product.id}
                showForm={true}
              />
            </div>

            {/* ── Questions & Réponses ───────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5 shadow-sm">
              <ProductQA productId={product.id} />
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
                    deliveryZones={deliveryZones}
                    coachingSlots={coachingSlots}
                  />
                </div>
              )}
            </div>

          </div>
          {/* fin colonne droite */}
        </div>

        {/* ── Produits Similaires ───────────────────────────────────── */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-16 lg:mt-24 border-t border-gray-100 pt-10">
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-center lg:text-left">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {similarProducts.map((p) => {
                const imgUrl = p.images && p.images.length > 0 ? p.images[0] : null
                const discountValue = p.computedPrice.activePromo?.discount_type === 'percentage' 
                  ? `-${p.computedPrice.activePromo.discount_value}%`
                  : `-${p.computedPrice.activePromo?.discount_value?.toLocaleString('fr-FR')} F`
                
                return (
                  <Link 
                    key={p.id} 
                    href={`/checkout/${p.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                  >
                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                      {imgUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {p.computedPrice.hasDiscount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded-full shadow-sm">
                          {discountValue}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:opacity-80 transition-opacity">{p.name}</h3>
                      <div className="mt-3 flex items-center flex-wrap gap-2">
                         <p className="font-black text-base sm:text-lg" style={{ color: accent }}>
                           {p.computedPrice.finalPrice.toLocaleString('fr-FR')} <span className="text-[10px] sm:text-xs opacity-70">FCFA</span>
                         </p>
                         {p.computedPrice.hasDiscount && (
                            <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                              {p.price.toLocaleString('fr-FR')} F
                            </p>
                         )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* Badge PDV Pro */}
      <PoweredByBadge />

      {/* ── Sticky bar mobile ──────────────────────────────────────────────── */}
      {!showForm && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 safe-area-inset-bottom">
          
          {variantStock < 15 && variantStock > 0 && (
            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-4 py-1 rounded-t-xl text-[10px] font-bold text-white shadow-lg whitespace-nowrap ${variantStock < 5 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>
              {variantStock < 5 ? `🔥 Vite ! Plus que ${variantStock} en stock` : `⚠️ Stock limité : ${variantStock}`}
            </div>
          )}
          {variantStock === 0 && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-4 py-1 rounded-t-xl text-[10px] font-bold text-white bg-gray-500 shadow-lg whitespace-nowrap">
              ❌ Rupture de stock
            </div>
          )}

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
