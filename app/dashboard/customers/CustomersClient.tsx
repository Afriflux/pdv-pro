'use client'

import { useState, useMemo } from 'react'
import { Search, Crown, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
type CustomerAgg = {
  phone: string
  name: string
  email: string | null
  totalSpent: number
  orderCount: number
  lastOrderAt: Date
}

interface CustomersClientProps {
  customers: CustomerAgg[]
  storeName: string
}

// ----------------------------------------------------------------
// Helper LTV Segmentation
// ----------------------------------------------------------------
function getCustomerTag(c: CustomerAgg) {
  const diffDays = (Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 3600 * 24)
  
  if (c.orderCount >= 2) return { label: 'VIP', icon: Crown, color: 'text-gold bg-gold/10' }
  if (diffDays < 7) return { label: 'Chaud', icon: CheckCircle2, color: 'text-emerald bg-emerald/10' }
  if (diffDays > 30) return { label: 'À relancer', icon: AlertCircle, color: 'text-orange-500 bg-orange-100' }
  return { label: 'Standard', icon: null, color: 'text-gray-500 bg-gray-100' }
}

function formatPhone(phone: string) {
  let p = phone.replace(/\s+/g, '')
  if (!p.startsWith('+')) p = '+' + p
  return p
}

export default function CustomersClient({ customers, storeName }: CustomersClientProps) {
  const [search, setSearch] = useState('')

  // Filtrage
  const filtered = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    )
  }, [customers, search])

  // KPIs
  const totalLtv = customers.reduce((acc, c) => acc + c.totalSpent, 0)
  const avgLtv = customers.length ? (totalLtv / customers.length) : 0
  const vips = customers.filter(c => c.orderCount >= 2).length

  return (
    <div className="px-6 pb-20 w-full space-y-6">

      {/* KPIs CRM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white/80 p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <p className="text-xs font-black tracking-widest uppercase text-emerald mb-1">Nombre de Clients</p>
            <p className="font-display font-black text-xl lg:text-3xl text-ink">{customers.length}</p>
         </div>

         <div className="bg-white/80 p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <p className="text-xs font-black tracking-widest uppercase text-gold mb-1">Clients VIP (2+ achats)</p>
            <p className="font-display font-black text-xl lg:text-3xl text-ink">{vips} <span className="text-sm text-gray-400 font-bold">/ {customers.length}</span></p>
         </div>

         <div className="bg-white/80 p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <p className="text-xs font-black tracking-widest uppercase text-blue-500 mb-1">Panier Moyen (LTV)</p>
            <p className="font-display font-black text-xl lg:text-3xl text-ink">
              {Math.round(avgLtv).toLocaleString('fr-FR')} <span className="text-sm font-bold text-gray-400">FCFA</span>
            </p>
         </div>
      </div>

      {/* Barre de Recherche */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Chercher par nom, téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F7A60]/20 transition-all font-medium shadow-sm"
        />
      </div>

      {/* Table de Répartition */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA]">
          <div className="w-[30%] text-xs font-black text-gray-400 tracking-widest uppercase">Client</div>
          <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase">Téléphone</div>
          <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase text-center">Achats</div>
          <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase text-right">LTV (Dépensé)</div>
          <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase text-center">Dernier Achat</div>
          <div className="w-[10%] text-xs font-black text-gray-400 tracking-widest uppercase text-right">Contacter</div>
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-16 text-center text-gray-400">Aucun client trouvé.</div>
          ) : (
            filtered.sort((a,b) => b.totalSpent - a.totalSpent).map((c, i) => {
              const tag = getCustomerTag(c)
              const waLink = `https://wa.me/${formatPhone(c.phone).replace('+','')}?text=${encodeURIComponent(`Bonjour ${c.name}, j'espère que vous allez bien depuis votre dernier achat chez ${storeName} ! J'ai une offre spéciale pour vous...`)}`

              return (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 hover:bg-gray-50/50 transition-colors gap-4 md:gap-0 group">
                  
                  {/* Nom & Tag */}
                  <div className="w-full md:w-[30%]">
                    <p className="font-display font-bold text-ink text-sm lg:text-base flex items-center gap-2">
                       {c.name}
                       <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${tag.color}`}>
                         {tag.icon && <tag.icon size={10} />}
                         {tag.label}
                       </span>
                    </p>
                    {c.email && <p className="text-xs text-dust truncate mt-0.5">{c.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="w-full md:w-[15%] text-dust text-sm font-medium">
                    {c.phone}
                  </div>

                  {/* Achats */}
                  <div className="w-full md:w-[15%] text-left md:text-center text-ink font-bold">
                    x {c.orderCount}
                  </div>

                  {/* LTV */}
                  <div className="w-full md:w-[15%] text-left md:text-right font-black text-emerald text-sm">
                    {c.totalSpent.toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
                  </div>

                  {/* Date Dernier Achat */}
                  <div className="w-full md:w-[15%] text-left md:text-center text-xs text-dust font-medium">
                    {new Date(c.lastOrderAt).toLocaleDateString('fr-FR')}
                  </div>

                  {/* Action WhatsApp */}
                  <div className="w-full md:w-[10%] text-right flex justify-end">
                    <a 
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm tooltip-trigger"
                      title="Relancer par WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
