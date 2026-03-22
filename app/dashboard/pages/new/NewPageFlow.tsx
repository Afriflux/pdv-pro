'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

// ----------------------------------------------------------------
// Composant
// ----------------------------------------------------------------
export function NewPageFlow({ storeId, products }: NewPageFlowProps) {
  const router = useRouter()

  // Étape 1 : choisir le template
  // Étape 2 : configurer la page
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)

  // Champs formulaire
  const [title, setTitle]           = useState('')
  const [slug, setSlug]             = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [active, setActive]         = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

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
      <div>
        <header className="bg-white border-b border-line px-6 py-4 flex items-center gap-3 sticky top-0 z-10 w-full">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-emerald text-xl leading-none transition-colors">←</button>
          <div>
            <h1 className="text-lg font-display font-bold text-ink">Choisir un template</h1>
            <p className="text-xs text-slate">10 designs optimisés par secteur</p>
          </div>
        </header>

        <div className="w-full px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-none">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={`${t.bg} rounded-2xl p-4 text-left border-2 border-transparent hover:border-gold/40 transition space-y-2 active:scale-95`}
            >
              <div className="text-3xl">{t.icon}</div>
              <div>
                <p className={`text-sm font-bold ${t.accent}`}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── ÉTAPE 2 : Configuration ───────────────────────────────────────
  return (
    <div>
      <header className="bg-white border-b border-line px-6 py-4 flex items-center gap-3 sticky top-0 z-10 w-full">
        <button onClick={() => setStep(1)} className="text-gray-400 hover:text-emerald text-xl leading-none transition-colors">←</button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{template?.icon}</span>
          <div>
            <h1 className="text-lg font-display font-bold text-ink">Configurer la page</h1>
            <p className="text-xs text-slate">{template?.label}</p>
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-6 space-y-6 max-w-5xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Infos de base */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-ink">Informations de base</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre de la page <span className="text-red-500">*</span>
            </label>
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL publique</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 flex-shrink-0">pdvpro.com/p/</span>
              <input
                type="text" value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="mon-produit"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold text-sm transition"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">URL finale : /p/{slug || 'mon-produit'}</p>
          </div>
        </section>

        {/* Lier des produits */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-ink">Produits liés</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sélectionnez les produits à vendre sur cette page</p>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Aucun produit actif. <a href="/dashboard/products/new" className="text-gold underline">Créer un produit</a>
            </p>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <button
                  key={p.id} type="button"
                  onClick={() => toggleProduct(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                    selectedProducts.includes(p.id)
                      ? 'border-gold/50 bg-gold/10'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  {/* Miniature */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name || "Image produit"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.price.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  {/* Checkbox visuelle */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedProducts.includes(p.id)
                      ? 'border-gold bg-gold'
                      : 'border-gray-300'
                  }`}>
                    {selectedProducts.includes(p.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Statut */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Publier immédiatement</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {active ? 'La page sera visible dès la création' : 'Brouillon — non visible'}
              </p>
            </div>
            <div
              onClick={() => setActive(v => !v)}
              className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${active ? 'bg-gold' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'left-7' : 'left-1.5'}`} />
            </div>
          </div>
        </section>

        {/* Aperçu du template */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-ink">Sections incluses</h2>
          <div className="space-y-1.5">
            {template?.sections.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span>
                <span className="capitalize">{
                  s.type === 'hero' ? 'Hero (titre + CTA)' :
                  s.type === 'benefits' ? 'Points forts' :
                  s.type === 'testimonials' ? 'Témoignages' :
                  s.type === 'faq' ? 'Questions fréquentes' :
                  s.type === 'cta' ? 'Appel à l\'action final' :
                  s.type === 'program' ? 'Programme / Plan' :
                  s.type === 'coach' ? 'Profil du coach' :
                  s.type === 'agenda' ? 'Agenda de l\'événement' :
                  s.type === 'menu' ? 'Menu / Catalogue' :
                  s.type
                }</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition text-base"
        >
          {loading ? 'Création en cours…' : `Créer la page "${title || template?.defaultTitle}"`}
        </button>
      </div>
    </div>
  )
}
