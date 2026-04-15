import { createAdminClient } from '@/lib/supabase/admin'
import { Bell, Send, Smartphone, Users, Clock, CheckCircle, BarChart3, Zap, Settings } from 'lucide-react'

export const metadata = {
  title: 'Notifications Push | Yayyam Admin',
}

import NotificationsClient from './NotificationsClient'

export default async function NotificationsPage() {
  const supabase = createAdminClient()

  // KPIs
  const [
    { count: totalUsers },
    { count: vendeurCount },
    { count: acheteurCount },
  ] = await Promise.all([
    supabase.from('User').select('id', { count: 'exact', head: true }),
    supabase.from('User').select('id', { count: 'exact', head: true }).eq('role', 'vendeur'),
    supabase.from('User').select('id', { count: 'exact', head: true }).eq('role', 'acheteur'),
  ])

  // Get config
  const { data: configs } = await supabase.from('PlatformConfig').select('key, value')
  const configMap: Record<string, string> = {}
  for (const row of (configs || [])) {
    configMap[row.key] = row.value
  }

  const activeChannelsCount = ['notif_whatsapp_active', 'notif_email_active', 'notif_telegram_active', 'notif_push_active'].filter(k => configMap[k] === 'true').length

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-[#012928] via-[#0A4138] to-[#04332A] pt-10 pb-24 px-6 lg:px-10 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-white/10 text-white shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              <Bell className="w-6 h-6" />
            </div>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Notifications & Alertes</h1>
              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                Centre de gestion de tous les canaux de communication Yayyam.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Audience totale', value: totalUsers ?? 0, icon: Users },
            { label: 'Vendeurs', value: vendeurCount ?? 0, icon: Smartphone },
            { label: 'Clients', value: acheteurCount ?? 0, icon: Send },
            { label: 'Canaux actifs', value: activeChannelsCount, icon: CheckCircle },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={14} className="text-white/40" />
                <span className="text-white/50 text-xs font-black uppercase tracking-widest">{kpi.label}</span>
              </div>
              <span className="text-2xl font-black text-white">{kpi.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="px-6 lg:px-10 -mt-16 pb-20 relative z-20 space-y-8">
        <NotificationsClient initialConfig={configMap} />
      </div>
    </div>
  )
}
