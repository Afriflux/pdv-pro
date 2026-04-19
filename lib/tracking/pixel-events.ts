'use client'

// ─── Pixel Event Tracking Utility ─────────────────────────────────────────────
// Fires conversion events to Meta (fbq), TikTok (ttq), and Google (gtag)
// Used across the funnel: ViewContent → AddToCart → InitiateCheckout → Purchase

interface TrackingData {
  content_name?: string
  content_id?: string
  value?: number
  currency?: string
  content_type?: string
  order_id?: string
  event_id?: string // For Meta CAPI deduplication
}

// Global pixel tracker types
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    ttq?: { track: (...args: unknown[]) => void }
    gtag?: (...args: unknown[]) => void
  }
}

function getFbq() { return typeof window !== 'undefined' ? window.fbq : null }
function getTtq() { return typeof window !== 'undefined' ? window.ttq : null }
function getGtag() { return typeof window !== 'undefined' ? window.gtag : null }

export function trackViewContent(data: TrackingData) {
  getFbq()?.('track', 'ViewContent', {
    content_name: data.content_name,
    content_ids: data.content_id ? [data.content_id] : undefined,
    content_type: 'product',
    value: data.value,
    currency: data.currency || 'XOF',
  })
  getTtq()?.track('ViewContent', {
    content_id: data.content_id,
    content_name: data.content_name,
    value: data.value,
    currency: data.currency || 'XOF',
  })
  getGtag()?.('event', 'view_item', {
    items: [{ item_id: data.content_id, item_name: data.content_name, price: data.value }],
  })
}

export function trackAddToCart(data: TrackingData) {
  getFbq()?.('track', 'AddToCart', {
    content_name: data.content_name,
    content_ids: data.content_id ? [data.content_id] : undefined,
    value: data.value,
    currency: data.currency || 'XOF',
  })
  getTtq()?.track('AddToCart', {
    content_id: data.content_id,
    value: data.value,
    currency: data.currency || 'XOF',
  })
  getGtag()?.('event', 'add_to_cart', {
    items: [{ item_id: data.content_id, item_name: data.content_name, price: data.value }],
  })
}

export function trackInitiateCheckout(data: TrackingData) {
  getFbq()?.('track', 'InitiateCheckout', {
    value: data.value,
    currency: data.currency || 'XOF',
    content_name: data.content_name,
  })
  getTtq()?.track('InitiateCheckout', {
    value: data.value,
    currency: data.currency || 'XOF',
  })
  getGtag()?.('event', 'begin_checkout', {
    value: data.value,
    currency: data.currency || 'XOF',
  })
}

export function trackPurchase(data: TrackingData) {
  const eventParams: Record<string, unknown> = {
    value: data.value,
    currency: data.currency || 'XOF',
    content_name: data.content_name,
    order_id: data.order_id,
  }
  // Pass event_id for Meta CAPI deduplication
  if (data.event_id) {
    eventParams.eventID = data.event_id
  }

  getFbq()?.('track', 'Purchase', eventParams)
  getTtq()?.track('CompletePayment', {
    value: data.value,
    currency: data.currency || 'XOF',
    order_id: data.order_id,
    event_id: data.event_id, // TikTok Events API deduplication
  })
  getGtag()?.('event', 'purchase', {
    transaction_id: data.order_id,
    value: data.value,
    currency: data.currency || 'XOF',
  })
}
