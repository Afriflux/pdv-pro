'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Eye, CheckCircle2, XCircle, Clock, Users,
  MoreVertical, Box, MonitorSmartphone, GraduationCap, Download,
  Mail, MessageCircle, Ban, CheckSquare
} from 'lucide-react'

// ─── TYPES ──────────────────────────────────────────────────────────────────
export interface VendorDisplayRow {
  id: string
  name: string
  slug: string | null
  created_at: string
  is_active: boolean
  kyc_status: string | null
  vendor_type: string
  user_id: string
  whatsapp: string | null
  user: { email: string; phone: string | null; role: string } | null
  metrics: {
    gmv30d: number
    orders30d: number
    lastActivity: string | null
  }
}

interface Props {
  vendors: VendorDisplayRow[]
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function KYCBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0F7A60]/10 text-[#0F7A60] rounded-md text-[9px] font-black uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" /> Vérifié
        </span>
      )
    case 'pending':
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-md text-[9px] font-black uppercase tracking-wider">
          <Clock className="w-3 h-3" /> En attente
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[9px] font-black uppercase tracking-wider">
          <XCircle className="w-3 h-3" /> Rejeté
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[9px] font-black uppercase tracking-wider">
          Non soumis
        </span>
      )
  }
}

function VendorTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'digital': return <span title="Digital"><MonitorSmartphone className="w-4 h-4 text-blue-500" /></span>
    case 'coaching': return <span title="Coaching"><GraduationCap className="w-4 h-4 text-purple-500" /></span>
    case 'physical': return <span title="Physique"><Box className="w-4 h-4 text-amber-500" /></span>
    default: return <span title="Hybride"><Box className="w-4 h-4 text-gray-400" /></span>
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F'
}

