'use client'

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
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
      >
        <X size={32} />
      </button>

      {/* Navigation Gauche */}
      {images.length > 1 && (
        <button 
          onClick={() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
          className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      {/* Image Centrale */}
      <div className="max-w-[90vw] max-h-[85vh] relative group">
        <img 
          src={images[index]} 
          alt={`Image ${index + 1}`} 
          className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
        />
        
        {/* Compteur */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
          {index + 1} / {images.length}
        </div>
      </div>

      {/* Navigation Droite */}
      {images.length > 1 && (
        <button 
          onClick={() => setIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
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
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                index === i ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
