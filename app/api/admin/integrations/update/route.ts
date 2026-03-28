import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { INTEGRATION_CATEGORIES } from '@/app/admin/integrations/config'

// Clés autorisées (whitelist générée depuis la config orientée Service)
const ALLOWED_KEYS = new Set(
  INTEGRATION_CATEGORIES.flatMap(c => 
    c.services.flatMap(s => 
      s.fields.flatMap(f => f.testKey ? [f.key, f.testKey] : [f.key])
    )
  )
)

interface UpdateBody {
  payload: Record<string, string>
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
      .select('name, role')
      .eq('id', user.id)
      .single<{ name: string, role: string }>()

    if (caller?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé — super_admin requis.' }, { status: 403 })
    }

    const { payload } = await req.json() as UpdateBody

    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Payload invalide ou vide.' }, { status: 400 })
    }

    const rowsToUpsert: { key: string, value: string, updated_by: string }[] = []
    const authorName = caller?.name || user.email || 'Admin'
    
    for (const [key, value] of Object.entries(payload)) {
      if (!ALLOWED_KEYS.has(key)) {
        return NextResponse.json({ error: `Clé non autorisée : "${key}".` }, { status: 400 })
      }
      rowsToUpsert.push({ key, value: value.trim(), updated_by: authorName })
    }

    // Bulk Upsert dans IntegrationKey
    const { error } = await supabaseAdmin
      .from('IntegrationKey')
      .upsert(rowsToUpsert, { onConflict: 'key' })

    if (error) throw error

    console.log(`[Admin Integrations] Bulk update par ${user.id} : ${Object.keys(payload).join(', ')}`)
    return NextResponse.json({ success: true, updatedKeys: rowsToUpsert.map(r => r.key) })
  } catch (error: unknown) {
    console.error('[Admin Integrations Bulk Update] Erreur:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
