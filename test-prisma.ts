// @ts-nocheck
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const order = await prisma.order.findFirst({
    include: {
      bump_product: true
    }
  })
  console.log(order ? "Success" : "No orders")
}
main().catch(console.error).finally(() => prisma.$disconnect())
