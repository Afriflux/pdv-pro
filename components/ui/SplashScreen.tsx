'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'

export function SplashScreen() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show on initial load, never on server
    try {
      const hasSeenSplash = sessionStorage.getItem('yayyam_splash_seen')
      if (hasSeenSplash) return

      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        sessionStorage.setItem('yayyam_splash_seen', 'true')
      }, 2000)

      return () => clearTimeout(timer)
    } catch {
      // sessionStorage not available (SSR or privacy mode)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* Logo container with scale animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6"
          >
            {/* The actual Logo Component */}
            <Logo size="xl" />

            {/* Loading dots/bar animation */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: 'easeInOut' }}
              className="h-1 bg-emerald/20 rounded-full w-48 mt-4 overflow-hidden relative"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "linear",
                }}
                className="absolute inset-y-0 left-0 w-1/2 bg-emerald rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
