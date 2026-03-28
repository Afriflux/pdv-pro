import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Création de la table IntegrationKey...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."IntegrationKey" (
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_by" TEXT,
      CONSTRAINT "IntegrationKey_pkey" PRIMARY KEY ("key")
    );
  `)
  console.log('Succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
