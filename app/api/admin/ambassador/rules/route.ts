import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ----------------------------------------------------------------
// POST /api/admin/ambassador/rules
// Sauvegarde les règles du programme ambassadeur dans PlatformConfig.
// Protégé : super_admin ou gestionnaire.
// Body : { config: Record<string, string> }
// ----------------------------------------------------------------

const ALLOWED_AMBASSADOR_KEYS = new Set([
  'ambassador_commission_rate',
  'ambassador_validity_months',
  'ambassador_max_referrals',
  'ambassador_program_active',
])

export async function POST(req: NextRequest) {
  try {
    // Vérification auth + rôle (super_admin ou gestionnaire)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: caller } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (!caller || !['super_admin', 'gestionnaire'].includes(caller.role)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const body = await req.json() as { config: Record<string, string> }
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Body invalide.' }, { status: 400 })
    }

    // Filtrer uniquement les clés ambassadeur autorisées
    const upserts = Object.entries(config)
      .filter(([key]) => ALLOWED_AMBASSADOR_KEYS.has(key))
      .map(([key, value]) => ({ key, value: String(value) }))

    if (upserts.length === 0) {
      return NextResponse.json({ error: 'Aucune clé valide.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert(upserts, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Ambassador Rules] Erreur:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
