import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const store = await prisma.store.findFirst()
  if (!store) {
    console.log("No store found to associate leads with.")
    return
  }

  const existingLeads = await prisma.lead.count()
  if (existingLeads > 0) {
    console.log("Leads already exist, skipping seed.")
    return
  }

  console.log(`Seeding leads for store ${store.id}...`)

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
        notes: "VIP Client potention"
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
  
  console.log("Seeded 3 new leads!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
