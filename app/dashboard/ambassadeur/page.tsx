import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAmbassadorStats } from '@/lib/ambassador/ambassador-service'
import type { AmbassadorStats } from '@/lib/ambassador/ambassador-service'
import AmbassadorCopyButton from './AmbassadorCopyButton'
import AmbassadorWithdrawModal from './AmbassadorWithdrawModal'

// ─── Helpers d'affichage ──────────────────────────────────────────────────────

function formatCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA'
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const TX_TYPE_LABELS: Record<string, string> = {
  commission:  '💰 Commission',
  withdrawal:  '🏦 Retrait',
  bonus:       '🎁 Bonus',
}

// ─── Composant principal (Server Component) ───────────────────────────────────

export default async function AmbassadeurPage() {
  // Récupérer l'utilisateur connecté
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Charger les stats ambassadeur
  const stats: AmbassadorStats | null = await getAmbassadorStats(user.id)

  // Si l'utilisateur n'est pas ambassadeur → redirection dashboard
  if (!stats) redirect('/dashboard')

  const { ambassador, referrals, recentTransactions, pendingCommissions } = stats
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pdvpro.com'
  const referralLink = `${appUrl}/register?ref=${ambassador.code}`
  const canWithdraw = ambassador.balance >= 5000

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0F7A60] to-[#0D5C4A] rounded-2xl p-6 text-white shadow-lg shadow-[#0F7A60]/20">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🤝</span>
                <h1 className="text-xl font-black tracking-tight">Programme Ambassadeur</h1>
              </div>
              <p className="text-white/70 text-sm">
                {ambassador.bio ?? `Bonjour ${ambassador.name} — partagez votre code et gagnez des commissions.`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-1">Votre code</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xl text-[#C9A84C] tracking-widest">
                  {ambassador.code}
                </span>
                <AmbassadorCopyButton text={ambassador.code} label="Code" />
              </div>
            </div>
          </div>

          {/* Lien d'invitation */}
          <div className="mt-5 bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-white/80 text-xs font-mono truncate">{referralLink}</p>
            <AmbassadorCopyButton text={referralLink} label="Lien" />
          </div>
        </div>

        {/* ── Stats cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Solde disponible */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">💰 Solde</p>
            <p className="text-2xl font-black text-[#0F7A60]">{ambassador.balance.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-400 mt-0.5">FCFA disponibles</p>
          </div>

          {/* Total gagné */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">🏆 Total gagné</p>
            <p className="text-2xl font-black text-[#C9A84C]">{ambassador.totalEarned.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-400 mt-0.5">FCFA cumulés</p>
          </div>

          {/* Vendeurs référés */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">👥 Référés</p>
            <p className="text-2xl font-black text-gray-800">{ambassador.totalReferred}</p>
            <p className="text-xs text-gray-400 mt-0.5">vendeurs inscrits</p>
          </div>

          {/* Vendeurs qualifiés */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">✅ Qualifiés</p>
            <p className="text-2xl font-black text-[#0F7A60]">{ambassador.totalQualified}</p>
            <p className="text-xs text-gray-400 mt-0.5">CA ≥ 50 000 FCFA</p>
          </div>
        </div>

        {/* ── Commissions en attente ─────────────────────────────── */}
        {pendingCommissions > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-xl">⏳</span>
            <p className="text-sm text-amber-800 font-medium">
              <strong>{pendingCommissions} vendeur{pendingCommissions > 1 ? 's' : ''}</strong> en attente de qualification
              — CA {'<'} {formatCFA(ambassador.minCaRequirement)} ce mois-ci.
              Les commissions sont créditées le 1er du mois suivant.
            </p>
          </div>
        )}

        {/* ── Tableau vendeurs référés ────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-black text-gray-900">Vendeurs référés</h2>
            <span className="text-xs text-gray-400 font-bold">{referrals.length} au total</span>
          </div>

          {referrals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              <p className="text-3xl mb-3">👥</p>
              <p className="font-medium">Aucun vendeur référé pour l&apos;instant.</p>
              <p className="text-xs mt-1">Partagez votre lien d&apos;invitation !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Boutique</th>
                    <th className="px-6 py-3 text-left">Mois</th>
                    <th className="px-6 py-3 text-right">CA du mois</th>
                    <th className="px-6 py-3 text-center">Qualifié</th>
                    <th className="px-6 py-3 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {referral.Store?.name ?? <span className="text-gray-400 italic">Boutique supprimée</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatMonth(referral.registrationMonth)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-700">
                        {referral.caInRegistrationMonth > 0
                          ? formatCFA(referral.caInRegistrationMonth)
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {referral.isQualified ? (
                          <span className="inline-flex items-center gap-1 bg-[#0F7A60]/10 text-[#0F7A60] text-xs font-bold px-2.5 py-1 rounded-full">
                            ✅ Qualifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            ⏳ En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {referral.commissionPaid ? (
                          <span className="inline-flex items-center gap-1 bg-[#0F7A60]/10 text-[#0F7A60] text-xs font-bold px-2.5 py-1 rounded-full">
                            Payée · {formatCFA(referral.commissionAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Historique transactions ─────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Historique des transactions</h2>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              <p className="text-3xl mb-3">📋</p>
              <p>Aucune transaction pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-right">Montant</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {TX_TYPE_LABELS[tx.type] ?? tx.type}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#0F7A60]">
                        +{formatCFA(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">
                        {tx.description ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Bouton retrait ─────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-black text-gray-900 mb-1">Retrait des commissions</h2>
            <p className="text-xs text-gray-400">
              Solde minimum requis : <strong>5 000 FCFA</strong>
            </p>
          </div>

          {canWithdraw ? (
            <AmbassadorWithdrawModal
              ambassadorId={ambassador.id}
              balance={ambassador.balance}
            />
          ) : (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 font-medium">
              Solde insuffisant — minimum {formatCFA(5000)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
