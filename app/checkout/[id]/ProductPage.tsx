/* eslint-disable react/forbid-dom-props */
'use client'
'use client'

// ─── Page Produit Premium — Style Shopify ─────────────────────────────────────
// Galerie d'images, variants, sticky bar mobile, slide-down formulaire,
// badges de confiance et intégration SocialProofBanner.

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, ShoppingBag, RotateCcw, Truck, ChevronLeft, ChevronRight, Minus, Plus, Lock, ShieldCheck, BadgeCheck, MessageCircle, ChevronDown, Facebook, Link2, Check, Timer, Tags, Home, Compass, Store, Star, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { CheckoutForm } from './CheckoutForm'
import { EleganceTemplate } from './templates/EleganceTemplate'
import { SalesLetterTemplate } from './templates/SalesLetterTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'
import { VideoFirstTemplate } from './templates/VideoFirstTemplate'
import { PortfolioTemplate } from './templates/PortfolioTemplate'
import StockCountdown from '@/components/widgets/StockCountdown'
import VisitorCounter from '@/components/widgets/VisitorCounter'
import LocalPaymentBadges from '@/components/widgets/LocalPaymentBadges'
import { PoweredByBadge } from '@/components/branding/PoweredByBadge'
import { ReviewWidget } from '@/components/reviews/ReviewWidget'
import { ProductQA } from '@/components/reviews/ProductQA'
import { ProductJsonLd } from '@/components/seo/JsonLd'
import { FortuneWheelPopup } from '@/components/storefront/FortuneWheelPopup'
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
    coaching_type?: 'individual' | 'group' | null
    max_participants?: number | null
    payment_type?: string | null
    recurring_interval?: string | null
    resale_allowed?: boolean
    resale_commission?: number | null
    digital_files?: any[] | null
    coaching_durations?: number[] | null
    coaching_is_pack?: boolean | null
    coaching_pack_count?: number | null
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
      social_links?: Record<string, string>
      coaching_max_per_day?: number | null
      coaching_min_notice?: number | null
      free_shipping_threshold?: number | null
      gamification_active?: boolean
      gamification_config?: unknown | null
      theme_funnel?: string | null
    }
    bump_active?: boolean
    bump_product_id?: string | null
    bump_offer_text?: string | null
    template?: string | null
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
  blockedDates?: any[]
  bookedSlots?: Record<string, number>
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
  bumpProduct?: {
    id: string
    name: string
    price: number
    images: string[]
    type: string
  } | null
  clientProfile?: any
  recentOrderSlot?: React.ReactNode
}

// ─── Composant Galerie ────────────────────────────────────────────────────────

