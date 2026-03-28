import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const mastercourses = [
  {
    title: 'Sourcing Alibaba : Le Guide Vendeur',
    emoji: '🇨🇳',
    color: 'bg-emerald-50',
    category: 'Vente',
    readTime: '10 min',
    is_active: true,
    intro: "Acheter en Chine n'est pas une loterie. Découvrez les méthodes exactes pour trouver les vraies usines, éviter les revendeurs (trading companies) et importer des produits de haute qualité au meilleur prix pour le marché africain.",
    tips: [
      {
        number: 1,
        title: "Rechercher avec précision (Mots-clés + Filtres)",
        desc: "L'erreur de 90% des débutants est de taper 'Smartwatch' sur Alibaba. Utilisez des termes spécifiques (ex: 'T500 Smartwatch OEM'). Surtout, activez toujours les filtres : **Trade Assurance** et **Verified Supplier**. Cela élimine immédiatement les vendeurs non fiables.",
        imageUrl: "https://loremflickr.com/800/400/warehouse,boxes/all" // Warehouse/Boxes
      },
      {
        number: 2,
        title: "Repérer les vraies usines",
        desc: "Lisez le nom de l'entreprise. S'il contient 'Trading' ou 'Import/Export', c'est un intermédiaire. Cherchez les mots 'Technology', 'Manufacturing', ou 'Factory'. Vérifiez leur catalogue : une usine vend une seule catégorie de produits. Si un vendeur propose des montres, des robes et des coques iPhone, fuyez.",
        imageUrl: "https://loremflickr.com/800/400/factory,manufacturing/all" // Factory
      },
      {
        number: 3,
        title: "Le message d'approche parfait",
        desc: "Ne dites jamais 'Je cherche juste 5 pièces'. Présentez-vous comme le responsable achat d'une marque en croissance au Sénégal/Côte d'Ivoire. \n\nExemple : 'Hi, I'm the Purchasing Manager of [Votre Marque]. We are looking to test the market with 50 units before scaling to 500+ units monthly. Please provide the DDP price to [Ville du transitaire en Chine].'",
      },
      {
        number: 4,
        title: "Négocier le MOQ (Minimum Order Quantity)",
        desc: "Le MOQ affiché (ex: 500 pièces) est TOUJOURS négociable. Dites au vendeur que c'est une 'Trial Order' (Commande d'essai) pour tester la qualité avant le gros volume. L'usine acceptera de baisser le MOQ si elle sent le potentiel de votre marché.",
      }
    ]
  },
  {
    title: 'Transitaires : La logistique Chine-Afrique',
    emoji: '🚢',
    color: 'bg-blue-50',
    category: 'Logistique',
    readTime: '8 min',
    is_active: true,
    intro: "Comment acheminer votre marchandise de Guangzhou/Yiwu jusqu'à Dakar ou Abidjan sans vous ruiner ? Le choix du fret et du bon transitaire est le nerf de la guerre de votre rentabilité.",
    tips: [
      {
        number: 1,
        title: "La notion d'adresse en Chine",
        desc: "Sur Alibaba, vous ne donnez PAS votre adresse locale en Afrique. Vous donnez l'adresse de l'entrepôt de votre transitaire en Chine (généralement à Guangzhou ou Yiwu). L'usine chinoise livre le transitaire en 48h.",
        imageUrl: "https://loremflickr.com/800/400/shipping,container/all" // Shipping container
      },
      {
        number: 2,
        title: "Fret Aérien ou Maritime ?",
        desc: "✈️ Aérien : 7 à 12 jours. Idéal pour tester un produit, pour les petites pièces électroniques ou la mode légère. Se paie au Kilo (CBM).\n\n🚢 Maritime : 30 à 45 jours. Obligatoire pour les gros volumes, la maison, l'électroménager. Se paie au CBM (Mètre cube).",
        imageUrl: "https://loremflickr.com/800/400/airplane,cargo/all" // Airplane
      },
      {
        number: 3,
        title: "Le Poids Volumétrique : L'arnaque classique",
        desc: "Attention ! Les compagnies aériennes facturent selon la plus grande valeur entre le Poids Réel ou le Poids Volumétrique (Longueur x Largeur x Hauteur / 6000). Demandez toujours à votre usine de compresser ou retirer les boîtes inutiles pour économiser le fret.",
      }
    ]
  },
  {
    title: 'Structurer vos Facebook & TikTok Ads',
    emoji: '🚀',
    color: 'bg-purple-50',
    category: 'Marketing',
    readTime: '12 min',
    is_active: true,
    intro: "La méthode exacte pour lancer des publicités rentables en Afrique en 2026. L'ère du ciblage ultra-précis est révolue. Aujourd'hui, c'est la Créative (le visuel) qui fait le tri.",
    tips: [
      {
        number: 1,
        title: "La Créative Reine : Le Format UGC",
        desc: "Oubliez les bannières graphiques figées. Ce qui vend aujourd'hui, c'est l'UGC (User Generated Content) filmé au téléphone. \n\nStructure : \n1. Hook (3s) : Montrer le problème.\n2. Corps (10s) : Démonstration physique du produit.\n3. Preuve (5s) : Témoignage.\n4. CTA : 'Commande en cliquant ici !'",
        imageUrl: "https://loremflickr.com/800/400/smartphone,social/all" // Social Media/Phone
      },
      {
        number: 2,
        title: "La Campagne Broad (Large)",
        desc: "Sur Facebook, pour le marché ouest-africain, ne mettez plus aucun centre d'intérêt. Laissez le ciblage sur 'Sénégal/Côte d'Ivoire', Âge : 18-50. L'algorithme de Facebook est assez intelligent pour trouver les acheteurs si votre vidéo est parlante.",
        imageUrl: "https://loremflickr.com/800/400/analytics,graphs/all" // Analytics screen
      },
      {
        number: 3,
        title: "Objectif de Campagne : WhatsApp vs Site Web",
        desc: "Si vous n'avez pas de site, utilisez l'objectif 'Messages' vers WhatsApp. \nSi vous utilisez PDV Pro, utilisez l'objectif 'Conversions/Ventes'. L'avantage du site PDV Pro est qu'il filtre les curieux et augmente la valeur de votre pixel !",
      }
    ]
  },
  {
    title: 'Maîtriser le Cash on Delivery (COD)',
    emoji: '🤑',
    color: 'bg-indigo-50',
    category: 'Vente',
    readTime: '7 min',
    is_active: true,
    intro: "Le COD est le roi en Afrique (90% des paiements). Mais il s'accompagne de retours colis et d'impayés. Voici comment optimiser votre confirmation de commande pour frôler les 95% de livraison réussie.",
    tips: [
      {
        number: 1,
        title: "Appel de Confirmation Express (< 30 min)",
        desc: "La règle d'or : Appelez le client dans les 30 minutes suivant sa commande sur votre page PDV Pro. L'achat en COD est souvent impulsif. Si vous appelez le lendemain, l'excitation a disparu.",
        imageUrl: "https://loremflickr.com/800/400/callcenter,agents/all" // Call center / Phone
      },
      {
        number: 2,
        title: "Le Script de Confirmation",
        desc: "Ne dites pas 'Vous avez passé commande ?'.\nDites : 'Bonjour M. Kane, c'est [Marque]. Je prépare actuellement votre [Produit] pour expédition [date]. Pouvez-vous me confirmer que votre quartier exact est bien à côté de [Repère] pour faciliter le travaileur de notre livreur ?'",
      },
      {
        number: 3,
        title: "L'Art de l'Upsell au téléphone",
        desc: "Lors de cet appel, proposez systématiquement une offre additionnelle. 'Puisque vous payez la livraison, désirez-vous ajouter une deuxième pièce pour votre femme/mari avec 30% de réduction ?'. Cela double littéralement les profits nets de la journée.",
        imageUrl: "https://loremflickr.com/800/400/sales,business/all" // Sales/Payment
      }
    ]
  },
  {
    title: 'Le Tunnel de Vente Parfait sur PDV Pro',
    emoji: '🛍️',
    color: 'bg-emerald-50',
    category: 'Vente',
    readTime: '15 min',
    is_active: true,
    intro: "Comment transformer un visiteur curieux en acheteur compulsif. Apprenez à optimiser vos fiches produits, configurer vos zones de livraison et utiliser les options de cross-selling natives de PDV Pro pour doubler votre panier moyen.",
    tips: [
      {
        number: 1,
        title: "La Fiche Produit qui Convertit (Copywriting)",
        desc: "Les caractéristiques techniques ennuient vos clients. Vendez-leur des BÉNÉFICES.\n\nMauvais : 'Montre avec batterie 400mAh, écran IPS, Bluetooth 5.0'.\nPDV Pro Master : 'Restez connecté 7 jours sans recharger. Lisez vos messages WhatsApp directement sur votre poignet sans sortir votre téléphone.'",
        imageUrl: "https://loremflickr.com/800/400/ecommerce,product/all" // eCommerce / Product
      },
      {
        number: 2,
        title: "Le Checkout Express & La Rassurance",
        desc: "Évitez de demander trop d'informations. Sur PDV Pro, limitez votre formulaire d'achat au strict nécessaire : Nom, Téléphone, Ligne d'adresse exacte. Affichez fièrement le badge 'Paiement à la livraison', c'est l'argument numéro 1 en Afrique.",
        imageUrl: "https://loremflickr.com/800/400/checkout,online/all" // Checkout
      },
      {
        number: 3,
        title: "Configuration des Zones Tarifaires",
        desc: "Ne faites pas d'erreurs sur vos marges de livraison ! Configurez une zone locale (ex: Dakar Plateau) à taux réduit (ex: 1500 FCFA), et des zones éloignées (ex: Rufisque / Diamniadio) à PRIX JUSTE (ex: 3000 FCFA). Une livraison sous-facturée tue vos bénéfices nets.",
      }
    ]
  },
  {
    title: 'PDV Pro Wallet : Retraits & Cashflow',
    emoji: '💳',
    color: 'bg-blue-50',
    category: 'Finance',
    readTime: '6 min',
    is_active: true,
    intro: "En E-commerce COD, le cashflow est l'oxygène de votre entreprise. Découvrez comment utiliser le Portefeuille Web de PDV Pro pour centraliser votre trésorerie, retirer vos fonds instantanément (Mobile Money) et payer vos publicités avec sérénité.",
    tips: [
      {
        number: 1,
        title: "Dépôts et Solde Wallet",
        desc: "Dès que vos livreurs ou partenaires logistiques encaissent le cash de vos clients, ils peuvent recharger votre solde PDV Pro Wallet. Cela vous évite de transporter ou compter des liasses de billets et sécurise vos finances en temps réel.",
        imageUrl: "https://loremflickr.com/800/400/wallet,digital/all" // Digital Wallet
      },
      {
        number: 2,
        title: "Faire des retraits Mobile Money en 1 clic",
        desc: "Besoin de payer des publicités d'urgence ? Depuis votre Wallet, demandez un retrait vers votre numéro Wave, Orange Money, ou MTN Mobile Money. Les transferts sont traités rapidement pour ne jamais casser la dynamique de vos campagnes.",
        imageUrl: "https://loremflickr.com/800/400/mobile,money/all" // Mobile phone
      },
      {
        number: 3,
        title: "Traçabilité et Comptabilité",
        desc: "Chaque transaction (Encaissement, Livraison, Retrait) est tracée. Allez dans la section 'Finances' de votre tableau de bord pour télécharger l'historique de vos flux. Finis les cahiers brouillons, tout est auditable en un clic.",
        imageUrl: "https://loremflickr.com/800/400/accounting,spreadsheet/all" // Accounting
      }
    ]
  },
  {
    title: 'Workflows & Automatisations Intelligentes',
    emoji: '🤖',
    color: 'bg-indigo-50',
    category: 'Vente',
    readTime: '10 min',
    is_active: true,
    intro: "Pourquoi travailler dur quand le logiciel peut travailler pour vous ? Automatisez l'assignation de vos livreurs, les notifications Telegram à vos équipes et la gestion de votre CRM grâce aux Workflows de PDV Pro.",
    tips: [
      {
        number: 1,
        title: "Comprendre la logique 'Déclencheur -> Action'",
        desc: "Un Workflow PDV Pro fonctionne avec une règle simple : SI [Évènement] ALORS [Action]. \nExemple : SI [Nouvelle Commande sur Dakar] ALORS [Assigner au Livreur Madiop] + [Lui envoyer une notification WhatsApp].",
        imageUrl: "https://loremflickr.com/800/400/automation,code/all" // Automation logic
      },
      {
        number: 2,
        title: "Créer une cellule de Confirmation via Telegram",
        desc: "Connectez PDV Pro à un groupe Telegram (ex: 'Team Call Center'). Créez un workflow : À chaque nouvelle commande (Statut: En Attente), PDV Pro envoie les détails du client dans ce groupe. Vos standardistes n'ont même plus besoin d'ouvrir l'application Web pour travailler !",
        imageUrl: "https://loremflickr.com/800/400/telegram,chat/all" // Telegram / chat
      },
      {
        number: 3,
        title: "Automatisations de Statuts (Le Saint Graal)",
        desc: "Dès qu'un livreur clique sur 'Livré' sur son application, l'automatisation ajoute l'email du client à votre newsletter 'Clients VIP'. S'il clique sur 'Refusé', le workflow l'ajoute à une liste d'exclusion pour ne plus gaspiller du budget pub sur cette personne !",
      }
    ]
  },
  {
    title: 'Analytics : Lire votre Dashboard PDV Pro',
    emoji: '📊',
    color: 'bg-purple-50',
    category: 'Marketing',
    readTime: '8 min',
    is_active: true,
    intro: "Les chiffres ne mentent jamais. Mais savoir lire ses métriques PDV Pro est la différence entre un vendeur amateur et un e-commerçant qui scale à plusieurs millions par mois.",
    tips: [
      {
        number: 1,
        title: "Le vrai chiffre à regarder : Le Taux de Livraison",
        desc: "Oubliez le chiffre d'affaires brut généré par les publicités. Concentrez-vous sur vos Statistiques PDV Pro : Quel est le ratio entre les commandes passées et les commandes effectivement livrées et encaissées (Succès de livraison). Visez toujours > 70%.",
        imageUrl: "https://loremflickr.com/800/400/dashboard,charts/all" // Business Dashboard
      },
      {
        number: 2,
        title: "Identifier les maillons faibles géographiques",
        desc: "Utilisez la carte interactive ou les rapports par zones. Si vous remarquez qu'une ville spécifique de la banlieue a 45% de taux de retour à cause des distances, désactivez la publicité pour cette ville ou augmentez radicalement le tarif de livraison pour décourager les clients peu engagés.",
      },
      {
        number: 3,
        title: "Pixel Meta et API de Conversions",
        desc: "Acheter aveuglément du trafic est suicidaire. Rendez-vous dans les Paramètres de PDV Pro. Collez votre ID de Pixel Facebook et TikTok. Nos serveurs renverront les 'Achats' à Facebook avec la valeur réelle, nourrissant l'intelligence artificielle de Zuckerberg pour trouver de meilleurs clients !",
        imageUrl: "https://loremflickr.com/800/400/digital,marketing/all" // Digital tracking
      }
    ]
  },
  {
    title: 'Affiliation : Bâtissez votre Armée de Vendeurs',
    emoji: '🤝',
    color: 'bg-emerald-50',
    category: 'Croissance',
    readTime: '11 min',
    is_active: true,
    intro: "Pourquoi risquer votre propre budget publicitaire alors que des centaines d'autres personnes peuvent vendre vos produits pour vous à la commission ? Le portail Affiliation PDV Pro est une révolution.",
    tips: [
      {
        number: 1,
        title: "Comment fonctionne l'onglet Affiliation ?",
        desc: "Vous définissez une commission (ex: 3000 FCFA) par vente pour un produit X de votre catalogue. Les affiliés (étudiants, web-marketeurs) inscrits sur PDV Pro voient votre produit dans leur MarketPlace d'Affiliation. S'ils le choisissent, ils obtiennent un lien unique de vente vers votre boutique.",
        imageUrl: "https://loremflickr.com/800/400/network,people/all" // Partnership / network
      },
      {
        number: 2,
        title: "Les Affiliés n'ont pas accès à vos données sensibles",
        desc: "Lorsque l'affilié ramène une vente, la commande tombe dans VOTRE Dashboard. C'est vous ou vos livreurs qui effectuez la livraison. L'affilié voit simplement que 'Sa commande #443 est En Cours de Livraison'.",
      },
      {
        number: 3,
        title: "La Magie du Reversement Automatique",
        desc: "Le génie du système : Une fois que vous encaissez la commande physique (Statut Livré), PDV Pro bloque l'argent de la commission et le crédite automatiquement sur le Portefeuille (Wallet) de l'affilié. Aucune comptabilité pour vous, tout est transparent ! L'Affilié est heureux, vous êtes heureux.",
        imageUrl: "https://loremflickr.com/800/400/money,smartphone/all" // Success payout
      }
    ]
  }
]

async function main() {
  console.log('🚀 Démarrage du seed du Mastercourse...')
  
  // Clean up existing to avoid duplicates
  await prisma.masterclassArticle.deleteMany({
    where: {
      title: {
        in: mastercourses.map(c => c.title)
      }
    }
  })
  console.log('🧹 Anciens cours nettoyés.')
  
  for (const course of mastercourses) {
    await prisma.masterclassArticle.create({
      data: {
        title: course.title,
        emoji: course.emoji,
        color: course.color,
        category: course.category,
        readTime: course.readTime,
        intro: course.intro,
        is_active: course.is_active,
        tips: course.tips
      }
    })
    console.log(`✅ Créé : ${course.title}`)
  }
  
  console.log('🎉 Seed Mastercourse terminé avec succès !')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
