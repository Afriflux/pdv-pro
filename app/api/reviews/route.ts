// GET /api/reviews?store_id=xxx&product_id=xxx
// Retourne les avis avec la moyenne

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId   = searchParams.get('store_id')
  const productId = searchParams.get('product_id')

  if (!storeId) {
    return NextResponse.json({ error: 'store_id requis' }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from('Review')
    .select('id, buyer_name, rating, comment, verified, created_at, image_url')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }

  const reviews = data ?? []

  // Calcul de la moyenne
  const average = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({
    reviews,
    count:   reviews.length,
    average: Math.round(average * 10) / 10,
  })
}
