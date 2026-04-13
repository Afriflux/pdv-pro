import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import nextDynamic from 'next/dynamic'

const CloserAnalyticsClient = nextDynamic(() => import('./CloserAnalyticsClient'), { ssr: false, loading: () => <div className="animate-pulse h-[500px] w-full bg-gray-50"/> })

export const dynamic = 'force-dynamic'

export default async function CloserAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // --- 1. Fetching all leads claimed by this closer ---
  const leads = await prisma.lead.findMany({ take: 50, 
    where: { closer_id: user.id },
    orderBy: { claimed_at: 'asc' } // chronological order for charts
  })

  // --- 2. Computing Core Stats ---
  const totalLeads = leads.length
  let wonLeads = 0
  let lostLeads = 0
  let totalCommission = 0

  leads.forEach(lead => {
    if (lead.status === 'won') {
      wonLeads++
      totalCommission += (lead.commission_amount || 0)
    } else if (lead.status === 'lost') {
      lostLeads++
    }
  })

  // Avoid division by zero
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  const stats = {
    totalLeads,
    wonLeads,
    lostLeads,
    totalCommission,
    conversionRate
  }

  // --- 3. Building Chart Data (Last 14 days by default roughly) ---
  const chartDataMap: Record<string, { total: number, won: number }> = {}
  
  // Group by day (using claimed_at)
  leads.forEach(lead => {
    // Only process leads with a claimed_at date
    if (!lead.claimed_at) return
    const dateStr = new Date(lead.claimed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    
    if (!chartDataMap[dateStr]) {
      chartDataMap[dateStr] = { total: 0, won: 0 }
    }
    
    chartDataMap[dateStr].total++
    if (lead.status === 'won') {
      chartDataMap[dateStr].won++
    }
  })

  // Convert map to array for Recharts
  const chartData = Object.entries(chartDataMap).map(([date, data]) => ({
    date,
    total: data.total,
    won: data.won
  }))

  return (
    <CloserAnalyticsClient 
      stats={stats} 
      chartData={chartData} 
      recentActivity={[]} // optional, can be passed if needed
    />
  )
}
