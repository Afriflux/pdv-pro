import React from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  AlertCircle, 
  Smartphone, 
  Zap, 
  Store, 
  ChartBar, 
  Shield, 
  Globe,
  Instagram,
  Facebook,
  ChevronDown,
  Sparkles,
  Users,
  Briefcase
} from 'lucide-react'
import PricingCalculator from './PricingCalculator'
import { getCommissionTiers } from '@/lib/commission/commission-service'
import { LandingNav } from '@/components/landing/LandingNav'
import { HeroStats } from './components/HeroStats'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CountdownBanner } from '@/components/landing/CountdownBanner'
import { LiveCounters } from '@/components/landing/LiveCounters'
import { TestimonialSlider } from '@/components/landing/TestimonialSlider'
import { Package, Wallet, Share2, TrendingUp, PhoneCall, Phone, ChevronRight } from 'lucide-react'


  // Types pour les données dynamiques
  interface LandingTestimonial {
    name: string; biz: string; quote: string; badge: string
  }
  interface LandingFAQ {
    q: string; r: string; active?: boolean; order?: number
  }

  const DEFAULT_TESTIMONIALS: LandingTestimonial[] = [
    { name: 'Mariam D.', biz: 'Boutique Cosmétiques', quote: "Avant PDV Pro, je perdais facilement 30% de mes commandes parce que les clients ne savaient pas comment payer. Maintenant Wave fait tout. Je dors tranquille.", badge: "🇸🇳 Dakar, Sénégal" },
    { name: 'Kofi A.', biz: 'Vendeur Électronique', quote: "Le COD a tout changé. Mes clients à Abidjan avaient peur de payer d'avance. Maintenant ils commandent sans hésiter.", badge: "🇨🇮 Abidjan, Côte d'Ivoire" },
    { name: 'Awa B.', biz: 'Créatrice de Mode', quote: "L'IA Check360° m'a dit que mes ventes baissaient le mercredi. J'ai lancé une promo ce jour-là. +45% de commandes en une semaine.", badge: "🇲🇱 Bamako, Mali" }
  ]

  const DEFAULT_FAQS: LandingFAQ[] = [
    {
      q: "Comment fonctionne la commission ?",
      r: "La commission est dégressive et calculée automatiquement sur votre chiffre d'affaires mensuel : de 8% pour les débutants à seulement 5% pour les gros volumes. PDV Pro absorbe tous les frais techniques (passerelles et retraits), vous recevez votre net garanti."
    },
    {
      q: "Peut-on vendre des produits physiques ?",
      r: "Oui ! PDV Pro supporte nativement le paiement à la livraison (COD) pour les vendeurs de produits physiques. Le COD suit simplement la même commission dégressive que les paiements digitaux (de 8% à 5%). Aucun abonnement requis — vous activez le paiement à la livraison depuis vos paramètres et c'est tout."
    },
    {
      q: "Quand sont disponibles mes fonds ?",
      r: "Immédiatement. Dès que le paiement est confirmé, les fonds sont crédités sur votre portefeuille PDV Pro et disponibles pour un retrait. Pas d'attente de 48h, pas de délai."
    },
    {
      q: "Quelles passerelles sont disponibles ?",
      r: "Nous intégrons Wave SN/CI, CinetPay (pour Orange Money, Moov, MTN, etc.) et PayTech. Cela vous permet de couvrir 100% des clients en Afrique de l'Ouest et à l'international."
    },
    {
      q: "Y a-t-il un abonnement obligatoire ?",
      r: "Non, jamais. PDV Pro fonctionne à 100% sur un modèle de commission. Aucun abonnement mensuel, aucun frais fixe, aucun coût caché. Nous ne gagnons de l'argent que quand vous en gagnez."
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
      r: "Vous pouvez vendre l'accès à des groupes Telegram privés (formations, communautés exclusives, contenus premium). Le client paie sur votre boutique PDV Pro, et reçoit son invitation automatiquement."
    }
  ]

