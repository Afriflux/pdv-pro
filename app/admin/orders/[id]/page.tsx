// ─── app/admin/orders/[id]/page.tsx ──────────────────────────────────────────
// Server Component — Page détail commande admin
// Auth : super_admin, gestionnaire, support

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OrderStatusUpdater from './OrderStatusUpdater'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  name?:         string
  product_name?: string
  quantity?:     number
  price?:        number
  unit_price?:   number
}

interface StoreRef {
  id:      string
  name:    string
  slug:    string
  user_id: string
}

interface ProductRef {
  id:   string
  name: string
  type: string
}

interface OrderDetail {
  id:                string
  created_at:        string
  status:            string
  total_amount:      number
  vendor_amount:     number
  commission_amount: number
  payment_method:    string | null
  buyer_name:        string
  buyer_email:       string | null
  buyer_phone:       string | null
  items:             unknown
  metadata:          unknown
  notes:             string | null
  store:             StoreRef | Array<StoreRef> | null
  product:           ProductRef | Array<ProductRef> | null
}

// ─── Constantes statuts ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:         'En attente',
  pending_payment: 'Attente paiement',
  paid:            'Payé',
  processing:      'En traitement',
  shipped:         'Expédié',
  delivered:       'Livré',
  completed:       'Complété',
  cancelled:       'Annulé',
  refunded:        'Remboursé',
}

const STATUS_COLORS: Record<string, string> = {
  pending:         'bg-gray-100 text-gray-600',
  pending_payment: 'bg-amber-100 text-amber-700',
  paid:            'bg-blue-100 text-blue-700',
  processing:      'bg-purple-100 text-purple-700',
  shipped:         'bg-indigo-100 text-indigo-700',
  delivered:       'bg-teal-100 text-teal-700',
  completed:       'bg-emerald-100 text-[#0F7A60]',
  cancelled:       'bg-red-100 text-red-700',
  refunded:        'bg-orange-100 text-orange-700',
}

const PAYMENT_LABELS: Record<string, string> = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  cinetpay:     'CinetPay',
  paytech:      'PayTech',
  wallet:       'Portefeuille',
  bank_transfer:'Virement bancaire',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function parseItems(raw: unknown): OrderItem[] {
  try {
    if (Array.isArray(raw)) return raw as OrderItem[]
    if (typeof raw === 'string') return JSON.parse(raw) as OrderItem[]
  } catch { /* ignore */ }
  return []
}

function getStore(order: OrderDetail): StoreRef | null {
  if (!order.store) return null
  if (Array.isArray(order.store)) return order.store[0] ?? null
  return order.store
}

