// POST /api/reviews/create
// Body : { store_id, product_id?, order_id?, buyer_name, rating, comment? }

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface ReviewBody {
  store_id:   string
  product_id?: string
  order_id?:   string
  buyer_name: string
  rating:     number
  comment?:   string | null
  image_url?: string | null
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as ReviewBody

    // Validation
    if (!body.store_id || typeof body.store_id !== 'string') {
      return NextResponse.json({ error: 'store_id requis' }, { status: 400 })
    }
    if (!body.buyer_name?.trim()) {
      return NextResponse.json({ error: 'buyer_name requis' }, { status: 400 })
    }
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'rating doit être entre 1 et 5' }, { status: 400 })
    }

    // Vérifier si order_id fourni → marquer comme vérifié
    let verified = false
    if (body.order_id) {
      const order = await prisma.order.findFirst({
        where: {
          id: body.order_id,
          store_id: body.store_id,
          status: 'completed'
        },
        select: { id: true }
      })
      verified = !!order
    }

    await prisma.review.create({
      data: {
        store_id:   body.store_id,
        product_id: body.product_id ?? null,
        order_id:   body.order_id ?? null,
        buyer_name: body.buyer_name.trim(),
        rating:     body.rating,
        comment:    body.comment?.trim() || null,
        image_url:  body.image_url ?? null,
        verified,
      }
    })

    return NextResponse.json({ success: true, verified })
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
