'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleSocialProofAction(isActive: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Non autorisé")
      
    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })
    
    if (!store) throw new Error("Boutique introuvable")

    await prisma.store.update({
      where: { id: store.id },
      data: { social_proof_active: isActive }
    })

    revalidatePath('/dashboard/apps/social-proof')
    revalidatePath('/dashboard/apps')
    revalidatePath('/')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveSocialProofConfigAction(config: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })
    if (!store) throw new Error("Boutique introuvable")

    await prisma.store.update({
      where: { id: store.id },
      data: { social_proof_config: config }
    })

    revalidatePath('/dashboard/apps/social-proof')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
