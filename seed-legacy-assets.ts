import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Début de la migration des données vers la Marketplace...')

  // 1. SUPPRESSION DES MOCKUPS FICTIFS
  console.log('🧹 Nettoyage des anciennes applications fictives...')
  await prisma.marketplaceApp.deleteMany({})
  await prisma.masterclassArticle.deleteMany({})
  // On commente les workflows pour l'instant car ils ont déjà été seed avec de vrais dans seed-workflows.ts
  // await prisma.workflow.deleteMany({})

  // 2. MIGRATION DES APPS (AppStoreClient.tsx)
  console.log('📦 Insertion des applications réelles...')
  const REAL_APPS = [
    { id: 'marketing', category: 'Marketing', name: 'Campagnes E-mail & SMS', description: 'Créez des newsletters et des séquences marketing puissantes.', isPro: false, features: ['Funnels E-mail', 'SMS Marketing', 'Audiences ciblées'] },
    { id: 'workflows', category: 'Marketing', name: 'Automatisations & Relances', description: 'Relance des paniers abandonnés sur WhatsApp et séquences automatisées.', isPro: false, features: ['WhatsApp', 'Triggers d\'achat', 'Gain de temps'] },
    { id: 'affilies', category: 'Marketing', name: 'Réseau d\'Affiliation', description: 'Laissez d\'autres personnes vendre vos produits pour vous.', isPro: false, features: ['Tracking automatique', 'Commissions', 'Liens uniques'] },
    { id: 'promotions', category: 'Marketing', name: 'Coupons & Upsells', description: 'Faites des offres spéciales, Bumps et One-Time-Offers pour booster le panier moyen.', isPro: true, features: ['Order Bumps', 'Flash Sales', 'Coupons'] },
    { id: 'telegram-alerts', category: 'Marketing', name: 'Alertes & Bot Telegram', description: 'Recevez des notifications en direct sur Telegram pour vos ventes et alertes stock.', isPro: false, features: ['Alertes Ventes', 'Infos Stock', 'Temps Réel'] },
    { id: 'telegram', category: 'Communauté', name: 'Monétisation Telegram', description: 'Vendez l\'accès à vos groupes privés et canaux automatiqument avec des abonnements.', isPro: true, features: ['Abonnements auto', 'Canaux Payants', 'Retrait Membres'] },
    { id: 'ambassadeur', category: 'Marketing', name: 'Programme Ambassadeurs VIP', description: 'Récompensez vos meilleurs clients avec un statut VIP et des avantages.', isPro: true, features: ['Niveaux VIP', 'Cashback', 'Fidélisation'] },
    { id: 'links', category: 'Création', name: 'Lien en Bio (Link-in-Bio)', description: 'Regroupez tous vos liens, réseaux et produits clés sur une page unique.', isPro: false, features: ['Social-friendly', 'Micro-site', 'Stats'] },
    { id: 'ai-generator', category: 'Création', name: 'Assistant Coach IA', description: 'L\'Intelligence Artificielle qui rédige vos textes de vente et structure vos offres.', isPro: true, features: ['Génération de Copy', 'Création de Mails', 'Coach Business'] },
    { id: 'webhooks', category: 'CRM', name: 'Notion, Zapier & Webhooks', description: 'Exportez vos ventes automatiquement vers Notion, Excel, Zapier ou Make en temps réel.', isPro: true, features: ['Intégration Notion', 'Zapier / Make', 'Temps Réel'] },
    { id: 'customers', category: 'CRM', name: 'CRM Avancé', description: 'Base de données clients et Lifetime Value (LTV).', isPro: false, features: ['Filtres Achats', 'Segmentation', 'Export CSV'] },
    { id: 'livraisons', category: 'Opérations', name: 'Logistique & Livraisons', description: 'Gestion des livreurs, statuts d\'expédition et suivi physique.', isPro: false, features: ['Tableau de bord Livreurs', 'Statuts', 'Zones'] },
    { id: 'agenda', category: 'Opérations', name: 'Bookings & Réservations', description: 'Gérez vos créneaux de coaching/consulting avec un calendrier intégré.', isPro: false, features: ['Google Meet', 'Agenda partagé', 'Visios'] },
    { id: 'tasks', category: 'Opérations', name: 'Tâches & Organisation', description: 'Outil de to-do list et gestion de projets intégré à vos ventes.', isPro: false, features: ['Kanban', 'Rappels', 'Focus mode'] },
    { id: 'communautes', category: 'Opérations', name: 'Espace Communautaire', description: 'Hébergez vos propres forums et cercles privés d\'acheteurs sans quitter la plateforme.', isPro: false, features: ['Forum', 'Posts VIP', 'Engagement'] },
    { id: 'closers', category: 'Opérations', name: 'Closing Délégué', description: 'Confiez vos leads chauds à des closers professionnels.', isPro: true, features: ['Commissions directes', 'Suivi Appels', 'Outsourcing'] },
    { id: 'academy', category: 'Opérations', name: 'Yayyam Académie', description: 'Accédez aux meilleures stratégies e-commerce et mindsets de vente.', isPro: false, features: ['10 cours gratuits', 'Vidéos 4K', 'Ressources PDF'] },
    { id: 'quotes', category: 'Opérations', name: 'Devis & Factures B2B', description: 'Générez des devis professionnels interactifs payables en ligne.', isPro: false, features: ['PDF interactif', 'Suivi du statut', 'Paiement direct'] },
    { id: 'cinetpay', category: 'Paiements', name: 'CinetPay', description: 'Acceptez MTN, Moov, Orange, Visa et Mastercard dans toute l\'Afrique.', isPro: false, features: ['Multi-pays', 'Cards', 'Mobile Money'] },
    { id: 'paytech', category: 'Paiements', name: 'PayTech', description: 'Alternative solide pour les paiements locaux avec API.', isPro: false, features: ['API Robuste', 'Sécurisé', 'Devises locales'] },
    { id: 'intouch', category: 'Paiements', name: 'InTouch', description: 'Solution complète pour les gros volumes de transactions.', isPro: true, features: ['Corporate', 'Paiement de masse', 'Guichet'] },
    { id: 'payment-links', category: 'Paiements', name: 'Liens de Paiement', description: 'Créez des liens de paiement directs pour encaisser sans création de produit complète.', isPro: false, features: ['Rapide', 'Sans page de vente', 'Lien Unique'] },
    { id: 'server-side-pixels', category: 'Marketing', name: 'Pixels & Meta CAPI', description: 'Contournez iOS 14. Injectez vos pixels Meta, TikTok et Snapchat en Server-Side.', isPro: true, features: ['Server-Side API', 'TikTok Pro', 'Anti-Adblock'] },
    { id: 'social-proof', category: 'Marketing', name: 'Preuve Sociale (Pop-ups)', description: 'Notifications automatiques des derniers achats pour booster la confiance.', isPro: false, features: ['Pop-up Vente', 'Customisation', 'Haut +15% CRO'] },
    { id: 'volume-discounts', category: 'Opérations', name: 'Prix de Gros & Lots (B2B)', description: 'Gérez des prix dégressifs (ex: 1 pour 5k, 3 pour 12k) pour augmenter le panier.', isPro: false, features: ['Prix Dégressifs', 'Mode B2B', 'Gros Volume'] },
    { id: 'smart-reviews', category: 'Marketing', name: 'Avis 5 Étoiles Automatisés', description: 'Boîte à avis automatisée via WhatsApp pour récolter des 5 étoiles après livraison.', isPro: false, features: ['SMS + WhatsApp', 'Avis Vérifiés', 'Trust Badge'] },
    { id: 'helpdesk', category: 'CRM', name: 'Helpdesk & SAV', description: 'Centralisez les réclamations clients, retours et remboursements en un seul tableau.', isPro: false, features: ['Ticketing', 'Historique Client', 'Résolution Rapide'] },
    { id: 'subscriptions', category: 'Paiements', name: 'Abonnements Récurrents', description: 'Vendez des accès VIP ou box. Débit automatique de la carte bancaire CinetPay.', isPro: true, features: ['Facturation Auto', 'SaaS Model', 'Retrait Récurrent'] },
  ]

  for (const app of REAL_APPS) {
    await prisma.marketplaceApp.create({
      data: {
        id: app.id,
        name: app.name,
        category: app.category,
        description: app.description,
        is_premium: app.isPro, // La logique Freemium se gère ici !
        price: app.isPro ? 4900 : 0, 
        features: app.features,
        icon_url: 'zap', // Par défaut
        active: true
      }
    })
  }
  console.log(`✅ ${REAL_APPS.length} Apps ont été intégrées en BDD.`)

  // 3. MIGRATION DES COURS ACADEMY
  console.log('📚 Insertion des cours de la Yayyam Academy...')
  const ARTICLES = [
    {
      id:    1,
      emoji: '📖',
      title: 'Comment écrire une description qui vend',
      color: 'bg-emerald-50',
      category: 'Vente',
      readTime: '3 min',
      intro: 'Une fiche produit bien rédigée peut multiplier votre taux de conversion par 3. En Afrique, les acheteurs en ligne cherchent la confiance avant tout : votre description doit répondre à leurs doutes.',
      tips: [
        { number: 1, title: 'Soyez clair et direct dès la première ligne', desc: 'Le nom du produit + la promesse principale en 1 phrase.' },
        { number: 2, title: 'Mettez les bénéfices avant les caractéristiques', desc: 'Dites ce que le produit fait POUR le client, pas ce qu\'il est.' },
        { number: 3, title: 'Utilisez des chiffres concrets', desc: '"Livré en 48h", "7 coloris disponibles".' },
      ],
      isPro: false
    },
    {
      id:    2,
      emoji: '🎯',
      title: '5 techniques pour booster vos ventes',
      color: 'bg-amber-50',
      category: 'Marketing',
      readTime: '4 min',
      intro: 'Ces 5 techniques sont utilisées par les top-vendeurs pour doubler leur chiffre d\'affaires en moins de 3 mois.',
      tips: [
        { number: 1, title: 'Créez des promotions flash de 24–48h', desc: 'La rareté déclenche l\'achat.' },
        { number: 2, title: 'Utilisez WhatsApp comme canal principal', desc: 'Relancez vos anciens clients avec une offre personnelle.' },
      ],
      isPro: false
    },
    {
      id:    3,
      emoji: '📸',
      title: 'Guide photo produit avec un smartphone',
      color: 'bg-blue-50',
      category: 'Photo',
      readTime: '5 min',
      intro: 'Pas besoin d\'un studio professionnel. Avec votre téléphone et les bonnes techniques, vous pouvez produire des photos qui rivalisent avec des boutiques haut de gamme.',
      tips: [
        { number: 1, title: 'Privilégiez la lumière naturelle indirecte', desc: 'Placez-vous près d\'une fenêtre côté ombre.' },
      ],
      isPro: true
    },
    {
      id:    4,
      emoji: '💡',
      title: 'Utiliser WhatsApp Business pour vendre',
      color: 'bg-green-50',
      category: 'WhatsApp',
      readTime: '4 min',
      intro: 'WhatsApp Business est l\'outil de vente le plus puissant pour le marché africain.',
      tips: [
        { number: 1, title: 'Créez votre catalogue produit', desc: 'Partagez ce catalogue en 1 clic avec vos clients.' },
      ],
      isPro: true
    },
    {
      id:    5,
      emoji: '📊',
      title: 'Comprendre vos analytics',
      color: 'bg-purple-50',
      category: 'Stats',
      readTime: '6 min',
      intro: 'Vos données Yayyam sont une mine d\'or inexploitée. Savoir lire vos statistiques, c\'est savoir où investir votre temps et votre argent.',
      tips: [
        { number: 1, title: 'Le taux de conversion', desc: 'Un bon taux est de 2–5%.' },
      ],
      isPro: true
    },
  ]
  
  for (const art of ARTICLES) {
    await prisma.masterclassArticle.create({
      data: {
        title: art.title,
        emoji: art.emoji,
        color: art.color,
        category: art.category,
        readTime: art.readTime,
        intro: art.intro,
        tips: art.tips,
        is_premium: art.isPro, // Logique Freemium
        price: art.isPro ? 2500 : 0,
        is_active: true
      }
    })
  }
  console.log(`✅ ${ARTICLES.length} Cours ont été intégrés en BDD.`)

  // 4. MIGRATION DES THÈMES
  console.log('🎨 Insertion des anciens thèmes de pages de vente...')
  const LEGACY_THEMES = [
    { id: 'minimalist', name: 'Minimaliste', description: 'Épuré & Clair', isPro: false },
    { id: 'luxury', name: 'Luxe', description: 'Noir & Or', isPro: true },
    { id: 'dynamic', name: 'Vibrant', description: 'Vif & Énergique', isPro: false },
    { id: 'nature', name: 'Nature', description: 'Verts & Terre', isPro: false }
  ]

  for (const th of LEGACY_THEMES) {
    await prisma.themeTemplate.upsert({
      where: { id: th.id },
      update: {
        name: th.name,
        description: th.description,
        is_premium: th.isPro,
        price: th.isPro ? 7900 : 0,
        active: true
      },
      create: {
        id: th.id,
        name: th.name,
        description: th.description,
        is_premium: th.isPro,
        price: th.isPro ? 7900 : 0,
        active: true,
        preview_url: '',
        type: 'sale_page',
        category: 'Thème Classique',
        data: { blocks: [], settings: {} },
        is_global: true
      }
    })
  }
  console.log(`✅ ${LEGACY_THEMES.length} Anciens thèmes ont été intégrés en BDD.`)

  console.log('🚀 Opération terminée avec succès ! La Marketplace est prête.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
