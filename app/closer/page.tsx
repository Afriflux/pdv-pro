import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

import CloserDashboardClient from './CloserDashboardClient'

export const dynamic = 'force-dynamic'

export default async function CloserDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Récupération des stats du Closer
  const myLeads = await prisma.lead.findMany({
    where: { closer_id: user.id },
    include: { Product: true }
  })

  // KPIs
  const activeLeads = myLeads.filter(l => l.status === 'contacted' || l.status === 'qualified' || l.status === 'new')
  
  // Total commissions depuis le statut "won" (ou calcul théorique)
  const wonLeads = myLeads.filter(l => l.status === 'won')
  const totalCommissions = wonLeads.reduce((sum, l) => {
    // Si la colonne commission_amount existe, on l'utilise
    if ((l as any).commission_amount) return sum + (l as any).commission_amount
    // Sinon calcul théorique (10% par défaut pour le mock)
    return sum + ((l.Product?.price || 0) * 0.1) 
  }, 0)

  const lostLeads = myLeads.filter(l => l.status === 'lost')
  
  const totalResolved = wonLeads.length + lostLeads.length
  const winRate = totalResolved > 0 ? Math.round((wonLeads.length / totalResolved) * 100) : 0

  // Estimation du pipeline (valeur potentielle des leads actifs en termes de commissions)
  const pipelineValue = activeLeads.reduce((sum, l) => {
    if ((l as any).commission_amount) return sum + (l as any).commission_amount
    return sum + ((l.Product?.price || 0) * 0.1) 
  }, 0)

  return (
    <CloserDashboardClient 
      user={user}
      activeLeads={activeLeads}
      totalCommissions={totalCommissions}
      totalResolved={totalResolved}
      winRate={winRate}
      pipelineValue={pipelineValue}
    />
  )
}
