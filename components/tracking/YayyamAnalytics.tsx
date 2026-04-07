'use client'

import { useEffect, useRef } from 'react'
import { recordPageVisit } from '@/app/actions/analytics'

interface YayyamAnalyticsProps {
  pageId?: string
}

/**
 * Composant de tracking interne pour Yayyam.
 * Enregistre les visites dans la table PageAnalytics.
 */
export function YayyamAnalytics({ pageId }: YayyamAnalyticsProps) {
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
