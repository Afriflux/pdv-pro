import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDB() {
  console.log('🔄 Démarrage du nettoyage massif de la base de données...')

  try {
    // 1. Transactions & Finances
    console.log('Suppression des Transactions...')
    await prisma.transaction.deleteMany({})
    
    console.log('Suppression des Demandes de Retrait...')
    await prisma.withdrawal.deleteMany({})

    console.log('Suppression des Portefeuilles...')
    await prisma.wallet.deleteMany({})

    // 2. Ventes & Leads & Pages
    console.log('Suppression des Commandes (Orders) et dérivés...')
    await prisma.order.deleteMany({})

    console.log('Suppression des Leads...')
    await prisma.lead.deleteMany({})

    console.log('Suppression des Pages de Vente...')
    await prisma.salePage.deleteMany({})

    console.log('Suppression des Produits...')
    await prisma.product.deleteMany({})

    // 3. Entités Principales
    console.log('Suppression des Boutiques (Stores)...')
    await prisma.store.deleteMany({})

    console.log('Suppression des Affiliés...')
    await prisma.affiliate.deleteMany({})

    console.log('Suppression des Utilisateurs (Sauf Super-Admins)...')
    await prisma.user.deleteMany({
      where: {
        role: { notIn: ['super_admin'] }
      }
    })

    console.log('✅ Base de données purgée avec succès ! Les métriques sont à Zéro.')
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage de la base :', err)
  } finally {
    await prisma.$disconnect()
  }
}

resetDB()
