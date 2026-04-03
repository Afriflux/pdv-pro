'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  
  // Masquer le footer sur le dashboard, l'admin, l'onboarding et le checkout (pour ne pas distraire l'achat)
  return null
}
