import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding App Store (MarketplaceApp)...')

  const apps = [
    {
      id: 'fraud-cod',
      name: 'Anti-Fraude COD',
      description: 'Bloque automatiquement les paiements à la livraison pour les clients présentant un risque de refus ou de litiges fréquents.',
      category: 'Sécurité',
      features: ['Protection automatisée', 'Blacklist manuelle', 'Score de confiance client'],
      is_premium: false,
      active: true,
      icon_url: 'fraud-cod'
    },
    {
      id: 'coach-ia',
      name: 'Coach IA Proactif',
      description: 'Une intelligence artificielle qui analyse vos ventes quotidiennes et vous donne des recommandations stratégiques.',
      category: 'Intelligence Artificielle',
      features: ['Résumé exécutif', 'Recommandations', 'Analyse du CA quotidien'],
      is_premium: true, // Let's set it to true to show off premium capability
      active: true,
      icon_url: 'coach-ia'
    },
    {
      id: 'sms-marketing',
      name: 'SMS Marketing',
      description: 'Envoyez des SMS automatiques pour récupérer les paniers abandonnés ou faire des promotions ciblées.',
      category: 'Marketing',
      features: ['Paniers abandonnés', 'Campagnes flash', 'Intégration Twilio'],
      is_premium: true,
      active: true,
      icon_url: 'sms-marketing'
    },
    {
      id: 'whatsapp-bot',
      name: 'WhatsApp Bot',
      description: 'Bot automatisé pour confirmer les commandes COD sur WhatsApp directement et offrir un support SAV 24/7.',
      category: 'Marketing',
      features: ['Confirmation COD Auto', 'Catalogue WhatsApp', 'SAV Rapide'],
      is_premium: true,
      active: true,
      icon_url: 'whatsapp-bot'
    },
    {
      id: 'loyalty-points',
      name: 'Fidélité & Points',
      description: 'Récompensez vos meilleurs clients avec un système de points et de cagnottage par achat.',
      category: 'Marketing',
      features: ['Cagnotte Client', 'Points par Achat', 'Historique Fidélité'],
      is_premium: false,
      active: true,
      icon_url: 'loyalty-points'
    },
    {
      id: 'dropshipping',
      name: 'Dropshipping Hub',
      description: 'Proposez vos produits en marque blanche à un réseau de revendeurs ou vendez des produits Yayyam.',
      category: 'Logistique',
      features: ['Réseau Revendeurs', 'Synchronisation Stocks', 'Marge Automatique'],
      is_premium: true,
      active: true,
      icon_url: 'dropshipping'
    }
  ]

  for (const app of apps) {
    await prisma.marketplaceApp.upsert({
      where: { id: app.id },
      update: {
        name: app.name,
        description: app.description,
        category: app.category,
        features: app.features,
        is_premium: app.is_premium,
        active: app.active,
        icon_url: app.icon_url
      },
      create: {
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        features: app.features,
        is_premium: app.is_premium,
        active: app.active,
        icon_url: app.icon_url
      }
    })
    console.log(`✅ Upserted: ${app.name}`)
  }

  console.log('🎉 Seed terminé !')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
