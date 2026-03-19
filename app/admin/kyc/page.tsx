// ─── app/admin/kyc/page.tsx ───────────────────────────────────────────────────
// Server Component — liste des dossiers KYC à traiter
// Auth : super_admin ou gestionnaire uniquement

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

// ─── Page principale ──────────────────────────────────────────────────────────

export default async function AdminKYCPage() {
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
    .eq('kyc_status', 'submitted')
    .order('created_at', { ascending: true })

  const stores = (pendingKYC ?? []) as StoreKYC[]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── En-tête ── */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-[#0F7A60]/10">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">
              KYC — Dossiers en attente
              {stores.length > 0 && (
                <span className="ml-2 text-base font-black text-white bg-[#0F7A60] rounded-full px-2.5 py-0.5 align-middle">
                  {stores.length}
                </span>
              )}
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-12">
            Vérifiez les identités soumises par les vendeurs PDV Pro.
          </p>
        </div>
      </header>

      {/* ── État vide ── */}
      {stores.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-2">Aucun dossier en attente</h2>
          <p className="text-sm text-gray-400">
            Tous les dossiers KYC soumis ont été traités. Revenez plus tard !
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
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                hover:shadow-md transition-shadow duration-200"
            >
              {/* Card header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
                {/* Avatar initiale */}
                <div className="w-10 h-10 rounded-xl bg-[#0F7A60]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-black text-[#0F7A60]">
                    {store.name[0]?.toUpperCase() ?? 'S'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-black text-[#1A1A1A]">{store.name}</p>
                    <span className="text-xs font-bold text-white bg-[#C9A84C] rounded-full px-2 py-0.5">
                      {docIcon} {docType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    👤 {fullName} · Soumis le {submittedAt}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold text-[#C9A84C] bg-[#FDF9F0] border border-[#C9A84C]/20 rounded-full px-3 py-1">
                    ⏳ En attente
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="px-6 py-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                  Documents soumis
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Recto */}
                  <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Recto</p>
                    {rectoUrl ? (
                      <a
                        href={rectoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-[#0F7A60] hover:underline"
                      >
                        <span>👁️</span> Voir le document
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Non fourni</p>
                    )}
                  </div>

                  {/* Verso */}
                  <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Verso</p>
                    {versoUrl ? (
                      <a
                        href={versoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-[#0F7A60] hover:underline"
                      >
                        <span>👁️</span> Voir le document
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Non fourni</p>
                    )}
                  </div>

                  {/* Domicile */}
                  <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Domicile</p>
                    {domicileUrl ? (
                      <a
                        href={domicileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-[#0F7A60] hover:underline"
                      >
                        <span>👁️</span> Voir le document
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Non fourni</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions (client) */}
              <div className="px-6 pb-5">
                <KYCAdminActions storeId={store.id} storeName={store.name} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
