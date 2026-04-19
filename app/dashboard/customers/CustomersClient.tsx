'use client'

import { useState, useMemo } from 'react'
import { Search, Crown, CheckCircle2, AlertCircle, MessageCircle, Download, Plus, Star, Tag, Activity, MapPin, ArrowRight } from 'lucide-react'
import Swal from 'sweetalert2'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export type CustomerAgg = {
  phone: string
  name: string
  email: string | null
  totalSpent: number
  orderCount: number
  validOrderCount: number
  cancelledCount: number
  promoCount: number
  cities: string[]
  lastOrderAt: Date
  score: number | null
  isBlacklisted: boolean
}

interface CustomersClientProps {
  customers: CustomerAgg[]
  storeName: string
}

// ----------------------------------------------------------------
// Helper LTV Segmentation (Pour les listes classiques)
// ----------------------------------------------------------------
function getCustomerTag(c: CustomerAgg) {
  const diffDays = (Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 3600 * 24)
  
  if (c.validOrderCount >= 3 || c.totalSpent >= 50000) return { label: 'Club Élite', icon: Crown, color: 'text-amber-600 bg-amber-100' }
  if (diffDays < 15) return { label: 'Chaud', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100' }
  if (diffDays > 45) return { label: 'Endormi', icon: AlertCircle, color: 'text-orange-500 bg-orange-100' }
  return { label: 'Standard', icon: null, color: 'text-gray-500 bg-gray-100' }
}

function formatPhone(phone: string) {
  let p = phone.replace(/\s+/g, '')
  if (!p.startsWith('+')) p = '+' + p
  return p
}

export default function CustomersClient({ customers, storeName }: CustomersClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'segments'>('all')
  const [search, setSearch] = useState('')
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<string | null>(null)

  // ----------------------------------------------------------------
  // Logique des Segments
  // ----------------------------------------------------------------
  const topCity = useMemo(() => {
    const allCities: Record<string, number> = {}
    customers.forEach(c => {
      c.cities.forEach(city => {
        allCities[city] = (allCities[city] || 0) + 1
      })
    })
    const sorted = Object.entries(allCities).sort((a,b)=>b[1]-a[1])
    return sorted.length > 0 ? sorted[0][0] : null
  }, [customers])

  const filtered = useMemo(() => {
    let list = customers
    
    // Filtre Segment
    if (activeSegmentFilter) {
      if (activeSegmentFilter === 'VIP') {
        list = list.filter(c => c.validOrderCount >= 3 || c.totalSpent >= 50000)
      } else if (activeSegmentFilter === 'Nouveaux') {
        list = list.filter(c => c.validOrderCount === 1)
      } else if (activeSegmentFilter === 'Inactifs') {
        list = list.filter(c => (Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 3600 * 24) > 45)
      } else if (activeSegmentFilter === 'Promos') {
        list = list.filter(c => c.validOrderCount > 0 && (c.promoCount / c.validOrderCount) >= 0.5)
      } else if (activeSegmentFilter === 'Risque') {
        list = list.filter(c => c.orderCount > 0 && (c.cancelledCount / c.orderCount) >= 0.3)
      } else if (activeSegmentFilter === 'Zone' && topCity) {
        list = list.filter(c => c.cities.includes(topCity))
      }
    }

    // Filtre Recherche
    if (search) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
      )
    }
    
    return list
  }, [customers, search, activeSegmentFilter, topCity])

  // KPIs
  const totalLtv = customers.reduce((acc, c) => acc + c.totalSpent, 0)
  const avgLtv = customers.length ? (totalLtv / customers.length) : 0
  const vips = customers.filter(c => c.validOrderCount >= 3 || c.totalSpent >= 50000).length

  // Counts pour les cartes Segments
  const counts = {
    'VIP': vips,
    'Nouveaux': customers.filter(c => c.validOrderCount === 1).length,
    'Inactifs': customers.filter(c => (Date.now() - new Date(c.lastOrderAt).getTime()) / (1000 * 3600 * 24) > 45).length,
    'Promos': customers.filter(c => c.validOrderCount > 0 && (c.promoCount / c.validOrderCount) >= 0.5).length,
    'Risque': customers.filter(c => c.orderCount > 0 && (c.cancelledCount / c.orderCount) >= 0.3).length,
    'Zone': topCity ? customers.filter(c => c.cities.includes(topCity)).length : 0
  }

  const SEGMENTS_UI = [
    { id: 'VIP', title: 'Club Élite', desc: '+3 commandes ou +50k', icon: Crown, color: 'text-amber-500 bg-amber-50', borderColor: 'border-amber-100 hover:border-amber-300 hover:shadow-amber-100/50' },
    { id: 'Nouveaux', title: '1er Achat Réussi', desc: '1 seule commande', icon: Star, color: 'text-blue-500 bg-blue-50', borderColor: 'border-blue-100 hover:border-blue-300 hover:shadow-blue-100/50' },
    { id: 'Inactifs', title: 'En Dormance', desc: 'Pas d\'achat > 45 jours', icon: AlertCircle, color: 'text-orange-500 bg-orange-50', borderColor: 'border-orange-100 hover:border-orange-300 hover:shadow-orange-100/50' },
    { id: 'Promos', title: 'Chasseurs Promos', desc: '+50% d\'achats avec réductions', icon: Tag, color: 'text-purple-500 bg-purple-50', borderColor: 'border-purple-100 hover:border-purple-300 hover:shadow-purple-100/50' },
    { id: 'Risque', title: 'Zone Rouge COD', desc: '+30% d\'annulations / refus', icon: Activity, color: 'text-red-500 bg-red-50', borderColor: 'border-red-100 hover:border-red-300 hover:shadow-red-100/50' },
    { id: 'Zone', title: 'Top Hubs', desc: topCity ? `Focus sur: ${topCity}` : 'Par ville', icon: MapPin, color: 'text-emerald-500 bg-emerald-50', borderColor: 'border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100/50' },
  ]

  // Export
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      Swal.fire('Erreur', 'Aucun client à exporter.', 'error')
      return
    }
    const headers = ['Nom', 'Telephone', 'Email', 'Total Depense (FCFA)', 'Achats Valides', 'Annulations', 'Score', 'Dernier Achat']
    const rows = filtered.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      c.totalSpent,
      c.validOrderCount,
      c.cancelledCount,
      c.score || '',
      new Date(c.lastOrderAt).toLocaleDateString('fr-FR')
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Yayyam_Clients_${activeSegmentFilter || 'Tous'}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="px-6 pb-20 w-full space-y-6">
      
      {/* HEADER ACTIONS & TABS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full border-b border-gray-100 pb-4">
         <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm order-2 md:order-1 w-full md:w-auto">
            <button 
              onClick={() => { setActiveTab('all'); setActiveSegmentFilter(null); }}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' && !activeSegmentFilter ? 'bg-gray-100 text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Tous les clients
            </button>
            <button 
              onClick={() => setActiveTab('segments')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'segments' ? 'bg-[#0F7A60]/10 text-[#0F7A60] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Segments
            </button>
         </div>

         <div className="flex w-full md:w-auto gap-3 order-1 md:order-2">
            <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm">
               <Download size={16} /> Exporter
            </button>
            <button onClick={() => Swal.fire('Info', 'L\'ajout manuel arrive prochainement.', 'info')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-ink text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-sm">
               <Plus size={16} /> Ajouter
            </button>
         </div>
      </div>

      {activeTab === 'segments' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="mb-6">
             <h2 className="text-xl font-black text-ink mb-1">Segments Intelligents</h2>
             <p className="text-gray-500 text-sm font-medium">Filtrez vos clients avec la méthode RFM (Récence, Fréquence, Montant) pour des relances ciblées.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             {SEGMENTS_UI.map((seg, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setActiveSegmentFilter(seg.id); setActiveTab('all'); }}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:-translate-y-1 group relative overflow-hidden ${seg.borderColor}`}
                >
                  <div className="flex items-start justify-between mb-8 relative z-10">
                     <div className={`p-3 rounded-2xl ${seg.color}`}>
                       <seg.icon size={22} strokeWidth={2.5} />
                     </div>
                     <ArrowRight size={20} className="text-gray-300 group-hover:text-ink transition-colors" />
                  </div>
                  <div className="relative z-10">
                     <h3 className="font-black text-lg text-ink flex items-center gap-2">
                       {seg.title}
                     </h3>
                     <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{seg.desc}</p>
                     <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black text-gray-700">
                        {counts[seg.id as keyof typeof counts]} clients
                     </div>
                  </div>
                  {/* Effet déco */}
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03] rotate-12 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-6">
                    <seg.icon size={120} />
                  </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* VUE TABLEAU CLASSIQUE (ALL ou SEGMENT FILTERED) */}
      {(activeTab === 'all' || activeSegmentFilter) && (
        <div className="animate-in fade-in duration-500 space-y-6">
          {/* Si un segment est actif, montrer un bouton de retour */}
          {activeSegmentFilter && (
            <div className="flex items-center justify-between bg-purple-50 border border-purple-100 p-4 rounded-xl">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Tag size={16} /></div>
                 <div>
                   <p className="text-sm font-bold text-purple-900">Filtre actif : {SEGMENTS_UI.find(s=>s.id===activeSegmentFilter)?.title}</p>
                   <p className="text-xs text-purple-600 font-medium">Exportez cette liste ou lancez des messages WhatsApp ciblés.</p>
                 </div>
               </div>
               <button 
                 onClick={() => setActiveSegmentFilter(null)}
                 className="text-xs font-bold px-3 py-1.5 bg-white text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
               >
                 Réinitialiser
               </button>
            </div>
          )}

          {!activeSegmentFilter && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <p className="text-xs font-black tracking-widest uppercase text-emerald mb-1">Nombre de Clients</p>
                  <p className="font-display font-black text-xl lg:text-3xl text-ink">{customers.length}</p>
              </div>

              <div className="bg-white/80 p-6 rounded-[32px] border border-white shadow-xl shadow-gray-200/50 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <p className="text-xs font-black tracking-widest uppercase text-gold mb-1">Clients VIP (3+ achats)</p>
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
          )}

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

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA]">
              <div className="w-[30%] text-xs font-black text-gray-400 tracking-widest uppercase">Client</div>
              <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase">Téléphone</div>
              <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase text-center">Score CRM</div>
              <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase text-right">LTV (Dépensé)</div>
              <div className="w-[15%] text-xs font-black text-gray-400 tracking-widest uppercase text-center">Dernier Achat</div>
              <div className="w-[10%] text-xs font-black text-gray-400 tracking-widest uppercase text-right">Contacter</div>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <div className="p-16 text-center text-gray-400 font-bold">Aucun client trouvé pour ces critères.</div>
              ) : (
                filtered.sort((a,b) => b.totalSpent - a.totalSpent).map((c, i) => {
                  const tag = getCustomerTag(c)
                  const fraudRatio = c.orderCount > 0 ? (c.cancelledCount / c.orderCount) : 0
                  
                  // Message intelligent selon le segment actif ou ratio
                  let prefilledMsg = `Bonjour ${c.name}, j'espère que vous allez bien depuis votre dernier achat chez ${storeName} ! J'ai une offre spéciale pour vous...`
                  if (activeSegmentFilter === 'Inactifs') prefilledMsg = `Bonjour ${c.name}, cela fait longtemps qu'on ne vous a pas vu sur ${storeName} ! Pour votre retour, voici -10%...`
                  
                  const waLink = `https://wa.me/${formatPhone(c.phone).replace('+','')}?text=${encodeURIComponent(prefilledMsg)}`

                  return (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 hover:bg-gray-50/50 transition-colors gap-4 md:gap-0 group">
                      
                      <div className="w-full md:w-[30%]">
                        <p className="font-display font-bold text-ink text-sm lg:text-base flex flex-wrap items-center gap-2">
                          {c.name}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${tag.color}`}>
                            {tag.icon && <tag.icon size={10} />}
                            {tag.label}
                          </span>
                          {fraudRatio >= 0.3 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 flex items-center gap-1">
                              <AlertCircle size={10}/> Risque COD
                            </span>
                          )}
                          {c.isBlacklisted && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">BANNI</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                           {c.email && <p className="text-xs text-dust truncate">{c.email}</p>}
                           {c.cities.length > 0 && <p className="text-xs text-gray-400 font-medium">📍 {c.cities[0]}</p>}
                        </div>
                      </div>

                      <div className="w-full md:w-[15%] text-dust text-sm font-medium">
                        {c.phone}
                      </div>

                      <div className="w-full md:w-[15%] text-left md:text-center text-ink text-sm">
                        <div className="font-bold flex items-center justify-start md:justify-center gap-1">
                          {c.validOrderCount} \/ {c.orderCount} <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        {c.promoCount > 0 && <p className="text-[10px] font-bold text-purple-500 mt-0.5">{c.promoCount} avec Promo</p>}
                      </div>

                      <div className="w-full md:w-[15%] text-left md:text-right font-black text-emerald-600 text-sm">
                        {c.totalSpent.toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-gray-400">FCFA</span>
                      </div>

                      <div className="w-full md:w-[15%] text-left md:text-center text-xs text-dust font-medium">
                        {new Date(c.lastOrderAt).toLocaleDateString('fr-FR')}
                      </div>

                      <div className="w-full md:w-[10%] text-right flex justify-end gap-2">
                        <a 
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-all shadow-sm group/btn relative"
                        >
                          <MessageCircle size={16} />
                          <span className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity">
                            Contacter
                          </span>
                        </a>
                      </div>

                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
