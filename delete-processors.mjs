import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.marketplaceApp.deleteMany({
    where: {
      id: { in: ['cinetpay', 'paytech', 'intouch'] }
    }
  });
  console.log(`Deleted ${result.count} payment processors from MarketplaceApp table.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
