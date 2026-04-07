import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UniversalAgenda } from '@/components/shared/agenda/UniversalAgenda'
import { dummySaveSlots, dummyUpdateStatus, dummyAddBlockedDate, dummyRemoveBlockedDate, dummyAddBlockedRange, dummyUpdateSettings } from '@/app/actions/dummy'
// Removed CalendarDays

export const metadata = {
  title: 'Mes Réservations | Espace Client',
}

export default async function ClientAgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bookings = await prisma.booking.findMany({
    where: { 
      order: { buyer_id: user.id } 
    },
    orderBy: [{ booking_date: 'asc' }, { start_time: 'asc' }],
    include: {
      order: {
        select: {
          id: true,
          total: true,
          status: true,
          buyer: {
            select: { name: true, phone: true, email: true }
          }
        }
      },
      product: { select: { name: true, booking_link: true } }
    }
  })

  // Dummy actions since client is read-only

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-6 md:p-10 max-w-[1400px] mx-auto z-10 relative">
      <header className="mb-10 w-full relative z-10 flex flex-col justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tighter mb-2">Mes Réservations</h1>
          <p className="text-gray-500 font-medium text-lg">Retrouvez toutes vos sessions de coaching et appels avec vos vendeurs.</p>
        </div>
      </header>

      <main className="w-full">
        <UniversalAgenda 
          initialSlots={[]} 
          initialBookings={bookings as any} 
          initialBlockedDates={[]}
          initialSettings={undefined}
          role="client"
          actions={{
            saveSlots: dummySaveSlots,
            updateStatus: dummyUpdateStatus,
            addBlockedDate: dummyAddBlockedDate,
            removeBlockedDate: dummyRemoveBlockedDate,
            addBlockedRange: dummyAddBlockedRange,
            updateSettings: dummyUpdateSettings
          }}
        />
      </main>
    </div>
  )
}
