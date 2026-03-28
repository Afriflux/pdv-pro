'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, AlertTriangle, X } from 'lucide-react'

// Hook custom minimaliste pour éviter d'installer une librairie externe
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function AdminOrderFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const debouncedQuery = useDebounce(query, 500)
  
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '')
  const [codOnly, setCodOnly] = useState(searchParams.get('cod') === 'true')

  // Update URL on changes
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    
    // Always reset to page 1 when filtering
    if (
      debouncedQuery !== (searchParams.get('q') || '') ||
      dateFrom !== (searchParams.get('from') || '') ||
      dateTo !== (searchParams.get('to') || '') ||
      (codOnly ? 'true' : '') !== (searchParams.get('cod') || '')
    ) {
      params.set('page', '1')
    }

    if (debouncedQuery) params.set('q', debouncedQuery)
    else params.delete('q')

    if (dateFrom) params.set('from', dateFrom)
    else params.delete('from')

    if (dateTo) params.set('to', dateTo)
    else params.delete('to')

    if (codOnly) params.set('cod', 'true')
    else params.delete('cod')

    router.replace(`?${params.toString()}`, { scroll: false })
  }, [debouncedQuery, dateFrom, dateTo, codOnly, router, searchParams])

  const clearFilters = () => {
    setQuery('')
    setDateFrom('')
    setDateTo('')
    setCodOnly(false)
  }

  const hasActiveFilters = query || dateFrom || dateTo || codOnly

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-6 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
      
      {/* ── RECHERCHE GLOBALE ── */}
      <div className="relative flex-1 lg:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-emerald-600/50" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher ID, Client, Téléphone, Boutique..."
          className="block w-full pl-10 pr-3 py-2.5 border border-emerald-500/10 rounded-2xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/20 focus:border-[#0F7A60]/30 sm:text-sm font-medium transition-all shadow-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* ── DATES (DATE RANGE) ── */}
        <div className="flex items-center gap-2 bg-white/50 border border-emerald-500/10 rounded-2xl px-3 py-1.5 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold text-gray-600 focus:ring-0 w-[110px]"
          />
          <span className="text-gray-300">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold text-gray-600 focus:ring-0 w-[110px]"
          />
        </div>

        {/* ── FILTRE COD (RISQUE) ── */}
        <button
          onClick={() => setCodOnly(!codOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
            codOnly 
              ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' 
              : 'bg-white border border-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${codOnly ? 'animate-pulse' : ''}`} />
          Risque COD
        </button>

        {/* ── BOUTON RESET ── */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Effacer les filtres"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
