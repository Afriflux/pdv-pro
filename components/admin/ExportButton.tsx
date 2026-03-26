'use client'

import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export function ExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = () => {
    setLoading(true)
    toast.info('Génération du rapport en cours...')
    // Simulation simple de délai avant "lance" l'impression (Native) ou l'export
    setTimeout(() => {
      setLoading(false)
      toast.success('Snapshot prêt !')
      window.print()
    }, 1500)
  }

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[11px] uppercase tracking-widest font-black rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <Download size={14} className={loading ? 'animate-bounce' : 'group-hover:-translate-y-0.5 transition-transform'} /> 
      {loading ? 'Préparation...' : 'Snapshot PDF'}
    </button>
  )
}
