import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  const phone = searchParams.get('phone')

  if (!ref || !phone) {
    return NextResponse.json({ error: 'La référence de commande et le numéro de téléphone sont requis.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('Order')
      .select(`
        id, status, created_at, total, quantity, delivery_address, delivery_fee, subtotal, buyer_name,
        product:Product(name, price),
        store:Store(name, slug, whatsapp),
        deliveryZone:DeliveryZone(name, duration)
      `)
      .eq('id', ref)
      .eq('buyer_phone', phone)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Commande introuvable avec ces informations.' }, { status: 404 })
    }

    // Extraction des relations (Supabase retourne un array s'il y a un doute, on un-wrap et cast pour TS)
    const product = (Array.isArray(order.product) ? order.product[0] : order.product) as { name: string; price: number } | null
    const store = (Array.isArray(order.store) ? order.store[0] : order.store) as { name: string; slug: string; whatsapp: string | null } | null
    const deliveryZone = (Array.isArray(order.deliveryZone) ? order.deliveryZone[0] : order.deliveryZone) as { name: string; duration: string | null } | null

    return NextResponse.json({
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      total: order.total,
      subtotal: order.subtotal,
      quantity: order.quantity,
      buyer_name: order.buyer_name,
      delivery_address: order.delivery_address,
      delivery_fee: order.delivery_fee,
      product,
      store,
      deliveryZone
    })
  } catch (err: any) {
    console.error('Erreur API de suivi de commande:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur. Veuillez réessayer plus tard.' }, { status: 500 })
  }
}
