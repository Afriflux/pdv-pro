import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('role, firstName, lastName')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { key } = body

    if (!key) {
      return NextResponse.json({ error: 'La clé (key) est requise' }, { status: 400 })
    }

    const { data: configRow } = await supabaseAdmin
      .from('IntegrationKey')
      .select('value')
      .eq('key', key)
      .single()

    if (!configRow) {
      return NextResponse.json({ error: 'Clé non trouvée en base de données' }, { status: 404 })
    }

    // Journaliser l'accès de type "Reveal"
    await supabaseAdmin
      .from('AdminLog')
      .insert({
        admin_id: user.id,
        action: 'REVEAL_SETTING',
        details: { key, message: `Clé sensible révélée par ${userData.firstName} ${userData.lastName}` } // JSONB
      })

    return NextResponse.json({ value: configRow.value })

  } catch (error: unknown) {
    console.error('[API REVEAL]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
