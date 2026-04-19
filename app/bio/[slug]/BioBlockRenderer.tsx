'use client'

/* eslint-disable react/forbid-dom-props, @next/next/no-img-element, @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { ChevronDown, Download, ExternalLink, ShoppingBag } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
export type BioBlock =
  | { type: 'link'; id: string; title: string; url: string; icon?: string; isPrimary?: boolean; isActive?: boolean; bgColor?: string; textColor?: string; buttonShape?: string; animation?: string }
  | { type: 'gallery'; id: string; title?: string; images: string[]; layout?: 'grid' | 'carousel' }
  | { type: 'media-kit'; id: string; title?: string; stats: { label: string; value: string }[]; downloadUrl?: string; coverImage?: string }
  | { type: 'products'; id: string; title?: string; items: { name: string; price: number; image?: string; url: string }[] }
  | { type: 'portfolio'; id: string; title?: string; items: { image: string; title: string; description?: string; url?: string }[] }
  | { type: 'faq'; id: string; title?: string; items: { question: string; answer: string }[] }
  | { type: 'text'; id: string; content: string }
  | { type: 'divider'; id: string; dividerStyle?: 'line' | 'space' | 'dotted' }

interface BioBlockRendererProps {
  block: BioBlock
  theme: string
  brandColor: string
  idx: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCardClasses(theme: string): string {
  const isDark = ['dark', 'luxury', 'richy', 'show', 'shadow', 'ambiance', 'music'].includes(theme)
  const isGlass = ['glass', 'magnet', 'été'].includes(theme)
  
  if (isDark) return 'bg-white/5 border-white/10 text-white'
  if (isGlass) return 'bg-white/10 backdrop-blur-xl border-white/20 text-white'
  return 'bg-white border-gray-100 text-gray-900'
}

function getSubtextClasses(theme: string): string {
  const isDark = ['dark', 'luxury', 'richy', 'show', 'shadow', 'ambiance', 'music'].includes(theme)
  const isGlass = ['glass', 'magnet', 'été'].includes(theme)
  
  if (isDark) return 'text-gray-400'
  if (isGlass) return 'text-white/60'
  return 'text-gray-500'
}

// ── Block Renderers ───────────────────────────────────────────────────────────

function GalleryBlock({ block, theme, idx }: { block: Extract<BioBlock, { type: 'gallery' }>; theme: string; idx: number }) {
  const [activeImg, setActiveImg] = useState<string | null>(null)
  const cardClasses = getCardClasses(theme)
  const delay = `${(idx * 75) + 200}ms`

  const layout = block.layout || 'grid'

  return (
    <>
      <div
        className={`w-full rounded-3xl border p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 ${cardClasses}`}
        {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
      >
        {block.title && (
          <h3 className="font-black text-base mb-4">{block.title}</h3>
        )}

        {layout === 'grid' ? (
          <div className={`grid gap-2 ${block.images.length === 1 ? 'grid-cols-1' : block.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {block.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(img)}
                className="aspect-square rounded-2xl overflow-hidden border border-black/5 hover:scale-[1.03] transition-transform"
              >
                <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
            {block.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(img)}
                className="shrink-0 w-48 h-48 rounded-2xl overflow-hidden border border-black/5 snap-center hover:scale-[1.03] transition-transform"
              >
                <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {activeImg && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveImg(null)}
        >
          <img
            src={activeImg}
            alt="Aperçu"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setActiveImg(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}

function MediaKitBlock({ block, theme, brandColor, idx }: { block: Extract<BioBlock, { type: 'media-kit' }>; theme: string; brandColor: string; idx: number }) {
  const cardClasses = getCardClasses(theme)
  const subClasses = getSubtextClasses(theme)
  const delay = `${(idx * 75) + 200}ms`

  return (
    <div
      className={`w-full rounded-3xl border overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 ${cardClasses}`}
      {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
    >
      {/* Cover */}
      {block.coverImage && (
        <div className="w-full h-32 overflow-hidden">
          <img src={block.coverImage} alt="Media Kit Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5">
        <h3 className="font-black text-base mb-1">{block.title || 'Media Kit'}</h3>
        <p className={`text-xs font-medium mb-4 ${subClasses}`}>Chiffres clés & statistiques</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {block.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-3 text-center border border-black/5"
              {...{ style: { backgroundColor: `${brandColor}10` } }}
            >
              <div className="font-black text-lg" {...{ style: { color: brandColor } }}>{stat.value}</div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${subClasses}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Download */}
        {block.downloadUrl && (
          <a
            href={block.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            {...{ style: { backgroundColor: brandColor } }}
          >
            <Download size={16} /> Télécharger le Media Kit
          </a>
        )}
      </div>
    </div>
  )
}

function ProductsBlock({ block, theme, brandColor, idx }: { block: Extract<BioBlock, { type: 'products' }>; theme: string; brandColor: string; idx: number }) {
  const cardClasses = getCardClasses(theme)
  const delay = `${(idx * 75) + 200}ms`

  return (
    <div
      className={`w-full rounded-3xl border p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 ${cardClasses}`}
      {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
    >
      {block.title && (
        <h3 className="font-black text-base mb-4 flex items-center gap-2">
          <ShoppingBag size={16} /> {block.title}
        </h3>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {block.items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            className="shrink-0 w-40 rounded-2xl border border-black/5 overflow-hidden snap-center hover:scale-[1.03] transition-transform group"
          >
            {item.image ? (
              <div className="w-full aspect-square overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ) : (
              <div className="w-full aspect-square flex items-center justify-center text-4xl" {...{ style: { backgroundColor: `${brandColor}10` } }}>
                🛍️
              </div>
            )}
            <div className="p-3">
              <p className="text-xs font-bold truncate">{item.name}</p>
              <p className="text-sm font-black mt-1" {...{ style: { color: brandColor } }}>
                {item.price.toLocaleString('fr-FR')} F
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function PortfolioBlock({ block, theme, idx }: { block: Extract<BioBlock, { type: 'portfolio' }>; theme: string; idx: number }) {
  const cardClasses = getCardClasses(theme)
  const delay = `${(idx * 75) + 200}ms`

  return (
    <div
      className={`w-full rounded-3xl border p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 ${cardClasses}`}
      {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
    >
      {block.title && (
        <h3 className="font-black text-base mb-4">{block.title}</h3>
      )}

      <div className="grid grid-cols-2 gap-3">
        {block.items.map((item, i) => {
          const Wrapper = item.url ? 'a' : 'div'
          return (
            <Wrapper
              key={i}
              {...(item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {})}
              className="rounded-2xl overflow-hidden border border-black/5 group relative"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                <p className="text-white font-bold text-xs truncate">{item.title}</p>
                {item.description && (
                  <p className="text-white/70 text-[10px] font-medium truncate mt-0.5">{item.description}</p>
                )}
              </div>
              {item.url && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={14} className="text-white drop-shadow-md" />
                </div>
              )}
            </Wrapper>
          )
        })}
      </div>
    </div>
  )
}

function FaqBlock({ block, theme, brandColor, idx }: { block: Extract<BioBlock, { type: 'faq' }>; theme: string; brandColor: string; idx: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const cardClasses = getCardClasses(theme)
  const subClasses = getSubtextClasses(theme)
  const delay = `${(idx * 75) + 200}ms`

  return (
    <div
      className={`w-full rounded-3xl border p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 ${cardClasses}`}
      {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
    >
      {block.title && (
        <h3 className="font-black text-base mb-4">{block.title}</h3>
      )}

      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-black/5 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-bold text-sm pr-4">{item.question}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                {...{ style: { color: brandColor } }}
              />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-96' : 'max-h-0'}`}>
              <p className={`px-4 pb-4 text-sm font-medium leading-relaxed ${subClasses}`}>
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TextBlock({ block, theme, idx }: { block: Extract<BioBlock, { type: 'text' }>; theme: string; idx: number }) {
  const subClasses = getSubtextClasses(theme)
  const delay = `${(idx * 75) + 200}ms`

  return (
    <div
      className={`w-full text-center animate-in fade-in slide-in-from-bottom-4`}
      {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
    >
      <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${subClasses}`}>
        {block.content}
      </p>
    </div>
  )
}

function DividerBlock({ block, theme, idx }: { block: Extract<BioBlock, { type: 'divider' }>; theme: string; idx: number }) {
  const isDark = ['dark', 'luxury', 'richy', 'show', 'shadow', 'ambiance', 'music'].includes(theme)
  const isGlass = ['glass', 'magnet', 'été'].includes(theme)
  const delay = `${(idx * 75) + 200}ms`

  const color = isDark ? 'border-white/10' : isGlass ? 'border-white/20' : 'border-gray-200'
  const style = block.dividerStyle || 'line'

  if (style === 'space') {
    return <div className="h-6" {...{ style: { animationDelay: delay } }} />
  }

  return (
    <div
      className={`w-full animate-in fade-in ${style === 'dotted' ? `border-t-2 border-dotted ${color}` : `border-t ${color}`}`}
      {...{ style: { animationDelay: delay, animationFillMode: 'both' } }}
    />
  )
}

// ── Main Dispatcher ───────────────────────────────────────────────────────────
export default function BioBlockRenderer({ block, theme, brandColor, idx }: BioBlockRendererProps) {
  switch (block.type) {
    case 'gallery':
      return <GalleryBlock block={block} theme={theme} idx={idx} />
    case 'media-kit':
      return <MediaKitBlock block={block} theme={theme} brandColor={brandColor} idx={idx} />
    case 'products':
      return <ProductsBlock block={block} theme={theme} brandColor={brandColor} idx={idx} />
    case 'portfolio':
      return <PortfolioBlock block={block} theme={theme} idx={idx} />
    case 'faq':
      return <FaqBlock block={block} theme={theme} brandColor={brandColor} idx={idx} />
    case 'text':
      return <TextBlock block={block} theme={theme} idx={idx} />
    case 'divider':
      return <DividerBlock block={block} theme={theme} idx={idx} />
    default:
      return null // 'link' type is handled separately in page.tsx
  }
}
