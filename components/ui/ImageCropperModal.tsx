'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'

// Utilitaire pour recadrer l'image sur un canvas et renvoyer un Blob
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (error) => reject(error)
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    return Promise.reject('Impossible de créer le contexte 2d')
  }

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

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas est vide'))
    }, 'image/jpeg', 0.9)
  })
}

interface ImageCropperModalProps {
  imageFile: File
  onClose: () => void
  onCrop: (croppedFile: File, previewUrl: string) => void
}

export function ImageCropperModal({ imageFile, onClose, onCrop }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const src = URL.createObjectURL(imageFile)
    setImageSrc(src)
    return () => URL.revokeObjectURL(src)
  }, [imageFile])

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setLoading(true)
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const croppedFile = new File([croppedImageBlob], imageFile.name, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(croppedImageBlob)
      onCrop(croppedFile, previewUrl)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || !imageSrc) return null

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex flex-col bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Header Modal */}
      <div className="flex items-center justify-between p-4 sm:p-6 mb-auto w-full z-10 relative">
        <div className="text-white">
          <h2 className="text-xl font-bold tracking-tight">Recadrer la photo</h2>
          <p className="text-sm text-gray-400">Ajustez votre photo de profil</p>
        </div>
        <button 
          type="button"
          title="Fermer"
          aria-label="Fermer"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Cropper Container */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[400px]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1} // Avatar is square/circle
          cropShape="round" // Visually round
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-transparent relative',
            mediaClassName: 'max-w-full max-h-[70vh]',
          }}
        />
      </div>

      {/* Footer Controls */}
      <div className="w-full bg-black/50 p-6 sm:p-8 mt-auto z-10 sticky bottom-0">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 text-white">
            <span className="text-sm font-bold opacity-70">-</span>
            <input
              type="range"
              title="Ajuster le zoom"
              placeholder="Zoom"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-bold opacity-70">+</span>
          </div>
          
          <button
            type="button"
            onClick={handleCrop}
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Check size={20} className="mr-2" />
            )}
            {loading ? 'Recadrage...' : 'Valider'}
          </button>
        </div>
      </div>
      
    </div>,
    document.body
  )
}
