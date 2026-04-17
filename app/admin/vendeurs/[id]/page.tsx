// ─── app/admin/vendeurs/[id]/page.tsx ────────────────────────────────────────
// Server Component — Fiche détail vendeur (admin)
// Auth : super_admin, gestionnaire, support

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import VendorActions from './VendorActions'
import AdminVendorEdit from '@/components/admin/AdminVendorEdit'
import VendorAuditLogs from '@/components/admin/VendorAuditLogs'
import WalletActions from './WalletActions'
import RefundButton from './RefundButton'

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
  total:        number
  vendor_amount:number
  delivery_fee: number
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
  const [walletRes, ordersRes, userRes, logsRes] = await Promise.all([
    supabaseAdmin
      .from('Wallet')
      .select('balance, pending, total_earned')
      .eq('vendor_id', storeId)
      .single(),

    supabaseAdmin
      .from('Order')
      .select('id, total, vendor_amount, delivery_fee, status, created_at')
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false }),

    supabaseAdmin
      .from('User')
      .select('id, name, email, phone, role, avatar_url, created_at')
      .eq('id', store.user_id)
      .single(),
      
    supabaseAdmin
      .from('AdminLog')
      .select('id, action, created_at, details, admin:admin_id ( email, role )')
      .eq('target_type', 'vendor')
      .eq('target_id', storeId)
      .order('created_at', { ascending: false }),
  ])

  const wallet  = walletRes.data  as WalletRow | null
  const orders  = (ordersRes.data ?? []) as OrderRow[]
  const vendor  = userRes.data    as UserRow | null
  
  interface RawLogRow {
    id: string
    action: string
    created_at: string
    details: { reason?: string } | Record<string, unknown> | null
    admin: { email: string; role: string } | { email: string; role: string }[] | null
  }

  const rawLogs = (logsRes.data ?? []) as RawLogRow[]
  const auditLogs = rawLogs.map(log => ({
    ...log,
    admin: Array.isArray(log.admin) ? log.admin[0] : log.admin
  }))

  // 5. Stats 30 jours
  const totalOrders  = orders.length
  const totalRevenue = orders
    .filter(o => ['paid', 'completed', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.vendor_amount ?? 0), 0)

  const kycBadge = KYC_BADGE[store.kyc_status ?? 'pending'] ?? KYC_BADGE['pending']

  const pixelsCount = [store.meta_pixel_id, store.tiktok_pixel_id, store.google_tag_id]
    .filter(Boolean).length

  return (
    <div className="flex-1 w-full bg-[#FAFAF7] min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* ── COVER BANNER (Full Bleed) ── */}
      <div className="w-full bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] pt-8 pb-28 px-6 lg:px-10 relative overflow-hidden shrink-0">
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-900/30 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 relative z-10 mb-8">
          <Link
            href="/admin/vendeurs"
            className="text-sm text-emerald-100 hover:text-white transition-colors font-medium flex items-center gap-2"
          >
            <span className="text-lg leading-none">←</span> Retour vendeurs
          </Link>
          <span className="text-emerald-400">/</span>
          <span className="text-sm text-white font-bold truncate max-w-xs">{store.name}</span>
        </div>

        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar / Logo massif */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xl backdrop-blur-md ring-4 ring-white/10">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl md:text-4xl font-black text-white">{store.name[0]}</span>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{store.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 opacity-80">
                <span className="text-emerald-50 text-xs md:text-sm font-mono">/{store.slug}</span>
                <span className="text-emerald-200 text-xs">•</span>
                <span className="text-emerald-50 text-xs">Créé le {formatDate(store.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${store.is_active ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {store.is_active ? '🟢 BOUTIQUE ACTIVE' : '🔴 SUSPENDUE'}
            </span>
            <span className="px-4 py-1.5 rounded-xl text-xs font-black bg-white/10 text-white backdrop-blur-sm border border-white/20 shadow-sm">
              KYC : {kycBadge.label}
            </span>
            <a
              href={`/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-xl text-xs font-black bg-white text-[#0F7A60] hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Voir la boutique ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (Overlapping) ── */}
      <div className="w-full px-6 lg:px-10 -mt-14 relative z-20 pb-20">
        
        {/* ── Stats 30 jours (Top Row) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Commandes 30j</p>
            <p className="text-2xl lg:text-3xl font-black text-[#1A1A1A]">{totalOrders}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F7A60]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">CA Vendeur 30j</p>
            <p className="text-2xl lg:text-3xl font-black text-[#0F7A60]">{formatAmount(totalRevenue)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Solde Wallet Actuel</p>
            <p className="text-2xl lg:text-3xl font-black text-[#C9A84C]">{formatAmount(Number(wallet?.balance ?? 0))}</p>
          </div>
        </div>

        {/* ── Layout Split (Left: Main Data, Right: Info/Sidebar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Column (Wallet & Orders) */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Wallet Detailed Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">💰 Wallet & Finances</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#FAFAF7] rounded-2xl p-5 text-center border justify-center flex flex-col border-emerald-100/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
                  <p className="text-xs text-emerald-600 font-black uppercase tracking-wider mb-1">Solde Disponible</p>
                  <p className="text-xl lg:text-2xl font-black text-[#0F7A60]">{formatAmount(Number(wallet?.balance ?? 0))}</p>
                </div>
                <div className="bg-[#FAFAF7] border border-amber-100/50 rounded-2xl p-5 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
                  <p className="text-xs text-amber-600 font-black uppercase tracking-wider mb-1">En attente (Sésquestre)</p>
                  <p className="text-xl lg:text-2xl font-black text-amber-700">{formatAmount(Number(wallet?.pending ?? 0))}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
                  <p className="text-xs text-gray-500 font-black uppercase tracking-wider mb-1">Total Généré Historique</p>
                  <p className="text-xl lg:text-2xl font-black text-gray-800">{formatAmount(Number(wallet?.total_earned ?? 0))}</p>
                </div>
              </div>

              {store.withdrawal_number && (
                <div className="bg-[#FAFAF7] rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-xl border border-gray-100 text-[#1A1A1A]">
                    {store.withdrawal_method && METHOD_LABELS[store.withdrawal_method] ? METHOD_LABELS[store.withdrawal_method].split(' ')[0] : '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-0.5">Méthode de retrait favorite</p>
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      {store.withdrawal_method ? (METHOD_LABELS[store.withdrawal_method] ?? store.withdrawal_method) : 'Non définie'} • <span className="font-mono text-gray-500">{store.withdrawal_number}</span>
                    </p>
                    {store.withdrawal_name && (
                      <p className="text-xs text-gray-400 mt-0.5">Titulaire : {store.withdrawal_name}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Wallet Admin */}
              <WalletActions storeId={store.id} currentBalance={Number(wallet?.balance ?? 0)} />
            </div>

            {/* Commandes récentes */}
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 lg:px-8 py-5 border-b border-gray-50 bg-[#FAFAF7]/50 flex justify-between items-center">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">📦 Dernières Commandes (30j)</h2>
                {orders.length > 8 && (
                   <Link href={`/admin/orders?store=${store.id}`} className="text-xs font-bold text-[#0F7A60] hover:underline uppercase tracking-wide">Voir tout</Link>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {orders.length > 0 ? orders.slice(0, 10).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex justify-between items-center px-6 lg:px-8 py-3.5 hover:bg-[#FAFAF7] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#0F7A60] group-hover:border-[#0F7A60]/20 group-hover:bg-[#0F7A60]/5 transition-colors">
                          <span className="text-xs font-black">#</span>
                       </div>
                       <div>
                         <p className="text-xs font-mono font-bold text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors">{order.id.slice(-8).toUpperCase()}</p>
                         <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                         order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                         order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                         order.status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                         order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                         'bg-gray-100 text-gray-600'
                       }`}>
                         {order.status === 'refunded' ? 'Remboursé' : order.status}
                       </span>
                       <span className="text-sm font-black text-[#1A1A1A] w-24 text-right">
                         {formatAmount(Number(order.vendor_amount))}
                       </span>
                       {['paid', 'completed', 'delivered'].includes(order.status) && (
                         <RefundButton 
                           storeId={store.id}
                           orderId={order.id}
                           totalAmount={Number(order.total)}
                           deliveryFee={Number(order.delivery_fee || 0)}
                         />
                       )}
                    </div>
                  </Link>
                )) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm font-bold text-gray-400">Aucune commande sur les 30 derniers jours.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Secondary Column (Infos & Admin Actions) */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Infos Vendeur & Boutique */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm space-y-8">
              {/* Vendeur */}
              <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">👤 Profil Vendeur</h2>
                {vendor ? (
                  <div className="space-y-3">
                    <Row label="Nom complet" value={vendor.name} />
                    <Row label="Email" value={<a href={`mailto:${vendor.email}`} className="text-[#0F7A60] hover:underline font-bold">{vendor.email}</a>} />
                    <Row label="Téléphone" value={vendor.phone ? <a href={`tel:${vendor.phone}`} className="hover:underline">{vendor.phone}</a> : 'Non renseigné'} />
                    <Row label="Rôle" value={<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs uppercase tracking-wider font-black">{vendor.role}</span>} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Compte utilisateur supprimé ou introuvable.</p>
                )}
              </div>

              <div className="h-px w-full bg-gray-100"></div>

              {/* Boutique */}
              <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">🏪 Données Boutique</h2>
                <div className="space-y-3">
                  <Row label="WhatsApp" value={store.whatsapp ? <a href={`https://wa.me/${store.whatsapp.replace(/\+/g,'')}`} target="_blank" rel="noreferrer" className="text-[#0F7A60] hover:underline">{store.whatsapp}</a> : 'Non renseigné'} />
                  <Row label="Onboarding" value={store.onboarding_completed ? '✅ Complété' : '⏳ Incomplet'} />
                  <Row
                    label="Pixels de Tracking"
                    value={pixelsCount > 0
                      ? <span className="text-emerald-600 font-bold">{pixelsCount} actif{pixelsCount > 1 ? 's' : ''}</span>
                      : 'Aucun'
                    }
                  />
                  {store.description && (
                    <div className="pt-2">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Description (Bio)</p>
                      <p className="text-xs text-gray-600 leading-relaxed bg-[#FAFAF7] p-3 rounded-xl border border-gray-100">
                        {store.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conformité KYC */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">🛡️ Conformité KYC</h2>
                <span className={`px-2 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${kycBadge.cls}`}>
                  {kycBadge.label}
                </span>
              </div>

              {store.kyc_document_type && (
                <div className="mb-5 bg-[#FAFAF7] p-3 rounded-xl border border-gray-100">
                  <Row
                    label="Document soumis"
                    value={<span className="font-bold text-[#1A1A1A]">{store.kyc_document_type.replace('cni', 'CNI').replace('passport', 'Passeport').replace('permis', 'Permis de conduire')}</span>}
                  />
                </div>
              )}

              {/* Actions KYC */}
              <div className="space-y-3">
                {store.kyc_status === 'submitted' && (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-600 font-bold flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">⏳</span>
                      Dossier KYC en attente d'audit.
                    </p>
                    <Link href="/admin/kyc?status=submitted" className="inline-flex items-center gap-2 bg-[#0F7A60] text-white hover:bg-emerald-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">
                      Ouvrir le Hub KYC ↗
                    </Link>
                  </div>
                )}
                {store.kyc_status === 'verified' && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✅</span>
                    Identité vérifiée, retraits débloqués.
                  </p>
                )}
                {(store.kyc_status === null || store.kyc_status === 'pending') && (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">⏳</span>
                    Le vendeur n'a pas encore soumis son dossier.
                  </p>
                )}
                {store.kyc_status === 'rejected' && (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">❌</span>
                    Dossier rejeté. En attente de révision.
                  </p>
                )}
              </div>
            </div>

            {/* Actions Super Admin */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
               <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5 relative z-10">⚡ Actions Super Admin</h2>
               <div className="space-y-4 relative z-10 flex flex-col">
                  {/* Édition Administrative avancée (Modal Client) */}
                  <AdminVendorEdit 
                    storeId={store.id} 
                    userId={vendor?.id || store.user_id} 
                    initialData={{
                      name: vendor?.name || '',
                      email: vendor?.email || '',
                      phone: vendor?.phone || null,
                      role: vendor?.role || 'vendeur',
                      store_name: store.name,
                      slug: store.slug,
                      description: store.description,
                      whatsapp: store.whatsapp,
                      onboarding_completed: store.onboarding_completed,
                      kyc_status: store.kyc_status
                    }}
                  />
                  
                  {/* Boutons d'actions rapides (KYC & Suspendre) */}
                  <VendorActions
                    vendorId={store.id}
                    kycStatus={store.kyc_status}
                    isActive={store.is_active}
                  />
               </div>
            </div>

            {/* Audit Logs (Historique) */}
            <VendorAuditLogs logs={auditLogs} />
          </div>
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
      <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex-shrink-0">
        {label}
      </p>
      <p className={`text-xs text-right text-[#1A1A1A] font-medium truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  )
}
