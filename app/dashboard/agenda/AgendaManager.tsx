'use client'

import { useState } from 'react'
import { Calendar, Clock, Plus, Trash2, CalendarCheck, Video, RefreshCw, MoreVertical } from 'lucide-react'
import { saveAgendaSlots } from '@/lib/coaching/agendaActions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DAYS = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' }
]

type Slot = {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

export function AgendaManager({ initialSlots, initialBookings }: { initialSlots: any[], initialBookings: any[] }) {
  const [activeTab, setActiveTab] = useState<'disponibilites' | 'reservations'>('reservations')
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [isSaving, setIsSaving] = useState(false)

  // Modal d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlot, setNewSlot] = useState({ day_of_week: 0, start_time: '09:00', end_time: '17:00' })

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault()
    setSlots([...slots, { ...newSlot, active: true }])
    setIsModalOpen(false)
  }

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await saveAgendaSlots(slots)
    if (result.success) {
      toast.success('Disponibilités mises à jour')
    } else {
      toast.error(result.error)
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'reservations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Réservations
        </button>
        <button
          onClick={() => setActiveTab('disponibilites')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'disponibilites' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Disponibilités
        </button>
      </div>

      {activeTab === 'reservations' && (
        <div className="grid grid-cols-1 gap-4">
          {initialBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune réservation</h3>
              <p className="text-gray-500">Vos prochaines sessions de coaching apparaîtront ici.</p>
            </div>
          ) : (
            initialBookings.map((booking: any) => (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{booking.product?.name || 'Session de Coaching'}</h4>
                    <p className="text-gray-500 text-sm mt-1">Client : {booking.order?.buyer?.name || 'Inconnu'} ({booking.order?.buyer?.email})</p>
                    <div className="flex items-center gap-4 mt-3 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                        <Clock size={16} className="text-gray-400" />
                        {format(new Date(booking.booking_date), "EEEE d MMMM", { locale: fr })}
                        {' • '}
                        {booking.start_time} - {booking.end_time}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {booking.product?.booking_link ? (
                    <a href={booking.product.booking_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl transition-colors">
                      <Video size={18} /> Appel
                    </a>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Pas de lien</span>
                  )}
                  <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'disponibilites' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center sm:flex-row flex-col gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Horaires de disponibilité</h2>
              <p className="text-sm text-gray-500 mt-1">Définissez vos jours et heures de disponibilité pour les réservations.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F7A60] hover:bg-[#0F7A60]/90 text-white font-bold rounded-xl whitespace-nowrap"
            >
              <Plus size={18} /> Ajouter un créneau
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {DAYS.map(day => {
                const daySlots = slots.filter(s => s.day_of_week === day.value).sort((a,b) => a.start_time.localeCompare(b.start_time))
                return (
                  <div key={day.value} className="flex flex-col sm:flex-row gap-4 py-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-32 font-bold text-gray-900 pt-1">
                      {day.label}
                    </div>
                    <div className="flex-1">
                      {daySlots.length === 0 ? (
                        <span className="text-sm text-gray-400 font-medium italic">Indisponible</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((slot, index) => {
                            const globalIndex = slots.findIndex(s => s === slot)
                            return (
                              <div key={index} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                                {slot.start_time} - {slot.end_time}
                                <button
                                  onClick={() => handleRemoveSlot(globalIndex)}
                                  className="ml-1 text-emerald-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : 'Sauvegarder les disponibilités'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Nouveau créneau</h3>
            </div>
            <form onSubmit={handleAddSlot} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Jour de la semaine</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  value={newSlot.day_of_week}
                  onChange={e => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                >
                  {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Heure de début</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    value={newSlot.start_time}
                    onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Heure de fin</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    value={newSlot.end_time}
                    onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0F7A60] hover:bg-[#0F7A60]/90 text-white font-bold rounded-xl"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