// ─── Sticky Desktop Bar ───────────────────────────────────────────────────────
function StickyDesktopBar({ productName, price, accent, hasDiscount, originalPrice, onBuy, showForm }: {
  productName: string; price: number; accent: string; hasDiscount: boolean; originalPrice: number; onBuy: () => void; showForm: boolean
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 700)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible || showForm) return null

  return (
    <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 animate-in slide-in-from-top-6 fade-in">
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <h2 className="font-black text-gray-900 text-sm truncate max-w-md">{productName}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through font-medium">{originalPrice.toLocaleString('fr-FR')} F</span>
              )}
              <span className="font-black text-lg" {...{ style: { color: accent } }}>{price.toLocaleString('fr-FR')} <span className="text-xs opacity-70">FCFA</span></span>
            </div>
            <button
              onClick={onBuy}
              className="text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95"
              {...{ style: { backgroundColor: accent } }}
            >
              Commander
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Galerie d'Images avec Zoom et Touch Swipe ────────────────────────────────
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
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Swipe mobile minimum distance
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) next()  // Swipe left → next
      else prev()               // Swipe right → prev
    }
  }

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
        {...{ style: { backgroundColor: `${accent}11` } }}
      >
        <ShoppingBag className="w-20 h-20 opacity-20" {...{ style: { color: accent } }} />
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={images[activeIndex]}
          alt={`${productName} — image ${activeIndex + 1}`}
          fill
          unoptimized
          className={`object-cover transition-transform ${isHovering ? 'duration-150 ease-out' : 'duration-500 ease-in-out'}`}
          {...{ style: isHovering && window.innerWidth >= 1024 ? zoomStyle : {} }}
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
                {...{ style: i === activeIndex ? { backgroundColor: accent } : {} }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniatures (Visibles sur tous les écrans) */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x mt-4">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Miniature ${i + 1}`}
              className={`flex-shrink-0 w-[4.5rem] h-[4.5rem] rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                i === activeIndex 
                  ? 'shadow-md bg-white scale-105' 
                  : 'border-transparent opacity-60 bg-[#F9FAFB] hover:opacity-100'
              }`}
              {...{ style: i === activeIndex ? { borderColor: accent } : {} }}
            >
              <Image fill sizes="64px" unoptimized src={src} alt={productName || "Image produit"} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Variables Dynamiques de Thème ──────────────────────────────────────────
function getThemeClasses(theme: string) {
  switch (theme) {
    case 'cinematic':
      return {
        bg: 'bg-gray-950 text-gray-100',
        card: 'bg-gray-900 border-gray-800 shadow-2xl',
        input: 'bg-gray-800 border-gray-700 text-white',
        text: 'text-gray-100',
        textMuted: 'text-gray-400',
        border: 'border-gray-800',
      }
    case 'cream_elegant':
      return {
        bg: 'bg-[#FAF9F6] text-gray-900', // Coquille d'œuf
        card: 'bg-white border-[#E8E6DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[2rem]',
        input: 'bg-[#F5F4EF] border-[#E8E6DF] text-gray-900 focus:bg-white',
        text: 'text-[#1C201F]', // Vert très très sombre
        textMuted: 'text-[#7D827D]',
        border: 'border-[#E8E6DF]',
      }
    default: // classic
      return {
        bg: 'bg-[#FAFAF7] text-gray-900',
        card: 'bg-white border-gray-100 shadow-sm rounded-2xl',
        input: 'bg-white border-gray-200 text-gray-900',
        text: 'text-gray-900',
        textMuted: 'text-gray-500',
        border: 'border-gray-100',
      }
  }
}

export default function ProductPage({
  product,
  variants,
  computedPrice,
  vendorPlan = 'gratuit',
  storeId,
  deliveryZones = [],
  coachingSlots = [],
  blockedDates = [],
  bookedSlots = {},
  similarProducts = [],
  telegramCommunity,
  bumpProduct,
  clientProfile,
  recentOrderSlot,
}: ProductPageProps) {
  // ── Moteur Config JSON (Layout, Theme, Couleur) ──────────────────────────
  const [layoutTemplate, themeOverride, colorOverride] = useMemo(() => {
    try {
      if (!product.template) return ['default', null, null]
      const config = JSON.parse(product.template)
      return [config.layout || 'default', config.theme || null, config.color || null]
    } catch {
      return [product.template || 'default', null, null]
    }
  }, [product.template])

  const theme = themeOverride || product.store.theme_funnel || 'classic'
  const t = getThemeClasses(theme)
  const accent = colorOverride || product.store.primary_color || '#0F7A60'

  const getIntervalSuffix = (interval?: string | null) => {
    switch(interval) {
      case 'weekly': return ' / sem'
      case 'monthly': return ' / mois'
      case 'quarterly': return ' / trim'
      case 'yearly': return ' / an'
      default: return ''
    }
  }

  const bunnyVideoId = product.digital_files?.find(
    (f: {bunny_video_id?: string}) => f.bunny_video_id
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

  // -- Countdown Logic --
  const promoEndsAt = useMemo(() => {
    return computedPrice.activePromo?.ends_at 
      ? new Date(computedPrice.activePromo.ends_at) 
      : null
  }, [computedPrice.activePromo])

  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null)
  
  useEffect(() => {
    if (!promoEndsAt) return
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = promoEndsAt.getTime() - now
      
      if (distance < 0) {
        clearInterval(interval)
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [promoEndsAt])

  // Variant sélectionné
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null
  const variantStock    = selectedVariant?.stock ?? 99

  // Prix calculé avec variant
  const baseProductPrice = computedPrice.hasDiscount
    ? computedPrice.finalPrice
    : product.price
  const finalPrice = baseProductPrice + (selectedVariant?.price_adjust ?? 0)
  const calculatedTotal = finalPrice * quantity

  // --- NOUVEAU : WhatsApp direct ---
  const rawWhatsapp = product.store.social_links?.whatsapp
  const whatsappNumber = rawWhatsapp ? rawWhatsapp.replace(/[^0-9]/g, '') : null
  const isWhatsappCallable = !!whatsappNumber
  const whatsappMessage = encodeURIComponent(`Bonjour, je veux commander "${product.name}" à ${calculatedTotal.toLocaleString('fr-FR')} FCFA. (Quantité souhaitée : ${quantity})`)
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  const showCOD = product.type === 'physical' 
    && product.cash_on_delivery === true 
    && (product.store.vendor_type === 'physical' || product.store.vendor_type === 'hybrid')

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

  const floatingNavNode = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:top-6 md:bottom-auto md:left-6 md:translate-x-0 z-[100] animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-4 duration-500 fill-mode-both" {...{ style: { animationDelay: '0.2s' } }}>
      <div className="bg-white/80 backdrop-blur-3xl border border-white p-1.5 rounded-[100px] shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center gap-1.5">
        <div className="relative group">
          <Link href="/" className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-emerald-600 transition-all font-bold" aria-label="Accueil">
            <Home size={20} strokeWidth={2.5} />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
            Accueil
          </span>
        </div>
        
        <div className="relative group">
          <Link href="/vendeurs" className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-emerald-600 transition-all font-bold" aria-label="Marketplace">
             <Compass size={20} strokeWidth={2.5} />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
            Marketplace
          </span>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1.5"></div>

        <div className="relative group">
          <Link href={`/${product.store.slug}`} className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md hover:text-gray-900 transition-all font-bold" aria-label="Boutique">
             <Store size={20} strokeWidth={2.5} />
          </Link>
          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:top-full md:mt-2 md:bottom-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl pointer-events-none">
            Boutique
          </span>
        </div>
      </div>
    </div>
  )

  const checkoutFormNode = (
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
      blockedDates={blockedDates}
      bookedSlots={bookedSlots}
      bumpProduct={bumpProduct}
      clientProfile={clientProfile}
    />
  )

  const imageGalleryNode = (
    <ImageGallery
      images={product.images ?? []}
      productName={product.name}
      accent={accent}
    />
  )

  if (layoutTemplate === 'elegance') {
    return (
      <>
        {floatingNavNode}
        <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />
        <EleganceTemplate 
          product={product} 
          accent={accent}
          bunnyVideoId={bunnyVideoId}
          bunnyLibraryId={bunnyLibraryId}
          groupedVariants={groupedVariants}
          basePrice={computedPrice.finalPrice}
          handleOpenForm={handleOpenForm}
          showForm={showForm}
          checkoutFormNode={checkoutFormNode}
          imageGalleryNode={imageGalleryNode}
        />
        <FortuneWheelPopup
          storeId={product.store.id}
          active={product.store.gamification_active ?? false}
          config={product.store.gamification_config}
        />
      </>
    )
  }

  if (layoutTemplate === 'sales_letter') {
    return (
      <>
        {floatingNavNode}
        <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />
        <SalesLetterTemplate 
          product={product} 
          basePrice={computedPrice.finalPrice}
          handleOpenForm={handleOpenForm}
          showForm={showForm}
          checkoutFormNode={checkoutFormNode}
          imageGalleryNode={imageGalleryNode}
        />
        <FortuneWheelPopup
          storeId={product.store.id}
          active={product.store.gamification_active ?? false}
          config={product.store.gamification_config}
        />
      </>
    )
  }

  if (layoutTemplate === 'minimal') {
    return (
      <>
        {floatingNavNode}
        <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />
        <MinimalTemplate 
          product={product} 
          accent={accent}
          basePrice={computedPrice.finalPrice}
          handleOpenForm={handleOpenForm}
          showForm={showForm}
          checkoutFormNode={checkoutFormNode}
          imageGalleryNode={imageGalleryNode}
        />
        <FortuneWheelPopup
          storeId={product.store.id}
          active={product.store.gamification_active ?? false}
          config={product.store.gamification_config}
        />
      </>
    )
  }

  if (layoutTemplate === 'video_first') {
    return (
      <>
        {floatingNavNode}
        <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />
        <VideoFirstTemplate 
          product={product} 
          accent={accent}
          bunnyVideoId={bunnyVideoId}
          bunnyLibraryId={bunnyLibraryId}
          basePrice={computedPrice.finalPrice}
          handleOpenForm={handleOpenForm}
          showForm={showForm}
          checkoutFormNode={checkoutFormNode}
          imageGalleryNode={imageGalleryNode}
        />
        <FortuneWheelPopup
          storeId={product.store.id}
          active={product.store.gamification_active ?? false}
          config={product.store.gamification_config}
        />
      </>
    )
  }

  if (layoutTemplate === 'portfolio') {
    return (
      <>
        {floatingNavNode}
        <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />
        <PortfolioTemplate 
          product={product} 
          accent={accent}
          basePrice={computedPrice.finalPrice}
          handleOpenForm={handleOpenForm}
          showForm={showForm}
          checkoutFormNode={checkoutFormNode}
          imageGalleryNode={imageGalleryNode}
        />
        <FortuneWheelPopup
          storeId={product.store.id}
          active={product.store.gamification_active ?? false}
          config={product.store.gamification_config}
        />
      </>
    )
  }

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-500`}>
      {floatingNavNode}
      <ProductJsonLd product={product as any} storeName={product.store.name} storeSlug={product.store.slug} />

      {/* ── Header boutique ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + Nom boutique */}
          <Link href={`/${product.store.slug}`} className="flex items-center gap-2.5 group">
            {product.store.logo_url ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <Image
                  src={product.store.logo_url}
                  alt={product.store.name}
                  fill
                  sizes="32px"
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                {...{ style: { backgroundColor: accent } }}
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
            {imageGalleryNode}
          </div>

          {/* ═══ Colonne droite — Infos produit ══════════════════════════════ */}
          <div className="space-y-6">

            {/* ── Nom produit ────────────────────────────────────────────── */}
            <div className={`${t.card} p-6 sm:p-8 lg:bg-transparent lg:border-none lg:shadow-none lg:p-0`}>
              <h1 className={`text-3xl sm:text-4xl lg:text-[2.75rem] font-black ${t.text} tracking-tighter leading-[1.1]`}>
                {product.name}
              </h1>
              
              {/* ── Social Share ────────────────────────────────────────── */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Regarde ce produit sur Yayyam ! ${window.location.href}`)}`, '_blank')}
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
                <span className="text-xl md:text-2xl text-gray-400 line-through font-bold">
                  {(product.price * quantity).toLocaleString('fr-FR')} FCFA
                </span>
              )}
              <span className="text-4xl md:text-5xl font-black tracking-tight" {...{ style: { color: accent } }}>
                {calculatedTotal.toLocaleString('fr-FR')}{' '}
                <span className="text-xl md:text-2xl font-bold opacity-60">
                  FCFA{product.payment_type === 'recurring' ? getIntervalSuffix(product.recurring_interval) : ''}
                </span>
              </span>
              {discountBadge() && (
                <span
                  className="text-sm font-black px-3 py-1 rounded-full text-white shadow-sm flex items-center gap-1.5 animate-pulse"
                  {...{ style: { backgroundColor: accent } }}
                >
                  <Tags className="w-4 h-4" /> {discountBadge()}
                </span>
              )}
            </div>

            {/* ── Countdown Timer (Booster) ─────────────────────────────── */}
            {promoEndsAt && timeLeft && (timeLeft.d > 0 || timeLeft.h > 0 || timeLeft.m > 0 || timeLeft.s > 0) && (
              <div className="flex items-center gap-4 bg-gradient-to-r from-red-50 to-red-50/20 border border-red-100 p-3 lg:p-4 rounded-2xl max-w-max shadow-[0_4px_20px_rgb(239,68,68,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse"></div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                  <Timer className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-black uppercase text-red-500 tracking-widest leading-tight mb-1">L'offre expire dans</p>
                  <div className="text-red-700 font-black flex items-center gap-1.5 text-sm sm:text-base">
                    {timeLeft.d > 0 && <span>{timeLeft.d}j</span>}
                    <span className="w-8 py-0.5 text-center bg-white rounded-lg shadow-sm border border-red-100">{timeLeft.h.toString().padStart(2, '0')}</span> h
                    <span className="w-8 py-0.5 text-center bg-white rounded-lg shadow-sm border border-red-100">{timeLeft.m.toString().padStart(2, '0')}</span> m
                    <span className="w-8 py-0.5 text-center bg-white rounded-lg shadow-sm border border-red-100">{timeLeft.s.toString().padStart(2, '0')}</span> s
                  </div>
                </div>
              </div>
            )}

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
                              px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-300
                              ${isOutOfStock ? 'opacity-40 cursor-not-allowed line-through text-gray-400 border-gray-100 bg-gray-50' : ''}
                              ${isSelected && !isOutOfStock ? 'scale-105 shadow-[0_8px_20px_rgb(0,0,0,0.06)] bg-white' : !isOutOfStock ? 'border-gray-100 bg-[#F9FAFB] text-gray-600 hover:border-gray-300 hover:bg-white hover:shadow-sm' : ''}
                            `}
                            {...{ style: isSelected && !isOutOfStock
                                ? { borderColor: accent, backgroundColor: `${accent}0D`, color: accent }
                                : {} }}
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
                <div className="inline-flex items-center border-2 border-gray-100 bg-[#F9FAFB] rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                    className="w-12 h-12 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="w-14 text-center font-black text-lg text-gray-800">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Augmenter la quantité"
                    className="w-12 h-12 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Jauge Livraison Gratuite (Booster) ─────────────────── */}
            {product.type === 'physical' && product.store.free_shipping_threshold && product.store.free_shipping_threshold > 0 ? (
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-600 flex items-center gap-1"><Truck className="w-4 h-4" /> Livraison Gratuite</span>
                  <span className="text-gray-900">{product.store.free_shipping_threshold.toLocaleString('fr-FR')} FCFA</span>
                </div>
                
                {(() => {
                  const currentTotal = finalPrice * quantity
                  const threshold = product.store.free_shipping_threshold || 1
                  const progress = Math.min(100, (currentTotal / threshold) * 100)
                  const remaining = threshold - currentTotal
                  const isFree = remaining <= 0

                  return (
                    <>
                      <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${isFree ? 'bg-emerald-500' : 'bg-orange-400'}`}
                          {...{ style: { width: `${progress}%` } }}
                        />
                      </div>
                      <p className={`text-xs font-bold text-center mt-1 ${isFree ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {isFree ? 
                          '🎉 Félicitations ! Vous avez débloqué la livraison gratuite.' : 
                          `Plus que ${(remaining).toLocaleString('fr-FR')} FCFA pour la livraison gratuite !`
                        }
                      </p>
                    </>
                  )
                })()}
              </div>
            ) : null}

            {/* ── SocialProof Elements ───────────────────────────────────── */}
            <div className="flex flex-col gap-2 w-full">
              <StockCountdown stock={variantStock} threshold={10} />
              <VisitorCounter productId={product.id} />
              {recentOrderSlot}
            </div>

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
                  
                  {/* BANNERE CONVERSION (Mode Cash) — conditionnel */}
                  {showCOD ? (
                    <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl mb-4 flex items-center justify-center gap-2 border border-emerald-100 shadow-sm leading-tight text-center">
                      <span className="flex-shrink-0 text-base">✅</span>
                      Paiement à la livraison disponible + Mobile Money
                    </div>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl mb-4 flex items-center justify-center gap-2 border border-emerald-100 shadow-sm leading-tight text-center">
                      <span className="flex-shrink-0 text-base">📱</span>
                      Paiement sécurisé via Mobile Money
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenForm('online')}
                    className="w-full text-white font-black py-4.5 min-h-[60px] rounded-[1.25rem] text-[15px] uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2.5 relative overflow-hidden group"
                    {...{ style: { backgroundColor: accent, boxShadow: `0 8px 40px -10px ${accent}` } }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 animate-bounce" />
                      Commander maintenant
                    </span>
                  </button>

                  {isWhatsappCallable && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full font-black py-4 flex items-center justify-center gap-2 rounded-2xl text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 bg-[#25D366] text-white"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Commander sur WhatsApp
                    </a>
                  )}

                  {showCOD && (
                    <button
                      type="button"
                      onClick={() => handleOpenForm('cod')}
                      className="w-full font-bold py-3.5 rounded-2xl text-sm border-2 transition-all hover:opacity-80"
                      {...{ style: { borderColor: accent, color: accent } }}
                    >
                      💵 Payer à la livraison
                    </button>
                  )}
                </div>

                {/* Badge Sécurité Mobile Money & Wave (Mode Cash) */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 mt-4 shadow-inner">
                  <LocalPaymentBadges />
                </div>
              </div>
            )}

            {/* ── Badges de confiance (Premium) ─────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center gap-2 bg-[#F9FAFB] rounded-2xl p-4 border border-gray-50 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 mb-1">
                  <Lock className="w-5 h-5" {...{ style: { color: accent } }} />
                </div>
                <span className="text-[11px] font-bold text-gray-600 leading-tight">Paiement 100% sécurisé</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 bg-[#F9FAFB] rounded-2xl p-4 border border-gray-50 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 mb-1">
                  <Truck className="w-5 h-5" {...{ style: { color: accent } }} />
                </div>
                <span className="text-[11px] font-bold text-gray-600 leading-tight">Livraison ultra-rapide</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 bg-[#F9FAFB] rounded-2xl p-4 border border-gray-50 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 mb-1">
                  <ShieldCheck className="w-5 h-5" {...{ style: { color: accent } }} />
                </div>
                <span className="text-[11px] font-bold text-gray-600 leading-tight">Garanti Satisfait ou Remboursé</span>
              </div>
              {product.store.kyc_status === 'verified' && (
                <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-[#0F7A60]/20 text-center shadow-sm bg-[#0F7A60]/5">
                  <BadgeCheck className="w-5 h-5 text-[#0F7A60]" />
                  <span className="text-xs font-bold text-[#0F7A60] leading-tight">Vendeur vérifié</span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-xl p-3 border border-gray-100 text-center shadow-sm">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-xs font-bold text-gray-500 leading-tight">Support WhatsApp</span>
              </div>
            </div>

            {/* ── Section Vendeur Premium ──────────────────────────── */}
            <div className="bg-gradient-to-br from-[#FAFAFA] to-white rounded-[2rem] border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              {product.store.logo_url ? (
                <img src={product.store.logo_url} alt={product.store.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-sm" {...{ style: { backgroundColor: accent } }}>
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
                <a href={product.store.social_links?.whatsapp || `https://wa.me/`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl text-xs font-bold text-white text-center transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2" {...{ style: { backgroundColor: accent } }}>
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


            {/* ── Volume Discounts — Tableau visuel ──────────────────── */}
            {(product.store as any).volume_discounts_active && (product.store as any).volume_discounts_config && (() => {
              const config = typeof (product.store as any).volume_discounts_config === 'string'
                ? JSON.parse((product.store as any).volume_discounts_config)
                : (product.store as any).volume_discounts_config
              const tiers = Array.isArray(config?.tiers) ? config.tiers : []
              if (tiers.length === 0) return null
              return (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 mt-2 mb-2">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 mb-3">
                    <Tags className="w-4 h-4" {...{ style: { color: accent } }} /> Remises quantité
                  </h3>
                  <div className="grid gap-2">
                    {tiers.map((tier: { qty: number; discount_pct: number }, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white/80 rounded-xl px-4 py-2.5 border border-amber-100/50">
                        <span className="text-sm font-bold text-gray-700">Achetez {tier.qty}+</span>
                        <span className="text-sm font-black px-3 py-1 rounded-lg" {...{ style: { color: accent, backgroundColor: accent + '15' } }}>-{tier.discount_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}




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
                  {checkoutFormNode}
                </div>
              )}
            </div>

          </div>
          {/* fin colonne droite */}
        </div>

      </div>
      {/* ── FIN DU MAIN CONTENEUR ── */}

      {/* ── SECTION FULL-WIDTH: POURQUOI NOUS CHOISIR (WHITE BACKGROUND) ── */}
      <div className="w-full bg-white border-y border-gray-100 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center justify-center bg-yellow-50 text-yellow-600 w-16 h-16 rounded-3xl mb-6 shadow-sm border border-yellow-100">
              <Star className="w-8 h-8 fill-yellow-500" />
            </span>
            <h2 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight">Pourquoi nous choisir ?</h2>
            <p className="text-gray-500 text-lg font-medium mt-4 max-w-2xl mx-auto">La promesse d'une expérience d'achat incomparable, de la commande à la livraison.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="bg-[#F9FAFB] rounded-[2rem] p-8 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="font-black text-gray-900 text-xl mb-3">Qualité supérieure</h3>
              <p className="text-gray-600 text-base leading-relaxed">Chaque article est sélectionné rigoureusement pour garantir votre satisfaction absolue.</p>
            </div>
            {product.type === 'physical' && (
              <div className="bg-[#F9FAFB] rounded-[2rem] p-8 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <Truck className="w-10 h-10 text-emerald-500 mb-6" />
                <h3 className="font-black text-gray-900 text-xl mb-3">Expédition Rapide</h3>
                <p className="text-gray-600 text-base leading-relaxed">Colis discrètement protégé et expédié avec un suivi en temps réel.</p>
              </div>
            )}
            <div className="bg-[#F9FAFB] rounded-[2rem] p-8 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <MessageCircle className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="font-black text-gray-900 text-xl mb-3">Assistance VIP</h3>
              <p className="text-gray-600 text-base leading-relaxed">Notre équipe dédiée est réactive sur WhatsApp 7j/7 pour vous accompagner.</p>
            </div>
            <div className="bg-[#F9FAFB] rounded-[2rem] p-8 border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="font-black text-gray-900 text-xl mb-3">Paiement Sécurisé</h3>
              <p className="text-gray-600 text-base leading-relaxed">Transactions cryptées via Mobile Money ou Cartes Bancaires. Sans aucun risque.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION FULL-WIDTH: DESCRIPTION (INVISIBLE BASE) ── */}
      {product.description && (
        <div className="w-full py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-12 text-center tracking-tight flex flex-col items-center gap-4">
              <span className="w-12 h-1.5 rounded-full" {...{ style: { backgroundColor: accent } }}></span>
              À propos de ce produit
            </h2>
            <div className="bg-white rounded-[3rem] border border-gray-100 p-8 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center sm:text-left">
              <div className="prose prose-lg md:prose-xl max-w-none text-gray-700 leading-loose font-medium">
                {product.description.split('\n').map((line, i) =>
                  line.trim() ? <p key={i} className="mb-6">{line}</p> : <br key={i} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION FULL-WIDTH: GARANTIE IMMENSE (DARK EMERALD) ── */}
      <div className="w-full bg-[#064E3B] py-20 lg:py-32 relative overflow-hidden border-y border-[#065F46]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10B981] to-transparent"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 text-center md:text-left">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center shrink-0 border border-white/20 shadow-2xl">
            <ShieldCheck className="w-16 h-16 md:w-24 md:h-24 text-white" />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-md">
              Garantie Yayyam <br className="hidden md:block" />
              100% Satisfait ou Remboursé
            </h2>
            <p className="text-lg md:text-2xl text-emerald-100 font-medium leading-relaxed max-w-3xl drop-shadow">
              Testez le produit sans aucun risque. Retour garanti sous 7 jours après réception si le produit ne correspond pas à vos attentes. Votre satisfaction passe avant tout.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION FULL-WIDTH: Q&A ET AVIS (WHITE BACKGROUND) ── */}
      <div className="w-full bg-white py-20 lg:py-32 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 space-y-16">
          
          <div className="bg-[#F9FAFB] rounded-[3rem] border border-gray-100 shadow-sm p-8 md:p-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-10 flex items-center gap-4">
               <span className="text-4xl">❓</span> Questions Fréquentes
            </h2>
            <ProductQA productId={product.id} />
          </div>

          <div className="bg-[#F9FAFB] rounded-[3rem] border border-gray-100 shadow-sm p-8 md:p-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-10 flex items-center gap-4">
               <span className="text-4xl">⭐</span> Avis Clients
            </h2>
            <ReviewWidget
              storeId={storeId}
              productId={product.id}
              showForm={true}
            />
          </div>

        </div>
      </div>

      <div className="w-full bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-16">
          {/* ── Boosters / Gamification Globales ─────────────────────── */}
          <FortuneWheelPopup
            storeId={product.store.id}
            active={product.store.gamification_active ?? false}
            config={product.store.gamification_config}
          />

          {/* ── Produits Similaires ───────────────────────────────────── */}
          {similarProducts && similarProducts.length > 0 && (
            <div className="mt-16 lg:mt-24 border-t border-gray-100 pt-10">
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-10 text-center lg:text-left tracking-tight">Vous aimerez aussi</h2>
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
                      className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                    >
                      <div className="aspect-square relative bg-gray-50 overflow-hidden">
                        {imgUrl ? (
                           // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        {p.computedPrice.hasDiscount && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs sm:text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                            {discountValue}
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col justify-between h-[120px]">
                        <h3 className="text-sm lg:text-base font-bold text-gray-800 line-clamp-2 leading-snug group-hover:opacity-80 transition-opacity">{p.name}</h3>
                        <div className="mt-auto flex items-center flex-wrap gap-2">
                           <p className="font-black text-lg sm:text-xl" {...{ style: { color: accent } }}>
                             {p.computedPrice.finalPrice.toLocaleString('fr-FR')} <span className="text-xs sm:text-sm font-bold opacity-70">FCFA</span>
                           </p>
                           {p.computedPrice.hasDiscount && (
                              <p className="text-xs sm:text-sm font-bold text-gray-400 line-through">
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
      </div>


      {/* ── Trust & Protection Badges ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-3">
        {/* Yayyamtect */}
        <div className="flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl py-3 px-5">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800">Yayyamtect</p>
            <p className="text-xs text-emerald-600">Transaction sécurisée · Données chiffrées · Achat garanti</p>
          </div>
        </div>

        {/* KYC Verified Badge */}
        {product.store.kyc_status === 'verified' && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>
            Vendeur vérifié par Yayyam
          </div>
        )}
      </div>

      {/* Badge Yayyam */}
      <PoweredByBadge />

      {/* ── Sticky bar DESKTOP — au scroll ────────────────────────────── */}
      <StickyDesktopBar 
        productName={product.name}
        price={calculatedTotal}
        accent={accent}
        hasDiscount={computedPrice.hasDiscount}
        originalPrice={product.price * quantity}
        onBuy={() => handleOpenForm('online')}
        showForm={showForm}
      />

      {/* ── Sticky bar mobile ──────────────────────────────────────────────── */}
      {!showForm && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 safe-area-inset-bottom">
          
          {variantStock < 15 && variantStock > 0 && (
            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-4 py-1 rounded-t-xl text-xs font-bold text-white shadow-lg whitespace-nowrap ${variantStock < 5 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>
              {variantStock < 5 ? `🔥 Vite ! Plus que ${variantStock} en stock` : `⚠️ Stock limité : ${variantStock}`}
            </div>
          )}
          {variantStock === 0 && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-4 py-1 rounded-t-xl text-xs font-bold text-white bg-gray-500 shadow-lg whitespace-nowrap">
              ❌ Rupture de stock
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Prix */}
            <div className="flex-shrink-0">
              {computedPrice.hasDiscount && (
                <p className="text-xs text-gray-400 line-through leading-none">
                  {(product.price * quantity).toLocaleString('fr-FR')} F
                </p>
              )}
              <p className="font-black text-lg leading-none" {...{ style: { color: accent } }}>
                {calculatedTotal.toLocaleString('fr-FR')}{' '}
                <span className="text-xs font-medium opacity-60">FCFA</span>
              </p>
            </div>

            {/* Bouton commander */}
            <button
              type="button"
              onClick={() => handleOpenForm('online')}
              className="flex-1 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-lg active:scale-95"
              {...{ style: { backgroundColor: accent } }}
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
