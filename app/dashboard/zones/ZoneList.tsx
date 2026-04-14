'use client'

import { useState } from 'react'
import { MapPin, Plus, Edit2, Trash2, Power, PowerOff, Loader2, Activity, DollarSign, Settings2, ClockIcon, LayoutGrid, List, Search } from 'lucide-react'
import { createDeliveryZone, updateDeliveryZone, toggleDeliveryZone, deleteDeliveryZone } from '@/lib/delivery/zoneActions'
import { toast } from '@/lib/toast'

type DeliveryZone = {
  id: string
  name: string
  fee: number
  delay: string | null
  active: boolean
  free_shipping_threshold: number | null
  note: string | null
}

export function ZoneList({ initialZones }: { initialZones: DeliveryZone[] }) {
  const [zones, setZones] = useState<DeliveryZone[]>(initialZones)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({ name: '', fee: '', delay: '', free_shipping_threshold: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all')

  const handleOpenModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone)
      setFormData({ 
        name: zone.name, 
        fee: zone.fee.toString(), 
        delay: zone.delay || '',
        free_shipping_threshold: zone.free_shipping_threshold ? zone.free_shipping_threshold.toString() : '',
        note: zone.note || ''
      })
    } else {
      setEditingZone(null)
      setFormData({ name: '', fee: '', delay: '', free_shipping_threshold: '', note: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payloadForState = {
          name: formData.name,
          fee: parseFloat(formData.fee),
          delay: formData.delay || null,
          free_shipping_threshold: formData.free_shipping_threshold ? parseInt(formData.free_shipping_threshold) : null,
          note: formData.note || null
      }
      
      const payloadForAction = {
          name: formData.name,
          fee: parseFloat(formData.fee),
          delay: formData.delay || undefined,
          free_shipping_threshold: formData.free_shipping_threshold ? parseInt(formData.free_shipping_threshold) : undefined,
          note: formData.note || undefined
      }

      if (editingZone) {
        await updateDeliveryZone(editingZone.id, payloadForAction)
        setZones(zones.map(z => z.id === editingZone.id ? { ...z, ...payloadForState } : z))
        toast.success('Zone mise à jour avec succès')
      } else {
        await createDeliveryZone(payloadForAction)
        toast.success('Zone créée avec succès')
        window.location.reload()
      }
      setIsModalOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      setZones(zones.map(z => z.id === id ? { ...z, active } : z))
      await toggleDeliveryZone(id, active)
      toast.success(active ? 'Zone activée' : 'Zone désactivée')
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  const handleDelete = async (id: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir supprimer cette zone ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    })
    if (!result.isConfirmed) return
    try {
      await deleteDeliveryZone(id)
      setZones(zones.filter(z => z.id !== id))
      toast.success('Zone supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // KPIs
  const activeZones = zones.filter(z => z.active)
  const inactiveCount = zones.length - activeZones.length
  const avgFee = activeZones.length > 0 
    ? Math.round(activeZones.reduce((acc, z) => acc + z.fee, 0) / activeZones.length)
    : 0

  const filteredZones = zones.filter(z => {
    const matchesSearch = z.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' ? true : activeTab === 'active' ? z.active : !z.active
    return matchesSearch && matchesTab
  })

  return (
    <>
      {/* KPIs Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0F7A60]/10">
           <div className="flex flex-col">
             <span className="text-xs font-black uppercase text-dust tracking-wider">Zones Actives</span>
             <span className="text-xl lg:text-3xl font-display font-black text-ink mt-1">{activeZones.length}</span>
           </div>
           <div className="w-14 h-14 bg-emerald/10 text-[#0F7A60] rounded-2xl flex items-center justify-center">
             <Activity size={28} />
           </div>
         </div>
         <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0F7A60]/10">
           <div className="flex flex-col">
             <span className="text-xs font-black uppercase text-dust tracking-wider">Frais Moyen</span>
             <span className="text-xl lg:text-3xl font-display font-black text-ink mt-1">{avgFee.toLocaleString('fr-FR')} F</span>
           </div>
           <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
             <DollarSign size={28} />
           </div>
         </div>
         <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white shadow-xl shadow-[#0F7A60]/5 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0F7A60]/10">
           <div className="flex flex-col">
             <span className="text-xs font-black uppercase text-dust tracking-wider">Zones Inactives</span>
             <span className="text-xl lg:text-3xl font-display font-black text-ink mt-1">{inactiveCount}</span>
           </div>
           <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
             <Settings2 size={28} />
           </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 px-2">
        <div>
          <h2 className="font-display font-black text-ink text-2xl tracking-tight">Liste des Secteurs</h2>
          <p className="text-sm font-medium text-slate mt-1">Configurez les différentes zones géographiques que vous couvrez.</p>
          
          <div className="flex gap-6 mt-6 border-b border-line">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'all' ? 'text-ink' : 'text-slate hover:text-ink'
              }`}
            >
              Toutes
              <span className="bg-line px-1.5 py-0.5 rounded-md text-xs">{zones.length}</span>
              {activeTab === 'all' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-ink rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'active' ? 'text-ink' : 'text-slate hover:text-ink'
              }`}
            >
              Actives
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A60] ml-0.5"></span>
              {activeTab === 'active' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-ink rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'inactive' ? 'text-ink' : 'text-slate hover:text-ink'
              }`}
            >
              Inactives
              <span className="w-1.5 h-1.5 rounded-full bg-dust ml-0.5"></span>
              {activeTab === 'inactive' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-ink rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
            <input 
              type="text" 
              placeholder="Rechercher une zone..." 
              className="w-full bg-white border border-line text-ink rounded-2xl pl-11 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald/10 focus:border-[#0F7A60] transition-all placeholder:font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-cream p-1 rounded-2xl border border-line w-fit">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'kanban' ? 'bg-white text-ink shadow-sm border border-line' : 'text-slate hover:text-ink hover:bg-white/50 border border-transparent'
            }`}
          >
            <LayoutGrid size={16} />
            Grille
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-ink shadow-sm border border-line' : 'text-slate hover:text-ink hover:bg-white/50 border border-transparent'
            }`}
          >
            <List size={16} />
            Liste
          </button>
        </div>
      </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredZones.map(zone => (
          <div key={zone.id} className={`group relative bg-white/80 backdrop-blur-xl rounded-[32px] p-6 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-500 border ${zone.active ? 'border-white hover:border-[#0F7A60]/30 hover:shadow-[#0F7A60]/10 hover:-translate-y-1' : 'border-white/50 bg-white/40 opacity-80'}`}>
            
            {/* Top Section */}
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${zone.active ? 'bg-gradient-to-br from-emerald/20 to-emerald/5 text-[#0F7A60]' : 'bg-line/50 text-dust'}`}>
                  <MapPin size={28} strokeWidth={2} />
                </div>
                
                {/* Status Pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${zone.active ? 'bg-emerald/10 text-[#0F7A60]' : 'bg-slate-200 text-slate'}`}>
                  {zone.active && <span className="w-2 h-2 rounded-full bg-[#0F7A60] animate-pulse"></span>}
                  {zone.active ? 'Active' : 'Désactivée'}
                </div>
              </div>
              
              <h3 className={`font-display font-black tracking-tight text-2xl mb-2 ${zone.active ? 'text-ink' : 'text-slate line-through decoration-dust/50'}`}>
                {zone.name}
              </h3>
              
              <div className={`flex items-center gap-2 text-xs font-bold ${zone.active ? 'text-slate' : 'text-dust/70'}`}>
                <ClockIcon size={14} className="shrink-0" />
                <span className="truncate" title={zone.delay || ''}>{zone.delay || 'Délai standard'}</span>
              </div>

              {zone.free_shipping_threshold && (
                <div className={`mt-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg w-fit transition-colors ${zone.active ? 'text-emerald bg-emerald/10' : 'text-dust bg-line/50 grayscale'}`}>
                  🎁 Gratuit dès {zone.free_shipping_threshold.toLocaleString('fr-FR')} F
                </div>
              )}
              
              {zone.note && (
                <div className="mt-2 text-xs italic text-slate font-medium line-clamp-2" title={zone.note}>
                  ℹ️ {zone.note}
                </div>
              )}
            </div>
            
            {/* Bottom Section */}
            <div className="mt-8 pt-5 border-t border-line flex items-end justify-between">
              <div className="flex items-baseline gap-1">
                <span className={`text-xl lg:text-3xl font-display font-black tracking-tighter ${zone.active ? 'text-ink' : 'text-dust'}`}>
                  {zone.fee.toLocaleString('fr-FR')} 
                </span>
                <span className="text-sm font-bold text-slate ml-1">FCFA</span>
              </div>
              
              {/* Action Buttons Glassmorphism */}
              <div className="flex items-center gap-1 bg-[#FAFAF7] border border-line rounded-xl p-1 shadow-sm opacity-100 xl:opacity-0 xl:-translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <button onClick={() => handleToggle(zone.id, !zone.active)} className={`p-2 rounded-lg transition-colors ${zone.active ? 'text-amber-500 hover:bg-amber-50' : 'text-[#0F7A60] hover:bg-emerald/10'}`} title={zone.active ? 'Désactiver' : 'Activer'}>
                  {zone.active ? <PowerOff size={18} /> : <Power size={18} />}
                </button>
                <button onClick={() => handleOpenModal(zone)} className="p-2 rounded-lg text-slate hover:text-ink hover:bg-white transition-colors" title="Modifier">
                  <Edit2 size={18} />
                </button>
                <div className="w-px h-6 bg-line mx-1"></div>
                <button onClick={() => handleDelete(zone.id)} className="p-2 rounded-lg text-slate hover:text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create Card (Always visible at the end or empty state) */}
        <button
           onClick={() => handleOpenModal()}
           className="min-h-[260px] bg-white/40 backdrop-blur-xl border-2 border-dashed border-white hover:border-[#0F7A60]/30 rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/60 hover:text-[#0F7A60] hover:shadow-xl transition-all duration-500 group text-dust"
         >
           <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
             <Plus size={32} />
           </div>
           <div className="text-center">
             <p className="font-display font-black text-xl text-ink group-hover:text-[#0F7A60] transition-colors">Ajouter une zone</p>
             <p className="text-sm font-medium mt-1">Élargissez votre secteur de livraison.</p>
           </div>
        </button>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white shadow-xl shadow-gray-200/50 overflow-hidden auto-rows-max">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-line bg-cream text-xs font-black uppercase tracking-widest text-dust">
                  <th className="px-6 py-5">Secteur</th>
                  <th className="px-6 py-5">Frais (FCFA)</th>
                  <th className="px-6 py-5">Délai estimé</th>
                  <th className="px-6 py-5">Seuil Gratuit</th>
                  <th className="px-6 py-5 text-center">Statut</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.map((zone) => (
                  <tr key={zone.id} className={`group border-b border-line last:border-none transition-colors hover:bg-cream/40 ${!zone.active ? 'bg-cream/20 opacity-80' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${zone.active ? 'bg-emerald/10 text-[#0F7A60]' : 'bg-line/50 text-dust'}`}>
                          <MapPin size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-display font-black text-[17px] tracking-tight ${zone.active ? 'text-ink' : 'text-slate line-through'}`}>{zone.name}</span>
                          {zone.note && <span className="text-xs text-slate mt-1 line-clamp-1 italic font-medium" title={zone.note}>ℹ️ {zone.note}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-display font-black text-[17px] tracking-tight ${zone.active ? 'text-ink' : 'text-dust'}`}>{zone.fee.toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-[13px] font-bold ${zone.active ? 'text-slate' : 'text-dust/70'}`}>
                        <ClockIcon size={16} />
                        {zone.delay || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {zone.free_shipping_threshold ? (
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-1.5 rounded-lg ${zone.active ? 'text-emerald bg-emerald/10' : 'text-dust bg-line/50 grayscale'}`}>
                          🎁 Dès {zone.free_shipping_threshold.toLocaleString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-dust font-bold">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${zone.active ? 'bg-emerald/10 text-[#0F7A60]' : 'bg-slate-100 text-slate'}`}>
                          {zone.active && <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A60] animate-pulse"></span>}
                          {zone.active ? 'Active' : 'Off'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggle(zone.id, !zone.active)} className={`p-2.5 rounded-xl transition-colors ${zone.active ? 'text-amber-500 hover:bg-amber-50' : 'text-[#0F7A60] hover:bg-emerald/10'}`} title={zone.active ? 'Désactiver' : 'Activer'}>
                          {zone.active ? <PowerOff size={18} /> : <Power size={18} />}
                        </button>
                        <button onClick={() => handleOpenModal(zone)} className="p-2.5 rounded-xl text-slate hover:text-ink hover:bg-cream transition-colors" title="Modifier">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(zone.id)} className="p-2.5 rounded-xl text-slate hover:text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-cream/30 border-t border-line">
            <button 
              onClick={() => handleOpenModal()} 
              className="w-full py-4 border-2 border-dashed border-dust/30 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-black text-slate hover:text-[#0F7A60] hover:border-[#0F7A60]/40 hover:bg-emerald/5 transition-all text-uppercase tracking-wider"
            >
              <Plus size={18} />
              Ajouter une nouvelle zone
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 relative">
            
            {/* Décoration d'arrière-plan */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="px-10 pt-10 pb-4 relative z-10">
              <h3 className="text-xl lg:text-3xl font-display font-black text-ink tracking-tight">
                {editingZone ? 'Modifier' : 'Nouvelle Zone'}
              </h3>
              <p className="text-sm text-slate font-medium mt-1">Configurez le nom, le tarif et les délais.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-6 relative z-10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-black text-dust pl-1">Nom de la zone <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
                    <input
                      required
                      type="text"
                      placeholder="Ex: Dakar, Abidjan..."
                      className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-black text-dust pl-1">Frais (FCFA) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="Ex: 2000"
                        className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                        value={formData.fee}
                        onChange={e => setFormData({ ...formData, fee: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-black text-dust pl-1">Gratuit dès (FCFA)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none">🎁</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Optionnel"
                        title="Seuil de livraison gratuite"
                        className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-emerald/10 focus:border-emerald transition-all"
                        value={formData.free_shipping_threshold}
                        onChange={e => setFormData({ ...formData, free_shipping_threshold: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-black text-dust pl-1">Délai estimé (Optionnel)</label>
                  <div className="relative">
                    <ClockIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ex: 24h, 2-3 jours ouvrés"
                      className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                      value={formData.delay}
                      onChange={e => setFormData({ ...formData, delay: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-black text-dust pl-1">Note Client (Instructions)</label>
                  <textarea
                    placeholder="Ex: Livraison l'après-midi, paiement à la réception..."
                    rows={2}
                    className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all resize-none"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-white border-2 border-line text-slate hover:text-ink hover:border-[#0F7A60]/30 font-black rounded-2xl transition-colors active:scale-95"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-ink text-white font-black rounded-2xl hover:bg-[#0F7A60] transition-colors disabled:opacity-50 shadow-lg active:scale-95"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Traitement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
