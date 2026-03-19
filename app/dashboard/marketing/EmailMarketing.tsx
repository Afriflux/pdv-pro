'use client'

// ─── app/dashboard/marketing/EmailMarketing.tsx ──────────────────────────────
// Dashboard email marketing du vendeur
// Sections : Stats rapides | Séquences auto | Créer campagne | Liste campagnes

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

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
      uniqueClicks?: number
      delivered?:   number
      uniqueOpens?: number
    }
  }
}

interface EmailStats {
  totalCampaigns: number
  sentCampaigns:  number
  lastCampaignAt: string | null
}

type CampaignStatus = 'idle' | 'loading' | 'success' | 'error'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

function statusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    sent:      { label: 'Envoyée',    color: 'text-[#0F7A60] bg-[#F0FAF7]' },
    scheduled: { label: 'Planifiée',  color: 'text-[#C9A84C] bg-[#FDF9F0]' },
    draft:     { label: 'Brouillon',  color: 'text-gray-500  bg-gray-100'   },
    in_process:{ label: 'En cours',   color: 'text-blue-600  bg-blue-50'    },
    queued:    { label: 'En attente', color: 'text-purple-600 bg-purple-50' },
  }
  return map[status] ?? { label: status, color: 'text-gray-500 bg-gray-100' }
}

// ─── Séquences automatiques (statique) ───────────────────────────────────────

const AUTO_SEQUENCES = [
  { icon: '✅', label: 'Email de bienvenue vendeur',   sublabel: 'Actif automatiquement',     active: true  },
  { icon: '✅', label: 'Confirmation commande acheteur', sublabel: 'Actif automatiquement',   active: true  },
  { icon: '✅', label: 'Notification nouvelle commande', sublabel: 'Actif automatiquement',   active: true  },
  { icon: '⚙️', label: 'Relance panier abandonné',      sublabel: 'Déclenché par webhook',    active: false },
  { icon: '⚙️', label: 'Rapport hebdomadaire',          sublabel: 'Déclenché par cron',       active: false },
]

// ─── Composant principal ──────────────────────────────────────────────────────

