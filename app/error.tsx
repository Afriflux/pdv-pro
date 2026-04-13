'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw, Store } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Possibilité d'envoyer l'erreur à un service de tracking (ex: Sentry)
    console.error("Yayyam Error Caught:", error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center font-body selection:bg-red-500/20">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-line flex flex-col items-center relative overflow-hidden">
        {/* Décoration en fond */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-400 to-red-500"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl"></div>

        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500 border border-red-100 shadow-sm relative z-10 animate-pulse-slow">
          <AlertTriangle size={40} strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-display font-black text-ink mb-3 relative z-10 tracking-tight">
          Quelque chose s'est mal passé.
        </h1>
        
        <p className="text-slate text-sm mb-8 leading-relaxed relative z-10 font-medium">
          Pas de panique, notre équipe a été prévenue. Veuillez réessayer dans quelques instants.
        </p>

        {isDev && (
          <div className="w-full bg-gray-50 border border-line rounded-lg p-3 mb-8 text-left overflow-x-auto relative z-10">
            <p className="text-xs font-mono text-gray-500 truncate">
              {error.message || "Erreur inconnue."}
            </p>
          </div>
        )}

        <div className="w-full space-y-3 relative z-10">
          <button 
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-black text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <RefreshCw size={18} />
            Réessayer
          </button>
          
          <Link 
            href="/" 
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-ink py-3.5 px-6 rounded-xl font-bold transition-all border border-line shadow-sm active:scale-[0.98]"
          >
            <Home size={18} className="opacity-50" />
            Retour à l'accueil
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-slate/50">
        <Store size={16} />
        <span className="font-display font-black tracking-tighter text-sm">Yayyam</span>
      </div>
    </div>
  )
}
