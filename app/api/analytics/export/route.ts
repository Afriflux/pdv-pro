// ─── app/api/analytics/export/route.ts ───────────────────────────────────────
// Route GET — Export CSV des données analytics
// ?storeId=xxx&days=30&type=orders|kpis|full
// Auth vendeur requise + vérification ownership store

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types internes ───────────────────────────────────────────────────────────

interface OrderRow {
  id:            string
  created_at:    string
  vendor_amount: number
  status:        string
  product:       { name?: string } | null
  promo_code:    { code?: string } | null
  promo_discount: number | null
}

interface StoreRow {
  id:   string
  name: string
}

// ─── Helpers CSV ──────────────────────────────────────────────────────────────

/** Échappe une valeur pour le CSV (guillemets si virgule ou guillemet présent) */
function csvCell(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(',')
}

function formatTrend(trend: number): string {
  if (trend > 0) return `+${trend.toFixed(1)}%`
  if (trend < 0) return `${trend.toFixed(1)}%`
  return '0%'
}

// ─── Builders CSV ─────────────────────────────────────────────────────────────

function buildOrdersCsv(orders: OrderRow[]): string {
  const header = csvRow(['ID', 'Date', 'Produit', 'Montant (FCFA)', 'Code promo', 'Remise (FCFA)', 'Statut'])
  const rows = orders.map(o =>
    csvRow([
      o.id.slice(0, 8),
      new Date(o.created_at).toLocaleDateString('fr-FR'),
      o.product?.name ?? 'Inconnu',
      Math.round(o.vendor_amount),
      o.promo_code?.code ?? '',
      Math.round(o.promo_discount ?? 0),
      o.status,
    ])
  )
  return [header, ...rows].join('\n')
}

function buildKpisCsv(kpis: {
  views: number; viewsTrend: number
  sales: number; salesTrend: number
  revenue: number; revenueTrend: number
  conversion: number; conversionTrend: number
}, days: number): string {
  const header = csvRow(['Métrique', 'Valeur', 'Tendance vs période précédente'])
  const rows = [
    csvRow(['Période analysée', `${days} jours`, '']),
    csvRow(['Visites produits', kpis.views.toLocaleString('fr-FR'), formatTrend(kpis.viewsTrend)]),
    csvRow(['Ventes confirmées', kpis.sales.toLocaleString('fr-FR'), formatTrend(kpis.salesTrend)]),
    csvRow(['Revenus nets', `${Math.round(kpis.revenue).toLocaleString('fr-FR')} FCFA`, formatTrend(kpis.revenueTrend)]),
    csvRow(['Taux de conversion', `${kpis.conversion.toFixed(2)}%`, formatTrend(kpis.conversionTrend)]),
  ]
  return [header, ...rows].join('\n')
}

function buildTopProductsCsv(products: { name: string; sales: number; revenue: number }[]): string {
  const header = csvRow(['Produit', 'Ventes', 'Revenus (FCFA)'])
  const rows = products.map(p =>
    csvRow([p.name, p.sales, Math.round(p.revenue)])
  )
  return [header, ...rows].join('\n')
}

