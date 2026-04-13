'use client'

import { useState } from 'react'
import { Play, Check, AlertCircle, Loader2 } from 'lucide-react'

interface CronButtonProps {
  label: string
  endpoint: string
  description?: string
  lastRunStr?: string
}

/**
 * Bouton client pour déclencher manuellement un CRON.
 * Gère l'état de chargement et affiche le résultat JSON.
 */
export default function CronButton({ label, endpoint, description, lastRunStr }: CronButtonProps) {
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
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-5 rounded-3xl flex flex-col gap-4 relative overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-lg transition-shadow duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/20 pointer-events-none -z-10"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#1A1A1A]">{label}</h3>
          {description && <p className="text-xs font-medium text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
          onClick={handleTrigger}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border ${
            loading 
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#0F7A60] to-teal-500 hover:from-[#0D5C4A] hover:to-[#0F7A60] text-white border-[#0F7A60]/50 shadow-[0_4px_15px_rgba(15,122,96,0.2)] hover:shadow-[0_6px_20px_rgba(15,122,96,0.3)]'
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

      {lastRunStr && (
        <div className="flex items-center gap-2 mt-2">
           <span className="text-xs uppercase font-black tracking-widest text-gray-400">Dernière exécution :</span>
           {(() => {
             try {
               const parsed = JSON.parse(lastRunStr)
               const isErr = parsed.status === 'error'
               const d = new Date(parsed.time)
               return (
                 <span className={`px-2 py-0.5 rounded border text-xs font-bold ${isErr ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                   {isErr ? 'Erreur' : 'Succès'} • {d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit' })}
                 </span>
               )
             } catch {
               return <span className="text-gray-400 text-xs">Inconnu</span>
             }
           })()}
        </div>
      )}

      {/* Résultat JSON */}
      {(result || error) && (
        <div className={`mt-2 p-4 rounded-2xl border backdrop-blur-md animate-in slide-in-from-top-2 duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${
          error ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border shadow-sm flex items-center justify-center ${error ? 'bg-red-100 text-red-500 border-red-200' : 'bg-emerald-100 text-emerald-500 border-emerald-200'}`}>
                {error ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
              <span className={`text-xs font-black uppercase tracking-wider ${error ? 'text-red-600' : 'text-emerald-600'}`}>
                {error ? 'Échec' : 'Succès'}
              </span>
            </div>
            <button 
              onClick={() => { setResult(null); setError(null); }}
              className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${error ? 'text-red-500 hover:bg-red-100' : 'text-emerald-500 hover:bg-emerald-100'}`}
            >
              Effacer
            </button>
          </div>
          <pre className={`text-xs font-mono overflow-x-auto p-3 rounded-xl border max-h-40 shadow-inner ${error ? 'text-red-800 bg-red-100/50 border-red-200/50' : 'text-emerald-800 bg-emerald-100/50 border-emerald-200/50'}`}>
            {JSON.stringify(result || { error }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
