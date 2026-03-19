/**
 * POST /api/telegram/community/generate-code
 * Génère un code /connect unique pour lier un groupe Telegram.
 * Auth : vendeur connecté via Supabase.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans I/O/0/1 pour éviter confusion
  let code = 'PDV-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: Request) {
  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Body
    const body = await request.json()
    const { store_id } = body as { store_id?: string }
    if (!store_id) {
      return NextResponse.json({ error: 'store_id requis' }, { status: 400 })
    }

    // 3. Vérifier ownership
    const admin = createAdminClient()
    const { data: store, error: storeError } = await admin
      .from('Store')
      .select('id')
      .eq('id', store_id)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 403 })
    }

    // 4. Chercher un code actif existant
    const now = new Date().toISOString()
    const { data: existing } = await admin
      .from('TelegramCommunity')
      .select('connect_code, code_expires_at')
      .eq('store_id', store_id)
      .not('connect_code', 'is', null)
      .gt('code_expires_at', now)
      .maybeSingle()

    if (existing?.connect_code) {
      return NextResponse.json({
        code: existing.connect_code,
        expires_at: existing.code_expires_at,
        steps: [
          'Ajoutez @PDVProBot comme administrateur dans votre groupe',
          `Dans votre groupe, tapez : /connect ${existing.connect_code}`,
          'Cliquez sur Vérifier ci-dessous'
        ]
      })
    }

    // 5. Générer nouveau code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // +10 min

    // 6. Chercher s'il existe déjà une community non liée pour ce store
    const { data: unlinked } = await admin
      .from('TelegramCommunity')
      .select('id')
      .eq('store_id', store_id)
      .is('chat_id', null)
      .maybeSingle()

    if (unlinked) {
      // UPDATE la community existante
      await admin
        .from('TelegramCommunity')
        .update({ connect_code: code, code_expires_at: expiresAt })
        .eq('id', unlinked.id)
    } else {
      // INSERT nouvelle community
      const { error: insertError } = await admin
        .from('TelegramCommunity')
        .insert({
          store_id,
          connect_code: code,
          code_expires_at: expiresAt,
        })

      if (insertError) {
        console.error('[Community] Insert error:', insertError)
        return NextResponse.json({ error: 'Erreur création communauté' }, { status: 500 })
      }
    }

    return NextResponse.json({
      code,
      expires_at: expiresAt,
      steps: [
        'Ajoutez @PDVProBot comme administrateur dans votre groupe',
        `Dans votre groupe, tapez : /connect ${code}`,
        'Cliquez sur Vérifier ci-dessous'
      ]
    })

  } catch (err: unknown) {
    console.error('[Community] generate-code error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
