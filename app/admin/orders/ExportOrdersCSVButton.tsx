'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/lib/toast'
import { useSearchParams } from 'next/navigation'

export default function ExportOrdersCSVButton() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  const handleExport = async () => {
    try {
      setLoading(true)
      toast.loading('Génération du fichier CSV...')

      // On reprend exactement les mêmes filtres que la page
      const qs = searchParams.toString()
      const response = await fetch(`/api/admin/orders/export?${qs}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du CSV')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Export_Commandes_YayyamPro_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Fichier CSV téléchargé avec succès !')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-900/10 hover:bg-emerald-900/20 text-[#0F7A60] font-black uppercase tracking-widest text-[11px] rounded-xl border border-emerald-900/20 shadow-sm transition-all disabled:opacity-50"
    >
      <Download className={`w-3.5 h-3.5 ${loading ? 'animate-bounce' : ''}`} />
      {loading ? 'Export...' : 'CSV'}
    </button>
  )
}
