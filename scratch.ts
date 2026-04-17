const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { phone: '+221782057083' },
    include: { Store: true }
  })
  
  if (user && user.Store && user.Store.length > 0) {
    const store = user.Store[0]
    console.log("Found Store, current AI credits:", store.ai_credits)
    
    // Decrement 100
    if (store.ai_credits >= 100) {
      await prisma.store.update({
        where: { id: store.id },
        data: { ai_credits: { decrement: 100 } }
      })
      console.log("Decremented AI credits by 100.")
    } else {
      console.log("AI credits already below 100:", store.ai_credits)
    }

    // Clean up any recent AssetPurchases manually issued today
    const purchases = await prisma.assetPurchase.deleteMany({
      where: { store_id: store.id }
    })
    console.log("Deleted dummy AssetPurchases count:", purchases.count)
  } else {
    console.log("User or Store not found for phone +221782057083")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
