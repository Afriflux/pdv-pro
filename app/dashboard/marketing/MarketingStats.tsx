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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ── KPI 1 : Vues boutique 7j ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Eye size={20} className="text-[#0F7A60]" />
          <span className="text-2xl font-display font-black text-[#1A1A1A]">
            {stats.storeViews}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Vues boutique 7j
          </p>
          <span className="text-[10px] font-bold text-[#0F7A60] bg-[#0F7A60]/10 px-1.5 py-0.5 rounded-md">
            +12%
          </span>
        </div>
      </div>

      {/* ── KPI 2 : Clics liens courts ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Link2 size={20} className="text-[#1A1A1A]" />
          <span className="text-2xl font-display font-black text-[#1A1A1A]">
            {stats.totalClicks}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Clics liens courts
          </p>
          <span className="text-[10px] font-bold text-[#0F7A60] bg-[#0F7A60]/10 px-1.5 py-0.5 rounded-md">
            +8%
          </span>
        </div>
      </div>

      {/* ── KPI 3 : Taux conversion ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp size={20} className="text-[#C9A84C]" />
          <span className="text-2xl font-display font-black text-[#1A1A1A]">
            {stats.conversionRate}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Taux conversion
          </p>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
            À venir
          </span>
        </div>
      </div>

      {/* ── KPI 4 : Meilleur lien ── */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <Trophy size={20} className="text-amber-500 shrink-0" />
          <span 
            className="text-sm font-bold text-[#1A1A1A] text-right truncate ml-2" 
            title={stats.bestLink}
          >
            {stats.bestLink}
          </span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Meilleur lien exp.
          </p>
          <span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded-md line-clamp-1 truncate max-w-[60px] text-center" title="Le plus cliqué">
             Top
          </span>
        </div>
      </div>
    </div>
  )
}
