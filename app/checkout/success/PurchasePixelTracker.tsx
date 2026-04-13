'use client'

import { useEffect, useRef } from 'react'
import { trackPurchase } from '@/lib/tracking/pixel-events'

interface PurchasePixelTrackerProps {
  orderId: string
  value: number
  contentName: string
  currency?: string
}

/**
 * Client Component that fires Purchase pixel events on mount.
 * Uses orderId as event_id for Meta CAPI deduplication.
 * Renders nothing — it's purely a side-effect component.
 */
export function PurchasePixelTracker({ orderId, value, contentName, currency = 'XOF' }: PurchasePixelTrackerProps) {
  const hasFired = useRef(false)

  useEffect(() => {
    // Prevent double-fire in React StrictMode
    if (hasFired.current) return
    hasFired.current = true

    trackPurchase({
      order_id: orderId,
      event_id: orderId, // Must match CAPI event_id for Meta deduplication
      value,
      content_name: contentName,
      currency,
    })
  }, [orderId, value, contentName, currency])

  return null
}