export default function EmailMarketing() {
  // ── État ──────────────────────────────────────────────────────────────────
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [stats,         setStats]         = useState<EmailStats | null>(null)
  const [loadingStats,  setLoadingStats]  = useState<boolean>(true)

  // Formulaire campagne
  const [subject,      setSubject]      = useState<string>('')
  const [htmlContent,  setHtmlContent]  = useState<string>('')
  const [scheduledAt,  setScheduledAt]  = useState<string>('')
  const [showForm,     setShowForm]     = useState<boolean>(false)
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle')

  // ── Charger les campagnes au montage ──────────────────────────────────────

  const loadCampaigns = useCallback(async (): Promise<void> => {
    setLoadingStats(true)
    try {
      const response = await fetch('/api/brevo/campaign', { method: 'GET' })
      if (!response.ok) throw new Error('Erreur serveur')

      const data = await response.json() as { campaigns?: Campaign[] }
      const list = data.campaigns ?? []

      setCampaigns(list)

      // Calcul des stats depuis la liste
      const sent = list.filter(c => c.status === 'sent').length
      const lastSent = list
        .filter(c => c.status === 'sent' && c.scheduledAt)
        .sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime())[0]

      setStats({
        totalCampaigns: list.length,
        sentCampaigns:  sent,
        lastCampaignAt: lastSent?.scheduledAt ?? null,
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue'
      console.error('[EmailMarketing] Chargement campagnes:', msg)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  // ── Soumettre une nouvelle campagne ───────────────────────────────────────

  async function handleCreateCampaign(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    if (!subject.trim()) {
      toast.error('Le sujet est obligatoire.')
      return
    }
    if (!htmlContent.trim()) {
      toast.error('Le contenu HTML est obligatoire.')
      return
    }

    setCampaignStatus('loading')

    try {
      const body: Record<string, unknown> = {
        subject:     subject.trim(),
        htmlContent: htmlContent.trim(),
        listId:      2, // Liste vendeurs par défaut
      }
      if (scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString()
      }

      const response = await fetch('/api/brevo/campaign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const data = await response.json() as { success?: boolean; error?: string; campaignId?: string }

      if (response.ok && data.success) {
        setCampaignStatus('success')
        toast.success(`Campagne créée avec succès ! ID : ${data.campaignId}`)
        // Réinitialiser le formulaire
        setSubject('')
        setHtmlContent('')
        setScheduledAt('')
        setShowForm(false)
        // Recharger la liste
        await loadCampaigns()
      } else {
        throw new Error(data.error ?? 'Erreur lors de la création.')
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur interne.'
      setCampaignStatus('error')
      toast.error(msg)
      setTimeout(() => setCampaignStatus('idle'), 3000)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── SECTION 1 : Stats rapides ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Card : Campagnes totales */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl mb-1">📨</p>
          {loadingStats ? (
            <div className="h-7 w-12 mx-auto bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-[#1A1A1A]">{stats?.totalCampaigns ?? 0}</p>
          )}
          <p className="text-xs text-gray-500 mt-1 font-medium">Campagnes créées</p>
        </div>

        {/* Card : Campagnes envoyées */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl mb-1">✉️</p>
          {loadingStats ? (
            <div className="h-7 w-12 mx-auto bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-[#0F7A60]">{stats?.sentCampaigns ?? 0}</p>
          )}
          <p className="text-xs text-gray-500 mt-1 font-medium">Emails envoyés</p>
        </div>

        {/* Card : Dernière campagne */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl mb-1">📅</p>
          {loadingStats ? (
            <div className="h-5 w-20 mx-auto bg-gray-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-sm font-black text-[#1A1A1A] leading-tight">
              {stats?.lastCampaignAt ? formatDate(stats.lastCampaignAt) : '—'}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1 font-medium">Dernière campagne</p>
        </div>
      </div>

      {/* ── SECTION 2 : Séquences automatiques ───────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-black text-[#1A1A1A]">🤖 Séquences automatiques</h3>
          <p className="text-xs text-gray-400 mt-0.5">Emails déclenchés automatiquement selon les événements</p>
        </div>

        <div className="divide-y divide-gray-50">
          {AUTO_SEQUENCES.map((seq) => (
            <div key={seq.label} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base leading-none">{seq.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{seq.label}</p>
                  <p className="text-xs text-gray-400">{seq.sublabel}</p>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                seq.active
                  ? 'bg-[#F0FAF7] text-[#0F7A60]'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {seq.active ? 'Actif' : 'Config'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3 : Créer une campagne ───────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div>
            <h3 className="text-sm font-black text-[#1A1A1A]">📤 Créer une campagne</h3>
            <p className="text-xs text-gray-400 mt-0.5">Envoyez un email à vos abonnés Brevo</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(prev => !prev)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0F7A60] text-white hover:bg-[#0D6B53] transition-colors"
          >
            {showForm ? 'Annuler' : '+ Nouvelle campagne'}
          </button>
        </div>

        {/* Formulaire inline (accordéon) */}
        {showForm && (
          <form onSubmit={handleCreateCampaign} className="px-4 py-4 space-y-3">

            {/* Sujet */}
            <div>
              <label htmlFor="email-subject" className="block text-xs font-bold text-gray-600 mb-1">
                Sujet de l'email *
              </label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex : Nos nouvelles offres de la semaine 🔥"
                required
                maxLength={150}
                className="
                  w-full px-3 py-2.5 text-sm text-[#1A1A1A]
                  bg-[#FAFAF7] border border-gray-200 rounded-xl
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30 focus:border-[#0F7A60]
                  transition-all duration-150
                "
              />
            </div>

            {/* Contenu HTML */}
            <div>
              <label htmlFor="email-content" className="block text-xs font-bold text-gray-600 mb-1">
                Contenu HTML *
              </label>
              <textarea
                id="email-content"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<p>Bonjour,</p><p>Découvrez nos nouvelles offres...</p>"
                required
                rows={6}
                className="
                  w-full px-3 py-2.5 text-sm text-[#1A1A1A] font-mono
                  bg-[#FAFAF7] border border-gray-200 rounded-xl
                  placeholder:text-gray-400 placeholder:font-sans
                  focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30 focus:border-[#0F7A60]
                  transition-all duration-150 resize-y min-h-[120px]
                "
              />
              <p className="text-[11px] text-gray-400 mt-1">
                HTML inline requis pour la compatibilité email (Outlook, Gmail, etc.)
              </p>
            </div>

            {/* Date d'envoi optionnelle */}
            <div>
              <label htmlFor="email-scheduled" className="block text-xs font-bold text-gray-600 mb-1">
                Date d'envoi planifié <span className="font-normal text-gray-400">(optionnel — laissez vide pour brouillon)</span>
              </label>
              <input
                id="email-scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="
                  w-full px-3 py-2.5 text-sm text-[#1A1A1A]
                  bg-[#FAFAF7] border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/30 focus:border-[#0F7A60]
                  transition-all duration-150
                "
              />
            </div>

            {/* Bouton de soumission */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={campaignStatus === 'loading'}
                className="
                  flex-1 py-2.5 text-sm font-bold text-white
                  bg-[#0F7A60] hover:bg-[#0D6B53] active:bg-[#0B5E49]
                  rounded-xl shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 flex items-center justify-center gap-2
                "
              >
                {campaignStatus === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Création en cours...</span>
                  </>
                ) : (
                  '📤 Créer la campagne'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── SECTION 4 : Dernières campagnes ──────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-black text-[#1A1A1A]">📋 Dernières campagnes</h3>
        </div>

        {loadingStats ? (
          /* Skeleton loader */
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
                <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-semibold text-gray-500">Aucune campagne créée</p>
            <p className="text-xs text-gray-400 mt-1">Créez votre première campagne ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-wider">Clics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((campaign) => {
                  const { label, color } = statusLabel(campaign.status)
                  const clicks = campaign.statistics?.globalStats?.uniqueClicks ?? 0
                  const dateStr = campaign.scheduledAt ?? campaign.createdAt

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A1A] text-xs truncate max-w-[160px]" title={campaign.name}>
                          {campaign.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]" title={campaign.subject}>
                          {campaign.subject}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${color}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(dateStr)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-[#1A1A1A]">{clicks}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
