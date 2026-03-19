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
import { LandingNav } from '@/components/landing/LandingNav'
import { HeroStats } from './components/HeroStats'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'PDV Pro — Vendez en ligne en Afrique de l\'Ouest',
  description: 'Créez votre boutique en ligne en 10 minutes. Zéro abonnement, zéro frais fixe. Paiements Wave, Orange Money et Mobile Money intégrés. Commission dégressive 7% → 4%.',
  openGraph: {
    title: 'PDV Pro — Votre boutique e-commerce en 10 minutes',
    description: 'Vendez sur WhatsApp, Instagram et Facebook avec une vraie boutique. Paiements Mobile Money intégrés.',
    url: 'https://pdvpro.com',
    siteName: 'PDV Pro',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
    locale: 'fr_FR',
    type: 'website',
  }
}

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
      r: "La commission est dégressive et calculée automatiquement sur votre chiffre d'affaires mensuel : de 7% pour les débutants à seulement 4% pour les gros volumes. PDV Pro absorbe tous les frais techniques (passerelles et retraits), vous recevez votre net garanti."
    },
    {
      q: "Peut-on vendre des produits physiques ?",
      r: "Oui ! PDV Pro supporte nativement le paiement à la livraison (COD) pour les vendeurs de produits physiques. Le COD est soumis à une commission fixe de 5%. Aucun abonnement requis — vous activez le COD depuis vos paramètres et c'est tout."
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
  // Chargement config dynamique depuis PlatformConfig
  const supabaseAdmin = createAdminClient()
  const allowedKeys = [
    'landing_hero_badge',
    'landing_hero_h1',
    'landing_hero_subtitle',
    'landing_hero_cta_primary',
    'landing_cod_price',
    'landing_cta_title',
    'landing_cta_button',
    'landing_testimonials',
    'landing_faq',
    'landing_instagram_url',
    'landing_facebook_url',
    'landing_whatsapp_support'
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
    : ['Votre boutique pro.', 'Vos premiers paiements.', 'Ce soir.']

  return (
    <div className="bg-cream min-h-screen text-ink font-body selection:bg-emerald/20 selection:text-ink">
      
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
            <LandingNav />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 border border-emerald/20 text-emerald-rich font-mono text-xs tracking-widest uppercase mb-4 animate-in fade-in slide-in-from-bottom-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
              </span>
              {get('landing_hero_badge', "Lancement Sénégal · Côte d'Ivoire · Mali")}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-ink leading-[1.1]">
              {h1L1}<br />
              {h1L2}<br />
              <span className="text-emerald italic">{h1L3}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate font-light max-w-3xl mx-auto leading-relaxed">
              {get('landing_hero_subtitle', 'PDV Pro est la seule plateforme conçue pour le commerce mobile en Afrique de l\'Ouest. Wave, Orange Money — tout est intégré. Zéro frais fixe, vous ne payez qu\'une commission sur vos ventes.')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-emerald hover:bg-emerald-rich text-white font-semibold rounded-full text-lg transition shadow-xl shadow-emerald/20 flex items-center justify-center gap-2">
                {get('landing_hero_cta_primary', 'Créer ma boutique gratuite')} <ArrowRight size={20} />
              </Link>
              <Link href="/vendeurs" className="w-full sm:w-auto px-8 py-4 bg-white border border-emerald text-emerald hover:bg-emerald/5 rounded-full font-medium text-lg transition flex items-center justify-center shadow-sm">
                Voir les boutiques actives →
              </Link>
            </div>
            
            <HeroStats />
          </div>
        </section>

        {/* 2. LE PROBLÈME (Douleurs vendeurs WhatsApp) */}
        <section className="py-24 bg-ink border-y border-line/10 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-4 py-1.5 font-mono tracking-widest uppercase text-xs mb-6 font-bold shadow-sm">Le Casse-tête</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-white">La vente sur WhatsApp est brisée.</h2>
              <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">Vous perdez des ventes tous les jours à cause d'un processus chaotique.</p>
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
                <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block font-bold">La Solution</span>
                <h2 className="text-4xl md:text-6xl font-display font-black mb-6 text-ink leading-tight">Passez au niveau <span className="text-emerald">supérieur</span>.</h2>
                <p className="text-xl text-slate font-light mb-16 leading-relaxed">Avec PDV Pro, centralisez votre activité et offrez une expérience <span className="font-medium text-emerald bg-emerald/10 px-2 py-0.5 rounded-md">premium</span> à vos clients.</p>
                
                <div className="space-y-0 relative before:absolute before:inset-y-4 before:left-[23px] before:w-[2px] before:bg-emerald/20">
                  {[
                    { num: '01', title: 'En 2 minutes : votre boutique est live', desc: "Choisissez pdvpro.com/votreboutique, ajoutez votre logo. Votre vitrine professionnelle est accessible immédiatement." },
                    { num: '02', title: 'Ajoutez vos produits, générez vos liens', desc: "Photos, prix, variantes, stock. Chaque produit a son lien de paiement direct à partager sur WhatsApp ou Instagram." },
                    { num: '03', title: 'Encaissez. L\'argent arrive dans votre wallet.', desc: "Wave, Orange Money ou carte bancaire. Dès confirmation, les fonds sont dans votre wallet PDV Pro. Retrait en 1 clic dès 5 000 FCFA." },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 relative group pb-14 last:pb-0">
                      <div className="shrink-0 w-12 h-12 bg-white border-4 border-pearl text-emerald font-black flex items-center justify-center rounded-full shadow-md relative z-10 group-hover:bg-emerald group-hover:text-white transition-colors duration-300">
                        {step.num}
                      </div>
                      <div className="pt-2">
                        <h3 className="text-2xl font-display font-black mb-3 text-ink group-hover:text-emerald transition-colors">{step.title}</h3>
                        <p className="text-slate leading-relaxed font-light text-lg">{step.desc}</p>
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
              <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block font-bold">L'arsenal complet</span>
              <h2 className="text-4xl md:text-6xl font-display font-black mb-6 tracking-tight text-ink">
                Tout ce dont vous avez besoin pour <span className="text-emerald relative inline-block">grandir.<span className="absolute -bottom-2 left-0 w-full h-3 bg-gold/30 -rotate-2"></span></span>
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
                      { icon: <Zap size={28} />, title: 'Mobile Money', desc: 'Intégration d\'origine avec Wave et Orange Money (Sénégal/Côte d\'Ivoire) via notre partenaire agréé.' },
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
                      { icon: <Sparkles size={28} />, title: 'IA Check360°', desc: 'Votre assistant IA analyse vos ventes chaque semaine et vous dit exactement quoi améliorer pour vendre plus.' },
                      { icon: <MessageCircle size={28} />, title: 'Groupes Telegram', desc: 'Vendez l\'accès à des groupes privés. L\'invitation est envoyée automatiquement après chaque paiement.' },
                      { icon: <Users size={28} />, title: 'Ambassadeurs', desc: 'Recrutez des ambassadeurs qui vendent pour vous. Commissions automatiques, suivi en direct.' },
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
                <p className="font-bold text-gold uppercase tracking-widest text-sm mb-4">Déjà utilisé au Sénégal, en Côte d'Ivoire et au Mali.</p>
                <h2 className="text-4xl md:text-5xl font-display font-black mb-6 text-white">Parfait pour tous les business.</h2>
                <p className="text-xl text-cream/70 font-light max-w-2xl mx-auto">Peu importe ce que vous vendez, nous gérons le processus de la vitrine jusqu'à votre poche.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonialData.map((test, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-line relative shadow-sm hover:border-emerald/30 transition flex flex-col">
                  {/* Decorative quote */}
                  <div className="font-display text-9xl text-emerald/5 absolute top-4 right-8 leading-none select-none">"</div>
                  
                  <div className="flex gap-1 mb-6">
                    {[1,2,3,4,5].map(s => <StarIcon key={s} />)}
                  </div>
                  <p className="text-charcoal font-light mb-8 relative z-10 text-lg leading-relaxed italic flex-1">"{test.quote}"</p>
                  
                  <div className="bg-cream border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-slate w-max mb-6">
                    {test.badge}
                  </div>

                  <div className="flex items-center gap-4 border-t border-line pt-6 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-emerald/10 text-emerald font-display font-bold flex items-center justify-center text-lg shrink-0">
                      {test.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-ink">{test.name}</h4>
                      <p className="text-slate text-sm font-body">{test.biz}</p>
                    </div>
                  </div>
                </div>
              ))}
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
                    <p className="text-sm text-cream/90 leading-relaxed">Activé par défaut ou si votre chiffre d'affaires mensuel (N-1) est inférieur à 100 000 FCFA. Une commission unique de 7% s'applique. Zéro abonnement.</p>
                  </div>
                  <div className="text-center pb-6 border-b border-line mb-6">
                    <h3 className="font-display font-black text-2xl text-ink">Débutant</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">0 - 100K FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-ink">7%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald text-xl mt-2">93%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-slate">Inclus</div>
                  </div>
                  </div>

                {/* Card 2 */}
                <div className="w-64 md:w-auto bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative group/tooltip overflow-hidden cursor-help">
                  <div className="absolute inset-0 bg-ink/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-gold mb-3 text-lg">Palier Actif</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Dès que vous dépassez les 100 000 FCFA de ventes le mois précédent, le système abaisse automatiquement votre commission à 6%. Vous gagnez plus.</p>
                  </div>
                  <div className="text-center pb-6 border-b border-line mb-6">
                    <h3 className="font-display font-black text-2xl text-ink">Actif</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">100K - 500K FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-ink">6%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald text-xl mt-2">94%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-slate">Inclus</div>
                  </div>
                  </div>

                {/* Card 3 */}
                <div className="w-64 md:w-auto bg-white rounded-3xl p-6 border border-line flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative group/tooltip overflow-hidden cursor-help">
                  <div className="absolute inset-0 bg-ink/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-gold mb-3 text-lg">Palier Pro</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Réservé aux e-commerçants confirmés avec plus de 500 000 FCFA de volumes mensuels (N-1). Vous passez à 5% et gardez 95% du chiffre d'affaires net.</p>
                  </div>
                  <div className="text-center pb-6 border-b border-line mb-6">
                    <h3 className="font-display font-black text-2xl text-ink">Pro</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">500K - 1M FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-ink">5%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald text-xl mt-2">95%</div>
                    <div className="h-12 flex items-center justify-center text-sm font-medium text-slate">Inclus</div>
                  </div>
                  </div>

                {/* Card 4 (Expert) */}
                <div className="w-64 md:w-auto bg-pearl rounded-3xl border-2 border-emerald-rich shadow-lg p-6 flex flex-col transform md:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald/20 transition-all duration-300 relative group/tooltip overflow-hidden z-20 cursor-help">
                  <div className="absolute inset-0 bg-emerald-deep/95 backdrop-blur-md text-white p-6 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 delay-300 z-50 flex flex-col justify-center text-center pointer-events-none">
                    <h4 className="font-bold text-emerald-light mb-3 text-lg">Palier Expert</h4>
                    <p className="text-sm text-cream/90 leading-relaxed">Le grade d'élite. En dépassant 1 Million FCFA mensuels, vous obtenez notre meilleur taux de 4%. Frais Wave/Orange Money inclus. Zéro plafond de facturation.</p>
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald text-white text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full shadow-md whitespace-nowrap pointer-events-none z-10">
                    Meilleur taux (Populaire)
                  </div>
                  <div className="text-center pb-6 border-b border-emerald/20 mb-6 relative z-0">
                    <h3 className="font-display font-black text-2xl text-emerald-rich">Expert</h3>
                  </div>
                  <div className="space-y-6 flex-1 text-center relative z-0">
                    <div className="h-12 flex items-center justify-center font-mono text-sm font-bold text-charcoal">+ 1M FCFA</div>
                    <div className="h-12 flex items-center justify-center text-5xl font-display font-black text-emerald scale-110">4%</div>
                    <div className="h-12 flex items-center justify-center font-bold text-emerald-rich text-2xl mt-2 bg-emerald/10 rounded-full scale-110 px-4">96%</div>
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

            <PricingCalculator />

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

        {/* 9. CTA FINAL */}
        <section className="py-32 px-6 bg-white relative overflow-hidden border-t border-line">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-black mb-6 tracking-tight text-ink">
              {get('landing_cta_title', 'Votre boutique peut être live ce soir.')}
            </h2>
            <div className="text-xl text-slate font-light mb-12 max-w-2xl mx-auto space-y-2">
              <p>2 minutes pour créer votre compte.</p>
              <p>0 F pour commencer.</p>
              <p className="font-medium text-emerald">Les premiers paiements arrivent dès aujourd&apos;hui.</p>
            </div>
            <Link href="/register" className="inline-block px-14 py-5 bg-emerald text-white rounded-xl font-bold text-lg hover:bg-emerald-rich transition shadow-xl shadow-emerald/20 mb-8">
              {get('landing_cta_button', "Créer ma boutique maintenant — C'est gratuit")}
            </Link>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald" size={18} /> Aucune carte bancaire requise
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald" size={18} /> Fonds disponibles immédiatement
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald" size={18} /> Support WhatsApp 7j/7
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-emerald-deep border-t border-emerald-deep py-16 px-6 relative">
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

function StarIcon() {
  return (
    <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}
