'use client'

import React from 'react'
import { 
  FileEdit, 
  Send, 
  Clock, 
  MoreVertical,
  Mail,
  PieChart
} from 'lucide-react'

// Mêmes types que dans le tableau
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

interface KanbanColumn {
  id: string
  title: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  campaigns: Campaign[]
}

export default function EmailCampaignsKanban({ campaigns }: { campaigns: Campaign[] }) {
  
  // Catégorisation des campagnes
  const draftCampaigns = campaigns.filter(c => c.status === 'draft')
  const sendingCampaigns = campaigns.filter(c => ['scheduled', 'in_process', 'queued'].includes(c.status))
  const sentCampaigns = campaigns.filter(c => c.status === 'sent')

  const columns: KanbanColumn[] = [
    {
      id: 'draft',
      title: 'Brouillons',
      icon: FileEdit,
      colorClass: 'text-gray-500',
      bgClass: 'bg-gray-100/50 border-gray-200/50',
      campaigns: draftCampaigns
    },
    {
      id: 'sending',
      title: 'En Forgerie / Planifiées',
      icon: Clock,
      colorClass: 'text-[#C9A84C]',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      campaigns: sendingCampaigns
    },
    {
      id: 'sent',
      title: 'Envoyées',
      icon: Send,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      campaigns: sentCampaigns
    }
  ]

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric'
    })
  }

  function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  return (
    <div className="flex items-start gap-4 lg:gap-6 min-h-[600px] w-full p-6 overflow-x-auto snap-x snap-mandatory">
      {columns.map(col => (
        <div 
          key={col.id} 
          className="flex-shrink-0 w-[300px] lg:w-[350px] flex flex-col gap-4 snap-center group/col"
        >
          {/* Header de la colonne */}
          <div className={`p-4 rounded-[1.5rem] border ${col.bgClass} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-white rounded-xl shadow-sm ${col.colorClass}`}>
                <col.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-black uppercase tracking-widest text-[11px] ${col.colorClass}`}>
                  {col.title}
                </h3>
                <p className="text-gray-500 text-xs font-bold mt-0.5">{col.campaigns.length} campagne(s)</p>
              </div>
            </div>
          </div>

          {/* Liste des cartes */}
          <div className="flex flex-col gap-3">
            {col.campaigns.map(campaign => {
              const stats = campaign.statistics?.globalStats ?? {}
              const delivered = stats.delivered ?? 0
              const opens = stats.uniqueOpens ?? 0
              const clicks = stats.uniqueClicks ?? 0
              const openRate = delivered > 0 ? (opens / delivered) * 100 : 0
              const clickRate = opens > 0 ? (clicks / opens) * 100 : 0
              const isFauxContact = campaign.id >= 100 && campaign.id <= 110

              return (
                <div
                  key={campaign.id}
                  className="bg-white border text-left border-gray-100/80 rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-500/30 transition-all group relative overflow-hidden flex flex-col gap-4"
                >
                  {/* Titre & Date */}
                  <div className="flex justify-between items-start gap-3 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 mt-0.5 rounded-full flex items-center justify-center shrink-0 border ${
                        col.id === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        col.id === 'sending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold leading-tight text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2" title={campaign.name}>
                          {campaign.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-1 mb-1">
                          {formatDate(campaign.scheduledAt ?? campaign.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sujet de l'email */}
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 relative z-10">
                    <p className="text-xs font-semibold text-gray-600 line-clamp-1 italic">
                      « {campaign.subject} »
                    </p>
                  </div>

                  {/* Statistiques (seulement si envoyé et qu'il y a du monde) */}
                  {col.id === 'sent' && delivered > 0 && (
                    <div className="grid grid-cols-2 gap-2 relative z-10 text-center">
                      <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#0F7A60] mb-1">Ouvertures</p>
                        <p className="font-black text-gray-900 text-lg leading-none">{openRate.toFixed(1)}%</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1">{formatNumber(opens)} vues</p>
                      </div>
                      <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600/70 mb-1">Clics</p>
                        <p className="font-black text-gray-900 text-lg leading-none">{clickRate.toFixed(1)}%</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1">{formatNumber(clicks)} clics</p>
                      </div>
                    </div>
                  )}

                  {/* Footer Carte: Bouton Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 relative z-10">
                     <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        {delivered > 0 ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                            {formatNumber(delivered)} Récip.
                          </span>
                        ) : (
                          <span className="text-[10px]">&nbsp;</span>
                        )}
                     </div>
                     
                     <a
                        href={isFauxContact ? '#' : `https://my.brevo.com/camp/summary/id/${campaign.id}`}
                        target={isFauxContact ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-100 hover:border-emerald-500/50 hover:bg-emerald-50/50 text-[#0F7A60] hover:shadow-md transition-all rounded-lg text-[11px] font-bold ${isFauxContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                       {col.id === 'draft' ? <FileEdit className="w-3.5 h-3.5" /> : <PieChart className="w-3.5 h-3.5"/>}
                       Editer sur Brevo
                     </a>
                  </div>

                  {/* Hover Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              )
            })}

            {/* Empty State pour la colonne */}
            {col.campaigns.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-100 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
                <col.icon className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Vide</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
