import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const providers = [
    {
      provider: 'wave',
      name: 'Wave',
      is_active: true,
      commission_rate: 1.0,
      priority_order: 1,
      supported_methods: ['wave']
    },
    {
      provider: 'paytech',
      name: 'PayTech (Orange Money, Free)',
      is_active: true,
      commission_rate: 2.5,
      priority_order: 2,
      supported_methods: ['orange_money', 'wave', 'free_money', 'card']
    },
    {
      provider: 'kkiapay',
      name: 'Kkiapay',
      is_active: true,
      commission_rate: 2.5,
      priority_order: 3,
      supported_methods: ['orange_money', 'mtn', 'moov', 'card']
    },
    {
      provider: 'cinetpay',
      name: 'CinetPay',
      is_active: true,
      commission_rate: 3.0,
      priority_order: 4,
      supported_methods: ['orange_money', 'mtn', 'moov', 'card']
    }
  ];

  for (const p of providers) {
    await prisma.paymentIntegration.upsert({
      where: { provider: p.provider },
      update: p,
      create: p,
    });
  }
  
  console.log('Seed PaymentIntegrations terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
