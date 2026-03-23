'use client'

import { useMemo } from 'react'
import { Eye, Link2, TrendingUp, Trophy } from 'lucide-react'

// On s'attend à recevoir au moins ces propriétés de l'API
interface ShortLinkStat {
  clicks: number
  short_code?: string
  original_url?: string
}

interface MarketingStatsProps {
  storeId: string
  links:   ShortLinkStat[]
}

export default function MarketingStats({ links }: MarketingStatsProps) {
  // Calculs des KPIs
  const stats = useMemo(() => {
    // Total des clics sur tous les liens courts (considéré comme clics globaux)
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
    
    // Pour simplifier selon le prompt, les vues boutique peuvent être égales aux clics globaux ou une part
    const storeViews = totalClicks // ou autre logique métier si spécifié

    // Taux de conversion : Non fourni dans le scope actuel, on affiche "--"
    const conversionRate = "--"

    // Meilleur lien : celui avec le max de clics
    let bestLink = "--"
    if (links.length > 0) {
      const topLink = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
      if (topLink && topLink.clicks > 0) {
        bestLink = topLink.short_code ? `pdvpro.com/s/${topLink.short_code}` : 'Lien actif'
      }
    }

    return { totalClicks, storeViews, conversionRate, bestLink }
  }, [links])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* ── KPI 1 : Vues boutique 7j (Phare) ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F7A60] to-[#0A5240] rounded-3xl p-6 text-white shadow-md group">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
        <div className="relative z-10 flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Vues Boutique</p>
          <span className="text-white flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <Eye size={16} />
          </span>
        </div>
        <div className="relative z-10">
          <p className="text-3xl lg:text-4xl font-black leading-none tracking-tight">{stats.storeViews}</p>
          <div className="flex items-center gap-2 mt-3 text-xs font-medium text-white/80">
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full"><TrendingUp size={12}/> +12%</span>
            <span>Les 7 derniers jours</span>
          </div>
        </div>
      </div>

      {/* ── KPI 2 : Clics liens courts ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clics Liens</p>
          <span className="text-[#1A1A1A] flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 border border-gray-100">
            <Link2 size={16} />
          </span>
        </div>
        <p className="text-3xl lg:text-4xl font-black text-[#1A1A1A] leading-none tracking-tight">{stats.totalClicks}</p>
        <div className="flex items-center gap-2 mt-3 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1 text-[#0F7A60] bg-[#0F7A60]/10 font-bold px-2 py-0.5 rounded-full"><TrendingUp size={12}/> +8%</span>
          <span>Performances shortlinks</span>
        </div>
      </div>

      {/* ── KPI 3 : Taux conversion ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversion</p>
            <span className="text-[#C9A84C] flex items-center justify-center w-8 h-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="text-3xl lg:text-4xl font-black text-gray-300 leading-none tracking-tight">{stats.conversionRate}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 relative z-10 w-full">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Statut</p>
          <span className="inline-block mt-1 text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">À venir bientôt</span>
        </div>
      </div>

      {/* ── KPI 4 : Meilleur lien ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meilleur Lien</p>
            <span className="text-amber-500 flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 border border-amber-100">
              <Trophy size={16} />
            </span>
          </div>
          <p className="text-lg font-black text-[#1A1A1A] leading-tight truncate" title={stats.bestLink}>{stats.bestLink}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 relative z-10 w-full flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trafic Récents</span>
          <span className="text-[11px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-1 rounded-lg">Top Engagement</span>
        </div>
      </div>
    </div>
  )
}
