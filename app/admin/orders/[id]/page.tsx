// ─── app/admin/orders/[id]/page.tsx ──────────────────────────────────────────
// Server Component — Page détail commande admin
// Auth : super_admin, gestionnaire, support

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OrderStatusUpdater from './OrderStatusUpdater'
import OrderAuditLogs from '@/components/admin/OrderAuditLogs'
import OrderBuyerEditableCard from '@/components/admin/OrderBuyerEditableCard'
import { ArrowLeft, Package, CreditCard, Activity, Receipt, Truck, Store as StoreIcon } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderRow {
  id:                string
  created_at:        string
  status:            string
  total:             number
  vendor_amount:     number
  platform_fee:      number
  payment_method:    string | null
  buyer_name:        string
  buyer_email:       string | null
  buyer_phone:       string | null
  store_id:          string
  product_id:        string
  quantity:          number
  delivery_address:  string | null
  delivery_fee:      number
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
  pending:         'bg-amber-50 text-amber-600 border border-amber-200',
  pending_payment: 'bg-amber-50 text-amber-600 border border-amber-200',
  paid:            'bg-blue-50 text-blue-600 border border-blue-200',
  processing:      'bg-purple-50 text-purple-600 border border-purple-200',
  shipped:         'bg-indigo-50 text-indigo-600 border border-indigo-200',
  delivered:       'bg-teal-50 text-teal-600 border border-teal-200',
  completed:       'bg-[#0F7A60]/10 text-[#0F7A60] border border-[#0F7A60]/20',
  cancelled:       'bg-red-50 text-red-600 border border-red-200',
  refunded:        'bg-orange-50 text-orange-600 border border-orange-200',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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
      id, created_at, status, total, vendor_amount,
      platform_fee, payment_method, buyer_name, buyer_email,
      buyer_phone, store_id, product_id, quantity, delivery_address, delivery_fee
    `)
    .eq('id', id)
    .single()

  if (error || !order) {
    console.error("[Admin Order Detail Error - Supabase]:", error)
    notFound()
  }

  const orderData = order as any // Cast safely to our knowledge
  
  // Charger le Store
  let store = null
  if (orderData.store_id) {
    const { data: storeData } = await supabaseAdmin
      .from('Store')
      .select('id, name, slug, user_id')
      .eq('id', orderData.store_id)
      .single()
    store = storeData
  }

  // Charger le Product
  let product = null
  if (orderData.product_id) {
    const { data: productData } = await supabaseAdmin
      .from('Product')
      .select('id, name, type')
      .eq('id', orderData.product_id)
      .single()
    product = productData
  }

  const statusLabel = STATUS_LABELS[orderData.status] ?? orderData.status
  const statusColor = STATUS_COLORS[orderData.status]  ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  const paymentLabel = PAYMENT_LABELS[orderData.payment_method ?? ''] ?? orderData.payment_method ?? '—'

  // Actions sur cette commande (Gouvernance)
  const { data: rawLogs } = await supabaseAdmin
    .from('AdminLog')
    .select(`
      id, action, created_at, details, target_type, target_id,
      admin:admin_id ( email, role )
    `)
    .eq('target_type', 'ORDER')
    .eq('target_id', id)
    .order('created_at', { ascending: false })

  const rawLogsArray = rawLogs || []
  const auditLogs = rawLogsArray.map((log: any) => ({
    ...log,
    admin: Array.isArray(log.admin) ? log.admin[0] : log.admin
  }))

  const shortId = orderData.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24 font-sans">
      
      {/* ── EN-TÊTE FULL BLEED IMMERSIF ── */}
      <div className="relative bg-gradient-to-br from-[#012928] via-[#0A4138] to-[#04332A] pt-12 pb-36 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden">
        {/* Motif Glassmorphism de fond */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        {/* Glow Effects */}
        <div className="absolute top-0 right-10 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -z-0 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px] -z-0 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col pt-4">
          <div className="mb-8">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-all backdrop-blur-md"
            >
              <ArrowLeft className="w-4 h-4" /> Retour aux commandes
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Icône principale */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                <Receipt className="w-10 h-10 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    Commande #{shortId}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-emerald-100/60 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50"></span>
                  Créée le {formatDate(orderData.created_at)}
                </p>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex items-center gap-8">
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Paiement via</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{paymentLabel}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Montant Total</p>
                <p className="text-lg font-black text-white">{formatAmount(Number(orderData.total))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ZONE DE CONTENU PRINCIPALE (GridLayout) ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
          
          {/* ───────────────────────────────────────────────────────── */}
          {/* COLONNE GAUCHE : DÉTAILS DE LA COMMANDE ET DU CLIENT (2/3) */}
          {/* ───────────────────────────────────────────────────────── */}
          <div className="flex-1 w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            
            {/* 1. Carte Produits commandés */}
            <section className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <Package className="w-5 h-5 text-gray-500" />
                </div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">Articles de la commande</h2>
              </div>
              
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                {product ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail Placeholder */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        <Package className="w-6 h-6 text-emerald-400/50" />
                        <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-[#1A1A1A] leading-tight mb-1">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-gray-200/50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                            {product.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-gray-100 pt-3 sm:pt-0 mt-3 sm:mt-0">
                      <p className="text-sm font-bold text-gray-400">Qté : <span className="text-gray-900">{orderData.quantity || 1}</span></p>
                      <p className="text-lg font-black text-[#0F7A60]">
                        {formatAmount(Number(orderData.total))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm font-bold text-gray-400">Détails de l'article introuvables</p>
                  </div>
                )}
              </div>

              {/* Ligne Frais de livraison optionnelle */}
              {orderData.delivery_fee > 0 && (
                 <div className="flex justify-between items-center px-4 py-3 mt-4 border-t border-dashed border-gray-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                       <Truck className="w-4 h-4 text-gray-400" /> Frais de livraison
                    </div>
                    <p className="text-sm font-black text-gray-900">{formatAmount(Number(orderData.delivery_fee))}</p>
                 </div>
              )}
            </section>

            {/* 2. Sections Client & Livraison Éditables (Server -> Client Component) */}
            <OrderBuyerEditableCard
              orderId={orderData.id}
              buyerName={orderData.buyer_name}
              buyerEmail={orderData.buyer_email}
              buyerPhone={orderData.buyer_phone}
              deliveryAddress={orderData.delivery_address}
            />



            {/* 4. Historique (Logs d'Audit) - Intégré nativement en bas */}
            <section className="pt-6">
              <div className="flex items-center gap-3 mb-6 px-2">
                <Activity className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-black text-gray-500 tracking-widest uppercase">Historique d'activité</h2>
              </div>
              <OrderAuditLogs logs={auditLogs} />
            </section>

          </div>


          {/* ───────────────────────────────────────────────────────── */}
          {/* COLONNE DROITE : ACTIONS ET RÉSUMÉ FINANCIER (1/3) */}
          {/* ───────────────────────────────────────────────────────── */}
          <div className="w-full xl:w-[380px] flex-shrink-0 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 delay-200">
            
            {/* Carte Actions (Changement Statut) - HIGHLIGHT */}
            <section className="bg-white/95 backdrop-blur-xl border-2 border-[#0F7A60]/20 rounded-3xl p-6 shadow-[0_15px_40px_rgba(15,122,96,0.08)] relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0F7A60] to-teal-400"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F7A60]/5 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
              
              <h2 className="text-[11px] font-black text-[#0F7A60] uppercase tracking-widest mb-5">
                Actions Rapides
              </h2>
              {/* Le composant client gère l'UI du changement de statut */}
              <OrderStatusUpdater
                orderId={orderData.id}
                currentStatus={orderData.status}
              />
            </section>

            {/* Carte Finances Breakdown */}
            <section className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Résumé Financier</h2>
              
              <div className="space-y-4">
                {/* Total payé */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-500">Total payé</span>
                  <span className="text-lg font-black text-gray-900">{formatAmount(Number(orderData.total))}</span>
                </div>
                
                {/* Net Vendeur */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-600/80">Revenu Vendeur</span>
                  <span className="text-base font-black text-emerald-600">{formatAmount(Number(orderData.vendor_amount ?? 0))}</span>
                </div>
                
                {/* Commission PDV */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-500/80">Frais Plateforme</span>
                  <span className="text-sm font-black text-red-500">{formatAmount(Number(orderData.platform_fee ?? 0))}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-gray-200 bg-gray-50/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-3xl">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Méthode</span>
                  <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">{paymentLabel}</span>
                </div>
              </div>
            </section>

            {/* Carte Boutique Vendeur */}
            {store && (
              <section className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
                      <StoreIcon className="w-4 h-4 text-purple-500" />
                    </div>
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Boutique</h2>
                  </div>
                  
                  <p className="text-base font-black text-[#1A1A1A] truncate">{store.name}</p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">/{store.slug}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-50 rounded-[28px]">
                  <Link
                    href={`/admin/vendeurs/${store.id}`}
                    className="flex justify-center items-center py-2.5 rounded-2xl text-[11px] font-black text-[#0F7A60] hover:bg-emerald-50 transition-colors"
                  >
                    Profil Vendeur
                  </Link>
                  <a
                    href={`/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center py-2.5 rounded-2xl text-[11px] font-black text-gray-500 hover:bg-white hover:shadow-sm border border-transparent transition-all"
                  >
                    Voir vitrine ↗
                  </a>
                </div>
              </section>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
