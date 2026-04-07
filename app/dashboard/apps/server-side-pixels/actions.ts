'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function savePixelsConfigAction(data: {
  meta_pixel_id: string | null
  meta_capi_token: string | null
  tiktok_pixel_id: string | null
  google_tag_id: string | null
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Non autorisé" }
    }

    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })

    if (!store) {
      return { success: false, error: "Boutique introuvable" }
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        meta_pixel_id: data.meta_pixel_id || null,
        meta_capi_token: data.meta_capi_token || null,
        tiktok_pixel_id: data.tiktok_pixel_id || null,
        google_tag_id: data.google_tag_id || null,
      }
    })

    revalidatePath('/dashboard/apps/server-side-pixels')
    revalidatePath('/[slug]')
    revalidatePath('/checkout/[id]')
    
    return { success: true }
  } catch (err: any) {
    console.error("Save Pixels Config Error:", err)
    return { success: false, error: err.message || 'Une erreur est survenue' }
  }
}
