'use client'

import { useState, useMemo } from 'react'
import { Search, Sparkles, Mail, LayoutGrid, List } from 'lucide-react'
import EmailCampaignsKanban from './EmailCampaignsKanban'
import GenerateCampaignModal from './GenerateCampaignModal'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Campaign {
  id:          number
  name:        string
  subject:     string
  status:      string
  createdAt:   string
  scheduledAt?: string
  statistics?: {
    globalStats?: {
      delivered?:    number
      uniqueOpens?:  number
      uniqueClicks?: number
      unsubscribed?: number
      hardBounces?:  number
      softBounces?:  number
    }
  }
}

interface Props {
  campaigns: Campaign[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute: '2-digit'
  })
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

function statusBadge(status: string): { label: string; classes: string } {
  const map: Record<string, { label: string; classes: string }> = {
    sent:       { label: 'Envoyée',    classes: 'bg-[#F0FAF7] text-[#0F7A60] border-emerald-100' },
    scheduled:  { label: 'Planifiée',  classes: 'bg-[#FDF9F0] text-[#C9A84C] border-amber-100' },
    draft:      { label: 'Brouillon',  classes: 'bg-gray-50   text-gray-500  border-gray-200'  },
    in_process: { label: 'En cours',   classes: 'bg-blue-50   text-blue-600  border-blue-100'  },
    queued:     { label: 'En attente', classes: 'bg-purple-50 text-purple-600 border-purple-100'},
  }
  return map[status] ?? { label: status, classes: 'bg-gray-50 text-gray-500 border-gray-200' }
}

function getProgressStyle(rate: number): React.CSSProperties {
  return { width: `${Math.min(rate, 100)}%` } as React.CSSProperties
}

