import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderActions } from './OrderActions'
import CallButton from '@/components/orders/CallButton'
import { BuyerScoreBadge } from '@/components/orders/BuyerScoreBadge'
import { MessageCircle, Phone, MapPin, Receipt, Clock, ArrowLeft, Check, X } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:         { label: 'En attente',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  pending_payment: { label: 'Paiement en attente', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  confirmed:       { label: 'Confirmée',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing:      { label: 'En préparation', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  shipped:         { label: 'Expédiée',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  delivered:       { label: 'Livrée',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  completed:       { label: 'Terminée',      color: 'bg-emerald-200 text-emerald-800 border-emerald-300' },
  cancelled:       { label: 'Annulée',       color: 'bg-red-100 text-red-700 border-red-200' },
  cod_pending:     { label: 'COD en attente', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  cod_confirmed:   { label: 'COD confirmée', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  no_answer:       { label: 'Pas de réponse', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  paid:            { label: 'Payée',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

interface OrderDetailPageProps {
  params: { id: string }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  const { data: order } = await supabase
    .from('Order')
    .select(`
      id, buyer_name, buyer_phone, delivery_address,
      quantity, subtotal, platform_fee, vendor_amount, total,
      status, payment_method, payment_ref, created_at,
      product:Product!Order_product_id_fkey(id, name, images, type, price),
      bump_product:Product!Order_bump_product_id_fkey(id, name, images, type, price),
      variant:ProductVariant(value_1, value_2, dimension_1, dimension_2),
      invoices:Invoice(pdf_url)
    `)
    .eq('id', params.id)
    .eq('store_id', store.id)
    .single()

  if (!order) notFound()

  const product = (Array.isArray(order.product) ? order.product[0] : order.product) as {
    id: string; name: string; images: string[]; type: string; price: number
  } | null
  const bump_product = (Array.isArray(order.bump_product) ? order.bump_product[0] : order.bump_product) as {
    id: string; name: string; images: string[]; type: string; price: number
  } | null
  const variant = (Array.isArray(order.variant) ? order.variant[0] : order.variant) as {
    value_1: string | null; value_2: string | null
    dimension_1: string | null; dimension_2: string | null
  } | null

  const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
  const isCod  = order.payment_method === 'cod'

  // Transitions de statut possibles
  const nextStatuses: Record<string, string[]> = {
    pending:         ['confirmed', 'cancelled'],
    confirmed:       ['shipped', 'cancelled'],
    shipped:         ['delivered', 'cancelled'],
    delivered:       isCod ? ['cod_confirmed'] : ['completed'],
    cod_confirmed:   ['completed'],
    pending_payment: ['confirmed', 'cancelled'],
  }
  const availableTransitions = nextStatuses[order.status] ?? []

  return (
    <main className="min-h-screen bg-[#FAFAF7] pb-24">
      {/* Header Mobile & Desktop */}
      <header className="bg-white border-b border-line px-6 py-5 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/orders" className="p-2 -ml-2 text-slate hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-display font-black text-ink truncate">
              Commande <span className="text-slate">#{order.id.split('-')[0].toUpperCase()}</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={12} className="text-slate" />
              <p className="text-xs md:text-xs font-bold text-slate uppercase tracking-wider">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <span className={`text-xs md:text-xs font-black uppercase px-3 py-1.5 rounded-full border ${status.color} shadow-sm`}>
            {status.label}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Produit */}
            <section className="bg-white rounded-3xl shadow-sm border border-line p-6 space-y-4">
               <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-cream flex-shrink-0 overflow-hidden border border-line">
                  {product?.images?.[0] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product!.images[0]} alt={product?.name || "Image du produit"} className="w-full h-full object-cover" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 justify-center flex flex-col">
                  <p className="font-black text-ink text-lg line-clamp-1">{product?.name ?? '—'}</p>
                  {variant && (
                    <p className="text-xs font-bold text-slate mt-0.5 uppercase tracking-wide">
                      {variant.value_1}{variant.value_2 ? ` / ${variant.value_2}` : ''}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald/5 text-emerald text-xs font-black border border-emerald/10 uppercase">
                      Qté: {order.quantity}
                    </span>
                    <span className="text-sm font-black text-ink">
                      {(order.subtotal / order.quantity).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              </div>
              {bump_product && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-line">
                  <div className="w-16 h-16 rounded-2xl bg-cream flex-shrink-0 overflow-hidden border border-line">
                    {bump_product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bump_product.images[0]} alt={bump_product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">🎁</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 justify-center flex flex-col">
                    <p className="text-xs font-black uppercase text-emerald mb-0.5 tracking-wider">Order Bump</p>
                    <p className="font-bold text-ink text-sm line-clamp-1">{bump_product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-ink">
                        {bump_product.price.toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Acheteur */}
            <section className="bg-white rounded-3xl shadow-sm border border-line p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <div className="p-2 bg-emerald/10 rounded-xl text-emerald">
                  <MessageCircle size={18} fill="currentColor" />
                </div>
                <h2 className="font-display font-black text-ink uppercase tracking-tight">Client & Livraison</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-slate uppercase tracking-wider mb-1">Nom complet</p>
                    <p className="font-bold text-ink">{order.buyer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate uppercase tracking-wider mb-1">Téléphone</p>
                    <div className="flex items-center gap-2">
                      <a suppressHydrationWarning href={`tel:${order.buyer_phone}`} aria-label="Appeler le client" title="Appeler le client" className="p-2 bg-cream rounded-lg text-ink hover:text-emerald transition-colors">
                        <Phone size={14} />
                      </a>
                      <p className="font-bold text-ink">{order.buyer_phone}</p>
                    </div>
                    {/* Bouton Click-to-Call — affiché uniquement pour les commandes COD actives */}
                    {order.payment_method === 'cod' &&
                     ['pending', 'confirmed'].includes(order.status) &&
                     order.buyer_phone && (
                      <div className="mt-2">
                        <CallButton
                          phone={order.buyer_phone}
                          buyerName={order.buyer_name ?? undefined}
                          orderId={order.id}
                          variant="both"
                        />
                      </div>
                    )}

                    {/* Anti-Fraude : Score Acheteur */}
                    <BuyerScoreBadge phone={order.buyer_phone} storeId={store.id} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-slate uppercase tracking-wider mb-1">Adresse de livraison</p>
                  <div className="flex gap-2">
                    <div className="p-2 bg-cream rounded-lg text-slate h-fit">
                      <MapPin size={14} />
                    </div>
                    <p className="text-sm font-bold text-ink leading-relaxed">
                      {order.delivery_address || 'Aucune adresse renseignée'}
                    </p>
                  </div>
                </div>
              </div>

              <a
                suppressHydrationWarning
                href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}?text=Bonjour ${order.buyer_name.split(' ')[0]}, je vous contacte au sujet de votre commande sur Yayyam.`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1EBE59] text-white font-black py-4 rounded-2xl transition shadow-lg shadow-green-200"
              >
                <MessageCircle size={20} fill="currentColor" />
                Démarrer une discussion
              </a>
            </section>
          </div>

          <div className="space-y-6">
            {/* Paiement & Détails financiers */}
            <section className="bg-white rounded-3xl shadow-sm border border-line p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <div className="p-2 bg-emerald/10 rounded-xl text-emerald">
                  <Receipt size={18} />
                </div>
                <h2 className="font-display font-black text-ink uppercase tracking-tight">Règlement</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate font-bold uppercase text-xs">Méthode</span>
                  <span className="font-black text-ink bg-cream px-2 py-1 rounded-lg uppercase text-xs">
                    {isCod ? 'Cash on Delivery' : order.payment_method}
                  </span>
                </div>
                {order.payment_ref && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate font-bold uppercase text-xs">Référence</span>
                    <span className="font-mono text-xs text-slate truncate max-w-[120px]">{order.payment_ref}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-dashed border-line space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate">Total payé par client</span>
                  <span className="text-ink">{order.total.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate">Commission Yayyam</span>
                  <span className="text-red-500">− {order.platform_fee.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="p-4 bg-emerald/5 rounded-2xl border border-emerald/10 mt-2">
                  <p className="text-xs font-black text-emerald uppercase tracking-widest mb-1">Net pour vous</p>
                  <p className="text-2xl font-black text-emerald">
                    {order.vendor_amount.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Actions */}
            <OrderActions
              orderId={order.id}
              currentStatus={order.status}
              availableTransitions={availableTransitions}
              isCod={isCod}
              invoiceUrl={(order.invoices as { pdf_url: string }[] | null)?.[0]?.pdf_url}
            />

            {/* Status informatifs */}
            {order.status === 'completed' && (
              <div className="bg-emerald text-white rounded-3xl p-6 text-center shadow-lg shadow-emerald/20">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Check size={24} />
                </div>
                <p className="font-black uppercase tracking-tight">Commande archivée</p>
                <p className="text-xs font-bold text-white/80 mt-1">Transaction entièrement traitée.</p>
              </div>
            )}
            {order.status === 'cancelled' && (
              <div className="bg-red-500 text-white rounded-3xl p-6 text-center shadow-lg shadow-red-200">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <X size={24} />
                </div>
                <p className="font-black uppercase tracking-tight">Commande annulée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
