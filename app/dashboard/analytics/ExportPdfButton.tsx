'use client'

// ─── app/dashboard/analytics/ExportPdfButton.tsx ─────────────────────────────
// Bouton d'export PDF — accessible à tous les vendeurs (restriction supprimée)
// Enrobé via SSR: false pour éviter les plantages Next.js de @react-pdf/renderer

import { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import dynamic from 'next/dynamic'
import PdfReport from './PdfReport'
import { AnalyticsData } from '@/lib/analytics/analyticsActions'

interface Props {
  data:      AnalyticsData
  storeName: string
  days:      number
}

function ExportPdfButtonClient({ data, storeName, days }: Props) {
  const [isMounted, setIsMounted] = useState(false)

  // Éviter les erreurs d'hydratation SSR avec PDFDownloadLink
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <button
        disabled
        className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 text-slate-400
          cursor-not-allowed flex items-center gap-2 border border-slate-200 shadow-sm"
      >
        Chargement PDF…
      </button>
    )
  }

  return (
    <PDFDownloadLink
      document={<PdfReport data={data} storeName={storeName} days={days} />}
      fileName={`Rapport_PDVPro_${storeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`}
      className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#0F7A60] text-white
        hover:bg-[#0D5C4A] flex items-center gap-2 shadow-sm transition-all"
    >
      📄 Exporter PDF
    </PDFDownloadLink>
  )
}

// ── Export principal sans rendu serveur (SSR: false)
export default dynamic(() => Promise.resolve(ExportPdfButtonClient), {
  ssr: false,
  loading: () => (
    <button
      disabled
      className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 text-slate-400
        cursor-not-allowed flex items-center gap-2 border border-slate-200 shadow-sm"
    >
      Chargement PDF…
    </button>
  ),
})
