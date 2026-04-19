'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  productType?: string
}

export default function ProductImageGallery({ images, productName, productType }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasMultiple = images.length > 1

  const goTo = useCallback((index: number) => {
    if (index < 0) setActiveIndex(images.length - 1)
    else if (index >= images.length) setActiveIndex(0)
    else setActiveIndex(index)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1)
      if (e.key === 'ArrowRight') goTo(activeIndex + 1)
      if (e.key === 'Escape') setIsZoomed(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, goTo])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current > 0) goTo(activeIndex - 1)
      else goTo(activeIndex + 1)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const typeBadge = productType === 'digital' 
    ? { text: '⚡ Téléchargement Immédiat', color: 'text-indigo-600' }
    : productType === 'coaching' 
    ? { text: '🎙️ Session 1-on-1', color: 'text-amber-600' }
    : null

  return (
    <div className="w-full">
      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="w-full aspect-[4/5] md:aspect-square rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 relative group cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {/* Images stack */}
        <div className="relative w-full h-full">
          {images.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                i === activeIndex 
                  ? 'opacity-100 scale-100' 
                  : i < activeIndex 
                  ? 'opacity-0 -translate-x-4 scale-95' 
                  : 'opacity-0 translate-x-4 scale-95'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={img} 
                alt={`${productName} - Image ${i + 1}`} 
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isZoomed && i === activeIndex ? 'scale-[2.2]' : 'group-hover:scale-105'
                }`}
                {...(isZoomed && i === activeIndex ? { style: { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } } : {})}
                draggable="false"
              />
            </div>
          ))}
        </div>

        {/* Type Badge */}
        {typeBadge && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm z-10">
            <span className={`flex items-center gap-1.5 ${typeBadge.color}`}>{typeBadge.text}</span>
          </div>
        )}

        {/* Navigation Arrows (desktop only, multiple images) */}
        {hasMultiple && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
              aria-label="Image précédente"
            >
              ←
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
              aria-label="Image suivante"
            >
              →
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(i) }}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex 
                    ? 'w-6 h-2 bg-white shadow-md' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        {hasMultiple && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10">
            {activeIndex + 1}/{images.length}
          </div>
        )}

        {/* Zoom hint */}
        <div className={`absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
          🔍 Cliquer pour zoomer
        </div>
      </div>

      {/* Thumbnails Row */}
      {hasMultiple && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                i === activeIndex 
                  ? 'border-gray-900 shadow-md scale-105' 
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
              }`}
              aria-label={`Voir image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" draggable="false" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
