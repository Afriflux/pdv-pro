import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Store, 
  Shield, 
  ChevronDown,
  Sparkles,
  Users,
  MessageCircle,
  Globe
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
    } catch(e) { console.warn('[Landing] Failed to parse landing_testimonials:', e) }
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
    } catch(e) { console.warn('[Landing] Failed to parse landing_faq:', e) }
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

        {/* 5. TEMPLATES & SECTEURS (Refonte Visuelle Massive) */}
        <section className="py-32 px-6 bg-ink text-white overflow-hidden relative border-y border-line/10">
          <div className="absolute inset-0 z-0">
             <Image src="/landing/business_categories_mockup.png" alt="Secteurs d'activité" fill className="object-cover opacity-30 mix-blend-screen" unoptimized />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent z-0"></div>
          
          <div className="w-full max-w-[1500px] mx-auto px-4 relative z-10 text-center">
             <div className="mb-14 max-w-3xl mx-auto">
                <p className="font-bold text-gold bg-gold/10 inline-block px-4 py-1.5 rounded-full uppercase tracking-widest text-xs mb-6 shadow-sm">{get('landing_sectors_supertitle', "Déjà utilisé au Sénégal, en Côte d'Ivoire et au Mali.")}</p>
                <h2 className="text-4xl md:text-5xl font-display font-black mb-6 text-white leading-tight">{get('landing_sectors_title', "Parfait pour tous les business.")}</h2>
                <p className="text-xl text-cream/80 font-light max-w-2xl mx-auto">{get('landing_sectors_subtitle', "Peu importe ce que vous vendez, nous gérons le processus de la vitrine jusqu'à votre poche.")}</p>
             </div>

             <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-4xl mx-auto">
               {['Prêt-à-porter', 'Cosmétiques', 'Électronique', 'Alimentation', 'Services (RDV)', 'Restauration', 'Art & Déco', 'Produits Digitaux', 'B2B & Gros', 'Santé & Bien-être'].map((tag, i) => (
                 <div key={i} className="px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm font-bold tracking-widest text-cream/90 shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:border-emerald hover:text-white hover:bg-emerald/20 transition-all cursor-default transform hover:scale-105">
                   {tag.toUpperCase()}
                 </div>
               ))}
             </div>

             <div>
               <Link suppressHydrationWarning href="/vendeurs" className="inline-flex items-center bg-white text-ink px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 hover:scale-105 transition gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                  <span suppressHydrationWarning>Voir les boutiques actives</span> <ArrowRight size={20} />
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

        {/* 6.5 PREUVES DE RETRAITS (Mode Cash - Visuel Split) */}
        <section className="py-24 px-6 bg-white overflow-hidden relative">
          <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8 text-left">
              <span className="inline-flex items-center gap-2 bg-emerald/10 text-emerald font-bold px-4 py-2 rounded-full text-xs tracking-widest uppercase border border-emerald/20">
                <Zap size={16} /> Transparence Totale
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-black text-ink leading-tight">
                L'argent va <span className="text-emerald">directement</span> sur votre téléphone en Franc CFA.
              </h2>
              <p className="text-lg text-slate font-light leading-relaxed">
                Retraits traités tous les jours vers Wave et Orange Money (XOF/XAF). Pas de blocage, pas de délai artificiel. C'est votre argent, vous en disposez quand vous voulez (dès 5 000 FCFA).
              </p>
              
              <div className="mt-8 flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-2xl w-max">
                 <div className="bg-white p-2 rounded-xl shadow-sm"><Shield className="w-6 h-6 text-emerald-500" /></div>
                 <div>
                    <h4 className="font-bold text-ink text-sm">Fonds garantis</h4>
                    <p className="text-xs text-gray-500">Sécurisés par des institutions financières.</p>
                 </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative w-full aspect-square md:h-[500px] group">
               <div className="absolute inset-0 bg-emerald/10 blur-[80px] rounded-[3rem] -z-10 group-hover:scale-105 transition-transform duration-700"></div>
               <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
                 <Image src="/landing/cashout_wave_om_mockup.png" alt="Cashout Wave Orange Money" fill className="object-cover transform group-hover:scale-[1.03] transition-transform duration-700" unoptimized />
               </div>
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
                  <div className="absolute top-0 right-0 bg-gold text-white text-xs font-black uppercase px-3 py-1 rounded-bl-xl">Spécial E-commerce</div>
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

            <div className="relative max-w-4xl mx-auto mb-16 overflow-hidden rounded-[2rem] shadow-xl group border border-emerald-900/10">
               <div className="absolute inset-0">
                  <Image src="/landing/pricing_commission_mockup.png" alt="Réduction des commissions Yayyam" fill className="object-cover transform group-hover:scale-105 transition-transform duration-1000" unoptimized />
               </div>
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-900/70 to-transparent"></div>
               <div className="relative z-10 p-10 flex items-center gap-6">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0">
                   <span className="text-4xl leading-none block">💡</span>
                 </div>
                 <div>
                   <h4 className="text-white font-black text-2xl mb-2 font-display">Système de commission décroissante</h4>
                   <p className="text-emerald-100/90 text-lg leading-relaxed">
                     Vous ne payez qu'une commission sur vos ventes réelles. Plus vous vendez, moins vous payez. Le système s'ajuste pour vous.
                   </p>
                 </div>
               </div>
            </div>

            <PricingCalculator tiers={dynamicTiers} />

          </div>
        </section>
        {/* --- NOUVELLE STRUCTURE VISUELLE ZIG-ZAG --- */}

        {/* Feature 1: App Store Intégré */}
        <section className="py-24 px-6 bg-white overflow-hidden relative border-y border-line/10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald/5 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-emerald/10 text-emerald font-bold px-4 py-2 rounded-full text-xs tracking-widest uppercase border border-emerald/20">
                <Sparkles size={16} /> Hub Central
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-ink leading-tight">
                L'App Store de <span className="text-emerald">l'E-commerce Africain.</span>
              </h2>
              <p className="text-lg text-slate font-light leading-relaxed">
                Connectez vos outils préférés en un seul clic, sans écrire une ligne de code. Automatisez vos processus avec les bots WhatsApp, gérez vos communautés Telegram, et synchronisez vos publicités avec les Pixels Meta ou TikTok en natif.
              </p>
              <ul className="space-y-4">
                {[
                  "Bot WhatsApp (relance auto & Tracking)",
                  "Notion & Zapier Webhooks",
                  "Pixels Facebook & CAPI Server-Side"
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink font-bold">
                    <CheckCircle2 className="text-emerald shrink-0" size={20} />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-emerald/20 blur-[80px] rounded-[3rem] -z-10"></div>
               <div className="relative rounded-[2rem] overflow-hidden border border-line shadow-2xl shadow-emerald/10 group">
                 <Image src="/landing/app_store_mockup.png" alt="Yayyam App Store Mockup" width={800} height={800} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" unoptimized />
               </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Anti-Fraude COD */}
        <section className="py-24 px-6 bg-pearl overflow-hidden relative">
          <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row-reverse items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 font-bold px-4 py-2 rounded-full text-xs tracking-widest uppercase border border-orange-500/20">
                <Shield size={16} /> Sécurité Absolue
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-ink leading-tight">
                Le premier bouclier <span className="text-orange-500">Anti-Fraude COD.</span>
              </h2>
              <p className="text-lg text-slate font-light leading-relaxed">
                Fini les colis refusés à la porte et les livreurs complices. Au moment de la validation, le client reçoit un code OTP par SMS. Le livreur ne peut valider que s'il a le bon code.
              </p>
              <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
                 <p className="text-sm text-slate uppercase font-bold tracking-widest mb-1">Impact Immédiat</p>
                 <p className="text-2xl font-black text-ink mb-2">Taux de livraison réussi doublé</p>
                 <p className="text-gray-500 text-sm">Le paiement à la livraison (Cash-on-Delivery) redevient enfin rentable sur le marché africain.</p>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-orange-500/20 blur-[80px] rounded-[3rem] -z-10 animate-pulse-slow"></div>
               <div className="relative rounded-[2rem] overflow-hidden border border-line shadow-2xl shadow-orange-500/10 group">
                 <Image src="/landing/cod_otp_mockup.png" alt="Anti Fraude OTP Mockup" width={800} height={800} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" unoptimized />
               </div>
            </div>
          </div>
        </section>

        {/* Feature 3: Affiliation & Retraits Auto */}
        <section className="py-24 px-6 bg-ink text-white overflow-hidden relative">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-gold/10 text-gold font-bold px-4 py-2 rounded-full text-xs tracking-widest uppercase border border-gold/20">
                <Store size={16} /> Écosystème Passif
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
                Vendeur, Closers et Affiliés <span className="text-gold">payés automatiquement.</span>
              </h2>
              <p className="text-lg text-cream/80 font-light leading-relaxed">
                Notre robot gère l'argent. Fixez votre seuil (ex: 50 000 FCFA), et dès qu'il est atteint, vos fonds atterrissent directement sur votre compte Wave ou Orange Money, où que vous soyez dans la zone UEMOA/CEMAC.
              </p>
              <ul className="space-y-4">
                {[
                  "Retraits instantanés vers Mobile Money",
                  "Tracking d'Affiliation Millimétré",
                  "Terminal de Closing In-App"
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-bold">
                    <ArrowRight className="text-gold shrink-0" size={20} />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-gold/20 blur-[80px] rounded-[3rem] -z-10"></div>
               <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group">
                 <Image src="/landing/affiliation_cash_mockup.png" alt="Affiliation Dashboard Mockup" width={800} height={800} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" unoptimized />
               </div>
            </div>
          </div>
        </section>

        {/* ── Section Communautés Telegram VIP ──────────────────────────────── */}
        <section className="py-24 px-6 bg-ink text-white overflow-hidden relative border-y border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-turquoise/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row-reverse items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-turquoise/10 border border-turquoise/30 text-turquoise text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                <MessageCircle size={16} /> {get('landing_telegram_supertitle', "Communautés VIP")}
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-tight">
                {get('landing_telegram_title', "Vendez l'accès à vos groupes\nTelegram privés.")}
              </h2>
              <p className="text-lg text-cream/80 font-light leading-relaxed">
                {get('landing_telegram_subtitle', "Formations, coaching, contenus exclusifs — créez un produit lié à votre groupe Telegram. Le client paie, puis reçoit instantanément son lien VIP.")}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                  <span className="text-2xl mb-2 block">🔐</span>
                  <p className="font-bold text-white text-sm">Zéro tâche manuelle</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
                  <span className="text-2xl mb-2 block">💰</span>
                  <p className="font-bold text-white text-sm">Monétisation immédiate</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative w-full aspect-square md:aspect-auto md:h-[600px] group">
              <div className="absolute inset-0 bg-turquoise/20 blur-[80px] rounded-[3rem] -z-10 group-hover:bg-turquoise/30 transition-colors duration-700"></div>
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <Image src="/landing/telegram_vip_mockup.png" alt="Telegram VIP Access Mockup" fill className="object-cover transform group-hover:scale-105 transition-transform duration-700" unoptimized />
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

        {/* 9. REAL-TIME SOCIAL PROOF : IMPACT VISUEL */}
        <section className="py-24 bg-ink border-b border-white/10 relative overflow-hidden">
           {/* Background décoratif Africain */}
           <div className="absolute inset-0 z-0 opacity-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-tr from-emerald-900 to-transparent rounded-full blur-[150px]"></div>
           </div>

           <div className="max-w-[1500px] mx-auto text-center px-6 relative z-10">
             <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-cream font-bold px-4 py-2 rounded-full text-xs tracking-widest uppercase mb-8 shadow-sm backdrop-blur-md">
               <Globe size={16} className="text-emerald-500" /> Écosystème Panafricain
             </div>
             <h3 className="font-display font-black text-4xl md:text-6xl text-white mb-6 leading-tight">
               Déjà utilisé au <span className="text-emerald-500">Sénégal 🇸🇳</span><br/>
               en <span className="text-orange-500">Côte d'Ivoire 🇨🇮</span> <br className="md:hidden" />
               et au <span className="text-gold">Mali 🇲🇱</span>.
             </h3>
             <p className="text-xl md:text-2xl text-cream/70 font-light mb-16 max-w-2xl mx-auto">
               L'écosystème Yayyam en temps réel. <br/><strong className="text-white">Parfait pour tous les business.</strong>
             </p>
             
             {/* Enveloppement des compteurs dans un conteneur verre immersif */}
             <div className="relative p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent max-w-5xl mx-auto shadow-2xl">
               <div className="bg-[#0A1F1A]/80 backdrop-blur-xl rounded-[1.4rem] p-8 md:p-12 border border-white/5">
                 <LiveCounters 
                   vendorsCount={vendorsCount ?? 200} 
                   productsCount={productsCount ?? 1200} 
                   ordersCount={ordersCount ?? 8500} 
                 />
               </div>
             </div>
           </div>
        </section>

        {/* COMPARAISON WHATSAPP VS YAYYAM (Zig-Zag Visuel) */}
        <section className="py-24 px-6 bg-white overflow-hidden relative border-t border-line">
          <div className="w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 font-bold px-4 py-2 rounded-full text-xs tracking-widest uppercase border border-red-200">
                <AlertCircle size={16} /> Le Chaos vs L'Ordre
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-ink leading-tight">
                Pourquoi passer de <span className="text-red-500 line-through decoration-red-500/50">WhatsApp</span> à <span className="text-emerald">Yayyam ?</span>
              </h2>
              <p className="text-lg text-slate font-light leading-relaxed">
                Répondre manuellement aux messages "Prix ?" et courir après les adresses de livraison tue votre croissance. Passez de la messagerie chaotique à un Dashboard e-commerce 100% automatisé.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-1"><span className="text-red-500 font-black text-xs">✗</span></div>
                  <div>
                    <h4 className="font-bold text-ink">Le Passé (WhatsApp)</h4>
                    <p className="text-sm text-gray-500">Gestion de stock papier, paiements manuels, commandes perdues.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1"><CheckCircle2 className="text-emerald-600" size={16} /></div>
                  <div>
                    <h4 className="font-bold text-ink">Le Futur (Yayyam)</h4>
                    <p className="text-sm text-gray-500">Boutique pro, paiements Wave/OM automatisés, Analytics en temps réel.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative w-full aspect-square md:h-[600px] group">
               <div className="absolute inset-0 bg-emerald/20 blur-[80px] rounded-[3rem] -z-10 group-hover:scale-105 transition-transform duration-700"></div>
               <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-line shadow-2xl group">
                 <Image src="/landing/whatsapp_yayyam_split.png" alt="WhatsApp vs Yayyam" fill className="object-cover transform group-hover:scale-[1.03] transition-transform duration-700" unoptimized />
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
                        <span className="text-xs bg-emerald/10 text-emerald px-2 py-0.5 rounded-full font-bold">UEMOA #1</span>
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
                    { feat: 'Wave / Orange Money UEMOA & CEMAC',   y: 'green',  wa: 'red',    ch: 'yellow', sh: 'red',    sy: 'red' },
                    { feat: 'Hub SMS : Anti-Fraude COD (OTP)',     y: 'green',  wa: 'red',    ch: 'red',    sh: 'orange', sy: 'red' },
                    { feat: 'App Store (Notion, Zapier, Bots)',    y: 'green',  wa: 'red',    ch: 'red',    sh: 'green',  sy: 'orange' },
                    { feat: 'Paiement à la livraison complet',     y: 'green',  wa: 'yellow', ch: 'green',  sh: 'red',    sy: 'red' },
                    { feat: 'Abonnement mensuel',                  y: '0 FCFA', wa: '0 FCFA', ch: '~5 000 FCFA', sh: '39$/mo', sy: '27€/mo' },
                    { feat: 'Commission dégressive (5-8%)',        y: 'green',  wa: 'red',    ch: 'red',    sh: 'red',    sy: 'red' },
                    { feat: 'Relances WhatsApp / Paniers',         y: 'green',  wa: 'orange', ch: 'red',    sh: 'orange', sy: 'red' },
                    { feat: 'IA Marketing (Check360°)',            y: 'green',  wa: 'red',    ch: 'red',    sh: 'orange', sy: 'red' },
                    { feat: "Programme d'affiliation intégré",     y: 'green',  wa: 'red',    ch: 'red',    sh: 'orange', sy: 'green' },
                    { feat: 'Call Center / Closers en live',       y: 'green',  wa: 'red',    ch: 'red',    sh: 'red',    sy: 'red' },
                    { feat: 'Retrait Express Mobile Money',        y: 'green',  wa: 'red',    ch: 'yellow', sh: 'red',    sy: 'red' },
                    { feat: 'Communautés Telegram & Académie',     y: 'green',  wa: 'red',    ch: 'red',    sh: 'red',    sy: 'red' },
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

        {/* 10. CTA FINAL : MANIFESTE DE CONFIANCE */}
        <section className="py-32 px-6 bg-[#030e0b] relative overflow-hidden">
          {/* Image de fond de la carte d'Afrique */}
          <div className="absolute inset-0 z-0">
             <Image src="/landing/trust_africa_bg.png" alt="Pan-African Scale Yayyam" fill className="object-cover opacity-40 mix-blend-screen" unoptimized />
          </div>
          {/* Overlay gradient pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030e0b] via-[#030e0b]/80 to-transparent z-0"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none z-0" />

          <div className="max-w-[1000px] mx-auto w-full px-4 text-center relative z-10 flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold-light font-bold px-6 py-2 rounded-full text-xs tracking-widest uppercase mb-8 border border-gold/20 shadow-xl backdrop-blur-sm">
              <Shield size={16} /> Transparence Totale
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-black mb-8 tracking-tight text-white leading-tight">
              La confiance se construit.<br/>
              <span className="text-gold bg-clip-text text-transparent bg-gradient-to-r from-gold to-emerald-400">Le commerce suit.</span>
            </h2>
            
            <div className="text-xl md:text-2xl text-cream/90 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
              <p className="mb-4">
                L'argent va <strong className="text-white">directement sur votre téléphone</strong> en Franc CFA.
              </p>
              <p className="text-lg text-cream/70">
                Rejoignez Yayyam — la plateforme née de la confiance africaine.<br/>
                <span className="text-emerald-400 font-bold border-b border-emerald-400/30 pb-1">Zéro abonnement. Vous ne payez que quand vous vendez.</span>
              </p>
            </div>
            
            <Link href={isLoggedIn ? dashboardUrl : "/register"} className="inline-flex items-center gap-3 px-12 py-5 bg-white text-ink rounded-2xl font-black text-xl hover:bg-emerald-50 hover:scale-105 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-8">
              {isLoggedIn ? "Mon espace" : get('landing_cta_button', 'Créer ma boutique gratuitement')} <ArrowRight size={24} className="text-emerald-600" />
            </Link>
            
            {!isLoggedIn && (
              <div className="mt-4 pt-8 border-t border-white/10 w-full max-w-sm">
                <Link href="/login" className="text-cream/50 hover:text-white transition font-medium">
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
              <li><Link href="/documentation" className="text-emerald hover:text-emerald-light font-bold transition">Documentation Centrale</Link></li>
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
