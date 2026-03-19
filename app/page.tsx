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
  Users
} from 'lucide-react'
import PricingCalculator from './PricingCalculator'
import { LandingNav } from '@/components/landing/LandingNav'
import { HeroStats } from './components/HeroStats'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'PDV Pro — Vendez en ligne en Afrique de l\'Ouest',
  description: 'Créez votre boutique en ligne en 10 minutes. Zéro abonnement avec Gratuit. Payez via Wave, Orange Money et Mobile Money. PDV Pro, la plateforme e-commerce africaine.',
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
      r: "Oui ! PDV Pro est la seule plateforme en Afrique de l'Ouest qui supporte nativement le COD (paiement à la livraison) avec une option dédiée à 9 900 FCFA/mois qui débloque cette fonctionnalité et supprime la commission sur ces ventes."
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
      r: "Non. Le plan de base est 100% gratuit, sans abonnement caché. Nous ne gagnons de l'argent que quand vous en gagnez."
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
              {get('landing_hero_subtitle', 'PDV Pro est la seule plateforme conçue pour le commerce mobile en Afrique de l\'Ouest. Wave, Orange Money, COD — tout est intégré. Zéro abonnement pour commencer.')}
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
        <section className="py-24 bg-pearl px-6 border-y border-line">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-ink">La vente sur WhatsApp est brisée.</h2>
              <p className="text-xl text-slate font-light">Vous perdez des ventes tous les jours à cause d'un processus chaotique.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <MessageCircle size={32} />, title: 'Réponses manuelles infinies', desc: "Vous passez 3h par jour à répondre \"C'est combien ?\" sur WhatsApp. Chaque réponse en retard = une vente perdue." },
                { icon: <Smartphone size={32} />, title: 'Pas de vitrine permanente', desc: "Un statut WhatsApp disparaît en 24h. Vos clients ne savent pas ce que vous vendez." },
                { icon: <AlertCircle size={32} />, title: 'Paiements non sécurisés', desc: "Captures d'écran falsifiées, virements qui n'arrivent pas, clients qui disparaissent. Vous portez tous les risques." },
                { icon: <ChartBar size={32} />, title: 'Zéro visibilité sur vos chiffres', desc: "Vous ne savez pas quels produits se vendent le mieux, ni combien vous avez gagné ce mois-ci." },
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-line shadow-sm relative overflow-hidden group hover:shadow-md hover:border-emerald-border transition">
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-line group-hover:bg-red-400 transition-colors"></div>
                  <div className="flex justify-between items-start mb-6 align-top">
                    <div className="text-red-400 group-hover:text-red-500 transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-mono text-emerald/40 text-sm tracking-widest font-bold">0{i+1}</span>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-ink">{item.title}</h3>
                  <p className="text-slate leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. LA SOLUTION (3 Étapes) */}
        <section className="py-24 px-6 bg-white relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-ink">Passez au niveau supérieur.</h2>
                <p className="text-xl text-slate font-light mb-12">Avec PDV Pro, centralisez votre activité et offrez une expérience <span className="text-emerald italic font-medium">premium</span> à vos clients.</p>
                
                <div className="space-y-12">
                  {[
                    { num: '01', title: 'En 2 minutes : votre boutique est live', desc: "Choisissez pdvpro.com/votreboutique, ajoutez votre logo. Votre vitrine professionnelle est accessible immédiatement." },
                    { num: '02', title: 'Ajoutez vos produits, générez vos liens', desc: "Photos, prix, variantes, stock. Chaque produit a son lien de paiement direct à partager sur WhatsApp ou Instagram." },
                    { num: '03', title: 'Encaissez. L\'argent arrive dans votre wallet.', desc: "Wave, Orange Money ou paiement à la livraison. Dès confirmation, les fonds sont dans votre wallet PDV Pro. Retrait en 1 clic dès 5 000 FCFA." },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="shrink-0 w-12 h-12 bg-emerald/10 border border-emerald/20 text-emerald font-bold flex items-center justify-center rounded-full shadow-sm">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold mb-2 text-ink">{step.title}</h3>
                        <p className="text-slate leading-relaxed font-light">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                {/* Mockup dashboard (Clair) */}
                <div className="bg-cream border border-line rounded-2xl p-6 shadow-xl relative aspect-[4/5] overflow-hidden flex flex-col">
                   {/* Barre URL */}
                   <div className="w-full flex justify-between items-center mb-8 bg-white py-3 px-4 rounded-lg border border-line shadow-sm">
                     <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <div className="w-3 h-3 rounded-full bg-gold"></div>
                       <div className="w-3 h-3 rounded-full bg-emerald-light"></div>
                     </div>
                     <div className="h-4 w-32 bg-pearl border border-line rounded-full"></div>
                     <div className="w-4 h-4 text-dust"><Globe size={16} /></div>
                   </div>
                   
                   {/* Badge IA Check360° */}
                   <div className="absolute top-20 right-4 bg-white px-4 py-2 rounded-xl shadow-lg border border-emerald/20 flex items-center gap-2 animate-bounce">
                     <div className="bg-emerald/10 p-1 rounded-full"><Sparkles className="text-emerald" size={16} /></div>
                     <div>
                       <span className="block text-[10px] font-mono text-slate uppercase tracking-widest leading-none">IA Check360°</span>
                       <span className="block text-xs font-bold text-emerald">2 opportunités détectées →</span>
                     </div>
                   </div>
                   
                   {/* Stat cards internes */}
                   <div className="w-full bg-white border border-line rounded-xl mb-6 mt-6 relative p-6 flex flex-col justify-center shadow-sm items-center text-center flex-1">
                     <span className="text-xs font-mono text-slate uppercase tracking-widest mb-2">Revenus du jour</span>
                     <span className="text-5xl font-display text-emerald font-bold">145 000 F</span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col items-center justify-center">
                       <span className="text-[10px] font-mono text-slate uppercase tracking-widest mb-1">Visites</span>
                       <span className="text-2xl font-display text-turquoise font-bold">342</span>
                     </div>
                     <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-col items-center justify-center align-bottom h-full w-full relative min-h-[80px]">
                       <div className="flex gap-1 items-end h-[32px] absolute bottom-4">
                         <div className="w-2 h-3 bg-pearl rounded-t-sm"></div>
                         <div className="w-2 h-5 bg-emerald/40 rounded-t-sm"></div>
                         <div className="w-2 h-8 bg-emerald rounded-t-sm"></div>
                         <div className="w-2 h-4 bg-pearl rounded-t-sm"></div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="space-y-3 mt-auto relative z-10">
                     <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-line shadow-sm hover:border-turquoise/30 transition-colors">
                        <div className="bg-turquoise/10 text-turquoise px-2 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider">PAYÉ</div>
                        <div className="h-1.5 w-1/3 bg-pearl rounded-full"></div>
                        <div className="ml-auto text-turquoise font-mono font-bold text-sm">+15 000 F</div>
                     </div>
                     <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-line shadow-sm hover:border-gold/30 transition-colors">
                        <div className="bg-gold/10 text-gold px-2 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider">LIVRAISON</div>
                        <div className="h-1.5 w-1/2 bg-pearl rounded-full"></div>
                        <div className="ml-auto text-gold font-mono font-bold text-sm">+2 500 F</div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FONCTIONNALITÉS CLÉS */}
        <section id="features" className="py-24 px-6 bg-cream border-y border-line">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block">L'arsenal complet</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 tracking-tight text-ink">
                Tout ce dont vous avez besoin pour <span className="text-emerald italic">grandir</span>.
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-line rounded-2xl overflow-hidden bg-white shadow-sm">
              {[
                { icon: <Smartphone size={24} />, title: 'Boutique Optimisée Mobile', desc: '98% de vos acheteurs sont sur smartphone. Notre design charge en 1 seconde et convertit mieux.' },
                { icon: <Zap size={24} />, title: 'Paiements Mobile Money', desc: 'Intégration d\'origine avec Wave et Orange Money (Sénégal/Côte d\'Ivoire) via notre partenaire agréé.' },
                { icon: <Store size={24} />, title: 'Gestion des Livraisons', desc: 'Configurez vos zones tarifaires. Le client paie le produit + la livraison en un seul clic.' },
                { icon: <Shield size={24} />, title: 'Automatisations WhatsApp', desc: 'Vos clients reçoivent des confirmations de commande et de suivi directement sur WhatsApp.' },
                { icon: <ChartBar size={24} />, title: 'Dashboard Analytics', desc: 'Suivez vos vues, vos ventes, votre taux de conversion et l\'origine de vos clients en temps réel.' },
                { icon: <Globe size={24} />, title: 'Outils Marketing', desc: 'Codes promos, Vente Flash, Cross-selling et Programme d\'affiliation pour vos ambassadeurs.' },
                { icon: <Sparkles size={24} />, title: 'IA Check360°', desc: 'Votre assistant IA analyse vos ventes chaque semaine et vous dit exactement quoi améliorer pour vendre plus.' },
                { icon: <MessageCircle size={24} />, title: 'Communautés Telegram', desc: 'Vendez l\'accès à des groupes privés Telegram. L\'invitation est envoyée automatiquement après chaque paiement.' },
                { icon: <Users size={24} />, title: 'Programme Ambassadeurs', desc: 'Recrutez des ambassadeurs qui vendent pour vous. Commissions automatiques, suivi en temps réel.' },
              ].map((feat, i) => (
                <div key={i} className="group p-8 bg-pearl border border-line rounded-[2rem] hover:bg-white hover:border-emerald/20 hover:shadow-xl hover:shadow-emerald/5 transition-all duration-300">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-line group-hover:border-emerald/20 text-emerald">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-display font-black text-ink mb-3">{feat.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. TEMPLATES & SECTEURS */}
        <section className="py-24 px-6 bg-white overflow-hidden border-b border-line">
          <div className="max-w-7xl mx-auto">
             <div className="mb-12 max-w-2xl">
                <p className="font-bold text-emerald uppercase tracking-widest text-sm mb-4">Déjà utilisé par des vendeurs au Sénégal, en Côte d'Ivoire et au Mali.</p>
                <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-ink">Parfait pour tous les business.</h2>
                <p className="text-lg text-slate font-light">Peu importe ce que vous vendez, nous gérons le processus de la vitrine jusqu'à votre poche.</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
               {['Prêt-à-porter', 'Cosmétiques', 'Électronique', 'Alimentation', 'Services (RDV)', 'Restauration', 'Art & Déco', 'Produits Digitaux', 'B2B & Gros', 'Santé & Bien-être'].map((tag, i) => (
                 <div key={i} className="px-4 py-4 rounded-xl bg-white border border-line text-center font-mono text-xs font-bold tracking-wider text-dust hover:border-emerald/30 hover:text-emerald hover:shadow-md transition cursor-default">
                   {tag.toUpperCase()}
                 </div>
               ))}
             </div>

             <div className="text-center md:text-left">
               <Link href="/vendeurs" className="inline-flex items-center text-emerald font-bold hover:text-emerald-rich transition gap-1 group text-lg">
                 Voir les boutiques actives <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
            <div className="text-center mb-16">
              <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block">Tarification</span>
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4 text-ink">Un modèle clair.</h2>
              <p className="text-xl text-slate font-light">Commencez gratuitement, payez moins quand vous grossissez.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-10 px-4">
              {/* Plan Gratuit */}
              <div className="bg-white border border-line rounded-[2rem] p-8 xl:p-12 transition-all duration-500 flex flex-col hover:border-emerald/30 hover:shadow-2xl hover:shadow-emerald/5 hover:-translate-y-2 relative group overflow-hidden">
                <div className="absolute -right-12 -top-12 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500">
                  <Store size={240} className="text-emerald" />
                </div>
                <div className="relative z-10 flex-1 flex flex-col">
                  <h3 className="text-3xl font-display font-black text-ink mb-3 group-hover:text-emerald transition-colors">Plan Gratuit</h3>
                  <p className="text-slate font-light mb-8 min-h-[48px] leading-relaxed italic">
                    "Démarrez sans dépenser un franc. PDV Pro ne gagne que quand vous vendez."
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-8 pb-8 relative">
                    <span className="text-6xl font-display font-black text-ink tracking-tight">0</span>
                    <span className="text-xl text-slate font-mono font-medium">F/mois</span>
                    <div className="absolute bottom-0 left-0 w-12 h-1 bg-emerald/20 rounded-full group-hover:w-full transition-all duration-500"></div>
                  </div>
                  
                  <div className="space-y-5 mb-10 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/10 rounded-full p-1"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-ink font-bold">Commission dégressive : 7% → 4%</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/10 rounded-full p-1"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-slate italic text-sm">PDV Pro absorbe tous les frais passerelles & retraits</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/10 rounded-full p-1"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-slate">Paiements Wave, Orange Money, Carte Bancaire</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/10 rounded-full p-1"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-slate">Fonds disponibles <strong>immédiatement</strong></span>
                    </div>
                  </div>
                  
                  <Link href="/register" className="block w-full text-center py-4 bg-pearl border border-line hover:border-emerald hover:bg-emerald hover:text-white text-charcoal font-bold rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md">
                    Démarrer gratuitement
                  </Link>
                </div>
              </div>

              {/* Option COD */}
              <div className="bg-white rounded-[2rem] p-8 xl:p-12 relative shadow-2xl shadow-emerald/10 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald/20 group">
                <div className="absolute inset-0 border-2 border-emerald rounded-[2rem] pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-transparent rounded-[2rem] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-emerald to-emerald-rich text-white font-mono font-bold text-[10px] uppercase tracking-widest py-2 px-5 rounded-full shadow-lg shadow-emerald/30 border border-emerald-light/30">
                  <span className="flex items-center gap-1.5"><Zap size={12} /> Booster de ventes</span>
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <h3 className="text-3xl font-display font-black text-ink mb-3 group-hover:text-emerald transition-colors">Option COD</h3>
                  <p className="text-slate font-light mb-8 min-h-[48px] leading-relaxed italic">
                    "Rassurez vos clients avec le paiement à la livraison."
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-8 pb-8 relative">
                    <span className="text-6xl font-display font-black text-emerald tracking-tight drop-shadow-sm">{get('landing_cod_price', '9 900')}</span>
                    <span className="text-xl text-slate font-mono font-medium">F/mois</span>
                    <div className="absolute bottom-0 left-0 w-12 h-1 bg-emerald rounded-full group-hover:w-full transition-all duration-500"></div>
                  </div>
                  
                  <div className="space-y-5 mb-10 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/20 rounded-full p-1 shadow-sm"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-ink font-bold">0% de commission sur les ventes COD</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/20 rounded-full p-1 shadow-sm"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-ink">Paiement à la livraison activé sur vos pages</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/20 rounded-full p-1 shadow-sm"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-ink italic text-sm">Frais achat supportés par l&apos;acheteur</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-emerald/20 rounded-full p-1 shadow-sm"><CheckCircle2 className="text-emerald" size={16}/></div>
                      <span className="text-ink">Fonds disponibles après confirmation livraison</span>
                    </div>
                  </div>
                  
                  <Link href="/register?plan=cod" className="block w-full text-center py-4 bg-emerald hover:bg-emerald-rich text-white font-bold rounded-2xl shadow-xl shadow-emerald/20 transition-all duration-300 transform group-hover:scale-[1.02]">
                    Prendre l&apos;Option COD
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-center text-slate max-w-2xl mx-auto mb-16 bg-white py-4 px-6 rounded-2xl border border-line shadow-sm">
              <span className="mr-2">💡</span> L'option COD se combine avec le plan Gratuit. Vos ventes en ligne restent à 7%→4%, vos ventes à la livraison à 0%.
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
              <p className="font-medium text-emerald">Les premiers paiements arrivent dès aujourd'hui.</p>
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
              La plateforme e-commerce tout-en-un conçue spécifiquement pour les réalités du commerce en Afrique de l'Ouest.
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
              <li><a href={`https://wa.me/${get('landing_whatsapp_support', '221770000000')}`} target="_blank" className="hover:text-emerald-light transition flex items-center gap-2">
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
