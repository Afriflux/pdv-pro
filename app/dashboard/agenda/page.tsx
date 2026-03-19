import { getAgendaSlots, getUpcomingBookings } from '@/lib/coaching/agendaActions'
import { AgendaManager } from './AgendaManager'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Mon Agenda | PDV Pro',
}

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const slots = await getAgendaSlots()
    const bookings = await getUpcomingBookings()

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mon Agenda</h1>
          <p className="mt-2 text-gray-500 font-medium">
            Gérez vos disponibilités et suivez vos prochaines sessions de coaching.
          </p>
        </div>

        <AgendaManager initialSlots={slots} initialBookings={bookings} />
      </div>
    )
  } catch (error) {
    console.error(error)
    redirect('/dashboard')
  }
}
