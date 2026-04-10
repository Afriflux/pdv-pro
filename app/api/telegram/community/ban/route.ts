import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revokeMember } from '@/lib/telegram/community-service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { access_id } = await req.json()
    if (!access_id) {
      return NextResponse.json({ error: 'ID d\'accès requis' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Trouver l'accès
    const { data: access } = await admin
      .from('TelegramCommunityAccess')
      .select('telegram_user_id, community_id')
      .eq('id', access_id)
      .single()

    if (!access) {
      return NextResponse.json({ error: 'Accès non trouvé' }, { status: 404 })
    }

    if (!access.telegram_user_id) {
      return NextResponse.json({ error: 'Ce membre n\'a pas encore rejoint via le lien généré, ou son ID Telegram n\'a pas été capturé par le Webhook.' }, { status: 400 })
    }

    // 2. Trouver la communauté pour vérifier l'appartenance
    const { data: community } = await admin
      .from('TelegramCommunity')
      .select('chat_id, store_id')
      .eq('id', access.community_id)
      .single()

    if (!community || !community.chat_id) {
      return NextResponse.json({ error: 'Communauté introuvable ou non liée' }, { status: 400 })
    }

    // 3. Vérifier que c'est bien la boutique de l'utilisateur
    const { data: store } = await admin
      .from('Store')
      .select('id')
      .eq('id', community.store_id)
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Interdit' }, { status: 403 })
    }

    // 4. Effectuer le ban via Telegram API (via ban + unban pour kicker)
    await revokeMember(community.chat_id, Number(access.telegram_user_id))

    // 5. Facultatif : Supprimer la ligne de `TelegramCommunityAccess` pour nettoyer (ou la marquer comme bannie)
    await admin.from('TelegramCommunityAccess').delete().eq('id', access_id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[Ban API Error]', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Erreur serveur' }, { status: 500 })
  }
}
