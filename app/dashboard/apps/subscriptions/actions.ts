'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function cancelSubscriptionAction(orderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Non autorisé" }

    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })

    if (!store) return { success: false, error: "Boutique introuvable" }

    // Validate ownership
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.store_id !== store.id) return { success: false, error: "Commande introuvable" }

    // Cancel the subscription
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        is_subscription: false,
        next_billing_at: null 
      }
    })

    revalidatePath('/dashboard/apps/subscriptions')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
