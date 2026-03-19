'use client'

import { AdminOverviewStats } from '@/lib/admin/adminActions'
import Link from 'next/link'
import { ReactNode } from 'react'

export interface AdminLogItem {
  id: string
  action: string
  target_type: string | null
  target_id: string | null
  created_at: string
  admin: { name: string; email: string; role: string } | null
}

interface Props {
  stats: AdminOverviewStats
  logs: AdminLogItem[]
  role: string
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  link: string
  color: string
}

export default function AdminOverviewClient({ stats, logs, role }: Props) {
  
  const StatCard = ({ title, value, icon, link, color }: StatCardProps) => (
    <Link href={link} className={`p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group flex items-center justify-between`}>
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
        <h3 className={`text-3xl font-black ${color}`}>{value}</h3>
      </div>
      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 text-2xl group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </Link>
  )

  return (
    <div className="space-y-8">
      {/* ── KPIs GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Vendeurs Actifs" 
          value={stats.totalVendors.toLocaleString()} 
          icon="🏪" 
          link="/admin/vendors" 
          color="text-gray-900" 
        />
        <StatCard 
          title="Acheteurs uniques" 
          value={stats.totalBuyers.toLocaleString()} 
          icon="👥" 
          link="/admin" 
          color="text-gray-900" 
        />
        <StatCard 
          title="Total Commandes" 
          value={stats.totalOrders.toLocaleString()} 
          icon="📦" 
          link="/admin/orders" 
          color="text-gray-900" 
        />
        <StatCard 
          title="Revenus PDV Pro (Commissions)" 
          value={`${stats.totalRevenue.toLocaleString()} F`} 
          icon="💰" 
          link="/admin/analytics" 
          color="text-orange-500" 
        />
        <StatCard 
          title="Retraits en Attente" 
          value={stats.pendingWithdrawals} 
          icon="💸" 
          link="/admin/withdrawals" 
          color={stats.pendingWithdrawals > 0 ? "text-red-500" : "text-green-500"} 
        />
        <StatCard 
          title="Signalements Ouverts" 
          value={stats.openReports} 
          icon="🚨" 
          link="/admin/reports" 
          color={stats.openReports > 0 ? "text-red-500" : "text-green-500"} 
        />
      </div>

      {/* ── ALERTS / RECENT LOGS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Activité Récente (Logs)</h2>
          {role === 'super_admin' && (
             <Link href="/admin/logs" className="text-sm font-semibold text-orange-600 hover:text-orange-500">
               Voir tout →
             </Link>
          )}
        </div>
        
        {role !== 'super_admin' ? (
          <div className="p-10 text-center text-gray-500 bg-gray-50">
            🔒 L&apos;historique des logs est réservé au Super Administrateur.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Aucune activité récente enregistrée.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {log.admin?.name ? log.admin.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {log.admin?.name || 'Admin inconnu'} 
                      <span className="text-gray-500 font-normal ml-1">a effectué :</span> {log.action}
                    </p>
                    {log.target_type && log.target_id && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Cible: {log.target_type} ({log.target_id.slice(0,8)}...)
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  )
}
