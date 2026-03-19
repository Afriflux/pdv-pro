/**
 * GET /api/telegram/community/verify?store_id=xxx&code=PDV-XXXX
 * Vérifie si un groupe Telegram a bien été lié via le code /connect.
 * Auth : vendeur connecté via Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Params
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('store_id')
    const code = searchParams.get('code')

    if (!storeId || !code) {
      return NextResponse.json({ error: 'store_id et code requis' }, { status: 400 })
    }

    // 3. Vérifier ownership
    const admin = createAdminClient()
    const { data: store } = await admin
      .from('Store')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 403 })
    }

    // 4. Chercher la community avec ce code
    const { data: community } = await admin
      .from('TelegramCommunity')
      .select('id, chat_id, chat_title, chat_type, members_count, code_expires_at, connect_code')
      .eq('store_id', storeId)
      .or(`connect_code.eq.${code}`)
      .maybeSingle()

    // Pas trouvée avec ce code → chercher par code null (déjà liée, code consommé)
    if (!community) {
      // Peut-être le code a déjà été consommé et la community est liée
      const { data: linked } = await admin
        .from('TelegramCommunity')
        .select('id, chat_id, chat_title, chat_type, members_count')
        .eq('store_id', storeId)
        .not('chat_id', 'is', null)
        .maybeSingle()

      if (linked?.chat_id) {
        return NextResponse.json({
          linked: true,
          community: {
            id: linked.id,
            chat_id: linked.chat_id,
            chat_title: linked.chat_title,
            chat_type: linked.chat_type,
            members_count: linked.members_count,
          }
        })
      }

      return NextResponse.json({ linked: false })
    }

    // 5. Community trouvée — vérifier état
    if (community.chat_id) {
      // Déjà liée !
      return NextResponse.json({
        linked: true,
        community: {
          id: community.id,
          chat_id: community.chat_id,
          chat_title: community.chat_title,
          chat_type: community.chat_type,
          members_count: community.members_count,
        }
      })
    }

    // Code expiré ?
    if (community.code_expires_at && new Date(community.code_expires_at) < new Date()) {
      return NextResponse.json({ linked: false, expired: true })
    }

    // Pas encore liée, en attente du /connect
    return NextResponse.json({ linked: false, pending: true })

  } catch (err: unknown) {
    console.error('[Community] verify error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