// ─── Composant Interactif ────────────────────────────────────────────────────
export default function EmailCampaignsDashboard({ campaigns }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'draft' | 'scheduled'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)

  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns]

    if (activeFilter !== 'all') {
      result = result.filter(c => c.status === activeFilter)
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.subject.toLowerCase().includes(q)
      )
    }

    // Tri par date décroissante
    result.sort((a,b) => {
       const dateA = new Date(a.scheduledAt || a.createdAt).getTime()
       const dateB = new Date(b.scheduledAt || b.createdAt).getTime()
       return dateB - dateA
    })

    return result
  }, [campaigns, searchQuery, activeFilter])

  // Statistiques Globales sur Campagnes Envoyées
  const sentCampaigns = campaigns.filter(c => c.status === 'sent' && (c.statistics?.globalStats?.delivered ?? 0) > 0)
  
  const avgOpenRate = sentCampaigns.length > 0 
    ? sentCampaigns.reduce((acc, c) => {
        const stats = c.statistics?.globalStats
        const d = stats?.delivered ?? 0
        const o = stats?.uniqueOpens ?? 0
        return acc + (d > 0 ? (o / d) * 100 : 0)
      }, 0) / sentCampaigns.length 
    : 0

  const avgClickRate = sentCampaigns.length > 0 
    ? sentCampaigns.reduce((acc, c) => {
        const stats = c.statistics?.globalStats
        const o = stats?.uniqueOpens ?? 0
        const cl = stats?.uniqueClicks ?? 0
        return acc + (o > 0 ? (cl / o) * 100 : 0)
      }, 0) / sentCampaigns.length 
    : 0

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300 fill-mode-forwards">
      
      {/* ── BANDEAU INTELLIGENCE (APERÇU GLOBAL) ── */}
      {sentCampaigns.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-[#FAFAF7] border border-emerald-100/50 rounded-3xl p-6 sm:px-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[40px] pointer-events-none"></div>
          
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
               <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0D5C4A] uppercase tracking-widest">Intelligence Artificielle</h3>
              <p className="text-sm font-medium text-emerald-900/80 mt-1 max-w-lg leading-relaxed">
                Sur vos {sentCampaigns.length} dernières campagnes envoyées, votre audience montre un engagement moyen de <strong className="text-emerald-700 bg-emerald-100/50 px-1.5 py-0.5 rounded">{avgOpenRate.toFixed(1)}% d'ouverture</strong>, ce qui atteste d'une base prospects saine !
              </p>
            </div>
          </div>

          <div className="relative z-10 flex gap-4 auto-flex items-center shrink-0">
             <div className="flex gap-4 bg-white/60 p-3 rounded-2xl border border-white">
               <div className="text-center px-4 border-r border-emerald-100">
                  <p className="text-xs font-black text-emerald-600/70 uppercase tracking-widest mb-1">Moy. Ouvertures</p>
                  <p className="text-2xl font-black text-[#0D5C4A]">{avgOpenRate.toFixed(1)}<span className="text-lg">%</span></p>
               </div>
               <div className="text-center px-4">
                  <p className="text-xs font-black text-emerald-600/70 uppercase tracking-widest mb-1">Moy. Clics</p>
                  <p className="text-2xl font-black text-[#0D5C4A]">{avgClickRate.toFixed(1)}<span className="text-lg">%</span></p>
               </div>
             </div>
             
             <button 
                onClick={() => setIsGenerateModalOpen(true)}
                className="hidden lg:flex items-center gap-2 bg-[#0D5C4A] hover:bg-[#083D31] text-white px-5 py-3.5 rounded-2xl shadow-md transition-all hover:shadow-lg border border-[#0F7A60]"
                title="Générer avec l'IA"
             >
                <Sparkles className="w-5 h-5 text-emerald-300" /> <span className="text-sm font-black whitespace-nowrap">Créer via IA</span>
             </button>
          </div>
        </div>
      )}

      {/* ── TABLEAU INTERACTIF DES CAMPAGNES ── */}
      <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Subtle Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

        {/* HEADER TABLE & FILTRES */}
        <div className="relative z-10 p-6 border-b border-white/40 bg-[#0F7A60]/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-white/50 flex items-center justify-center text-lg">📊</div>
            <div>
              <h2 className="text-base font-black text-gray-900">Toutes les Campagnes</h2>
              <p className="text-xs font-bold text-gray-400 mt-0.5">HISTORIQUE ET PERFORMANCES ({filteredCampaigns.length})</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Barre de Recherche */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher une campagne..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-[#0D5C4A] focus:ring-1 focus:ring-[#0D5C4A]/20 transition-all rounded-xl py-2 pl-9 pr-4 text-sm font-medium text-gray-700 outline-none shadow-inner"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Vue Tableau"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Vue Kanban"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Filtres Rapides */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto shrink-0">
               {[
                 { id: 'all', label: 'Toutes' },
                 { id: 'sent', label: 'Envoyées' },
                 { id: 'draft', label: 'Brouillons' },
                 { id: 'scheduled', label: 'Planifiées' }
               ].map(filter => (
                 <button
                   key={filter.id}
                   onClick={() => setActiveFilter(filter.id as any)}
                   className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap ${
                     activeFilter === filter.id 
                       ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                       : 'bg-transparent text-gray-500 hover:text-gray-700'
                   }`}
                 >
                   {filter.label}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* CONTENU MESSAGE VIDE OU TABLEAU */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-24 text-gray-400 relative z-10 w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/50 to-transparent pointer-events-none" />
            <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
              <Mail className="w-10 h-10 text-[#0F7A60] opacity-80" />
              <div className="absolute -inset-4 bg-emerald-400/20 rounded-full blur-xl -z-10" />
            </div>
            <p className="text-lg font-black text-gray-700 relative z-10">Aucune campagne correspondante</p>
            <p className="text-sm mt-2 text-gray-500 max-w-sm mx-auto relative z-10 font-medium">
              {searchQuery ? "Aucune campagne ne correspond à votre recherche actuelle." : "Créez votre première campagne sur Brevo pour la voir apparaître ici."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setActiveFilter('all') }} 
                className="mt-6 text-sm font-bold text-[#0F7A60] bg-white border border-[#0F7A60]/20 hover:border-[#0F7A60]/50 hover:bg-emerald-50 transition-all px-6 py-2.5 rounded-xl shadow-sm relative z-10"
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          <EmailCampaignsKanban campaigns={filteredCampaigns} />
        ) : (
          <div className="overflow-x-auto relative z-10 w-full">
            <table className="w-full text-left">
              <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-xs font-black tracking-widest">
                <tr>
                  <th className="px-5 py-5 whitespace-nowrap">Campagne & Sujet</th>
                  <th className="px-5 py-5 whitespace-nowrap">Statut</th>
                  <th className="px-5 py-5 whitespace-nowrap">Audience</th>
                  <th className="px-5 py-5 whitespace-nowrap">Taux d'Ouverture</th>
                  <th className="px-5 py-5 whitespace-nowrap">Taux de Clic</th>
                  <th className="px-5 py-5 whitespace-nowrap text-right">Désab. / Rejets</th>
                  <th className="px-5 py-5 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredCampaigns.map((campaign) => {
                  const { label, classes } = statusBadge(campaign.status)
                  const stats    = campaign.statistics?.globalStats ?? {}
                  const dateStr  = campaign.scheduledAt ?? campaign.createdAt
                  
                  const delivered = stats.delivered ?? 0
                  const opens = stats.uniqueOpens ?? 0
                  const clicks = stats.uniqueClicks ?? 0
                  const unsubscribed = stats.unsubscribed ?? 0
                  const bounces = (stats.hardBounces ?? 0) + (stats.softBounces ?? 0)

                  // Ratios
                  const openRate = delivered > 0 ? (opens / delivered) * 100 : 0
                  const clickRate = opens > 0 ? (clicks / opens) * 100 : 0

                  return (
                    <tr key={campaign.id} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">
                      {/* Nom + sujet + date */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 text-sm truncate max-w-[280px] group-hover:text-[#0D5C4A] transition-colors" title={campaign.name}>
                          {campaign.name}
                        </p>
                        <p className="text-xs font-medium text-gray-400 truncate max-w-[280px] mt-1" title={campaign.subject}>
                          Sujet : {campaign.subject}
                        </p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 bg-gray-100/50 w-max px-2 py-0.5 rounded-md">
                          {formatDate(dateStr)}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <span className={`text-xs font-black tracking-wider uppercase px-2.5 py-1 shadow-sm rounded-lg border ${classes}`}>
                          {label}
                        </span>
                      </td>

                      {/* Audience (Délivrés) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900">{formatNumber(delivered)}</span>
                          <span className="text-xs font-bold text-gray-400 uppercase">Recip.</span>
                        </div>
                      </td>

                      {/* Taux d'Ouverture */}
                      <td className="px-6 py-4">
                        {delivered > 0 ? (
                          <div className="flex flex-col gap-1.5 w-28 lg:w-32">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-gray-900">{openRate.toFixed(1)}%</span>
                              <span className="text-xs font-bold text-gray-400">{formatNumber(opens)} vues</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={getProgressStyle(openRate)}></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold">-</span>
                        )}
                      </td>

                      {/* Taux de Clic */}
                      <td className="px-6 py-4">
                        {delivered > 0 ? (
                          <div className="flex flex-col gap-1.5 w-28 lg:w-32">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-gray-900">{clickRate.toFixed(1)}%</span>
                              <span className="text-xs font-bold text-gray-400">{formatNumber(clicks)} clics</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0D5C4A] rounded-full transition-all duration-1000" style={getProgressStyle(clickRate)}></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold">-</span>
                        )}
                      </td>

                      {/* Désabonnements / Rejets */}
                      <td className="px-6 py-4 text-right">
                        {(unsubscribed === 0 && bounces === 0 && delivered > 0) ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded inline-block">Perfect 🎯</span>
                        ) : delivered === 0 ? (
                          <span className="text-xs font-bold text-gray-400">-</span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            {unsubscribed > 0 && (
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 whitespace-nowrap">
                                {unsubscribed} {unsubscribed > 1 ? 'Désabonnés' : 'Désabonné'}
                              </span>
                            )}
                            
                            {bounces > 0 && (
                              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-0.5 whitespace-nowrap">
                                {bounces} Bounces
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-5 text-right">
                        <a
                          href={campaign.id >= 100 && campaign.id <= 110 ? '#' : `https://my.brevo.com/camp/summary/id/${campaign.id}`}
                          target={campaign.id >= 100 && campaign.id <= 110 ? '_self' : '_blank'}
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 text-[#0F7A60] hover:shadow-md transition-all rounded-xl text-xs font-bold ${campaign.id >= 100 && campaign.id <= 110 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="hidden sm:inline">Brevo</span>
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL IA */}
      <GenerateCampaignModal 
        isOpen={isGenerateModalOpen} 
        onClose={() => setIsGenerateModalOpen(false)} 
      />
    </div>
  )
}
