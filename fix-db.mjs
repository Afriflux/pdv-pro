import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emojis = {
  'fraud-cod': '🛡️',
  'coach-ia': '✨',
  'telegram': '✈️',
  'whatsapp-bot': '💬',
  'affilies': '🤝',
  'marketing': '📣',
  'workflows': '⚡️',
  'promotions': '🏷️',
  'ambassadeur': '🥇',
  'links': '🔗',
  'ai-generator': '🪄',
  'webhooks': '⚙️',
  'customers': '👥',
  'livraisons': '📦',
  'agenda': '📅',
  'tasks': '✅',
  'communautes': '🌐',
  'closers': '🎧',
  'academy': '🎓',
  'quotes': '📝',
  'cinetpay': '💳',
  'paytech': '💸',
  'intouch': '🏦',
  'payment-links': '🔗',
  'server-side-pixels': '🎯',
  'social-proof': '🔔',
  'volume-discounts': '🛒',
  'smart-reviews': '⭐️',
  'subscriptions': '🔄',
  'helpdesk': '🚑',
  'email-sms-marketing': '📧'
};

async function main() {
  const apps = await prisma.marketplaceApp.findMany();
  let updated = 0;
  for (const app of apps) {
    if (emojis[app.id]) {
      await prisma.marketplaceApp.update({
        where: { id: app.id },
        data: { icon_url: emojis[app.id] }
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} apps successfully!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
