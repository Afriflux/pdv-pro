/* eslint-disable react/forbid-dom-props */
// ─── app/dashboard/abonnements/page.tsx ──────────────────────────────────────
// Server Component — Activité & commissions vendeur
// CA mois, paliers dégressifs, niveau vendeur, historique 3 mois

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SimulateurCommission from '@/components/dashboard/SimulateurCommission'

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

interface VendorLevel {
  name:  string
  emoji: string
  min:   number
  max:   number | null
  color: string
  perks: string[]
}

// ─── Constantes métier ────────────────────────────────────────────────────────

const TIERS: Tier[] = [
  { name: '0 – 100K',    label: '0 → 100 000 FCFA/mois',           min: 0,         max: 100_000,   rate: 7, color: '#94a3b8' },
  { name: '100K – 500K', label: '100 001 → 500 000 FCFA/mois',     min: 100_001,   max: 500_000,   rate: 6, color: '#3b82f6' },
  { name: '500K – 1M',   label: '500 001 → 1 000 000 FCFA/mois',   min: 500_001,   max: 1_000_000, rate: 5, color: '#8b5cf6' },
  { name: '+ 1M',        label: '+ 1 000 000 FCFA/mois',           min: 1_000_001, max: null,       rate: 4, color: '#C9A84C' },
]

