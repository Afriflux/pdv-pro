/* eslint-disable jsx-a11y/control-has-associated-label */
'use client'

import { useState } from 'react'
import { Calendar, Clock, Plus, Trash2, CalendarCheck, Video, RefreshCw, CheckCircle, XCircle, X, Search, LayoutGrid, List, MoreVertical, CalendarDays, Phone, Clock4, Check, CalendarOff } from 'lucide-react'
import { toast } from '@/lib/toast'
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

type Booking = {
  id: string
  booking_date: Date
  start_time: string
  end_time: string
  status: string
  product: { name: string; booking_link: string | null }
  order: {
    id: string
    total: number
    buyer: { name: string; phone: string | null; email: string | null } | null
  }
}

const STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  confirmed: { label: 'À venir', color: 'text-[#0F7A60]', bg: 'bg-emerald/10' },
  completed: { label: 'Terminée', color: 'text-blue-600', bg: 'bg-blue-50' },
  cancelled: { label: 'Annulée', color: 'text-red-500', bg: 'bg-red-50' },
  pending: { label: 'En attente', color: 'text-amber-500', bg: 'bg-amber-50' }
}

export type AgendaActionsType = {
  saveSlots: (slots: any[]) => Promise<{success: boolean, error?: string}>
  updateStatus: (id: string, status: string) => Promise<{success: boolean, error?: string}>
  addBlockedDate: (date: string, startTime?: string, endTime?: string) => Promise<{success: boolean, error?: string}>
  removeBlockedDate: (id: string) => Promise<{success: boolean, error?: string}>
  addBlockedRange: (dates: string[]) => Promise<{success: boolean, error?: string}>
  updateSettings: (settings: any) => Promise<{success: boolean, error?: string}>
}

