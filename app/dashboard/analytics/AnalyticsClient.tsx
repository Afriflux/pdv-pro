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
  Sparkles, Download, Brain, RefreshCw, CheckCircle2,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-black text-ink tracking-tight">
            Performances &amp; Analytics
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Analyse complète de votre activité — jusqu&apos;à 90 jours.
          </p>
        </div>

        {/* Sélecteur de période — actif pour tous */}
        <div className="flex bg-white/60 backdrop-blur-md border border-white shadow-sm p-1.5 rounded-2xl self-start">
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
                  ? 'bg-ink text-white shadow-lg'
                  : 'text-slate-500 hover:text-ink hover:bg-white/80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ONGLETS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-slate-100/60 p-1.5 rounded-2xl w-fit">
        {([
          { id: 'donnees', icon: <BarChart3 size={16} />, label: 'Données'     },
          { id: 'ia',      icon: <Brain     size={16} />, label: 'IA Insights' },
          { id: 'export',  icon: <Download  size={16} />, label: 'Export'      },
        ] as { id: TabId; icon: React.ReactNode; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-ink shadow-sm'
                : 'text-slate-500 hover:text-ink'
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
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-ink tracking-tight flex items-center gap-3">
                  <BarChart3 className="text-[#C9A84C]" />
                  Évolution des revenus (F CFA)
                </h2>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0F7A60" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0F7A60" stopOpacity={0}   />
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
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                      labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', color: '#64748b' }}
                    />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke="#0F7A60" strokeWidth={4}
                      fillOpacity={1} fill="url(#colorRev)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Entonnoir */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-ink tracking-tight mb-8">Entonnoir</h2>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name" type="category"
                      axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 800, fill: '#1e293b' }}
                    />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40} animationDuration={1500}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-ink tracking-tight mb-6">Sources du trafic</h2>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.sources} innerRadius={50} outerRadius={80} paddingAngle={8} dataKey="value" nameKey="name">
                        {data.sources.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {data.sources.length > 0 ? data.sources.map((s, index) => (
                    <div key={s.name} className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-500 uppercase tracking-tight">{s.name}</span>
                      </div>
                      <span className="text-ink">{s.value}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">Pas de données de trafic.</p>
                  )}
                </div>
              </div>

              {/* Géographie */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-ink tracking-tight mb-6 flex items-center gap-2">
                  <MapPin className="text-red-500" size={20} />
                  Top Villes
                </h2>
                <div className="space-y-4">
                  {data.geography.length > 0 ? data.geography.map((g, i) => (
                    <div key={g.city} className="space-y-2">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-slate-500 uppercase tracking-tight">{g.city}</span>
                        <span className="text-ink">{g.value}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-1000"
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
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <h2 className="text-xl font-black text-ink tracking-tight mb-6 flex items-center gap-2">
                  <FileText className="text-[#C9A84C]" size={20} />
                  Meilleures Pages de Vente
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-4">Page</th>
                        <th className="pb-4 text-center">Vues</th>
                        <th className="pb-4 text-right">Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.topPages.map(page => (
                        <tr key={page.name} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 font-bold text-sm text-ink group-hover:text-[#C9A84C] transition-colors">{page.name}</td>
                          <td className="py-4 text-center text-sm font-black">{page.views.toLocaleString('fr-FR')}</td>
                          <td className="py-4 text-right">
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black">
                              {page.conversion.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.topPages.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic font-medium">Aucune page active détectée.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <h2 className="text-xl font-black text-ink tracking-tight mb-6 flex items-center gap-2">
                  <BarChart3 className="text-blue-500" size={20} />
                  Produits Rentables
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-4">Produit</th>
                        <th className="pb-4 text-center">Ventes</th>
                        <th className="pb-4 text-right">Revenus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.topProducts.map(p => (
                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <p className="font-bold text-sm text-ink">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold font-mono">ID: {p.id.slice(0, 8)}</p>
                          </td>
                          <td className="py-4 text-center text-sm font-black">{p.sales}</td>
                          <td className="py-4 text-right text-sm font-black text-emerald-700 group-hover:text-emerald-600 transition-colors">
                            {Math.round(p.revenue).toLocaleString('fr-FR')} F
                          </td>
                        </tr>
                      ))}
                      {data.topProducts.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic font-medium">Pas de ventes sur cette période.</td></tr>
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
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-ink flex items-center gap-3">
                <Brain className="text-[#0F7A60]" size={28} />
                Analyse IA de votre boutique
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Notre moteur IA analyse vos {currentPeriod} derniers jours et détecte
                alertes, opportunités et points forts en temps réel.
              </p>
            </div>
            <button
              onClick={analyzeInsights}
              disabled={insightLoad}
              className="flex-shrink-0 flex items-center gap-3 px-6 py-3.5 bg-[#0F7A60] hover:bg-[#0D6B53]
                text-white font-black rounded-2xl transition-all shadow-md shadow-[#0F7A60]/20
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {insightLoad
                ? <><RefreshCw size={18} className="animate-spin" /> Analyse en cours…</>
                : <><Sparkles size={18} /> Analyser mes données</>
              }
            </button>
          </div>

          {/* Erreur */}
          {insightError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-medium">
              {insightError}
            </div>
          )}

          {/* Résultats */}
          {insights && (
            <div className="space-y-6">

              {/* Score santé + recommandation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Jauge score */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Score santé boutique</p>
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Arc SVG */}
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={scoreColor(insights.score)} strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - insights.score / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-4xl font-black" style={{ color: scoreColor(insights.score) }}>
                        {insights.score}
                      </p>
                      <p className="text-xs text-slate-400 font-bold">/ 100</p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-slate-500 font-medium">
                    {insights.score >= 75 ? '🚀 Excellent' : insights.score >= 50 ? '📈 Correct' : '⚠️ À améliorer'}
                  </p>
                </div>

                {/* Recommandation principale */}
                <div className="bg-gradient-to-br from-[#0F7A60]/5 to-[#0F7A60]/10 rounded-[2rem] border border-[#0F7A60]/20 shadow-sm p-8 flex flex-col justify-center gap-4">
                  <p className="text-xs font-black text-[#0F7A60] uppercase tracking-widest">Recommandation principale</p>
                  <p className="text-base font-bold text-ink leading-relaxed">
                    {insights.recommendation}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <CheckCircle2 size={14} className="text-[#0F7A60]" />
                    Analyse basée sur {currentPeriod} jours de données
                  </div>
                </div>
              </div>

              {/* Cards insights */}
              {insights.insights.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center space-y-3">
                  <div className="text-4xl">✅</div>
                  <p className="font-black text-ink">Tout semble aller bien !</p>
                  <p className="text-sm text-slate-500">Aucune anomalie détectée sur cette période.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insights.insights.map((insight, i) => {
                    const style = INSIGHT_STYLES[insight.type]
                    return (
                      <div
                        key={i}
                        className={`${style.bg} ${style.border} border rounded-2xl p-5 space-y-3`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{insight.icon}</span>
                            <p className={`font-black text-sm ${style.text}`}>{insight.title}</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${style.badge}`}>
                            {INSIGHT_LABELS[insight.type]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{insight.message}</p>
                        {insight.action && (
                          <p className={`text-xs font-bold ${style.text} flex items-center gap-1.5`}>
                            <ArrowUpRight size={12} />
                            {insight.action}
                          </p>
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
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                <Brain size={32} className="text-slate-300" />
              </div>
              <p className="font-black text-ink">Prêt à analyser</p>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Cliquez sur &ldquo;Analyser mes données&rdquo; pour obtenir des recommandations
                personnalisées basées sur l&apos;activité de votre boutique.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 3 — EXPORT
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-ink">📥 Exporter mes données</h2>
              <p className="text-sm text-slate-500">
                Téléchargez vos analytiques pour la période de {currentPeriod} jours au format CSV ou PDF.
              </p>
            </div>

            {/* Exports CSV */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                {
                  type:    'orders' as const,
                  icon:    '📊',
                  label:   'CSV Commandes',
                  desc:    'Toutes vos commandes avec produit, montant et statut',
                  color:   'hover:border-blue-300 hover:bg-blue-50/30',
                },
                {
                  type:    'kpis' as const,
                  icon:    '📈',
                  label:   'CSV KPIs',
                  desc:    'Résumé des indicateurs clés avec tendances vs période précédente',
                  color:   'hover:border-emerald-300 hover:bg-emerald-50/30',
                },
                {
                  type:    'full' as const,
                  icon:    '📋',
                  label:   'Rapport complet',
                  desc:    'KPIs + Top produits + toutes les commandes en un fichier',
                  color:   'hover:border-purple-300 hover:bg-purple-50/30',
                },
              ]).map(btn => (
                <button
                  key={btn.type}
                  onClick={() => downloadCsv(btn.type)}
                  disabled={exportLoading === btn.type}
                  className={`group flex flex-col items-start gap-3 p-6 bg-white border-2 border-slate-100 rounded-2xl
                    transition-all duration-200 text-left ${btn.color}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-3xl">{exportLoading === btn.type ? '⏳' : btn.icon}</span>
                  <div>
                    <p className="font-black text-sm text-ink">{btn.label}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{btn.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors mt-auto">
                    <Download size={12} />
                    {exportLoading === btn.type ? 'Téléchargement…' : 'Télécharger CSV'}
                  </div>
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Export PDF */}
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-5">
              <div className="space-y-1">
                <p className="font-black text-sm text-ink">📄 Rapport PDF</p>
                <p className="text-xs text-slate-500">
                  Rapport mis en page, prêt à partager avec vos partenaires.
                </p>
              </div>
              <ExportPdfButton data={data} storeName={storeName} days={currentPeriod} />
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm text-[#0F7A60] font-medium leading-relaxed">
              Les exports incluent uniquement les données de votre boutique sur la période sélectionnée.
              Changez la période en haut de page avant d&apos;exporter.
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
    <div className={`bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden
      group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500
      ${highlight ? 'ring-2 ring-[#C9A84C]/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center
          group-hover:scale-110 group-hover:bg-ink group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-xl
            ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}
          >
            {trend >= 0
              ? <ArrowUpRight   size={14} className="mr-0.5" />
              : <ArrowDownRight size={14} className="mr-0.5" />
            }
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${highlight ? 'text-[#0F7A60]' : 'text-ink'}`}>{value}</p>
        <p className="text-[10px] text-slate-400 font-medium tracking-tight uppercase tracking-widest">{label}</p>
      </div>
      {highlight && (
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#C9A84C]/5 rounded-full blur-2xl group-hover:bg-[#C9A84C]/10 transition-colors" />
      )}
    </div>
  )
}
