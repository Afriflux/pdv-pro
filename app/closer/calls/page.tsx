import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PhoneCall, Calendar, Search, Filter, MessageCircle, Target, Inbox, Clock } from 'lucide-react'
import CloserCallsClient from './CloserCallsClient'

export const dynamic = 'force-dynamic'

export default async function CloserCallsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Récupération des leads "En négociation" (contacted ou qualified)
  const activeLeads = await prisma.lead.findMany({
    where: {
      closer_id: user.id,
      status: { in: ['contacted', 'qualified'] },
    },
    include: {
      Store: { select: { name: true } },
      Product: { select: { name: true, price: true } }
    },
    orderBy: {
      updated_at: 'desc' // Les plus récents en premier
    }
  })

  // Aujourd'hui à minuit pour comparer
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Dans un système avancé, on aurait un `callback_date`. Pour l'instant on simule avec `updated_at`.
  // Tous les leads ici sont techniquement "À relancer".

  return (
    <CloserCallsClient activeLeads={activeLeads} />
  )
}