export function UniversalAgenda({ 
  initialSlots, 
  initialBookings, 
  initialBlockedDates = [], 
  initialSettings,
  actions,
  role = 'vendor'
}: { 
  initialSlots: Slot[], 
  initialBookings: Booking[], 
  initialBlockedDates?: {id: string, date: Date}[], 
  initialSettings?: { coaching_max_per_day: number | null, coaching_min_notice: number | null, coaching_auto_accept?: boolean | null, coaching_buffer_time?: number | null, coaching_max_future_days?: number | null },
  actions: AgendaActionsType,
  role?: 'vendor' | 'closer' | 'client'
}) {
  const [mainTab, setMainTab] = useState<'reservations' | 'disponibilites' | 'parametres'>('reservations')
  
  const [settings, setSettings] = useState({
    maxPerDay: initialSettings?.coaching_max_per_day || 0,
    minNotice: initialSettings?.coaching_min_notice || 24,
    autoAccept: initialSettings?.coaching_auto_accept ?? true,
    bufferTime: initialSettings?.coaching_buffer_time || 0,
    maxFutureDays: initialSettings?.coaching_max_future_days || 60
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    const res = await actions.updateSettings({
      coaching_max_per_day: settings.maxPerDay,
      coaching_min_notice: settings.minNotice,
      coaching_auto_accept: settings.autoAccept,
      coaching_buffer_time: settings.bufferTime,
      coaching_max_future_days: settings.maxFutureDays
    })
    setIsSavingSettings(false)
    if (res.success) toast.success("Paramètres enregistrés")
    else toast.error(res.error || "Erreur lors de l'enregistrement")
  }
  
  // Bookings State
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [isSaving, setIsSaving] = useState(false)
  const [newSlot, setNewSlot] = useState({ days_of_week: [0], start_time: '09:00', end_time: '17:00' })
  const [slotInterval, setSlotInterval] = useState<number>(0)
  const [bufferTime, setBufferTime] = useState<number>(0)
  const [hasBigBreak, setHasBigBreak] = useState(false)
  const [breakStart, setBreakStart] = useState('12:00')
  const [breakEnd, setBreakEnd] = useState('14:00')
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  
  // Blocked Dates State
  const [blockedDates, setBlockedDates] = useState<{id: string, date: Date, start_time?: string, end_time?: string}[]>(initialBlockedDates as any)
  const [blockedType, setBlockedType] = useState<'full_day' | 'period' | 'hours'>('full_day')
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newBlockedEndDate, setNewBlockedEndDate] = useState('')
  const [newBlockedStartTime, setNewBlockedStartTime] = useState('09:00')
  const [newBlockedEndTime, setNewBlockedEndTime] = useState('12:00')
  
  // Duplication State
  const [duplicateSource, setDuplicateSource] = useState<number | null>(null)
  const [duplicateTargets, setDuplicateTargets] = useState<number[]>([])

  // Actions
  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    setActionMenuOpen(null)
    const result = await actions.updateStatus(id, status)
    if (result.success) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b))
      toast.success('Statut mis à jour')
    } else {
      toast.error(result.error || 'Erreur')
    }
    setUpdatingId(null)
  }

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newSlot.days_of_week.length === 0) {
      toast.error('Veuillez sélectionner au moins un jour.')
      return
    }

    const newSlots: Slot[] = []
    
    const generateSlotsHelper = (startStr: string, endStr: string, dayIndex: number) => {
      let current = new Date(`2000-01-01T${startStr}:00`)
      const end = new Date(`2000-01-01T${endStr}:00`)
      
      while (current < end) {
        const sStr = format(current, 'HH:mm')
        const next = new Date(current.getTime() + slotInterval * 60000)
        if (next > end) break;
        const eStr = format(next, 'HH:mm')
        newSlots.push({ day_of_week: dayIndex, start_time: sStr, end_time: eStr, active: true })
        current = new Date(next.getTime() + bufferTime * 60000)
      }
    }

    newSlot.days_of_week.forEach(dayIndex => {
      if (slotInterval === 0) {
        if (hasBigBreak && breakStart && breakEnd) {
          newSlots.push({ day_of_week: dayIndex, start_time: newSlot.start_time, end_time: breakStart, active: true })
          newSlots.push({ day_of_week: dayIndex, start_time: breakEnd, end_time: newSlot.end_time, active: true })
        } else {
          newSlots.push({ day_of_week: dayIndex, start_time: newSlot.start_time, end_time: newSlot.end_time, active: true })
        }
      } else {
        if (hasBigBreak && breakStart && breakEnd) {
          generateSlotsHelper(newSlot.start_time, breakStart, dayIndex)
          generateSlotsHelper(breakEnd, newSlot.end_time, dayIndex)
        } else {
          generateSlotsHelper(newSlot.start_time, newSlot.end_time, dayIndex)
        }
      }
    })
    
    setSlots([...slots, ...newSlots])
    setIsSlotModalOpen(false)
  }

  const handleClearDay = (day: number) => {
    if (confirm(`Voulez-vous vraiment supprimer tous les créneaux de ce jour ?`)) {
      setSlots(slots.filter(s => s.day_of_week !== day))
    }
  }

  const handleDuplicate = () => {
    if (duplicateSource === null || duplicateTargets.length === 0) return
    const sourceSlots = slots.filter(s => s.day_of_week === duplicateSource)
    
    // On retire les créneaux existants des cibles, puis on ajoute les dupliqués
    let newSlots = slots.filter(s => !duplicateTargets.includes(s.day_of_week))
    
    duplicateTargets.forEach(targetDay => {
      newSlots = [...newSlots, ...sourceSlots.map(s => ({ ...s, day_of_week: targetDay }))]
    })
    setSlots(newSlots)
    setDuplicateSource(null)
    setDuplicateTargets([])
    toast.success('Disponibilités copiées avec succès !')
  }

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const handleSaveSlots = async () => {
    setIsSaving(true)
    const result = await actions.saveSlots(slots)
    if (result.success) {
      toast.success('Disponibilités mises à jour avec succès')
    } else {
      toast.error(result.error || 'Erreur')
    }
    setIsSaving(false)
  }

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlockedDate) return
    toast.loading("Blocage en cours...")

    if (blockedType === 'period') {
      if (!newBlockedEndDate) { toast.error("Date de fin requise"); return; }
      
      const start = new Date(newBlockedDate)
      const end = new Date(newBlockedEndDate)
      const datesToBlock = []
      const curr = new Date(start)
      while (curr <= end) {
        datesToBlock.push(curr.toISOString().split('T')[0])
        curr.setDate(curr.getDate() + 1)
      }
      
      const result = await actions.addBlockedRange(datesToBlock)
      if (result.success) {
        toast.success("Période bloquée")
        const newBlocks = datesToBlock.map(d => ({ id: Date.now().toString() + d, date: new Date(d) }))
        setBlockedDates([...blockedDates, ...newBlocks])
        setNewBlockedDate('')
        setNewBlockedEndDate('')
      } else {
        toast.error(result.error || "Erreur")
      }
    } else {
      const sT = blockedType === 'hours' ? newBlockedStartTime : undefined
      const eT = blockedType === 'hours' ? newBlockedEndTime : undefined
      
      const result = await actions.addBlockedDate(newBlockedDate, sT, eT)
      if (result.success) {
        toast.success("Date bloquée")
        setBlockedDates([...blockedDates, { 
          id: Date.now().toString(), 
          date: new Date(newBlockedDate),
          start_time: sT,
          end_time: eT
        }])
        setNewBlockedDate('')
      } else {
        toast.error(result.error || "Erreur")
      }
    }
  }

  const handleRemoveBlockedDate = async (id: string) => {
    toast.loading("Déblocage en cours...")
    const result = await actions.removeBlockedDate(id)
    if(result.success) {
      toast.success("Date débloquée")
      setBlockedDates(blockedDates.filter(b => b.id !== id))
    } else {
      toast.error(result.error || "Erreur")
    }
  }

  // Filters
  const [dateFilter, setDateFilter] = useState<string>('')
  
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.order?.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = bookingFilter === 'all' ? true :
                         bookingFilter === 'upcoming' ? (b.status === 'confirmed' || b.status === 'pending') :
                         bookingFilter === 'completed' ? b.status === 'completed' :
                         b.status === 'cancelled';
    const matchesDate = !dateFilter ? true : b.booking_date.toISOString().startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  })

  const upcomingCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="space-y-8">
      {/* -------------------- MAIN TABS -------------------- */}
      <div className="flex gap-6 border-b border-line px-2">
        <button title="Action"
          onClick={() => setMainTab('reservations')}
          className={`pb-4 text-[13px] uppercase tracking-wider font-black transition-all relative flex items-center gap-2 ${
            mainTab === 'reservations' ? 'text-ink' : 'text-slate hover:text-ink'
          }`}
        >
          <CalendarDays size={18} />
          {role === 'client' ? 'Mes Réservations' : 'Réservations'}
          <span className="bg-line px-1.5 py-0.5 rounded-md text-[10px] ml-1">{bookings.length}</span>
          {mainTab === 'reservations' && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-ink rounded-t-full" />
          )}
        </button>
        {role !== 'client' && (
          <>
            <button title="Action"
              onClick={() => setMainTab('disponibilites')}
              className={`pb-4 text-[13px] uppercase tracking-wider font-black transition-all relative flex items-center gap-2 ${
                mainTab === 'disponibilites' ? 'text-ink' : 'text-slate hover:text-ink'
              }`}
            >
              <Clock4 size={18} />
              Mes Disponibilités
              {mainTab === 'disponibilites' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-ink rounded-t-full" />
              )}
            </button>
            <button title="Action"
              onClick={() => setMainTab('parametres')}
              className={`pb-4 text-[13px] uppercase tracking-wider font-black transition-all relative flex items-center gap-2 ${
                mainTab === 'parametres' ? 'text-ink' : 'text-slate hover:text-ink'
              }`}
            >
              <CalendarDays size={18} />
              Paramètres
              {mainTab === 'parametres' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-ink rounded-t-full" />
              )}
            </button>
          </>
        )}
      </div>

      {/* -------------------- RESERVATIONS TAB -------------------- */}
      {mainTab === 'reservations' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Reservation KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-line shadow-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase text-dust tracking-wider">À venir</span>
                <span className="text-3xl font-display font-black text-ink mt-1">{upcomingCount}</span>
              </div>
              <div className="w-14 h-14 bg-emerald/10 text-[#0F7A60] rounded-2xl flex items-center justify-center">
                <CalendarCheck size={28} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-line shadow-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase text-dust tracking-wider">Terminées</span>
                <span className="text-3xl font-display font-black text-ink mt-1">{completedCount}</span>
              </div>
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
            </div>
          </div>

          {/* Action Bar (Filters + Search) */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-2 rounded-2xl border border-line shadow-sm">
            <div className="flex flex-wrap gap-2 px-2">
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'upcoming', label: 'À venir' },
                { id: 'completed', label: 'Terminées' },
                { id: 'cancelled', label: 'Annulées' }
              ].map(tab => (
                <button title="Action"
                  key={tab.id}
                  onClick={() => setBookingFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    bookingFilter === tab.id ? 'bg-ink text-white shadow-md' : 'text-slate hover:bg-cream'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto px-2 pb-2 xl:px-0 xl:pb-0">
              <div className="relative w-full xl:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Rechercher un client..." 
                  className="w-full bg-cream border border-line text-ink rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald/10 focus:border-[#0F7A60] transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full xl:w-48 ml-0 xl:ml-2">
                <input 
                  type="date"
                  className="w-full bg-cream border border-line text-ink rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald/10 focus:border-[#0F7A60] transition-all"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  title="Filtrer par date"
                />
                {dateFilter && (
                  <button title="Effacer le filtre" onClick={() => setDateFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-dust hover:text-red-500 shadow-sm border border-line">
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
              
              <div className="hidden sm:flex items-center gap-1 bg-cream p-1 rounded-xl border border-line">
                <button title="Action" onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-ink' : 'text-dust hover:text-ink'}`}>
                  <LayoutGrid size={16} />
                </button>
                <button title="Action" onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-ink' : 'text-dust hover:text-ink'}`}>
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Bookings View */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-20 bg-cream/50 rounded-3xl border-2 border-dashed border-line">
              <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-dust">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-display font-black text-ink mb-2">Aucune réservation</h3>
              <p className="text-slate font-medium text-sm max-w-md mx-auto">
                Aucune session de coaching ne correspond à vos filtres actuels.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.map((b) => (
                <div key={b.id} className="relative bg-white rounded-3xl p-6 border border-line shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {updatingId === b.id && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl">
                      <RefreshCw size={24} className="text-[#0F7A60] animate-spin mb-2" />
                      <span className="text-xs font-bold text-ink">Mise à jour...</span>
                    </div>
                  )}

                  {/* Header: Date + Status */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-line">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-cream border border-line rounded-2xl flex flex-col items-center justify-center overflow-hidden shrink-0">
                        <div className="bg-[#0F7A60] w-full text-center text-[10px] text-white font-black uppercase py-0.5">
                          {format(new Date(b.booking_date), 'MMM', { locale: fr })}
                        </div>
                        <div className="text-xl font-display font-black text-ink mt-0.5">
                          {format(new Date(b.booking_date), 'dd')}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-ink">{b.start_time} - {b.end_time}</span>
                        <span className="text-xs font-bold text-slate uppercase tracking-wider">{format(new Date(b.booking_date), 'EEEE', { locale: fr })}</span>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_MAP[b.status]?.bg || 'bg-slate-100'} ${STATUS_MAP[b.status]?.color || 'text-slate'}`}>
                      {STATUS_MAP[b.status]?.label || b.status}
                    </div>
                  </div>

                  {/* Body: Product + Client */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider font-black text-dust mb-1">Prestation</h4>
                      <p className="font-bold text-ink line-clamp-1">{b.product?.name}</p>
                    </div>
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider font-black text-dust mb-1.5">Client</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cream border border-line flex items-center justify-center text-sm font-black text-ink uppercase">
                          {b.order?.buyer?.name?.substring(0, 2) || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-ink">{b.order?.buyer?.name || 'Client Inconnu'}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {b.order?.buyer?.phone && (
                              <a href={`https://wa.me/${b.order?.buyer?.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.order?.buyer?.name}, c'est pour vous rappeler notre session de demain à ${b.start_time}. À très vite !`)}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#25D366] hover:underline flex items-center gap-1">
                                WhatsApp
                              </a>
                            )}
                            {b.order?.buyer?.email && (
                              <span className="text-[10px] text-slate truncate max-w-[120px]">{b.order.buyer.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Actions */}
                  <div className="flex items-center gap-2">
                    {b.status === 'confirmed' ? (
                      <a href={b.product?.booking_link || `https://meet.jit.si/YayyamPro_${b.order?.id}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0F7A60] hover:bg-[#0c624d] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                        <Video size={16} /> Rejoindre {b.product?.booking_link ? '' : '(Jitsi)'}
                      </a>
                    ) : (
                      <button title="Action" disabled className="flex-1 flex items-center justify-center py-3 bg-cream text-dust rounded-xl text-xs font-black uppercase tracking-wider cursor-not-allowed">
                        Terminé/Annulé
                      </button>
                    )}

                    <div className="relative">
                      <button 
                        title="Sélectionner la date"
                        onClick={() => setActionMenuOpen(actionMenuOpen === b.id ? null : b.id)}
                        className="w-12 h-12 flex items-center justify-center bg-cream border border-line hover:border-dust rounded-xl transition-colors text-slate"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {/* Action Dropdown */}
                      {actionMenuOpen === b.id && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-line shadow-xl rounded-2xl p-2 z-[99] animate-in zoom-in-95 duration-200">
                          {b.order?.buyer?.phone && (
                            <a href={`https://wa.me/${b.order?.buyer?.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.order?.buyer?.name}, c'est pour vous rappeler notre session ${b.product?.name} de demain à ${b.start_time}. À très vite !`)}`} target="_blank" rel="noreferrer" className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#25D366] hover:bg-green-50 rounded-xl transition-colors mb-1">
                              <Phone size={16} /> Rappel WhatsApp
                            </a>
                          )}
                          {b.status !== 'completed' && (
                            <button title="Action" onClick={() => handleUpdateStatus(b.id, 'completed')} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-ink hover:bg-cream rounded-xl transition-colors">
                              <CheckCircle size={16} className="text-blue-500" /> Marquer Terminé
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button title="Action" onClick={() => handleUpdateStatus(b.id, 'cancelled')} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-1">
                              <XCircle size={16} /> Annuler session
                            </button>
                          )}
                          {(b.status === 'completed' || b.status === 'cancelled') && !b.order?.buyer?.phone && (
                            <div className="px-3 py-2 text-xs font-medium text-dust text-center">Aucune action dispo</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View logic would go here, simplified for brevity as the grid is usually preferred for agenda. I can add it if strictly needed, but let's fallback to grid mostly or a simplified table
            <div className="bg-white rounded-3xl border border-line shadow-sm overflow-hidden auto-rows-max">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-line bg-cream text-[10px] font-black uppercase tracking-widest text-dust">
                      <th className="px-6 py-5">Date & Heure</th>
                      <th className="px-6 py-5">Client</th>
                      <th className="px-6 py-5">Prestation</th>
                      <th className="px-6 py-5 text-center">Statut</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="group border-b border-line last:border-none transition-colors hover:bg-cream/40">
                         <td className="px-6 py-4">
                            <span className="font-bold text-ink">{format(new Date(b.booking_date), "dd MMM yyyy", { locale: fr })}</span>
                            <br/>
                            <span className="text-xs text-slate">{b.start_time} - {b.end_time}</span>
                         </td>
                         <td className="px-6 py-4">
                            <span className="font-black text-sm text-ink">{b.order?.buyer?.name}</span>
                            {b.order?.buyer?.email && <p className="text-xs text-slate">{b.order.buyer.email}</p>}
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate line-clamp-1">{b.product?.name}</span>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 inline-flex rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_MAP[b.status]?.bg || 'bg-slate-100'} ${STATUS_MAP[b.status]?.color || 'text-slate'}`}>
                              {STATUS_MAP[b.status]?.label || b.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex justify-end gap-2">
                             {b.status === 'confirmed' && (
                                <a href={b.product?.booking_link || `https://meet.jit.si/YayyamPro_${b.order?.id}`} target="_blank" rel="noreferrer" className="p-2 bg-[#0F7A60]/10 text-[#0F7A60] rounded-xl hover:bg-[#0F7A60]/20 transition-colors" title={b.product?.booking_link ? "Rejoindre" : "Jitsi Visio"}>
                                  <Video size={18} />
                                </a>
                             )}
                             {b.status !== 'completed' && b.status !== 'cancelled' && (
                                <button onClick={() => handleUpdateStatus(b.id, 'completed')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Terminer">
                                  <Check size={18} />
                                </button>
                             )}
                           </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- DISPONIBILITES TAB -------------------- */}
      {mainTab === 'disponibilites' && (
        <div className="bg-white rounded-3xl border border-line shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-cream/30 border-b border-line">
            <div>
              <h2 className="text-2xl font-display font-black text-ink tracking-tight">Semaine Type</h2>
              <p className="text-sm font-medium text-slate mt-1 max-w-xl">
                Configurez vos horaires de travail récurrents. Les clients ne pourront réserver que sur ces plages horaires.
              </p>
            </div>
            <button title="Action"
              onClick={() => handleSaveSlots()}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3.5 bg-ink hover:bg-slate text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap w-full md:w-auto justify-center"
            >
              {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>

          <div className="p-6 md:p-8 bg-[#FAFAF7] border-b border-line border-dashed">
            <h3 className="text-lg font-black text-ink flex items-center gap-2 mb-4">
              <CalendarOff size={20} className="text-red-500" />
              Indisponibilités exceptionnelles (Vacances, Congés)
            </h3>
            <p className="text-sm font-medium text-slate mb-6">Ajoutez des dates spécifiques où vous ne serez pas disponible. Aucun créneau ne sera généré sur ces jours.</p>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap gap-2 mb-2">
                <button title="Action"
                  onClick={() => setBlockedType('full_day')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all ${blockedType === 'full_day' ? 'border-red-500 bg-red-50 text-red-600' : 'border-line bg-white text-slate hover:border-red-200'}`}
                >
                  Journée complète
                </button>
                <button title="Action"
                  onClick={() => setBlockedType('period')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all ${blockedType === 'period' ? 'border-red-500 bg-red-50 text-red-600' : 'border-line bg-white text-slate hover:border-red-200'}`}
                >
                  Période
                </button>
                <button title="Action"
                  onClick={() => setBlockedType('hours')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all ${blockedType === 'hours' ? 'border-red-500 bg-red-50 text-red-600' : 'border-line bg-white text-slate hover:border-red-200'}`}
                >
                  Heures spécifiques
                </button>
              </div>

              <form onSubmit={handleAddBlockedDate} className="flex flex-wrap gap-3 items-end">
                {blockedType === 'full_day' && (
                  <div className="space-y-1 w-full sm:w-auto">
                    <label className="text-[10px] font-black uppercase text-dust">Date à bloquer</label>
                    <input title="Date de début" type="date" required value={newBlockedDate} onChange={e => setNewBlockedDate(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                )}
                
                {blockedType === 'period' && (
                  <>
                    <div className="space-y-1 w-full sm:w-auto">
                      <label className="text-[10px] font-black uppercase text-dust">Date de début</label>
                      <input title="Date de début" type="date" required value={newBlockedDate} onChange={e => setNewBlockedDate(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="space-y-1 w-full sm:w-auto">
                      <label className="text-[10px] font-black uppercase text-dust">Date de fin</label>
                      <input title="Date de fin" type="date" required value={newBlockedEndDate} onChange={e => setNewBlockedEndDate(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </>
                )}

                {blockedType === 'hours' && (
                  <>
                    <div className="space-y-1 w-full sm:w-auto">
                      <label className="text-[10px] font-black uppercase text-dust">Date</label>
                      <input title="Date de début" type="date" required value={newBlockedDate} onChange={e => setNewBlockedDate(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-dust">De</label>
                      <input title="Heure de début" type="time" required value={newBlockedStartTime} onChange={e => setNewBlockedStartTime(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-dust">À</label>
                      <input title="Heure de fin" type="time" required value={newBlockedEndTime} onChange={e => setNewBlockedEndTime(e.target.value)} className="w-full bg-white border border-line rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </>
                )}
                
                <button title="Action" type="submit" className="px-6 py-2.5 bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-red-600 transition-colors h-[40px] mt-4 sm:mt-0">
                  Bloquer
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-3">
              {blockedDates.length === 0 ? (
                <span className="text-sm text-dust italic">Aucune date bloquée.</span>
              ) : (
                blockedDates.map(b => (
                  <div key={b.id} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                    {(b as any).start_time ? (
                      <Clock size={14} />
                    ) : (
                      <CalendarOff size={14} />
                    )}
                    {format(new Date(b.date), 'dd MMM yyyy', { locale: fr })}
                    {(b as any).start_time && ` (${(b as any).start_time} - ${(b as any).end_time})`}
                    <button onClick={() => handleRemoveBlockedDate(b.id)} className="text-red-400 hover:text-red-600 transition-colors ml-1" title="Supprimer">
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="divide-y divide-line">
            {DAYS.map(day => {
              const daySlots = slots.filter(s => s.day_of_week === day.value).sort((a,b) => a.start_time.localeCompare(b.start_time))
              
              return (
                <div key={day.value} className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center transition-colors hover:bg-cream/20">
                  {/* Day Label */}
                  <div className="w-full lg:w-48 flex items-center justify-between lg:justify-start">
                    <span className="text-lg font-black text-ink">{day.label}</span>
                    <div className="flex gap-2 lg:hidden">
                      <button
                        onClick={() => handleClearDay(day.value)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
                        title="Vider la journée"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        title="Ajouter un créneau"
                        onClick={() => {
                          setNewSlot({ days_of_week: [day.value], start_time: '09:00', end_time: '17:00' })
                          setIsSlotModalOpen(true)
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-cream hover:bg-line text-ink rounded-xl transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Slots Container */}
                  <div className="flex-1 flex flex-wrap gap-3 w-full">
                    {daySlots.length === 0 ? (
                      <div className="text-sm font-bold text-dust px-4 py-3 bg-cream rounded-xl border border-dashed border-line">
                        Aucun créneau (Indisponible)
                      </div>
                    ) : (
                      daySlots.map((slot, idx) => {
                        const globalIndex = slots.findIndex(s => s === slot)
                        return (
                          <div key={idx} className="group relative flex items-center gap-2 bg-[#FAFAF7] border-2 border-line hover:border-[#0F7A60]/30 text-ink px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                            <Clock size={16} className="text-[#0F7A60]" />
                            {slot.start_time} - {slot.end_time}
                            
                            <button
                              title="Supprimer"
                              onClick={() => handleRemoveSlot(globalIndex)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-line text-dust hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden lg:flex flex-col gap-2">
                    <button title="Action"
                      onClick={() => {
                        setNewSlot({ days_of_week: [day.value], start_time: '09:00', end_time: '17:00' })
                        setIsSlotModalOpen(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate hover:text-ink hover:bg-cream border border-transparent hover:border-line rounded-xl transition-all"
                    >
                      <Plus size={16} /> Ajouter
                    </button>
                    {daySlots.length > 0 && (
                      <>
                        <button title="Action"
                          onClick={() => setDuplicateSource(duplicateSource === day.value ? null : day.value)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                            duplicateSource === day.value ? 'bg-ink text-white shadow-md' : 'text-slate hover:text-ink hover:bg-cream border border-transparent hover:border-line'
                          }`}
                        >
                          <RefreshCw size={16} /> Copier
                        </button>
                        <button title="Action"
                          onClick={() => handleClearDay(day.value)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} /> Vider
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Duplicate UI inline panel */}
                  {duplicateSource === day.value && (
                    <div className="w-full mt-4 p-4 bg-[#FAFAF7] border-2 border-dashed border-[#0F7A60]/30 rounded-2xl animate-in zoom-in-95 duration-200">
                      <p className="text-sm font-black text-ink mb-3">Copier les créneaux de {day.label} vers :</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {DAYS.filter(d => d.value !== day.value).map(d => (
                          <label key={d.value} className="flex items-center gap-2 px-3 py-2 bg-white border border-line rounded-lg cursor-pointer hover:border-[#0F7A60]/50">
                            <input
                              type="checkbox"
                              checked={duplicateTargets.includes(d.value)}
                              onChange={(e) => {
                                if (e.target.checked) setDuplicateTargets([...duplicateTargets, d.value])
                                else setDuplicateTargets(duplicateTargets.filter(t => t !== d.value))
                              }}
                              className="w-4 h-4 text-[#0F7A60] rounded focus:ring-[#0F7A60]"
                            />
                            <span className="text-sm font-bold text-slate">{d.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button title="Action" onClick={handleDuplicate} disabled={duplicateTargets.length === 0} className="px-4 py-2 bg-[#0F7A60] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#0c624d] disabled:opacity-50">Confirmer la copie</button>
                        <button title="Action" onClick={() => setDuplicateSource(null)} className="px-4 py-2 bg-white border border-line text-slate font-black text-xs uppercase tracking-wider rounded-xl hover:bg-cream">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {mainTab === 'parametres' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-[2rem] border border-line shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-display font-black text-ink">Limites de réservation</h3>
              <p className="text-sm font-medium text-slate mt-1">
                Configurez les règles globales de votre agenda pour protéger votre temps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-black text-dust">
                  Sessions max. par jour
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                  value={settings.maxPerDay}
                  onChange={(e) => setSettings({...settings, maxPerDay: parseInt(e.target.value) || 0})}
                  title="Sessions maximum par jour"
                />
                <p className="text-[11px] font-medium text-slate">
                  0 = Illimité. Si la limite est atteinte, la journée sera bloquée.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-black text-dust">
                  Délai de préavis minimum (Heures)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                  value={settings.minNotice}
                  onChange={(e) => setSettings({...settings, minNotice: parseInt(e.target.value) || 0})}
                  title="Délai de préavis minimum en heures"
                />
                <p className="text-[11px] font-medium text-slate">
                  Ex: 24 bloquera les réservations pour les prochaines 24h.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-black text-dust">
                  Réservation Max. (Jours)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                  value={settings.maxFutureDays}
                  onChange={(e) => setSettings({...settings, maxFutureDays: parseInt(e.target.value) || 60})}
                  title="Fenêtre de réservation maximale en jours"
                />
                <p className="text-[11px] font-medium text-slate">
                  Jusqu'à combien de jours à l'avance vos clients peuvent-ils réserver.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-black text-dust">
                  Battement automatique (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                  value={settings.bufferTime}
                  onChange={(e) => setSettings({...settings, bufferTime: parseInt(e.target.value) || 0})}
                  title="Temps de battement automatique en minutes"
                />
                <p className="text-[11px] font-medium text-slate">
                  S'ajoute avant et après chaque session pour vous laisser respirer.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-line">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-black text-ink">Approbation Automatique</label>
                  <p className="text-xs font-medium text-slate mt-1">Accepter les réservations directement ou manuellement.</p>
                </div>
                <div 
                  onClick={() => setSettings({...settings, autoAccept: !settings.autoAccept})} 
                  className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${settings.autoAccept ? 'bg-[#0F7A60]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.autoAccept ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSavingSettings}
                className="bg-[#0F7A60] text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-[#0c624d] transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                title="Enregistrer les paramètres"
              >
                {isSavingSettings ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SLOT MODAL */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative border border-white/20">
            
            <div className="px-8 pt-8 pb-4 relative z-10 bg-cream/30 border-b border-line">
              <h3 className="text-2xl font-display font-black text-ink tracking-tight">Ajouter un créneau</h3>
              <p className="text-sm font-medium text-slate mt-1">Définissez une nouvelle plage horaire.</p>
            </div>
            
            <form onSubmit={handleAddSlot} className="px-8 py-8 space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-black text-dust pl-1">Jours d'application</label>
                <div className="flex flex-wrap gap-2">
                  <button title="Action" 
                    type="button" 
                    onClick={() => setNewSlot({...newSlot, days_of_week: DAYS.map(d=>d.value)})} 
                    className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-line hover:bg-cream"
                  >
                    Tous
                  </button>
                  {DAYS.map(d => (
                    <button title="Action"
                      key={d.value}
                      type="button"
                      onClick={() => {
                        const days = newSlot.days_of_week.includes(d.value)
                          ? newSlot.days_of_week.filter(val => val !== d.value)
                          : [...newSlot.days_of_week, d.value];
                        setNewSlot({ ...newSlot, days_of_week: days })
                      }}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all ${
                        newSlot.days_of_week.includes(d.value)
                        ? 'border-[#0F7A60] bg-[#0F7A60]/10 text-[#0F7A60]'
                        : 'border-line bg-white text-slate hover:border-[#0F7A60]/30'
                      }`}
                    >
                      {d.label.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider font-black text-dust pl-1">Début</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
                    <input
                      title="Heure de début"
                      type="time"
                      required
                      className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl pl-11 pr-4 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                      value={newSlot.start_time}
                      onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider font-black text-dust pl-1">Fin</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dust pointer-events-none" />
                    <input
                      title="Heure de fin"
                      type="time"
                      required
                      className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-2xl pl-11 pr-4 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#0F7A60]/10 focus:border-[#0F7A60] transition-all"
                      value={newSlot.end_time}
                      onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-line">
                <label className="block text-[11px] uppercase tracking-wider font-black text-dust pl-1">Diviser en sous-créneaux de :</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: 'Ne pas diviser' },
                    { val: 15, label: '15 min' },
                    { val: 30, label: '30 min' },
                    { val: 45, label: '45 min' },
                    { val: 60, label: '1 heure' },
                    { val: 90, label: '1h30' },
                  ].map(opt => (
                    <button title="Action"
                      key={opt.val}
                      type="button"
                      onClick={() => setSlotInterval(opt.val)}
                      className={`py-2 text-xs font-black rounded-xl border-2 transition-all ${
                        slotInterval === opt.val 
                        ? 'border-[#0F7A60] bg-[#0F7A60]/10 text-[#0F7A60]' 
                        : 'border-line bg-white text-slate hover:border-[#0F7A60]/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Autre durée (min)"
                    min="1"
                    title="Durée personnalisée"
                    className="flex-1 bg-white border border-line text-ink rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F7A60] transition-all"
                    value={slotInterval > 0 && ![15, 30, 45, 60, 90].includes(slotInterval) ? slotInterval : ''}
                    onChange={e => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val)) setSlotInterval(val)
                      else setSlotInterval(0)
                    }}
                  />
                  {slotInterval > 0 && ![15, 30, 45, 60, 90].includes(slotInterval) && (
                    <span className="text-[10px] font-bold text-white bg-[#0F7A60] px-2 py-1 rounded-md">Sélectionné : {slotInterval}m</span>
                  )}
                </div>
                
                {slotInterval > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line/50">
                    <label className="text-[11px] uppercase tracking-wider font-black text-dust whitespace-nowrap">Temps de pause :</label>
                    <input
                      type="number"
                      placeholder="min"
                      min="0"
                      title="Temps de pause (Buffer Time)"
                      className="w-20 bg-white border border-line text-ink rounded-xl px-3 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F7A60] transition-all"
                      value={bufferTime === 0 ? '' : bufferTime}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        setBufferTime(isNaN(val) ? 0 : val)
                      }}
                    />
                    <span className="text-xs font-medium text-slate">minutes entre chaque session</span>
                  </div>
                )}

                {slotInterval > 0 && (
                  <div className="mt-4 pt-4 border-t border-line/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] uppercase tracking-wider font-black text-ink flex items-center gap-2">
                        <Clock className="text-amber-500" size={16} /> Grande Pause (ex: Déjeuner)
                      </label>
                      <input
                        type="checkbox"
                        title="Activer la grande pause"
                        checked={hasBigBreak}
                        onChange={e => setHasBigBreak(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                      />
                    </div>
                    
                    {hasBigBreak && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-dust">Début de pause</label>
                          <input title="Début de la pause" type="time" required={hasBigBreak} value={breakStart} onChange={e => setBreakStart(e.target.value)} className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-dust">Fin de pause</label>
                          <input title="Fin de la pause" type="time" required={hasBigBreak} value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="w-full bg-[#FAFAF7] border-2 border-line text-ink rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {slotInterval > 0 && (
                  <p className="text-[10px] font-bold text-dust mt-4 bg-cream p-2 rounded-lg leading-relaxed">
                    💡 La plage {newSlot.start_time} - {newSlot.end_time} sera automatiquement coupée en morceaux de {slotInterval} minutes{bufferTime > 0 ? ` avec ${bufferTime} min de battement par session` : ''}{hasBigBreak ? `, en sautant la pause de ${breakStart} à ${breakEnd}` : ''}.
                  </p>
                )}
              </div>
              
              <div className="flex gap-4 pt-4">
                <button title="Action"
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="flex-1 py-4 bg-white border-2 border-line text-slate hover:text-ink hover:border-[#0F7A60]/30 font-black rounded-2xl transition-colors active:scale-95"
                >
                  Annuler
                </button>
                <button title="Action"
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#0F7A60] hover:bg-[#0c624d] text-white font-black rounded-2xl transition-colors shadow-lg active:scale-95"
                >
                  <Plus size={18} /> Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
