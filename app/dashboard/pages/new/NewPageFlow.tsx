'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Globe, LayoutTemplate, ArrowRight, Wand2 } from 'lucide-react'

// ----------------------------------------------------------------
// Données templates
// ----------------------------------------------------------------
const TEMPLATES = [
  {
    id: 'beauty',
    icon: '💄',
    label: 'Parfumerie & Beauté',
    desc: 'Cosmétiques, parfums, soins',
    color: 'from-pink-400 to-rose-500',
    bg: 'bg-rose-50',
    accent: 'text-rose-600',
    defaultTitle: 'Mon espace beauté',
    sections: [
      { type: 'hero', title: 'Sublimez votre beauté naturelle', subtitle: 'Produits 100% naturels, fabriqués avec soin', cta: 'Découvrir la collection' },
      { type: 'benefits', items: ['Formules naturelles', 'Testés dermatologiquement', 'Livraison rapide'] },
      { type: 'testimonials', items: [{ name: 'Aminata D.', text: 'Ma peau n\'a jamais été aussi belle !', rating: 5 }] },
      { type: 'faq', items: [{ q: 'Les produits sont-ils naturels ?', a: 'Oui, 100% naturels et sans paraben.' }] },
      { type: 'cta', text: 'Commandez maintenant et recevez en 48h' },
    ],
  },
  {
    id: 'ebook',
    icon: '📚',
    label: 'Ebook & Digital',
    desc: 'PDF, guides, ressources numériques',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    accent: 'text-blue-600',
    defaultTitle: 'Mon guide digital',
    sections: [
      { type: 'hero', title: 'Le guide qui va changer votre vie', subtitle: 'Téléchargement immédiat après paiement', cta: 'Obtenir le guide' },
      { type: 'benefits', items: ['Accès immédiat', 'Format PDF & EPUB', 'Mises à jour gratuites'] },
      { type: 'preview', text: 'Plus de 120 pages de contenu actionnable' },
      { type: 'testimonials', items: [{ name: 'Moussa K.', text: 'J\'ai appliqué les conseils dès le lendemain !', rating: 5 }] },
      { type: 'faq', items: [{ q: 'Comment recevoir le guide ?', a: 'Vous recevez un lien de téléchargement immédiatement après paiement.' }] },
      { type: 'cta', text: 'Télécharger maintenant — accès à vie' },
    ],
  },
  {
    id: 'formation',
    icon: '🎓',
    label: 'Formation & Cours',
    desc: 'E-learning, vidéos, programmes',
    color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50',
    accent: 'text-violet-600',
    defaultTitle: 'Ma formation en ligne',
    sections: [
      { type: 'hero', title: 'Maîtrisez votre domaine en 30 jours', subtitle: 'Formation complète avec support illimité', cta: 'Rejoindre la formation' },
      { type: 'program', items: ['Module 1 : Les bases', 'Module 2 : Pratique avancée', 'Module 3 : Projets réels', 'Bonus : Ressources exclusives'] },
      { type: 'benefits', items: ['Accès à vie', 'Certificat de fin', 'Communauté privée'] },
      { type: 'testimonials', items: [{ name: 'Fatoumata B.', text: 'J\'ai trouvé un emploi 2 mois après la formation !', rating: 5 }] },
      { type: 'faq', items: [{ q: 'Faut-il des prérequis ?', a: 'Aucun prérequis, la formation est accessible à tous.' }] },
      { type: 'cta', text: 'Commencer ma formation aujourd\'hui' },
    ],
  },
  {
    id: 'food',
    icon: '🍽️',
    label: 'Restauration & Food',
    desc: 'Plats, livraison, menus',
    color: 'from-gold-light to-amber-500',
    bg: 'bg-amber-50',
    accent: 'text-amber-600',
    defaultTitle: 'Notre menu du jour',
    sections: [
      { type: 'hero', title: 'La cuisine du terroir livrée chez vous', subtitle: 'Préparé frais chaque jour avec des ingrédients locaux', cta: 'Commander maintenant' },
      { type: 'menu', items: ['Plat principal', 'Accompagnement', 'Boisson', 'Dessert maison'] },
      { type: 'benefits', items: ['Ingrédients frais', 'Livraison chaude', 'Prix imbattable'] },
      { type: 'testimonials', items: [{ name: 'Ibrahima S.', text: 'Meilleur thieboudienne de la ville !', rating: 5 }] },
      { type: 'cta', text: 'Commander et se régaler 🍛' },
    ],
  },
  {
    id: 'fashion',
    icon: '👗',
    label: 'Mode & Vêtements',
    desc: 'Prêt-à-porter, accessoires',
    color: 'from-fuchsia-400 to-pink-500',
    bg: 'bg-fuchsia-50',
    accent: 'text-fuchsia-600',
    defaultTitle: 'Mon espace de mode',
    sections: [
      { type: 'hero', title: 'Style africain, élégance moderne', subtitle: 'Collection exclusive — Édition limitée', cta: 'Voir la collection' },
      { type: 'benefits', items: ['Tissus premium', 'Tailles S à 3XL', 'Retours sous 7 jours'] },
      { type: 'gallery', text: 'Collection capsule disponible maintenant' },
      { type: 'testimonials', items: [{ name: 'Mariama C.', text: 'J\'ai reçu tellement de compliments !', rating: 5 }] },
      { type: 'faq', items: [{ q: 'Quels sont les délais de livraison ?', a: '2 à 5 jours ouvrables selon votre localisation.' }] },
      { type: 'cta', text: 'Commander avant rupture de stock' },
    ],
  },
  {
    id: 'services',
    icon: '💻',
    label: 'Services Digitaux',
    desc: 'Design, dev, marketing',
    color: 'from-cyan-400 to-teal-500',
    bg: 'bg-cyan-50',
    accent: 'text-cyan-600',
    defaultTitle: 'Mes services digitaux',
    sections: [
      { type: 'hero', title: 'Des services digitaux qui convertissent', subtitle: 'Design, développement et marketing pour votre croissance', cta: 'Obtenir un devis' },
      { type: 'services', items: ['Design UI/UX', 'Développement web', 'Community management', 'Publicité Facebook & Google'] },
      { type: 'benefits', items: ['Livraison rapide', 'Révisions illimitées', 'Support 7j/7'] },
      { type: 'testimonials', items: [{ name: 'Oumar T.', text: 'Mon chiffre d\'affaires a doublé en 3 mois !', rating: 5 }] },
      { type: 'cta', text: 'Réserver ma prestation maintenant' },
    ],
  },
  {
    id: 'coaching',
    icon: '🏋️',
    label: 'Coaching & Bien-être',
    desc: 'Coaching, thérapie, sport',
    color: 'from-green-400 to-emerald-500',
    bg: 'bg-green-50',
    accent: 'text-green-600',
    defaultTitle: 'Mon programme de coaching',
    sections: [
      { type: 'hero', title: 'Transformez votre vie en 90 jours', subtitle: 'Coaching personnalisé — Résultats garantis', cta: 'Réserver ma session' },
      { type: 'coach', name: 'Votre coach', bio: 'Expert certifié avec 10 ans d\'expérience', credentials: ['Certifié ICF', 'Plus de 500 clients'] },
      { type: 'benefits', items: ['Sessions 1-1', 'Plan personnalisé', 'Suivi hebdomadaire'] },
      { type: 'testimonials', items: [{ name: 'Aïssatou N.', text: 'J\'ai perdu 12kg en 3 mois grâce au programme !', rating: 5 }] },
      { type: 'faq', items: [{ q: 'Comment se déroulent les sessions ?', a: 'En ligne via vidéo ou en présentiel selon vos préférences.' }] },
      { type: 'cta', text: 'Commencer ma transformation aujourd\'hui' },
    ],
  },
  {
    id: 'ecommerce',
    icon: '🛒',
    label: 'E-commerce Général',
    desc: 'Produits physiques variés',
    color: 'from-gold-light to-red-500',
    bg: 'bg-gold/10',
    accent: 'text-gold-light',
    defaultTitle: 'Mon espace en ligne',
    sections: [
      { type: 'hero', title: 'Qualité premium, prix local', subtitle: 'Tous vos produits préférés livrés en 24-48h', cta: 'Acheter maintenant' },
      { type: 'benefits', items: ['Paiement sécurisé', 'Retours faciles', 'Support client réactif'] },
      { type: 'testimonials', items: [{ name: 'Cheikh A.', text: 'Commande reçue en 2 jours, qualité parfaite !', rating: 5 }] },
      { type: 'faq', items: [{ q: 'Quels modes de paiement ?', a: 'Wave, Orange Money, carte bancaire et paiement à la livraison.' }] },
      { type: 'cta', text: 'Commander et profiter de la livraison rapide' },
    ],
  },
  {
    id: 'music',
    icon: '🎵',
    label: 'Musique & Arts',
    desc: 'Beats, œuvres, billets concerts',
    color: 'from-gold-light to-gold',
    bg: 'bg-yellow-50',
    accent: 'text-yellow-600',
    defaultTitle: 'Mon univers musical',
    sections: [
      { type: 'hero', title: 'Découvrez mon univers musical', subtitle: 'Beats exclusifs, instrumentales & packs sample', cta: 'Écouter & acheter' },
      { type: 'tracks', text: 'Previews disponibles — achat = téléchargement immédiat' },
      { type: 'benefits', items: ['Fichiers WAV & MP3', 'Droits d\'utilisation inclus', 'Support artiste'] },
      { type: 'testimonials', items: [{ name: 'Lamine D.', text: 'Le meilleur beatmaker du Sénégal !', rating: 5 }] },
      { type: 'cta', text: 'Télécharger mes beats maintenant 🎧' },
    ],
  },
  {
    id: 'event',
    icon: '🎟️',
    label: 'Événement & Billet',
    desc: 'Conférences, formations présentiel',
    color: 'from-indigo-400 to-blue-500',
    bg: 'bg-indigo-50',
    accent: 'text-indigo-600',
    defaultTitle: 'Mon événement',
    sections: [
      { type: 'hero', title: 'Un événement qui va vous transformer', subtitle: '📍 Dakar · Samedi 15 Mars · 09h–17h', cta: 'Réserver ma place' },
      { type: 'agenda', items: ['09h : Ouverture & networking', '10h : Conférence principale', '12h : Pause déjeuner', '14h : Ateliers pratiques', '17h : Clôture & networking'] },
      { type: 'benefits', items: ['Places limitées', 'Certificat de participation', 'Repas inclus'] },
      { type: 'testimonials', items: [{ name: 'Soda M.', text: 'L\'édition précédente était incroyable !', rating: 5 }] },
      { type: 'cta', text: 'Réserver ma place avant épuisement' },
    ],
  },
  {
    id: 'tech',
    icon: '📱',
    label: 'Électronique & Tech',
    desc: 'Smartphones, accessoires, gadgets',
    color: 'from-slate-400 to-gray-600',
    bg: 'bg-slate-50',
    accent: 'text-slate-700',
    defaultTitle: 'Ma boutique Tech',
    sections: [
      { type: 'hero', title: 'La technologie au meilleur prix', subtitle: 'Produits originaux garantis 12 mois', cta: 'Voir les offres exclusives' },
      { type: 'benefits', items: ['Produits authentiques', 'Livraison express', 'Service après-vente réactif'] },
      { type: 'gallery', text: 'Découvrez nos derniers arrivages' },
      { type: 'faq', items: [{ q: 'Les produits sont-ils originaux ?', a: 'Oui, 100% authentiques avec garantie et facture.' }] },
      { type: 'cta', text: 'Commander et se faire livrer aujourd\'hui' },
    ],
  },
  {
    id: 'realestate',
    icon: '🏠',
    label: 'Immobilier & Location',
    desc: 'Appartements, terrains, meublés',
    color: 'from-sky-400 to-blue-600',
    bg: 'bg-blue-50',
    accent: 'text-blue-700',
    defaultTitle: 'Mon bien immobilier',
    sections: [
      { type: 'hero', title: 'Trouvez le lieu de vos rêves', subtitle: 'Locations, ventes et terrains de premier choix', cta: 'Visiter maintenant' },
      { type: 'gallery', text: 'Photos détaillées de nos meilleures propriétés' },
      { type: 'benefits', items: ['Emplacement idéal', 'Titres fonciers vérifiés', 'Visite accompagnée'] },
      { type: 'faq', items: [{ q: 'Comment programmer une visite ?', a: 'Contactez-nous directement ou réservez via le bouton de la page.' }] },
      { type: 'cta', text: 'Contacter notre agent immobilier' },
    ],
  },
  {
    id: 'health',
    icon: '🌿',
    label: 'Agro & Nature',
    desc: 'Produits bio, compléments, miel',
    color: 'from-lime-400 to-green-600',
    bg: 'bg-green-50',
    accent: 'text-green-700',
    defaultTitle: 'Santé & Nature',
    sections: [
      { type: 'hero', title: 'La vitalité par la nature', subtitle: 'Produits purs, miel bio et compléments naturels de chez nous', cta: 'Découvrir' },
      { type: 'benefits', items: ['100% Bio & Naturel', 'Récolté localement', 'Qualité supérieure pure'] },
      { type: 'testimonials', items: [{ name: 'Awa C.', text: 'Ce miel au gingembre m\'a donné une incroyable énergie !', rating: 5 }] },
      { type: 'cta', text: 'Prendre soin de ma santé' },
    ],
  },
  {
    id: 'crafts',
    icon: '🏺',
    label: 'Artisanat & Déco',
    desc: 'Bijoux, décoration, œuvres',
    color: 'from-orange-400 to-amber-600',
    bg: 'bg-orange-50',
    accent: 'text-amber-700',
    defaultTitle: 'Mes créations',
    sections: [
      { type: 'hero', title: 'L\'artisanat authentique et moderne', subtitle: 'Des créations uniques faites à la main avec passion', cta: 'Explorer la galerie' },
      { type: 'gallery', text: 'Savoir-faire, détails et finitions parfaites' },
      { type: 'benefits', items: ['Savoir-faire local authentique', 'Matériaux durables', 'Pièces uniques limitées'] },
      { type: 'cta', text: 'Acheter une œuvre authentique' },
    ],
  },
  {
    id: 'software',
    icon: '🚀',
    label: 'Logiciels & SaaS',
    desc: 'Applications, outils, B2B',
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    accent: 'text-cyan-700',
    defaultTitle: 'Mon Logiciel SaaS',
    sections: [
      { type: 'hero', title: 'Automatisez votre business', subtitle: 'L\'outil tout-en-un pour booster votre productivité', cta: 'Essayer gratuitement' },
      { type: 'benefits', items: ['Interface intuitive', 'Support 24/7', 'Mises à jour incluses'] },
      { type: 'testimonials', items: [{ name: 'Marc E.', text: 'J\'ai gagné 10h par semaine grâce à cet outil.', rating: 5 }] },
      { type: 'cta', text: 'Commencer mon essai gratuit' },
    ],
  },
  {
    id: 'fitness',
    icon: '🏃‍♂️',
    label: 'Sport & Nutrition',
    desc: 'Programmes, régimes, suivi',
    color: 'from-red-400 to-orange-500',
    bg: 'bg-red-50',
    accent: 'text-red-600',
    defaultTitle: 'Mon Programme Sportif',
    sections: [
      { type: 'hero', title: 'Atteignez vos objectifs physiques', subtitle: 'Programmes d\'entraînement et plans sur-mesure', cta: 'Rejoindre le programme' },
      { type: 'program', items: ['Semaine 1-4 : Fondations', 'Semaine 5-8 : Intensité', 'Semaine 9-12 : Transformation totale'] },
      { type: 'benefits', items: ['Vidéos HD', 'Plan nutritionnel', 'Communauté privée'] },
      { type: 'cta', text: 'Démarrer ma transformation physique' },
    ],
  },
  {
    id: 'photography',
    icon: '📸',
    label: 'Photographie & Vidéo',
    desc: 'Shootings, presets, formations',
    color: 'from-gray-500 to-zinc-700',
    bg: 'bg-gray-50',
    accent: 'text-gray-800',
    defaultTitle: 'Mon Studio Photo',
    sections: [
      { type: 'hero', title: 'Capturez vos meilleurs moments', subtitle: 'Services de photographie professionnelle et presets exclusifs', cta: 'Réserver un shooting' },
      { type: 'gallery', text: 'Mon portfolio de créations' },
      { type: 'benefits', items: ['Matériel Pro', 'Retouches incluses', 'Disponibilité rapide'] },
      { type: 'cta', text: 'Travaillons ensemble' },
    ],
  },
  {
    id: 'b2b',
    icon: '👔',
    label: 'Consulting B2B',
    desc: 'Services pros, conseil, audit',
    color: 'from-slate-500 to-blue-800',
    bg: 'bg-slate-50',
    accent: 'text-slate-700',
    defaultTitle: 'Mon Cabinet de Conseil',
    sections: [
      { type: 'hero', title: 'Propulsez votre entreprise', subtitle: 'Conseil stratégique et accompagnement pour dirigeants', cta: 'Réserver un appel' },
      { type: 'services', items: ['Audit stratégique', 'Optimisation des process', 'Formation des équipes'] },
      { type: 'benefits', items: ['Expertise prouvée', 'Résultats mesurables', 'Discrétion assurée'] },
      { type: 'cta', text: 'Prendre rendez-vous avec un expert' },
    ],
  },
  {
    id: 'pets',
    icon: '🐾',
    label: 'Animaux & Compagnie',
    desc: 'Croquettes, soins, accessoires',
    color: 'from-amber-400 to-orange-600',
    bg: 'bg-amber-50',
    accent: 'text-amber-700',
    defaultTitle: 'Boutique pour Animaux',
    sections: [
      { type: 'hero', title: 'Le meilleur pour vos compagnons', subtitle: 'Alimentation premium et accessoires confortables', cta: 'Voir les produits' },
      { type: 'benefits', items: ['Qualité vétérinaire', 'Livraison à domicile', 'Paiement sécurisé'] },
      { type: 'gallery', text: 'Nos clients satisfaits (et mignons)' },
      { type: 'cta', text: 'Gâter mon animal' },
    ],
  },
  {
    id: 'gaming',
    icon: '🎮',
    label: 'Jeux & E-sport',
    desc: 'Clés CD, matériel gamer',
    color: 'from-violet-500 to-fuchsia-600',
    bg: 'bg-violet-50',
    accent: 'text-violet-700',
    defaultTitle: 'Gaming Store',
    sections: [
      { type: 'hero', title: 'Passez au niveau supérieur', subtitle: 'Le meilleur équipement et les derniers jeux en stock', cta: 'S\'équiper maintenant' },
      { type: 'benefits', items: ['Livraison instantanée', 'Garantie constructeur', 'Support technique'] },
      { type: 'gallery', text: 'Top des ventes' },
      { type: 'cta', text: 'Acheter mon setup' },
    ],
  },
  {
    id: 'travel',
    icon: '✈️',
    label: 'Tourisme & Voyage',
    desc: 'Guides, circuits, séjours',
    color: 'from-sky-300 to-blue-500',
    bg: 'bg-sky-50',
    accent: 'text-sky-600',
    defaultTitle: 'Mon Agence de Voyage',
    sections: [
      { type: 'hero', title: 'L\'aventure vous attend', subtitle: 'Découvrez des destinations inoubliables au meilleur prix', cta: 'Voir les offres' },
      { type: 'gallery', text: 'Destinations de rêve' },
      { type: 'benefits', items: ['Paiement échelonné', 'Assurance complète', 'Guides francophones'] },
      { type: 'cta', text: 'Réserver mon prochain voyage' },
    ],
  },
  {
    id: 'finance',
    icon: '📈',
    label: 'Finance & Trading',
    desc: 'Signaux, formations crypto',
    color: 'from-emerald-400 to-teal-600',
    bg: 'bg-emerald-50',
    accent: 'text-emerald-700',
    defaultTitle: 'Académie de Trading',
    sections: [
      { type: 'hero', title: 'Générez des revenus passifs', subtitle: 'Formation en investissement et stratégies financières', cta: 'Rejoindre l\'académie' },
      { type: 'program', items: ['Analyse technique', 'Psychologie des marchés', 'Gestion optimisée des risques'] },
      { type: 'benefits', items: ['Signaux VIP en direct', 'Live hebdomadaire', 'Communauté active'] },
      { type: 'cta', text: 'Commencer à investir aujourd\'hui' },
    ],
  },
  {
    id: 'kids',
    icon: '👶',
    label: 'Enfants & Maternité',
    desc: 'Vêtements, puériculture',
    color: 'from-pink-300 to-rose-400',
    bg: 'bg-pink-50',
    accent: 'text-pink-600',
    defaultTitle: 'Boutique Maternité',
    sections: [
      { type: 'hero', title: 'La douceur pour vos bébés', subtitle: 'Vêtements en coton bio et jeux éducatifs de qualité', cta: 'Découvrir la collection' },
      { type: 'gallery', text: 'Cadeaux et coups de cœur des mamans' },
      { type: 'benefits', items: ['Matières hypoallergéniques', 'Livraison offerte', 'Retours faciles'] },
      { type: 'cta', text: 'Habiller mon enfant' },
    ],
  },
  {
    id: 'automotive',
    icon: '🚗',
    label: 'Auto & Moto',
    desc: 'Accessoires, pièces, location',
    color: 'from-zinc-400 to-gray-700',
    bg: 'bg-zinc-50',
    accent: 'text-zinc-700',
    defaultTitle: 'Auto Moto Shop',
    sections: [
      { type: 'hero', title: 'Prenez soin de votre véhicule', subtitle: 'Pièces détachées d\'origine et accessoires premiums', cta: 'Voir le catalogue' },
      { type: 'benefits', items: ['Pièces certifiées', 'Livraison sous 48h', 'Satisfait ou remboursé'] },
      { type: 'faq', items: [{ q: 'Faites-vous le montage ?', a: 'Oui, nous avons des garages partenaires professionnels.' }] },
      { type: 'cta', text: 'Acheter mes équipements auto' },
    ],
  },
] as const

