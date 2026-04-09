import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // On veut récupérer tous les accès Telegram de la boutique.
    // L'astuce est de filtrer via TelegramCommunity.store_id
    const { data: accesses, error } = await supabase
      .from('TelegramCommunityAccess')
      .select(`
        id,
        order_id,
        buyer_phone,
        invite_link,
        sent_at,
        TelegramCommunity!inner (
          store_id,
          chat_title
        )
      `)
      .eq('TelegramCommunity.store_id', store.id)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ accesses })
  } catch (err: any) {
    console.error('[API Telegram Access]', err)
    return NextResponse.json({ error: 'Erreur lors de la récupération des accès.' }, { status: 500 })
  }
}
