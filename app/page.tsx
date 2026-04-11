import React from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Store, 
  Shield, 
  ChevronDown,
  Sparkles,
  Users
} from 'lucide-react'
import { getCommissionTiers } from '@/lib/commission/commission-service'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Logo } from '@/components/ui/Logo'

import dynamic from 'next/dynamic'

// Lazy-load heavy components (below the fold)
const BentoGrid = dynamic(() => import('@/components/landing/BentoGrid').then(m => m.BentoGrid))
const PricingCards = dynamic(() => import('@/components/landing/PricingCards').then(m => m.PricingCards))
const TestimonialSlider = dynamic(() => import('@/components/landing/TestimonialSlider').then(m => m.TestimonialSlider))
const LiveCounters = dynamic(() => import('@/components/landing/LiveCounters').then(m => m.LiveCounters))
const FounderSection = dynamic(() => import('@/components/landing/FounderSection').then(m => m.FounderSection))
const PricingCalculator = dynamic(() => import('./PricingCalculator').then(m => m.default))

import { HeroSection } from "@/components/landing/HeroSection";

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CountdownBanner } from '@/components/landing/CountdownBanner'
import { Share2, TrendingUp, PhoneCall, Phone } from 'lucide-react'


  // Types pour les données dynamiques
  interface LandingTestimonial {
    name: string; biz: string; quote: string; badge: string
  }
  interface LandingFAQ {
    q: string; r: string; active?: boolean; order?: number
  }

  const DEFAULT_TESTIMONIALS: LandingTestimonial[] = [
    { name: 'Mariam D.', biz: 'Boutique Cosmétiques', quote: "Avant Yayyam, je perdais facilement 30% de mes commandes parce que les clients ne savaient pas comment payer. Maintenant Wave fait tout. Je dors tranquille.", badge: "🇸🇳 Dakar, Sénégal" },
    { name: 'Kofi A.', biz: 'Vendeur Électronique', quote: "Le COD a tout changé. Mes clients à Abidjan avaient peur de payer d'avance. Maintenant ils commandent sans hésiter.", badge: "🇨🇮 Abidjan, Côte d'Ivoire" },
    { name: 'Awa B.', biz: 'Créatrice de Mode', quote: "L'IA Check360° m'a dit que mes ventes baissaient le mercredi. J'ai lancé une promo ce jour-là. +45% de commandes en une semaine.", badge: "🇲🇱 Bamako, Mali" }
  ]

  const DEFAULT_FAQS: LandingFAQ[] = [
    {
      q: "Comment fonctionne la commission ?",
      r: "La commission est dégressive et calculée automatiquement sur votre chiffre d'affaires mensuel : de 8% pour les débutants à seulement 5% pour les gros volumes. Yayyam absorbe tous les frais techniques (passerelles et retraits), vous recevez votre net garanti."
    },
    {
      q: "Peut-on vendre des produits physiques ?",
      r: "Oui ! Yayyam supporte nativement le paiement à la livraison (COD) pour les vendeurs de produits physiques. Le COD suit simplement la même commission dégressive que les paiements digitaux (de 8% à 5%). Aucun abonnement requis — vous activez le paiement à la livraison depuis vos paramètres et c'est tout."
    },
    {
      q: "Quand sont disponibles mes fonds ?",
      r: "Immédiatement. Dès que le paiement est confirmé, les fonds sont crédités sur votre portefeuille Yayyam et disponibles pour un retrait. Pas d'attente de 48h, pas de délai."
    },
    {
      q: "Quelles passerelles sont disponibles ?",
      r: "Nous intégrons Wave SN/CI, CinetPay (pour Orange Money, Moov, MTN, etc.) et PayTech. Cela vous permet de couvrir 100% des clients en Afrique de l'Ouest et à l'international."
    },
    {
      q: "Y a-t-il un abonnement obligatoire ?",
      r: "Non, jamais. Yayyam fonctionne à 100% sur un modèle de commission. Aucun abonnement mensuel, aucun frais fixe, aucun coût caché. Nous ne gagnons de l'argent que quand vous en gagnez."
    },
    {
      q: "Peut-on vendre des produits digitaux ?",
      r: "Bien sûr. Que ce soit des PDF, formations vidéo, fichiers audio ou accès membres. Le client reçoit son lien de téléchargement unique automatiquement par WhatsApp et email dès le paiement."
    },
    {
      q: "Comment fonctionne l'IA Check360° ?",
      r: "Chaque semaine, notre IA analyse vos données de vente : produits les plus vus, taux d'abandon, jours de forte activité. Elle vous envoie 3 actions concrètes pour augmenter vos ventes. Aucune expertise requise."
    },
    {
      q: "Qu'est-ce que les Communautés Telegram ?",
      r: "Vous pouvez vendre l'accès à des groupes Telegram privés (formations, communautés exclusives, contenus premium). Le client paie sur votre boutique Yayyam, et reçoit son invitation automatiquement."
    }
  ]

