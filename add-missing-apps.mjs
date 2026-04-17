import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const missingApps = [
  { id: 'email-sms-marketing', name: 'Campagnes E-mail & SMS (Brevo)', description: "Unifiez vos communications clients d'un seul coup.", icon_url: '📧', category: 'MARKETING', is_premium: true, price: 14900, allowed_roles: ['vendor'], features: ['Mass Mailing', 'Mass SMS'], active: true },
  { id: 'loyalty-points', name: 'Fidélité & Récompenses', description: "Récompensez vos meilleurs acheteurs et fidélisez.", icon_url: '🎁', category: 'MARKETING', is_premium: false, price: 0, allowed_roles: ['vendor'], features: ['Points', 'Cartes Cadeaux'], active: true }
];

async function main() {
  for (const app of missingApps) {
    await prisma.marketplaceApp.upsert({
      where: { id: app.id },
      update: {},
      create: app
    });
  }
  console.log('Added missing apps!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
