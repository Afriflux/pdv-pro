import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { storeId, whatsapp, whatsappAbandonedCart } = await request.json()

    if (!storeId) {
      return NextResponse.json({ error: "Store ID manquant" }, { status: 400 })
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        user_id: user.id
      }
    })

    if (!store) {
      return NextResponse.json({ error: "Boutique introuvable ou accès refusé" }, { status: 404 })
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        whatsapp: whatsapp !== undefined ? whatsapp : undefined,
        whatsapp_abandoned_cart: whatsappAbandonedCart !== undefined ? whatsappAbandonedCart : undefined,
      }
    })

    return NextResponse.json({ success: true, store: updatedStore })
  } catch (error: any) {
    console.error("Erreur Automations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
