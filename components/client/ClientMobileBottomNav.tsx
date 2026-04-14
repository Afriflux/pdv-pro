/* eslint-disable react/forbid-dom-props */
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { signOut } from '@/app/auth/actions'
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Bell,
  Wallet,
  Sparkles,
  Settings,
  CalendarDays,
  Workflow,
  MapPin,
  Store,
  GraduationCap,
  LogOut,
  X,
  ChevronRight,
  Menu,
} from 'lucide-react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface ClientMobileBottomNavProps {
  userName: string
  avatarUrl?: string | null
}

interface ProfileLink {
  icon: typeof Wallet
  label: string
  href: string
  color?: string
}

const PROFILE_LINKS: ProfileLink[] = [
  { icon: Wallet, label: 'Mon Portefeuille', href: '/client/wallet', color: 'text-emerald-500' },
  { icon: Sparkles, label: 'Points & Récompenses', href: '/client/loyalty', color: 'text-purple-500' },
  { icon: Sparkles, label: 'Assistant IA', href: '/client/assistant', color: 'text-blue-500' },
  { icon: CalendarDays, label: 'Mes Réservations', href: '/client/agenda', color: 'text-orange-500' },
  { icon: Workflow, label: 'Mes Automatisations', href: '/client/workflows', color: 'text-indigo-500' },
  { icon: MapPin, label: 'Mes Adresses', href: '/client/addresses', color: 'text-pink-500' },
  { icon: GraduationCap, label: 'Académie', href: '/client/academy', color: 'text-amber-500' },
  { icon: Store, label: 'Catalogue Vendeurs', href: '/vendeurs', color: 'text-teal-500' },
  { icon: Settings, label: 'Paramètres', href: '/client/settings', color: 'text-gray-500' },
]

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function ClientMobileBottomNav({ userName, avatarUrl }: ClientMobileBottomNavProps) {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)

  // Close profile sheet on route change
  useEffect(() => {
    setProfileOpen(false)
  }, [pathname])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (profileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [profileOpen])

  // ── Focus trap ──────────────────────────────────────────────────
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    const sheet = sheetRef.current
    if (!sheet) return

    const focusable = sheet.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProfileOpen(false); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    first.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [profileOpen])

  // ── Swipe to dismiss ────────────────────────────────────────────
  const [swipeOffset, setSwipeOffset] = useState(0)
  const touchStartY = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setSwipeOffset(delta)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (swipeOffset > 100) {
      setProfileOpen(false)
    }
    setSwipeOffset(0)
  }, [swipeOffset])

  const isActive = (href: string) => {
    if (href === '/client') return pathname === '/client'
    return pathname.startsWith(href)
  }

  const tabs = [
    { icon: LayoutDashboard, label: 'Accueil', href: '/client' },
    { icon: Package, label: 'Achats', href: '/client/orders' },
    { icon: BookOpen, label: 'Biblio', href: '/client/library' },
    { icon: Bell, label: 'Notifs', href: '/client/settings' },
  ]

  const initial = userName?.[0]?.toUpperCase() ?? 'C'

  return (
    <>
      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe" role="navigation" aria-label="Navigation principale client">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center h-16 max-w-lg mx-auto px-1">
            {tabs.map((tab) => {
              const active = isActive(tab.href)
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all duration-200 active:scale-95 ${
                    active
                      ? 'text-[#0F7A60]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 1.8} />
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0F7A60]" />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight ${active ? 'font-bold' : ''}`}>
                    {tab.label}
                  </span>
                </Link>
              )
            })}

            {/* Menu Tab */}
            <button
              onClick={() => setProfileOpen(true)}
              {...({ 'aria-expanded': profileOpen, 'aria-haspopup': 'dialog' } as any)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all duration-200 active:scale-95 ${
                profileOpen ? 'text-[#0F7A60]' : 'text-gray-400'
              }`}
            >
              <div className="relative w-[24px] h-[24px] flex items-center justify-center">
                <Menu strokeWidth={profileOpen ? 2.5 : 1.8} className="w-[22px] h-[22px]" />
              </div>
              <span className={`text-[10px] font-semibold leading-tight ${profileOpen ? 'font-bold' : ''}`}>Menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Profile Sheet (overlay + slide-up) ── */}
      {profileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden animate-[fade-in_0.2s_ease-out]"
            onClick={() => setProfileOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-[61] lg:hidden animate-[slide-up_0.3s_ease-out]"
            {...({ style: { transform: `translateY(${swipeOffset}px)` } } as any)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="bg-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-y-auto pb-safe-16"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center shadow-sm">
                    {avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-black text-emerald-700">{initial}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-tight">{userName}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Espace Acheteur</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Quitter
                    </button>
                  </form>
                  <button
                    onClick={() => setProfileOpen(false)}
                    title="Fermer"
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="px-3 pb-2">
                {PROFILE_LINKS.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setProfileOpen(false)}
                      className={`flex items-center gap-3.5 px-3 py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                        active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        active ? 'bg-emerald-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-[18px] h-[18px] ${active ? 'text-emerald-600' : link.color || 'text-gray-500'}`} />
                      </div>
                      <span className={`text-sm flex-1 ${active ? 'font-bold' : 'font-medium'}`}>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  )
                })}
              </div>

            </div>
          </div>
        </>
      )}
    </>
  )
}
