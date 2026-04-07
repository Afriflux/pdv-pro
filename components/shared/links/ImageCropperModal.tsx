import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check } from 'lucide-react'

// Utilitaire pour créer le canvas de crop
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export async function getCroppedImg(imageSrc: string, pixelCrop: { x: number, y: number, width: number, height: number }): Promise<File | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null)
      const file = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' })
      resolve(file)
    }, 'image/jpeg')
  })
}

interface ImageCropperModalProps {
  imageSrc: string | null
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedFile: File) => void
  aspectRatio: number
}

export function ImageCropperModal({ imageSrc, isOpen, onClose, onCropComplete, aspectRatio }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleValidation = async () => {
    if (imageSrc && croppedAreaPixels) {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedFile) {
        onCropComplete(croppedFile)
      }
    }
  }

  if (!isOpen || !imageSrc) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-white font-black text-lg">Ajuster l'image</h3>
          <button onClick={onClose} title="Fermer" aria-label="Fermer" className="text-white/50 hover:text-white transition-colors bg-white/5 rounded-full p-1.5">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative w-full h-[50vh] sm:h-[60vh] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-6 bg-[#1A1A1A] space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm font-medium">Zoom</span>
            <input 
              type="range" 
              title="Niveau de zoom"
              aria-label="Niveau de zoom"
              placeholder="Zoom"
              className="flex-1 accent-emerald-500" 
              value={zoom} 
              min={1} 
              max={3} 
              step={0.1} 
              onChange={(e) => setZoom(Number(e.target.value))} 
            />
          </div>
          <button 
            onClick={handleValidation}
            className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            <Check size={20} /> Valider la sélection
          </button>
        </div>
      </div>
    </div>
  )
}
