'use client'

import Link from 'next/link'
import { Globe } from 'lucide-react'

export function GlobalHomeButton() {
  return (
    <Link 
      href="/" 
      target="_blank"
      className="fixed bottom-[100px] right-8 z-[90] hidden lg:flex items-center gap-2 px-4 py-3 bg-[#0F7A60]/90 hover:bg-[#0F7A60] text-white font-bold rounded-2xl shadow-lg shadow-[#0F7A60]/20 backdrop-blur-md transition-all group scale-95 origin-bottom-right hover:scale-100"
    >
      <Globe className="w-5 h-5 group-hover:animate-pulse" />
      <span className="text-[13px] uppercase tracking-widest hidden sm:inline">Afficher ma Vitrine</span>
    </Link>
  )
}
