import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { storeId, active, config } = await req.json()

    if (!storeId) return NextResponse.json({ error: 'Store ID manquant' }, { status: 400 })

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('Store')
      .update({
        gamification_active: active,
        gamification_config: config
      })
      .eq('id', storeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GAMIFICATION_API_ERROR]', error)
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 })
  }
}
