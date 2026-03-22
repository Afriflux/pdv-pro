// ─── app/api/community/leaderboard/route.ts ──────────────────────────────────
// GET ?period=month|all
// Top 10 vendeurs par revenue (orders confirmées)
// Enrichi : store_name, store_logo, store_slug, niveau vendeur

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  store_id:      string
  vendor_amount: number
}

interface StoreRow {
  id:       string
  name:     string
  logo_url: string | null
  slug:     string | null
}

interface WalletRow {
  vendor_id:    string
  total_earned: number
}

interface LeaderboardEntry {
  rank:          number
  store_id:      string
  store_name:    string
  store_logo:    string | null
  store_slug:    string
  total_revenue: number
  order_count:   number
  level:         string
  level_emoji:   string
}

// ─── Niveau vendeur ───────────────────────────────────────────────────────────

function getLevel(totalEarned: number): { level: string; emoji: string } {
  if (totalEarned >= 10_000_000) return { level: 'Platinum', emoji: '💎' }
  if (totalEarned >= 2_000_000)  return { level: 'Gold',     emoji: '🥇' }
  if (totalEarned >= 500_000)    return { level: 'Silver',   emoji: '🥈' }
  return { level: 'Bronze', emoji: '🥉' }
}

// ─── Route GET ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    // ── Auth vendeur obligatoire ──────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') === 'all' ? 'all' : 'month'

    const CONFIRMED = ['paid', 'completed', 'delivered', 'confirmed', 'preparing', 'shipped']

    // ── 1. Récupérer les orders confirmées de la période ─────────────────────
    let query = supabase
      .from('Order')
      .select('store_id, vendor_amount')
      .in('status', CONFIRMED)

    if (period === 'month') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      query = query.gte('created_at', startOfMonth.toISOString())
    }

    const { data: ordersRaw, error: ordersError } = await query

    if (ordersError) {
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    const orders = (ordersRaw ?? []) as OrderRow[]

    // ── 2. Agréger par store_id ────────────────────────────────────────────
    const agg: Record<string, { total_revenue: number; order_count: number }> = {}
    orders.forEach(o => {
      if (!agg[o.store_id]) agg[o.store_id] = { total_revenue: 0, order_count: 0 }
      agg[o.store_id].total_revenue += Number(o.vendor_amount)
      agg[o.store_id].order_count++
    })

    // Trier et prendre les 10 premiers
    const top10 = Object.entries(agg)
      .sort(([, a], [, b]) => b.total_revenue - a.total_revenue)
      .slice(0, 10)

    if (top10.length === 0) {
      return NextResponse.json({ leaderboard: [], period })
    }

    const top10StoreIds = top10.map(([storeId]) => storeId)

    // ── 3. Récupérer les infos store ──────────────────────────────────────────
    const { data: storesRaw } = await supabase
      .from('Store')
      .select('id, name, logo_url, slug')
      .in('id', top10StoreIds)

    const stores = (storesRaw ?? []) as StoreRow[]
    const storeMap: Record<string, StoreRow> = {}
    stores.forEach(s => { storeMap[s.id] = s })

    // ── 4. Récupérer Wallet.total_earned pour les niveaux ─────────────────────
    const { data: walletsRaw } = await supabase
      .from('Wallet')
      .select('vendor_id, total_earned')
      .in('vendor_id', top10StoreIds)

    const wallets = (walletsRaw ?? []) as WalletRow[]
    const walletMap: Record<string, number> = {}
    wallets.forEach(w => { walletMap[w.vendor_id] = Number(w.total_earned) })

    // ── 5. Assembler le classement ─────────────────────────────────────────────
    const leaderboard: LeaderboardEntry[] = top10.map(([storeId, stats], index) => {
      const store      = storeMap[storeId]
      const earned     = walletMap[storeId] ?? 0
      const { level, emoji } = getLevel(earned)

      return {
        rank:          index + 1,
        store_id:      storeId,
        store_name:    store?.name     ?? 'Boutique inconnue',
        store_logo:    store?.logo_url ?? null,
        store_slug:    store?.slug     ?? storeId,
        total_revenue: Math.round(stats.total_revenue),
        order_count:   stats.order_count,
        level,
        level_emoji:   emoji,
      }
    })

    return NextResponse.json({ leaderboard, period })

  } catch (err: unknown) {
    console.error('[community/leaderboard GET]', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
