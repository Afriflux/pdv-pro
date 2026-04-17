'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function UsersSearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const roleFilter = searchParams.get('role') || 'all'
  
  const [query, setQuery] = useState(initialQuery)

  // Synchronisation si l'URL change depuis un autre endroit (ex: effacement, clic sur tag)
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Uniquement si la requête locale est différente de l'URL pour éviter des boucles
      if (query !== initialQuery) {
        if (query) {
          router.push(`/admin/users?q=${encodeURIComponent(query)}&role=${roleFilter}`)
        } else {
          router.push(`/admin/users?role=${roleFilter}`)
        }
      }
    }, 300) // 300ms debounce pour une réactivité fluide

    return () => clearTimeout(delayDebounceFn)
  }, [query, router, roleFilter, initialQuery])

  return (
    <div className="relative w-full md:w-96">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par nom, email ou téléphone..."
        className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 pl-12 pr-10 text-sm text-white
          focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 outline-none transition-all placeholder:text-white/50 shadow-inner"
      />
      {query && (
        <button
          type="button"
          title="Effacer la recherche"
          aria-label="Effacer la recherche"
          onClick={() => {
            setQuery('')
            router.push(`/admin/users?role=${roleFilter}`)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
