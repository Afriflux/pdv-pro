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
    'landing_cta_button'
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

  // Parses JSON ou fallback vide
  let testimonials: Testimonial[] = []
  let faq: FAQ[] = []
  
  try { if (configMap.landing_testimonials) testimonials = JSON.parse(configMap.landing_testimonials) } catch {}
  try { if (configMap.landing_faq) faq = JSON.parse(configMap.landing_faq) } catch {}

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* ── EN-TÊTE ── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-[#0F7A60]/10 text-[#0F7A60]">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Gestion de la Landing Page</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Gérez le contenu dynamique de la page d&apos;accueil, les témoignages, les FAQ et les tarifs.
        </p>
      </header>

      <LandingAdminClient
        initialTestimonials={testimonials}
        initialFaq={faq}
        initialCodPrice={configMap.landing_cod_price ?? ''}
        initialCommissionTiers={configMap.landing_commission_tiers ?? ''}
        initialWithdrawalMin={configMap.landing_withdrawal_min ?? ''}
        initialPlanFreeTagline={configMap.landing_plan_free_tagline ?? ''}
        initialPlanCodTagline={configMap.landing_plan_cod_tagline ?? ''}
        initialCtaTitle={configMap.landing_cta_title ?? ''}
        initialCtaSubtitle={configMap.landing_cta_subtitle ?? ''}
        initialCtaButton={configMap.landing_cta_button ?? ''}
      />
    </div>
  )
}
