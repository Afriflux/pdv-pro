import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ----------------------------------------------------------------
// POST /api/admin/settings/platform
// Upsert les clés de configuration dans la table PlatformConfig.
// Protégé : super_admin uniquement.
// Body : { config: Record<string, string> }
// ----------------------------------------------------------------

const ALLOWED_KEYS = new Set([
  // Existants
  'platform_name',
  'support_email',
  'support_whatsapp',
  'app_url',
  // Branding
  'landing_hero_badge',
  'landing_hero_h1',
  'landing_hero_subtitle',
  'landing_hero_cta_primary',
  'landing_hero_cta_secondary',
  // Contacts & Réseaux sociaux
  'landing_whatsapp_support',
  'landing_instagram_url',
  'landing_facebook_url',
  'landing_tiktok_url',
  // Tarifs
  'landing_cod_price',
  'landing_commission_tiers',
  'landing_withdrawal_min',
  'landing_plan_free_tagline',
  'landing_plan_cod_tagline',
  // CTA final
  'landing_cta_title',
  'landing_cta_subtitle',
  'landing_cta_button',
  // Marchés
  'landing_markets',
])

export async function POST(req: NextRequest) {
  try {
    // Vérification auth + rôle super_admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: caller } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (caller?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const body = await req.json() as { config: Record<string, string> }
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Body invalide.' }, { status: 400 })
    }

    // Filtrer uniquement les clés autorisées (sécurité)
    const upserts = Object.entries(config)
      .filter(([key]) => ALLOWED_KEYS.has(key))
      .map(([key, value]) => ({ key, value: String(value) }))

    if (upserts.length === 0) {
      return NextResponse.json({ error: 'Aucune clé valide à sauvegarder.' }, { status: 400 })
    }

    // Upsert dans PlatformConfig (clé = PK)
    const { error } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert(upserts, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {

    console.error('[Admin Settings Platform] Erreur:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
