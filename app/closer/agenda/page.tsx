import { getAgendaSlots, getUpcomingBookings, getBlockedDates, getAgendaSettings, saveAgendaSlots, updateBookingStatus, addBlockedDate, removeBlockedDate, addBlockedDatesRange, updateAgendaSettings } from '@/lib/coaching/agendaActions'
import { UniversalAgenda } from '@/components/shared/agenda/UniversalAgenda'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays } from 'lucide-react'

export const metadata = {
  title: 'Agenda Closer | Yayyam',
}

export default async function CloserAgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const [slots, bookings, blockedDates, settings] = await Promise.all([
      getAgendaSlots(),
      getUpcomingBookings(), // Peut être adapté pour des bookings de closer spécifiques
      getBlockedDates(),
      getAgendaSettings()
    ])

    return (
      <div className="w-full h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-500">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-line flex items-center justify-center text-teal-600 shrink-0">
               <CalendarDays size={24} />
             </div>
             <div>
               <h1 className="text-3xl font-display font-black text-ink tracking-tight">Mon Agenda</h1>
               <p className="text-slate font-medium text-sm md:text-base">Gérez vos créneaux d'appels clients et vos disponibilités de closing.</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-line p-4 md:p-8 shadow-sm">
          <UniversalAgenda 
            initialSlots={slots} 
            initialBookings={bookings as any} 
            initialBlockedDates={blockedDates as any}
            initialSettings={settings || undefined}
            role="vendor" // Le Closer a besoin de configurer ses slots comme un Vendeur. "closer" peut être ajouté dans UniversalAgenda plus tard si besoin de restrictions poussées.
            actions={{
              saveSlots: saveAgendaSlots,
              updateStatus: updateBookingStatus,
              addBlockedDate: addBlockedDate,
              removeBlockedDate: removeBlockedDate,
              addBlockedRange: addBlockedDatesRange,
              updateSettings: updateAgendaSettings
            }}
          />
        </div>
      </div>
    )
  } catch (error: any) {
    console.error("Closer Agenda Page Error:", error)
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <h2 className="text-xl font-bold text-red-600 mb-2">Erreur de chargement de l'Agenda</h2>
        <p className="text-gray-600 max-w-lg mx-auto bg-red-50 p-4 rounded-xl text-sm border border-red-200">
          {error?.message || "Une erreur inconnue s'est produite."}
        </p>
      </div>
    )
  }
}
