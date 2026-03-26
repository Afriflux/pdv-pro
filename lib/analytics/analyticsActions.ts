'use server'

// ─── lib/analytics/analyticsActions.ts ───────────────────────────────────────
// Service centralisé d'analytics PDV Pro
// Tous les vendeurs ont accès jusqu'à 90 jours (aucune restriction de plan)

import { createClient } from '@/lib/supabase/server'

// ─── Types exportés ───────────────────────────────────────────────────────────

export interface AnalyticsData {
  storeName: string
  kpis: {
    views:           number
    viewsTrend:      number
    sales:           number
    salesTrend:      number
    revenue:         number
    revenueTrend:    number
    conversion:      number
    conversionTrend: number
    bumpRate:        number
    codClosingRate:  number
  }
  chartData:   { date: string; revenue: number }[]
  topProducts: { id: string; name: string; sales: number; revenue: number }[]
  sources:     { name: string; value: number }[]
  topPages:    { name: string; views: number; conversion: number }[]
  geography:   { city: string; value: number }[]
  funnel: {
    views:     number
    checkouts: number
    purchases: number
  }
  affiliates: { name: string; clicks: number; sales: number; commission: number }[]
  promos:     { code: string; uses: number; discount: number }[]
}

// ─── Types internes Supabase ──────────────────────────────────────────────────

interface PageRow    { id: string; title: string }
interface PageStat   { page_id: string; visits: number; purchases: number; date: string }
interface ClickRow   { source: string | null; city: string | null; created_at: string }
interface AffRow     { user: { name?: string } | null; clicks: number; conversions: number; total_earned: number }

