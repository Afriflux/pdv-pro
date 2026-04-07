'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────────────────────

interface Check360WidgetProps {
  storeName: string
  caToday: number
  countToday: number
  pendingCount: number
  walletBalance: number
  productCount: number
  caWeek: number
  level: string
}

interface Check360Action {
  icon: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  cta?: string
  ctaHref?: string
}

interface Check360Response {
  actions: Check360Action[]
  summary: string
}

// ── COMPOSANT ────────────────────────────────────────────────────────────────

export function Check360Widget({
  storeName, caToday, countToday, pendingCount,
  walletBalance, productCount, caWeek, level
}: Check360WidgetProps) {
  const [data, setData] = useState<Check360Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [lastRefresh, setLastRefresh] = useState<number>(0)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/ai/check360', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName, caToday, countToday, pendingCount,
          walletBalance, productCount, caWeek, level
        }),
      })

      if (!res.ok) {
        throw new Error('Erreur API')
      }

      const json = await res.json()
      setData(json)
      
      // Stocker l'heure de la mise à jour (HH:MM)
      const now = new Date()
      setLastUpdate(
        now.getHours().toString().padStart(2, '0') + ':' + 
        now.getMinutes().toString().padStart(2, '0')
      )
    } catch (err) {
      console.error('[Check360Widget] Fetch error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Lancement de l'analyse au premier montage
  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  // Helpers pour les styles dynamiques de la bordure
  const getBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400'
      case 'medium': return 'border-l-amber-400'
      case 'low': return 'border-l-[#0F7A60]'
      default: return 'border-l-gray-300'
    }
  }

  // 1. ÉTAT LOADING (Skeleton)
  if (loading && !data) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#0F7A60] animate-pulse" />
            <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-8 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        
        {/* Summary Skeleton */}
        <div className="h-10 w-full bg-gray-50 rounded-xl animate-pulse" />

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 min-h-[130px]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-50 rounded animate-pulse flex-1" />
              <div className="h-4 w-20 bg-gray-100 rounded mt-auto" />
            </div>
          ))}
        </div>
        
        {/* Footer Skeleton */}
        <div className="h-3 w-64 bg-gray-50 rounded animate-pulse mx-auto mt-2" />
      </div>
    )
  }

  // 3. ÉTAT ERROR
  if (error || !data) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-4 text-center min-h-[250px]">
         <div className="w-12 h-12 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} />
         </div>
         <div>
           <h3 className="text-sm font-black text-[#1A1A1A]">Analyse temporairement indisponible</h3>
           <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
             Nous n'avons pas pu générer les recommandations pour le moment.
           </p>
         </div>
         <button 
           onClick={() => {
             const now = Date.now()
             if (now - lastRefresh < 10000) return
             setLastRefresh(now)
             fetchAnalysis()
           }}
           className="mt-2 bg-gray-50 hover:bg-gray-100 text-[#1A1A1A] text-xs font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
           disabled={loading}
         >
           <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
           {loading ? 'Rechargement...' : 'Réessayer'}
         </button>
      </div>
    )
  }

  // 2. ÉTAT DATA (Widget complet)
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#0F7A60]" />
          <h2 className="text-lg font-black text-[#1A1A1A]">Check360° — Analyse IA</h2>
          <span className="bg-[#0F7A60]/10 text-[#0F7A60] rounded-full px-2 py-0.5 text-xs font-bold leading-none flex items-center h-5">
            IA
          </span>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
          <span className="text-gray-400 font-medium tracking-wide">
            À jour ({lastUpdate})
          </span>
          <button 
            onClick={() => {
              const now = Date.now()
              if (now - lastRefresh < 10000) return
              setLastRefresh(now)
              fetchAnalysis()
            }}
            disabled={loading}
            className="flex items-center gap-1.5 text-gray-400 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
            title="Actualiser l'analyse"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#0F7A60]' : ''} />
            <span className="font-bold">{loading ? 'Analyse...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* ── SUMMARY ── */}
      <div className="bg-gray-50 rounded-xl px-4 py-3">
        <p className="italic text-sm text-gray-500 font-medium">
          « {data.summary} »
        </p>
      </div>

      {/* ── ACTIONS (3 CARTES) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data.actions || []).map((action, idx) => (
          <div 
            key={idx} 
            className={`bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 min-h-[130px] shadow-sm hover:shadow-md transition-shadow border-l-4 ${getBorderColor(action.priority)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl leading-none">{action.icon}</span>
              <h3 className="text-sm font-black text-[#1A1A1A] pt-1 leading-tight">
                {action.title}
              </h3>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed flex-1 mt-1">
              {action.description}
            </p>

            {action.ctaHref && action.cta && (
              <div className="mt-auto pt-3 border-t border-gray-50">
                <Link 
                  href={action.ctaHref}
                  className="text-xs font-bold text-[#0F7A60] hover:underline flex items-center gap-1 group w-max"
                >
                  {action.cta} 
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <p className="text-xs font-medium text-gray-400 text-center mt-1">
        ⚡ Propulsé par Claude AI — Analyse personnalisée pour votre boutique
      </p>

    </div>
  )
}