const LEVELS: VendorLevel[] = [
  {
    name: 'Bronze', emoji: '🥉', min: 0, max: 499_999,
    color: '#CD7F32',
    perks: ['Accès à tous les outils PDV Pro', 'Support email standard'],
  },
  {
    name: 'Silver', emoji: '🥈', min: 500_000, max: 1_999_999,
    color: '#94A3B8',
    perks: ['Badge "Vendeur Fiable" sur votre boutique', 'Support prioritaire', 'Analytics avancées'],
  },
  {
    name: 'Gold', emoji: '🥇', min: 2_000_000, max: 9_999_999,
    color: '#C9A84C',
    perks: ['Badge Gold visible par vos acheteurs', 'Commission réduite prioritaire', 'Coaching mensuel PDV Pro'],
  },
  {
    name: 'Platinum', emoji: '💎', min: 10_000_000, max: null,
    color: '#0F7A60',
    perks: ['Badge Platinum exclusif', 'Commission négociable', 'Account manager dédié', 'Mise en avant boutique'],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCommissionRate(monthlyCA: number): number {
  if (monthlyCA > 1_000_000) return 4
  if (monthlyCA > 500_000)   return 5
  if (monthlyCA > 100_000)   return 6
  return 7
}

function getCurrentTierIndex(monthlyCA: number): number {
  return TIERS.findIndex(t => t.max === null || monthlyCA <= t.max)
}

function getCurrentLevelIndex(totalEarned: number): number {
  return LEVELS.findIndex(l => l.max === null || totalEarned <= l.max)
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AbonnementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  // ── CA cumulé total ───────────────────────────────────────────────────────
  const { data: walletRaw } = await supabase
    .from('Wallet')
    .select('total_earned')
    .eq('vendor_id', store.id)
    .maybeSingle()

  // ─── CALCULS ───────────────────────────────────────────────────────────────

  type OrderRow = { vendor_amount: number; status: string; created_at: string }

  const currentMonthOrders = (currentMonthOrdersRaw ?? []) as OrderRow[]
  const recentOrders       = (recentOrdersRaw ?? []) as OrderRow[]
  const walletData         = walletRaw as { total_earned: number } | null

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

  const totalEarned  = walletData?.total_earned ?? 0
  const levelIdx     = getCurrentLevelIndex(totalEarned)
  const currentLevel = LEVELS[levelIdx]
  const nextLevel    = LEVELS[levelIdx + 1] ?? null

  const levelProgress = currentLevel.max
    ? Math.min(
        (totalEarned - currentLevel.min) / (currentLevel.max - currentLevel.min) * 100,
        100
      )
    : 100

  const missingForNextLevel = nextLevel
    ? (nextLevel.min - totalEarned)
    : 0

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
    <div className="min-h-screen bg-[#FAFAF7] pb-16">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0F7A60]/10 text-[#0F7A60] font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
            ✅ Zéro Abonnement — Commission à la performance
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] leading-tight">
            Mon Activité &amp; Commissions
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            {store.name} · Nous ne gagnons que si vous gagnez 🤝
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — CE MOIS-CI
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-2xl bg-[#0F7A60]/10 flex items-center justify-center text-xl">📊</div>
            <div>
              <h2 className="font-black text-lg text-[#1A1A1A]">Ce mois-ci</h2>
              <p className="text-xs text-gray-400">
                Du 1er au {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
            {/* CA réalisé */}
            <div className="px-6 py-5 space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CA réalisé</p>
              <p className="text-3xl font-black text-[#1A1A1A]">{fmt(currentMonthCA)}</p>
              <p className="text-xs text-gray-400 font-medium">FCFA ce mois</p>
            </div>

            {/* Commission */}
            <div className="px-6 py-5 space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission PDV Pro</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-red-500">{rate}%</p>
                <p className="text-sm font-bold text-red-400">({fmt(commissionAmt)} FCFA)</p>
              </div>
              <p className="text-xs font-bold text-[#0F7A60]">Palier : {currentTier.name}</p>
            </div>

            {/* Vous gardez */}
            <div className="px-6 py-5 space-y-1 bg-[#0F7A60]/5">
              <p className="text-[10px] font-black text-[#0F7A60] uppercase tracking-widest">Vous gardez</p>
              <p className="text-3xl font-black text-[#0F7A60]">{fmt(vendorNet)}</p>
              <p className="text-xs text-[#0F7A60]/70 font-medium">FCFA nets ce mois</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — PROGRESSION VERS LE PALIER SUIVANT
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center text-xl">📈</div>
            <div>
              <h2 className="font-black text-lg text-[#1A1A1A]">Progression vers le palier suivant</h2>
              <p className="text-xs text-gray-400">CA mensuel en cours vs seuil du prochain palier</p>
            </div>
          </div>

          {nextTier ? (
            <div className="space-y-4">
              {/* Barre de progression */}
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>Palier actuel : <span style={{ color: currentTier.color }}>{currentTier.name} ({rate}%)</span></span>
                <span>Prochain : <span style={{ color: nextTier.color }}>{nextTier.name} ({nextTier.rate}%)</span></span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${tierProgress}%`,
                    backgroundColor: currentTier.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{fmt(currentMonthCA)} FCFA</span>
                <span>{fmt(nextTier.min)} FCFA</span>
              </div>

              {/* Message motivant */}
              <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">🎯</span>
                <p className="text-sm font-bold text-[#0F7A60]">
                  Il vous manque <strong>{fmt(missingForNextTier)} FCFA</strong> pour passer au palier{' '}
                  <strong>{nextTier.name} ({nextTier.rate}%)</strong> et économiser encore plus !
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-2xl p-5 flex items-center gap-4">
              <span className="text-4xl">🎉</span>
              <div>
                <p className="font-black text-[#C9A84C] text-lg">Palier + 1M atteint !</p>
                <p className="text-sm text-gray-500 mt-1">Vous bénéficiez du meilleur taux possible : <strong>4%</strong></p>
              </div>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — TABLEAU DES PALIERS
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F7A60]/10 flex items-center justify-center text-xl">📋</div>
            <h2 className="font-black text-lg text-[#1A1A1A]">Tableau des paliers de commission</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {TIERS.map((tier, i) => {
              const isPast    = i < tierIdx
              const isCurrent = i === tierIdx
              const isFuture  = i > tierIdx
              return (
                <div
                  key={tier.name}
                  className={`flex items-center justify-between px-6 py-4 transition-colors ${
                    isCurrent ? 'bg-[#0F7A60]/5' : isFuture ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPast ? (
                      <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">✓</span>
                    ) : isCurrent ? (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: tier.color }}>
                        <span className="text-white text-[10px] font-black">●</span>
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-300">○</span>
                    )}
                    <div>
                      <p className={`font-black text-sm ${isCurrent ? 'text-[#1A1A1A]' : 'text-gray-500'}`}>{tier.name}</p>
                      <p className="text-[10px] text-gray-400">{tier.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-2xl font-black"
                      style={{ color: isCurrent ? tier.color : isFuture ? '#d1d5db' : '#94a3b8' }}
                    >
                      {tier.rate}%
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black text-white bg-[#0F7A60] px-2 py-0.5 rounded-full">
                        Vous êtes ici 🔵
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] text-gray-400 font-bold">Dépassé ✓</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* COD */}
          <div className="px-6 py-4 bg-[#C9A84C]/5 border-t border-[#C9A84C]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚚</span>
              <div>
                <p className="font-black text-sm text-[#1A1A1A]">COD — Paiement à la livraison</p>
                <p className="text-[10px] text-gray-400">Produits physiques uniquement · Taux fixe</p>
              </div>
            </div>
            <span className="text-2xl font-black text-[#C9A84C]">5%</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — NIVEAU VENDEUR
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-xl">
              {currentLevel.emoji}
            </div>
            <div>
              <h2 className="font-black text-lg text-[#1A1A1A]">Niveau Vendeur</h2>
              <p className="text-xs text-gray-400">Basé sur votre CA cumulé total depuis la création</p>
            </div>
          </div>

          {/* Niveau actuel */}
          <div
            className="rounded-2xl p-5 border space-y-3"
            style={{
              borderColor: `${currentLevel.color}30`,
              backgroundColor: `${currentLevel.color}08`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentLevel.emoji}</span>
                <div>
                  <p className="font-black text-xl" style={{ color: currentLevel.color }}>
                    {currentLevel.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    CA cumulé : <strong>{fmt(totalEarned)} FCFA</strong>
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] font-black px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: currentLevel.color }}
              >
                Niveau actuel
              </span>
            </div>

            {/* Avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {currentLevel.perks.map(perk => (
                <div key={perk} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                  <span style={{ color: currentLevel.color }}>✓</span>
                  {perk}
                </div>
              ))}
            </div>
          </div>

          {/* Progression vers le niveau suivant */}
          {nextLevel ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>{currentLevel.name} ({fmt(currentLevel.min)} FCFA)</span>
                <span>{nextLevel.name} {nextLevel.emoji} ({fmt(nextLevel.min)} FCFA)</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${levelProgress}%`, backgroundColor: currentLevel.color }}
                />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Il vous manque{' '}
                <strong className="text-[#1A1A1A]">{fmt(missingForNextLevel)} FCFA</strong>{' '}
                de CA cumulé pour atteindre le niveau{' '}
                <strong style={{ color: nextLevel.color }}>{nextLevel.name} {nextLevel.emoji}</strong>
              </p>
            </div>
          ) : (
            <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-3xl">💎</span>
              <p className="text-sm font-bold text-[#0F7A60]">
                Félicitations ! Vous avez atteint le niveau maximum Platinum.
              </p>
            </div>
          )}

          {/* Tous les niveaux */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {LEVELS.map((level, i) => {
              const isCurrentLevel = i === levelIdx
              const isPastLevel    = i < levelIdx
              return (
                <div
                  key={level.name}
                  className={`rounded-2xl border p-4 text-center space-y-1 transition-all ${
                    isCurrentLevel ? 'shadow-md' : isPastLevel ? 'opacity-60' : 'opacity-30'
                  }`}
                  style={{
                    borderColor: isCurrentLevel ? level.color : '#e5e7eb',
                    backgroundColor: isCurrentLevel ? `${level.color}10` : 'white',
                  }}
                >
                  <div className="text-3xl">{level.emoji}</div>
                  <p className="font-black text-xs" style={{ color: isCurrentLevel ? level.color : '#6b7280' }}>
                    {level.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {fmt(level.min / 1000)}k FCFA
                    {level.max ? ` → ${fmt(level.max / 1000)}k` : '+'}
                  </p>
                  {isPastLevel && <p className="text-[10px] text-gray-400">✓ Atteint</p>}
                  {isCurrentLevel && <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: level.color }}>En cours</p>}
                </div>
              )
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5 — SIMULATEUR (Client Component)
            ══════════════════════════════════════════════════════════════ */}
        <SimulateurCommission />

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6 — HISTORIQUE 3 MOIS
            ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">🗓️</div>
            <div>
              <h2 className="font-black text-lg text-[#1A1A1A]">Historique — 3 derniers mois</h2>
              <p className="text-xs text-gray-400">CA, palier et commission mois par mois</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-[#FAFAF7]">
                  <th className="px-6 py-3 text-left">Mois</th>
                  <th className="px-4 py-3 text-right">CA</th>
                  <th className="px-4 py-3 text-center">Palier</th>
                  <th className="px-4 py-3 text-center">Taux</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Net vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthStats.map(m => (
                  <tr key={m.label} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1A1A1A] capitalize">{m.label}</td>
                    <td className="px-4 py-4 text-right font-bold text-gray-700">
                      {fmt(m.ca)} <span className="text-[10px] text-gray-400">FCFA</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: TIERS[getCurrentTierIndex(m.ca)]?.color ?? '#94a3b8' }}
                      >
                        {TIERS[getCurrentTierIndex(m.ca)]?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-black text-[#0F7A60]">{m.rate}%</td>
                    <td className="px-4 py-4 text-right font-bold text-red-500">
                      − {fmt(m.commission)} <span className="text-[10px] text-red-300">FCFA</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-[#0F7A60]">
                      {fmt(m.net)} <span className="text-[10px] text-[#0F7A60]/60">FCFA</span>
                    </td>
                  </tr>
                ))}
                {monthStats.every(m => m.ca === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic text-sm">
                      Aucune vente confirmée sur ces 3 derniers mois.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}
