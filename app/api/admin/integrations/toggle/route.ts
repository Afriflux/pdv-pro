import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Vérification auth + rôle super_admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: caller } = await supabaseAdmin
      .from('User')
      .select('name, role')
      .eq('id', user.id)
      .single<{ name: string, role: string }>()

    if (caller?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé — super_admin requis.' }, { status: 403 })
    }

    const { key, value } = await req.json() as { key: string, value: string }

    // Whitelist: seules les clés *_ENABLED sont autorisées
    if (!key || !key.endsWith('_ENABLED')) {
      return NextResponse.json({ error: 'Clé de toggle non autorisée.' }, { status: 400 })
    }

    if (value !== 'true' && value !== 'false') {
      return NextResponse.json({ error: 'Valeur invalide.' }, { status: 400 })
    }

    const authorName = caller?.name || user.email || 'Admin'

    const { error } = await supabaseAdmin
      .from('IntegrationKey')
      .upsert({ key, value, updated_by: authorName }, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true, key, enabled: value === 'true' })
  } catch (error: unknown) {
    console.error('[Admin Integrations Toggle] Erreur:', error)
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 })
  }
}
