import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: caller } = await supabaseAdmin.from('User').select('role').eq('id', user.id).single()

    if (caller?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const { roleId, permissions } = await req.json()

    if (!roleId || !permissions) {
      return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('InternalRole')
      .update({ permissions })
      .eq('id', roleId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
