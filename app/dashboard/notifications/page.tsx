import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Bell, CheckCheck, Clock, Package, Wallet, AlertTriangle } from 'lucide-react'

const NOTIF_ICONS: Record<string, typeof Bell> = {
  order: Package,
  wallet: Wallet,
  alert: AlertTriangle,
  default: Bell,
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // Récupérer les notifications récentes
  const notifications = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    take: 50,
  })

  // Marquer toutes comme lues
  await prisma.notification.updateMany({
    where: { user_id: user.id, read: false },
    data: { read: true },
  })

  return (
    <div className="w-full relative z-10 px-4 lg:px-10 pb-20">
      <div className="w-full animate-in fade-in zoom-in-95 duration-700">
        <header className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-200/40 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-xl rounded-xl text-[#0F7A60] shadow-sm border border-gray-100">
              <Bell size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Notifications</h1>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </header>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCheck size={28} className="text-gray-400" />
            </div>
            <p className="text-base font-black text-gray-900 mb-1">Tout est à jour</p>
            <p className="text-sm text-gray-500">Vous n&apos;avez aucune notification pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const Icon = NOTIF_ICONS[notif.type ?? 'default'] || Bell
              const isUnread = !notif.read
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    isUnread
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                    isUnread ? 'bg-emerald-100 text-[#0F7A60]' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                    {notif.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-[#0F7A60] mt-2 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
