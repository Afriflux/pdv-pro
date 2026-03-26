// ─── app/admin/kyc/page.tsx ───────────────────────────────────────────────────
// Server Component — liste des dossiers KYC à traiter
// Auth : super_admin ou gestionnaire uniquement

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import KYCAdminActions from './KYCAdminActions'

// ─── Types ───────────────────────────────────────────────────────────────────

interface KYCDocuments {
  full_name?:        string
  id_card_url?:      string
  id_card_back_url?: string
  domicile_url?:     string
  submitted_at?:     string
  rejection_reason?: string
}

interface StoreKYC {
  id:                string
  name:              string
  slug:              string
  kyc_status:        string
  kyc_document_type: string | null
  kyc_documents:     KYCDocuments | null
  id_card_url:       string | null
  created_at:        string
  user_id:           string
}

// ─── Helper — formater la date ────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

// ─── Page principale ──────────────────────────────────────────────────────────

export default async function AdminKYCPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams
  const currentStatus = params.status || 'submitted'
  // 1. Auth admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const supabaseAdmin = createAdminClient()
  const { data: adminUser } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['super_admin', 'gestionnaire']
  if (!adminUser?.role || !allowedRoles.includes(adminUser.role)) {
    redirect('/admin')
  }

  // 2. Charger les dossiers KYC soumis (par ordre d'ancienneté)
  const { data: pendingKYC } = await supabaseAdmin
    .from('Store')
    .select(`
      id, name, slug, kyc_status, kyc_document_type,
      kyc_documents, id_card_url, created_at, user_id
    `)
    .eq('kyc_status', currentStatus)
    .order('created_at', { ascending: true })

  const stores = (pendingKYC ?? []) as StoreKYC[]

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start animate-in fade-in duration-500">
      
      {/* ── COLONNE GAUCHE : ONGLETS LATÉRAUX ── */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1 sticky top-24 z-10">
        <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4 mb-3">Statuts KYC</h2>
        
        <nav className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-3 flex flex-col gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <Link 
            href="/admin/kyc?status=submitted" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${currentStatus === 'submitted' ? 'bg-gradient-to-r from-[#C9A84C] to-amber-500 text-white shadow-[0_4px_15px_rgba(201,168,76,0.3)] border border-[#C9A84C]/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-[#C9A84C] border border-transparent'}`}
          >
            {currentStatus === 'submitted' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${currentStatus === 'submitted' ? 'bg-white' : 'bg-[#C9A84C]'}`} />
            <ShieldAlert className="w-4 h-4 relative z-10" /> 
            <span className="flex-1 relative z-10">En attente</span>
          </Link>
          <Link 
            href="/admin/kyc?status=verified" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${currentStatus === 'verified' ? 'bg-gradient-to-r from-[#0F7A60] to-emerald-500 text-white shadow-[0_4px_15px_rgba(15,122,96,0.3)] border border-[#0F7A60]/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-[#0F7A60] border border-transparent'}`}
          >
            {currentStatus === 'verified' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${currentStatus === 'verified' ? 'bg-white' : 'bg-[#0F7A60]'}`} />
            <ShieldCheck className="w-4 h-4 relative z-10" /> 
            <span className="flex-1 relative z-10">Vérifiés</span>
          </Link>
          <Link 
            href="/admin/kyc?status=rejected" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${currentStatus === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] border border-red-500/50' : 'bg-transparent text-gray-500 hover:bg-white/80 hover:text-red-500 border border-transparent'}`}
          >
            {currentStatus === 'rejected' && <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full pointer-events-none" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative z-10 shadow-sm ${currentStatus === 'rejected' ? 'bg-white' : 'bg-red-500'}`} />
            <ShieldX className="w-4 h-4 relative z-10" /> 
            <span className="flex-1 relative z-10">Rejetés</span>
          </Link>
        </nav>
      </div>

      {/* ── COLONNE DROITE : CONTENU PRINCIPAL ── */}
      <div className="flex-1 w-full space-y-6">

        {/* ── En-tête ── */}
        <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-[#0F7A60]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A1A1A]">
                Validation des Identités
                {stores.length > 0 && (
                  <span className="ml-3 text-xs font-black text-white bg-gradient-to-r from-[#0F7A60] to-teal-500 rounded-lg px-2.5 py-1 align-middle shadow-sm">
                    {stores.length}
                  </span>
                )}
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-14 font-medium">
              {currentStatus === 'submitted' ? 'Vérifiez et validez les identités soumises par les vendeurs.' : 
               currentStatus === 'verified' ? 'Identités validées et certifiées par l\'équipe.' : 'Dossiers d\'identité rejetés nécessitant une nouvelle soumission.'}
            </p>
          </div>
        </header>

      {/* ── État vide Premium ── */}
      {stores.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/50 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/50">
            {currentStatus === 'submitted' ? <ShieldCheck className="w-10 h-10 text-[#0F7A60] opacity-80" /> : <ShieldAlert className="w-10 h-10 text-gray-300" />}
            <div className="absolute -inset-4 bg-emerald-400/20 rounded-full blur-xl -z-10" />
          </div>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-2 relative z-10">Aucun dossier trouvé</h2>
          <p className="text-sm text-gray-500 relative z-10">
            Il n&apos;y a aucun dossier d&apos;identité dans cette catégorie actuellement.
          </p>
        </div>
      )}

      {/* ── Liste des dossiers ── */}
      <div className="space-y-4">
        {stores.map((store) => {
          const docs = store.kyc_documents
          const submittedAt = docs?.submitted_at
            ? formatDate(docs.submitted_at)
            : formatDate(store.created_at)

          const fullName    = docs?.full_name        ?? '—'
          const docType     = store.kyc_document_type ?? '—'
          const rectoUrl    = docs?.id_card_url      ?? store.id_card_url ?? null
          const versoUrl    = docs?.id_card_back_url ?? null
          const domicileUrl = docs?.domicile_url     ?? null

          const docIcon =
            docType === 'cni'       ? '🪪'
            : docType === 'passeport' ? '📕'
            : docType === 'permis'    ? '🚗'
            : '📄'

          return (
            <div
              key={store.id}
              className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              {/* Card header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 border-b border-white/20 bg-gradient-to-r from-white/50 to-transparent">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar initiale */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F7A60]/10 to-teal-500/10 border border-[#0F7A60]/10 shadow-inner flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-black text-[#0F7A60]">
                      {store.name[0]?.toUpperCase() ?? 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="text-lg font-black text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors">{store.name}</p>
                      <span className="text-[10px] font-black tracking-wider uppercase text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg px-2.5 py-1">
                        {docIcon} {docType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate font-medium">
                      👤 {fullName} <span className="mx-2 text-gray-300">•</span> Soumis le {submittedAt}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 sm:self-start">
                  <span className={`text-[10px] font-black uppercase tracking-wider rounded-lg px-3 py-1.5 flex items-center gap-1.5 ${
                    currentStatus === 'submitted' ? 'text-amber-600 bg-amber-50 border border-amber-200 shadow-sm' : 
                    currentStatus === 'verified' ? 'text-[#0F7A60] bg-[#0F7A60]/10 border border-[#0F7A60]/20 shadow-sm' : 
                    'text-red-600 bg-red-50 border border-red-200 shadow-sm'
                  }`}>
                    {currentStatus === 'submitted' ? <><ShieldAlert className="w-3.5 h-3.5" /> En attente</> : 
                     currentStatus === 'verified' ? <><ShieldCheck className="w-3.5 h-3.5" /> Vérifié</> : 
                     <><ShieldX className="w-3.5 h-3.5" /> Rejeté</>}
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="px-8 py-6 bg-white/40">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Documents soumis pour vérification
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Recto */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md hover:border-[#0F7A60]/30 transition-all group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">Document Recto</p>
                    {rectoUrl ? (
                      <a
                        href={rectoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-[#0F7A60] hover:text-teal-600 transition-colors"
                      >
                        <span className="p-1.5 rounded-lg bg-[#0F7A60]/10 group-hover:bg-[#0F7A60] group-hover:text-white transition-colors">👁️</span> 
                        <span>Voir le document</span>
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic font-medium px-2 py-1.5 bg-gray-50 rounded-lg inline-block">Non fourni</p>
                    )}
                  </div>

                  {/* Verso */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md hover:border-[#0F7A60]/30 transition-all group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">Document Verso</p>
                    {versoUrl ? (
                      <a
                        href={versoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-[#0F7A60] hover:text-teal-600 transition-colors"
                      >
                        <span className="p-1.5 rounded-lg bg-[#0F7A60]/10 group-hover:bg-[#0F7A60] group-hover:text-white transition-colors">👁️</span> 
                        <span>Voir le document</span>
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic font-medium px-2 py-1.5 bg-gray-50 rounded-lg inline-block">Non fourni</p>
                    )}
                  </div>

                  {/* Domicile */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md hover:border-[#0F7A60]/30 transition-all group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">Justificatif Domicile</p>
                    {domicileUrl ? (
                      <a
                        href={domicileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-[#0F7A60] hover:text-teal-600 transition-colors"
                      >
                        <span className="p-1.5 rounded-lg bg-[#0F7A60]/10 group-hover:bg-[#0F7A60] group-hover:text-white transition-colors">👁️</span> 
                        <span>Voir le document</span>
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic font-medium px-2 py-1.5 bg-gray-50 rounded-lg inline-block">Non fourni</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions (client) */}
              <div className="px-8 pb-6 bg-white/40 rounded-b-3xl">
                <KYCAdminActions storeId={store.id} storeName={store.name} />
              </div>
            </div>
          )
        })}
      </div>
     </div>
    </div>
  )
}
