'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AffiliateTracker() {
  const searchParams = useSearchParams()
  const ref = searchParams?.get('ref')

  useEffect(() => {
    if (ref) {
      // Stocker le code affilié pour 30 jours
      const expires = new Date()
      expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000)
      document.cookie = `pdv_affiliate_ref=${encodeURIComponent(ref)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    }
  }, [ref])

  // Ce composant est invisible
  return null
}
