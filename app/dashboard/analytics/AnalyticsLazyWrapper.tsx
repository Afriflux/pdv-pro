'use client'

// ─── Wrapper Client léger pour lazy-loader AnalyticsClient ───────────────────
// next/dynamic ne fait du code-splitting QUE dans un Client Component.
// Ce wrapper est < 1 kB et charge AnalyticsClient à la demande.

import dynamic from 'next/dynamic'
import type { AnalyticsData } from '@/lib/analytics/analyticsActions'

const AnalyticsClient = dynamic(
  () => import('./AnalyticsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#0F7A60] border-t-transparent rounded-full" />
      </div>
    ),
  }
)

interface Props {
  data:          AnalyticsData
  currentPeriod: number
  storeName:     string
}

export default function AnalyticsLazyWrapper({ data, currentPeriod, storeName }: Props) {
  return (
    <AnalyticsClient
      data={data}
      currentPeriod={currentPeriod}
      storeName={storeName}
    />
  )
}
