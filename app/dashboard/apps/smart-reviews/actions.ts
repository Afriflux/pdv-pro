'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleSmartReviewsAction(active: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Non autorisé" }

    await prisma.store.update({
      where: { user_id: user.id },
      data: { smart_reviews_active: active }
    })

    revalidatePath('/dashboard/apps/smart-reviews')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function createManualReviewAction(data: {
  buyer_name: string
  rating: number
  comment: string
  product_id?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Non autorisé" }

    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })

    if (!store) return { success: false, error: "Boutique introuvable" }

    await prisma.review.create({
      data: {
        store_id: store.id,
        buyer_name: data.buyer_name,
        rating: data.rating,
        comment: data.comment,
        verified: true, // Avis injecté est considéré "Achat Vérifié" pour booster les conversions
        product_id: data.product_id || null,
        created_at: new Date()
      }
    })

    revalidatePath('/dashboard/apps/smart-reviews')
    revalidatePath('/[slug]')
    
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Non autorisé" }

    const store = await prisma.store.findUnique({
      where: { user_id: user.id }
    })
    if (!store) return { success: false, error: "Boutique introuvable" }

    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    if (!review || review.store_id !== store.id) return { success: false, error: "Avis introuvable" }

    await prisma.review.delete({
      where: { id: reviewId }
    })

    revalidatePath('/dashboard/apps/smart-reviews')
    revalidatePath('/[slug]')
    
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
