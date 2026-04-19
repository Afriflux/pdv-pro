'use client'

import { useState, useEffect } from 'react'
import { Bell, Package, Store, UserPlus, ShoppingBag, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface GlobalActivity {
  id: string
  type: 'product' | 'store' | 'user' | 'order'
  title: string
  subtitle: string
  time: string
  link: string
}

export function AdminGlobalBell() {
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<GlobalActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    setFailed(false)
    try {
      // Pour ce tutoriel, on va simuler un fecth API qui récupère les 10 dernières actions
      // En production, il faudra l'implémenter sur /api/admin/activities
      const res = await fetch('/api/admin/activities')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      } else {
        setFailed(true)
      }
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && activities.length === 0 && !failed) {
      fetchActivities()
    }
  }, [open, activities.length, failed])

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={() => setOpen(!open)}
        title="Notifications"
        className="relative p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all focus:outline-none"
      >
        <Bell size={20} className={open ? "text-emerald-500" : ""} />
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden origin-top-right animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Activité en Temps Réel
              </h3>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Analyse globale...</p>
                </div>
              ) : failed || activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">Flux d'activité branché</p>
                  <p className="text-xs text-gray-400 mt-1">L'historique des nouvelles entités apparaîtra ici.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activities.map((act) => (
                    <Link
                      key={act.id}
                      href={act.link}
                      onClick={() => setOpen(false)}
                      className="group flex gap-4 p-4 hover:bg-emerald-50/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        act.type === 'product' ? 'bg-purple-50 text-purple-600' :
                        act.type === 'order' ? 'bg-emerald-50 text-emerald-600' :
                        act.type === 'user' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {act.type === 'product' && <Package size={18} />}
                        {act.type === 'store' && <Store size={18} />}
                        {act.type === 'user' && <UserPlus size={18} />}
                        {act.type === 'order' && <ShoppingBag size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 mb-0.5 truncate group-hover:text-emerald-700 transition-colors">
                          {act.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mb-1">{act.subtitle}</p>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          {act.time}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50/50 border-t border-gray-50 text-center">
              <Link href="/admin/audit" onClick={() => setOpen(false)} className="text-xs font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-widest transition-colors">
                Voir tout l'historique →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