const getCachedLandingConfig = unstable_cache(
  async () => {
    const supabaseAdmin = createAdminClient()
    const allowedKeys = [
      'landing_hero_badge', 'landing_hero_h1', 'landing_hero_subtitle', 'landing_hero_cta_primary',
      'landing_hero_cta_secondary', 'landing_problem_supertitle', 'landing_problem_title',
      'landing_problem_subtitle', 'landing_solution_supertitle', 'landing_solution_title',
      'landing_solution_subtitle', 'landing_features_supertitle', 'landing_features_title',
      'landing_sectors_supertitle', 'landing_sectors_title', 'landing_sectors_subtitle',
      'landing_telegram_supertitle', 'landing_telegram_title', 'landing_telegram_subtitle',
      'landing_cod_price', 'landing_cta_title', 'landing_cta_button', 'landing_testimonials',
      'landing_faq', 'landing_instagram_url', 'landing_facebook_url', 'contact_tiktok_url', 'landing_whatsapp_support', 'landing_banner_active',
      'landing_banner_date', 'landing_banner_text'
    ]
    const { data: cfgRows } = await supabaseAdmin
      .from('PlatformConfig')
      .select('key, value')
      .in('key', allowedKeys)
    return cfgRows || []
  },
  ['landing-config-v2'],
  { revalidate: 60 }
)

const getCachedLiveCounters = unstable_cache(
  async () => {
    const supabaseAdmin = createAdminClient()
    const [
      { count: vendorsCount },
      { count: productsCount },
      { count: ordersCount }
    ] = await Promise.all([
      supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('role', 'vendeur'),
      supabaseAdmin.from('Product').select('*', { count: 'exact', head: true }).eq('active', true),
      supabaseAdmin.from('Order').select('*', { count: 'exact', head: true })
    ])
    return { vendorsCount, productsCount, ordersCount }
  },
  ['landing-counters-v2'],
  { revalidate: 60 }
)

