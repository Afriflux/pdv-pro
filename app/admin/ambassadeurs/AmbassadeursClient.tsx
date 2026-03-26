'use client'

// ─── app/admin/ambassadeurs/AmbassadeursClient.tsx ────────────────────────────
// Composant client — Gestion du programme ambassadeur admin
// Fix 1 : Toggle optimiste + router.refresh()
// Fix 2 : Règles officielles PDV Pro mises à jour
// Feature 3 : Contrat ambassadeur (ContractModal)
// Feature 4 : Badge KYC dans la liste

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users, Settings, Loader2, Save, ToggleLeft, ToggleRight,
  BookOpen, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ContractModal from '@/components/ambassadeur/ContractModal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AmbassadorWithStore {
  id:                    string
  code:                  string
  is_active:             boolean
  commission_rate:       number
  created_at:            string
  vendor_id:             string
  contract_accepted:     boolean
  contract_accepted_at:  string | null
  Store: {
    name: string
    slug: string
    kyc_status: string | null
    User: { email: string; name: string | null } | null
  } | null
}

interface AmbassadeursClientProps {
  ambassadeurs:  AmbassadorWithStore[]
  initialConfig: Record<string, string>
}

type ActiveTab = 'ambassadeurs' | 'regles' | 'creer'

// ─── Cards stats ─────────────────────────────────────────────────────────────

