'use client'

import { useState } from 'react'
import { MapPin, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react'
import { createDeliveryZone, updateDeliveryZone, toggleDeliveryZone, deleteDeliveryZone } from '@/lib/delivery/zoneActions'
import { toast } from 'sonner'

type DeliveryZone = {
  id: string
  name: string
  fee: number
  delay: string | null
  active: boolean
}

export function ZoneList({ initialZones }: { initialZones: DeliveryZone[] }) {
  const [zones, setZones] = useState<DeliveryZone[]>(initialZones)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({ name: '', fee: '', delay: '' })
  const [loading, setLoading] = useState(false)

  const handleOpenModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone)
      setFormData({ name: zone.name, fee: zone.fee.toString(), delay: zone.delay || '' })
    } else {
      setEditingZone(null)
      setFormData({ name: '', fee: '', delay: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingZone) {
        await updateDeliveryZone(editingZone.id, {
          name: formData.name,
          fee: parseFloat(formData.fee),
          delay: formData.delay || undefined
        })
        setZones(zones.map(z => z.id === editingZone.id ? { ...z, name: formData.name, fee: parseFloat(formData.fee), delay: formData.delay } : z))
        toast.success('Zone mise à jour avec succès')
      } else {
        await createDeliveryZone({
          name: formData.name,
          fee: parseFloat(formData.fee),
          delay: formData.delay || undefined
        })
        toast.success('Zone créée avec succès')
        // We will just refresh the page data via revalidatePath internally but optimistically we can let next.js refetch
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return
    try {
      await deleteDeliveryZone(id)
      setZones(zones.filter(z => z.id !== id))
      toast.success('Zone supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-black text-[#1A1A1A] text-xl">Vos zones configurées ({zones.length})</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez vos différentes zones et leurs tarifs associés</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0F7A60] hover:bg-[#0F7A60]/90 text-white font-bold rounded-xl transition-all shadow-sm"
        >
          <Plus size={18} />
          <span>Nouvelle Zone</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {zones.map(zone => (
          <div key={zone.id} className={`bg-white border ${zone.active ? 'border-gray-200' : 'border-gray-100 bg-gray-50/50'} rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${zone.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <MapPin size={24} />
              </div>
              <div>
                <h3 className={`font-black text-lg flex items-center gap-2 ${zone.active ? 'text-gray-900' : 'text-gray-500 line-through decoration-gray-300'}`}>
                  {zone.name}
                  {!zone.active && <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full not-line-through">Inactif</span>}
                </h3>
                <p className="text-sm font-medium text-gray-500">{zone.delay || 'Délai standard'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className={`text-xl font-black ${zone.active ? 'text-[#0F7A60]' : 'text-gray-400'}`}>{zone.fee.toLocaleString('fr-FR')} F</span>
              </div>
              
              <div className="flex items-center gap-2 border-l pl-6 border-gray-100">
                <button onClick={() => handleToggle(zone.id, !zone.active)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title={zone.active ? 'Désactiver' : 'Activer'}>
                  {zone.active ? <PowerOff size={18} /> : <Power size={18} />}
                </button>
                <button onClick={() => handleOpenModal(zone)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(zone.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {zones.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Vous n&apos;avez pas encore configuré de zone.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">
                {editingZone ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nom de la zone *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Dakar, Banlieue, Express..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Frais de livraison (FCFA) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Ex: 2000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  value={formData.fee}
                  onChange={e => setFormData({ ...formData, fee: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Délai estimé (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: 24h, 2-3 jours ouvrés"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  value={formData.delay}
                  onChange={e => setFormData({ ...formData, delay: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#0F7A60] text-white font-bold rounded-xl hover:bg-[#0F7A60]/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
