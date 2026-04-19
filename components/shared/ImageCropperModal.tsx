'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg, { Area } from '@/lib/utils/cropImage'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperModalProps {
  imageFile: File
  aspectRatio ?: number
  onCancel: () => void
  onCropComplete: (croppedFile: File) => void
}

export function ImageCropperModal({ 
  imageFile, 
  aspectRatio = 1, // Par défaut: Carré (1:1), on peut passer 4/5
  onCancel, 
  onCropComplete 
}: ImageCropperModalProps) {
  
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Create object URL for cropper
  const [imageSrc] = useState(URL.createObjectURL(imageFile))

  const onCropCompleteEvent = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const resultFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (resultFile) {
        onCropComplete(resultFile)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]">
        
        {/* Header avec Instructions */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-black text-gray-900">Ajuster l'image</h3>
            <button 
              type="button"
              onClick={onCancel}
              title="Annuler et fermer"
              aria-label="Annuler et fermer"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-semibold text-gray-500">
            Faites glisser pour recadrer au format carré. Dé-zoomez pour réduire la taille et inclure toute l'image.
          </p>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full flex-1 min-h-[50vh] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={setZoom}
            objectFit="contain"
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-white shrink-0">
          <div className="flex items-center gap-4 mb-6">
            <ZoomOut className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.1}
              title="Ajuster le zoom de l'image"
              aria-label="Ajuster le zoom de l'image"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="w-5 h-5 text-gray-400 shrink-0" />
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
            >
              {isProcessing ? 'Génération...' : 'Valider'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
