// ─── app/api/community/posts/[id]/like/route.ts ──────────────────────────────
// POST — Toggle like sur un post communautaire
// Auth vendeur obligatoire
// Logique : liker si pas liké, unliker si déjà liké (idempotent)
// Compteur géré atomiquement via RPC SQL (pas de read-modify-write)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Route POST ───────────────────────────────────────────────────────────────

export async function POST(
  _req:    NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const postId = context.params.id
    if (!postId) {
      return NextResponse.json({ error: 'ID post manquant' }, { status: 400 })
    }

    // ── Auth vendeur ──────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le store du vendeur connecté
    const { data: storeRaw } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!storeRaw) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 403 })
    }

    const storeId = (storeRaw as { id: string }).id

    // ── Vérifier que le post existe ───────────────────────────────────────────
    const admin = createAdminClient()

    const { data: postRaw, error: postError } = await admin
      .from('CommunityPost')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !postRaw) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    // ── Vérifier si déjà liké ─────────────────────────────────────────────────
    const { data: existingLike } = await admin
      .from('CommunityLike')
      .select('id')
      .eq('post_id', postId)
      .eq('store_id', storeId)
      .maybeSingle()

    const alreadyLiked = existingLike !== null

    if (alreadyLiked) {
      // ── UNLIKE : supprimer le like + décrémenter atomiquement ────────────
      const { error: deleteError } = await admin
        .from('CommunityLike')
        .delete()
        .eq('post_id', postId)
        .eq('store_id', storeId)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Décrémentation atomique via RPC (pas de race condition)
      await admin.rpc('increment_likes_count', { p_post_id: postId, delta: -1 })

      // Relire le compteur après update atomique
      const { data: updated } = await admin
        .from('CommunityPost')
        .select('likes_count')
        .eq('id', postId)
        .single()

      return NextResponse.json({
        success:     true,
        liked:       false,
        likes_count: (updated as { likes_count: number } | null)?.likes_count ?? 0,
      })

    } else {
      // ── LIKE : insérer + incrémenter atomiquement ──────────────────────
      const { error: insertError } = await admin
        .from('CommunityLike')
        .insert({ post_id: postId, store_id: storeId })

      // Gérer gracieusement le conflit UNIQUE (23505) — double-like concurrent
      if (insertError) {
        if (insertError.code === '23505') {
          const { data: current } = await admin
            .from('CommunityPost')
            .select('likes_count')
            .eq('id', postId)
            .single()

          return NextResponse.json({
            success:     true,
            liked:       true,
            likes_count: (current as { likes_count: number } | null)?.likes_count ?? 0,
          })
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      // Incrémentation atomique via RPC (pas de race condition)
      await admin.rpc('increment_likes_count', { p_post_id: postId, delta: 1 })

      // Relire le compteur après update atomique
      const { data: updated } = await admin
        .from('CommunityPost')
        .select('likes_count')
        .eq('id', postId)
        .single()

      return NextResponse.json({
        success:     true,
        liked:       true,
        likes_count: (updated as { likes_count: number } | null)?.likes_count ?? 0,
      })
    }

  } catch (err: unknown) {
    console.error('[community/like POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
