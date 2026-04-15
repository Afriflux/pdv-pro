import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const idsToRemove = ['cinetpay', 'paytech', 'intouch']
  console.log('Suppression des apps:', idsToRemove)
  const result = await prisma.marketplaceApp.deleteMany({
    where: { id: { in: idsToRemove } }
  })
  console.log(`Supprimé ${result.count} apps de la base.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
