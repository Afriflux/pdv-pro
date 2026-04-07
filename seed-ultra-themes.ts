import { PrismaClient } from '@prisma/client'

// Use pgbouncer to avoid connection issues locally 
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true')
    }
  }
})

async function main() {
  console.log('Seeding Ultra-Beautiful Themes...')

  const themes = [
    {
      name: 'Yayyam Original (Classique)',
      description: 'Le thème e-commerce iconique avec lequel tout a commencé, parfait pour le Fast-Food et les cosmétiques de base.',
      type: 'storefront',
      category: 'Général',
      niche: 'Général',
      preview_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
      data: { blocks: [], settings: { primaryColor: '#0F7A60' } },
      is_premium: false,
      price: 0,
      is_global: true,
      allowed_roles: ['vendor']
    },
    {
      name: 'Digital Creator Hub',
      description: 'L\'ultime portail pour les vendeurs de formations et d\'infoproduits. Sombre, audacieux, immersif.',
      type: 'digital_store',
      category: 'Produits Digitaux',
      niche: 'Formateur',
      preview_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
      data: { blocks: [], settings: { primaryColor: '#6366f1' } },
      is_premium: true,
      price: 15000,
      is_global: true,
      allowed_roles: ['vendor', 'affiliate']
    },
    {
      name: 'Gourmet Prestige',
      description: 'Un design épuré, élégant, dédié aux restaurants hauts de gamme, pâtisseries, et épiceries fines.',
      type: 'restaurant',
      category: 'Restauration',
      niche: 'Luxe',
      preview_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
      data: { blocks: [], settings: { primaryColor: '#b45309' } },
      is_premium: true,
      price: 19900,
      is_global: true,
      allowed_roles: ['vendor']
    },
    {
      name: 'Tech Nova',
      description: 'Boutique ultra-rapide pour composants tech et téléphones avec support zoom 3D sur produits.',
      type: 'storefront',
      category: 'High-Tech',
      niche: 'Électronique',
      preview_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80',
      data: { blocks: [], settings: { primaryColor: '#0ea5e9' } },
      is_premium: false,
      price: 0,
      is_global: true,
      allowed_roles: ['vendor']
    },
    {
      name: 'Bio-Link Minimal',
      description: 'Page de liens personnelle épurée pour rediriger le trafic Instagram / TikTok.',
      type: 'bystart',
      category: 'Réseaux',
      niche: 'Influenceur',
      preview_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80',
      data: { blocks: [], settings: { primaryColor: '#e11d48' } },
      is_premium: false,
      price: 0,
      is_global: true,
      allowed_roles: ['all']
    },
    {
      name: 'Streetwear Fusion',
      description: 'Faites ressortir l\'aspect brut de vos collections mode grâce à ce thème néo-urbain asymétrique.',
      type: 'storefront',
      category: 'Mode',
      niche: 'Urbain',
      preview_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80',
      data: { blocks: [], settings: { primaryColor: '#000000' } },
      is_premium: true,
      price: 9900,
      is_global: true,
      allowed_roles: ['vendor']
    }
  ]

  for (const t of themes) {
    try {
      await prisma.themeTemplate.create({ data: t })
      console.log('Créé: ', t.name)
    } catch (e) {
      console.error('Erreur sur: ', t.name, e)
    }
  }

  console.log('Thèmes additionnels injectés !')
}

main().catch(console.error).finally(() => prisma.$disconnect())
