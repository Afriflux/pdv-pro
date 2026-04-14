import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: userProfile } = await supabaseAdmin.from('User').select('role').eq('id', user.id).single()

    if (userProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { updates } = await req.json()
    if (!updates) return NextResponse.json({ error: 'No updates provided' }, { status: 400 })

    const upserts = Object.entries(updates).map(([key, value]) => ({
      key,
      value: String(value),
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabaseAdmin.from('PlatformConfig').upsert(upserts, { onConflict: 'key' })
    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Config API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
