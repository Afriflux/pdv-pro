import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const tips = await prisma.tip.findMany()
  console.log(`Found ${tips.length} tips.`)
  for (const t of tips) {
    console.log(t.title)
  }
}

test().catch(console.error).finally(() => prisma.$disconnect())
