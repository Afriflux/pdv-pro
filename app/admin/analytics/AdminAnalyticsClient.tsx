'use client'

import { AdminAnalyticsData } from '@/lib/admin/adminActions'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  Users,
  Tag,
  Activity
} from 'lucide-react'

interface Props {
  data: AdminAnalyticsData
}

export default function AdminAnalyticsClient({ data }: Props) {
  
  const metrics = [
    {
      label: 'Volume d\'Affaires Global',
      value: `${data.totalRevenueVolume.toLocaleString('fr-FR')} FCFA`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      description: 'Total des ventes validées sur Yayyam'
    },
    {
      label: 'Commissions Yayyam',
      value: `${data.totalPlatformFees.toLocaleString('fr-FR')} FCFA`,
      icon: DollarSign,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      description: 'Revenus nets de la plateforme'
    },
    {
      label: 'Total Commandes',
      value: data.totalOrders.toLocaleString('fr-FR'),
      icon: ShoppingCart,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      description: 'Transactions confirmées / livrées'
    },
    {
      label: 'Boutiques Actives',
      value: data.totalStores.toLocaleString('fr-FR'),
      icon: Store,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      description: 'Marchands ayant initié un Store'
    },
    {
      label: 'Acheteurs Inscrits',
      value: data.totalBuyers.toLocaleString('fr-FR'),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: 'Comptes clients enregistrés'
    }
  ]

  const recentActivity = [
    {
      label: 'Commandes 30j',
      value: data.recentOrdersCount,
      icon: Activity,
      color: 'text-gray-900',
      bg: 'bg-gray-100'
    },
    {
      label: 'Promos Actives',
      value: data.activePromosCount,
      icon: Tag,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Actions Modération 30j',
      value: data.recentLogsCount,
      icon: Activity,
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  ]

  return (
    <div className="space-y-8">
      
      {/* ── METRIQUES GLOBALES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metric.bg} ${metric.color} group-hover:scale-110 transition-transform`}>
                <metric.icon size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{metric.label}</h3>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{metric.value}</p>
              <p className="text-sm text-gray-400 font-medium mt-1">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ACTIVITÉ RÉCENTE (30 DERNIERS JOURS) ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">Activité Récente (30 Jours)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recentActivity.map((act, i) => (
            <div key={i} className={`rounded-2xl p-6 border border-white/50 shadow-sm flex items-center gap-4 ${act.bg}`}>
               <div className={`shrink-0 ${act.color}`}>
                  <act.icon size={28} />
               </div>
               <div>
                 <p className="text-2xl font-black text-gray-900 leading-none">{act.value}</p>
                 <p className="text-sm font-semibold text-gray-600 mt-1">{act.label}</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FUTURE GRAPH PLACEHOLDER ── */}
      <div className="bg-gray-900 rounded-3xl p-10 flex flex-col items-center justify-center text-center border-4 border-gray-800 shadow-xl mt-12 min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 mb-6">
          <TrendingUp size={32} />
        </div>
        <h3 className="text-xl font-bold text-white max-w-sm">Graphiques de Croissance Détaillés</h3>
        <p className="text-gray-400 text-sm mt-3 max-w-md">L&apos;intégration des graphiques dynamiques de cohortes et de MRR sera activée dans la prochaine mise à jour de la roadmap.</p>
        <button className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-full text-sm font-bold hover:bg-gray-700 transition">
          Archivé pour la v1.1
        </button>
      </div>

    </div>
  )
}
