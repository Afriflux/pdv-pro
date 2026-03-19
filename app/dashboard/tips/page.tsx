// app/dashboard/tips/page.tsx
// Server Component statique — Articles & Guides pour vendeurs PDV Pro

import TipsAccordion from './TipsAccordion'

export const dynamic = 'force-static'

// ─── Données des 5 articles ──────────────────────────────────────────────────

const ARTICLES = [
  {
    id:    1,
    emoji: '📖',
    title: 'Comment écrire une description qui vend',
    color: 'bg-emerald-50',
    intro:
      'Une fiche produit bien rédigée peut multiplier votre taux de conversion par 3. ' +
      'En Afrique, les acheteurs en ligne cherchent la confiance avant tout : ' +
      'votre description doit répondre à leurs doutes avant même qu\'ils les formulent.',
    tips: [
      {
        number: 1,
        title:  'Soyez clair et direct dès la première ligne',
        desc:   'Le nom du produit + la promesse principale en 1 phrase. Ex : "Robe wax taille unique — livraison en 24h à Dakar". Pas de jargon, pas d\'introduction inutile.',
      },
      {
        number: 2,
        title:  'Mettez les bénéfices avant les caractéristiques',
        desc:   'Dites ce que le produit fait POUR le client, pas ce qu\'il est. "Restez au frais toute la journée" vend mieux que "Tissu 100% coton aéré".',
      },
      {
        number: 3,
        title:  'Utilisez des chiffres concrets',
        desc:   '"Livré en 48h", "7 coloris disponibles", "Plus de 200 clients satisfaits". Les chiffres rassurent et donnent de la crédibilité à votre offre.',
      },
      {
        number: 4,
        title:  'Parlez aux émotions',
        desc:   'Imaginez comment votre client se sentira APRÈS l\'achat. "Offrez-vous ce sac et recevez des compliments partout où vous allez." Vendez le résultat, pas l\'objet.',
      },
      {
        number: 5,
        title:  'Terminez toujours par un appel à l\'action',
        desc:   '"Commandez maintenant et recevez votre colis sous 24h." ou "Stock limité — profitez-en avant rupture !". Le client a besoin d\'une raison d\'agir MAINTENANT.',
      },
    ],
  },
  {
    id:    2,
    emoji: '🎯',
    title: '5 techniques pour booster vos ventes',
    color: 'bg-amber-50',
    intro:
      'Vendre en ligne en Afrique demande des stratégies adaptées au marché local. ' +
      'Ces 5 techniques sont utilisées par les top-vendeurs PDV Pro pour doubler ' +
      'leur chiffre d\'affaires en moins de 3 mois.',
    tips: [
      {
        number: 1,
        title:  'Créez des promotions flash de 24–48h',
        desc:   'La rareté déclenche l\'achat. Annoncez une réduction de 15–25% pour une durée très limitée via vos statuts WhatsApp et Instagram. Résultat : pics de ventes immédiats.',
      },
      {
        number: 2,
        title:  'Utilisez WhatsApp comme canal principal',
        desc:   'Envoyez votre lien PDV Pro à vos contacts. Relancez vos anciens clients avec une offre personnelle. WhatsApp convertit 3× mieux que les réseaux sociaux classiques en Afrique.',
      },
      {
        number: 3,
        title:  'Collectez et affichez des avis clients',
        desc:   'Demandez à chaque client satisfait une photo ou un message vocal. Publiez-les sur vos statuts et stories. La preuve sociale est le meilleur argument de vente.',
      },
      {
        number: 4,
        title:  'Misez tout sur les photos haute qualité',
        desc:   'Un produit bien photographié se vend 5× plus vite. Même avec un smartphone, une bonne lumière naturelle et un fond neutre transforment votre catalogue.',
      },
      {
        number: 5,
        title:  'Jouez avec les prix psychologiques',
        desc:   'Affichez 4 900 FCFA plutôt que 5 000 FCFA. Proposez une offre "2 achetés = 1 offert". Ces techniques augmentent le panier moyen sans baisser votre marge.',
      },
    ],
  },
  {
    id:    3,
    emoji: '📸',
    title: 'Guide photo produit avec un smartphone',
    color: 'bg-blue-50',
    intro:
      'Pas besoin d\'un studio professionnel. Avec votre téléphone et les bonnes techniques, ' +
      'vous pouvez produire des photos qui rivalisent avec des boutiques haut de gamme. ' +
      'Ce guide vous montre comment en 5 étapes simples.',
    tips: [
      {
        number: 1,
        title:  'Privilégiez la lumière naturelle indirecte',
        desc:   'Placez-vous près d\'une fenêtre côté ombre (pas en plein soleil direct qui crée des ombres dures). Le matin entre 8h et 11h est idéal. La lumière naturelle rend les couleurs fidèles.',
      },
      {
        number: 2,
        title:  'Utilisez un fond blanc ou neutre',
        desc:   'Une feuille A3 blanche, un tissu blanc ou un mur clair suffisent. Évitez les fonds chargés qui distraient l\'œil. Le fond neutre met votre produit en valeur immédiatement.',
      },
      {
        number: 3,
        title:  'Prenez toujours 3 angles minimum',
        desc:   'Face, 3/4 et détail rapproché. Pour les vêtements : portés + à plat. Pour les produits alimentaires : vue du dessus. Ces 3 angles répondent aux questions visuelles du client.',
      },
      {
        number: 4,
        title:  'Retouchez gratuitement avec Snapseed ou Lightroom Mobile',
        desc:   'Augmentez légèrement la luminosité (+10), la clarté (+15) et réduisez les ombres. Ces ajustements subtils donnent un rendu professionnel sans déformer les couleurs réelles.',
      },
      {
        number: 5,
        title:  'Maintenez une cohérence visuelle sur votre boutique',
        desc:   'Utilisez toujours le même fond, le même cadrage et les mêmes filtres. Une boutique visuellement cohérente inspire la confiance et augmente le temps passé sur votre page.',
      },
    ],
  },
  {
    id:    4,
    emoji: '💡',
    title: 'Utiliser WhatsApp Business pour vendre',
    color: 'bg-green-50',
    intro:
      'WhatsApp Business est l\'outil de vente le plus puissant pour le marché africain. ' +
      'Avec plus de 500 millions d\'utilisateurs actifs en Afrique, c\'est là où se trouvent ' +
      'vos clients. Voici comment transformer votre compte en machine à vendre.',
    tips: [
      {
        number: 1,
        title:  'Créez votre catalogue produit directement dans l\'application',
        desc:   'WhatsApp Business permet d\'ajouter vos produits avec photos, prix et lien. Partagez ce catalogue en 1 clic avec vos clients. Mettez-le à jour à chaque nouveau produit.',
      },
      {
        number: 2,
        title:  'Publiez des statuts produits quotidiennement',
        desc:   'Un statut dure 24h et atteint tous vos contacts. Publiez 1 à 3 statuts par jour : offre du jour, nouveau produit, témoignage client. La régularité crée la fidélité.',
      },
      {
        number: 3,
        title:  'Configurez des réponses automatiques',
        desc:   'Message de bienvenue, message d\'absence, réponses rapides aux questions fréquentes (prix, délai, paiement). Cela vous fait gagner 2h par jour et rassure le client.',
      },
      {
        number: 4,
        title:  'Créez un groupe VIP pour vos meilleurs clients',
        desc:   'Invitez vos 30–50 meilleurs clients dans un groupe exclusif. Offrez-leur des avant-premières, des promotions privées. Ce groupe deviendra votre meilleure source de revenus récurrents.',
      },
      {
        number: 5,
        title:  'Utilisez les listes de diffusion (Broadcast)',
        desc:   'Contrairement aux groupes, les broadcasts envoient un message individuel à chacun. Personnalisez vos relances avec le prénom. Le taux d\'ouverture atteint 90% sur WhatsApp.',
      },
    ],
  },
  {
    id:    5,
    emoji: '📊',
    title: 'Comprendre vos analytics PDV Pro',
    color: 'bg-purple-50',
    intro:
      'Vos données PDV Pro sont une mine d\'or inexploitée. Savoir lire vos statistiques, ' +
      'c\'est savoir où investir votre temps et votre argent. Voici les 5 métriques ' +
      'à surveiller chaque semaine pour piloter votre activité intelligemment.',
    tips: [
      {
        number: 1,
        title:  'Le taux de conversion : votre indicateur principal',
        desc:   'C\'est le % de visiteurs qui passent commande. Un bon taux est de 2–5%. En dessous, examinez vos photos, vos prix et votre description. Au-dessus : dupliquez ce produit !',
      },
      {
        number: 2,
        title:  'Identifiez vos top produits chaque semaine',
        desc:   'Quels produits génèrent 80% de vos ventes ? Concentrez votre budget marketing sur eux. Arrêtez de promouvoir des produits faibles — réallouez vers vos winners.',
      },
      {
        number: 3,
        title:  'Analysez vos sources de trafic',
        desc:   'D\'où viennent vos visiteurs ? WhatsApp, Instagram, TikTok, bouche à oreille ? Doublez votre présence sur le canal qui performe et testez de nouveaux canaux secondaires.',
      },
      {
        number: 4,
        title:  'Suivez l\'entonnoir de commande',
        desc:   'Combien de personnes voient votre page, combien ajoutent au panier, combien paient ? Chaque étape qui perd du monde est une opportunité d\'amélioration concrète.',
      },
      {
        number: 5,
        title:  'Prenez 3 actions correctives par semaine',
        desc:   'Ne lisez pas vos stats pour le plaisir. Engagez-vous à 3 actions concrètes chaque semaine basées sur vos données : modifier un prix, améliorer une photo, relancer un client.',
      },
    ],
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TipsPage() {
  return (
    <div className="w-full bg-[#FAFAF7] min-h-screen">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-6 mb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎓</span>
            <h1 className="text-2xl font-black text-[#1A1A1A]">Ressources & Guides</h1>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Stratégies éprouvées par les meilleurs vendeurs PDV Pro en Afrique.
            Développez votre activité étape par étape.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="bg-[#0F7A60]/10 text-[#0F7A60] text-[10px] font-black px-2.5 py-1 rounded-full">
              5 guides gratuits
            </span>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full">
              Mis à jour chaque semaine
            </span>
          </div>
        </div>
      </div>

      {/* ── ARTICLES ── */}
      <div className="max-w-3xl mx-auto px-4 pb-16 space-y-6">

        {/* Intro avec stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '📈', label: 'Vendeurs formés',   value: '1 200+' },
            { emoji: '💰', label: 'CA moyen augmenté', value: '+47%'   },
            { emoji: '⭐', label: 'Note moyenne',       value: '4.9/5'  },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <p className="font-black text-sm text-[#1A1A1A]">{stat.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Accordéon — côté client */}
        <TipsAccordion articles={ARTICLES} />

        {/* Footer CTA */}
        <div className="bg-[#0F7A60] rounded-2xl p-6 text-center space-y-3">
          <p className="text-2xl">🚀</p>
          <p className="font-black text-white text-lg">Prêt à passer à l&apos;action ?</p>
          <p className="text-sm text-white/80">
            Rejoignez la communauté PDV Pro et échangez avec d&apos;autres vendeurs
            qui appliquent ces stratégies chaque jour.
          </p>
          <a
            href="/dashboard/communautes"
            className="inline-flex items-center gap-2 bg-white text-[#0F7A60] font-black text-sm
              px-5 py-2.5 rounded-xl hover:bg-[#FAFAF7] transition-all shadow-sm"
          >
            Rejoindre la communauté →
          </a>
        </div>

      </div>
    </div>
  )
}
