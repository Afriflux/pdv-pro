import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { INTEGRATION_CATEGORIES } from '@/app/admin/integrations/config'

const ALLOWED_KEYS = new Set(
  INTEGRATION_CATEGORIES.flatMap(c => 
    c.services.flatMap(s => 
      s.fields.flatMap(f => f.testKey ? [f.key, f.testKey] : [f.key])
    )
  )
)

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()
    const payloadToSave = { WAVE_API_KEY_TEST: 'dummy_key' }
    
    const rowsToUpsert: any[] = []
    for (const [key, value] of Object.entries(payloadToSave)) {
      if (!ALLOWED_KEYS.has(key)) {
        return NextResponse.json({ error: `Not allowed: ${key}. Allowed: ${Array.from(ALLOWED_KEYS).join(',')}` })
      }
      rowsToUpsert.push({ key, value })
    }

    const { data, error } = await supabaseAdmin
      .from('PlatformConfig')
      .upsert(rowsToUpsert, { onConflict: 'key' })
      .select()

    if (error) {
      return NextResponse.json({ ok: false, error })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, stack: err.stack })
  }
}
