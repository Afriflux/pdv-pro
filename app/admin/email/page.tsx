// ─── app/admin/email/page.tsx ────────────────────────────────────────────────
// Page admin — Statistiques email Brevo globales (Server Component)
// Stats : abonnés par liste + total campagnes
// Tableau : 10 dernières campagnes avec métriques

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listEmailCampaigns, getListStats } from '@/lib/brevo/brevo-service'
import { Mail } from 'lucide-react'

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface ListStat {
  totalSubscribers: number
  totalBlacklisted: number
}

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
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

function statusBadge(status: string): { label: string; classes: string } {
  const map: Record<string, { label: string; classes: string }> = {
    sent:       { label: 'Envoyée',    classes: 'bg-[#F0FAF7] text-[#0F7A60]' },
    scheduled:  { label: 'Planifiée',  classes: 'bg-[#FDF9F0] text-[#C9A84C]' },
    draft:      { label: 'Brouillon',  classes: 'bg-gray-100   text-gray-500'  },
    in_process: { label: 'En cours',   classes: 'bg-blue-50    text-blue-600'  },
    queued:     { label: 'En attente', classes: 'bg-purple-50  text-purple-600'},
  }
  return map[status] ?? { label: status, classes: 'bg-gray-100 text-gray-500' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminEmailPage() {
  // 1. Auth + vérification rôle super_admin
  const supabase      = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()
  const { data: callerData } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (callerData?.role !== 'super_admin') redirect('/admin')

  // 2. Charger les données Brevo en parallèle
  // En cas d'erreur Brevo (clé non configurée), on utilise des valeurs par défaut
  const [campaigns, list1, list2, list3] = await Promise.all([
    listEmailCampaigns().catch((): Campaign[] => []),
    getListStats(1).catch((): ListStat => ({ totalSubscribers: 0, totalBlacklisted: 0 })),
    getListStats(2).catch((): ListStat => ({ totalSubscribers: 0, totalBlacklisted: 0 })),
    getListStats(3).catch((): ListStat => ({ totalSubscribers: 0, totalBlacklisted: 0 })),
  ]) as [Campaign[], ListStat, ListStat, ListStat]

  // 3. Métriques calculées
  const sentCampaigns      = campaigns.filter(c => c.status === 'sent').length
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length
  const recentCampaigns    = [...campaigns]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  const totalSubscribers =
    (list1?.totalSubscribers ?? 0) +
    (list2?.totalSubscribers ?? 0) +
    (list3?.totalSubscribers ?? 0)

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── EN-TÊTE ── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Email Marketing</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Statistiques globales Brevo — abonnés, campagnes et performances
        </p>
      </header>

      {/* ── CARDS STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Card : Acheteurs abonnés */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">👥</span>
            <span className="text-[11px] font-bold text-[#0F7A60] bg-[#F0FAF7] px-2 py-0.5 rounded-full">
              Liste 1
            </span>
          </div>
          <p className="text-3xl font-black text-[#1A1A1A]">
            {(list1?.totalSubscribers ?? 0).toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Acheteurs abonnés</p>
        </div>

        {/* Card : Vendeurs abonnés */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🏪</span>
            <span className="text-[11px] font-bold text-[#C9A84C] bg-[#FDF9F0] px-2 py-0.5 rounded-full">
              Liste 2
            </span>
          </div>
          <p className="text-3xl font-black text-[#1A1A1A]">
            {(list2?.totalSubscribers ?? 0).toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Vendeurs abonnés</p>
        </div>

        {/* Card : Newsletters boutiques */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📧</span>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Liste 3
            </span>
          </div>
          <p className="text-3xl font-black text-[#1A1A1A]">
            {(list3?.totalSubscribers ?? 0).toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Newsletters boutiques</p>
        </div>

        {/* Card : Campagnes totales */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📨</span>
            <span className="text-[11px] font-bold text-[#0F7A60] bg-[#F0FAF7] px-2 py-0.5 rounded-full">
              Brevo
            </span>
          </div>
          <p className="text-3xl font-black text-[#1A1A1A]">{campaigns.length}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Campagnes créées</p>
        </div>
      </div>

      {/* ── SOUS-STATS ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#F0FAF7] border border-[#0F7A60]/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-[#0F7A60]">{totalSubscribers.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-[#0F7A60]/70 font-semibold mt-1">Total abonnés (toutes listes)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-[#1A1A1A]">{sentCampaigns}</p>
          <p className="text-xs text-gray-500 font-semibold mt-1">Campagnes envoyées</p>
        </div>
        <div className="bg-[#FDF9F0] border border-[#C9A84C]/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-[#C9A84C]">{scheduledCampaigns}</p>
          <p className="text-xs text-[#C9A84C]/70 font-semibold mt-1">Campagnes planifiées</p>
        </div>
      </div>

      {/* ── TABLEAU 10 DERNIÈRES CAMPAGNES ── */}
      <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1A1A1A]">📋 10 dernières campagnes</h2>
          <span className="text-xs text-gray-400">{campaigns.length} campagne{campaigns.length > 1 ? 's' : ''} au total</span>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-semibold text-gray-500">Aucune campagne trouvée</p>
            <p className="text-xs text-gray-400 mt-1">
              Vérifiez que la clé BREVO_API_KEY est configurée dans les intégrations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Campagne</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Délivrés</th>
                  <th className="text-right px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Ouverts</th>
                  <th className="text-right px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Clics</th>
                  <th className="text-right px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentCampaigns.map((campaign) => {
                  const { label, classes } = statusBadge(campaign.status)
                  const stats    = campaign.statistics?.globalStats ?? {}
                  const dateStr  = campaign.scheduledAt ?? campaign.createdAt

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Nom + sujet */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#1A1A1A] text-xs truncate max-w-[200px]" title={campaign.name}>
                          {campaign.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5" title={campaign.subject}>
                          {campaign.subject}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${classes}`}>
                          {label}
                        </span>
                      </td>

                      {/* Délivrés */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-[#1A1A1A]">
                          {(stats.delivered ?? 0).toLocaleString('fr-FR')}
                        </span>
                      </td>

                      {/* Ouverts */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-[#1A1A1A]">
                          {(stats.uniqueOpens ?? 0).toLocaleString('fr-FR')}
                        </span>
                      </td>

                      {/* Clics */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-[#0F7A60]">
                          {(stats.uniqueClicks ?? 0).toLocaleString('fr-FR')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-right text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(dateStr)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── NOTE BREVO ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <p className="text-xs font-bold text-blue-800">
            Les statistiques détaillées sont disponibles directement dans votre dashboard Brevo.
          </p>
          <p className="text-xs text-blue-700 mt-1">
            <a
              href="https://app.brevo.com/statistics/campaigns"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Voir les stats complètes sur Brevo →
            </a>
          </p>
        </div>
      </div>

    </div>
  )
}
