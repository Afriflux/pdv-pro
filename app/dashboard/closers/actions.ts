'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateStoreCloserSettings(storeId: string, active: boolean, margin: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    await prisma.store.update({
      where: { id: storeId, user_id: user.id },
      data: {
        closer_active: active,
        closer_margin: margin
      }
    })

    revalidatePath('/dashboard/closers')
    return { success: true }
  } catch (error: any) {
    console.error("[updateStoreCloserSettings]", error)
    return { success: false, error: error.message }
  }
}

export async function updateProductCloserSettings(productId: string, active: boolean | null, margin: number | null) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true }
    })

    if (!product || product.store.user_id !== user.id) throw new Error("Non autorisé")

    await prisma.product.update({
      where: { id: productId },
      data: {
        closer_active: active,
        closer_margin: margin
      }
    })

    revalidatePath('/dashboard/closers')
    return { success: true }
  } catch (error: any) {
    console.error("[updateProductCloserSettings]", error)
    return { success: false, error: error.message }
  }
}

// Remettre manuellement un lead dans la pool globale ou l'assigner
export async function pushLeadToClosers(leadId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { Store: true }
    })
    
    if (!lead || lead.Store.user_id !== user.id) throw new Error("Non autorisé")

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        closer_id: null, // Rend le lead disponible
        status: 'new'    // Remet le statut à new
      }
    })

    revalidatePath('/dashboard/closers')
    return { success: true }
  } catch (error: any) {
    console.error("[pushLeadToClosers]", error)
    return { success: false, error: error.message }
  }
}
