/* eslint-disable react/forbid-dom-props */
'use client'

// ─── app/dashboard/analytics/AnalyticsClient.tsx ─────────────────────────────
// Refonte complète : 3 onglets (Données | IA Insights | Export)
// Restrictions Pro+ supprimées — 90 jours pour tous

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  Users, TrendingUp, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, MapPin, Target, FileText,
  Sparkles, Download, Brain, RefreshCw, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { AnalyticsData } from '@/lib/analytics/analyticsActions'
import ExportPdfButton from './ExportPdfButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'donnees' | 'ia' | 'export'

interface Insight {
  type:    'alert' | 'warning' | 'opportunity' | 'success'
  icon:    string
  title:   string
  message: string
  action?: string
}

interface InsightsResponse {
  insights:       Insight[]
  score:          number
  recommendation: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const COLORS  = ['#0F7A60', '#F97316', '#6366F1', '#EC4899', '#8B5CF6']

const INSIGHT_STYLES: Record<
  Insight['type'],
  { bg: string; border: string; text: string; badge: string }
> = {
  alert:       { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700' },
  warning:     { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  opportunity: { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  success:     { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
}

const INSIGHT_LABELS: Record<Insight['type'], string> = {
  alert:       'Alerte',
  warning:     'Attention',
  opportunity: 'Opportunité',
  success:     'Succès',
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AnalyticsClientProps {
  data:          AnalyticsData
  currentPeriod: number
  storeName:     string
}

export default function AnalyticsClient({
  data,
  currentPeriod,
  storeName,
}: AnalyticsClientProps) {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabId>('donnees')

  // ── IA Insights state ───────────────────────────────────────────────────────
  const [insights,     setInsights]     = useState<InsightsResponse | null>(null)
  const [insightLoad,  setInsightLoad]  = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)

  // ── Export state ────────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  const setPeriod = (days: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('days', days)
    router.push(`/dashboard/analytics?${params.toString()}`)
  }

  // Entonnoir
  const funnelData = [
    { name: 'Visites',  value: data.funnel.views,     fill: '#64748b' },
    { name: 'Initiés',  value: data.funnel.checkouts, fill: '#F97316' },
    { name: 'Ventes',   value: data.funnel.purchases, fill: '#0F7A60' },
  ]

  // ── Analyser via l'IA heuristique ──────────────────────────────────────────
  const analyzeInsights = async () => {
    setInsightLoad(true)
    setInsightError(null)
    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId:     data.storeName, // utilisé côté serveur pour l'ownership
          kpis:        data.kpis,
          topProducts: data.topProducts,
          funnel:      data.funnel,
          chartData:   data.chartData,
          days:        currentPeriod,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const json = await res.json() as InsightsResponse
      setInsights(json)
    } catch {
      setInsightError('Impossible d\'analyser les données. Réessayez.')
    } finally {
      setInsightLoad(false)
    }
  }

  // ── Télécharger un CSV ─────────────────────────────────────────────────────
  const downloadCsv = (type: 'orders' | 'kpis' | 'full') => {
    setExportLoading(type)
    const url = `/api/analytics/export?storeId=${data.storeName}&days=${currentPeriod}&type=${type}`
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setExportLoading(null), 1500)
  }

  // ── Score santé → couleur ──────────────────────────────────────────────────
  const scoreColor = (s: number) =>
    s >= 75 ? '#0F7A60' : s >= 50 ? '#F97316' : '#EF4444'

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-black text-[#1A1A1A] tracking-tight">
            Performances &amp; Analytics
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Analyse complète de votre activité — jusqu&apos;à 90 jours.
          </p>
        </div>

        {/* Sélecteur de période — actif pour tous */}
        <div className="flex bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-[#0F7A60]/5 p-1.5 rounded-2xl self-start">
          {[
            { label: '7 jours',  value: '7'  },
            { label: '30 jours', value: '30' },
            { label: '90 jours', value: '90' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                currentPeriod.toString() === p.value
                  ? 'bg-[#1A1A1A] text-white shadow-lg shadow-black/10'
                  : 'text-slate-500 hover:text-[#1A1A1A] hover:bg-white/80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ONGLETS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-white/60 backdrop-blur-2xl p-1.5 rounded-2xl w-fit border border-white shadow-xl shadow-gray-200/50 relative z-10">
        {([
          { id: 'donnees', icon: <BarChart3 size={16} />, label: 'Données'     },
          { id: 'ia',      icon: <Brain     size={16} />, label: 'IA Insights' },
          { id: 'export',  icon: <Download  size={16} />, label: 'Export'      },
        ] as { id: TabId; icon: React.ReactNode; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-white text-[#1A1A1A] shadow-lg shadow-black/5 ring-1 ring-black/5'
                : 'text-slate-500 hover:text-[#1A1A1A] hover:bg-white/60'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 1 — DONNÉES
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'donnees' && (
        <div className="space-y-8">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Vues Produits"
              value={data.kpis.views.toLocaleString('fr-FR')}
              icon={<Users className="text-blue-500" size={20} />}
              trend={data.kpis.viewsTrend}
              label="vues totales"
            />
            <StatCard
              title="Ventes"
              value={data.kpis.sales.toLocaleString('fr-FR')}
              icon={<Target className="text-purple-500" size={20} />}
              trend={data.kpis.salesTrend}
              label="commandes confirmées"
            />
            <StatCard
              title="Taux de Conv."
              value={`${data.kpis.conversion.toFixed(1)}%`}
              icon={<TrendingUp className="text-orange-500" size={20} />}
              trend={data.kpis.conversionTrend}
              label="visites converties"
            />
            <StatCard
              title="Revenu Net"
              value={`${Math.round(data.kpis.revenue).toLocaleString('fr-FR')} F`}
              icon={<DollarSign className="text-emerald-500" size={20} />}
              trend={data.kpis.revenueTrend}
              label="chiffre d'affaires"
              highlight
            />
          </div>

          {/* Charts principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Revenue Area Chart */}
            <div className="lg:col-span-8 bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#0F7A60]/20 to-[#0F7A60]/5 rounded-xl border border-[#0F7A60]/20 shadow-inner">
                    <DollarSign className="text-[#0F7A60]" size={20} />
                  </div>
                  Évolution des revenus (F CFA)
                </h2>
              </div>
              
              <div className="h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#0F7A60" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0F7A60" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: 800, fontSize: '13px', color: '#1A1A1A' }}
                      labelStyle={{ fontWeight: 900, marginBottom: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      cursor={{ stroke: '#0F7A60', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke="#0F7A60" strokeWidth={5}
                      fillOpacity={1} fill="url(#colorRev)"
                      animationDuration={1500}
                      activeDot={{ r: 6, fill: '#0F7A60', stroke: 'white', strokeWidth: 3, className: 'drop-shadow-md' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Entonnoir */}
            <div className="lg:col-span-4 bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-orange-500/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-8 relative z-10 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl border border-orange-500/20 shadow-inner">
                  <BarChart3 className="text-orange-500" size={20} />
                </div>
                Entonnoir
              </h2>
              
              <div className="h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name" type="category"
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 900, fill: '#1e293b' }}
                    />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={32} animationDuration={1500}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer duration-300" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Grille inférieure */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-8">
              {/* Sources trafic */}
              <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-blue-500/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-6 relative z-10 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Users size={18} /></div>
                  Trafic
                </h2>
                <div className="h-[200px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.sources} innerRadius={60} outerRadius={85} paddingAngle={6} dataKey="value" nameKey="name" cornerRadius={6}>
                        {data.sources.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer duration-300 drop-shadow-sm" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} itemStyle={{ fontWeight: 800, fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3 relative z-10">
                  {data.sources.length > 0 ? data.sources.map((s, index) => (
                    <div key={s.name} className="flex items-center justify-between text-xs font-bold p-2 hover:bg-white rounded-lg transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-500 uppercase tracking-widest">{s.name}</span>
                      </div>
                      <span className="text-[#1A1A1A] text-sm tabular-nums">{s.value}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">Pas de données de trafic.</p>
                  )}
                </div>
              </div>

              {/* Géographie */}
              <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-red-500/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-6 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><MapPin size={18} /></div>
                  Top Villes
                </h2>
                <div className="space-y-5 relative z-10">
                  {data.geography.length > 0 ? data.geography.map((g, i) => (
                    <div key={g.city} className="space-y-2 group/bar cursor-default">
                      <div className="flex justify-between text-xs font-black px-1">
                        <span className="text-slate-500 uppercase tracking-widest group-hover/bar:text-[#1A1A1A] transition-colors">{g.city}</span>
                        <span className="text-[#1A1A1A] tabular-nums">{g.value}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100/50 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full transition-all duration-1000 ease-out rounded-full shadow-sm"
                          style={{
                            width: `${(g.value / (data.geography[0]?.value || 1)) * 100}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">Pas encore de données géographiques.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top pages + top produits */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-[#C9A84C]/5 overflow-hidden relative group hover:shadow-2xl hover:shadow-[#C9A84C]/10 transition-all duration-500">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-bl from-[#C9A84C]/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-6 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-[#C9A84C]/10 rounded-xl text-[#C9A84C]"><FileText size={18} /></div>
                  Meilleures Pages de Vente
                </h2>
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4 pl-2">Page</th>
                        <th className="pb-4 text-center">Vues</th>
                        <th className="pb-4 text-right pr-2">Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                      {data.topPages.map(page => (
                        <tr key={page.name} className="group/row hover:bg-white transition-colors cursor-default rounded-xl">
                          <td className="py-4 pl-2 font-bold text-sm text-[#1A1A1A] group-hover/row:text-[#C9A84C] transition-colors">{page.name}</td>
                          <td className="py-4 text-center text-sm font-black tabular-nums">{page.views.toLocaleString('fr-FR')}</td>
                          <td className="py-4 text-right pr-2">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black shadow-sm group-hover/row:bg-emerald-500 group-hover/row:text-white group-hover/row:border-emerald-600 transition-all">
                              {page.conversion.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.topPages.length === 0 && (
                        <tr><td colSpan={3} className="py-12 text-center text-slate-400 italic font-medium">Aucune page active détectée.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 overflow-hidden relative group hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500">
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gradient-to-tl from-[#0F7A60]/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-6 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600"><DollarSign size={18} /></div>
                  Produits Rentables
                </h2>
                <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4 pl-2">Produit</th>
                        <th className="pb-4 text-center">Ventes</th>
                        <th className="pb-4 text-right pr-2">Revenus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                      {data.topProducts.map(p => (
                        <tr key={p.id} className="group/row hover:bg-white transition-colors cursor-default rounded-xl">
                          <td className="py-4 pl-2">
                            <p className="font-bold text-sm text-[#1A1A1A] group-hover/row:text-emerald-700 transition-colors">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider mt-0.5">ID: {p.id.slice(0, 8)}</p>
                          </td>
                          <td className="py-4 text-center text-sm font-black tabular-nums">{p.sales}</td>
                          <td className="py-4 text-right text-sm font-black text-emerald-700 group-hover/row:text-emerald-500 transition-colors pr-2 tabular-nums">
                            {Math.round(p.revenue).toLocaleString('fr-FR')} F
                          </td>
                        </tr>
                      ))}
                      {data.topProducts.length === 0 && (
                        <tr><td colSpan={3} className="py-12 text-center text-slate-400 italic font-medium">Pas de ventes sur cette période.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 2 — IA INSIGHTS
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ia' && (
        <div className="space-y-6">
          {/* En-tête + bouton analyse */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50 blur-2xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0F7A60]/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="space-y-3 relative z-10 max-w-2xl">
              <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <Brain className="text-white" size={28} />
                </div>
                Cerveau Analytique PDV Pro
              </h2>
              <p className="text-slate-300 leading-relaxed font-medium">
                Propulsé par une IA heuristique, ce moteur synthétise vos {currentPeriod} derniers jours pour en extraire des recommandations stratégiques à haute valeur ajoutée.
              </p>
            </div>
            <button
              onClick={analyzeInsights}
              disabled={insightLoad}
              className="relative z-10 flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50
                text-[#1A1A1A] font-black rounded-2xl transition-all shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.5)] hover:-translate-y-1
                disabled:opacity-80 disabled:cursor-not-allowed group/btn overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              {insightLoad
                ? <><RefreshCw size={20} className="animate-spin text-[#0F7A60]" /> <span className="text-[#0F7A60]">Analyse neuronale…</span></>
                : <><Sparkles size={20} className="text-[#0F7A60]" /> Lancer le diagnostic</>
              }
            </button>
          </div>

          {/* Erreur */}
          {insightError && (
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl p-5 text-sm text-red-700 font-bold flex items-center gap-3">
              <AlertCircle size={18} />
              {insightError}
            </div>
          )}

          {/* Résultats */}
          {insights && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

              {/* Score santé + recommandation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Jauge score */}
                <div className="lg:col-span-4 bg-white/80 backdrop-blur-2xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 rounded-[32px] border border-white shadow-xl p-8 flex flex-col items-center gap-6">
                  <p className="text-[11px] font-black text-[#0F7A60] uppercase tracking-widest bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full">Score Santé</p>
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Glow derrière */}
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-1000" style={{ backgroundColor: scoreColor(insights.score) }} />
                    {/* Arc SVG */}
                    <svg className="absolute inset-0 -rotate-90 drop-shadow-lg" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={scoreColor(insights.score)} strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - insights.score / 100)}`}
                        className="transition-all duration-1500 ease-out"
                      />
                    </svg>
                    <div className="text-center relative z-10 bg-white/80 w-24 h-24 rounded-full flex flex-col items-center justify-center backdrop-blur-sm border border-white/40 shadow-sm">
                      <p className="text-4xl font-black drop-shadow-sm transition-colors duration-1000" style={{ color: scoreColor(insights.score) }}>
                        {insights.score}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">/ 100</p>
                    </div>
                  </div>
                  <p className="text-sm text-center text-slate-500 font-bold px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-50">
                    {insights.score >= 75 ? '🚀 Excellent Momentum' : insights.score >= 50 ? '📈 Croissance Stable' : '⚠️ Actions Requises'}
                  </p>
                </div>

                {/* Recommandation principale */}
                <div className="lg:col-span-8 bg-gradient-to-br from-[#0F7A60] to-[#0D6B53] rounded-[2.5rem] border border-[#0F7A60]/20 shadow-[0_15px_40px_-15px_rgba(15,122,96,0.3)] p-10 flex flex-col justify-center gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700 pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/10 rounded-lg text-white backdrop-blur-md">
                      <Target size={20} />
                    </div>
                    <p className="text-xs font-black text-emerald-100 uppercase tracking-widest">Recommandation Stratégique Master</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white leading-relaxed relative z-10 drop-shadow-sm">
                    {insights.recommendation}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-emerald-100/80 font-bold mt-2 bg-black/10 w-fit px-4 py-2 rounded-full backdrop-blur-md relative z-10 border border-white/5">
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    Macro-diagostiqued sur {currentPeriod} jours
                  </div>
                </div>
              </div>

              {/* Cards insights */}
              {insights.insights.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white shadow-xl p-16 text-center space-y-4">
                  <div className="text-6xl drop-shadow-lg mb-6">✅</div>
                  <p className="text-2xl font-black text-[#1A1A1A]">Système parfaitement sain !</p>
                  <p className="text-slate-500 font-medium max-w-md mx-auto">Toutes vos métriques sont au vert. Aucune anomalie détectée sur la période analysée. Continuez sur cette lancée !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insights.insights.map((insight, i) => {
                    const style = INSIGHT_STYLES[insight.type]
                    return (
                      <div
                        key={i}
                        className={`bg-white/80 backdrop-blur-2xl rounded-[32px] border overflow-hidden p-8 space-y-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 relative group ${style.border}`}
                      >
                         <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40 ${style.bg.replace('bg-', 'bg-')}`} />
                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl drop-shadow-sm">{insight.icon}</span>
                            <p className={`font-black text-lg ${style.text}`}>{insight.title}</p>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full flex-shrink-0 border border-white/50 shadow-sm ${style.badge}`}>
                            {INSIGHT_LABELS[insight.type]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">{insight.message}</p>
                        {insight.action && (
                          <div className="pt-2 relative z-10">
                            <p className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${style.badge} hover:opacity-80 cursor-pointer border border-white/50 shadow-sm`}>
                              {insight.action}
                              <ArrowUpRight size={14} />
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* État vide */}
          {!insights && !insightLoad && !insightError && (
            <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] border border-white ring-1 ring-slate-100/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] p-16 text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-white relative group">
                <div className="absolute inset-0 rounded-[2rem] bg-indigo-500/5 blur-xl group-hover:blur-2xl transition-all" />
                <Brain size={40} className="text-slate-300 relative z-10 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#1A1A1A] mb-2">Prêt pour le diagnostic</p>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                  Lancez l'analyse neuronale pour obtenir des recommandations sur-mesure pour développer vos ventes.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 3 — EXPORT
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 p-8 md:p-12 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-[#1A1A1A] flex items-center gap-3">
                <Download className="text-[#0F7A60]" size={28} />
                Exporter mes données
              </h2>
              <p className="text-slate-500 font-medium">
                Générez des rapports instantanés pour votre comptabilité ou vos archives sur la période des {currentPeriod} derniers jours.
              </p>
            </div>

            {/* Exports CSV */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([
                {
                  type:    'orders' as const,
                  icon:    '📊',
                  label:   'CSV Commandes',
                  desc:    'Historique détaillé de chaque transaction et statut',
                  color:   'from-blue-500/5 to-transparent hover:from-blue-500/10 hover:border-blue-200 text-blue-700',
                },
                {
                  type:    'kpis' as const,
                  icon:    '📈',
                  label:   'CSV KPIs',
                  desc:    'Synthèse de vos métriques clés avec calcul des tendances',
                  color:   'from-emerald-500/5 to-transparent hover:from-emerald-500/10 hover:border-emerald-200 text-emerald-700',
                },
                {
                  type:    'full' as const,
                  icon:    '📋',
                  label:   'Master CSV',
                  desc:    'Base de données complète : KPIs + Produits + Commandes',
                  color:   'from-purple-500/5 to-transparent hover:from-purple-500/10 hover:border-purple-200 text-purple-700',
                },
              ]).map(btn => (
                <button
                  key={btn.type}
                  onClick={() => downloadCsv(btn.type)}
                  disabled={exportLoading === btn.type}
                  className={`group flex flex-col items-start gap-4 p-8 bg-white/80 backdrop-blur-xl border border-white rounded-[32px]
                    transition-all duration-500 text-left shadow-lg hover:shadow-2xl hover:shadow-[#0F7A60]/10 hover:-translate-y-1
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${btn.color}`}
                >
                  <div className="w-14 h-14 bg-white shadow-sm border border-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {exportLoading === btn.type ? '⏳' : btn.icon}
                  </div>
                  <div>
                    <p className="font-black text-lg text-[#1A1A1A] mb-1">{btn.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{btn.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors mt-auto pt-4 w-full">
                    <Download size={14} />
                    {exportLoading === btn.type ? 'Génération...' : 'Télécharger'}
                  </div>
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-6 py-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em] bg-white px-4 py-1 rounded-full border border-slate-100 shadow-sm">Export Pro</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* Export PDF */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-br from-slate-900 to-[#1A1A1A] rounded-[2rem] border border-black p-8 md:p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-1000 pointer-events-none" />
              <div className="space-y-2 relative z-10 mb-6 sm:mb-0">
                <p className="font-black text-2xl text-white flex items-center gap-3">
                  📄 Rapport Exécutif PDF
                </p>
                <p className="text-sm text-slate-400 font-medium max-w-sm">
                  Générez un document charté et mis en page de vos performances, idéal pour les partenaires financiers ou associés.
                </p>
              </div>
              <div className="relative z-10 sm:ml-8 w-full sm:w-auto flex-shrink-0">
                <ExportPdfButton data={data} storeName={storeName} days={currentPeriod} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-5 flex items-start gap-3 backdrop-blur-sm">
            <span className="text-xl flex-shrink-0 drop-shadow-sm">💡</span>
            <p className="text-sm text-[#0F7A60] font-bold leading-relaxed">
              Astuce : Les exports prennent une photo instantanée des données de la période active. Assurez-vous d'avoir sélectionné les {currentPeriod} jours corrects en haut de page avant de générer le fichier !
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composant StatCard ──────────────────────────────────────────────────

function StatCard({
  title, value, icon, trend, label, highlight,
}: {
  title:     string
  value:     string
  icon:      React.ReactNode
  trend?:    number
  label:     string
  highlight?: boolean
}) {
  return (
    <div className={`relative bg-white/80 backdrop-blur-2xl p-6 sm:p-7 rounded-[32px] overflow-hidden group hover:-translate-y-1 transition-all duration-500
      ${highlight ? 'shadow-xl shadow-[#C9A84C]/10 hover:shadow-2xl hover:shadow-[#C9A84C]/20 border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/5 to-transparent' : 'shadow-xl shadow-gray-200/50 hover:shadow-2xl border border-white hover:border-[#0F7A60]/30 hover:shadow-[#0F7A60]/10'}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full blur-2xl translate-x-10 -translate-y-10" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner
          group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
          ${highlight ? 'bg-gradient-to-br from-[#C9A84C] to-[#b3923a] text-white shadow-lg shadow-[#C9A84C]/30' : 'bg-white border border-slate-100 text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-white group-hover:border-[#1A1A1A]'}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all duration-500
            ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 group-hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20 group-hover:bg-red-500/20'}`}
          >
            {trend >= 0
              ? <ArrowUpRight   size={14} className="mr-0.5" />
              : <ArrowDownRight size={14} className="mr-0.5" />
            }
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1.5 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-3xl font-black tracking-tighter ${highlight ? 'text-[#C9A84C]' : 'text-[#1A1A1A]'}`}>{value}</p>
        <p className="text-[11px] text-slate-500 font-bold tracking-tight">{label}</p>
      </div>
      
      {highlight && (
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#C9A84C]/20 rounded-full blur-3xl group-hover:bg-[#C9A84C]/30 transition-colors duration-700 pointer-events-none" />
      )}
    </div>
  )
}
