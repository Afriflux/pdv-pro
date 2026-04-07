import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma_v2: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma_v2 ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1',
      },
    },
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma_v2 = prisma
}