export default async function LandingPage() {
  const supabaseServer = await createClient()
  const { data: { session } } = await supabaseServer.auth.getSession()
  const isLoggedIn = !!session

  // Chargement config dynamique depuis PlatformConfig
  const supabaseAdmin = createAdminClient()

  let dashboardUrl = '/dashboard'
  if (isLoggedIn && session?.user) {
    const { data: userRow } = await supabaseAdmin.from('User').select('role').eq('id', session.user.id).single()
    const role = userRow?.role
    if (role === 'acheteur' || role === 'client') dashboardUrl = '/client'
    else if (role === 'affilie') dashboardUrl = '/portal'
    else if (role === 'super_admin' || role === 'gestionnaire' || role === 'support') dashboardUrl = '/admin'
  }

  const { TIERS: dynamicTiers } = await getCommissionTiers()
  const allowedKeys = [
    'landing_hero_badge',
    'landing_hero_h1',
    'landing_hero_subtitle',
    'landing_hero_cta_primary',
    'landing_hero_cta_secondary',
    'landing_problem_supertitle',
    'landing_problem_title',
    'landing_problem_subtitle',
    'landing_solution_supertitle',
    'landing_solution_title',
    'landing_solution_subtitle',
    'landing_features_supertitle',
    'landing_features_title',
    'landing_sectors_supertitle',
    'landing_sectors_title',
    'landing_sectors_subtitle',
    'landing_telegram_supertitle',
    'landing_telegram_title',
    'landing_telegram_subtitle',
    'landing_cod_price',
    'landing_cta_title',
    'landing_cta_button',
    'landing_testimonials',
    'landing_faq',
    'landing_instagram_url',
    'landing_whatsapp_support',
    'landing_banner_active',
    'landing_banner_date',
    'landing_banner_text'
  ]
  const { data: cfgRows } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')
    .in('key', allowedKeys)
  const cfg = (cfgRows ?? []).reduce<Record<string, string>>(
    (acc, { key, value }) => ({ ...acc, [key]: value }), {}
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
    : ['Commencez à vendre', 'aujourd\'hui.', 'Encaissez sur Wave/OM.']

  // Counts en temps réel
  const [
    { count: vendorsCount },
    { count: productsCount },
    { count: ordersCount }
  ] = await Promise.all([
    supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('role', 'vendeur'),
    supabaseAdmin.from('Product').select('*', { count: 'exact', head: true }).eq('active', true),
    supabaseAdmin.from('Order').select('*', { count: 'exact', head: true })
  ])

  return (
    <div className="bg-cream min-h-screen text-ink font-body selection:bg-emerald/20 selection:text-ink">
      <CountdownBanner config={{
        active: get('landing_banner_active', 'true') === 'true',
        dateStr: get('landing_banner_date', '2026-04-01T00:00:00Z'),
        text: get('landing_banner_text', 'Lancement officiel le 1er Avril 2026')
      }} />
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center transform -rotate-6 shadow-sm shadow-emerald/20">
              <Store className="text-white" size={24} />
            </div>
            <span className="text-2xl font-display font-black tracking-tighter text-ink">PDV<span className="text-emerald">Pro</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-sm text-charcoal">
            <a href="#features" className="hover:text-emerald transition">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-emerald transition">Tarifs</a>
            <Link href="/vendeurs" className="hover:text-emerald transition">Marketplace</Link>
            <a href="#faq" className="hover:text-emerald transition">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <LandingNav isLoggedIn={isLoggedIn} dashboardUrl={dashboardUrl} />
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative pt-24 pb-32 overflow-hidden px-6 bg-cream">
          {/* Motif SVG géométrique subtil */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none">
            <defs>
              <pattern id="geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#0D5C4A" strokeWidth="1"/>
                <circle cx="40" cy="40" r="2" fill="#0D5C4A" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo)"/>
          </svg>

          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            {(cfg['landing_hero_badge'] || new Date() < new Date('2026-03-31T00:00:00+00:00')) && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6 animate-in fade-in slide-in-from-bottom-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  {get('landing_hero_badge', '🚀 Launch Week — Commission à 5% pour les 100 premiers vendeurs')}
                </span>
              </div>
            )}
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-ink leading-[1.1]">
              {h1L1}<br />
              {h1L2}<br />
              <span className="text-emerald italic">{h1L3}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate font-light max-w-3xl mx-auto leading-relaxed">
              {get('landing_hero_subtitle', 'PDV Pro est la seule plateforme conçue pour encaisser rapidement en Afrique. Retrait possible dès 5 000 FCFA sur Wave ou Orange Money. Zéro frais fixe.')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href={isLoggedIn ? dashboardUrl : "/register"} className="w-full sm:w-auto px-8 py-4 bg-emerald hover:bg-emerald-rich text-white font-semibold rounded-full text-lg transition shadow-xl shadow-emerald/20 flex items-center justify-center gap-2">
                {isLoggedIn ? "Mon espace" : get('landing_hero_cta_primary', 'Lancer ma boutique')} <ArrowRight size={20} />
              </Link>
              <Link href="/vendeurs" className="w-full sm:w-auto px-8 py-4 bg-white border border-emerald text-emerald hover:bg-emerald/5 rounded-full font-medium text-lg transition flex items-center justify-center shadow-sm">
                {get('landing_hero_cta_secondary', 'Voir les boutiques actives →')}
              </Link>
            </div>
            
            <HeroStats />
          </div>
        </section>

        {/* BARRE DE SOCIAL PROOF ANIMÉE - FIXÉ EN BAS */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1A1A1A] text-white py-3 overflow-hidden flex whitespace-nowrap border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <style>{`
            @keyframes marqueeHero {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .animate-marqueeHero {
              animation: marqueeHero 20s linear infinite;
            }
          `}</style>
          <div className="animate-marqueeHero flex items-center gap-8 text-sm">
            {[...get('landing_ticker_text', '🔒 Paiements sécurisés Wave & Orange Money , 💰 Zéro abonnement — ne payez que sur vos ventes , 🎯 Upsell 1-Click , 📦 Gestion des livraisons intégrée , 🤖 IA marketing incluse , 📞 Récupération Paniers Abandonnés , 🇸🇳🇨🇮🇲🇱🇧🇫🇬🇳 Toute l\'Afrique de l\'Ouest').split(',').map(s=>s.trim()).filter(Boolean), ...get('landing_ticker_text', '🔒 Paiements sécurisés Wave & Orange Money , 💰 Zéro abonnement — ne payez que sur vos ventes , 🎯 Upsell 1-Click , 📦 Gestion des livraisons intégrée , 🤖 IA marketing incluse , 📞 Récupération Paniers Abandonnés , 🇸🇳🇨🇮🇲🇱🇧🇫🇬🇳 Toute l\'Afrique de l\'Ouest').split(',').map(s=>s.trim()).filter(Boolean)].map((item, i) => (
              <React.Fragment key={i}>
                <span>{item}</span>
                <span>•</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 2. LE PROBLÈME (Douleurs vendeurs WhatsApp) */}
        <section className="py-24 bg-ink border-y border-line/10 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-4 py-1.5 font-mono tracking-widest uppercase text-xs mb-6 font-bold shadow-sm">{get('landing_problem_supertitle', 'Le Casse-tête')}</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-white">{get('landing_problem_title', 'La vente sur WhatsApp est brisée.')}</h2>
              <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">{get('landing_problem_subtitle', 'Vous perdez des ventes tous les jours à cause d\'un processus chaotique.')}</p>
            </div>
          </div>
            
          <div className="relative w-full max-w-7xl mx-auto">
            {/* CSS pour scrollbar visible et stylisée sur Desktop */}
            <style>{`
              .custom-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.2) transparent;
              }
              .custom-scrollbar::-webkit-scrollbar {
                height: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent; 
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2); 
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.4); 
              }
            `}</style>
            
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 pb-8 custom-scrollbar">
              {[
                { icon: <MessageCircle size={32} />, title: 'Réponses infinies', desc: "Vous passez 3h par jour à répondre \"C'est combien ?\" sur WhatsApp. Chaque réponse en retard = une vente perdue." },
                { icon: <Smartphone size={32} />, title: 'Pas de vitrine stable', desc: "Un statut WhatsApp disparaît en 24h. Vos clients ne savent pas avec certitude ce que vous vendez." },
                { icon: <AlertCircle size={32} />, title: 'Paiements risqués', desc: "Captures d'écran falsifiées, virements qui n'arrivent pas, clients qui disparaissent. Vous prenez tous les risques." },
                { icon: <ChartBar size={32} />, title: 'Zéro visibilité', desc: "Vous ne savez pas quels produits se vendent le mieux, ni combien vous avez réellement gagné à la fin du mois." },
              ].map((item, i) => (
                <div key={i} className="snap-center shrink-0 w-[85vw] md:w-[320px] lg:w-[280px] xl:w-[300px] bg-charcoal/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5 shadow-2xl relative group hover:border-red-500/30 transition-all duration-300 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-300 shadow-lg border border-red-500/20">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-white">{item.title}</h3>
                  <p className="text-cream/60 leading-relaxed text-sm font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. LA SOLUTION (3 Étapes) */}
        <section className="py-32 px-6 bg-pearl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block font-bold">{get('landing_solution_supertitle', 'La Solution')}</span>
                <h2 className="text-4xl md:text-6xl font-display font-black mb-6 text-ink leading-tight">{get('landing_solution_title', 'Passez au niveau supérieur.')}</h2>
                <p className="text-xl text-slate font-light mb-16 leading-relaxed">
                  {cfg['landing_solution_subtitle'] ? get('landing_solution_subtitle', '') : (
                    <>Avec PDV Pro, centralisez votre activité et offrez une expérience <span className="font-medium text-emerald bg-emerald/10 px-2 py-0.5 rounded-md">premium</span> à vos clients.</>
                  )}
                </p>
                
                <div className="flex flex-col gap-8 relative before:absolute before:inset-y-4 before:left-[35px] md:before:left-[43px] before:w-[2px] before:bg-emerald/20">
                  {[
                    { icon: <Store size={32} strokeWidth={2.5} />, title: 'Créez votre boutique en 2 minutes', desc: "Ajoutez votre logo, choisissez pdvpro.com/votre-nom. Votre vitrine professionnelle est disponible immédiatement." },
                    { icon: <Package size={32} strokeWidth={2.5} />, title: 'Ajoutez vos produits et fixez vos prix', desc: "Photos, prix, variantes. Chacun aura son propre lien d'achat direct sans plus jamais répondre 'c'est combien ?'." },
                    { icon: <Wallet size={32} strokeWidth={2.5} />, title: 'Vendez et recevez votre argent', desc: "Encaissez par Wave ou Orange Money, recevez directement votre argent sur votre wallet. Gagnez en autonomie." },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 relative group z-10">
                      <div className="shrink-0 w-16 md:w-20 h-16 md:h-20 bg-white border-4 border-pearl text-emerald font-black flex items-center justify-center rounded-2xl shadow-lg group-hover:bg-emerald group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                        {step.icon}
                      </div>
                      <div className="pt-2 md:pt-4">
                        <h3 className="text-xl md:text-2xl font-display font-black mb-2 text-ink group-hover:text-emerald transition-colors">{step.title}</h3>
                        <p className="text-slate leading-relaxed font-light text-base md:text-lg">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative lg:pl-10">
                {/* Mockup Premium */}
                <div className="relative group perspective-1000 hidden md:block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald to-turquoise opacity-20 blur-2xl rounded-[3rem] group-hover:opacity-30 transition duration-1000"></div>
                  <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] p-2 shadow-2xl relative overflow-hidden transform transition-all duration-700 hover:-translate-y-2 hover:rotate-1">
                    <div className="bg-cream/50 rounded-[1.5rem] p-6 border border-line/50 flex flex-col gap-6">
                      {/* Browser header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-line/50">
                        <div className="flex gap-1.5 pl-2">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                        </div>
                        <div className="flex-1 bg-white/60 h-8 rounded-md border border-line/50 flex items-center justify-center text-xs text-slate font-mono">pdvpro.com/votreboutique</div>
                      </div>

                      {/* Dashboard Content */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-gradient-to-br from-emerald to-emerald-rich p-6 rounded-2xl text-white shadow-lg relative overflow-hidden flex items-center">
                           <div>
                             <p className="text-emerald-50 text-sm font-medium mb-1 tracking-wider uppercase">Revenus du jour</p>
                             <p className="font-display font-black text-4xl">145 000 F</p>
                           </div>
                           <div className="ml-auto bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-sm border border-white/20">
                             <Sparkles size={16} /> <span className="text-[10px] uppercase font-bold tracking-widest">IA Check360°</span>
                           </div>
                        </div>
                        
                        <div className="col-span-1 bg-white p-5 rounded-2xl border border-line/50 shadow-sm flex flex-col justify-between hover:border-emerald/30 transition-colors">
                           <p className="text-slate text-xs tracking-widest uppercase font-bold mb-2">Visites</p>
                           <p className="font-display font-bold text-3xl text-ink">342</p>
                        </div>

                        <div className="col-span-1 bg-white p-5 rounded-2xl border border-line/50 shadow-sm flex flex-col justify-end min-h-[100px] relative overflow-hidden hover:border-emerald/30 transition-colors">
                           <div className="flex items-end gap-1 w-full h-12 opacity-80">
                             <div className="bg-emerald/20 w-1/4 rounded-t-sm h-1/4"></div>
                             <div className="bg-emerald/50 w-1/4 rounded-t-sm h-2/4"></div>
                             <div className="bg-emerald w-1/4 rounded-t-sm h-full"></div>
                             <div className="bg-emerald/30 w-1/4 rounded-t-sm h-2/4"></div>
                           </div>
                        </div>

                        <div className="col-span-2 space-y-3 mt-2">
                          <div className="bg-white p-4 rounded-xl border border-line/50 shadow-sm flex items-center gap-4 hover:border-emerald/30 transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center text-emerald shrink-0"><CheckCircle2 size={20} /></div>
                            <div>
                               <p className="text-sm font-bold text-ink tracking-wide">Paiement reçu</p>
                               <p className="text-xs text-slate mt-0.5">Wave Mobile Money</p>
                            </div>
                            <div className="ml-auto font-bold text-emerald">+15 000 F</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-line/50 shadow-sm flex items-center gap-4 hover:border-gold/30 transition-colors cursor-default">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0"><Store size={20} /></div>
                            <div>
                               <p className="text-sm font-bold text-ink tracking-wide">Commande COD</p>
                               <p className="text-xs text-slate mt-0.5">En attente de livraison</p>
                            </div>
                            <div className="ml-auto font-bold text-gold">+2 500 F</div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FONCTIONNALITÉS CLÉS (Marquee Automatique) */}
        <section id="features" className="py-24 bg-white border-y border-line overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block font-bold">{get('landing_features_supertitle', "L'arsenal complet")}</span>
              <h2 className="text-4xl md:text-6xl font-display font-black mb-6 tracking-tight text-ink">
                {cfg['landing_features_title'] ? get('landing_features_title', '') : (
                  <>Tout ce dont vous avez besoin pour <span className="text-emerald relative inline-block">grandir.<span className="absolute -bottom-2 left-0 w-full h-3 bg-gold/30 -rotate-2"></span></span></>
                )}
              </h2>
            </div>
          </div>
            
          {/* Inject inline styles for the marquee animation */}
          <style>{`
            @keyframes marqueeX {
              from { transform: translateX(0); }
              to { transform: translateX(-100%); }
            }
            @keyframes marqueeXReverse {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            .animate-marqueeX {
              animation: marqueeX 35s linear infinite;
            }
            .animate-marqueeX-reverse {
              animation: marqueeXReverse 40s linear infinite;
            }
            .hover-pause:hover .animate-marqueeX, 
            .hover-pause:hover .animate-marqueeX-reverse {
              animation-play-state: paused;
            }
          `}</style>

          <div className="relative py-4 hover-pause flex flex-col gap-6 w-full">
            {/* Fade Edges for premium effect (desktop only) */}
            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            {/* Row 1 : Sens normal */}
            <div className="flex w-max">
                {[1, 2].map((slide) => (
                  <div key={slide} className="flex gap-6 pr-6 animate-marqueeX w-max" aria-hidden={slide === 2 ? "true" : undefined}>
                    {[
                      { icon: <Smartphone size={28} />, title: 'Boutique Mobile', desc: '98% de vos acheteurs sont sur smartphone. Notre design charge en 1 seconde et convertit mieux.' },
                      { icon: <Zap size={28} />, title: 'Upsell 1-Click', desc: 'Proposez une offre irrésistible juste après l\'achat. Augmentez votre panier moyen de 30% sans effort.' },
                      { icon: <Store size={28} />, title: 'Gestion Livraisons', desc: 'Configurez vos zones tarifaires. Le client paie le produit + la livraison en un seul clic.' },
                      { icon: <Shield size={28} />, title: 'Automatisations WA', desc: 'Vos clients reçoivent des confirmations de commande et de suivi directement sur WhatsApp.' },
                      { icon: <ChartBar size={28} />, title: 'Analytics', desc: 'Suivez vos vues, vos ventes, votre taux de conversion et l\'origine de vos clients en temps réel.' },
                    ].map((feat, i) => (
                      <div key={i} className="group p-8 w-[350px] md:w-[420px] shrink-0 bg-pearl/30 border border-line rounded-[2rem] hover:bg-white hover:border-emerald/40 hover:shadow-2xl hover:shadow-emerald/10 transition-all duration-300">
                        <div className="inline-flex w-14 h-14 bg-white rounded-2xl items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-line group-hover:border-emerald/30 text-emerald">
                          {feat.icon}
                        </div>
                        <h3 className="text-2xl font-display font-bold text-ink mb-3 group-hover:text-emerald transition-colors">{feat.title}</h3>
                        <p className="text-slate text-sm leading-relaxed font-light">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            {/* Row 2 : Sens inversé (marqueeXReverse) */}
            <div className="flex w-max">
                {[1, 2].map((slide) => (
                  <div key={slide} className="flex gap-6 pr-6 animate-marqueeX-reverse w-max" aria-hidden={slide === 2 ? "true" : undefined}>
                    {[
                      { icon: <Globe size={28} />, title: 'Marketing', desc: 'Codes promos, Vente Flash, Cross-selling et Programme d\'affiliation pour vos ambassadeurs.' },
                      { icon: <Users size={28} />, title: 'Call Center & Closers', desc: 'Vos paniers abandonnés sont automatiquement envoyés à nos experts qui relancent vos prospects pour vous.' },
                      { icon: <MessageCircle size={28} />, title: 'Groupes Telegram', desc: 'Vendez l\'accès à des groupes privés. L\'invitation est envoyée automatiquement après chaque paiement.' },
                      { icon: <Sparkles size={28} />, title: 'Ambassadeurs / Auto-Retrait', desc: 'Vos affiliés et closers sont payés automatiquement par le système, les mains libres.' },
                      { icon: <Briefcase size={28} />, title: 'Produits Digitaux & Services', desc: 'Vendez des Ebooks, VOD, ou des Coachings avec notre système de réservation natif.' },
                    ].map((feat, i) => (
                      <div key={i} className="group p-8 w-[350px] md:w-[420px] shrink-0 bg-pearl/30 border border-line rounded-[2rem] hover:bg-white hover:border-emerald/40 hover:shadow-2xl hover:shadow-emerald/10 transition-all duration-300">
                        <div className="inline-flex w-14 h-14 bg-white rounded-2xl items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 border border-line group-hover:border-emerald/30 text-emerald">
                          {feat.icon}
                        </div>
                        <h3 className="text-2xl font-display font-bold text-ink mb-3 group-hover:text-emerald transition-colors">{feat.title}</h3>
                        <p className="text-slate text-sm leading-relaxed font-light">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

          </div>
        </section>

        {/* 5. TEMPLATES & SECTEURS */}
        <section className="py-32 px-6 bg-ink text-white overflow-hidden relative border-y border-line/10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-emerald/10 blur-[150px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 text-center">
             <div className="mb-14 max-w-3xl mx-auto">
                <p className="font-bold text-gold uppercase tracking-widest text-sm mb-4">{get('landing_sectors_supertitle', "Déjà utilisé au Sénégal, en Côte d'Ivoire et au Mali.")}</p>
                <h2 className="text-4xl md:text-5xl font-display font-black mb-6 text-white">{get('landing_sectors_title', "Parfait pour tous les business.")}</h2>
                <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">{get('landing_sectors_subtitle', "Peu importe ce que vous vendez, nous gérons le processus de la vitrine jusqu'à votre poche.")}</p>
             </div>

             <div className="flex flex-wrap justify-center gap-4 mb-16 max-w-4xl mx-auto">
               {['Prêt-à-porter', 'Cosmétiques', 'Électronique', 'Alimentation', 'Services (RDV)', 'Restauration', 'Art & Déco', 'Produits Digitaux', 'B2B & Gros', 'Santé & Bien-être'].map((tag, i) => (
                 <div key={i} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-bold tracking-widest text-cream/80 hover:border-emerald hover:text-white hover:bg-emerald/20 shadow-sm hover:shadow-emerald/20 transition-all cursor-default transform hover:-translate-y-1">
                   {tag.toUpperCase()}
                 </div>
               ))}
             </div>

             <div>
               <Link href="/vendeurs" className="inline-flex items-center bg-white text-ink px-8 py-4 rounded-xl font-bold hover:bg-emerald hover:text-white transition gap-2 shadow-xl shadow-white/5">
                 Voir les boutiques actives <ArrowRight size={20} />
               </Link>
             </div>
          </div>
        </section>

        {/* 6. TÉMOIGNAGES */}
        <section className="py-24 px-6 bg-cream border-b border-line">
          <div className="max-w-7xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-black text-center mb-16 tracking-tight text-ink">Avis des précurseurs.</h2>
            <TestimonialSlider testimonials={testimonialData} />
          </div>
        </section>

        {/* 6.5 PREUVES DE RETRAITS (Mode Cash) */}
        <section className="py-20 px-6 bg-white overflow-hidden relative">
          <div className="max-w-5xl mx-auto text-center">
            <span className="inline-block bg-emerald/10 text-emerald font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 border border-emerald/20">Transparence Totale</span>
            <h2 className="text-3xl md:text-4xl font-display font-black mb-6 text-ink">L'argent va <span className="text-emerald">directement</span> sur votre téléphone.</h2>
            <p className="text-lg text-slate font-light max-w-2xl mx-auto mb-12">Retraits traités tous les jours vers Wave et Orange Money. Pas de blocage, pas de délai artificiel. C'est votre argent, vous en disposez quand vous voulez (dès 5 000 FCFA).</p>
            
            <div className="flex justify-center gap-4 flex-wrap">
               {/* Mockup Preuve de retrait Wave */}
               <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 w-72 text-left shadow-sm hover:shadow-md transition-shadow transform hover:-translate-y-1">
                 <div className="flex justify-between items-center mb-4">
                   <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-xs">W</div>
                   <span className="text-[10px] text-gray-400 font-medium">Aujourd'hui, 09:42</span>
                 </div>
                 <p className="text-xs text-blue-900/60 font-bold mb-1 uppercase tracking-wider">Transfert reçu avec succès</p>
                 <p className="text-2xl font-black text-blue-600 mb-2">+ 45 000 F</p>
                 <p className="text-xs text-gray-500 font-medium">De: PDV PRO</p>
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
                 <p className="text-xs text-gray-500 font-medium">De: PDV PRO PAYMENTS</p>
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
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block">Tarification</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-ink">Un modèle clair.</h2>
              <p className="text-xl text-slate font-light mb-6">Commencez gratuitement, payez moins quand vous grossissez.</p>
              <div className="text-emerald font-bold bg-emerald/10 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-emerald/20 shadow-sm animate-pulse-slow">
                <Sparkles size={18} /> Le système ajuste votre palier automatiquement chaque mois selon votre C.A.
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-8 mb-4 hide-scrollbar">
              <div className="min-w-[1000px] flex items-stretch gap-4 md:grid md:grid-cols-5 md:min-w-0 px-2 pt-8">
                
                {/* Headers */}
                <div className="w-48 shrink-0 md:w-auto flex flex-col sticky left-0 z-20 bg-pearl/90 backdrop-blur-sm self-stretch pt-[104px] pb-6 pr-4">
                  <div className="space-y-6">
                    <div className="h-12 flex items-center text-xs font-bold text-slate uppercase tracking-wider justify-start">Votre CA mensuel</div>
                    <div className="h-12 flex items-center text-xs font-bold text-slate uppercase tracking-wider justify-start">Commission PDV Pro</div>
                    <div className="h-12 flex items-center text-xs font-bold text-slate uppercase tracking-wider justify-start mt-2">Vous recevez</div>
                    <div className="h-12 flex items-center text-xs font-bold text-slate uppercase tracking-wider justify-start">Frais passerelle</div>
                  </div>
                </div>

                {/* Card 1 */}
                <div className="w-64 md:w-auto bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative group/tooltip overflow-hidden cursor-help">
                  <div className="absolute inset-0 bg-ink/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-gold mb-3 text-lg">Palier Débutant</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Activé par défaut ou si votre chiffre d'affaires mensuel (N-1) est inférieur à 100 000 FCFA. Une commission unique de 8% s'applique. Zéro abonnement.</p>
                  </div>
                  <div className="text-center pb-6 border-b border-line mb-6">
                    <h3 className="font-display font-black text-2xl text-ink">Débutant</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">0 - 100K FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-ink">8%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald text-xl mt-2">92%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-slate">Inclus</div>
                  </div>
                  </div>

                {/* Card 2 */}
                <div className="w-64 md:w-auto bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative group/tooltip overflow-hidden cursor-help">
                  <div className="absolute inset-0 bg-ink/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-gold mb-3 text-lg">Palier Actif</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Dès que vous dépassez les 100 000 FCFA de ventes le mois précédent, le système abaisse automatiquement votre commission à 7%. Vous gagnez plus.</p>
                  </div>
                  <div className="text-center pb-6 border-b border-line mb-6">
                    <h3 className="font-display font-black text-2xl text-ink">Actif</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">100K - 500K FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-ink">7%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald text-xl mt-2">93%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-slate">Inclus</div>
                  </div>
                  </div>

                {/* Card 3 */}
                <div className="w-64 md:w-auto bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative group/tooltip overflow-hidden cursor-help">
                  <div className="absolute inset-0 bg-ink/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-gold mb-3 text-lg">Palier Pro</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Réservé aux e-commerçants confirmés avec plus de 500 000 FCFA de volumes mensuels (N-1). Vous passez à 6% et gardez 94% du chiffre d'affaires net.</p>
                  </div>
                  <div className="text-center pb-6 border-b border-line mb-6">
                    <h3 className="font-display font-black text-2xl text-ink">Pro</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">500K - 1M FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-ink">6%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald text-xl mt-2">94%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-slate">Inclus</div>
                  </div>
                  </div>

                {/* Card 4 (Expert) */}
                <div className="w-64 md:w-auto bg-pearl rounded-3xl border-2 border-emerald-rich shadow-lg p-6 flex flex-col transform md:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald/20 transition-all duration-300 relative group/tooltip z-20 cursor-help">
                  <div className="absolute inset-0 rounded-3xl bg-emerald-deep/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-emerald-light mb-3 text-lg">Palier Expert</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Le grade d'élite. En dépassant 1 Million FCFA mensuels, vous obtenez notre meilleur taux de 5%. Frais Wave/Orange Money inclus. Zéro plafond de facturation.</p>
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full shadow-md whitespace-nowrap pointer-events-none z-10">
                    Meilleur taux (Populaire)
                  </div>
                  <div className="text-center pb-6 border-b border-emerald/20 mb-6 relative z-0">
                    <h3 className="font-display font-black text-2xl text-emerald-rich">Expert</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center relative z-0">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">+ 1M FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-emerald scale-110">5%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald-rich text-2xl mt-2 bg-emerald/10 rounded-full scale-110 px-4">95%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-bold text-emerald">Inclus</div>
                  </div>
                  </div>

              </div>
            </div>

            <div className="mt-8 text-center mb-16">
              <Link href="/register" className="inline-block px-12 py-5 bg-emerald text-white rounded-xl font-bold text-lg hover:bg-emerald-rich transition shadow-xl shadow-emerald/20">
                Créer ma boutique (Palier Débutant)
              </Link>
            </div>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mb-16 mt-6 max-w-5xl mx-auto">
               <div className="bg-white border-2 border-emerald/20 rounded-2xl p-6 text-center shadow-lg flex-1 hover:border-emerald transition-colors flex flex-col items-center justify-center">
                 <div className="text-4xl leading-none mb-3">💳</div>
                 <h4 className="font-display font-black text-ink text-xl mb-1">Mobile Money</h4>
                 <p className="text-slate text-sm font-medium">Wave & Orange Money par défaut</p>
               </div>
               <div className="bg-white border-2 border-gold/40 rounded-2xl p-6 text-center shadow-lg flex-1 hover:border-gold transition-colors flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gold text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">Spécial E-commerce</div>
                  <div className="text-4xl leading-none mb-3 mt-2">📦</div>
                  <h4 className="font-display font-black text-ink text-xl mb-1">Service COD</h4>
                  <p className="text-gold-dark font-bold text-sm">Paiement à la livraison : Commission dynamique</p>
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
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="inline-block bg-emerald/10 text-emerald font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 border border-emerald/20">La Machine à Cash</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">Trois leviers natifs pour <span className="text-emerald">exploser</span> votre C.A.</h2>
              <p className="text-xl text-slate font-light">
                Ne laissez plus d'argent sur la table. PDV Pro intègre un arsenal de conversion secret, activable en un clic sans abonnement externe.
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
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="inline-block bg-ink/10 text-ink font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 shadow-sm border border-ink/10">Sans Boutiques & Sans Produits</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">L'Écosystème de <span className="text-emerald">Richesse Partagée</span></h2>
              <p className="text-xl text-slate font-light">
                Vous n'avez pas de produit à vendre ? Aucun problème. PDV Pro est le terrain de jeu ultime pour générer des revenus passifs ou actifs en devenant partenaire des meilleurs vendeurs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                <Link href="/register?role=affiliate" className="mt-auto inline-flex items-center gap-2 text-emerald font-bold hover:text-emerald-rich transition-colors group/link w-fit">
                  Devenir Affilié <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
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
                <Link href="/register?role=closer" className="relative z-10 mt-auto inline-flex items-center gap-2 text-emerald-light font-bold hover:text-white transition-colors group/link w-fit">
                  Rejoindre les Closers <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ── Section Communautés Telegram ──────────────────────────────── */}
        <section className="py-20 bg-ink border-y border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <span className="inline-block bg-emerald/10 border border-emerald/30 text-emerald text-xs font-bold px-3 py-1 rounded-full mb-4 shadow-sm">
                {get('landing_telegram_supertitle', "EXCLUSIF PDV PRO")}
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
            <div className="max-w-4xl mx-auto">
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

        {/* COMPARAISON WHATSAPP VS PDV PRO */}
        <section className="py-16 bg-gray-50 border-t border-line">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-10 text-ink">
              Pourquoi passer de WhatsApp à PDV Pro ?
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
              {/* Colonne PDV Pro */}
              <div className="bg-white rounded-2xl p-6 border-2 border-[#0F7A60] shadow-xl shadow-emerald/10 relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F7A60] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Recommandé
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl block mb-2">🏪</span>
                  <h3 className="font-bold text-xl text-[#0F7A60]">Vendre sur PDV Pro</h3>
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

        {/* 10. CTA FINAL */}
        <section className="py-32 px-6 bg-ink relative overflow-hidden border-t border-line/10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-black mb-6 tracking-tight text-white leading-tight whitespace-pre-line">
              {get('landing_cta_title', 'Prêt à lancer votre business en ligne ?')}
            </h2>
            <div className="text-xl text-cream/80 font-light mb-12 max-w-2xl mx-auto space-y-2 whitespace-pre-line">
              <p>{get('landing_cta_subtitle', 'Rejoignez PDV Pro gratuitement.\nAucun abonnement, vous ne payez que quand vous vendez.')}</p>
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mt-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Store className="text-gold" size={28} />
              <span className="text-2xl font-display font-black tracking-tighter text-white">PDV<span className="text-emerald-light">Pro</span></span>
            </div>
            <p className="font-light max-w-sm leading-relaxed text-sm text-white/60">
              La plateforme e-commerce tout-en-un conçue spécifiquement pour les réalités du commerce en Afrique de l&apos;Ouest.
            </p>
            <div className="flex gap-4 mt-6">
               <a href={get('landing_instagram_url', '#')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-emerald hover:text-emerald transition"><Instagram size={18}/></a>
               <a href={get('landing_facebook_url', '#')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:border-emerald hover:text-emerald transition"><Facebook size={18}/></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white/40 font-mono font-bold mb-6 tracking-widest uppercase text-xs">Produit</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><a href="#features" className="hover:text-emerald-light transition">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-emerald-light transition">Tarifs</a></li>
              <li><Link href="/vendeurs" className="hover:text-emerald-light transition font-bold text-emerald-light">Marketplace</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-light transition">Dashboard Marchand</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/40 font-mono font-bold mb-6 tracking-widest uppercase text-xs">Légal & Support</h4>
            <ul className="space-y-4 text-sm font-light text-white/60">
              <li><Link href="/conditions-utilisation" className="hover:text-emerald-light transition">Conditions d'utilisation</Link></li>
              <li><Link href="/politique-confidentialite" className="hover:text-emerald-light transition">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-emerald-light transition">Mentions légales</Link></li>
              <li><a href={`https://wa.me/${get('landing_whatsapp_support', '221780476393')}`} target="_blank" className="hover:text-emerald-light transition flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald rounded-full animate-pulse"></span>
                Support WhatsApp
              </a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-sm font-light text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} PDV Pro. Tous droits réservés.</p>
          <p>Propulsé par l&apos;innovation Africaine 🌍</p>
        </div>
      </footer>
    </div>
  )
}
