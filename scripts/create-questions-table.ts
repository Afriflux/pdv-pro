import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductQuestion" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `)
    console.log('Successfully created ProductQuestion table')
  } catch(e) {
    console.error('Error creating table:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
