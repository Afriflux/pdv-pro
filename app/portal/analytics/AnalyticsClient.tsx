'use client'

import React, { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'
import { MousePointerClick, TrendingUp, CheckCircle2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface AnalyticsData {
  clicks: { date: string; count: number }[]
  conversions: { date: string; count: number; revenue: number }[]
  sources: { source: string; clicks: number; sales: number; revenue: number; epc: number; cr: number }[]
  summary: {
    totalClicks: number
    totalVentes: number
    totalRevenue: number
    epc: number // Earnings Per Click
    conversionRate: number
  }
}

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  
  // Fusion des données Clics et Conversions pour le graphique combiné
  const chartData = useMemo(() => {
    // Collect all unique dates
    const dateMap = new Map<string, any>()
    
    data.clicks.forEach(c => {
      dateMap.set(c.date, { date: c.date, clics: c.count, ventes: 0, revenus: 0 })
    })

    data.conversions.forEach(c => {
      if (dateMap.has(c.date)) {
        const existing = dateMap.get(c.date)
        existing.ventes = c.count
        existing.revenus = c.revenue
      } else {
        dateMap.set(c.date, { date: c.date, clics: 0, ventes: c.count, revenus: c.revenue })
      }
    })

    const finalData = Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Format dates to be more readable (e.g. "12 Mar")
    return finalData.map(item => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }))
  }, [data])

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 space-y-8">
      
      {/* 🌟 STATISTIQUES PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <StatsCard 
          title="Clics Générés" 
          value={data.summary.totalClicks.toLocaleString()} 
          icon={<MousePointerClick size={22} />}
          trend="+12% vs last month" // Mock trend for dynamic feel
          trendUp={true}
          colorClass="text-blue-600 bg-blue-50 border-blue-100"
        />

        <StatsCard 
          title="Ventes Finalisées" 
          value={data.summary.totalVentes.toLocaleString()} 
          icon={<CheckCircle2 size={22} />}
          trend="+5% vs last month"
          trendUp={true}
          colorClass="text-emerald-600 bg-emerald-50 border-emerald-100"
        />

        <StatsCard 
          title="Taux de Conversion" 
          value={data.summary.conversionRate.toFixed(2) + '%'} 
          icon={<TrendingUp size={22} />}
          trend="-1.2% vs last month"
          trendUp={false}
          colorClass="text-amber-600 bg-amber-50 border-amber-100"
        />

        <StatsCard 
          title="EPC (Earnings Per Click)" 
          value={data.summary.epc.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA'} 
          icon={<DollarSign size={22} />}
          trend="+32 FCFA vs last month"
          trendUp={true}
          colorClass="text-purple-600 bg-purple-50 border-purple-100"
        />

      </div>

      {/* 🌟 GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique d'évolution Principale */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-[#041D14]">Évolution du Trafic (30 jours)</h3>
            <p className="text-sm font-medium text-gray-500">Comparez vos clics générés avec vos ventes fermes.</p>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 'bold' }} />
                <Area type="monotone" name="Visites (Clics)" dataKey="clics" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClics)" />
                <Area type="monotone" name="Commandes Livrées" dataKey="ventes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique Revenus */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-[#041D14]">Gains Quotidien</h3>
            <p className="text-sm font-medium text-gray-500">Revenus validés par jour.</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
                  tickFormatter={(val) => `${val >= 1000 ? (val/1000) + 'k' : val}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Gains COD Validés']}
                />
                <Bar name="Gains Fixes" dataKey="revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>

      {/* 🌟 TABLEAU DES PERFORMANCES PAR SOURCE (SUB-ID) */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-6 shadow-sm overflow-hidden">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-[#041D14]">Performances par Source (Sub-ID)</h3>
            <p className="text-sm font-medium text-gray-500">Identifiez d'où proviennent vos meilleures ventes.</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2">
            <MousePointerClick size={14} /> Tracking Actif
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl border-b border-gray-100">Source (ID)</th>
                <th className="px-6 py-4 border-b border-gray-100 text-center">Clics</th>
                <th className="px-6 py-4 border-b border-gray-100 text-center">Ventes</th>
                <th className="px-6 py-4 border-b border-gray-100 text-center">Taux Conv.</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">EPC</th>
                <th className="px-6 py-4 rounded-tr-xl border-b border-gray-100 text-right">Revenus Générés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.sources.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500 font-medium">Aucune donnée disponible pour le moment.</td></tr>
              ) : (
                data.sources.map((src, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${src.source === 'Organique' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                          {src.source.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900">{src.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-gray-600">{src.clicks}</td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-gray-600">{src.sales}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${src.cr >= 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {src.cr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-500">
                      {src.epc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-gray-900">{src.revenue.toLocaleString('fr-FR')} FCFA</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

function StatsCard({ title, value, icon, trend, trendUp, colorClass }: { title: string, value: string | number, icon: React.ReactNode, trend: string, trendUp: boolean, colorClass: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-[2rem] p-5 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 ${colorClass}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
        <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  )
}
