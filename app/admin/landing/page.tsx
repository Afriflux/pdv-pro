import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import LandingAdminClient from './LandingAdminClient'
import { LayoutTemplate } from 'lucide-react'

// ----------------------------------------------------------------
// PAGE ADMIN LANDING — Server Component
// ----------------------------------------------------------------
export default async function AdminLandingPage() {
  // Vérification authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createAdminClient()

  // Vérification rôle super_admin
  const { data: caller } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (caller?.role !== 'super_admin') redirect('/admin')

  // Récupération des paramètres existants
  const keys = [
    'landing_testimonials',
    'landing_faq',
    'landing_cod_price',
    'landing_commission_tiers',
    'landing_withdrawal_min',
    'landing_plan_free_tagline',
    'landing_plan_cod_tagline',
    'landing_cta_title',
    'landing_cta_subtitle',
    'landing_cta_button',
    
    // NOUVEAUX (CMS GLOBAL)
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
    
    // NOUVEAUX (FOOTER & BANNER)
    'landing_instagram_url',
    'landing_facebook_url',
    'landing_whatsapp_support',
    'landing_banner_active',
    'landing_banner_date',
    'landing_banner_text',
    
    // CONTACT PAGE
    'contact_email',
    'contact_phone',
    'contact_address',
    'contact_hours',
    'contact_hero_title',
    'contact_hero_subtitle',
    'contact_form_title',
    'contact_tiktok_url',
    'contact_linkedin_url',
    'contact_maps_url'
  ]

  const { data: configs } = await supabaseAdmin
    .from('PlatformConfig')
    .select('key, value')
    .in('key', keys)

  const configMap: Record<string, string> = {}
  for (const row of (configs || [])) {
    configMap[row.key] = row.value
  }

  interface Testimonial {
    id: string; name: string; city: string
    country_flag: string; business: string
    quote: string; active: boolean
  }
  interface FAQ {
    id: string; question: string; answer: string
    order: number; active: boolean
  }

  // Parses JSON ou fallback defaults
  let testimonials: Testimonial[] = [
    { id: '1', name: 'Mariam D.', business: 'Boutique Cosmétiques', quote: "Avant Yayyam, je perdais facilement 30% de mes commandes parce que les clients ne savaient pas comment payer. Maintenant Wave fait tout. Je dors tranquille.", city: "Dakar, Sénégal", country_flag: "🇸🇳", active: true },
    { id: '2', name: 'Kofi A.', business: 'Vendeur Électronique', quote: "Le COD a tout changé. Mes clients à Abidjan avaient peur de payer d'avance. Maintenant ils commandent sans hésiter.", city: "Abidjan, Côte d'Ivoire", country_flag: "🇨🇮", active: true },
    { id: '3', name: 'Awa B.', business: 'Créatrice de Mode', quote: "L'IA Check360° m'a dit que mes ventes baissaient le mercredi. J'ai lancé une promo ce jour-là. +45% de commandes en une semaine.", city: "Bamako, Mali", country_flag: "🇲🇱", active: true }
  ]
  
  let faq: FAQ[] = [
    { id: 'f1', question: "Comment fonctionne la commission ?", answer: "La commission est dégressive et calculée automatiquement... (Modifiez-moi)", order: 1, active: true },
    { id: 'f2', question: "Peut-on vendre des produits physiques ?", answer: "Oui ! Yayyam supporte nativement le paiement à la livraison (COD)...", order: 2, active: true },
    { id: 'f3', question: "Y a-t-il un abonnement obligatoire ?", answer: "Non, jamais. Yayyam fonctionne à 100% sur un modèle de commission...", order: 3, active: true }
  ]
  
  try { 
    if (configMap.landing_testimonials) {
      const parsed = JSON.parse(configMap.landing_testimonials)
      if (parsed.length > 0) testimonials = parsed
    }
  } catch {}
  
  try { 
    if (configMap.landing_faq) {
      const parsedFn = JSON.parse(configMap.landing_faq)
      if (parsedFn.length > 0) faq = parsedFn
    }
  } catch {}

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full">
      {/* ── EN-TÊTE ULTRA PREMIUM ── */}
      <header className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0A2E23] p-10 md:p-14 shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0F7A60]/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Headless CMS
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Vitrine <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Interactive</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl font-light leading-relaxed">
              Moteur de rendu en temps réel. Chaque modification apportée ici se propage magiquement sur le site public en millisecondes.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl rotate-3 hover:rotate-6 hover:scale-105 transition-all duration-500">
             <LayoutTemplate className="w-10 h-10 text-emerald-400" />
          </div>
        </div>
      </header>

      <LandingAdminClient
        initialTestimonials={testimonials}
        initialFaq={faq}
        initialTarifs={{
          landing_cod_price: configMap.landing_cod_price ?? '',
          landing_commission_tiers: configMap.landing_commission_tiers ?? '',
          landing_withdrawal_min: configMap.landing_withdrawal_min ?? '',
          landing_plan_free_tagline: configMap.landing_plan_free_tagline ?? '',
          landing_plan_cod_tagline: configMap.landing_plan_cod_tagline ?? '',
          landing_cta_title: configMap.landing_cta_title ?? '',
          landing_cta_subtitle: configMap.landing_cta_subtitle ?? '',
          landing_cta_button: configMap.landing_cta_button ?? ''
        }}
        initialGeneral={{
          landing_hero_badge: configMap.landing_hero_badge || '🚀 Launch Week — Commission à 5% pour les 100 premiers vendeurs',
          landing_hero_h1: configMap.landing_hero_h1 || 'Commencez à vendre\naujourd\'hui.\nEncaissez sur Wave/OM.',
          landing_hero_subtitle: configMap.landing_hero_subtitle || 'Yayyam est la seule plateforme qui synchronise votre WhatsApp avec les paiements mobile money locaux. Sans code, sans friction.',
          landing_hero_cta_primary: configMap.landing_hero_cta_primary || 'Lancer ma boutique',
          landing_hero_cta_secondary: configMap.landing_hero_cta_secondary || 'Voir les boutiques actives →',
          landing_problem_supertitle: configMap.landing_problem_supertitle || 'Le Casse-tête',
          landing_problem_title: configMap.landing_problem_title || 'La vente sur WhatsApp est brisée.',
          landing_problem_subtitle: configMap.landing_problem_subtitle || 'Vous perdez des ventes tous les jours à cause d\'un processus chaotique.',
          landing_solution_supertitle: configMap.landing_solution_supertitle || 'La Solution',
          landing_solution_title: configMap.landing_solution_title || 'Passez au niveau supérieur.',
          landing_solution_subtitle: configMap.landing_solution_subtitle || 'Avec Yayyam, centralisez votre activité et offrez une expérience premium à vos clients.',
          landing_features_supertitle: configMap.landing_features_supertitle || 'L\'arsenal complet',
          landing_features_title: configMap.landing_features_title || 'Tout ce dont vous avez besoin pour grandir.',
          landing_sectors_supertitle: configMap.landing_sectors_supertitle || 'Déjà utilisé au Sénégal, en Côte d\'Ivoire et au Mali.',
          landing_sectors_title: configMap.landing_sectors_title || 'Parfait pour tous les business.',
          landing_sectors_subtitle: configMap.landing_sectors_subtitle || 'Peu importe ce que vous vendez, nous gérons le processus de la vitrine jusqu\'à votre poche.',
          landing_telegram_supertitle: configMap.landing_telegram_supertitle || 'EXCLUSIF YAYYAM',
          landing_telegram_title: configMap.landing_telegram_title || 'Vendez l\'accès à vos groupes\nTelegram privés',
          landing_telegram_subtitle: configMap.landing_telegram_subtitle || 'Formations, coaching, contenus exclusifs — créez un produit, liez-le à votre groupe Telegram, et vos clients reçoivent automatiquement leur invitation après paiement.',
          
          // NOUVEAUX DANS LE REBOND DE L'ADMIN
          landing_instagram_url: configMap.landing_instagram_url || '',
          landing_facebook_url: configMap.landing_facebook_url || '',
          landing_whatsapp_support: configMap.landing_whatsapp_support || '221780476393',
          landing_banner_active: configMap.landing_banner_active || 'true',
          landing_banner_date: configMap.landing_banner_date || '2026-04-01T00:00:00Z',
          landing_banner_text: configMap.landing_banner_text || 'Lancement officiel le 1er Avril 2026',
          landing_ticker_text: configMap.landing_ticker_text || '🔒 Paiements sécurisés Wave & Orange Money , 💰 Zéro abonnement — ne payez que sur vos ventes , 🚀 Boutique en ligne en 2 minutes , 📦 Gestion des livraisons intégrée , 🤖 IA marketing incluse , 🇸🇳🇨🇮🇲🇱🇧🇫🇬🇳 Toute l\'Afrique de l\'Ouest',
          
          // CONTACT PAGE
          contact_email: configMap.contact_email || 'contact@yayyam.com',
          contact_phone: configMap.contact_phone || '',
          contact_address: configMap.contact_address || 'Dakar, Sénégal',
          contact_hours: configMap.contact_hours || 'Lun-Sam · 9h-19h (GMT)',
          contact_hero_title: configMap.contact_hero_title || 'On est là pour vous.',
          contact_hero_subtitle: configMap.contact_hero_subtitle || 'Une question, un souci technique, ou juste envie de dire bonjour ? Notre équipe répond en moins de 2h sur WhatsApp.',
          contact_form_title: configMap.contact_form_title || 'Envoyez-nous un message',
          contact_tiktok_url: configMap.contact_tiktok_url || '',
          contact_linkedin_url: configMap.contact_linkedin_url || '',
          contact_maps_url: configMap.contact_maps_url || ''
        }}
      />
    </div>
  )
}
