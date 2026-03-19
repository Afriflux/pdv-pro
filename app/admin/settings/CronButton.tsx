'use client'

import { useState } from 'react'
import { Play, Check, AlertCircle, Loader2 } from 'lucide-react'

interface CronButtonProps {
  label: string
  endpoint: string
  description?: string
}

/**
 * Bouton client pour déclencher manuellement un CRON.
 * Gère l'état de chargement et affiche le résultat JSON.
 */
export default function CronButton({ label, endpoint, description }: CronButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrigger = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // L'Authorization header simule la clé CRON si nécessaire
          // Pour ces tests, on suppose que l'admin est déjà authentifié via sa session
        }
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erreur lors de l’exécution')
      }

      setResult(data as Record<string, unknown>)
    } catch (err: unknown) {
      console.error('[CRON TRIGGER]', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#161B22] border border-[#30363D] p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-200">{label}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
          onClick={handleTrigger}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            loading 
              ? 'bg-[#30363D] text-gray-500 cursor-not-allowed'
              : 'bg-[#0F7A60] hover:bg-[#0F7A60]/80 text-white shadow-lg shadow-[#0F7A60]/20 active:scale-95'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {loading ? 'Exécution...' : 'Lancer'}
        </button>
      </div>

      {/* Résultat JSON */}
      {(result || error) && (
        <div className={`mt-2 p-3 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${
          error ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {error ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className={`text-[10px] font-black uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
                {error ? 'Échec' : 'Succès'}
              </span>
            </div>
            <button 
              onClick={() => { setResult(null); setError(null); }}
              className="text-[10px] text-gray-500 hover:text-white"
            >
              Effacer
            </button>
          </div>
          <pre className="text-[10px] font-mono text-gray-400 overflow-x-auto p-2 bg-black/30 rounded-lg max-h-32">
            {JSON.stringify(result || { error }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
