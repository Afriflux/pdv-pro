import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Marketplace Apps...')
  
  await prisma.marketplaceApp.deleteMany({}) // Clean up previous
  await prisma.themeTemplate.deleteMany({}) // Clean up previous

  await prisma.marketplaceApp.createMany({
    data: [
      {
        name: 'Yayyam CRM Connect',
        description: 'Synchronise toutes vos commandes COD avec votre Google Sheets et automatise le support.',
        icon_url: '📞',
        category: 'Productivity',
        is_premium: true,
        price: 4900,
        allowed_roles: ['vendor', 'admin'],
        features: [
          { title: 'Google Sheets Sync', desc: 'Sync en temps réel' },
          { title: 'Support Auto', desc: 'Réponses pré-écrites sur commandes' }
        ],
        active: true
      },
      {
        name: 'IA Check360°',
        description: 'Analysez l\'abandon de panier en temps réel et envoyez des emails de relance magiques.',
        icon_url: '🤖',
        category: 'Analytics',
        is_premium: true,
        price: 9900,
        allowed_roles: ['vendor'],
        features: [
          { title: 'Analyse Prédictive', desc: 'Voit qui risque d\'abandonner' },
          { title: 'Relance Email', desc: 'A/B testing des objets d\'email' }
        ],
        active: true
      },
      {
        name: 'Telegram Auto-Invite',
        description: 'Requis pour les vendeurs de produits digitaux / communautés. Envoie le lien d\'accès après paiement.',
        icon_url: '✈️',
        category: 'Marketing',
        is_premium: false,
        price: 0,
        allowed_roles: ['vendor', 'affiliate'],
        features: [
          { title: 'Lien Unique', desc: 'Génère un lien Telegram révocable' }
        ],
        active: true
      }
    ]
  })

  console.log('Seeding Themes...')
  
  await prisma.themeTemplate.createMany({
    data: [
      {
        name: 'Vogue Minimal',
        description: 'Le thème parfait pour les marques de prêt-à-porter et de cosmétiques de luxe.',
        type: 'sale_page',
        category: 'Mode & Beauté',
        niche: 'Luxe',
        preview_url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80',
        data: { blocks: [], settings: { primaryColor: '#2C1D11', fontStyle: 'serif' } },
        is_premium: false,
        price: 0,
        is_global: true,
        allowed_roles: ['vendor'],
        active: true
      },
      {
        name: 'Cyber Noir',
        description: 'Design ultra-moderne pour revendeurs de matériel électronique, téléphones et PC.',
        type: 'sale_page',
        category: 'High-Tech',
        niche: 'Électronique',
        preview_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80',
        data: { blocks: [], settings: { primaryColor: '#00F0FF', fontStyle: 'mono' } },
        is_premium: true,
        price: 5000,
        is_global: true,
        allowed_roles: ['vendor'],
        active: true
      },
      {
        name: 'Influenceur Bio-Link',
        description: 'Remplace Linktree. Mettez vos produits phares et vos réseaux en avant.',
        type: 'bio_link',
        category: 'Réseaux Sociaux',
        preview_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80',
        data: { blocks: [], settings: { primaryColor: '#E1306C', fontStyle: 'sans' } },
        is_premium: false,
        price: 0,
        is_global: true,
        allowed_roles: ['all'],
        active: true
      }
    ]
  })
  
  console.log('Seed done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
