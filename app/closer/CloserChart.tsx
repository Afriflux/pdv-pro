'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CloserChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0F7A60" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0F7A60" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `${val/1000}k`} />
        <Tooltip 
          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
          itemStyle={{ color: '#0F7A60', fontWeight: 'bold' }}
          labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
          formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Gains']}
        />
        <Area type="monotone" dataKey="gains" stroke="#0F7A60" strokeWidth={4} fillOpacity={1} fill="url(#colorGains)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0F7A60' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
