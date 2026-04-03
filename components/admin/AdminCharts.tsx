'use client'

import dynamic from 'next/dynamic'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts'

// ─── Double Chart (Volume vs Revenus) ───────────────────────────────────────────────────────────

export const AdminDoubleChart = dynamic(
  () => Promise.resolve(({ data }: { data: { date: string; total_revenu: number; volume: number }[] }) => {
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
              <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F7A60" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0F7A60" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
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
            {/* On cache l'axe Y pour la beauté du design */}
            <YAxis hide={true} domain={['dataMin', 'auto']} />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => [
                `${Number(value).toLocaleString('fr-FR')} F`, 
                name === 'total_revenu' ? 'Revenus (Commissions)' : 'Volume (GMV)'
              ]}
              labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#C9A84C" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorVolume)" 
              activeDot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }}
            />
            <Area 
              type="monotone" 
              dataKey="total_revenu" 
              stroke="#0F7A60" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenu)" 
              activeDot={{ r: 6, fill: '#0F7A60', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }),
  {
    ssr: false,
    loading: () => <div className="h-[250px] bg-gray-50 rounded-2xl animate-pulse" />,
  }
)


// ─── Pie Chart (Statuts Commandes) ─────────────────────────────────────────────────────────────

const COLORS = ['#0F7A60', '#3B82F6', '#EF4444', '#F59E0B', '#6B7280']

export const AdminPieChart = dynamic(
  () => Promise.resolve(({ data }: { data: { name: string; value: number }[] }) => {
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
      return (
        <div className="w-full h-[200px] flex items-center justify-center text-gray-400 text-sm italic bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          Aucune donnée
        </div>
      )
    }

    return (
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value: any) => [`${value} commandes`]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }),
  {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-50 rounded-2xl animate-pulse" />,
  }
)
