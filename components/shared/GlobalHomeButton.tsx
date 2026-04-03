'use client'

import Link from 'next/link'
import { Globe } from 'lucide-react'

export function GlobalHomeButton() {
  return (
    <Link 
      href="/" 
      target="_blank"
      className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-emerald/10 hover:bg-emerald/20 text-emerald-rich font-bold rounded-xl border border-emerald/20 shadow-sm backdrop-blur-md transition-all group lg:top-6 lg:right-6"
    >
      <Globe className="w-4 h-4 group-hover:animate-pulse" />
      <span className="text-xs uppercase tracking-wider hidden sm:inline">Vitrine</span>
    </Link>
  )
}
