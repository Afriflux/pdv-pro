import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    if (!bodyText) return NextResponse.json({ error: 'Body vide.' }, { status: 400 })
    
    const body = JSON.parse(bodyText) as Record<string, any>
    const { product_id, store_id, buyer_name, buyer_email, buyer_phone } = body

    if (!product_id || !store_id || !buyer_phone) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    // Upsert a lead. If a lead already exists with the same phone and product_id, we just update name/email.
    // Wait, prisma does not have a unique constraint on (phone, product_id) usually.
    // Let's find first.
    const existing = await prisma.lead.findFirst({
      where: {
        phone: buyer_phone,
        product_id: product_id
      }
    })

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: buyer_name || existing.name,
          email: buyer_email || existing.email,
        }
      })
      return NextResponse.json({ success: true, updated: true })
    }

    // Not existing -> Create a new abandoned cart lead
    await prisma.lead.create({
      data: {
        store_id,
        product_id,
        name: buyer_name || 'Prospect Anonyme',
        phone: buyer_phone,
        email: buyer_email || null,
        status: 'new',
        source: 'abandoned_cart'
      }
    })

    return NextResponse.json({ success: true, created: true })
  } catch (error: unknown) {
    console.error('[ABANDONED CART ERROR]:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
