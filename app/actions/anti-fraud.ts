'use server'

import { flagBuyer, unflagBuyer, getBuyerInfo, checkBuyerForCOD } from '@/lib/anti-fraud/buyer-check'
import { revalidatePath } from 'next/cache'

// ── Flag a buyer from the vendor dashboard ──────────────────────
export async function flagBuyerAction(phone: string, storeId: string, reason = 'manual') {
  const result = await flagBuyer(phone, storeId, reason)
  if (result.success) {
    revalidatePath('/dashboard/orders')
  }
  return result
}

// ── Unflag a buyer ──────────────────────────────────────────────
export async function unflagBuyerAction(phone: string) {
  const result = await unflagBuyer(phone)
  if (result.success) {
    revalidatePath('/dashboard/orders')
  }
  return result
}

// ── Get buyer risk info for display ─────────────────────────────
export async function getBuyerInfoAction(phone: string) {
  return getBuyerInfo(phone)
}

// ── Check if a buyer can use COD (used by checkout) ─────────────
export async function checkBuyerCODAction(phone: string) {
  return checkBuyerForCOD(phone)
}
