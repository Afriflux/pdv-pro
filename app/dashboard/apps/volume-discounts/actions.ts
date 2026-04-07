'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleVolumeDiscountsAction(isActive: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    const store = await prisma.store.findUnique({ where: { user_id: user.id } })
    if (!store) throw new Error("Boutique introuvable")

    await prisma.store.update({
      where: { id: store.id },
      data: { volume_discounts_active: isActive }
    })

    revalidatePath('/dashboard/apps/volume-discounts')
    revalidatePath('/dashboard/apps')
    revalidatePath('/')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveVolumeConfigAction(config: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    const store = await prisma.store.findUnique({ where: { user_id: user.id } })
    if (!store) throw new Error("Boutique introuvable")

    await prisma.store.update({
      where: { id: store.id },
      data: { volume_discounts_config: config }
    })

    revalidatePath('/dashboard/apps/volume-discounts')
    revalidatePath('/')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
