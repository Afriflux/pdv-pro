'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function MotionReveal({ children, delay = 0, className = "" }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function MotionFloat({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -15, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
