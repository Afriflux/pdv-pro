import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()

    // Enregistrement en base dans PlatformConfig
    const { error: upsertError } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert(
        { 
          key: 'AI_ROUTING_PREFS', 
          value: JSON.stringify(body),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      )

    if (upsertError) throw upsertError

    return NextResponse.json({ success: true, message: 'Priorités enregistrées avec succès.' })

  } catch (error: unknown) {
    console.error('[API AI ROUTING ERROR]', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Erreur interne' }, { status: 500 })
  }
}
