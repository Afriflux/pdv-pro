import { getAgendaSlots, getUpcomingBookings, getBlockedDates, getAgendaSettings, saveAgendaSlots, updateBookingStatus, addBlockedDate, removeBlockedDate, addBlockedDatesRange, updateAgendaSettings } from '@/lib/coaching/agendaActions'
import { UniversalAgenda } from '@/components/shared/agenda/UniversalAgenda'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarDays } from 'lucide-react'

export const metadata = {
  title: 'Mon Agenda | Yayyam',
}

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const [slots, bookings, blockedDates, settings] = await Promise.all([
      getAgendaSlots(),
      getUpcomingBookings(),
      getBlockedDates(),
      getAgendaSettings()
    ])

    return (
      <div className="w-full flex justify-center">
        <div className="w-full pt-4 sm:pt-6 md:pt-14 px-2 sm:px-4 md:px-8 space-y-6 sm:space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-cream/50 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-dust/30">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center shrink-0 border border-line rotate-3">
                <CalendarDays size={36} className="text-ink" />
              </div>
              <div className="flex flex-col max-w-xl">
                <h1 className="text-3xl md:text-5xl font-display font-black text-ink tracking-tight mb-2">
                  Mon Agenda
                </h1>
                <p className="text-slate font-medium text-sm md:text-base leading-relaxed">
                  Gérez vos disponibilités et suivez vos prochaines sessions de coaching ou de prestation de services. 
                </p>
              </div>
            </div>
          </div>

          <UniversalAgenda 
            initialSlots={slots} 
            initialBookings={bookings as any} 
            initialBlockedDates={blockedDates as any}
            initialSettings={settings || undefined}
            role="vendor"
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
    console.error("Agenda Page Error:", error)
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-screen bg-gray-50">
        <h2 className="text-xl font-bold text-red-600 mb-2">Erreur de chargement de l'Agenda</h2>
        <p className="text-gray-600 max-w-lg mx-auto bg-red-50 p-4 rounded-xl text-sm border border-red-200">
          {error?.message || "Une erreur inconnue s'est produite."}
        </p>
        <p className="text-sm font-bold mt-6 text-gray-800">
          ⚠️ Action requise : Stoppez votre terminal (Ctrl+C) et relancez <code>npm run dev</code>. 
          Le client de base de données (Prisma) doit être rechargé pour prendre en compte les nouveaux paramètres.
        </p>
      </div>
    )
  }
}
