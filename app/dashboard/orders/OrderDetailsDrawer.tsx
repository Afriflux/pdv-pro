'use client'

import { useEffect } from 'react'
import { X, Clock, MessageCircle, Phone, MapPin, Receipt, Check } from 'lucide-react'
import Image from 'next/image'
import CallButton from '@/components/orders/CallButton'
import { BuyerScoreBadge } from '@/components/orders/BuyerScoreBadge'
import { OrderActions } from './[id]/OrderActions'

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

interface OrderDetailsDrawerProps {
  order: any // Will be the full order object including relationships
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsDrawer({ order, isOpen, onClose }: OrderDetailsDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  if (!isOpen || !order) return null

  const product = order.product
  const variant = order.variant
  const bump_product = order.bump_product

  const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
  const isCod  = order.payment_method === 'cod'

  const nextStatuses: Record<string, string[]> = {
    pending:         ['confirmed', 'cancelled'],
    confirmed:       ['shipped', 'cancelled'],
    shipped:         ['delivered', 'cancelled'],
    delivered:       isCod ? ['cod_confirmed'] : ['completed'],
    cod_confirmed:   ['completed'],
    pending_payment: ['confirmed', 'cancelled'],
  }
  const availableTransitions = nextStatuses[order.status] ?? []
  const waLink = `https://wa.me/${order.buyer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Bonjour ${order.buyer_name.split(' ')[0]}, je vous contacte au sujet de votre commande sur Yayyam.`
   )}`

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FAFAF7] z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <header className="bg-white border-b border-line px-5 py-4 flex flex-col gap-3 sticky top-0 z-10 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-black text-ink">
                Commande <span className="text-slate">#{order.id.split('-')[0].toUpperCase()}</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-dust">
                <Clock size={12} />
                <p className="text-[10px] uppercase font-bold tracking-wider">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="p-2 bg-cream text-slate hover:text-ink hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div>
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${status.color}`}>
              {status.label}
            </span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Produit */}
          <section className="bg-white rounded-2xl shadow-sm border border-line p-5">
            <div className="flex gap-4">
              <div className="relative w-16 h-16 rounded-xl bg-cream flex-shrink-0 overflow-hidden border border-line">
                {product?.images?.[0] ? (
                  <Image src={product.images[0]} alt="Produit" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="font-bold text-ink text-sm line-clamp-2">{product?.name ?? '—'}</p>
                {variant && (
                  <p className="text-[10px] font-bold text-slate mt-0.5 uppercase tracking-wide">
                    {variant.value_1}{variant.value_2 ? ` / ${variant.value_2}` : ''}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded bg-emerald/5 text-emerald text-[10px] font-black border border-emerald/10 uppercase">
                    Qté: {order.quantity}
                  </span>
                  <span className="text-xs font-black text-ink">
                    {((order.subtotal || order.total) / order.quantity).toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>
            </div>
            
            {bump_product && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-line">
                <div className="relative w-12 h-12 rounded-xl bg-cream flex-shrink-0 overflow-hidden border border-line">
                  {bump_product.images?.[0] ? (
                    <Image src={bump_product.images[0]} alt="Bump Produit" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">🎁</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase text-emerald tracking-wider mb-0.5">Order Bump</span>
                  <p className="font-bold text-ink text-xs line-clamp-1">{bump_product.name}</p>
                  <p className="text-xs font-black text-ink mt-0.5">
                    {bump_product.price.toLocaleString('fr-FR')} F
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Client & Livraison */}
          <section className="bg-white rounded-2xl shadow-sm border border-line p-5 space-y-4">
            <h3 className="font-display font-black text-ink uppercase tracking-tight text-sm border-b border-line pb-2 flex items-center gap-2">
              <MapPin size={16} className="text-emerald" /> Client & Livraison
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate uppercase tracking-wider">Nom complet</p>
                <p className="font-bold text-ink text-sm">{order.buyer_name}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate uppercase tracking-wider">Téléphone</p>
                  <p className="font-bold text-ink text-sm">{order.buyer_phone}</p>
                </div>
                <div className="flex gap-2">
                  <a suppressHydrationWarning href={`tel:${order.buyer_phone}`} aria-label="Appeler le client" title="Appeler le client" className="p-2 bg-cream rounded-lg text-ink hover:text-emerald transition-colors">
                    <Phone size={14} />
                  </a>
                  <a suppressHydrationWarning href={waLink} aria-label="Contacter sur WhatsApp" title="Contacter sur WhatsApp" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#25D366]/10 rounded-lg text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                    <MessageCircle size={14} />
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate uppercase tracking-wider">Adresse</p>
                <p className="font-bold text-ink text-sm leading-snug">
                  {order.delivery_address || 'Aucune adresse renseignée'}
                </p>
              </div>

              {order.payment_method === 'cod' && ['pending', 'confirmed'].includes(order.status) && (
                <div className="pt-2">
                  <CallButton phone={order.buyer_phone} buyerName={order.buyer_name} orderId={order.id} variant="both" />
                </div>
              )}

              {/* Anti-Fraude : Score Acheteur */}
              <BuyerScoreBadge phone={order.buyer_phone} storeId={order.store_id} />
            </div>
          </section>

          {/* Règlement */}
          <section className="bg-white rounded-2xl shadow-sm border border-line p-5 space-y-4">
            <h3 className="font-display font-black text-ink uppercase tracking-tight text-sm border-b border-line pb-2 flex items-center gap-2">
              <Receipt size={16} className="text-emerald" /> Règlement
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate font-bold uppercase text-[10px]">Méthode</span>
                <span className="font-black text-ink bg-cream px-2 py-1 rounded-md uppercase text-[9px]">
                  {isCod ? 'Cash on Delivery' : order.payment_method}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-slate font-bold">Total payé</span>
                <span className="text-ink font-bold">{order.total.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate font-bold">Commission Yayyam</span>
                <span className="text-red-500">− {(order.platform_fee || 0).toLocaleString('fr-FR')} F</span>
              </div>
              <div className="mt-3 p-3 bg-emerald/5 rounded-xl border border-emerald/10">
                <p className="text-[9px] font-black text-emerald uppercase tracking-widest mb-0.5">Net pour vous</p>
                <p className="text-lg font-black text-emerald">
                  {(order.vendor_amount || order.total).toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pb-6">
            <OrderActions
              orderId={order.id}
              currentStatus={order.status}
              availableTransitions={availableTransitions}
              isCod={isCod}
              invoiceUrl={(order.invoices as { pdf_url: string }[] | null)?.[0]?.pdf_url}
            />
            {order.status === 'completed' && (
              <div className="bg-emerald text-white rounded-2xl p-4 text-center mt-4">
                <Check size={20} className="mx-auto mb-1 opacity-80" />
                <p className="font-black uppercase text-sm tracking-tight">Archivée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
