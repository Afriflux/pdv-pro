const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const closer_id = "50f6afaa-8a79-4922-81a0-12125e518faa"
  
  // Find a store
  const store = await prisma.store.findFirst()
  if (!store) {
    console.log("No store found to associate leads")
    return
  }
  
  // Find a product
  const product = await prisma.product.findFirst({ where: { store_id: store.id } })

  console.log("Creating fake leads for closer", closer_id)

  const fakes = [
    {
      store_id: store.id,
      product_id: product?.id || null,
      closer_id: closer_id,
      status: 'contacted',
      name: 'Amadou Diop',
      phone: '+221 77 123 45 67',
      source: 'Facebook Ad',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      updated_at: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      store_id: store.id,
      product_id: product?.id || null,
      closer_id: closer_id,
      status: 'qualified',
      name: 'Fatou Sow',
      phone: '+221 76 987 65 43',
      source: 'Instagram',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      store_id: store.id,
      product_id: product?.id || null,
      closer_id: closer_id,
      status: 'contacted',
      name: 'Moussa Ndiaye',
      phone: '+221 70 444 55 66',
      source: 'WhatsApp',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }
  ]

  for (const fake of fakes) {
    await prisma.lead.create({ data: fake })
  }

  console.log("Done seeding!")
}

main().finally(() => prisma.$disconnect())
