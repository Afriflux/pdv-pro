'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  productName: string
  initialIndex?: number
}

export default function ProductImageViewer({ images, productName, initialIndex = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Since I can just add useCallback directly:
  const next = useCallback(() => setCurrentIndex(i => (i + 1) % images.length), [images.length])
  const prev = useCallback(() => setCurrentIndex(i => (i - 1 + images.length) % images.length), [images.length])

  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, next, prev])

  return (
    <>
      {/* Trigger — image cliquable partagée avec ProductCard */}
      <div
        className="absolute inset-0 z-10 cursor-zoom-in"
        onClick={(e) => { 
          e.preventDefault() // Évite de trigger le Link parent
          e.stopPropagation() 
          setCurrentIndex(initialIndex); 
          setIsOpen(true) 
        }}
      />

      {/* Overlay modal plein écran */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          {/* Bouton fermer */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsOpen(false)
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition z-10"
          >
            ✕
          </button>

          {/* Compteur */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 font-mono text-xs z-10 bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Navigation gauche */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                prev()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-2xl transition z-10"
            >
              ‹
            </button>
          )}

          {/* IMAGE PRINCIPALE avec filigrane */}
          <div className="relative w-[90vw] max-w-5xl h-[85vh] mx-16 flex items-center justify-center">
            <div className="relative w-full h-full max-w-full max-h-[85vh]">
              <Image
                src={images[currentIndex]}
                fill
                sizes="(max-width: 1024px) 90vw, 1024px"
                alt={productName}
                className="object-contain rounded-xl drop-shadow-2xl"
              />
            </div>

            {/* FILIGRANE YAYYAM CENTRAL */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rotate-[-30deg] select-none text-center">
                <p className="text-white/20 font-display font-bold text-5xl md:text-7xl tracking-widest whitespace-nowrap drop-shadow-md">
                  Yayyam
                </p>
                <p className="text-white/30 font-mono text-xs md:text-sm tracking-[0.5em] mt-2 drop-shadow-md">
                  yayyam.com
                </p>
              </div>
            </div>

            {/* Filigrane répété en grille subtile */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-white/10 font-display font-bold text-lg md:text-2xl rotate-[-30deg] whitespace-nowrap select-none drop-shadow-sm"
                  // eslint-disable-next-line
                  style={{
                    top: `${Math.max(10, (i % 3) * 40)}%`,
                    left: `${Math.max(10, Math.floor(i / 3) * 60)}%`,
                  }}
                >
                  Yayyam
                </div>
              ))}
            </div>
          </div>

          {/* Navigation droite */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                next()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-2xl transition z-10"
            >
              ›
            </button>
          )}

          {/* Miniatures en bas */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/50 p-2 rounded-2xl backdrop-blur-md">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentIndex(i)
                  }}
                  title={`Miniature ${i + 1}`}
                  aria-label={`Afficher image ${i + 1}`}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                    i === currentIndex
                      ? 'border-emerald shadow-lg shadow-emerald/30 scale-110'
                      : 'border-transparent hover:border-white/50 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Miniature ${i + 1}`} fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
