'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]:", error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle size={32} strokeWidth={1.5} />
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Erreur inattendue</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Un problème est survenu lors du chargement de cette page. Veuillez réessayer.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-[#0A3D35] text-white py-3 rounded-xl font-bold transition active:scale-[0.98] text-sm"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold transition hover:bg-gray-200 active:scale-[0.98] text-sm"
          >
            <LayoutDashboard size={16} />
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
