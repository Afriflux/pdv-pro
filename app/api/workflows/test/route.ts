import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeWorkflows } from '@/lib/workflows/engine'

// POST /api/workflows/test
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    const payload = await req.json()
    // payload ex: { triggerType: 'Nouvelle Question', payloadData: { client_name: 'Cheikh', query: 'Où est ma commande', lead_score_ai: 8 } }
    
    if (!payload.triggerType) {
      return NextResponse.json({ error: 'triggerType manquant' }, { status: 400 })
    }

    const result = await executeWorkflows(store.id, payload.triggerType, payload.payloadData || {})
    return NextResponse.json(result)

  } catch (err: any) {
    console.error('[API/workflows/test] Erreur:', err)
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 })
  }
}
