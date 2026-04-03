'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const orderId = formData.get('orderId') as string
  const storeId = formData.get('storeId') as string
  const productId = formData.get('productId') as string
  const rating = parseInt(formData.get('rating') as string, 10)
  const comment = formData.get('comment') as string
  const buyerName = formData.get('buyerName') as string || 'Anonyme'

  if (!orderId || !storeId || isNaN(rating) || rating < 1 || rating > 5) {
    return { error: 'Données invalides' }
  }

  const supabaseAdmin = createAdminClient()

  // Verify the order belongs to the user
  const { data: order } = await supabaseAdmin
    .from('Order')
    .select('id, buyer_id')
    .eq('id', orderId)
    .single()

  if (!order || order.buyer_id !== user.id) {
    // If not matching by user id, maybe soft match by email but let's be strict
    return { error: 'Commande introuvable ou non autorisée' }
  }

  // Create Review
  const { error } = await supabaseAdmin.from('Review').insert({
    store_id: storeId,
    product_id: productId || null,
    order_id: orderId,
    buyer_name: buyerName,
    rating: rating,
    comment: comment || null,
    verified: true,
    user_id: user.id
  })

  if (error) {
    console.error('Submit review error:', error)
    return { error: 'Erreur lors de la soumission de l\'avis' }
  }

  revalidatePath('/client/orders')
  return { success: true }
}
