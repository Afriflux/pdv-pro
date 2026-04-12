'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Sparkles, ChevronRight, Eye, X } from 'lucide-react'
import Link from 'next/link'

interface DigestData {
  id: string
  summary: string
  metrics: {
    orders: number
    revenue: number
    avg_cart: number
    abandoned: number
    top_product: string
    prev_day_orders?: number
  }
  suggestions: { text: string; priority: string; action_url: string }[]
  score: number
  read: boolean
  date: string
}

export function DailyDigestWidget({ storeId }: { storeId: string }) {
  const [digest, setDigest] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if dismissed today
    const dismissedKey = `digest_dismissed_${new Date().toISOString().split('T')[0]}`
    if (typeof window !== 'undefined' && localStorage.getItem(dismissedKey)) {
      setDismissed(true)
      setLoading(false)
      return
    }

    fetch(`/api/dashboard/daily-digest?storeId=${storeId}`)
      .then(res => res.ok ? res.json() : null)
      .then((data: DigestData | null) => {
        if (data) setDigest(data)
      })
      .catch((e) => { console.warn('[DailyDigest] Fetch failed:', e) })
      .finally(() => setLoading(false))
  }, [storeId])

  const handleDismiss = () => {
    const dismissedKey = `digest_dismissed_${new Date().toISOString().split('T')[0]}`
    localStorage.setItem(dismissedKey, '1')
    setDismissed(true)

    // Mark as read
    if (digest?.id) {
      fetch('/api/dashboard/daily-digest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestId: digest.id }),
      }).catch((e) => { console.warn('[DailyDigest] Mark as read failed:', e) })
    }
  }

  if (loading || dismissed || !digest) return null

  const { metrics, suggestions, score, summary } = digest
  const orderChange = metrics.prev_day_orders && metrics.prev_day_orders > 0
    ? Math.round(((metrics.orders - metrics.prev_day_orders) / metrics.prev_day_orders) * 100)
    : null
  const isUp = orderChange !== null && orderChange >= 0

  return (
    <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-emerald-500/10 overflow-hidden mb-6 group">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl -ml-8 -mb-8" />

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white z-10"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
          <Sparkles size={18} className="text-yellow-300" />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            Coach Quotidien
            <span className="text-[9px] font-bold bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-md border border-yellow-300/20">
              IA
            </span>
          </h3>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Commandes</p>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xl font-black">{metrics.orders}</p>
            {orderChange !== null && (
              <span className={`text-[10px] font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded ${isUp ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'}`}>
                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isUp ? '+' : ''}{orderChange}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Revenue</p>
          <p className="text-xl font-black mt-1 truncate">
            {metrics.revenue >= 1000
              ? `${Math.round(metrics.revenue / 1000)}K`
              : metrics.revenue
            }
            <span className="text-[10px] font-bold text-white/40"> F</span>
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Score</p>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-xl font-black">{score}</p>
            <span className="text-[10px] text-white/30">/100</span>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2 mb-4 relative z-10">
          {suggestions.slice(0, 2).map((s, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
              <span className="text-yellow-300 text-sm mt-0.5">💡</span>
              <p className="text-[11px] text-white/80 font-medium leading-relaxed flex-1">{s.text}</p>
              {s.action_url && s.action_url !== '/dashboard' && (
                <Link href={s.action_url} className="text-[10px] font-black text-yellow-300 hover:text-yellow-200 whitespace-nowrap flex items-center gap-0.5">
                  Agir <ChevronRight size={10} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Summary (expandable) */}
      <details className="relative z-10 group/details">
        <summary className="text-[10px] font-bold text-white/40 cursor-pointer hover:text-white/60 transition-colors flex items-center gap-1">
          <Eye size={10} />
          Voir le rapport complet
        </summary>
        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-white/10 text-[11px] text-white/70 leading-relaxed whitespace-pre-line">
          {summary}
        </div>
      </details>
    </div>
  )
}
