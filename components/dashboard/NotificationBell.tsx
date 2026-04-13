'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  created_at: string
}

let sharedFetchPromise: Promise<any> | null = null
let lastFetchTime = 0

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [unread, setUnread]     = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]   = useState(true)

  const fetchNotifications = useCallback(async (force: boolean = false) => {
    // Si déjà répliqué récemment (< 5s) et pas forcé, on ignore
    if (!force && Date.now() - lastFetchTime < 5000) return
    
    try {
      if (!sharedFetchPromise) {
        sharedFetchPromise = fetch('/api/notifications').then(res => res.json())
      }
      const data = await sharedFetchPromise as { notifications: Notification[]; unread: number }
      setNotifications(data.notifications ?? [])
      setUnread(data.unread ?? 0)
      lastFetchTime = Date.now()
    } catch {
      // Silencieux
    } finally {
      sharedFetchPromise = null
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Polling toutes les 30s
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleOpen = async () => {
    setOpen(v => !v)
    if (!open && unread > 0) {
      // Marquer comme lues
      await fetch('/api/notifications', { method: 'PATCH' })
      setUnread(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      lastFetchTime = 0 // Forcer le refresh sur la prochaine ouverture ou tab
    }
  }

  const handleClick = (n: Notification) => {
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min  = Math.floor(diff / 60_000)
    if (min < 1)   return 'À l\'instant'
    if (min < 60)  return `il y a ${min}min`
    const h = Math.floor(min / 60)
    if (h < 24)    return `il y a ${h}h`
    return `il y a ${Math.floor(h / 24)}j`
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-white/10 transition"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-white/70 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-xl border border-line overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <p className="font-display font-black text-ink">Notifications</p>
              {unread === 0 && <p className="text-xs font-mono text-dust uppercase">Tout lu ✓</p>}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gold border-t-transparent mx-auto" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="py-8 text-center space-y-2">
                  <p className="text-2xl">🔔</p>
                  <p className="text-sm text-gray-400">Aucune notification</p>
                </div>
              )}

              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-4 hover:bg-cream transition border-b border-line last:border-0 ${!n.read ? 'bg-gold/5' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-gold animate-pulse' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="text-xs text-slate line-clamp-2 mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-xs font-mono text-dust uppercase mt-2">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
