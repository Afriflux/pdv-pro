'use server'

import { prisma } from '@/lib/prisma'

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
export type BuyerRiskLevel = 'trusted' | 'normal' | 'warning' | 'risky' | 'blacklisted'

export interface BuyerCheckResult {
  allowed: boolean
  riskLevel: BuyerRiskLevel
  score: number
  message: string | null
  label: string
  color: string
}

const RISK_LEVELS: Record<BuyerRiskLevel, { label: string; color: string; emoji: string }> = {
  trusted:     { label: 'Client fiable',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200', emoji: '🟢' },
  normal:      { label: 'Client normal',       color: 'bg-blue-100 text-blue-700 border-blue-200',         emoji: '🟡' },
  warning:     { label: 'Client à surveiller', color: 'bg-orange-100 text-orange-700 border-orange-200',   emoji: '🟠' },
  risky:       { label: 'Client risqué',       color: 'bg-red-100 text-red-700 border-red-200',            emoji: '🔴' },
  blacklisted: { label: 'Bloqué (blacklist)',   color: 'bg-red-200 text-red-800 border-red-300',            emoji: '⛔' },
}

// ────────────────────────────────────────────────────────────────
// Score Computation  (deterministic, no side-effects)
// ────────────────────────────────────────────────────────────────
export function computeBuyerScore(stats: {
  success_orders: number
  refused_orders: number
  disputed_orders: number
}): number {
  const { success_orders, refused_orders, disputed_orders } = stats
  const raw =
    50 +                          // base score
    success_orders  * 10 +        // +10 per delivered order
    refused_orders  * -20 +       // -20 per refused COD
    disputed_orders * -30          // -30 per dispute

  return Math.max(0, Math.min(100, raw))
}

export function getRiskLevel(score: number): BuyerRiskLevel {
  if (score >= 80) return 'trusted'
  if (score >= 50) return 'normal'
  if (score >= 30) return 'warning'
  return 'risky'
}

// ────────────────────────────────────────────────────────────────
// Main check – used by checkout to decide if COD is allowed
// ────────────────────────────────────────────────────────────────
export async function checkBuyerForCOD(phone: string): Promise<BuyerCheckResult> {
  // 1. Check blacklist first
  const blacklisted = await prisma.buyerBlacklist.findUnique({
    where: { phone },
  })

  if (blacklisted) {
    const meta = RISK_LEVELS.blacklisted
    return {
      allowed: false,
      riskLevel: 'blacklisted',
      score: 0,
      message: 'Le paiement à la livraison n\'est pas disponible pour ce numéro. Veuillez payer en ligne via Wave ou Mobile Money.',
      label: meta.label,
      color: meta.color,
    }
  }

  // 2. Check BuyerScore
  const buyerScore = await prisma.buyerScore.findUnique({
    where: { phone },
  })

  // New buyer ➜ allow with default score
  if (!buyerScore) {
    const meta = RISK_LEVELS.normal
    return {
      allowed: true,
      riskLevel: 'normal',
      score: 50,
      message: null,
      label: meta.label,
      color: meta.color,
    }
  }

  const score = computeBuyerScore(buyerScore)
  const riskLevel = getRiskLevel(score)
  const meta = RISK_LEVELS[riskLevel]

  return {
    allowed: score >= 30,          // Block COD below 30
    riskLevel,
    score,
    message: score < 30
      ? 'Le paiement à la livraison n\'est pas disponible pour ce numéro. Veuillez payer en ligne via Wave ou Mobile Money.'
      : score < 50
        ? 'Ce client a un profil à surveiller. Le COD est autorisé mais une vérification est recommandée.'
        : null,
    label: meta.label,
    color: meta.color,
  }
}

// ────────────────────────────────────────────────────────────────
// Get buyer info for dashboard display
// ────────────────────────────────────────────────────────────────
export async function getBuyerInfo(phone: string): Promise<{
  score: number
  riskLevel: BuyerRiskLevel
  label: string
  color: string
  emoji: string
  totalOrders: number
  successOrders: number
  refusedOrders: number
  isBlacklisted: boolean
} | null> {
  const blacklisted = await prisma.buyerBlacklist.findUnique({
    where: { phone },
  })

  const buyerScore = await prisma.buyerScore.findUnique({
    where: { phone },
  })

  if (!buyerScore && !blacklisted) return null

  if (blacklisted) {
    const meta = RISK_LEVELS.blacklisted
    return {
      score: 0,
      riskLevel: 'blacklisted',
      label: meta.label,
      color: meta.color,
      emoji: meta.emoji,
      totalOrders: buyerScore?.total_orders ?? 0,
      successOrders: buyerScore?.success_orders ?? 0,
      refusedOrders: buyerScore?.refused_orders ?? 0,
      isBlacklisted: true,
    }
  }

  const score = computeBuyerScore(buyerScore!)
  const riskLevel = getRiskLevel(score)
  const meta = RISK_LEVELS[riskLevel]

  return {
    score,
    riskLevel,
    label: meta.label,
    color: meta.color,
    emoji: meta.emoji,
    totalOrders: buyerScore!.total_orders,
    successOrders: buyerScore!.success_orders,
    refusedOrders: buyerScore!.refused_orders,
    isBlacklisted: false,
  }
}

// ────────────────────────────────────────────────────────────────
// Flag a buyer (vendor action)
// ────────────────────────────────────────────────────────────────
export async function flagBuyer(phone: string, storeId: string, reason = 'manual'): Promise<{ success: boolean }> {
  try {
    await prisma.buyerBlacklist.upsert({
      where: { phone },
      update: {
        total_refused: { increment: 1 },
        reason,
        flagged_by: storeId,
      },
      create: {
        phone,
        reason,
        flagged_by: storeId,
        total_refused: 1,
      },
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}

// ────────────────────────────────────────────────────────────────
// Un-flag / remove from blacklist (admin or vendor)
// ────────────────────────────────────────────────────────────────
export async function unflagBuyer(phone: string): Promise<{ success: boolean }> {
  try {
    await prisma.buyerBlacklist.delete({
      where: { phone },
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}
