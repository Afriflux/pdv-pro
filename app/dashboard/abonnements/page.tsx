/* eslint-disable react/forbid-dom-props */
// ─── app/dashboard/abonnements/page.tsx ──────────────────────────────────────
// Server Component — Activité & commissions vendeur
// CA mois, paliers dégressifs, niveau vendeur, historique 3 mois

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AbonnementsClient from './AbonnementsClient'
import { getCommissionTiers } from '@/lib/commission/commission-service'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tier {
  label: string
  min:   number
  max:   number | null
  rate:  number
  color: string
  name:  string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AbonnementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { TIERS: dynamicTiers } = await getCommissionTiers()

  const TIERS: Tier[] = [
    { name: '0 – 100K',    label: '0 → 100 000 FCFA/mois',           min: 0,         max: 100_000,   rate: Number((dynamicTiers[0].rate * 100).toFixed(2)), color: '#94a3b8' },
    { name: '100K – 500K', label: '100 001 → 500 000 FCFA/mois',     min: 100_001,   max: 500_000,   rate: Number((dynamicTiers[1].rate * 100).toFixed(2)), color: '#3b82f6' },
    { name: '500K – 1M',   label: '500 001 → 1 000 000 FCFA/mois',   min: 500_001,   max: 1_000_000, rate: Number((dynamicTiers[2].rate * 100).toFixed(2)), color: '#8b5cf6' },
    { name: '+ 1M',        label: '+ 1 000 000 FCFA/mois',           min: 1_000_001, max: null,       rate: Number((dynamicTiers[3].rate * 100).toFixed(2)), color: '#C9A84C' },
  ]

  const getCommissionRate = (monthlyCA: number) => {
    const tier = TIERS.find(t => t.max === null || monthlyCA <= t.max)
    return tier?.rate ?? Number((dynamicTiers[3].rate * 100).toFixed(2))
  }

  const getCurrentTierIndex = (monthlyCA: number) => {
    return TIERS.findIndex(t => t.max === null || monthlyCA <= t.max)
  }

  // ── Store ─────────────────────────────────────────────────────────────────
  const { data: store } = await supabase
    .from('Store')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/dashboard')

  // ── CA du mois en cours ───────────────────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: currentMonthOrdersRaw } = await supabase
    .from('Order')
    .select('vendor_amount, status, created_at')
    .eq('store_id', store.id)
    .in('status', ['confirmed', 'preparing', 'shipped', 'delivered', 'paid', 'completed'])
    .gte('created_at', startOfMonth.toISOString())

  // ── CA des 3 derniers mois ────────────────────────────────────────────────
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  threeMonthsAgo.setDate(1)
  threeMonthsAgo.setHours(0, 0, 0, 0)

  const { data: recentOrdersRaw } = await supabase
    .from('Order')
    .select('vendor_amount, status, created_at')
    .eq('store_id', store.id)
    .in('status', ['confirmed', 'preparing', 'shipped', 'delivered', 'paid', 'completed'])
    .gte('created_at', threeMonthsAgo.toISOString())

  // ─── CALCULS ───────────────────────────────────────────────────────────────

  type OrderRow = { vendor_amount: number; status: string; created_at: string }

  const currentMonthOrders = (currentMonthOrdersRaw ?? []) as OrderRow[]
  const recentOrders       = (recentOrdersRaw ?? []) as OrderRow[]


  const currentMonthCA = currentMonthOrders.reduce((s, o) => s + Number(o.vendor_amount), 0)
  const rate           = getCommissionRate(currentMonthCA)
  const commissionAmt  = currentMonthCA * (rate / 100)
  const vendorNet      = currentMonthCA - commissionAmt

  const tierIdx = getCurrentTierIndex(currentMonthCA)
  const currentTier = TIERS[tierIdx]
  const nextTier    = TIERS[tierIdx + 1] ?? null

  const missingForNextTier = nextTier
    ? (nextTier.min - currentMonthCA)
    : 0

  const tierProgress = currentTier.max
    ? Math.min((currentMonthCA - currentTier.min) / (currentTier.max - currentTier.min) * 100, 100)
    : 100



  // ── Historique 3 mois ─────────────────────────────────────────────────────
  interface MonthStat {
    label:      string
    ca:         number
    rate:       number
    commission: number
    net:        number
  }

  const monthStats: MonthStat[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const year  = d.getFullYear()
    const month = d.getMonth()

    const monthOrders = recentOrders.filter(o => {
      const od = new Date(o.created_at)
      return od.getFullYear() === year && od.getMonth() === month
    })

    const ca         = monthOrders.reduce((s, o) => s + Number(o.vendor_amount), 0)
    const r          = getCommissionRate(ca)
    const commission = ca * (r / 100)

    monthStats.push({
      label:      getMonthLabel(d),
      ca,
      rate:       r,
      commission,
      net:        ca - commission,
    })
  }

  // ─── RENDU ────────────────────────────────────────────────────────────────

  return (
    <AbonnementsClient
      storeName={store.name}
      currentMonthCA={currentMonthCA}
      rate={rate}
      commissionAmt={commissionAmt}
      vendorNet={vendorNet}
      currentTierIdx={tierIdx}
      nextTier={nextTier}
      missingForNextTier={missingForNextTier}
      tierProgress={tierProgress}
      monthStats={monthStats}
      tiers={TIERS}
    />
  )
}
