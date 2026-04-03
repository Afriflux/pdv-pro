import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 400 })
    }

    const existingLeads = await prisma.lead.count()
    if (existingLeads > 0) {
      return NextResponse.json({ message: "Leads already exist, skipping seed." })
    }

    await prisma.lead.createMany({
      data: [
        {
          store_id: store.id,
          name: "Abdoulaye Ndiaye",
          phone: "+221 77 123 45 67",
          email: "abdoulaye@example.com",
          source: "abandoned_cart",
          status: "new",
          notes: "A regardé la Masterclass"
        },
        {
          store_id: store.id,
          name: "Awa Diop",
          phone: "+221 78 987 65 43",
          email: "awa.diop@example.com",
          source: "callback_request",
          status: "new",
          notes: "VIP Client potentiel"
        },
        {
          store_id: store.id,
          name: "Moussa Sylla",
          phone: "+221 76 555 44 33",
          email: "moussa@example.com",
          source: "abandoned_cart",
          status: "new",
          notes: "Panier 65,000 FCFA"
        }
      ]
    })
    
    return NextResponse.json({ message: "Seeded 3 new leads!" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
