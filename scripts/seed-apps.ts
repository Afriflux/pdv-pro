import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding App Store (MarketplaceApp)...')

  const apps = [
    // --- Les 6 Nouveaux Modules Officiels ---
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
      is_premium: true,
      active: false,
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
      id: 'telegram',
      name: 'Communautés Telegram',
      description: 'Liez vos produits à des groupes privés Telegram. Générez des invitations uniques et automatisez l\'entrée/sortie de vos membres VIP.',
      category: 'Marketing',
      features: ['Lien d\'invitation unique', 'Bot Administrateur', 'Bannissement auto'],
      is_premium: true,
      active: true,
      icon_url: 'telegram'
    },

    // --- Restauration des 27 anciennes Apps ---
    { id: 'marketing', name: 'Campagnes E-mail & SMS', description: 'Créez des newsletters et des séquences marketing puissantes.', category: 'Marketing', features: ['Funnels E-mail', 'SMS Marketing', 'Audiences ciblées'], is_premium: false, active: true, icon_url: 'marketing' },
    { id: 'workflows', name: 'Automatisations & Relances', description: 'Relance des paniers abandonnés sur WhatsApp et séquences automatisées.', category: 'Marketing', features: ['WhatsApp', 'Triggers d\'achat', 'Gain de temps'], is_premium: false, active: true, icon_url: 'workflows' },
    { id: 'affilies', name: 'Réseau d\'Affiliation', description: 'Laissez d\'autres personnes vendre vos produits pour vous.', category: 'Marketing', features: ['Tracking automatique', 'Commissions', 'Liens uniques'], is_premium: false, active: true, icon_url: 'affilies' },
    { id: 'promotions', name: 'Coupons & Upsells', description: 'Faites des offres spéciales, Bumps et One-Time-Offers pour booster le panier moyen.', category: 'Marketing', features: ['Order Bumps', 'Flash Sales', 'Coupons'], is_premium: true, active: true, icon_url: 'promotions' },
    { id: 'telegram-alerts', name: 'Alertes & Bot Telegram', description: 'Recevez des notifications en direct sur Telegram pour vos ventes et alertes stock.', category: 'Marketing', features: ['Alertes Ventes', 'Infos Stock', 'Temps Réel'], is_premium: false, active: false, icon_url: 'telegram-alerts' },
    { id: 'ambassadeur', name: 'Programme Ambassadeurs VIP', description: 'Récompensez vos meilleurs clients avec un statut VIP et des avantages.', category: 'Marketing', features: ['Niveaux VIP', 'Cashback', 'Fidélisation'], is_premium: true, active: true, icon_url: 'ambassadeur' },
    { id: 'links', name: 'Lien en Bio (Link-in-Bio)', description: 'Regroupez tous vos liens, réseaux et produits clés sur une page unique.', category: 'Création', features: ['Social-friendly', 'Micro-site', 'Stats'], is_premium: false, active: true, icon_url: 'links' },
    { id: 'ai-generator', name: 'Yayyam AI Copilot', description: 'L\'Intelligence Artificielle qui rédige vos textes de vente, structure vos offres et coach votre business.', category: 'Création', features: ['Coach Business', 'Génération de Copy', 'Création de Mails'], is_premium: true, active: true, icon_url: 'ai-generator' },
    { id: 'webhooks', name: 'Notion, Zapier & Webhooks', description: 'Exportez vos ventes automatiquement vers Notion, Excel, Zapier ou Make en temps réel.', category: 'CRM', features: ['Intégration Notion', 'Zapier / Make', 'Temps Réel'], is_premium: true, active: true, icon_url: 'webhooks' },
    { id: 'customers', name: 'CRM Avancé', description: 'Base de données clients et Lifetime Value (LTV).', category: 'CRM', features: ['Filtres Achats', 'Segmentation', 'Export CSV'], is_premium: false, active: true, icon_url: 'customers' },
    { id: 'livraisons', name: 'Logistique & Livraisons', description: 'Gestion des livreurs, statuts d\'expédition et suivi physique.', category: 'Opérations', features: ['Tableau de bord Livreurs', 'Statuts', 'Zones'], is_premium: false, active: true, icon_url: 'livraisons' },
    { id: 'agenda', name: 'Bookings & Réservations', description: 'Gérez vos créneaux de coaching/consulting avec un calendrier intégré.', category: 'Opérations', features: ['Google Meet', 'Agenda partagé', 'Visios'], is_premium: false, active: true, icon_url: 'agenda' },
    { id: 'tasks', name: 'Tâches & Organisation', description: 'Outil de to-do list et gestion de projets intégré à vos ventes.', category: 'Opérations', features: ['Kanban', 'Rappels', 'Focus mode'], is_premium: false, active: true, icon_url: 'tasks' },
    { id: 'communautes', name: 'Espace Communautaire', description: 'Hébergez vos propres forums et cercles privés d\'acheteurs sans quitter la plateforme.', category: 'Opérations', features: ['Forum', 'Posts VIP', 'Engagement'], is_premium: false, active: true, icon_url: 'communautes' },
    { id: 'closers', name: 'Closing Délégué', description: 'Confiez vos leads chauds à des closers professionnels.', category: 'Opérations', features: ['Commissions directes', 'Suivi Appels', 'Outsourcing'], is_premium: true, active: true, icon_url: 'closers' },
    { id: 'academy', name: 'Yayyam Academy', description: 'Accédez aux meilleures stratégies e-commerce et mindsets de vente.', category: 'Opérations', features: ['10 cours gratuits', 'Vidéos 4K', 'Ressources PDF'], is_premium: false, active: true, icon_url: 'academy' },
    { id: 'quotes', name: 'Devis & Factures B2B', description: 'Générez des devis professionnels interactifs payables en ligne.', category: 'Opérations', features: ['PDF interactif', 'Suivi du statut', 'Paiement direct'], is_premium: false, active: true, icon_url: 'quotes' },
    { id: 'payment-links', name: 'Liens de Paiement', description: 'Créez des liens de paiement directs pour encaisser sans création de produit complète.', category: 'Paiements', features: ['Rapide', 'Sans page de vente', 'Lien Unique'], is_premium: false, active: true, icon_url: 'payment-links' },
    { id: 'server-side-pixels', name: 'Pixels & Meta CAPI', description: 'Contournez iOS 14. Injectez vos pixels Meta, TikTok et Snapchat en Server-Side.', category: 'Marketing', features: ['Server-Side API', 'TikTok Pro', 'Anti-Adblock'], is_premium: true, active: true, icon_url: 'server-side-pixels' },
    { id: 'social-proof', name: 'Preuve Sociale (Pop-ups)', description: 'Notifications automatiques des derniers achats pour booster la confiance.', category: 'Marketing', features: ['Pop-up Vente', 'Customisation', 'Haut +15% CRO'], is_premium: false, active: true, icon_url: 'social-proof' },
    { id: 'volume-discounts', name: 'Prix de Gros & Lots (B2B)', description: 'Gérez des prix dégressifs (ex: 1 pour 5k, 3 pour 12k) pour augmenter le panier.', category: 'Opérations', features: ['Prix Dégressifs', 'Mode B2B', 'Gros Volume'], is_premium: false, active: true, icon_url: 'volume-discounts' },
    { id: 'smart-reviews', name: 'Avis 5 Étoiles Automatisés', description: 'Boîte à avis automatisée via WhatsApp pour récolter des 5 étoiles après livraison.', category: 'Marketing', features: ['SMS + WhatsApp', 'Avis Vérifiés', 'Trust Badge'], is_premium: false, active: true, icon_url: 'smart-reviews' },
    { id: 'helpdesk', name: 'Helpdesk & SAV', description: 'Centralisez les réclamations clients, retours et remboursements en un seul tableau.', category: 'CRM', features: ['Ticketing', 'Historique Client', 'Résolution Rapide'], is_premium: false, active: true, icon_url: 'helpdesk' },
    { id: 'subscriptions', name: 'Abonnements Récurrents', description: 'Vendez des accès VIP ou box. Débit automatique de la carte bancaire CinetPay.', category: 'Paiements', features: ['Facturation Auto', 'SaaS Model', 'Retrait Récurrent'], is_premium: true, active: true, icon_url: 'subscriptions' }
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
