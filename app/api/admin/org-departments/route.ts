// ─── app/api/admin/org-departments/route.ts ──────────────────────────────────
// CRUD pour la configuration des départements de l'organigramme
// Stocké dans PlatformConfig (clé: ORG_DEPARTMENTS)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CONFIG_KEY = 'ORG_DEPARTMENTS'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()
    const { data } = await supabaseAdmin
      .from('PlatformConfig')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single()

    const departments = data?.value ? JSON.parse(data.value as string) : []
    return NextResponse.json({ departments })
  } catch {
    return NextResponse.json({ departments: [] })
  }
}

export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser || !['super_admin', 'gestionnaire'].includes(adminUser.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { departments } = await req.json()

    const { error } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert({
        key: CONFIG_KEY,
        value: JSON.stringify(departments),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (error) {
      console.error('[OrgDepartments] Save error:', error)
      return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[OrgDepartments] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
