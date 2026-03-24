/**
 * /api/telegram/community
 * GET  ?store_id=xxx  → Liste les communautés Telegram du store
 * DELETE body: { community_id } → Supprime une communauté
 * Auth : vendeur connecté via Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── GET — Liste des communautés ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const storeId = new URL(request.url).searchParams.get('store_id')
    if (!storeId) {
      return NextResponse.json({ error: 'store_id requis' }, { status: 400 })
    }

    // Vérifier ownership
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

    // Récupérer les communautés liées (avec chat_id)
    const { data: communities, error } = await admin
      .from('TelegramCommunity')
      .select(`
        id,
        chat_id,
        chat_title,
        chat_type,
        product_id,
        welcome_message,
        is_active,
        members_count,
        created_at,
        updated_at
      `)
      .eq('store_id', storeId)
      .not('chat_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Community] GET error:', error)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    return NextResponse.json({ communities: communities || [] })

  } catch (err: unknown) {
    console.error('[Community] GET error:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}

// ── DELETE — Supprimer une communauté ────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { community_id } = body as { community_id?: string }
    if (!community_id) {
      return NextResponse.json({ error: 'community_id requis' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier que la communauté appartient au user
    const { data: community } = await admin
      .from('TelegramCommunity')
      .select('id, store_id')
      .eq('id', community_id)
      .single()

    if (!community) {
      return NextResponse.json({ error: 'Communauté non trouvée' }, { status: 404 })
    }

    // Vérifier ownership du store
    const { data: store } = await admin
      .from('Store')
      .select('id')
      .eq('id', community.store_id)
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    // Supprimer
    const { error: deleteError } = await admin
      .from('TelegramCommunity')
      .delete()
      .eq('id', community_id)

    if (deleteError) {
      console.error('[Community] DELETE error:', deleteError)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('[Community] DELETE error:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}

// ── PATCH — Lier un produit à la communauté ──────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { community_id, product_id, welcome_message } = body as {
      community_id?: string
      product_id?: string | null
      welcome_message?: string | null
    }

    if (!community_id) {
      return NextResponse.json({ error: 'community_id requis' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Vérifier ownership : community → store → user
    const { data: community } = await admin
      .from('TelegramCommunity')
      .select('id, store_id')
      .eq('id', community_id)
      .single()

    if (!community) {
      return NextResponse.json({ error: 'Communauté non trouvée' }, { status: 404 })
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

    // Mettre à jour product_id ou welcome_message
    const updateData: Record<string, string | null> = {}
    if (product_id !== undefined) updateData.product_id = product_id ?? null
    if (welcome_message !== undefined) updateData.welcome_message = welcome_message ?? null

    const { error: updateError } = await admin
      .from('TelegramCommunity')
      .update(updateData)
      .eq('id', community_id)

    if (updateError) {
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('[Community] PATCH error:', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
