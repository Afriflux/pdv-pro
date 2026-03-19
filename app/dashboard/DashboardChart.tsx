'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

interface DashboardChartProps {
  data: { date: string; total: number }[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[250px] flex items-center justify-center text-gray-400 text-sm italic bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
        Pas assez de données pour afficher le graphique
      </div>
    )
  }

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F7A60" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0F7A60" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            hide={true} 
            domain={['dataMin', 'auto']}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Chiffre d\'affaires']}
            labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="#0F7A60" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#0F7A60' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DashboardChart
