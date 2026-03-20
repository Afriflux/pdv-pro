import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Add buyer_email column safely
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "buyer_email" TEXT;`)
    console.log('Successfully added buyer_email to Order table via raw SQL.')
  } catch (error) {
    console.error('Error executing raw SQL migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
