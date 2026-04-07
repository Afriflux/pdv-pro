import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true')
    }
  }
})

async function main() {
  console.log('Seeding System Workflows (Marketplace)...')
  
  const workflows = [
      {
        title: 'Relance Automatique - Panier Abandonné',
        description: 'Workflow classique pour récupérer jusqu\'à 25% de vos ventes perdues. Envoie 2 emails de relance automatiques.',
        status: 'active',
        triggerType: 'CART_ABANDONED',
        is_premium: true,
        price: 9900,
        config: {
          actions: [
            { id: '1', type: 'DELAY', config: { duration: 30, unit: 'minutes' } },
            { id: '2', type: 'SEND_EMAIL', config: { subject: 'Votre panier vous attend !', template: 'abandoned_cart_1' } },
            { id: '3', type: 'DELAY', config: { duration: 12, unit: 'hours' } },
            { id: '4', type: 'SEND_EMAIL', config: { subject: 'Dernière chance avec -10%', template: 'abandoned_cart_2' } }
          ]
        }
      },
      {
        title: 'Onboarding VIP - Nouveau Client',
        description: 'Parcours d\'accueil premium pour remercier le client de son achat et présenter la marque.',
        status: 'active',
        triggerType: 'ORDER_CREATED',
        is_premium: false,
        price: 0,
        config: {
          actions: [
            { id: '1', type: 'SEND_EMAIL', config: { subject: 'Bienvenue dans la famille !', template: 'welcome_series_1' } },
            { id: '2', type: 'CREATE_TASK', config: { title: 'Appel de bienvenue', priority: 'high', assignee: 'closer' } },
            { id: '3', type: 'DELAY', config: { duration: 2, unit: 'days' } },
            { id: '4', type: 'SEND_EMAIL', config: { subject: 'Vos premiers pas avec le produit', template: 'welcome_series_2' } }
          ]
        }
      },
      {
        title: 'Assignation Lead Qualifié -> Closer',
        description: 'Dès qu\'un lead s\'inscrit ou remplit un formulaire, il est assigné à un Closer pour appel immédiat.',
        status: 'active',
        triggerType: 'LEAD_CREATED',
        is_premium: true,
        price: 15000,
        config: {
          actions: [
            { id: '1', type: 'CREATE_TASK', config: { title: 'Lead Entrant à rappeler en moins de 15min', priority: 'high', assignee: 'closer' } },
            { id: '2', type: 'SEND_EMAIL', config: { subject: 'Nouveau Lead Assigné', template: 'notify_closer' } }
          ]
        }
      }
    ]

  for (const wf of workflows) {
    try {
      await prisma.workflow.create({ data: wf })
    } catch (e) {
      console.error("Erreur sur: ", wf.title, e)
    }
  }

  console.log('Workflows seed done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
