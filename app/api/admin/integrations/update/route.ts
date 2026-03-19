import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── POST /api/admin/integrations/update ─────────────────────────────────
// Upsert une clé API dans PlatformConfig.
// Protégé : super_admin uniquement.
// Body : { key: string, value: string }
// ─────────────────────────────────────────────────────────────────────────

// Clés autorisées (whitelist de sécurité)
const ALLOWED_KEYS = new Set([
  'ANTHROPIC_API_KEY',
  'WAVE_API_KEY',
  'WAVE_API_SECRET',
  'ORANGE_MONEY_API_KEY',
  'ORANGE_MONEY_MERCHANT_KEY',
  'CINETPAY_API_KEY',
  'CINETPAY_SITE_ID',
  'TELEGRAM_BOT_TOKEN',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
])

interface UpdateBody {
  key:   string
  value: string
}

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
      return NextResponse.json({ error: 'Accès refusé — super_admin requis.' }, { status: 403 })
    }

    const body = await req.json() as UpdateBody
    const { key, value } = body

    if (!key || !value?.trim()) {
      return NextResponse.json({ error: 'Clé et valeur obligatoires.' }, { status: 400 })
    }

    // Whitelist : refuser toute clé non autorisée
    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: `Clé non autorisée : "${key}".` }, { status: 400 })
    }

    // Upsert dans PlatformConfig
    const { error } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert({ key, value: value.trim() }, { onConflict: 'key' })

    if (error) throw error

    console.log(`[Admin Integrations] Clé mise à jour : ${key} par ${user.id}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Admin Integrations Update] Erreur:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
