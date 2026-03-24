import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage } from '@/lib/telegram/bot-service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { community_id, message } = body as { community_id?: string; message?: string }

    if (!community_id || !message || message.trim() === '') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Vérifier la propriété de la communauté
    const { data: community } = await admin
      .from('TelegramCommunity')
      .select('chat_id, store_id, is_active')
      .eq('id', community_id)
      .single()

    if (!community || !community.chat_id || !community.is_active) {
      return NextResponse.json({ error: 'Communauté introuvable ou inactive' }, { status: 404 })
    }

    const { data: store } = await admin
      .from('Store')
      .select('id')
      .eq('id', community.store_id)
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    // 2. Envoyer le message
    await sendMessage(community.chat_id, message.trim())

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Broadcast API] Erreur:', error)
    return NextResponse.json({ error: 'Erreur technique lors de la diffusion.' }, { status: 500 })
  }
}