function getProduct(order: OrderDetail): ProductRef | null {
  if (!order.product) return null
  if (Array.isArray(order.product)) return order.product[0] ?? null
  return order.product
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Auth admin
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

  // Charger la commande
  const { data: order, error } = await supabaseAdmin
    .from('Order')
    .select(`
      id, created_at, status, total_amount, vendor_amount,
      commission_amount, payment_method, buyer_name, buyer_email,
      buyer_phone, items, metadata, notes,
      store:store_id ( id, name, slug, user_id ),
      product:product_id ( id, name, type )
    `)
    .eq('id', params.id)
    .single()

  if (error || !order) notFound()

  const orderData = order as unknown as OrderDetail
  const store     = getStore(orderData)
  const product   = getProduct(orderData)
  const items     = parseItems(orderData.items)
  const statusLabel = STATUS_LABELS[orderData.status] ?? orderData.status
  const statusColor = STATUS_COLORS[orderData.status]  ?? 'bg-gray-100 text-gray-600'
  const paymentLabel = PAYMENT_LABELS[orderData.payment_method ?? ''] ?? orderData.payment_method ?? '—'

  // ID court (#4 derniers chars)
  const shortId = orderData.id.slice(-8).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/orders"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0F7A60] transition-colors font-medium"
        >
          ← Retour aux commandes
        </Link>
        <span className="text-xs text-gray-400 font-mono">Commande #{shortId}</span>
      </div>

      {/* ── Card principale ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header avec gradient */}
        <div className="px-8 py-8 bg-gradient-to-r from-[#0D5C4A] to-[#0F7A60] text-white relative overflow-hidden">
          {/* Effets Glass interne */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Commande PDV Pro</p>
              <h1 className="text-xl font-black">#{shortId}</h1>
              <p className="text-sm text-white/70 mt-1">{formatDate(orderData.created_at)}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                {statusLabel}
              </span>
              <p className="text-white/70 text-xs mt-2">Via : {paymentLabel}</p>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="divide-y divide-white/20">

          {/* ── Produits commandés ── */}
          <div className="px-8 py-6">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              📦 Produits commandés
            </h2>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl px-5 py-4 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        {item.name ?? item.product_name ?? `Produit ${i + 1}`}
                      </p>
                      {item.quantity && (
                        <p className="text-xs text-gray-400">Qté : {item.quantity}</p>
                      )}
                    </div>
                    {(item.price ?? item.unit_price) && (
                      <p className="text-sm font-black text-[#0F7A60]">
                        {formatAmount(Number(item.price ?? item.unit_price))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : product ? (
              <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{product.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{product.type}</p>
                </div>
                <p className="text-sm font-black text-[#0F7A60]">
                  {formatAmount(Number(orderData.total_amount))}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun détail produit disponible.</p>
            )}
          </div>

          {/* ── Finances ── */}
          <div className="px-8 py-6 bg-gradient-to-br from-emerald-50/50 to-transparent">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
              💰 Finances
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total client</p>
                <p className="text-lg font-black text-[#1A1A1A]">
                  {formatAmount(Number(orderData.total_amount))}
                </p>
              </div>
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider mb-1">Commission PDV</p>
                <p className="text-lg font-black text-red-600">
                  {formatAmount(Number(orderData.commission_amount ?? 0))}
                </p>
              </div>
              <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 rounded-2xl p-4 text-center shadow-sm">
                <p className="text-[11px] text-[#0F7A60] font-bold uppercase tracking-wider mb-1">Versé vendeur</p>
                <p className="text-lg font-black text-[#0F7A60]">
                  {formatAmount(Number(orderData.vendor_amount ?? 0))}
                </p>
              </div>
            </div>
          </div>

          {/* ── Acheteur ── */}
          <div className="px-8 py-6">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              👤 Acheteur
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0F7A60]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-[#0F7A60]">
                  {orderData.buyer_name?.[0]?.toUpperCase() ?? 'C'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1A1A1A]">{orderData.buyer_name}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {orderData.buyer_phone && (
                    <a
                      href={`tel:${orderData.buyer_phone}`}
                      className="text-xs text-gray-500 hover:text-[#0F7A60] font-mono"
                    >
                      📞 {orderData.buyer_phone}
                    </a>
                  )}
                  {orderData.buyer_email && (
                    <a
                      href={`mailto:${orderData.buyer_email}`}
                      className="text-xs text-gray-500 hover:text-[#0F7A60]"
                    >
                      ✉️ {orderData.buyer_email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Boutique ── */}
          {store && (
            <div className="px-8 py-6 bg-gradient-to-br from-emerald-50/30 to-transparent">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                🏪 Boutique
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{store.name}</p>
                  <p className="text-xs text-gray-400 font-mono">/{store.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/vendeurs/${store.id}`}
                    className="text-xs font-bold text-[#0F7A60] border border-[#0F7A60]/20 px-3 py-1.5 rounded-lg hover:bg-[#0F7A60]/5 transition-colors"
                  >
                    Voir le vendeur →
                  </Link>
                  <a
                    href={`/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Boutique ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {orderData.notes && (
            <div className="px-8 py-6">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                📝 Notes
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{orderData.notes}</p>
            </div>
          )}

          {/* ── Changer le statut ── */}
          <div className="px-8 py-8 bg-gray-50/50">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
              ⚙️ Changer le statut
            </h2>
            <OrderStatusUpdater
              orderId={orderData.id}
              currentStatus={orderData.status}
            />
          </div>

        </div>
      </div>

    </div>
  )
}
