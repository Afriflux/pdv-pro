'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import {
  Users, Settings, Loader2, Save, ToggleLeft, ToggleRight,
  BookOpen, ShieldCheck, ShieldAlert,
  FileSignature,
  Download,
  Eye,
  LayoutGrid,
  List,
  Wallet
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import ContractModal from '@/components/ambassadeur/ContractModal'
import AmbassadorDetailsDrawer from '@/components/admin/AmbassadorDetailsDrawer'

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
  total_referred:        number
  total_qualified:       number
  total_earned:          number
  balance:               number
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

type ActiveTab = 'ambassadeurs' | 'regles'

// ─── Cards stats (Overlapping header) ────────────────────────────────────────

function StatsCards({ ambassadeurs }: { ambassadeurs: AmbassadorWithStore[] }) {
  const total   = ambassadeurs.length
  const actifs  = ambassadeurs.filter(a => a.is_active).length
  const signés  = ambassadeurs.filter(a => a.contract_accepted).length
  const kycOk   = ambassadeurs.filter(a => a.Store?.kyc_status === 'verified').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {[
        { label: 'Total Ambassadeurs', value: total,  icon: Users,          bg: 'from-blue-500/5 to-transparent', color: 'text-blue-900', iconColor: 'text-blue-500' },
        { label: 'Ambassadeurs Actifs',value: actifs, icon: ToggleRight,    bg: 'from-emerald-500/5 to-transparent', color: 'text-[#0F7A60]', iconColor: 'text-emerald-500' },
        { label: 'Contrats Signés',    value: signés, icon: FileSignature,  bg: 'from-amber-500/5 to-transparent', color: 'text-[#C9A84C]', iconColor: 'text-amber-500' },
        { label: 'KYC Validés',        value: kycOk,  icon: ShieldCheck,    bg: 'from-purple-500/5 to-transparent', color: 'text-purple-900', iconColor: 'text-purple-500'  },
      ].map(s => {
        const Icon = s.icon
        return (
          <div key={s.label} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
               <Icon className={`w-4 h-4 ${s.iconColor} opacity-70`} />
            </div>
            <p className={`text-2xl lg:text-3xl font-black relative z-10 ${s.color}`}>{s.value}</p>
          </div>
        )
      })}
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
  const [selectedAmb,   setSelectedAmb]   = useState<AmbassadorWithStore | null>(null)
  const [viewMode,      setViewMode]      = useState<'list' | 'kanban'>('list')
  const [, startTransition]               = useTransition()

  // ── CSV Export ──
  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Boutique,Email,Code,Filleuls,Qualifies,GainsTotaux,SoldeRestant\n"
      + list.map(a => `${a.Store?.name},${a.Store?.User?.email},${a.code},${a.total_referred},${a.total_qualified},${a.total_earned},${a.balance}`).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Export_Ambassadeurs_${format(new Date(), 'dd_MM_yyyy')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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

      startTransition(() => router.refresh())
    } catch (err: unknown) {
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
      <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        <div className="w-20 h-20 bg-[#FAFAF7] shadow-inner rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-gray-100">
          <Users className="w-10 h-10 text-emerald-600/50" />
        </div>
        <h2 className="text-xl font-black text-[#1A1A1A] mb-2 relative z-10">Aucun ambassadeur</h2>
        <p className="text-sm text-gray-500 relative z-10">
          Les vendeurs ambassadeurs apparaîtront ici avec leur code de parrainage.
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

      {/* Drawer détails filleuls/transactions */}
      <AmbassadorDetailsDrawer
        isOpen={selectedAmb !== null}
        onClose={() => setSelectedAmb(null)}
        ambassadorId={selectedAmb?.id ?? null}
        ambassadorName={selectedAmb?.Store?.name ?? selectedAmb?.Store?.User?.name ?? 'Ambassadeur'}
        ambassadorCode={selectedAmb?.code ?? ''}
      />

      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-1 bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
            <button
               onClick={() => setViewMode('list')}
               aria-label="Vue Liste"
               title="Vue Liste"
               className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            >
               <List className="w-4 h-4" />
            </button>
            <button
               onClick={() => setViewMode('kanban')}
               aria-label="Vue Grille (Kanban)"
               title="Vue Grille"
               className={`p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            >
               <LayoutGrid className="w-4 h-4" />
            </button>
         </div>

         <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter CSV (Paie)</span>
         </button>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-2">
          <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#FAFAF7] border-b border-gray-100 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">Vendeur Associé</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Gains & Solde</th>
                <th className="px-6 py-5 text-center">Contrat / KYC</th>
                <th className="px-6 py-5 text-center">Engagement</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {list.map((amb) => {
                const kycOk = amb.Store?.kyc_status === 'verified'
                return (
                  <tr key={amb.id} className="hover:bg-[#FAFAF7]/50 transition-colors group cursor-pointer" onClick={() => setSelectedAmb(amb)}>
                    {/* Boutique + Code */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-600 font-black flex-shrink-0">
                          {(amb.Store?.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-[#0F7A60] transition-colors">{amb.Store?.name ?? 'Inconnue'}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-mono font-bold tracking-widest">
                              {amb.code}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Performance (Filleuls) */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                           <Users className="w-3.5 h-3.5 text-gray-400" />
                           <span className="text-xs font-bold text-gray-900">{amb.total_referred} inscrits</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                           <span className="text-xs font-bold text-emerald-600">{amb.total_qualified} qualifiés</span>
                         </div>
                       </div>
                    </td>

                    {/* Gains / Solde */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black w-14">Généré:</span>
                            <span className="text-xs font-black text-gray-900">{amb.total_earned.toLocaleString('fr-FR')} F</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#0F7A60] uppercase tracking-widest font-black w-14">À Payer:</span>
                            <span className="text-xs font-black text-[#0F7A60]">{amb.balance.toLocaleString('fr-FR')} F</span>
                         </div>
                       </div>
                    </td>

                    {/* Contrat & KYC */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        {kycOk ? (
                          <span className="w-full justify-center inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] uppercase font-black tracking-wider">
                            <ShieldCheck size={10} /> KYC OK
                          </span>
                        ) : (
                          <span className="w-full justify-center inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[9px] uppercase font-black tracking-wider">
                            <ShieldAlert size={10} /> KYC REC.
                          </span>
                        )}
                        {amb.contract_accepted ? (
                          <span className="w-full justify-center inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] uppercase font-black tracking-wider">
                            <FileSignature size={10} /> CONTRAT SIGNÉ
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setContractAmb(amb); }}
                            className="w-full justify-center inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded transition-colors"
                          >
                            <FileSignature size={10} /> EXIGER CONTRAT
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Statut & Date */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            amb.is_active
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                              : 'bg-red-50 border border-red-200 text-red-600'
                          }`}>
                            {amb.is_active ? 'Actif' : 'Bloqué'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            Depuis {format(new Date(amb.created_at), 'MMM yyyy', { locale: fr })}
                          </span>
                       </div>
                    </td>

                    {/* Toggle */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedAmb(amb); }}
                          className="p-1.5 text-gray-400 hover:text-[#0F7A60] transition-colors"
                          title="Voir le détail des filleuls"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(amb.id, amb.is_active); }}
                          disabled={toggling === amb.id}
                          className="inline-flex items-center justify-center transition-colors hover:scale-105"
                          title={amb.is_active ? 'Bloquer' : 'Activer'}
                        >
                          {toggling === amb.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          ) : amb.is_active ? (
                            <ToggleRight className="w-7 h-7 text-[#0F7A60]" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-gray-300" />
                          )}
                        </button>
                      </div>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
      /* ── KANBAN VIEW ── */
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
        {list.map((amb) => {
          const kycOk = amb.Store?.kyc_status === 'verified'
          return (
            <div 
              key={amb.id} 
              onClick={() => setSelectedAmb(amb)}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group flex flex-col"
            >
               {/* Header Card */}
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-lg flex-shrink-0">
                      {(amb.Store?.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-[#0F7A60] transition-colors line-clamp-1">{amb.Store?.name ?? 'Inconnue'}</span>
                      <span className="inline-flex mt-1 items-center px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded text-[10px] font-mono font-bold tracking-widest">
                        {amb.code}
                      </span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                   {!amb.is_active && (
                      <span className="w-3 h-3 rounded-full bg-red-400 animate-pulse" title="Bloqué"></span>
                   )}
                 </div>
               </div>

               {/* Stats Grid */}
               <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#FAFAF7] rounded-2xl p-3 border border-gray-50">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1.5"><Users className="w-3 h-3"/> Filleuls</p>
                    <p className="text-lg font-black text-gray-900">{amb.total_referred}</p>
                    <p className="text-xs font-bold text-emerald-500 mt-0.5">{amb.total_qualified} Qual.</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-2xl p-3 border border-gray-50">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center gap-1.5"><Wallet className="w-3 h-3"/> Gains</p>
                    <p className="text-lg font-black text-[#0F7A60]">{amb.total_earned >= 1000000 ? (amb.total_earned/1000000).toFixed(1) + 'M' : (amb.total_earned/1000).toFixed(0) + 'K'}</p>
                    <p className="text-xs font-bold text-amber-500 mt-0.5">{amb.balance > 0 ? `${amb.balance} F dûs` : 'Soldé'}</p>
                  </div>
               </div>

               {/* Tags & Action */}
               <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    {kycOk && <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><ShieldCheck size={14}/></span>}
                    {!kycOk && <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><ShieldAlert size={14}/></span>}
                    {amb.contract_accepted && <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileSignature size={14}/></span>}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggle(amb.id, amb.is_active); }}
                    disabled={toggling === amb.id}
                    className="p-2 ml-2 shrink-0 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {toggling === amb.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : amb.is_active ? (
                      <ToggleRight className="w-5 h-5 text-[#0F7A60]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
               </div>
            </div>
          )
        })}
      </div>
      )}
    </>
  )
}

