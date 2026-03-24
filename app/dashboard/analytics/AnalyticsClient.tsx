/* eslint-disable react/forbid-dom-props */
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  Users, TrendingUp, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, MapPin, Target, FileText,
  Sparkles, Download, Brain, RefreshCw, CheckCircle2, AlertCircle,
  ChevronRight, CalendarDays, FileSpreadsheet, Lock, ExternalLink, Filter
} from 'lucide-react'
import { AnalyticsData } from '@/lib/analytics/analyticsActions'
import ExportPdfButton from './ExportPdfButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'vue-ensemble' | 'audience-trafic' | 'rapports'

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

  const [activeTab, setActiveTab] = useState<TabId>('vue-ensemble')

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

  // ── Analyser via l'IA heuristique ──────────────────────────────────────────
  const analyzeInsights = async () => {
    setInsightLoad(true)
    setInsightError(null)
    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId:     storeName,
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
    const url = `/api/analytics/export?storeId=${storeName}&days=${currentPeriod}&type=${type}`
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

  // Calcul funnel pour affichage HTML personnalisé
  const fwCount = data.funnel.views || 1
  const chkCount = data.funnel.checkouts
  const purCount = data.funnel.purchases
  const pcChk = ((chkCount / fwCount) * 100).toFixed(1)
  const pcPur = ((purCount / fwCount) * 100).toFixed(1)
  const pcPurFromChk = chkCount > 0 ? ((purCount / chkCount) * 100).toFixed(1) : '0.0'

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700 pb-12 items-start">

      {/* ─── BARRE LATÉRALE ─────────────────────────────────────────────────── */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-8 lg:sticky lg:top-8 z-20">
        
        {/* Titre */}
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-black text-[#1A1A1A] tracking-tight">Analytics</h1>
          <p className="text-sm font-medium text-slate-500">Performances & données</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {([
            { id: 'vue-ensemble', icon: <BarChart3 size={18} />, label: 'Vue d\'Ensemble' },
            { id: 'audience-trafic', icon: <Users size={18} />, label: 'Audience & Trafic' },
            { id: 'rapports', icon: <FileSpreadsheet size={18} />, label: 'Centre de Rapports' },
          ] as { id: TabId; icon: React.ReactNode; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all duration-300 w-full text-left ${
                activeTab === tab.id
                  ? 'bg-white text-[#1A1A1A] shadow-md shadow-slate-200/50 ring-1 ring-slate-100'
                  : 'text-slate-500 hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Filtres Optionnels */}
        <div className="space-y-5 pt-6 border-t border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={12} /> Filtres Analytiques
          </h3>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 block">Période d'analyse</label>
            <select
              aria-label="Période d'analyse"
              title="Période d'analyse"
              value={currentPeriod.toString()}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-bold text-[#1A1A1A] rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#0F7A60] focus:border-transparent outline-none shadow-sm cursor-pointer hover:border-slate-400 transition-colors"
            >
              <option value="7">Derniers 7 Jours</option>
              <option value="30">Derniers 30 Jours</option>
              <option value="90">Derniers 90 Jours</option>
            </select>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-600 flex items-center justify-between mb-1">
              Canal d'acquisition <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Bientôt</span>
            </label>
            <select aria-label="Canal d'acquisition" title="Canal d'acquisition" disabled className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-400 rounded-xl px-3 py-2.5 opacity-60 cursor-not-allowed">
              <option>Tous les canaux</option>
            </select>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-600 flex items-center justify-between mb-1">
              Appareil <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Bientôt</span>
            </label>
            <select aria-label="Appareil d'acquisition" title="Appareil d'acquisition" disabled className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-400 rounded-xl px-3 py-2.5 opacity-60 cursor-not-allowed">
              <option>Mobiles & Desktops</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── CONTENU PRINCIPAL ─── */}
      <div className="flex-1 min-w-0 w-full">

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 1 — VUE D'ENSEMBLE (SMART DASHBOARD)
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'vue-ensemble' && (
        <div className="space-y-8 animate-in fade-in duration-500">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Vues Produits"
              value={data.kpis.views.toLocaleString('fr-FR')}
              icon={<Users className="text-blue-500" size={20} />}
              trend={data.kpis.viewsTrend}
              label={`${currentPeriod} derniers jours`}
            />
            <StatCard
              title="Commandes"
              value={data.kpis.sales.toLocaleString('fr-FR')}
              icon={<Target className="text-purple-500" size={20} />}
              trend={data.kpis.salesTrend}
              label={`${currentPeriod} derniers jours`}
            />
            <StatCard
              title="Taux de Conv."
              value={`${data.kpis.conversion.toFixed(1)}%`}
              icon={<TrendingUp className="text-orange-500" size={20} />}
              trend={data.kpis.conversionTrend}
              label="visites → paiements"
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

          {/* Cerveau Analytique - Hero Banner si pas d'insights, sinon Affichage condensé */}
          {!insights ? (
             <div className="bg-gradient-to-br from-[#1A1A1A] to-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50 blur-2xl pointer-events-none" />
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0F7A60]/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
               <div className="space-y-3 relative z-10 max-w-2xl">
                 <h2 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                     <Brain className="text-emerald-400" size={24} />
                   </div>
                   Copilote Analytique Check360°
                 </h2>
                 <p className="text-slate-300 leading-relaxed font-medium">
                   Laissez notre IA analyser vos {currentPeriod} derniers jours pour détecter instantanément de nouvelles opportunités de croissance ou des failles dans votre entonnoir de vente.
                 </p>
                 {insightError && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 font-bold flex items-center gap-2 w-fit">
                      <AlertCircle size={16} />
                      {insightError}
                    </div>
                  )}
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
                   ? <><RefreshCw size={20} className="animate-spin text-[#0F7A60]" /> <span className="text-[#0F7A60]">Analyse neuronale en cours…</span></>
                   : <><Sparkles size={20} className="text-[#0F7A60]" /> Lancer l'analyse IA</>
                 }
               </button>
             </div>
          ) : (
            // Affichage condensé des insights
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Jauge score */}
                 <div className="lg:col-span-4 bg-white/80 backdrop-blur-2xl overflow-hidden relative group transition-all duration-500 rounded-[32px] border border-white shadow-xl shadow-slate-200/50 p-8 flex flex-col items-center gap-6">
                   <p className="text-[11px] font-black text-[#0F7A60] uppercase tracking-widest bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full flex items-center gap-2">
                     <Brain size={14} /> Score Santé IA
                   </p>
                   <div className="relative w-40 h-40 flex items-center justify-center">
                     <div className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-1000" style={{ backgroundColor: scoreColor(insights.score) }} />
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

                 {/* Recommandations */}
                 <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-[#0F7A60] to-[#0D6B53] rounded-[2rem] border border-[#0F7A60]/20 shadow-lg p-8 flex flex-col justify-center gap-4 relative overflow-hidden group flex-shrink-0">
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-colors duration-700 pointer-events-none" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="p-1.5 bg-white/10 rounded-md text-white backdrop-blur-md">
                          <Target size={16} />
                        </div>
                        <p className="text-xs font-black text-emerald-100 uppercase tracking-widest">Macro-Recommandation</p>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-white leading-relaxed relative z-10 drop-shadow-sm">
                        {insights.recommendation}
                      </p>
                    </div>

                    {/* Micro-insights cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                      {insights.insights.slice(0, 4).map((insight, i) => {
                        const style = INSIGHT_STYLES[insight.type]
                        return (
                          <div key={i} className={`bg-white/80 backdrop-blur-xl rounded-[1.5rem] border p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow ${style.border}`}>
                            <div className="flex items-start gap-4 relative z-10">
                              <span className="text-xl drop-shadow-sm pt-0.5">{insight.icon}</span>
                              <div>
                                <p className={`font-black text-sm mb-1 ${style.text}`}>{insight.title}</p>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{insight.message}</p>
                                {insight.action && (
                                  <p className={`inline-flex items-center gap-1 mt-3 text-[10px] font-bold ${style.text} hover:opacity-80 cursor-pointer`}>
                                    {insight.action} <ArrowUpRight size={12} />
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                 </div>
               </div>
            </div>
          )}

          {/* Grille principale avec Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-12 bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-[#0F7A60]/10 transition-all duration-500">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0F7A60]/5 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-[#0F7A60]/20 to-[#0F7A60]/5 rounded-xl border border-[#0F7A60]/20 shadow-inner">
                    <DollarSign className="text-[#0F7A60]" size={20} />
                  </div>
                  Évolution des revenus (F CFA)
                </h2>
              </div>
              
              <div className="h-[400px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#0F7A60" stopOpacity={0.4} />
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
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: 800, fontSize: '13px', color: '#1A1A1A' }}
                      labelStyle={{ fontWeight: 900, marginBottom: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      cursor={{ stroke: '#0F7A60', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke="#0F7A60" strokeWidth={4}
                      fillOpacity={1} fill="url(#colorRev)"
                      animationDuration={1500}
                      activeDot={{ r: 6, fill: '#0F7A60', stroke: 'white', strokeWidth: 3, className: 'drop-shadow-md' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funnel Horizontal repensé */}
            <div className="lg:col-span-12 bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-orange-500/5 relative overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-400/10 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />
              
              <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-8 relative z-10 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl border border-orange-500/20 shadow-inner">
                  <BarChart3 className="text-orange-500" size={20} />
                </div>
                Entonnoir de Conversion
              </h2>

              {/* Layout du Funnel Horizontal */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-2 relative z-10 px-2 lg:px-6 py-6 w-full">
                
                {/* Étape 1 : Visites */}
                <div className="flex-1 flex flex-col items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-4">
                    <Users size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Visites</p>
                  <p className="text-3xl font-black text-[#1A1A1A] tabular-nums">{fwCount.toLocaleString('fr-FR')}</p>
                </div>

                <div className="hidden md:flex flex-col items-center px-4 self-center pt-8">
                  <div className="bg-white border border-slate-100 px-4 py-2 rounded-full text-xs font-black text-slate-500 shadow-sm z-10">
                    {pcChk}%
                  </div>
                  <ChevronRight size={24} className="text-slate-300 mt-2" />
                </div>

                {/* Étape 2 : Checkout */}
                <div className="flex-1 flex flex-col items-center bg-orange-50/50 p-6 rounded-3xl border border-orange-100 shadow-sm relative">
                  <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Target size={20} />
                  </div>
                  <p className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-1">Checkouts Initiés</p>
                  <p className="text-3xl font-black text-orange-900 tabular-nums">{chkCount.toLocaleString('fr-FR')}</p>
                </div>

                <div className="hidden md:flex flex-col items-center px-4 self-center pt-8">
                  <div className="bg-white border border-slate-100 px-4 py-2 rounded-full text-xs font-black text-emerald-600 shadow-sm z-10">
                    {pcPurFromChk}%
                  </div>
                  <ChevronRight size={24} className="text-slate-300 mt-2" />
                </div>

                {/* Étape 3 : Achats */}
                <div className="flex-1 flex flex-col items-center bg-emerald-50/80 p-6 rounded-3xl border border-emerald-100 shadow-md relative group/step hover:bg-emerald-100/50 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-3xl pointer-events-none" />
                  <div className="w-12 h-12 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rounded-full flex items-center justify-center mb-4 z-10">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest mb-1 z-10">Ventes Confirmées</p>
                  <p className="text-3xl font-black text-emerald-900 tabular-nums z-10">{purCount.toLocaleString('fr-FR')}</p>
                  <p className="mt-4 text-xs font-bold text-emerald-600 z-10 border border-emerald-200 bg-white/50 px-3 py-1 rounded-full">
                    Taux Final: {pcPur}%
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONGLET 2 — AUDIENCE & TRAFIC
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audience-trafic' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
               {/* Sources trafic */}
               <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-blue-500/5 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
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
                       <RechartsTooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} itemStyle={{ fontWeight: 800, fontSize: '13px' }} />
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
               <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-red-500/5 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
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
                       <div className="w-full h-2.5 bg-slate-100/50 rounded-full overflow-hidden shadow-inner flex items-stretch">
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

            <div className="lg:col-span-2 space-y-8">
              {/* Top pages */}
              <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-[#C9A84C]/5 overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-bl from-[#C9A84C]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
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

              {/* Top produits */}
              <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gradient-to-tl from-[#0F7A60]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight mb-6 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600"><DollarSign size={18} /></div>
                  Top Produits Vendus
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
          ONGLET 3 — CENTRE DE RAPPORTS
          ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rapports' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Colonne gauche : Le générateur */}
            <div className="lg:col-span-8 bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 p-8 md:p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
               <h2 className="text-3xl font-black text-[#1A1A1A] flex items-center gap-3 mb-2 relative z-10">
                 <FileSpreadsheet className="text-blue-500" size={28} />
                 Générateur de Rapports
               </h2>
               <p className="text-slate-500 font-medium mb-10 relative z-10">
                 Sélectionnez le format et les données à extraire. Les données sont conformes pour votre comptabilité.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                 
                 {/* Card CSV Commandes */}
                 <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-lg transition-shadow border-t-4 border-t-blue-500 flex flex-col justify-between group">
                   <div>
                     <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <FileText size={20} />
                     </div>
                     <h3 className="font-black text-[#1A1A1A] text-lg mb-2">Opérations</h3>
                     <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                       Exportez toutes les commandes, montants, et commissions sur les {currentPeriod} jours.
                     </p>
                   </div>
                   <button 
                     disabled={exportLoading === 'orders'}
                     onClick={() => downloadCsv('orders')}
                     className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                   >
                     {exportLoading === 'orders' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                     Format CSV
                   </button>
                 </div>

                 {/* Card CSV Master */}
                 <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-lg transition-shadow border-t-4 border-t-purple-500 flex flex-col justify-between group">
                   <div>
                     <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <BarChart3 size={20} />
                     </div>
                     <h3 className="font-black text-[#1A1A1A] text-lg mb-2">Master Data</h3>
                     <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                       L'extraction totale : revenus, commandes, produits vedettes en un fichier unique.
                     </p>
                   </div>
                   <button 
                     disabled={exportLoading === 'full'}
                     onClick={() => downloadCsv('full')}
                     className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                   >
                     {exportLoading === 'full' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                     Format CSV
                   </button>
                 </div>

                 {/* Card Exécutif PDF */}
                 <div className="bg-gradient-to-br from-slate-900 to-[#1A1A1A] border border-black rounded-[1.5rem] p-6 shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-red-500 flex flex-col justify-between group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
                   <div className="relative z-10">
                     <div className="w-12 h-12 bg-slate-800 border border-slate-700 text-red-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                       <FileText size={20} />
                     </div>
                     <h3 className="font-black text-white text-lg mb-2">Rapport Exécutif</h3>
                     <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                       Le document charté au format PDF prêt à être imprimé ou envoyé à vos associés.
                     </p>
                   </div>
                   <div className="relative z-10 w-full">
                     <ExportPdfButton data={data} storeName={storeName} days={currentPeriod} />
                   </div>
                 </div>

               </div>
            </div>

            {/* Colonne droite : Automatisations */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#0F7A60] to-[#0D6B53] rounded-[32px] border border-[#0F7A60]/20 shadow-2xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-emerald-900/50 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-6">
                  <Sparkles size={12} /> Exclusivité Pro+
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                  Envois Automatisés
                </h3>
                <p className="text-emerald-100/90 text-sm font-medium leading-relaxed mb-8">
                  Ne vous connectez plus pour télécharger vos rapports. Recevez-les directement sur votre WhatsApp ou par Email, chaque semaine.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between opacity-80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <CalendarDays size={18} className="text-emerald-300" />
                      <span className="text-white font-bold text-sm">Tous les vendredis, 18H</span>
                    </div>
                    <Lock size={16} className="text-emerald-400" />
                  </div>
                  <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between opacity-80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet size={18} className="text-emerald-300" />
                      <span className="text-white font-bold text-sm">Rapport Complet PDF</span>
                    </div>
                    <Lock size={16} className="text-emerald-400" />
                  </div>
                </div>
              </div>

              <button className="relative z-10 w-full bg-white text-[#0F7A60] py-4 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                Découvrir l'abonnement Pro+ <ExternalLink size={16} />
              </button>
            </div>
            
          </div>

        </div>
      )}
      
      </div>
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
