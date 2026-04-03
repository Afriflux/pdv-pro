import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export const metadata = {
  title: 'Analytics | PDV Affilié',
}

export const dynamic = 'force-dynamic'

export default async function AffiliateAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient()

  // 1. Récupération de l'affilié
  const { data: affiliate } = await supabaseAdmin
    .from('Affiliate')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/60 mt-8">
        <h2 className="text-xl font-black text-gray-900 mb-2">Compte non rattaché</h2>
        <p className="text-gray-500 mb-6 font-medium">Vous devez d'abord obtenir un lien d'affiliation depuis un vendeur.</p>
      </div>
    )
  }

  // Plage de 30 jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateStr = thirtyDaysAgo.toISOString()

  // 2. Fetcher les Clics des 30 derniers jours
  const { data: clickLogs } = await supabaseAdmin
    .from('AffiliateClickLog')
    .select('created_at, source')
    .eq('affiliate_id', affiliate.id)
    .gte('created_at', dateStr)

  // 3. Fetcher les Ventes (Commandes) des 30 derniers jours
  const { data: orders } = await supabaseAdmin
    .from('Order')
    .select('created_at, affiliate_amount, status, affiliate_subid')
    .eq('affiliate_token', affiliate.token)
    .gte('created_at', dateStr)

  const processData = () => {
    const clicksByDate = new Map<string, number>()
    const conversionsByDate = new Map<string, { count: number, revenue: number }>()
    
    // Nouveaux groupements pour le tracking par source (Sub-ID)
    const statsBySource = new Map<string, { clicks: number, sales: number, revenue: number }>()

    let totalVentes = 0
    let totalRevenue = 0

    // Remplir avec 0 pour les 30 derniers jours
    for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateKey = d.toISOString().split('T')[0]
        clicksByDate.set(dateKey, 0)
        conversionsByDate.set(dateKey, { count: 0, revenue: 0 })
    }

    // Grouper les clics
    if (clickLogs) {
      clickLogs.forEach((log: any) => {
        const dateKey = log.created_at.split('T')[0]
        if (clicksByDate.has(dateKey)) {
          clicksByDate.set(dateKey, clicksByDate.get(dateKey)! + 1)
        }

        // Stats par Source (Sub-ID)
        const src = log.source || 'Organique'
        const srcStat = statsBySource.get(src) || { clicks: 0, sales: 0, revenue: 0 }
        srcStat.clicks += 1
        statsBySource.set(src, srcStat)
      })
    }

    // Grouper les ventes (uniquement les Delivered ? Ou toutes les "confirmed" ?)
    // En général on compte les conversions "Confirmed" comme intent d'achat, et le revenu validé comme "Delivered"
    if (orders) {
      orders.forEach((o: any) => {
        const dateKey = o.created_at.split('T')[0]
        if (conversionsByDate.has(dateKey)) {
          const current = conversionsByDate.get(dateKey)!
          
          // Compter comme conversion brute
          current.count += 1
          totalVentes += 1
          
          // Compter le revenu que si c'est validé et non annulé
          // Note : on va compter livré comme revenu strict
          if (o.status === 'delivered') {
             current.revenue += (o.affiliate_amount || 0)
             totalRevenue += (o.affiliate_amount || 0)
          }

          conversionsByDate.set(dateKey, current)
        }

        // Stats par Source (Ventes)
        const src = o.affiliate_subid || 'Organique'
        const srcStat = statsBySource.get(src) || { clicks: 0, sales: 0, revenue: 0 }
        srcStat.sales += 1
        if (o.status === 'delivered') {
           srcStat.revenue += (o.affiliate_amount || 0)
        }
        statsBySource.set(src, srcStat)
      })
    }

    const clickDataArray = Array.from(clicksByDate.entries()).map(([date, count]) => ({ date, count }))
    const convDataArray = Array.from(conversionsByDate.entries()).map(([date, val]) => ({ date, count: val.count, revenue: val.revenue }))

    const totalClicks = clickLogs?.length || 0
    const conversionRate = totalClicks > 0 ? (totalVentes / totalClicks) * 100 : 0
    // EPC basé sur le total brut des commandes apportées (ou seulement les payées)
    const epc = totalClicks > 0 ? (totalRevenue / totalClicks) : 0

    // Convertir la map Source en tableau pour le frontend
    const sourcesData = Array.from(statsBySource.entries()).map(([source, stats]) => ({
      source,
      clicks: stats.clicks,
      sales: stats.sales,
      revenue: stats.revenue,
      epc: stats.clicks > 0 ? (stats.revenue / stats.clicks) : 0,
      cr: stats.clicks > 0 ? ((stats.sales / stats.clicks) * 100) : 0
    })).sort((a, b) => b.revenue - a.revenue)

    return {
      clicks: clickDataArray,
      conversions: convDataArray,
      sources: sourcesData,
      summary: {
        totalClicks,
        totalVentes,
        totalRevenue,
        epc,
        conversionRate
      }
    }
  }

  const analyticsData = processData()

  return (
    <div className="flex flex-col flex-1 w-full max-w-[1400px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-8 max-w-full">
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
         <h1 className="text-3xl sm:text-4xl font-black text-[#041D14] tracking-tight mb-2">Performances & Analytics</h1>
         <p className="text-gray-500 text-[15px] font-medium max-w-2xl">
           Observez vos performances en temps réel sur les 30 derniers jours. Suivez votre taux de conversion (CR) et vos gains par clic (EPC).
         </p>
      </div>
      
      <AnalyticsClient data={analyticsData} />
    </div>
  )
}