// ─── Onglet 2 — Règles officielles + Config ───────────────────────────────────

function OngletRegles({ initialConfig }: { initialConfig: Record<string, string> }) {
  const [config,  setConfig]  = useState<Record<string, string>>(initialConfig)
  const [saving,  setSaving]  = useState(false)
  
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
      toast.success('Configuration sauvegardée ✅')
    } catch (err: unknown) {
      toast.error('Erreur : ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-[#1A1A1A] ' +
    'focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all shadow-inner'

  const labelCls = 'block text-[11px] font-black text-gray-400 mb-1.5 uppercase tracking-widest'

  const isActive = config['ambassador_program_active'] === 'true'
  const commissionAmount = Number(config['ambassador_commission_fixed'] ?? '1000')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      
      {/* ── Colonne Config programme ── */}
      <div className="lg:col-span-1 border border-gray-100 bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 md:p-8 h-fit">
        <h3 className="text-sm font-black text-[#1A1A1A] mb-8 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#0F7A60]" />
          Paramètres Généraux
        </h3>
        
        <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">

          {/* Toggle activation globale */}
          <div className="flex flex-col bg-[#FAFAF7] rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Activer le Programme</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Autoriser les nouveaux parrainages.</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('ambassador_program_active', isActive ? 'false' : 'true')}
                aria-label={isActive ? 'Désactiver le programme' : 'Activer le programme'}
              >
                {isActive
                  ? <ToggleRight className="w-9 h-9 text-[#0F7A60]" />
                  : <ToggleLeft  className="w-9 h-9 text-gray-300" />
                }
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Commission fixe */}
            <div>
              <label className={labelCls}>Commission (FCFA)</label>
              <input
                aria-label="Commission par filleul"
                type="number"
                min={0}
                step={100}
                value={config['ambassador_commission_fixed'] ?? '1000'}
                onChange={e => handleChange('ambassador_commission_fixed', e.target.value)}
                className={inputCls}
              />
              <p className="mt-2 text-[10px] text-gray-400">Rémunération par filleul validé.</p>
            </div>

            {/* CA minimum filleul */}
            <div>
              <label className={labelCls}>CA Minimum (FCFA)</label>
              <input
                aria-label="CA minimum filleul"
                type="number"
                min={0}
                step={5000}
                value={config['ambassador_min_revenue'] ?? '50000'}
                onChange={e => handleChange('ambassador_min_revenue', e.target.value)}
                className={inputCls}
              />
              <p className="mt-2 text-[10px] text-gray-400">Chiffre d'affaires à réaliser ce mois-ci par le filleul.</p>
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
              <p className="mt-2 text-[10px] text-gray-400">Période accordée au filleul pour réaliser le CA.</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-black
                disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder les règles'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Colonne Règles officielles (Mémo) ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-[#1A1A1A] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
           <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 relative z-10">
             <BookOpen className="w-5 h-5 text-emerald-400" />
             Mémo de déclenchement
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
             <RuleBlock icon="💰" title="Rémunération & Modalités">
               <p>Montant <strong>FIXE</strong> ({commissionAmount.toLocaleString('fr-FR')} FCFA) pour l'ambassadeur.</p>
               <p className="mt-1">Paiement automatisé via Wave / Orange Money une fois validé.</p>
             </RuleBlock>

             <RuleBlock icon="✅" title="Validation du Filleul">
               <ul className="list-disc list-inside space-y-1">
                 <li>Min. {Number(config['ambassador_min_revenue'] ?? 50000).toLocaleString('fr-FR')} FCFA de CA</li>
                 <li>CA réalisé sous {config['ambassador_observation_days'] ?? 30} jours</li>
                 <li>KYC du filleul vérifié (Carte d'identité Validée)</li>
               </ul>
             </RuleBlock>

             <RuleBlock icon="🔐" title="Code Affiliation (Parrainage)">
               <ul className="list-disc list-inside space-y-1">
                 <li>Le filleul doit s'inscrire via le code <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono text-xs">AMB-XXXXX</code> de l'ambassadeur au moment de sa création de boutique.</li>
               </ul>
             </RuleBlock>

             <RuleBlock icon="⚠️" title="Risques & Conditions Générales">
               <ul className="list-disc list-inside space-y-1">
                 <li>Génération de faux comptes = suspension du contrat ambassadeur immédiatement.</li>
                 <li>Nécessite que l'ambassadeur ait lui-même signé son propre contrat et validé son KYC.</li>
               </ul>
             </RuleBlock>
           </div>
        </div>
      </div>

    </div>
  )
}

function RuleBlock({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
      <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span> {title}
      </p>
      <div className="text-sm font-medium text-gray-400 space-y-1.5 leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AmbassadeursClient({ ambassadeurs, initialConfig }: AmbassadeursClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ambassadeurs')

  const commissionAmount = Number(initialConfig['ambassador_commission_fixed'] ?? '1000')

  const tabs: Array<{ id: ActiveTab; label: string; icon: typeof Users }> = [
    { id: 'ambassadeurs', label: `Annuaire Ambassadeurs`, icon: Users    },
    { id: 'regles',       label: 'Configuration & Règles', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <StatsCards ambassadeurs={ambassadeurs} />

      {/* Tabs Layout */}
      <div className="bg-white border border-gray-100 rounded-2xl p-1.5 inline-flex w-full sm:w-auto shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-[#1A1A1A] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-400' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ambassadeurs' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <OngletAmbassadeurs
             ambassadeurs={ambassadeurs}
             commissionAmount={commissionAmount}
           />
        </div>
      )}
      
      {activeTab === 'regles' && (
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <OngletRegles initialConfig={initialConfig} />
         </div>
      )}
    </div>
  )
}
