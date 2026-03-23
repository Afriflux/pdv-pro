import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const store_id = "de848551-ded9-4284-a4e7-3af349cc3f0f" // L'identifiant exact de ta boutique

    // 1. Créer un produit factice pour ces commandes
    const product = await prisma.product.create({
      data: {
        store_id,
        name: "Montre Casio Gold Élite",
        description: "Montre haut de gamme de test",
        price: 15000,
        type: "physical",
      }
    })

    // 2. Créer 3 commandes factices
    const orderData = [
      { buyer_name: "Amadou Diallo", buyer_phone: "+221771234567", payment_method: "COD", status: "confirmed" as any, subtotal: 15000, platform_fee: 1500, vendor_amount: 13500, total: 15000, delivery_address: "Dakar, Plateau" },
      { buyer_name: "Fatou Sow", buyer_phone: "+221761234567", payment_method: "COD", status: "confirmed" as any, subtotal: 30000, platform_fee: 3000, vendor_amount: 27000, total: 30000, delivery_address: "Pikine Route des Niayes" },
      { buyer_name: "Moussa Ndiaye", buyer_phone: "+221701234567", payment_method: "COD", status: "confirmed" as any, subtotal: 15000, platform_fee: 1500, vendor_amount: 13500, total: 15000, delivery_address: "Guediawaye" },
    ]

    const orders = await Promise.all(
      orderData.map(data => 
        prisma.order.create({
          data: {
            ...data,
            store_id,
            product_id: product.id,
          }
        })
      )
    )

    // 3. Associer les 3 ClosingRequests (Demandes COD)
    await Promise.all(
      orders.map(order => 
        prisma.closingRequest.create({
          data: {
            store_id,
            order_id: order.id,
            status: "PENDING",
            closing_fee: 500,
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: "✅ 3 commandes factices ont bien été ajoutées pour le test du module COD !",
      product_id: product.id,
      orders: orders.map(o => o.id)
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}
