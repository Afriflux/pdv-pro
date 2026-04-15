'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateLoyaltyConfigAction(storeId: string, enabled: boolean, pointsPer100: number, maxRedeemPct: number) {
  try {
    await prisma.loyaltyConfig.upsert({
      where: { store_id: storeId },
      update: {
        enabled,
        points_per_100: pointsPer100,
        max_redeem_pct: maxRedeemPct,
        updated_at: new Date()
      },
      create: {
        store_id: storeId,
        enabled,
        points_per_100: pointsPer100,
        max_redeem_pct: maxRedeemPct
      }
    })

    revalidatePath('/dashboard/loyalty-points')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
