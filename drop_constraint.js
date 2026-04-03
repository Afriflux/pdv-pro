const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Dropping constraint Affiliate_store_id_key...')
    await prisma.$executeRawUnsafe('ALTER TABLE "Affiliate" DROP CONSTRAINT IF EXISTS "Affiliate_store_id_key" CASCADE;')
    console.log('Constraint dropped.')
  } catch (e) {
    console.error('Error dropping constraint:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
