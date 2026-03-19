// ─── app/admin/vendeurs/[id]/page.tsx ────────────────────────────────────────
// Server Component — Fiche détail vendeur (admin)
// Auth : super_admin, gestionnaire, support

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import KYCAdminActions from '@/app/admin/kyc/KYCAdminActions'
import VendorActions from './VendorActions'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoreRow {
  id:                    string
  name:                  string
  slug:                  string
  description:           string | null
  logo_url:              string | null
  is_active:             boolean
  kyc_status:            string | null
  kyc_document_type:     string | null
  kyc_documents:         unknown
  withdrawal_method:     string | null
  withdrawal_number:     string | null
  withdrawal_name:       string | null
  onboarding_completed:  boolean
  created_at:            string
  meta_pixel_id:         string | null
  tiktok_pixel_id:       string | null
  google_tag_id:         string | null
  telegram_notifications: unknown
  whatsapp:              string | null
  user_id:               string
}

interface WalletRow {
  balance:      number
  pending:      number
  total_earned: number
}

interface OrderRow {
  id:           string
  total_amount: number
  vendor_amount:number
  status:       string
  created_at:   string
}

interface UserRow {
  id:         string
  name:       string
  email:      string
  phone:      string | null
  role:       string
  avatar_url: string | null
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  verified:  { label: 'Vérifié ✅',      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  submitted: { label: 'En attente ⏳',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  pending:   { label: 'Non soumis',       cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  rejected:  { label: 'Rejeté ❌',        cls: 'bg-red-100 text-red-700 border-red-200' },
}

const METHOD_LABELS: Record<string, string> = {
  wave:         '🌊 Wave',
  orange_money: '🟠 Orange Money',
  bank:         '🏦 Virement',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VendeurDetailPage({
  params,
}: {
  params: { id: string }
}) {
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

  const allowedRoles = ['super_admin', 'gestionnaire', 'support']
  if (!adminUser?.role || !allowedRoles.includes(adminUser.role as string)) {
    redirect('/admin')
  }

  const storeId = params.id

  // 2. Charger le store d'abord pour obtenir user_id
  const { data: storeRaw, error: storeErr } = await supabaseAdmin
    .from('Store')
    .select(`
      id, name, slug, description, logo_url, is_active,
      kyc_status, kyc_document_type, kyc_documents,
      withdrawal_method, withdrawal_number, withdrawal_name,
      onboarding_completed, created_at,
      meta_pixel_id, tiktok_pixel_id, google_tag_id,
      telegram_notifications, whatsapp, user_id
    `)
    .eq('id', storeId)
    .single()

  if (storeErr || !storeRaw) notFound()
  const store = storeRaw as StoreRow

  // 3. Calculer la date 30 jours en arrière
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 4. Charger le reste en parallèle
  const [walletRes, ordersRes, userRes] = await Promise.all([
    supabaseAdmin
      .from('Wallet')
      .select('balance, pending, total_earned')
      .eq('vendor_id', storeId)
      .single(),

    supabaseAdmin
      .from('Order')
      .select('id, total_amount, vendor_amount, status, created_at')
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false }),

    supabaseAdmin
      .from('User')
      .select('id, name, email, phone, role, avatar_url, created_at')
      .eq('id', store.user_id)
      .single(),
  ])

  const wallet  = walletRes.data  as WalletRow | null
  const orders  = (ordersRes.data ?? []) as OrderRow[]
  const vendor  = userRes.data    as UserRow | null

  // 5. Stats 30 jours
  const totalOrders  = orders.length
  const totalRevenue = orders
    .filter(o => ['paid', 'completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.vendor_amount ?? 0), 0)

  const kycBadge = KYC_BADGE[store.kyc_status ?? 'pending'] ?? KYC_BADGE['pending']

  const pixelsCount = [store.meta_pixel_id, store.tiktok_pixel_id, store.google_tag_id]
    .filter(Boolean).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/vendeurs"
          className="text-sm text-gray-500 hover:text-[#0F7A60] transition-colors font-medium"
        >
          ← Retour vendeurs
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-[#1A1A1A] font-bold">{store.name}</span>
      </div>

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo ou initiale */}
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{store.name[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black">{store.name}</h1>
              <p className="text-white/60 text-xs font-mono">/{store.slug}</p>
              <p className="text-white/50 text-xs mt-1">
                Créé le {formatDate(store.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${kycBadge.cls}`}>
              KYC : {kycBadge.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-black ${
              store.is_active
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {store.is_active ? '🟢 Boutique active' : '🔴 Boutique suspendue'}
            </span>
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/70 hover:text-white underline transition-colors"
            >
              Voir la boutique ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── Stats 30 jours ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Commandes */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
            Commandes 30j
          </p>
          <p className="text-2xl font-black text-[#1A1A1A]">{totalOrders}</p>
        </div>
        {/* CA vendeur */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
            CA vendeur 30j
          </p>
          <p className="text-lg font-black text-[#0F7A60]">{formatAmount(totalRevenue)}</p>
        </div>
        {/* Solde wallet */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
            Solde wallet
          </p>
          <p className="text-lg font-black text-[#C9A84C]">
            {formatAmount(Number(wallet?.balance ?? 0))}
          </p>
        </div>
      </div>

      {/* ── Grille Infos ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Infos vendeur */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            👤 Infos vendeur
          </h2>
          {vendor ? (
            <div className="space-y-2.5">
              <Row label="Nom"           value={vendor.name} />
              <Row label="Email"         value={<a href={`mailto:${vendor.email}`} className="text-[#0F7A60] hover:underline">{vendor.email}</a>} />
              <Row label="Téléphone"     value={vendor.phone ?? 'Non renseigné'} />
              <Row label="Inscrit le"    value={formatDate(vendor.created_at)} />
              <Row label="Rôle"          value={vendor.role} />
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Utilisateur introuvable</p>
          )}
        </div>

        {/* Infos boutique */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            🏪 Infos boutique
          </h2>
          <div className="space-y-2.5">
            <Row label="Slug"          value={`/${store.slug}`} mono />
            <Row label="WhatsApp"      value={store.whatsapp ?? 'Non configuré'} />
            <Row label="Onboarding"    value={store.onboarding_completed ? '✅ Complété' : '⏳ En cours'} />
            <Row
              label="Pixels tracking"
              value={pixelsCount > 0
                ? `${pixelsCount} configuré${pixelsCount > 1 ? 's' : ''} ✅`
                : '❌ Aucun'
              }
            />
            {store.description && (
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{store.description}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Wallet ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
          💰 Wallet
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-1">Solde</p>
            <p className="text-xl font-black text-[#0F7A60]">{formatAmount(Number(wallet?.balance ?? 0))}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider mb-1">En attente</p>
            <p className="text-xl font-black text-amber-700">{formatAmount(Number(wallet?.pending ?? 0))}</p>
          </div>
          <div className="bg-[#FAFAF7] rounded-xl p-4 text-center">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Total gagné</p>
            <p className="text-xl font-black text-[#C9A84C]">{formatAmount(Number(wallet?.total_earned ?? 0))}</p>
          </div>
        </div>

        {/* Coordonnées de retrait */}
        {store.withdrawal_number && (
          <div className="mt-4 bg-[#FAFAF7] rounded-xl p-3 flex items-center gap-3">
            <span className="text-lg">{store.withdrawal_method ? (METHOD_LABELS[store.withdrawal_method]?.split(' ')[0] ?? '💸') : '💸'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A]">
                {store.withdrawal_method ? (METHOD_LABELS[store.withdrawal_method] ?? store.withdrawal_method) : 'Retrait configuré'}
              </p>
              <p className="text-xs text-gray-500 font-mono truncate">{store.withdrawal_number}</p>
              {store.withdrawal_name && (
                <p className="text-[11px] text-gray-400">Au nom de : {store.withdrawal_name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── KYC ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            🛡️ KYC
          </h2>
          <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${kycBadge.cls}`}>
            {kycBadge.label}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {store.kyc_document_type && (
            <Row
              label="Type de document"
              value={store.kyc_document_type.replace('cni', 'CNI').replace('passport', 'Passeport').replace('permis', 'Permis de conduire')}
            />
          )}
        </div>

        {/* Boutons KYC - seulement si submitted */}
        {store.kyc_status === 'submitted' && (
          <KYCAdminActions storeId={store.id} storeName={store.name} />
        )}
        {store.kyc_status === 'verified' && (
          <p className="text-xs text-emerald-600 font-medium">
            ✅ Identité vérifiée — ce vendeur peut retirer sans limite.
          </p>
        )}
        {(store.kyc_status === null || store.kyc_status === 'pending') && (
          <p className="text-xs text-gray-400 italic">Aucun dossier soumis.</p>
        )}
        {store.kyc_status === 'rejected' && (
          <p className="text-xs text-red-500">❌ Dossier rejeté — le vendeur doit resoumettre.</p>
        )}
      </div>

      {/* ── Commandes récentes ── */}
      {orders.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              📦 Commandes (30 derniers jours)
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 8).map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAF7] transition-colors"
              >
                <span className="text-xs font-mono text-gray-400">#{order.id.slice(-8).toUpperCase()}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {order.status}
                </span>
                <span className="text-sm font-black text-[#1A1A1A]">
                  {formatAmount(Number(order.vendor_amount))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions admin ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
          ⚙️ Actions admin
        </h2>
        <div className="flex flex-wrap gap-3">
          <VendorActions
            vendorId={store.id}
            kycStatus={store.kyc_status}
            isActive={store.is_active}
          />
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            Voir la boutique publique ↗
          </a>
          <Link
            href={`/admin/orders?store=${store.id}`}
            className="px-4 py-2.5 text-sm font-bold text-[#0F7A60] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            Voir toutes les commandes
          </Link>
        </div>
      </div>

    </div>
  )
}

// ─── Sous-composant Row ───────────────────────────────────────────────────────

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex-shrink-0">
        {label}
      </p>
      <p className={`text-xs text-right text-[#1A1A1A] font-medium truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  )
}