export default async function LandingPage() {
  const supabaseServer = await createClient()
  const { data: { session } } = await supabaseServer.auth.getSession()
  const isLoggedIn = !!session

  let dashboardUrl = '/dashboard'
  if (isLoggedIn && session?.user) {
    const supabaseAdmin = createAdminClient()
    const { data: userRow } = await supabaseAdmin.from('User').select('role').eq('id', session.user.id).single()
    const role = userRow?.role
    if (role === 'acheteur' || role === 'client') dashboardUrl = '/client'
    else if (role === 'affilie') dashboardUrl = '/portal'
    else if (role === 'super_admin' || role === 'gestionnaire' || role === 'support') dashboardUrl = '/admin'
  }

  const { TIERS: dynamicTiers } = await getCommissionTiers()
  
  const cfgRows = await getCachedLandingConfig()
  const cfg = cfgRows.reduce<Record<string, string>>(
    (acc, { key, value }) => {
      if (key && value) acc[key] = value
      return acc
    }, {}
  )
  const get = (key: string, fallback: string) => cfg[key] ?? fallback

  // Témoignages depuis DB ou fallback
  const testimonialData: LandingTestimonial[] = (() => {
    try {
      const raw = cfg['landing_testimonials']
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{
          active?: boolean; name: string; business?: string
          quote: string; city?: string; country_flag?: string; badge?: string
        }>
        const active = parsed.filter(t => t.active !== false)
        if (active.length > 0) return active.map(t => ({
          name: t.name,
          biz: t.business ?? '',
          quote: t.quote,
          badge: t.badge ?? (t.country_flag && t.city
            ? t.country_flag + ' ' + t.city : ''),
        }))
      }
    } catch {}
    return DEFAULT_TESTIMONIALS
  })()

  // FAQ depuis DB ou fallback
  const faqData: LandingFAQ[] = (() => {
    try {
      const raw = cfg['landing_faq']
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{
          active?: boolean; order?: number; question: string; answer: string
        }>
        const active = parsed
          .filter(f => f.active !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        if (active.length > 0) return active.map(f => ({
          q: f.question, r: f.answer
        }))
      }
    } catch {}
    return DEFAULT_FAQS
  })()

  // H1 hero multi-lignes
  const h1Raw = get('landing_hero_h1', '')
  const h1Lines = h1Raw.split('\n').filter(Boolean)
  const [h1L1, h1L2, h1L3] = h1Lines.length >= 3
    ? h1Lines
    : ['En Afrique, vendre', "c'est une affaire", 'de confiance.']

  // Counts en temps réel via cache
  const { vendorsCount, productsCount, ordersCount } = await getCachedLiveCounters()

  return (
    <div className="bg-cream min-h-screen text-ink font-body selection:bg-emerald/20 selection:text-ink">
      <CountdownBanner config={{
        active: get('landing_banner_active', 'true') === 'true',
        dateStr: get('landing_banner_date', '2026-04-01T00:00:00Z'),
        text: get('landing_banner_text', '🌍 Yayyam — Du Pulaar au Digital : la confiance en héritage')
      }} />
      <LandingHeader isLoggedIn={isLoggedIn} dashboardUrl={dashboardUrl} />

      <main>
        <HeroSection 
          badge={get("landing_hero_badge", "\ud83c\uddf8\ud83c\uddf3 Yayyam — En Pulaar, c\u0027est la confiance qui vend.")}
          h1L1={h1L1}
          h1L2={h1L2}
          h1L3={h1L3}
          subtitle={get("landing_hero_subtitle", "Yayyam, c\u0027est le mot Peulh pour le lien de confiance qui fait vendre. Créez votre boutique en 2 minutes, encaissez via Wave ou Orange Money, et recevez vos gains dès 5 000 FCFA. Zéro abonnement.")}
          ctaPrimary={get("landing_hero_cta_primary", "Ouvrir ma boutique gratuitement")}
          ctaSecondary={get("landing_hero_cta_secondary", "Découvrir les boutiques actives →")}
          isLoggedIn={isLoggedIn}
          dashboardUrl={dashboardUrl}
        />

        <BentoGrid 
          supertitle={get("landing_problem_supertitle", "L\u0027arsenal complet")} 
          title={get("landing_problem_title", "Une seule application. Résultat infini.")} 
        />

        {/* 5. TEMPLATES & SECTEURS */}
        <section className="py-32 px-6 bg-ink text-white overflow-hidden relative border-y border-line/10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-emerald/10 blur-[150px] rounded-full pointer-events-none"></div>
          
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 relative z-10 text-center">
             <div className="mb-14 max-w-3xl mx-auto">
                <p className="font-bold text-gold uppercase tracking-widest text-sm mb-4">{get('landing_sectors_supertitle', "Déjà utilisé au Sénégal, en Côte d'Ivoire et au Mali.")}</p>
                <h2 className="text-4xl md:text-5xl font-display font-black mb-6 text-white">{get('landing_sectors_title', "Parfait pour tous les business.")}</h2>
                <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">{get('landing_sectors_subtitle', "Peu importe ce que vous vendez, nous gérons le processus de la vitrine jusqu'à votre poche.")}</p>
             </div>

             <div className="flex flex-wrap justify-center gap-4 mb-16 max-w-[1800px] mx-auto w-full px-4 md:px-8">
               {['Prêt-à-porter', 'Cosmétiques', 'Électronique', 'Alimentation', 'Services (RDV)', 'Restauration', 'Art & Déco', 'Produits Digitaux', 'B2B & Gros', 'Santé & Bien-être'].map((tag, i) => (
                 <div key={i} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-bold tracking-widest text-cream/80 hover:border-emerald hover:text-white hover:bg-emerald/20 shadow-sm hover:shadow-emerald/20 transition-all cursor-default transform hover:-translate-y-1">
                   {tag.toUpperCase()}
                 </div>
               ))}
             </div>

             <div>
               <Link suppressHydrationWarning href="/vendeurs" className="inline-flex items-center bg-white text-ink px-8 py-4 rounded-xl font-bold hover:bg-emerald hover:text-white transition gap-2 shadow-xl shadow-white/5">
                  <span suppressHydrationWarning>Voir les boutiques actives</span> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
               </Link>
             </div>
          </div>
        </section>

        {/* 6. TÉMOIGNAGES */}
        <section className="py-24 px-6 bg-cream border-b border-line">
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-black text-center mb-16 tracking-tight text-ink">Avis des précurseurs.</h2>
            <TestimonialSlider testimonials={testimonialData} />
          </div>
        </section>

        {/* 6.25 MOT DU FONDATEUR */}
        <FounderSection
          founderName={get('founder_name', '') || undefined}
          founderTitle={get('founder_title', '') || undefined}
          founderMessage={get('founder_message', '') || undefined}
          founderImageUrl={get('founder_image_url', '') || undefined}
        />

        {/* 6.5 PREUVES DE RETRAITS (Mode Cash) */}
        <section className="py-20 px-6 bg-white overflow-hidden relative">
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 text-center">
            <span className="inline-block bg-emerald/10 text-emerald font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 border border-emerald/20">Transparence Totale</span>
            <h2 className="text-3xl md:text-4xl font-display font-black mb-6 text-ink">L'argent va <span className="text-emerald">directement</span> sur votre téléphone.</h2>
            <p className="text-lg text-slate font-light max-w-2xl mx-auto mb-12">Retraits traités tous les jours vers Wave et Orange Money. Pas de blocage, pas de délai artificiel. C'est votre argent, vous en disposez quand vous voulez (dès 5 000 FCFA).</p>
            
            <div className="flex justify-center gap-4 flex-wrap">
               {/* Mockup Preuve de retrait Wave */}
               <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 w-72 text-left shadow-sm hover:shadow-md transition-shadow transform hover:-translate-y-1">
                 <div className="flex justify-between items-center mb-4">
                   <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs">Y</div>
                   <span className="text-[10px] text-gray-400 font-medium">Aujourd'hui, 09:42</span>
                 </div>
                 <p className="text-xs text-emerald-900/60 font-bold mb-1 uppercase tracking-wider">Transfert reçu avec succès</p>
                 <p className="text-2xl font-black text-emerald-600 mb-2">+ 45 000 F</p>
                 <p className="text-xs text-gray-500 font-medium">De: YAYYAM</p>
                 <p className="text-[10px] text-gray-400 mt-2">Nouveau solde: 124 500 F</p>
               </div>

               {/* Mockup Preuve de retrait OM */}
               <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 w-72 text-left shadow-sm hover:shadow-md transition-shadow transform hover:-translate-y-1">
                 <div className="flex justify-between items-center mb-4">
                   <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black text-xs">OM</div>
                   <span className="text-[10px] text-gray-400 font-medium">Hier, 18:15</span>
                 </div>
                 <p className="text-xs text-orange-900/60 font-bold mb-1 uppercase tracking-wider">Paiement reçu</p>
                 <p className="text-2xl font-black text-orange-600 mb-2">+ 120 000 F</p>
                 <p className="text-xs text-gray-500 font-medium">De: YAYYAM PAYMENTS</p>
                 <p className="text-[10px] text-gray-400 mt-2">Nouveau solde: 450 000 F</p>
               </div>
            </div>
            <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium bg-gray-50 inline-flex px-6 py-2 rounded-full border border-gray-100 mx-auto">
               <Shield className="w-4 h-4 text-emerald" />
               Vos fonds sont sécurisés et garantis.
            </div>
          </div>
        </section>

        {/* 7. TARIFS & CALCULATEUR */}
        <section id="pricing" className="py-24 px-6 bg-pearl">
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="text-center mb-12">
              <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block">Tarification</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-ink">Un modèle clair.</h2>
              <p className="text-xl text-slate font-light mb-6">Commencez gratuitement, payez moins quand vous grossissez.</p>
              <div className="text-emerald font-bold bg-emerald/10 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-emerald/20 shadow-sm animate-pulse-slow">
                <Sparkles size={18} /> Le système ajuste votre palier automatiquement chaque mois selon votre C.A.
              </div>
            </div>

            <PricingCards />

            <div className="mt-8 text-center mb-16">
              <Link href="/register" className="inline-block px-12 py-5 bg-emerald text-white rounded-xl font-bold text-lg hover:bg-emerald-rich transition shadow-xl shadow-emerald/20">
                Créer ma boutique (Palier Débutant)
              </Link>
            </div>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mb-16 mt-6 w-full max-w-[1800px] mx-auto px-4 md:px-8">
               <div className="bg-white border-2 border-emerald/20 rounded-2xl p-6 text-center shadow-lg flex-1 hover:border-emerald transition-colors flex flex-col items-center justify-center">
                 <div className="text-4xl leading-none mb-3">💳</div>
                 <h4 className="font-display font-black text-ink text-xl mb-1">Mobile Money</h4>
                 <p className="text-slate text-sm font-medium">Wave & Orange Money par défaut</p>
               </div>
               <div className="bg-white border-2 border-gold/40 rounded-2xl p-6 text-center shadow-lg flex-1 hover:border-gold transition-colors flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gold text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">Spécial E-commerce</div>
                  <div className="text-4xl leading-none mb-3 mt-2">📦</div>
                  <h4 className="font-display font-black text-ink text-xl mb-1">Service COD</h4>
                  <p className="text-gold-dark font-bold text-sm">Paiement à la livraison : 5% fixe</p>
               </div>
               <div className="bg-white border-2 border-turquoise/30 rounded-2xl p-6 text-center shadow-lg flex-1 hover:border-turquoise transition-colors flex flex-col items-center justify-center">
                  <div className="text-4xl leading-none mb-3">🏦</div>
                  <h4 className="font-display font-black text-ink text-xl mb-1">Gains Express</h4>
                  <p className="text-turquoise-dark font-bold text-sm">Retrait immédiat dès 5 000 FCFA</p>
               </div>
            </div>

            <p className="text-center text-slate max-w-2xl mx-auto mb-16 bg-white py-4 px-6 rounded-2xl border border-line shadow-sm">
              <span className="mr-2">💡</span> Vous ne payez qu&apos;une commission sur vos ventes réelles. Plus vous vendez, moins vous payez. Le système s'ajuste pour vous.
            </p>

            <PricingCalculator tiers={dynamicTiers} />

          </div>
        </section>
        {/* 7.5 MACHINE A CASH (Paniers & Upsells & Retraits Auto) */}
        <section className="py-24 px-6 bg-white overflow-hidden relative border-y border-line/10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="inline-block bg-emerald/10 text-emerald font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 border border-emerald/20">La Machine à Cash</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">Trois leviers natifs pour <span className="text-emerald">exploser</span> votre C.A.</h2>
              <p className="text-xl text-slate font-light">
                Ne laissez plus d'argent sur la table. Yayyam intègre un arsenal de conversion secret, activable en un clic sans abonnement externe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Levier 1: Paniers Abandonnés / Call Center */}
              <div className="bg-pearl rounded-[2rem] p-10 border border-line flex flex-col relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald/10 hover:border-emerald/30 transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users size={80} />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-emerald shadow-sm mb-8 border border-line group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">📞</span>
                </div>
                <h3 className="text-2xl font-display font-black text-ink mb-4">Relance & Call Center Intégré</h3>
                <p className="text-slate leading-relaxed font-light mb-6 flex-1">
                  Dès qu'un client commence à remplir ses informations sans payer, le système capture son numéro. Nos <span className="font-bold text-ink">Closers partenaires</span> le relancent par téléphone pour clôturer la vente. Vous récupérez 30% de chiffre additionnel.
                </p>
                <div className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald shrink-0"><CheckCircle2 size={18} /></div>
                  <div>
                    <p className="text-xs text-slate uppercase tracking-wider font-bold">Résultat Moyen</p>
                    <p className="text-ink font-black text-lg">+30% de ventes sauvées</p>
                  </div>
                </div>
              </div>

              {/* Levier 2: Upsell 1-Click */}
              <div className="bg-emerald rounded-[2rem] p-10 flex flex-col relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald/40 transition-all duration-300 transform hover:-translate-y-2 md:-translate-y-4">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald to-emerald-rich"></div>
                {/* SVG pattern overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="2" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#diagonalHatch)" />
                </svg>
                
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm mb-8 border border-white/20 relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <Zap size={32} />
                </div>
                <h3 className="text-2xl font-display font-black text-white mb-4 relative z-10">L'Upsell Magique (O-T-O)</h3>
                <p className="text-cream leading-relaxed font-light mb-6 flex-1 relative z-10">
                  Dès que le client valide sa commande (ex: à la livraison), une page <span className="font-bold">One-Time Offer</span> s'affiche avec un compte à rebours de 10 min, lui proposant un article premium à -x%. L'ajout au panier se fait en 1 seul clic.
                </p>
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 relative z-10 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0"><Sparkles size={18} /></div>
                  <div>
                    <p className="text-xs text-cream/70 uppercase tracking-wider font-bold">Panier Moyen</p>
                    <p className="text-white font-black text-lg">Doublé instantanément</p>
                  </div>
                </div>
              </div>

              {/* Levier 3: Retraits Automatisés */}
              <div className="bg-pearl rounded-[2rem] p-10 border border-line flex flex-col relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald/10 hover:border-emerald/30 transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Store size={80} />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-emerald shadow-sm mb-8 border border-line group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🏦</span>
                </div>
                <h3 className="text-2xl font-display font-black text-ink mb-4">Retraits 100% Automatisés</h3>
                <p className="text-slate leading-relaxed font-light mb-6 flex-1">
                  Vendeurs, Affiliés, Closers... Fixez votre seuil (ex: 50 000 F). Dès qu'il est atteint, notre robot intelligent génère la demande et l'argent atterrit sur votre Wave/Orange Money de façon transparente, que vous soyez réveillé ou non.
                </p>
                <div className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald shrink-0"><ArrowRight size={18} /></div>
                  <div>
                    <p className="text-xs text-slate uppercase tracking-wider font-bold">Friction Zéro</p>
                    <p className="text-ink font-black text-lg">Paiement passif garanti</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 8. ECOSYSTEME RICHESSE PARTAGÉE (Affiliation & Closing) */}
        <section className="py-24 px-6 bg-[#FAFAF7] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="inline-block bg-ink/10 text-ink font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 shadow-sm border border-ink/10">Sans Boutiques & Sans Produits</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">L'Écosystème de <span className="text-emerald">Richesse Partagée</span></h2>
              <p className="text-xl text-slate font-light">
                Vous n'avez pas de produit à vendre ? Aucun problème. Yayyam est le terrain de jeu ultime pour générer des revenus passifs ou actifs en devenant partenaire des meilleurs vendeurs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1800px] mx-auto px-4 md:px-8">
              {/* Affiliation */}
              <div className="bg-white rounded-[2rem] p-10 border-2 border-emerald/20 flex flex-col relative overflow-hidden group shadow-lg hover:shadow-2xl hover:shadow-emerald/20 transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Share2 size={120} />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald mb-8 border border-emerald/20">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-2xl font-display font-black text-ink mb-2">Programme Affiliés</h3>
                <h4 className="text-sm font-bold text-emerald uppercase tracking-wider mb-4">Revenus Passifs Maximisés</h4>
                <p className="text-slate leading-relaxed font-light mb-8">
                  Accédez à un catalogue exclusif de produits à fort taux de conversion. Partagez votre lien de tracking intelligent et touchez jusqu'à <span className="font-bold text-ink">50% de commission</span> sur chaque vente. L'argent est transféré automatiquement sur votre Mobile Money à chaque seuil atteint.
                </p>
                <Link suppressHydrationWarning href="/register?role=affiliate" className="mt-auto inline-flex items-center gap-2 text-emerald font-bold hover:text-emerald-rich transition-colors group/link w-fit">
                  <span suppressHydrationWarning>Devenir Affilié</span> 
                  <svg className="group-hover/link:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>

              {/* Closing */}
              <div className="bg-ink rounded-[2rem] p-10 flex flex-col relative overflow-hidden group shadow-lg hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-ink to-[#0a1a1f]"></div>
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <PhoneCall size={120} className="text-white" />
                </div>
                
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald mb-8 border border-white/10 relative z-10">
                  <Phone size={32} />
                </div>
                <h3 className="text-2xl font-display font-black text-white mb-2 relative z-10">L'Agence de Closing In-App</h3>
                <h4 className="text-sm font-bold text-emerald-light uppercase tracking-wider mb-4 relative z-10">Revenus Actifs Garantis</h4>
                <p className="text-cream/80 leading-relaxed font-light mb-8 relative z-10">
                  Transformez votre téléphone en machine à cash. Connectez-vous sur votre <span className="font-bold text-white">Terminal Closer</span> et rappelez les paniers abandonnés des gros vendeurs. Chaque client convaincu vous rapporte une commission fixe. Zéro prospection, uniquement des leads ultra-qualifiés avec intention d'achat.
                </p>
                <Link suppressHydrationWarning href="/register?role=closer" className="relative z-10 mt-auto inline-flex items-center gap-2 text-emerald-light font-bold hover:text-white transition-colors group/link w-fit">
                  <span suppressHydrationWarning>Rejoindre les Closers</span> 
                  <svg className="group-hover/link:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ── Section Communautés Telegram ──────────────────────────────── */}
        <section className="py-20 bg-ink border-y border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 px-4 relative z-10">
            <div className="text-center mb-12">
              <span className="inline-block bg-emerald/10 border border-emerald/30 text-emerald text-xs font-bold px-3 py-1 rounded-full mb-4 shadow-sm">
                {get('landing_telegram_supertitle', "EXCLUSIF YAYYAM")}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 whitespace-pre-wrap">
                {get('landing_telegram_title', "Vendez l'accès à vos groupes\nTelegram privés")}
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                {get('landing_telegram_subtitle', "Formations, coaching, contenus exclusifs — créez un produit, liez-le à votre groupe Telegram, et vos clients reçoivent automatiquement leur invitation après paiement.")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <span className="text-4xl block mb-3">🔐</span>
                <h3 className="font-bold text-white mb-2 text-lg">Accès automatique</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Le client paie → reçoit son lien d&apos;invitation par WhatsApp en quelques secondes</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <span className="text-4xl block mb-3">💰</span>
                <h3 className="font-bold text-white mb-2 text-lg">Monétisez votre expertise</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Fixez votre prix, recevez vos paiements via Wave ou Orange Money directement</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <span className="text-4xl block mb-3">📊</span>
                <h3 className="font-bold text-white mb-2 text-lg">Gérez vos membres</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Suivez les invitations, le nombre de membres, et révoquez les accès si nécessaire</p>
              </div>
            </div>

            {/* Cas d'usage concrets */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none blur-3xl"></div>
              <h3 className="font-black text-white text-xl mb-6 text-center relative z-10">Qui utilise cette fonctionnalité ?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                {[
                  { emoji: '🎓', label: 'Formateurs', desc: 'Cours en ligne + groupe de suivi' },
                  { emoji: '💪', label: 'Coachs', desc: 'Coaching sportif, business, dev perso' },
                  { emoji: '📈', label: 'Traders', desc: 'Signaux, analyses, communauté VIP' },
                  { emoji: '🎨', label: 'Créateurs', desc: 'Contenus exclusifs, backstage' },
                ].map(u => (
                  <div key={u.label} className="text-center group cursor-default">
                    <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{u.emoji}</span>
                    <p className="font-bold text-white text-sm mb-1">{u.label}</p>
                    <p className="text-white/60 text-xs">{u.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ */}
        <section id="faq" className="py-24 bg-cream px-6">
            <div className="max-w-[1800px] mx-auto w-full px-4 md:px-8">
              <h2 className="text-3xl md:text-5xl font-display font-black text-center mb-16 text-ink">Questions Fréquentes.</h2>
              
              <div className="max-w-3xl mx-auto space-y-4">
                {faqData.map((faq, i) => (
                  <details key={i} className="group bg-white border border-line rounded-2xl overflow-hidden hover:border-emerald/20 transition-all duration-300">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <h4 className="font-bold text-ink pr-8">{faq.q}</h4>
                      <div className="w-8 h-8 rounded-full border border-line flex items-center justify-center group-open:rotate-180 transition-transform">
                        <ChevronDown size={18} className="text-slate" />
                      </div>
                    </summary>
                    <div className="px-6 pb-6 text-slate leading-relaxed text-sm animate-in slide-in-from-top-2 duration-300">
                      {faq.r}
                    </div>
                  </details>
                ))}
              </div>
            </div>
        </section>

        {/* 9. REAL-TIME SOCIAL PROOF */}
        <LiveCounters 
          vendorsCount={vendorsCount ?? 200} 
          productsCount={productsCount ?? 1200} 
          ordersCount={ordersCount ?? 8500} 
        />

        {/* COMPARAISON WHATSAPP VS YAYYAM */}
        <section className="py-16 bg-gray-50 border-t border-line">
          <div className="max-w-[1800px] mx-auto w-full px-6 md:px-12 lg:px-20 xl:px-32">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-10 text-ink">
              Pourquoi passer de WhatsApp à Yayyam ?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Colonne WhatsApp */}
              <div className="bg-white rounded-2xl p-6 border-2 border-red-100 flex flex-col">
                <div className="text-center mb-6">
                  <span className="text-4xl block mb-2">📱</span>
                  <h3 className="font-bold text-xl text-red-600">Vendre sur WhatsApp</h3>
                </div>
                <ul className="space-y-4 text-sm text-gray-600 flex-1">
                  <li className="flex items-start gap-3"><span className="text-red-400 mt-0.5 shrink-0"><AlertCircle size={16}/></span> Pas de vitrine professionnelle</li>
                  <li className="flex items-start gap-3"><span className="text-red-400 mt-0.5 shrink-0"><AlertCircle size={16}/></span> Gestion des stocks manuelle</li>
                  <li className="flex items-start gap-3"><span className="text-red-400 mt-0.5 shrink-0"><AlertCircle size={16}/></span> Pas de paiement en ligne automatisé</li>
                  <li className="flex items-start gap-3"><span className="text-red-400 mt-0.5 shrink-0"><AlertCircle size={16}/></span> Pas de suivi de commandes direct</li>
                  <li className="flex items-start gap-3"><span className="text-red-400 mt-0.5 shrink-0"><AlertCircle size={16}/></span> Pas d'analytics ni d'IA</li>
                  <li className="flex items-start gap-3"><span className="text-red-400 mt-0.5 shrink-0"><AlertCircle size={16}/></span> Confiance client limitée</li>
                </ul>
              </div>
              {/* Colonne Yayyam */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#0F7A60] shadow-xl shadow-emerald/10 relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F7A60] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Recommandé
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl block mb-2">🏪</span>
                  <h3 className="font-bold text-xl text-[#0F7A60]">Vendre sur Yayyam</h3>
                </div>
                <ul className="space-y-4 text-sm text-gray-700 font-medium flex-1">
                  <li className="flex items-start gap-3"><span className="text-[#0F7A60] mt-0.5 shrink-0"><CheckCircle2 size={18}/></span> Boutique pro avec votre marque</li>
                  <li className="flex items-start gap-3"><span className="text-[#0F7A60] mt-0.5 shrink-0"><CheckCircle2 size={18}/></span> Stock et commandes automatisés</li>
                  <li className="flex items-start gap-3"><span className="text-[#0F7A60] mt-0.5 shrink-0"><CheckCircle2 size={18}/></span> Wave, Orange Money, carte bancaire</li>
                  <li className="flex items-start gap-3"><span className="text-[#0F7A60] mt-0.5 shrink-0"><CheckCircle2 size={18}/></span> Suivi en temps réel pour vos clients</li>
                  <li className="flex items-start gap-3"><span className="text-[#0F7A60] mt-0.5 shrink-0"><CheckCircle2 size={18}/></span> Analytics + IA marketing intégrés</li>
                  <li className="flex items-start gap-3"><span className="text-[#0F7A60] mt-0.5 shrink-0"><CheckCircle2 size={18}/></span> Badge vendeur vérifié (KYC)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARAISON YAYYAM VS CONCURRENTS */}
        <section className="py-24 px-6 bg-cream border-b border-line">
          <div className="max-w-[1800px] mx-auto w-full px-4 md:px-12 lg:px-20 xl:px-32">
            <div className="text-center mb-12">
              <span className="inline-block bg-ink/10 text-ink font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 shadow-sm border border-ink/10">Comparatif Objectif</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-ink">Yayyam vs. <span className="text-emerald">Les autres.</span></h2>
              <p className="text-xl text-slate font-light max-w-2xl mx-auto">Pas de promesses vagues — voici exactement ce que vous obtenez, comparé aux alternatives.</p>
            </div>
            
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[900px] bg-white rounded-2xl overflow-hidden shadow-lg border border-line">
                <thead>
                  <tr className="border-b-2 border-emerald/20">
                    <th className="text-left p-5 text-sm font-black text-slate uppercase tracking-wider">Fonctionnalité</th>
                    <th className="p-5 text-center bg-emerald/5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-black text-emerald">Yayyam</span>
                        <span className="text-[10px] bg-emerald/10 text-emerald px-2 py-0.5 rounded-full font-bold">UEMOA #1</span>
                      </div>
                    </th>
                    <th className="p-5 text-center text-sm font-bold text-slate">WhatsApp</th>
                    <th className="p-5 text-center text-sm font-bold text-slate">Chariow</th>
                    <th className="p-5 text-center text-sm font-bold text-slate">Shopify</th>
                    <th className="p-5 text-center text-sm font-bold text-slate">Systeme.io</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { feat: 'Wave / Orange Money natif',           y: 'green',  wa: 'red',    ch: 'yellow', sh: 'red',    sy: 'red' },
                    { feat: 'Paiement à la livraison (COD)',       y: 'green',  wa: 'yellow', ch: 'green',  sh: 'red',    sy: 'red' },
                    { feat: 'Abonnement mensuel',                  y: '0 FCFA', wa: '0 FCFA', ch: '~5 000 F', sh: '39$/mo', sy: '27€/mo' },
                    { feat: 'Commission dégressive (5-8%)',        y: 'green',  wa: 'red',    ch: 'red',    sh: 'red',    sy: 'red' },
                    { feat: 'Boutique e-commerce complète',        y: 'green',  wa: 'red',    ch: 'green',  sh: 'green',  sy: 'orange' },
                    { feat: 'Bot WhatsApp automatisé',             y: 'green',  wa: 'orange', ch: 'red',    sh: 'red',    sy: 'red' },
                    { feat: 'Communautés Telegram payantes',       y: 'green',  wa: 'red',    ch: 'red',    sh: 'red',    sy: 'red' },
                    { feat: 'IA Marketing (Check360°)',            y: 'green',  wa: 'red',    ch: 'red',    sh: 'orange', sy: 'red' },
                    { feat: "Programme d'affiliation intégré",     y: 'green',  wa: 'red',    ch: 'red',    sh: 'orange', sy: 'green' },
                    { feat: 'Call Center / Closers intégrés',      y: 'green',  wa: 'red',    ch: 'red',    sh: 'red',    sy: 'red' },
                    { feat: 'Retrait Mobile Money immédiat',       y: 'green',  wa: 'red',    ch: 'yellow', sh: 'red',    sy: 'red' },
                    { feat: 'Analytics + Export PDF',              y: 'green',  wa: 'red',    ch: 'orange', sh: 'green',  sy: 'orange' },
                    { feat: 'Support WhatsApp direct',             y: 'green',  wa: 'yellow', ch: 'green',  sh: 'red',    sy: 'red' },
                    { feat: 'Produits digitaux (formations, PDF)', y: 'green',  wa: 'red',    ch: 'red',    sh: 'green',  sy: 'green' },
                  ].map((row, i) => {
                    const renderCell = (val: string, isYayyam = false) => {
                      if (val === 'green') return (
                        <span className={`inline-flex w-7 h-7 rounded-full ${isYayyam ? 'bg-emerald-500' : 'bg-emerald-100'} items-center justify-center`}>
                          <CheckCircle2 size={16} className={isYayyam ? 'text-white' : 'text-emerald-600'} />
                        </span>
                      )
                      if (val === 'yellow') return (
                        <span className="inline-flex w-7 h-7 rounded-full bg-amber-100 items-center justify-center" title="Partiel">
                          <AlertCircle size={15} className="text-amber-500" />
                        </span>
                      )
                      if (val === 'orange') return (
                        <span className="inline-flex w-7 h-7 rounded-full bg-orange-100 items-center justify-center" title="Payant / Limité">
                          <span className="text-orange-500 font-black text-xs">$$$</span>
                        </span>
                      )
                      if (val === 'red') return (
                        <span className="inline-flex w-7 h-7 rounded-full bg-red-50 items-center justify-center">
                          <span className="text-red-400 font-black text-sm">✗</span>
                        </span>
                      )
                      // Text values (prices)
                      return <span className={`font-black text-xs ${isYayyam ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full' : 'text-slate'}`}>{val}</span>
                    }

                    return (
                      <tr key={i} className={`border-b border-line/50 ${i % 2 === 0 ? 'bg-gray-50/30' : ''} hover:bg-emerald-50/30 transition-colors`}>
                        <td className="p-4 font-bold text-ink">{row.feat}</td>
                        <td className="p-4 text-center bg-emerald/[0.02]">{renderCell(row.y, true)}</td>
                        <td className="p-4 text-center">{renderCell(row.wa)}</td>
                        <td className="p-4 text-center">{renderCell(row.ch)}</td>
                        <td className="p-4 text-center">{renderCell(row.sh)}</td>
                        <td className="p-4 text-center">{renderCell(row.sy)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-bold text-slate">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Inclus nativement</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Partiel / Manuel</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Payant / Plugin</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span> Non disponible</div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/register" className="inline-block px-10 py-4 bg-emerald text-white rounded-xl font-bold text-lg hover:bg-emerald-rich transition shadow-xl shadow-emerald/20">
                Commencer gratuitement →
              </Link>
            </div>
          </div>
        </section>

        {/* 10. CTA FINAL */}
        <section className="py-32 px-6 bg-ink relative overflow-hidden border-t border-line/10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-[1800px] mx-auto w-full px-4 md:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-black mb-6 tracking-tight text-white leading-tight whitespace-pre-line">
              {get('landing_cta_title', 'La confiance se construit.\nLe commerce suit.')}
            </h2>
            <div className="text-xl text-cream/80 font-light mb-12 max-w-2xl mx-auto space-y-2 whitespace-pre-line">
              <p>{get('landing_cta_subtitle', 'Rejoignez Yayyam — la plateforme née de la confiance africaine.\nZéro abonnement. Vous ne payez que quand vous vendez.')}</p>
            </div>
            <Link href={isLoggedIn ? dashboardUrl : "/register"} className="inline-block px-14 py-6 bg-red-600 text-white rounded-2xl font-black text-xl hover:bg-red-700 hover:scale-105 transition-all shadow-2xl shadow-red-600/20 mb-8 animate-pulse">
              {isLoggedIn ? "Mon espace" : get('landing_cta_button', 'Créer ma boutique maintenant')}
            </Link>
            {!isLoggedIn && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <Link href="/login" className="text-cream/60 hover:text-white transition font-medium text-lg">
                  Déjà vendeur ? Connectez-vous →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-ink border-t border-white/5 pt-16 pb-28 px-6 relative">
        <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 grid grid-cols-1 md:grid-cols-4 gap-12 mt-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Logo textClassName="text-white" />
            </div>
            <p className="font-light max-w-sm leading-relaxed text-sm text-white/60">
              La plateforme e-commerce tout-en-un conçue spécifiquement pour les réalités du commerce en Afrique de l&apos;Ouest.
            </p>
            <div className="flex gap-4 mt-6">
               <a suppressHydrationWarning title="Instagram" aria-label="Instagram" href={get('landing_instagram_url', '#')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-emerald hover:text-emerald transition">
                 <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
               </a>
               <a suppressHydrationWarning title="Facebook" aria-label="Facebook" href={get('landing_facebook_url', '#')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-emerald hover:text-emerald transition">
                 <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
               </a>
               <a suppressHydrationWarning title="TikTok" aria-label="TikTok" href={get('contact_tiktok_url', '#')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-emerald hover:text-emerald transition">
                 <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.88 2.89 2.89 0 012.89-2.89c.28 0 .55.04.81.11V9.02a6.25 6.25 0 00-.81-.05A6.36 6.36 0 003.13 15.3 6.36 6.36 0 009.49 21.7a6.36 6.36 0 006.36-6.36V8.86a8.32 8.32 0 004.87 1.56V7a4.82 4.82 0 01-1.13-.31z"/></svg>
               </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white/40 font-mono font-bold mb-6 tracking-widest uppercase text-xs">Produit</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><a href="#features" className="hover:text-emerald-light transition">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-emerald-light transition">Tarifs</a></li>
              <li><Link href="/vendeurs" className="hover:text-emerald-light transition font-bold text-emerald-light">Marketplace</Link></li>
              <li><Link href="/track" className="hover:text-emerald-light transition">Suivre ma commande</Link></li>
              <li><Link href="/client" className="hover:text-emerald-light transition">Espace Client</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-light transition">Dashboard Marchand</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/40 font-mono font-bold mb-6 tracking-widest uppercase text-xs">Légal & Support</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><Link href="/contact" className="hover:text-emerald-light transition font-bold text-emerald-light">Nous contacter</Link></li>
              <li><Link href="/conditions-utilisation" className="hover:text-emerald-light transition">Conditions d&apos;utilisation</Link></li>
              <li><Link href="/politique-confidentialite" className="hover:text-emerald-light transition">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-emerald-light transition">Mentions légales</Link></li>
              <li><a suppressHydrationWarning href={`https://wa.me/${get('landing_whatsapp_support', '221780476393')}`} target="_blank" className="hover:text-emerald-light transition flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald rounded-full animate-pulse"></span>
                Support WhatsApp
              </a></li>
            </ul>
          </div>
        </div>
        <div className="w-full max-w-[1800px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32 mt-16 pt-8 border-t border-white/10 text-sm font-light text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Yayyam. Tous droits réservés.</p>
          <p>Propulsé par l&apos;innovation Africaine 🌍</p>
        </div>
      </footer>
    </div>
  )
}
