'use client'

import { useState, useEffect } from 'react'
import { getRecentSocialProof } from '@/app/actions/social-proof'
import { motion, AnimatePresence } from 'framer-motion'

interface ProofItem {
  id: string
  name: string
  city: string
  time: string
  productName: string
  productImage: string | null
}

export function SocialProofWidget({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<ProofItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const [config, setConfig] = useState<any>(null)

  // 1. Load active data
  useEffect(() => {
    getRecentSocialProof(storeId).then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setItems(res.data)
        setConfig(res.config || {
          cycleSeconds: 15,
          position: 'bottom-left',
          customMessage: "a acheté"
        })
      }
    })
  }, [storeId])

  // 2. Display Cycle
  useEffect(() => {
    if (items.length === 0 || !config) return

    const cycleDuration = (config.cycleSeconds || 15) * 1000
    const displayDuration = 6000 // 6s display

    const masterTimer = setTimeout(() => {
      
      const showPopup = () => {
        setIsVisible(true)
        
        setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % items.length)
          }, 1000)
        }, displayDuration)
      }

      showPopup()
      const interval = setInterval(showPopup, cycleDuration)
      
      return () => clearInterval(interval)
      
    }, 3000)

    return () => clearTimeout(masterTimer)
  }, [items, config])

  if (items.length === 0 || !config) return

  const currentItem = items[currentIndex]

  // Time elapsed
  const getTimeAgoString = (isoDate: string) => {
    const diffMins = Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / 60000)
    if (diffMins < 60) return `Il y a ${Math.max(1, diffMins)} min`
    const hours = Math.floor(diffMins / 60)
    if (hours < 24) return `Il y a ${hours} heures`
    return `Il y a ${Math.floor(hours / 24)} jours`
  }

  const positionClass = config.position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'
  const message = config.customMessage || "a acheté"

  return (
    <div className={`fixed z-[9999] pointer-events-auto ${positionClass}`}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 max-w-[280px] sm:max-w-sm relative cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-shadow"
          >
            <div className={`absolute ${config.position === 'bottom-right' ? '-top-1 -right-1' : '-top-1 -left-1'} w-3.5 h-3.5 bg-rose-500 rounded-full border-[3px] border-white z-10 shadow-sm animate-pulse`}></div>
            
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 overflow-hidden">
              {currentItem.productImage ? (
                <img src={currentItem.productImage} alt={currentItem.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
              )}
            </div>
            
            <div className="flex flex-col justify-center min-w-0 pr-4">
              <div className="text-[12px] font-black text-[#1A1A1A] leading-tight truncate">
                {currentItem.name}{currentItem.city && currentItem.city !== "En ligne" ? ` (${currentItem.city})` : ''} {message}
              </div>
              <div className="text-xs text-gray-500 truncate mb-0.5">
                {currentItem.productName}
              </div>
              <div className="text-xs font-bold text-rose-500 tracking-wider uppercase">
                {getTimeAgoString(currentItem.time)}
              </div>
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-800"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
