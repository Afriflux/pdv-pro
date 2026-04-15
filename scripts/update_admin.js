const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'djeylanidjitte@gmail.com' },
    data: { role: 'super_admin' },
  });
  console.log('Super admin updated!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
