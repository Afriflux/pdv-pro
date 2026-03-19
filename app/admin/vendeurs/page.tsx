import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import {
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react'
import VendeursFiltres from './VendeursFiltres'

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
interface VendorRow {
  id: string
  name: string
  slug: string | null
  created_at: string
  is_active: boolean
  kyc_status: 'pending' | 'verified' | 'rejected' | null
  user_id: string
  User: { email: string; phone: string | null; role: string } | null
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    kyc?: string    // 'all' | 'verified' | 'pending' | 'rejected'
    status?: string // 'all' | 'active' | 'suspended'
    page?: string
  }>
}

// ----------------------------------------------------------------
// Badge KYC
// ----------------------------------------------------------------
function KYCBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0F7A60]/10 text-[#0F7A60] rounded-full text-[10px] font-black uppercase">
          <CheckCircle2 className="w-3 h-3" />
          Vérifié
        </span>
      )
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C9A84C]/10 text-[#C9A84C] rounded-full text-[10px] font-black uppercase">
          <Clock className="w-3 h-3" />
          En attente
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase">
          <XCircle className="w-3 h-3" />
          Rejeté
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase">
          <AlertCircle className="w-3 h-3" />
          Non soumis
        </span>
      )
  }
}

// ----------------------------------------------------------------
// PAGE : LISTE DES VENDEURS — Charte PDV Pro (émeraude/or/crème)
// ----------------------------------------------------------------
export default async function AdminVendorsPage({ searchParams }: PageProps) {
  // Next.js 14 : searchParams doit être awaité dans les async Server Components
  const params = await searchParams

  const supabase = createAdminClient()

  const query        = params.q      ?? ''
  const kycFilter    = params.kyc    ?? 'all'
  const statusFilter = params.status ?? 'all'
  const currentPage  = Number(params.page) || 1
  const pageSize     = 20
  const offset       = (currentPage - 1) * pageSize

  // ── ÉTAPE 1 : Requête Store avec filtres (sans join User) ──────────────────
  // Le join User() échoue silencieusement sur certaines configs Supabase
  // quand la FK n'est pas nommée correctement. On sépare les deux requêtes.

  interface StoreRaw {
    id:         string
    name:       string
    slug:       string | null
    created_at: string
    is_active:  boolean
    kyc_status: 'pending' | 'verified' | 'rejected' | null
    user_id:    string
  }

  interface UserRaw {
    id:    string
    email: string
    phone: string | null
    role:  string
  }

  let storeQuery = supabase
    .from('Store')
    .select('id, name, slug, created_at, is_active, kyc_status, user_id', { count: 'exact' })

  // Filtre par nom de boutique
  if (query) {
    storeQuery = storeQuery.ilike('name', `%${query}%`)
  }

  // Filtre KYC
  if (kycFilter !== 'all') {
    storeQuery = storeQuery.eq('kyc_status', kycFilter)
  }

  // Filtre Statut actif/suspendu
  if (statusFilter !== 'all') {
    storeQuery = storeQuery.eq('is_active', statusFilter === 'active')
  }

  const { data: storesRaw, count, error } = await storeQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[AdminVendors] Erreur Store:', error.message)
  }

  const stores = (storesRaw as unknown as StoreRaw[]) ?? []

  // ── ÉTAPE 2 : Récupérer les User pour les user_id trouvés ──────────────────
  const userIds = Array.from(new Set(stores.map(s => s.user_id).filter(Boolean)))

  const usersMap: Record<string, UserRaw> = {}
  if (userIds.length > 0) {
    const { data: usersRaw, error: userErr } = await supabase
      .from('User')
      .select('id, email, phone, role')
      .in('id', userIds)

    if (userErr) {
      console.error('[AdminVendors] Erreur User:', userErr.message)
    }

    for (const u of (usersRaw as unknown as UserRaw[]) ?? []) {
      usersMap[u.id] = u
    }
  }

  // ── ÉTAPE 3 : Fusion Store + User → VendorRow ──────────────────────────────
  const vendorList: VendorRow[] = stores.map(store => ({
    ...store,
    User: usersMap[store.user_id] ?? null,
  }))

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── EN-TÊTE ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Gestion des Vendeurs</h1>
          <p className="text-gray-400 text-sm mt-1">
            {count ?? 0} boutique{(count ?? 0) > 1 ? 's' : ''} enregistrée{(count ?? 0) > 1 ? 's' : ''} sur la plateforme
          </p>
        </div>
      </header>

      {/* ── BARRE FILTRES — Fond blanc, bordure grise ── */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Champ de recherche */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form method="GET">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Rechercher une boutique..."
              className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm
                focus:border-[#0F7A60] focus:ring-2 focus:ring-[#0F7A60]/10 outline-none transition-all"
            />
            {/* Conserver les filtres actifs lors de la recherche */}
            <input type="hidden" name="kyc" value={kycFilter} />
            <input type="hidden" name="status" value={statusFilter} />
          </form>
        </div>

        {/* Filtres KYC et Statut (composant Client) */}
        <VendeursFiltres
          kycFilter={kycFilter}
          statusFilter={statusFilter}
          query={query}
        />
      </div>

      {/* ── TABLEAU VENDEURS — Fond blanc, bordures grises ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* Header émeraude subtil */}
            <thead className="bg-[#0F7A60]/5 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Boutique</th>
                <th className="px-6 py-4">Propriétaire</th>
                <th className="px-6 py-4">Inscription</th>
                <th className="px-6 py-4">KYC</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendorList.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-[#FAFAF7] transition-colors">
                  {/* Nom boutique + avatar initial */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0F7A60]/10 flex items-center justify-center text-[#0F7A60] font-bold text-sm flex-shrink-0">
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#1A1A1A]">{vendor.name}</p>
                        {vendor.slug && (
                          <p className="text-[10px] text-gray-400 font-mono">/{vendor.slug}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email + ID propriétaire */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {vendor.User?.email ?? 'N/A'}
                      </span>
                      {vendor.User?.phone && (
                        <span className="text-[10px] text-gray-400">{vendor.User.phone}</span>
                      )}
                    </div>
                  </td>

                  {/* Date d'inscription */}
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {format(new Date(vendor.created_at), 'dd MMM yyyy', { locale: fr })}
                  </td>

                  {/* Badge KYC */}
                  <td className="px-6 py-4">
                    <KYCBadge status={vendor.kyc_status} />
                  </td>

                  {/* Badge Statut actif/suspendu */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      vendor.is_active
                        ? 'bg-[#0F7A60]/10 text-[#0F7A60]'
                        : 'bg-red-50 text-red-500'
                    }`}>
                      {vendor.is_active ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>

                  {/* Bouton Détails */}
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/vendeurs/${vendor.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F7A60]/10 hover:bg-[#0F7A60] text-[#0F7A60] hover:text-white transition-all rounded-lg text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── État vide ── */}
          {vendorList.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-base font-semibold text-gray-500">Aucun vendeur trouvé</p>
              <p className="text-sm mt-1">
                {query ? `Aucun résultat pour "${query}"` : 'Aucune boutique enregistrée pour l\'instant.'}
              </p>
            </div>
          )}
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link
                key={i}
                href={`/admin/vendeurs?page=${i + 1}&q=${query}&kyc=${kycFilter}&status=${statusFilter}`}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-[#0F7A60] text-white shadow-sm'
                    : 'bg-[#FAFAF7] border border-gray-200 text-gray-500 hover:border-[#0F7A60] hover:text-[#0F7A60]'
                }`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
