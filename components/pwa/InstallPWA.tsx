'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

// Interface TypeScript pour l'évènement non standard beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false)
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setSupportsPWA(true)
      setPromptInstall(e as BeforeInstallPromptEvent)
    }
    
    // Check if dismissed previously in this session/localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('yayyam_pwa_dismissed') === 'true') {
        setIsDismissed(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const onClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault()
    if (!promptInstall) {
      return
    }
    promptInstall.prompt()
  }

  const dismiss = (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsDismissed(true)
      localStorage.setItem('yayyam_pwa_dismissed', 'true')
  }

  if (!supportsPWA || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom flex items-center gap-3">
      <button
        onClick={onClick}
        className="group relative flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl p-3 pr-5 rounded-full hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald text-white shadow-emerald/30 shadow-lg group-hover:rotate-12 transition-transform shrink-0">
          <Plus size={22} strokeWidth={3} />
        </div>
        <div className="text-left">
          <p className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none">Installer</p>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Application Rapide</p>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-emerald/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </button>

      <button 
        onClick={dismiss}
        className="w-11 h-11 rounded-full bg-white/70 backdrop-blur-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-white flex items-center justify-center transition shadow-lg shrink-0"
        aria-label="Fermer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  )
}