// ─── Route GET ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth vendeur ──────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ── Paramètres URL ────────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url)
    const storeId  = searchParams.get('storeId')
    const daysRaw  = searchParams.get('days') ?? '7'
    const type     = (searchParams.get('type') ?? 'orders') as 'orders' | 'kpis' | 'full'

    if (!storeId) {
      return NextResponse.json({ error: 'Paramètre storeId requis' }, { status: 400 })
    }

    const days = Math.min(Math.max(parseInt(daysRaw, 10), 1), 90)

    // ── Vérifier ownership du store ───────────────────────────────────────────
    const { data: storeRaw } = await supabase
      .from('Store')
      .select('id, name')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!storeRaw) {
      return NextResponse.json({ error: 'Boutique introuvable ou accès refusé' }, { status: 403 })
    }

    const store = storeRaw as StoreRow
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    // ── Récupérer les commandes ───────────────────────────────────────────────
    const { data: ordersRaw } = await supabase
      .from('Order')
      .select(`
        id, created_at, vendor_amount, status, promo_discount,
        product:Product(name),
        promo_code:PromoCode(code)
      `)
      .eq('store_id', storeId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    const orders = (ordersRaw ?? []) as OrderRow[]

    const SUCCESSFUL = ['confirmed', 'preparing', 'shipped', 'delivered'] as const

    const confirmedOrders = orders.filter(o =>
      SUCCESSFUL.includes(o.status as typeof SUCCESSFUL[number])
    )

    // ── Calculer les KPIs pour l'export ──────────────────────────────────────
    // Période actuelle vs précédente pour les tendances
    const midPoint = new Date()
    midPoint.setDate(midPoint.getDate() - days)
    const prevSince = new Date()
    prevSince.setDate(prevSince.getDate() - days * 2)

    const { data: prevOrdersRaw } = await supabase
      .from('Order')
      .select('vendor_amount, status')
      .eq('store_id', storeId)
      .gte('created_at', prevSince.toISOString())
      .lt('created_at', since.toISOString())

    const prevOrders = (prevOrdersRaw ?? []) as { vendor_amount: number; status: string }[]
    const prevConfirmed = prevOrders.filter(o =>
      SUCCESSFUL.includes(o.status as typeof SUCCESSFUL[number])
    )

    // Pages + vues
    const { data: pagesRaw } = await supabase
      .from('SalePage').select('id').eq('store_id', storeId)
    const pageIds = (pagesRaw ?? []).map((p: { id: string }) => p.id)

    let currentViews = 0, prevViews = 0
    if (pageIds.length > 0) {
      const { data: statsRaw } = await supabase
        .from('PageAnalytics')
        .select('visits, date')
        .in('page_id', pageIds)
        .gte('date', prevSince.toISOString())

      const stats = (statsRaw ?? []) as { visits: number; date: string }[]
      stats.forEach(s => {
        if (new Date(s.date) >= since) currentViews += s.visits
        else prevViews += s.visits
      })
    }

    const currentRevenue = confirmedOrders.reduce((s, o) => s + o.vendor_amount, 0)
    const prevRevenue    = prevConfirmed.reduce((s, o) => s + o.vendor_amount, 0)
    const currentSales   = confirmedOrders.length
    const prevSales      = prevConfirmed.length

    const trend = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100

    const kpis = {
      views:           currentViews,
      viewsTrend:      trend(currentViews, prevViews),
      sales:           currentSales,
      salesTrend:      trend(currentSales, prevSales),
      revenue:         currentRevenue,
      revenueTrend:    trend(currentRevenue, prevRevenue),
      conversion:      currentViews > 0 ? (currentSales / currentViews) * 100 : 0,
      conversionTrend: 0, // simplifié pour l'export
    }

    // Top produits
    const productStats: Record<string, { name: string; sales: number; revenue: number }> = {}
    confirmedOrders.forEach(o => {
      const name = o.product?.name ?? 'Inconnu'
      const pid  = name // grouper par nom dans l'export
      if (!productStats[pid]) productStats[pid] = { name, sales: 0, revenue: 0 }
      productStats[pid].sales++
      productStats[pid].revenue += o.vendor_amount
    })
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ── Construire le CSV selon le type ───────────────────────────────────────
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `analytics-${store.name.replace(/\s+/g, '-')}-${dateStr}-${days}j.csv`

    let csvContent = ''

    if (type === 'orders') {
      csvContent = buildOrdersCsv(orders)

    } else if (type === 'kpis') {
      csvContent = buildKpisCsv(kpis, days)

    } else {
      // full = KPIs + séparateur + Commandes + séparateur + Top produits
      const sep = '\n\n'
      csvContent = [
        `# RAPPORT ANALYTICS — ${store.name} — ${days} derniers jours — ${dateStr}`,
        '',
        '## INDICATEURS CLÉS (KPIs)',
        buildKpisCsv(kpis, days),
        sep,
        '## TOP PRODUITS',
        buildTopProductsCsv(topProducts),
        sep,
        '## DÉTAIL DES COMMANDES',
        buildOrdersCsv(orders),
      ].join('\n')
    }

    // ── Réponse CSV ────────────────────────────────────────────────────────────
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err: unknown) {
    console.error('[analytics/export]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