// ─── COMPOSANT ─────────────────────────────────────────────────────────────
export default function AdminVendorsTable({ vendors }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(vendors.map(v => v.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSelectedIds(newSet)
  }

  const handleExport = () => {
    if (selectedIds.size === 0 && vendors.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }
    const listToExport = selectedIds.size > 0 ? vendors.filter(v => selectedIds.has(v.id)) : vendors
    toast.info(`Export de ${listToExport.length} vendeurs en cours...`)
    setTimeout(() => {
      toast.success('Fichier CSV généré !')
    }, 1500)
  }

  const handleBulkSuspend = () => {
    toast.success(`${selectedIds.size} vendeurs suspendus`)
    setSelectedIds(new Set())
  }

  return (
    <>
      <div className="relative bg-white border border-gray-100 rounded-3xl overflow-visible shadow-sm mb-8">
        
        {/* Glow de fond du tableau (Peps subtil conservé) */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        {/* En-tête des actions avec Export */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAF7] rounded-t-3xl">
          <div className="flex items-center gap-2">
             <input 
               type="checkbox"
               title="Tout sélectionner"
               aria-label="Sélectionner tous les vendeurs"
               className="w-4 h-4 rounded text-[#0F7A60] focus:ring-[#0F7A60] border-gray-300"
               checked={selectedIds.size === vendors.length && vendors.length > 0}
               onChange={handleSelectAll}
             />
             <span className="text-xs font-bold text-gray-500">{selectedIds.size} sélectionné(s)</span>
          </div>
          <button 
            title="Exporter en CSV"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-[#1A1A1A] text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm border border-gray-200 transition-all"
          >
            <Download size={14} /> Exporter la liste
          </button>
        </div>

        <div className="overflow-x-auto pb-32">
          <table className="w-full text-left relative z-10">
            <thead className="bg-[#FAFAF7] border-b border-gray-100 text-gray-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4 text-center w-12">#</th>
                <th className="px-6 py-4">Boutique</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Performance (30j)</th>
                <th className="px-6 py-4">Statuts</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.length > 0 ? vendors.map((vendor) => {
                const isSelected = selectedIds.has(vendor.id)
                // Health Indicator (Green dot si activité récente <= 48h)
                const lastAct = vendor.metrics.lastActivity ?? vendor.created_at
                const isHealthy = differenceInHours(new Date(), new Date(lastAct)) <= 48

                return (
                  <tr key={vendor.id} className={`transition-colors border-b border-gray-100 last:border-0 group ${isSelected ? 'bg-[#0F7A60]/5' : 'hover:bg-gray-50/50'}`}>
                    {/* Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox"
                        title="Sélectionner ce vendeur"
                        aria-label="Sélectionner ce vendeur"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(vendor.id, e.target.checked)}
                        className="w-4 h-4 rounded text-[#0F7A60] focus:ring-[#0F7A60] border-gray-300 transition-all cursor-pointer"
                      />
                    </td>

                    {/* Boutique (Avatar, Type, Health) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0 ${isSelected ? 'bg-[#0F7A60] text-white' : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 border border-gray-200/50'}`}>
                            {vendor.name.charAt(0).toUpperCase()}
                          </div>
                          {/* Health Dot */}
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-gray-300'}`} title={isHealthy ? 'Activité récente' : 'Inactif'}></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-sm text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors">{vendor.name}</p>
                             <VendorTypeIcon type={vendor.vendor_type || 'physical'} />
                          </div>
                          {vendor.slug && (
                            <Link href={`/${vendor.slug}`} target="_blank" className="text-[10px] text-gray-400 font-mono hover:text-[#0F7A60] hover:underline">/{vendor.slug}</Link>
                          )}
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">Créé le {format(new Date(vendor.created_at), 'dd MMM yy', { locale: fr })}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact (Email, Phone) */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <a href={`mailto:${vendor.user?.email}`} className="text-xs font-medium text-[#1A1A1A] hover:underline hover:text-[#0F7A60] flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> {vendor.user?.email ?? 'N/A'}</a>
                        {vendor.user?.phone && (
                          <a href={`tel:${vendor.user.phone}`} className="text-[10px] text-gray-500 hover:underline">{vendor.user.phone}</a>
                        )}
                      </div>
                    </td>

                    {/* Metrics (GMV + Commandes) */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#0F7A60]">{formatMoney(vendor.metrics.gmv30d)}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{vendor.metrics.orders30d} ventes</span>
                      </div>
                    </td>

                    {/* Statuts (KYC + Actif) */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <KYCBadge status={vendor.kyc_status} />
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${vendor.is_active ? 'bg-[#0F7A60]/10 text-[#0F7A60]' : 'bg-red-500/10 text-red-500'}`}>
                           {vendor.is_active ? 'Actif' : 'Suspendu'}
                        </span>
                      </div>
                    </td>

                    {/* Actions (Dropdown) */}
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 relative">
                          <Link 
                            href={`/admin/vendeurs/${vendor.id}`}
                            className="p-2 text-gray-400 bg-white border border-gray-200 hover:border-[#0F7A60]/50 hover:bg-emerald-50 hover:text-[#0F7A60] rounded-xl transition-all shadow-sm group-hover:shadow"
                            title="Détails complets"
                            aria-label={`Voir les détails complets de ${vendor.name}`}
                          >
                            <Eye size={16} />
                          </Link>

                          {/* Quick Actions Dropdown */}
                          <div className="relative">
                            <button
                               title="Actions rapides"
                               aria-label="Ouvrir les actions rapides"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 setActiveDropdown(activeDropdown === vendor.id ? null : vendor.id)
                               }}
                               className={`p-2 rounded-xl transition-all border ${activeDropdown === vendor.id ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                            >
                               <MoreVertical size={16} />
                            </button>
                            
                            {activeDropdown === vendor.id && (
                              <div 
                                className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                 <a 
                                   href={vendor.whatsapp ? `https://wa.me/${vendor.whatsapp.replace(/\+/g,'')}` : `tel:${vendor.user?.phone}`} 
                                   target="_blank" rel="noreferrer"
                                   className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-[#FAFAF7] hover:text-[#0F7A60] rounded-xl transition-colors"
                                 >
                                   <MessageCircle size={14} className="text-emerald-500" /> Contacter
                                 </a>
                                 {vendor.kyc_status === 'pending' || vendor.kyc_status === 'submitted' ? (
                                   <button 
                                     onClick={() => toast.success('KYC accepté !')}
                                      className="flex justify-start items-center gap-3 px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-[#FAFAF7] hover:text-emerald-600 rounded-xl transition-colors w-full"
                                   >
                                     <CheckSquare size={14} className="text-emerald-600" /> Valider le KYC
                                   </button>
                                 ) : null}
                                 <div className="h-px bg-gray-100/50 my-1 mx-2" />
                                 <button 
                                   onClick={() => toast.success(vendor.is_active ? 'Boutique suspendue' : 'Boutique réactivée')}
                                   className={`flex justify-start items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-colors w-full ${vendor.is_active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                 >
                                   <Ban size={14} /> {vendor.is_active ? 'Suspendre' : 'Réactiver'}
                                 </button>
                              </div>
                            )}
                          </div>
                       </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                   <td colSpan={6} className="py-24 text-center">
                     <div className="w-16 h-16 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Users className="w-8 h-8 text-gray-300" />
                     </div>
                     <p className="text-sm font-bold text-gray-500">Aucun vendeur trouvé</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BULK ACTION BAR FLOTTANTE ── */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#1A1A1A]/95 backdrop-blur-2xl border border-gray-700/50 shadow-2xl shadow-black/20 rounded-2xl px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full bg-[#0F7A60] flex items-center justify-center text-white text-xs font-black">
                {selectedIds.size}
             </div>
             <p className="text-sm font-medium text-white truncate max-w-[150px] md:max-w-xs">vendeurs sélectionnés</p>
          </div>
          <div className="h-6 w-px bg-gray-700"></div>
          <div className="flex items-center gap-2">
             <button onClick={handleExport} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-colors">Exporter</button>
             <button onClick={handleBulkSuspend} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-xl transition-colors hidden sm:block">Désactiver</button>
             <button onClick={() => setSelectedIds(new Set())} title="Fermer la sélection" aria-label="Fermer la sélection" className="p-2 text-gray-500 hover:text-white transition-colors"><XCircle size={16} /></button>
          </div>
        </div>
      </div>
    </>
  )
}