function StatsCards({ ambassadeurs }: { ambassadeurs: AmbassadorWithStore[] }) {
  const total   = ambassadeurs.length
  const actifs  = ambassadeurs.filter(a => a.is_active).length
  const signés  = ambassadeurs.filter(a => a.contract_accepted).length
  const kycOk   = ambassadeurs.filter(a => a.Store?.kyc_status === 'verified').length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total ambassadeurs', value: total,  color: 'text-[#1A1A1A]', bg: 'bg-white/70' },
        { label: 'Actifs',             value: actifs, color: 'text-[#0F7A60]', bg: 'bg-[#0F7A60]/5' },
        { label: 'Contrats signés',    value: signés, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/5' },
        { label: 'KYC vérifié',        value: kycOk,  color: 'text-emerald-600', bg: 'bg-emerald-500/5'  },
      ].map(s => (
        <div key={s.label} className={`backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group ${s.bg}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-2 relative z-10">{s.label}</p>
          <p className={`text-4xl font-black relative z-10 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Onglet 1 — Liste ────────────────────────────────────────────────────────

function OngletAmbassadeurs({
  ambassadeurs: initialList,
  commissionAmount,
}: {
  ambassadeurs: AmbassadorWithStore[]
  commissionAmount: number
}) {
  const router = useRouter()
  const [list,          setList]          = useState(initialList)
  const [toggling,      setToggling]      = useState<string | null>(null)
  const [contractAmb,   setContractAmb]   = useState<AmbassadorWithStore | null>(null)
  const [, startTransition]               = useTransition()

  // ── Toggle actif/inactif (optimiste + refresh) ────────────────────────────

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setToggling(id)

    // Mise à jour optimiste immédiate
    setList(prev => prev.map(a =>
      a.id === id ? { ...a, is_active: !currentStatus } : a
    ))

    try {
      const res = await fetch('/api/admin/ambassador/toggle', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, is_active: !currentStatus }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      toast.success(`Ambassadeur ${!currentStatus ? 'activé' : 'désactivé'} ✅`)

      // Refresh server component pour cohérence
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      // Rollback en cas d'erreur
      setList(prev => prev.map(a =>
        a.id === id ? { ...a, is_active: currentStatus } : a
      ))
      toast.error('Erreur : ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setToggling(null)
    }
  }

  if (list.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
          <Users className="w-10 h-10 text-gray-300" />
          <div className="absolute -inset-4 bg-emerald-400/20 rounded-full blur-xl -z-10" />
        </div>
        <h2 className="text-xl font-black text-[#1A1A1A] mb-2 relative z-10">Aucun ambassadeur</h2>
        <p className="text-sm text-gray-500 relative z-10">
          Les vendeurs autorisés apparaîtront ici avec leur code unique.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Modal contrat */}
      {contractAmb && (
        <ContractModal
          ambassadorName={contractAmb.Store?.name ?? contractAmb.Store?.User?.name ?? 'Ambassadeur'}
          ambassadorCode={contractAmb.code}
          commissionAmount={commissionAmount}
          onAccept={async () => {
            try {
              const res = await fetch(`/api/admin/ambassador/contract`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id: contractAmb.id }),
              })
              const data = await res.json() as { success?: boolean; error?: string }
              if (!res.ok) throw new Error(data.error)
              setList(prev => prev.map(a =>
                a.id === contractAmb.id
                  ? { ...a, contract_accepted: true, contract_accepted_at: new Date().toISOString() }
                  : a
              ))
              toast.success('✅ Contrat signé et enregistré')
              setContractAmb(null)
              startTransition(() => router.refresh())
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : 'Erreur lors de la signature')
            }
          }}
          onClose={() => setContractAmb(null)}
        />
      )}

      <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Subtle Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-[#0F7A60]/[0.02] border-b border-white/40 text-gray-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">Boutique / Vendeur</th>
                <th className="px-6 py-5">Code</th>
                <th className="px-6 py-5 text-center">Commission</th>
                <th className="px-6 py-5 text-center">KYC</th>
                <th className="px-6 py-5 text-center">Contrat</th>
                <th className="px-6 py-5 text-center">Statut</th>
                <th className="px-6 py-5">Depuis</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {list.map((amb) => {
                const kycOk = amb.Store?.kyc_status === 'verified'
                return (
                  <tr key={amb.id} className="hover:bg-white/50 transition-colors border-b border-white/20 last:border-0 group">

                    {/* Boutique */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 shadow-inner flex items-center justify-center text-[#0F7A60] font-black text-sm flex-shrink-0">
                          {(amb.Store?.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors">
                            {amb.Store?.name ?? 'Boutique inconnue'}
                          </p>
                          <p className="text-xs font-medium text-gray-500">{amb.Store?.User?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1.5 bg-[#0F7A60]/10 border border-[#0F7A60]/20 text-[#0F7A60] rounded-xl font-mono text-xs font-black tracking-wider shadow-sm">
                        {amb.code}
                      </span>
                    </td>

                    {/* Commission */}
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-3 py-1.5 rounded-xl">
                        {commissionAmount.toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>

                    {/* KYC */}
                    <td className="px-6 py-5 text-center">
                      {kycOk ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm">
                          <ShieldCheck size={12} /> Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm">
                          <ShieldAlert size={12} /> Requis
                        </span>
                      )}
                    </td>

                    {/* Contrat */}
                    <td className="px-6 py-5 text-center">
                      {amb.contract_accepted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                          <ShieldCheck size={12} /> Signé
                        </span>
                      ) : (
                        <button
                          onClick={() => setContractAmb(amb)}
                          className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 shadow-sm transition-colors"
                        >
                          ⚠️ Faire signer
                        </button>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider inline-block shadow-sm ${
                        amb.is_active
                          ? 'bg-[#0F7A60]/10 border border-[#0F7A60]/20 text-[#0F7A60]'
                          : 'bg-red-50 border border-red-200 text-red-600'
                      }`}>
                        {amb.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5 text-xs font-semibold text-gray-500">
                      {format(new Date(amb.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>

                    {/* Toggle */}
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggle(amb.id, amb.is_active)}
                        disabled={toggling === amb.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
                        aria-label={amb.is_active ? 'Désactiver cet ambassadeur' : 'Activer cet ambassadeur'}
                        title={amb.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {toggling === amb.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : amb.is_active ? (
                          <ToggleRight className="w-7 h-7 text-[#0F7A60]" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-gray-300" />
                        )}
                      </button>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ─── Onglet 2 — Règles officielles + Config ───────────────────────────────────

function OngletRegles({ initialConfig }: { initialConfig: Record<string, string> }) {
  const [config,  setConfig]  = useState<Record<string, string>>(initialConfig)
  const [saving,  setSaving]  = useState(false)
  const [showRules, setShowRules] = useState(false)

  const handleChange = (key: string, value: string) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ambassador/rules', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ config }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      toast.success('Règles du programme sauvegardées ✅')
    } catch (err: unknown) {
      toast.error('Erreur : ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-[#1A1A1A] ' +
    'focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all'

  const labelCls = 'block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider'

  const isActive = config['ambassador_program_active'] === 'true'
  const commissionAmount = Number(config['ambassador_commission_fixed'] ?? '1000')

  return (
    <div className="space-y-6">
      {/* ── Config programme ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0F7A60]/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <h3 className="text-sm font-black text-[#1A1A1A] mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#0F7A60]" />
          Configuration du programme
        </h3>
        <form onSubmit={handleSave} className="space-y-6 relative z-10">

          {/* Toggle activation globale */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm gap-4">
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">Programme ambassadeur actif</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Désactiver empêche les nouveaux parrainages.</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('ambassador_program_active', isActive ? 'false' : 'true')}
              aria-label={isActive ? 'Désactiver le programme' : 'Activer le programme'}
            >
              {isActive
                ? <ToggleRight className="w-10 h-10 text-[#0F7A60]" />
                : <ToggleLeft  className="w-10 h-10 text-gray-300" />
              }
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Commission fixe par filleul validé */}
            <div>
              <label className={labelCls}>Commission par filleul (FCFA)</label>
              <input
                aria-label="Commission par filleul"
                type="number"
                min={0}
                step={100}
                value={config['ambassador_commission_fixed'] ?? '1000'}
                onChange={e => handleChange('ambassador_commission_fixed', e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-gray-400">Montant fixe versé par filleul validé</p>
            </div>

            {/* CA minimum filleul */}
            <div>
              <label className={labelCls}>CA min filleul (FCFA)</label>
              <input
                aria-label="CA minimum filleul"
                type="number"
                min={0}
                step={5000}
                value={config['ambassador_min_revenue'] ?? '50000'}
                onChange={e => handleChange('ambassador_min_revenue', e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-gray-400">CA réalisé le 1er mois</p>
            </div>

            {/* Durée observation filleul */}
            <div>
              <label className={labelCls}>Durée observation (jours)</label>
              <input
                aria-label="Durée observation en jours"
                type="number"
                min={1}
                max={90}
                value={config['ambassador_observation_days'] ?? '30'}
                onChange={e => handleChange('ambassador_observation_days', e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-gray-400">Fenêtre d&apos;observation filleul</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F7A60] hover:bg-[#0D5C4A]
                disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Règles officielles (accordéon) ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRules(v => !v)}
          className="w-full flex items-center justify-between px-8 py-6 text-sm font-black text-[#1A1A1A] hover:bg-white/50 transition-colors border-b border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
              <BookOpen size={18} />
            </div>
            Règles officielles du programme ambassadeur
          </div>
          <span className="text-gray-400 bg-white/60 px-3 py-1.5 rounded-xl border border-white/50">{showRules ? 'Masquer' : 'Afficher'}</span>
        </button>

        {showRules && (
          <div className="px-6 pb-6 space-y-4 text-sm">

            {/* Commission */}
            <RuleBlock icon="💰" title="Commission de parrainage">
              <p>Montant <strong>FIXE</strong> défini par l&#39;admin (ex : {commissionAmount.toLocaleString('fr-FR')} FCFA par filleul validé).</p>
              <p className="text-gray-400 text-xs mt-1">Modifiable dans la configuration ci-dessus.</p>
            </RuleBlock>

            {/* Conditions */}
            <RuleBlock icon="✅" title="Conditions pour toucher la commission">
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Le filleul doit exister depuis au moins <strong>1 mois</strong></li>
                <li>Le filleul doit avoir réalisé <strong>minimum {(Number(config['ambassador_min_revenue'] ?? 50000)).toLocaleString('fr-FR')} FCFA de CA</strong> durant son premier mois</li>
                <li>Le filleul doit avoir son <strong>KYC vérifié</strong> (identité confirmée)</li>
              </ul>
              <p className="text-xs text-amber-600 font-bold mt-2">⚠️ Ces trois conditions doivent être remplies simultanément.</p>
            </RuleBlock>

            {/* Code */}
            <RuleBlock icon="🔑" title="Code ambassadeur">
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Unique par ambassadeur — format : <code className="font-mono bg-gray-100 px-1 rounded">AMB-XXXXX</code></li>
                <li>Actuellement <strong>OBLIGATOIRE</strong> à l&#39;inscription de chaque vendeur</li>
                <li>Après 3 à 6 mois, l&#39;inscription sans parrainage pourra être activée → commission automatiquement désactivée</li>
              </ul>
            </RuleBlock>

            {/* Durée */}
            <RuleBlock icon="⏳" title="Durée du badge ambassadeur">
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Tant que l&#39;admin maintient le badge actif (toggle par ligne)</li>
                <li>OU jusqu&#39;à désactivation globale du programme</li>
              </ul>
            </RuleBlock>

            {/* Paiement */}
            <RuleBlock icon="💳" title="Paiement des commissions">
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Automatique dès que les 3 conditions filleul sont remplies</li>
                <li>Via Wave ou Orange Money (configuré dans le profil ambassadeur)</li>
                <li>Chaque commission validée est versée automatiquement</li>
              </ul>
            </RuleBlock>

            {/* Conditions générales */}
            <RuleBlock icon="⚠️" title="Conditions générales">
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Être approuvé par l&#39;équipe PDV Pro</li>
                <li>KYC ambassadeur vérifié obligatoire</li>
                <li>Avoir signé et accepté le contrat ambassadeur PDV Pro</li>
                <li>Respecter la charte de communication PDV Pro</li>
                <li>Interdiction formelle de recruter des vendeurs fictifs</li>
              </ul>
            </RuleBlock>

          </div>
        )}
      </div>
    </div>
  )
}

function RuleBlock({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span> {title}
      </p>
      <div className="text-sm font-medium text-gray-600 space-y-1.5 leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AmbassadeursClient({ ambassadeurs, initialConfig }: AmbassadeursClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ambassadeurs')

  const commissionAmount = Number(initialConfig['ambassador_commission_fixed'] ?? '1000')

  const tabs: Array<{ id: ActiveTab; label: string; icon: typeof Users }> = [
    { id: 'ambassadeurs', label: `Vendeurs Ambassadeurs (${ambassadeurs.length})`, icon: Users    },
    { id: 'regles',       label: 'Règles & Configuration',                         icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards ambassadeurs={ambassadeurs} />

      {/* Onglets */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 relative overflow-hidden ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#0F7A60] to-teal-500 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50'
                : 'bg-white/70 backdrop-blur-xl border border-white/50 text-gray-500 hover:bg-white/90 hover:text-gray-900 shadow-sm'
            }`}
          >
            {activeTab === tab.id && <div className="absolute inset-0 bg-white/20 hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <tab.icon className="w-4.5 h-4.5 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === 'ambassadeurs' && (
        <OngletAmbassadeurs
          ambassadeurs={ambassadeurs}
          commissionAmount={commissionAmount}
        />
      )}
      {activeTab === 'regles' && <OngletRegles initialConfig={initialConfig} />}
    </div>
  )
}
