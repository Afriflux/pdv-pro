// app/dashboard/tips/page.tsx
// Server Component statique — Articles & Guides pour vendeurs PDV Pro

import AcademyGrid from './AcademyGrid'
import TipsClient from './TipsClient'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getMasterclassArticles } from '@/app/actions/masterclass'

// ─── Données des 5 articles ──────────────────────────────────────────────────

const ARTICLES = [
  {
    id:    1,
    emoji: '📖',
    title: 'Comment écrire une description qui vend',
    color: 'bg-emerald-50',
    category: 'Vente',
    readTime: '3 min',
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
    category: 'Marketing',
    readTime: '4 min',
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
    category: 'Photo',
    readTime: '5 min',
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
    category: 'WhatsApp',
    readTime: '4 min',
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
    category: 'Stats',
    readTime: '6 min',
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

export default async function TipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    include: { subscriptions: { orderBy: { created_at: 'desc' }, take: 1 } }
  })
  const isPro = store?.subscriptions?.[0]?.plan === 'pro'
  
  // Simulation de la progression pour la gamification
  const userProgress = 40; 

  // Récupération des articles depuis la BDD
  let dbArticles = await getMasterclassArticles(false)

  // Auto-seed si la BDD est vide
  if (dbArticles.length === 0) {
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
          is_active: true
        }
      })
    }
    dbArticles = await getMasterclassArticles(false)
  }

  return (
    <div className="w-full bg-[#FAFAF7] min-h-screen">

      {/* ── HERO BANNER PREMIUM ── */}
      <div className="relative overflow-hidden bg-[#0A0A0A] px-6 py-12 md:py-16 mb-8 mt-2 mx-4 sm:mx-8 rounded-[2rem] shadow-xl">
        {/* Décors d'arrière-plan */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#0F7A60]/30 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gold/20 to-transparent rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative max-w-5xl mx-auto z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
              <span className="text-gold font-bold text-xs">✨ PDV Pro Academy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Devenez un maître de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200">vente en ligne.</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
              Découvrez les stratégies exactes utilisées par le top 1% des vendeurs en Afrique. Des guides ultra-actionnables, des astuces secrètes et des techniques qui ont fait leurs preuves.
            </p>
            
            {/* Gamification Progress */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Votre Niveau</p>
                  <p className="text-white font-black text-lg">Vendeur Initié</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-black">{userProgress}%</p>
                </div>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0F7A60] to-emerald-400 rounded-full" style={{ width: `${userProgress}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-3">🎯 Lisez encore 3 guides pour débloquer le badge <strong className="text-gray-300">Expert</strong> et obtenir un badge sur votre boutique.</p>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4 min-w-[300px]">
            {/* Stats widgets */}
            <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4 transform rotate-2 hover:rotate-0 transition-all cursor-default">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">📈</div>
              <div>
                <p className="text-white font-black text-xl">+47%</p>
                <p className="text-xs text-gray-400 font-medium">De CA en appliquant nos méthodes</p>
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4 transform -rotate-2 hover:rotate-0 transition-all cursor-default translate-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">👥</div>
              <div>
                <p className="text-white font-black text-xl">1 200+</p>
                <p className="text-xs text-gray-400 font-medium">Vendeurs formés ce mois-ci</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 pb-20 space-y-10">
        
        {/* SECTION: ALERTS & NEWS (TipsClient) */}
        <div>
          <div className="flex items-center gap-2 mb-6 ml-2">
            <div className="w-2 h-6 rounded-full bg-gold"></div>
            <h2 className="text-xl font-black text-ink">Alertes & Nouveautés</h2>
          </div>
          <TipsClient userId={user.id} isPro={isPro} />
        </div>

        {/* SECTION: MASTERCLASS GRID */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-8 ml-2">
            <div className="w-2 h-6 rounded-full bg-[#0F7A60]"></div>
            <h2 className="text-xl font-black text-ink">La Bibliothèque Masterclass</h2>
          </div>
          <AcademyGrid articles={dbArticles as any} />
        </div>

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
