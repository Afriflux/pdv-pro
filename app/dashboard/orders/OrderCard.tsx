'use client'

import Link from 'next/link'
import { MessageCircle, ArrowRight } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:         { label: 'En attente',    color: 'bg-amber-100 text-amber-700' },
  paid:            { label: 'Payée',          color: 'bg-emerald-100 text-emerald-700' },
  confirmed:       { label: 'Confirmée',      color: 'bg-blue-100 text-blue-700' },
  processing:      { label: 'En préparation', color: 'bg-orange-100 text-orange-700' },
  shipped:         { label: 'Expédiée',      color: 'bg-indigo-100 text-indigo-700' },
  delivered:       { label: 'Livrée',        color: 'bg-emerald-100 text-emerald-700' },
  cancelled:       { label: 'Annulée',       color: 'bg-red-100 text-red-700' },
  completed:       { label: 'Terminée',      color: 'bg-emerald-100 text-emerald-700' },
  cod_pending:     { label: 'COD en attente', color: 'bg-orange-100 text-orange-700' },
  cod_confirmed:   { label: 'COD confirmée',  color: 'bg-emerald-100 text-emerald-700' },
  no_answer:       { label: 'Pas de réponse', color: 'bg-gray-100 text-gray-500' },
}

interface OrderCardProps {
  order: {
    id: string
    buyer_name: string
    buyer_phone: string
    total: number
    status: string
    created_at: string
    product: {
      name: string
      images: string[]
    } | null
  }
}

export default function OrderCard({ order }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-500' }
  const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col h-full group">
      {/* Image & Status */}
      <div className="aspect-[16/9] bg-cream relative overflow-hidden border-b border-line">
        {order.product?.images?.[0] ? (
          <img 
            src={order.product.images[0]} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg shadow-sm ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <p className="text-[10px] text-dust font-bold uppercase tracking-wider mb-0.5">{dateStr}</p>
          <h3 className="font-bold text-ink leading-tight line-clamp-1">{order.buyer_name}</h3>
          <p className="text-xs text-slate truncate">{order.product?.name ?? 'Produit supprimé'}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-line flex items-center justify-between">
          <p className="font-black text-emerald">{order.total.toLocaleString('fr-FR')} F</p>
          <div className="flex gap-1.5 text-xs font-bold">
            <a 
              href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}`}
              target="_blank"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
              title="WhatsApp"
            >
              <MessageCircle size={14} fill="currentColor" />
            </a>
            <Link 
              href={`/dashboard/orders/${order.id}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-ink/5 text-ink hover:bg-ink hover:text-white transition-all"
              title="Détails"
            >
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