type TemplateId = typeof TEMPLATES[number]['id']

interface Product {
  id: string
  name: string
  price: number
  type: string
  images: string[]
}

interface NewPageFlowProps {
  storeId: string
  products: Product[]
}

const PLACEHOLDERS = [
  "Ex: Je vends une formation sur le e-commerce avec 3 modules...",
  "Ex: Je lance ma nouvelle gamme de parfums de Dubaï...",
  "Ex: J'organise un séminaire sur la liberté financière...",
  "Ex: Je vends mon livre numérique sur le marketing digital..."
]

const SUGGESTIONS = [
  { label: "🔥 Lancement Formation", prompt: "Je lance une formation en ligne complète sur le marketing avec un accès à vie et des sessions live." },
  { label: "💄 Gamme Skincare", prompt: "Je vends une nouvelle gamme de soins du visage 100% naturels pour lutter contre les imperfections." },
  { label: "🎟️ Événement B2B", prompt: "J'organise une conférence business le mois prochain à Dakar avec 3 intervenants de classe mondiale." },
  { label: "📚 Ebook Recettes", prompt: "Je vends mon livre de recettes africaines revisitées avec plus de 50 repas sains." }
]

// ----------------------------------------------------------------
// Composant
// ----------------------------------------------------------------
export function NewPageFlow({ storeId, products }: NewPageFlowProps) {
  const router = useRouter()

  // Étape 1 : choisir le template
  // Étape 2 : configurer la page
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)

  // Autre méthode : Import par URL
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // NOUVEAU : Hub AI Prompt
  const [aiPrompt, setAiPrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [promptError, setPromptError] = useState<string | null>(null)

  // Champs formulaire
  const [title, setTitle]           = useState('')
  const [slug, setSlug]             = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [active, setActive]         = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')

  // Options IA & Pro
  const [aiLanguage, setAiLanguage] = useState('fr')
  const [aiTone, setAiTone]         = useState('persuasif')
  const [pageTheme, setPageTheme]   = useState('minimalist')

  // Typewriter placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const template = TEMPLATES.find(t => t.id === selectedTemplate)

  const handleSelectTemplate = (id: TemplateId) => {
    setSelectedTemplate(id)
    const tpl = TEMPLATES.find(t => t.id === id)
    if (tpl) {
      setTitle(tpl.defaultTitle)
      setSlug(tpl.defaultTitle
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''))
    }
    setStep(2)
  }

  const handleGeneratePrompt = async () => {
    if (!aiPrompt.trim()) return
    setPromptLoading(true)
    setPromptError(null)
    
    // Injecter les options dans le prompt
    const finalPrompt = `
      Sujet/Description: ${aiPrompt}
      Ton de rédaction souhaité: ${aiTone}
      Langue de la page: ${aiLanguage}
    `

    try {
      const res = await fetch('/api/pages/generate-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, store_id: storeId })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération')

      if (data.pageId) {
        router.push(`/dashboard/pages/${data.pageId}/edit`)
      }
    } catch (err: unknown) {
      setPromptError(err instanceof Error ? err.message : String(err))
    } finally {
      setPromptLoading(false)
    }
  }

  const handleImportUrl = async () => {
    if (!importUrl.trim()) return
    setImportLoading(true)
    setImportError(null)

    try {
      const res = await fetch('/api/pages/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim(), store_id: storeId })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'import')

      if (data.pageId) {
        router.push(`/dashboard/pages/${data.pageId}/edit`)
      }
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : String(err))
      setImportLoading(false)
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim() || !selectedTemplate) {
      setError('Titre et URL sont obligatoires.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const tpl = TEMPLATES.find(t => t.id === selectedTemplate)

    const pageId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('SalePage')
      .insert({
        id:          pageId,
        store_id:    storeId,
        title:       title.trim(),
        slug:        slug.trim(),
        template:    selectedTemplate,
        sections:    tpl?.sections ?? [],
        product_ids: selectedProducts,
        active,
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Erreur : ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/pages')
    router.refresh()
  }

  // ── ÉTAPE 1 : Sélection du template ──────────────────────────────
  if (step === 1) {
    return (
      <div className="pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <header className="py-8 sm:py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink mb-3 tracking-tight">
            Comment voulez-vous créer votre page ?
          </h1>
          <p className="text-slate text-lg max-w-2xl mx-auto">
            Nous avons repensé la création pour aller à l'essentiel. Choisissez l'une de nos 3 méthodes magiques.
          </p>
        </header>

        <div className="space-y-10">
          
          {/* NIVEAU 1 : Génération IA (La Voie Royale) */}
          <section className="bg-gradient-to-br from-[#FFF8E7] to-[#FFF0C2] border-2 border-gold/30 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
            
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 mb-6 shadow-xl shadow-gold/20">
                <div className="bg-white text-gold w-14 h-14 rounded-full flex items-center justify-center">
                   <Wand2 className="w-7 h-7" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-ink mb-4">
                La magie de l'IA
                <span className="block text-xl font-normal text-slate mt-2">Générez une page convertissante en 10 secondes.</span>
              </h2>
              
              <div className="max-w-2xl mx-auto space-y-6 mt-10">
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gold/30 via-amber-300/30 to-gold/30 rounded-2xl blur opacity-25 group-hover/input:opacity-75 transition duration-500"></div>
                  <textarea 
                    rows={4}
                    placeholder={PLACEHOLDERS[placeholderIdx]}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="relative w-full px-6 py-5 rounded-2xl bg-white/95 backdrop-blur-sm border border-gold/40 text-ink placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gold/20 transition-all resize-none shadow-sm text-lg"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGeneratePrompt();
                      }
                    }}
                  />
                </div>
                
                {/* Suggestions Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">Idées :</span>
                  {SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => setAiPrompt(s.prompt)}
                      className="text-xs font-medium text-slate bg-white/60 border border-gold/20 px-3 py-1.5 rounded-full hover:bg-gold/10 hover:border-gold/50 hover:text-gold transition-all duration-300 backdrop-blur-sm"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Options Avancées IA */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-gold/20 backdrop-blur-sm shadow-sm hover:border-gold/50 transition-colors">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Langue :</span>
                    <select aria-label="Langue de la page" value={aiLanguage} onChange={e => setAiLanguage(e.target.value)} className="bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer">
                      <option value="fr">🇫🇷 Français</option>
                      <option value="en">🇬🇧 Anglais</option>
                      <option value="ar">🇦🇪 Arabe</option>
                      <option value="wo">🇸🇳 Wolof (Expir.)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-gold/20 backdrop-blur-sm shadow-sm hover:border-gold/50 transition-colors">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ton :</span>
                    <select aria-label="Ton de rédaction de l'IA" value={aiTone} onChange={e => setAiTone(e.target.value)} className="bg-transparent text-sm font-bold text-ink focus:outline-none cursor-pointer">
                      <option value="persuasif">🎯 Persuasif (Vente forte)</option>
                      <option value="educatif">📚 Éducatif & Expert</option>
                      <option value="amical">🤝 Amical & Proche</option>
                      <option value="mysterieux">🕵️ Mystérieux (Teaser)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleGeneratePrompt}
                    disabled={promptLoading || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-gold to-yellow-500 hover:from-gold-dark hover:to-gold text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-[0_8px_30px_rgb(209,161,24,0.3)] hover:shadow-[0_8px_40px_rgb(209,161,24,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-3"
                  >
                    {promptLoading ? (
                      <span className="flex items-center gap-2">
                         <Sparkles className="w-5 h-5 animate-spin" />
                         Génération magique de votre page...
                      </span>
                    ) : (
                      <>Générer ma page instantanément <ArrowRight className="w-6 h-6" /></>
                    )}
                  </button>
                  {promptError && <p className="text-red-500 font-medium text-sm mt-3">{promptError}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* NIVEAU 2 : Clonage URL */}
          <section className="bg-gradient-to-br from-[#0F7A60] to-[#0A5C48] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20 z-10 hidden sm:flex">
              <Globe className="w-8 h-8 text-emerald-100" />
            </div>

            <div className="flex-1 z-10 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">Nouveau</span>
                <h2 className="text-xl sm:text-2xl font-bold font-display">Cloner une page existante</h2>
              </div>
              <p className="text-emerald-50 text-sm md:text-base leading-relaxed mb-6 md:mb-0 max-w-xl">
                L'IA va aspirer le texte, la structure et les arguments de votre ancienne boutique pour la recréer en version ultra-optimisée sur PDV Pro. Magique et immédiat.
              </p>
              
              <div className="flex items-center gap-3 mt-4 opacity-80">
                 <span className="text-xs font-semibold tracking-wider text-emerald-200">Compatible :</span>
                 <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-50 px-2 py-1 rounded border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div> Shopify
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-50 px-2 py-1 rounded border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div> Systeme.io
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-50 px-2 py-1 rounded border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div> WooCommerce
                 </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex-shrink-0 z-10 flex flex-col gap-3 sm:min-w-[300px]">
              <input 
                type="url"
                placeholder="https://maboutique.com/produit/x"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/20 transition backdrop-blur-sm"
                onKeyDown={e => e.key === 'Enter' && handleImportUrl()}
              />
              <button 
                onClick={handleImportUrl}
                disabled={importLoading || !importUrl.trim()}
                className="w-full bg-white hover:bg-gray-50 text-[#0F7A60] font-bold px-6 py-3 rounded-xl transition shadow disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {importLoading ? "Aspiration en cours..." : "Cloner la page"}
              </button>
              {importError && <p className="text-red-200 text-xs text-center">{importError}</p>}
            </div>
          </section>

          {/* SÉPARATEUR */}
          <div className="flex items-center gap-4 py-8 mt-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Ou choisir un modèle
              </span>
              <span className="text-[10px] font-bold text-[#0F7A60] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                 <span className="bg-[#0F7A60] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{TEMPLATES.length}</span> Modèles design • <span className="text-lg leading-none">∞</span> Pages IA possibles
              </span>
            </div>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* NIVEAU 3 : Grille des modèles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 text-left border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 group`}
              >
                {/* Effet Mesh Gradient au fond au survol */}
                <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 bg-gradient-to-br ${t.color}`} />
                <div className={`absolute -left-8 -bottom-8 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 delay-100 bg-gradient-to-tr ${t.color}`} />
                
                <div className="relative z-10 flex flex-col gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${t.color} text-white shadow-inner group-hover:scale-110 transition-transform origin-left duration-300`}>
                    {t.icon}
                  </div>
                  <div>
                    <p className={`text-base font-bold text-gray-900 group-hover:${t.accent} transition-colors`}>{t.label}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-snug">{t.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    )
  }

  // ── ÉTAPE 2 : Configuration ───────────────────────────────────────
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(1)} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-ink hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${template?.color} text-white shadow-sm`}>
               {template?.icon}
            </div>
            <div>
              <h1 className="text-base font-bold text-ink leading-tight">Finaliser la configuration</h1>
              <p className="text-xs font-medium text-gray-500">Création de : {template?.label}</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Étape 2 / 2</span>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 font-medium text-sm rounded-xl px-5 py-4 flex items-center gap-3 shadow-sm">
             <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">⚠️</div>
             {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* COLONNE GAUCHE : INFOS */}
          <div className="space-y-8">
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-ink">Informations de base</h2>
                <p className="text-sm text-gray-500 mt-1">Donnez une identité forte à votre nouvelle page.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre de la page <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={title}
                    onChange={e => {
                      setTitle(e.target.value)
                      setSlug(e.target.value
                        .toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''))
                    }}
                    placeholder={template?.defaultTitle}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold/50 bg-gray-50/50 text-ink transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL publique de la page</label>
                  <div className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-gold focus-within:border-gold/50 transition-all shadow-inner">
                    <span className="text-sm font-medium text-gray-500 bg-gray-50 px-4 flex items-center border-r border-gray-200 pointer-events-none">pdvpro.com/p/</span>
                    <input
                      type="text" value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mon-produit"
                      className="flex-1 px-4 py-4 focus:outline-none bg-white text-ink text-sm"
                    />
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                    <span className="text-green-500">✓</span> Cette URL sera prête à être partagée.
                  </p>
                </div>
              </div>
            </section>

            {/* Design & Options Avancées */}
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-ink">Design & Optimisations (Pro)</h2>
                <p className="text-sm text-gray-500 mt-1">Personnalisez l'ambiance et débloquez la puissance IA.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Ambiance visuelle (Moodboard Bêta)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'minimalist', name: 'Minimaliste', colors: 'from-gray-100 to-white border border-gray-200', text: 'Épuré & Clair' },
                    { id: 'luxury', name: 'Luxe', colors: 'from-black to-gray-800 border border-gray-900', text: 'Noir & Or' },
                    { id: 'dynamic', name: 'Vibrant', colors: 'from-orange-500 to-rose-500', text: 'Vif & Énergique' },
                    { id: 'nature', name: 'Nature', colors: 'from-emerald-500 to-teal-600', text: 'Verts & Terre' },
                  ].map(t => (
                    <button
                      key={t.id} type="button"
                      onClick={() => setPageTheme(t.id)}
                      className={`relative p-3 rounded-xl flex items-center gap-3 transition-all ${
                        pageTheme === t.id ? 'ring-2 ring-gold shadow-sm bg-gray-50/50' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.colors} shadow-inner`}></div>
                      <div className="text-left">
                        <p className={`text-sm font-bold leading-tight ${pageTheme === t.id ? 'text-gold-dark' : 'text-ink'}`}>{t.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{t.text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-lg flex-shrink-0">
                    🧪
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                      A/B Testing Magique <span className="bg-gold/20 text-gold-dark text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Pro</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3 pr-2">Générez 2 variantes de cette page et laissez notre algorithme trouver la version qui convertit le mieux.</p>
                    <button type="button" className="text-xs font-bold text-white bg-ink hover:bg-black px-4 py-2 rounded-lg transition-colors shadow-sm">
                      Débloquer cette fonction
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Statut & Paramètres */}
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Visibilité immédiate</h2>
                  <p className="text-sm text-gray-500 mt-1 max-w-[200px]">
                    {active ? 'La page sera publique dès sa création.' : 'La page sera enregistrée comme brouillon.'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={active ? 'Désactiver la publication immédiate' : 'Activer la publication immédiate'}
                  onClick={() => setActive(v => !v)}
                  className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative shadow-inner flex-shrink-0 ${active ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${active ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </section>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-ink to-slate hover:from-black hover:to-ink text-white shadow-xl shadow-ink/10 disabled:opacity-50 font-bold py-5 rounded-2xl transition-all text-lg flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="animate-pulse">Création en cours…</span>
              ) : (
                <>Générer la page avec l'IA ✨</>
              )}
            </button>
          </div>

          {/* COLONNE DROITE : PRODUITS & PREVIEW */}
          <div className="space-y-8">
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8 flex flex-col h-[500px]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-ink">Produits à vendre</h2>
                  <span className="bg-gold/10 text-gold-dark text-xs font-bold px-3 py-1 rounded-full">
                    {selectedProducts.length} sélectionné(s)
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Vous pouvez lier un produit principal et plusieurs produits additionnels (Upsells). L'IA les intégrera dans la page.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <span className="text-4xl mb-3">📦</span>
                  <p className="text-sm text-gray-500 font-medium mb-4">Vous n'avez pas encore de produit dans votre boutique.</p>
                  <a href="/dashboard/products/new" className="text-sm font-bold text-gold hover:text-gold-dark bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100 transition-colors">
                    + Créer mon premier produit
                  </a>
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="Rechercher un produit..." 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold focus:bg-white text-sm transition-all"
                  />
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredProducts.map(p => {
                      const isSelected = selectedProducts.includes(p.id)
                      return (
                        <button
                          key={p.id} type="button"
                          onClick={() => toggleProduct(p.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all text-left group ${
                            isSelected
                              ? 'border-gold bg-gold/5 shadow-sm'
                              : 'border-transparent hover:border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden shadow-sm transition-transform ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}>
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-gold-dark' : 'text-ink'}`}>{p.name}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-1">{p.price.toLocaleString('fr-FR')} FCFA</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-gold bg-gold text-white' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="text-center text-sm text-gray-400 py-6">Aucun produit ne correspond à votre recherche.</p>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Architecture de la page prévue */}
            <section className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 sm:p-8">
              <h2 className="text-base font-bold text-ink mb-1">Architecture du modèle</h2>
              <p className="text-xs text-gray-500 mb-6">Voici les blocs visuels qui seront construits pour vous :</p>
              
              <div className="flex flex-wrap gap-2.5">
                {template?.sections.map((s, i) => {
                   const labels: Record<string, string> = {
                     hero: '🎯 Hero & Accroche',
                     benefits: '✨ Points forts',
                     testimonials: '💬 Témoignages',
                     faq: '❓ FAQ',
                     cta: '🛒 Appel à l\'action',
                     program: '📚 Programme',
                     coach: '👤 Profil Expert',
                     agenda: '📅 Agenda',
                     menu: '🍽️ Menu',
                     gallery: '🖼️ Galerie Photos',
                     countdown: '⏳ Urgence',
                     comparison: '⚖️ Comparaison',
                     video: '▶️ Vidéos'
                   }
                   const label = labels[s.type] || s.type
                   return (
                     <div key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50 text-gray-600 flex items-center gap-1.5`}>
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                       {label}
                     </div>
                   )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
{/* Support for CSS in modern syntax just in case */}
<style dangerouslySetInnerHTML={{__html: `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
`}} />
    </div>
  )
}
