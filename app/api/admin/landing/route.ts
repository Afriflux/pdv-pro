import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_KEYS = new Set([
  'landing_testimonials',
  'landing_faq',
  'landing_hero_cta_primary',
  'landing_hero_cta_secondary',
  'landing_ticker_text',
  'landing_banner_text',
  'landing_banner_date',
  'landing_banner_active',
  'landing_cod_price',
  'landing_abonnement_price',
  'landing_instagram_url',
  'landing_facebook_url',
  'landing_whatsapp_support'
])

export async function POST(req: NextRequest) {
  try {
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

    const upserts = Object.entries(config)
      .filter(([key]) => ALLOWED_KEYS.has(key))
      .map(([key, value]) => ({ key, value: String(value) }))

    if (upserts.length === 0) {
      return NextResponse.json({ error: 'Aucune clé valide à sauvegarder.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert(upserts, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {

    console.error('[Admin Landing POST] Erreur:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
