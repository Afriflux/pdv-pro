'use client'

import { usePathname } from 'next/navigation'

export function AdminPageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Règle d'or absolue : AUCUN PADDING GLOBAL, 100% full-width, collé à la sidebar
  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0">
      {children}
    </div>
  )
}
