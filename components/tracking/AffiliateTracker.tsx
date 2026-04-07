'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

export function AffiliateTracker() {
  const searchParams = useSearchParams()
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true

    const ref = searchParams.get('ref')
    const source = searchParams.get('source') || null

    if (ref) {
      // 1. Sauvegarder dans les cookies (Expiration 30 Jours)
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 30)
      const expires = `expires=${expirationDate.toUTCString()}`

      document.cookie = `yayyam_affiliate_ref=${encodeURIComponent(ref)}; ${expires}; path=/; SameSite=Lax`
      if (source) {
        document.cookie = `yayyam_affiliate_subid=${encodeURIComponent(source)}; ${expires}; path=/; SameSite=Lax`
      }

      // 2. Ping API pour loguer le clic silencieusement
      fetch('/api/affiliates/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: ref,
          source: source
        })
      }).catch((e) => console.error('[Affiliate Track] Error:', e))
    }
  }, [searchParams])

  return null
}
