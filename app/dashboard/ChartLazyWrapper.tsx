'use client'

// ─── Wrapper Client léger pour lazy-loader DashboardChart ────────────────────
// next/dynamic ne fait du code-splitting QUE dans un Client Component.
// Ce wrapper est < 1 kB et charge le graphique recharts à la demande.

import dynamic from 'next/dynamic'

const DashboardChart = dynamic(
  () => import('./DashboardChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] bg-gray-50 rounded-2xl animate-pulse" />
    ),
  }
)

interface Props {
  data: { date: string; total: number }[]
}

export default function ChartLazyWrapper({ data }: Props) {
  return <DashboardChart data={data} />
}