interface OrderRow {
  id:           string
  product_id:   string
  bump_product_id: string | null
  vendor_amount: number
  status:        string
  payment_method: string
  created_at:    string
  promo_discount: number | null
  product:       { name?: string } | null
  promo_code:    { code?: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysAgo(days: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const SUCCESSFUL_STATUSES = ['confirmed', 'preparing', 'shipped', 'delivered'] as const

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Récupère les données d'analyse pour une boutique.
 * Tous les vendeurs ont accès jusqu'à 90 jours (aucune restriction de plan).
 *
 * @param storeId  UUID de la boutique
 * @param daysParam Période demandée (par défaut 7, max 90)
 */
export async function getStoreAnalytics(
  storeId: string,
  daysParam: number = 7,
): Promise<AnalyticsData> {
  const supabase = await createClient()

  // Tous les vendeurs : max 90 jours
  const daysLimit = Math.min(daysParam, 90)

  const currentStart  = getDaysAgo(daysLimit)
  const previousStart = getDaysAgo(daysLimit * 2)
  const previousEnd   = new Date(currentStart)
  previousEnd.setUTCMilliseconds(-1)

  // ── 0. Nom de la boutique ─────────────────────────────────────────────────

  const { data: storeRow } = await supabase
    .from('Store')
    .select('name')
    .eq('id', storeId)
    .single()

  const storeName = (storeRow as { name: string } | null)?.name ?? 'Ma boutique'

  // ── 1. Pages + PageAnalytics ──────────────────────────────────────────────

  const { data: pagesRaw } = await supabase
    .from('SalePage')
    .select('id, title')
    .eq('store_id', storeId)

  const pages   = (pagesRaw ?? []) as PageRow[]
  const pageIds = pages.map(p => p.id)

  const { data: pageStatsRaw } = pageIds.length > 0
    ? await supabase
        .from('PageAnalytics')
        .select('page_id, visits, purchases, date')
        .in('page_id', pageIds)
        .gte('date', previousStart.toISOString())
    : { data: [] }

  const pageStats = (pageStatsRaw ?? []) as PageStat[]

  // ── 2. Commandes ─────────────────────────────────────────────────────────

  const { data: ordersRaw } = await supabase
    .from('Order')
    .select(`
      id, product_id, bump_product_id, vendor_amount, status, payment_method, created_at, promo_discount,
      product:Product(name),
      promo_code:PromoCode(code)
    `)
    .eq('store_id', storeId)
    .gte('created_at', previousStart.toISOString())

  const orders = (ordersRaw ?? []) as OrderRow[]

  // ── 3. Affiliates ─────────────────────────────────────────────────────────

  const { data: affiliatesRaw } = await supabase
    .from('Affiliate')
    .select('user:User(name), clicks, conversions, total_earned')
    .eq('vendor_id', storeId)
    .eq('status', 'active')

  const affiliatesRows = (affiliatesRaw ?? []) as AffRow[]

  // ── 4. ClickAnalytics ─────────────────────────────────────────────────────

  const { data: linksRaw } = await supabase
    .from('ShortLink')
    .select('id')
    .eq('store_id', storeId)

  const linkIds = (linksRaw ?? []).map((l: { id: string }) => l.id)

  const { data: clicksRaw } = linkIds.length > 0
    ? await supabase
        .from('ClickAnalytics')
        .select('source, city, created_at')
        .in('short_link_id', linkIds)
        .gte('created_at', currentStart.toISOString())
    : { data: [] }

  const clicksData = (clicksRaw ?? []) as ClickRow[]

  // ─── CALCULS EN MÉMOIRE ───────────────────────────────────────────────────

  const isCurrent = (d: string) => new Date(d) >= currentStart
  const isPrev    = (d: string) => {
    const date = new Date(d)
    return date >= previousStart && date <= previousEnd
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────

  let currentViews = 0, prevViews = 0
  pageStats.forEach(ps => {
    if (isCurrent(ps.date))   currentViews += ps.visits
    else if (isPrev(ps.date)) prevViews    += ps.visits
  })

  let currentSales = 0, prevSales = 0
  let currentRevenue = 0, prevRevenue = 0

  orders.forEach(o => {
    const isSuccess = SUCCESSFUL_STATUSES.includes(
      o.status as typeof SUCCESSFUL_STATUSES[number]
    )
    if (isCurrent(o.created_at)) {
      if (isSuccess) { currentSales++; currentRevenue += o.vendor_amount }
    } else if (isPrev(o.created_at)) {
      if (isSuccess) { prevSales++;    prevRevenue    += o.vendor_amount }
    }
  })

  const currentConv = currentViews > 0 ? (currentSales / currentViews) * 100 : 0
  const prevConv    = prevViews    > 0 ? (prevSales    / prevViews)    * 100 : 0

  let currentAddons = 0
  let currentCodTotal = 0
  let currentCodClosed = 0

  orders.filter(o => isCurrent(o.created_at)).forEach(o => {
    if (o.bump_product_id) currentAddons++
    if (o.payment_method === 'cod') {
      currentCodTotal++
      if (['delivered', 'completed', 'cod_confirmed'].includes(o.status)) {
        currentCodClosed++
      }
    }
  })

  // Le taux d'ajouts bump sur le nombre total de commandes avec bump sur la période
  const orderCountCurrent = orders.filter(o => isCurrent(o.created_at)).length
  const bumpRate = orderCountCurrent > 0 ? (currentAddons / orderCountCurrent) * 100 : 0
  const codClosingRate = currentCodTotal > 0 ? (currentCodClosed / currentCodTotal) * 100 : 0

  const kpis = {
    views:           currentViews,
    viewsTrend:      calculateTrend(currentViews, prevViews),
    sales:           currentSales,
    salesTrend:      calculateTrend(currentSales, prevSales),
    revenue:         currentRevenue,
    revenueTrend:    calculateTrend(currentRevenue, prevRevenue),
    conversion:      currentConv,
    conversionTrend: currentConv - prevConv,
    bumpRate,
    codClosingRate,
  }

  // ── Chart (revenus journaliers) ────────────────────────────────────────────

  const dailyRev: Record<string, number> = {}
  orders
    .filter(o =>
      isCurrent(o.created_at) &&
      SUCCESSFUL_STATUSES.includes(o.status as typeof SUCCESSFUL_STATUSES[number])
    )
    .forEach(o => {
      const day = o.created_at.split('T')[0]
      dailyRev[day] = (dailyRev[day] ?? 0) + o.vendor_amount
    })

  const chartData: { date: string; revenue: number }[] = []
  for (let i = 0; i < daysLimit; i++) {
    const d = new Date(currentStart)
    d.setDate(d.getDate() + i)
    const dayStr = d.toISOString().split('T')[0]
    chartData.push({ date: dayStr, revenue: dailyRev[dayStr] ?? 0 })
  }

  // ── Top produits ────────────────────────────────────────────────────────────

  const productStats: Record<string, { id: string; name: string; sales: number; revenue: number }> = {}
  orders
    .filter(o =>
      isCurrent(o.created_at) &&
      SUCCESSFUL_STATUSES.includes(o.status as typeof SUCCESSFUL_STATUSES[number])
    )
    .forEach(o => {
      if (!productStats[o.product_id]) {
        const name = o.product?.name ?? 'Inconnu'
        productStats[o.product_id] = { id: o.product_id, name, sales: 0, revenue: 0 }
      }
      productStats[o.product_id].sales++
      productStats[o.product_id].revenue += o.vendor_amount
    })

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ── Sources de trafic ────────────────────────────────────────────────────────

  const sourceStats: Record<string, number> = {}
  clicksData.forEach(c => {
    const s = c.source ?? 'Direct'
    sourceStats[s] = (sourceStats[s] ?? 0) + 1
  })
  const sources = Object.entries(sourceStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // ── Top pages ────────────────────────────────────────────────────────────────

  const pagesAgg: Record<string, { views: number; convCount: number }> = {}
  pageStats.filter(ps => isCurrent(ps.date)).forEach(ps => {
    if (!pagesAgg[ps.page_id]) pagesAgg[ps.page_id] = { views: 0, convCount: 0 }
    pagesAgg[ps.page_id].views    += ps.visits
    pagesAgg[ps.page_id].convCount += ps.purchases
  })

  const topPages = Object.entries(pagesAgg)
    .map(([id, st]) => ({
      name:       pages.find(p => p.id === id)?.title ?? 'Page inconnue',
      views:      st.views,
      conversion: st.views > 0 ? (st.convCount / st.views) * 100 : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  // ── Géographie ───────────────────────────────────────────────────────────────

  const cityStats: Record<string, number> = {}
  clicksData.forEach(c => {
    const city = c.city ?? 'Inconnue'
    cityStats[city] = (cityStats[city] ?? 0) + 1
  })
  const geography = Object.entries(cityStats)
    .map(([city, value]) => ({ city, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // ── Entonnoir ─────────────────────────────────────────────────────────────────

  const funnelCheckouts = orders.filter(o => isCurrent(o.created_at)).length
  const funnel = {
    views:     currentViews,
    checkouts: funnelCheckouts,
    purchases: currentSales,
  }

  // ── Affiliates ────────────────────────────────────────────────────────────────

  const affiliates = affiliatesRows
    .map(a => ({
      name:       a.user?.name ?? 'Inconnu',
      clicks:     a.clicks,
      sales:      a.conversions,
      commission: a.total_earned,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  // ── Codes promo ───────────────────────────────────────────────────────────────

  const promoStats: Record<string, { uses: number; discount: number }> = {}
  orders.filter(o => isCurrent(o.created_at)).forEach(o => {
    const code = o.promo_code?.code
    if (code) {
      if (!promoStats[code]) promoStats[code] = { uses: 0, discount: 0 }
      promoStats[code].uses++
      promoStats[code].discount += o.promo_discount ?? 0
    }
  })
  const promos = Object.entries(promoStats)
    .map(([code, st]) => ({ code, uses: st.uses, discount: st.discount }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 5)

  // ─────────────────────────────────────────────────────────────────────────────

  return {
    storeName,
    kpis,
    chartData,
    topProducts,
    sources,
    topPages,
    geography,
    funnel,
    affiliates,
    promos,
  }
}
