'use client'

import React from 'react'
import Link from 'next/link'
import { VendorDisplayRow } from './AdminVendorsTable'
import { 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Store as StoreIcon,
  ShieldAlert,
  Calendar
} from 'lucide-react'

interface KanbanColumn {
  id: string
  title: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  vendors: VendorDisplayRow[]
}

export default function AdminVendorsKanban({ vendors }: { vendors: VendorDisplayRow[] }) {
  
  // Catégorisation des vendeurs
  const pendingVendors = vendors.filter(v => (v.kyc_status === 'pending' || v.kyc_status === 'submitted') && v.is_active)
  const verifiedVendors = vendors.filter(v => v.kyc_status === 'verified' && v.is_active)
  const blockedVendors = vendors.filter(v => !v.is_active || v.kyc_status === 'rejected')

  const columns: KanbanColumn[] = [
    {
      id: 'pending',
      title: 'En attente KYC',
      icon: Clock,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      vendors: pendingVendors
    },
    {
      id: 'verified',
      title: 'Validés & Actifs',
      icon: CheckCircle2,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      vendors: verifiedVendors
    },
    {
      id: 'blocked',
      title: 'Suspendus / Rejetés',
      icon: ShieldAlert,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-500/10 border-red-500/20',
      vendors: blockedVendors
    }
  ]

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex items-start gap-4 lg:gap-6 min-h-[600px] w-full mt-4 pb-10 overflow-x-auto snap-x snap-mandatory">
      {columns.map(col => (
        <div 
          key={col.id} 
          className="flex-shrink-0 w-80 lg:w-96 flex flex-col gap-4 snap-center"
        >
          {/* Header de la colonne */}
          <div className={`p-4 rounded-[1.5rem] border ${col.bgClass} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-white rounded-xl shadow-sm ${col.colorClass}`}>
                <col.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-black uppercase tracking-widest text-[11px] ${col.colorClass}`}>
                  {col.title}
                </h3>
                <p className="text-gray-500 text-xs font-bold mt-0.5">{col.vendors.length} boutique(s)</p>
              </div>
            </div>
          </div>

          {/* Liste des cartes */}
          <div className="flex flex-col gap-3">
            {col.vendors.map(vendor => (
              <Link
                key={vendor.id}
                href={`/admin/vendeurs/${vendor.id}`}
                className="bg-white border text-left border-gray-100/80 rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-500/30 transition-all group flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Header Carte */}
                <div className="flex justify-between items-start gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center shrink-0 border border-emerald-200">
                      <span className="text-emerald-700 font-bold text-sm">
                        {vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{vendor.name}</h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5 max-w-[150px] truncate" title={vendor.user?.email || 'N/A'}>
                        {vendor.user?.email || vendor.whatsapp || 'Aucun contact'}
                      </p>
                    </div>
                  </div>
                  <button title="Options" aria-label="Plus d'options" className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Métriques / Perf */}
                <div className="grid grid-cols-2 gap-2 relative z-10">
                  <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Total (30j)</p>
                    <p className="font-bold text-gray-900 text-sm">{formatMoney(vendor.metrics.gmv30d)}</p>
                  </div>
                  <div className="bg-[#FAFAF7] rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Ventes (30j)</p>
                    <p className="font-bold text-gray-900 text-sm">{vendor.metrics.orders30d}</p>
                  </div>
                </div>

                {/* Footer Carte */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 relative z-10">
                   <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                     <Calendar className="w-3.5 h-3.5" />
                     {new Date(vendor.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                   </div>
                   
                   {!vendor.is_active ? (
                     <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider">
                       Suspendu
                     </span>
                   ) : vendor.kyc_status === 'verified' ? (
                     <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                       Vérifié
                     </span>
                   ) : (
                     <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
                       En attente
                     </span>
                   )}
                </div>

                {/* Hover Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            ))}

            {col.vendors.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-100 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
                <StoreIcon className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-400">Aucune boutique</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
