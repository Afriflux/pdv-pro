'use client'

import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LightboxProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)

  // Bloquer le scroll du corps
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setIndex((i) => (i < images.length - 1 ? i + 1 : 0))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300">
      {/* Bouton Fermer */}
      <button 
        onClick={onClose}
        title="Fermer la galerie"
        aria-label="Fermer"
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
      >
        <X size={32} />
      </button>

      {/* Navigation Gauche */}
      {images.length > 1 && (
        <button 
          onClick={() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
          title="Image précédente"
          aria-label="Précédent"
          className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      {/* Image Centrale */}
      <div className="w-[90vw] h-[85vh] relative group flex items-center justify-center">
        <div className="relative w-full h-full max-w-full max-h-[85vh]">
          <Image 
            src={images[index]} 
            alt={`Image ${index + 1}`} 
            fill
            sizes="90vw"
            className="object-contain drop-shadow-2xl"
          />
        </div>
        
        {/* Compteur */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
          {index + 1} / {images.length}
        </div>
      </div>

      {/* Navigation Droite */}
      {images.length > 1 && (
        <button 
          onClick={() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
          title="Image suivante"
          aria-label="Suivant"
          className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
        >
          <ChevronRight size={40} />
        </button>
      )}

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2 max-w-[80vw] overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              title={`Afficher image ${i + 1}`}
              aria-label={`Miniature ${i + 1}`}
              className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                index === i ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`Miniature ${i + 1}`} fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
