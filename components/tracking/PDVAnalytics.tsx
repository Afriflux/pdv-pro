'use client'

import { useEffect, useRef } from 'react'
import { recordPageVisit } from '@/app/actions/analytics'

interface PDVAnalyticsProps {
  pageId?: string
}

/**
 * Composant de tracking interne pour PDV Pro.
 * Enregistre les visites dans la table PageAnalytics.
 */
export function PDVAnalytics({ pageId }: PDVAnalyticsProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    // On ne tracke qu'une fois par montage pour éviter les doubles comptes en dev (Strict Mode)
    if (pageId && !hasTracked.current) {
      recordPageVisit(pageId)
      hasTracked.current = true
    }
  }, [pageId])

  return null
}
