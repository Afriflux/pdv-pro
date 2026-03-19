// ─── app/api/community/posts/[id]/comments/route.ts ─────────────────────────
// GET  → liste des commentaires d'un post (triés ASC, max 50)
// POST { content } → créer un commentaire (auth obligatoire)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentRow {
  id:        string
  post_id:   string
  store_id:  string
  content:   string
  created_at: string
  store: {
    name:     string
    logo_url: string | null
  } | null
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req:    NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const postId = context.params.id
    if (!postId) {
      return NextResponse.json({ error: 'ID post manquant' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: commentsRaw, error } = await supabase
      .from('CommunityComment')
      .select(`
        id, post_id, store_id, content, created_at,
        store:Store(name, logo_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const comments = (commentsRaw as unknown) as CommentRow[]

    const result = comments.map(c => ({
      id:          c.id,
      post_id:     c.post_id,
      store_id:    c.store_id,
      content:     c.content,
      created_at:  c.created_at,
      store_name:  c.store?.name     ?? 'Boutique inconnue',
      store_logo:  c.store?.logo_url ?? null,
    }))

    return NextResponse.json({ comments: result })

  } catch (err: unknown) {
    console.error('[community/comments GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(
  req:     NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const postId = context.params.id
    if (!postId) {
      return NextResponse.json({ error: 'ID post manquant' }, { status: 400 })
    }

    // ── Auth obligatoire ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le store du vendeur
    const { data: storeRaw } = await supabase
      .from('Store')
      .select('id, name, logo_url')
      .eq('user_id', user.id)
      .single()

    if (!storeRaw) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 403 })
    }

    const store = storeRaw as { id: string; name: string; logo_url: string | null }

    // ── Vérifier que le post existe ───────────────────────────────────────────
    const { data: postCheck } = await supabase
      .from('CommunityPost')
      .select('id')
      .eq('id', postId)
      .single()

    if (!postCheck) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    // ── Parser + valider le body ──────────────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
    }

    const { content } = body as { content?: string }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 })
    }

    const trimmed = content.trim()
    if (trimmed.length === 0 || trimmed.length > 500) {
      return NextResponse.json(
        { error: 'Commentaire invalide (1-500 caractères)' },
        { status: 400 }
      )
    }

    // ── Insérer le commentaire ────────────────────────────────────────────────
    const { data: newComment, error: insertError } = await supabase
      .from('CommunityComment')
      .insert({
        post_id:  postId,
        store_id: store.id,
        content:  trimmed,
      })
      .select('id, content, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const comment = newComment as { id: string; content: string; created_at: string }

    return NextResponse.json({
      success: true,
      comment: {
        id:          comment.id,
        content:     comment.content,
        created_at:  comment.created_at,
        store_name:  store.name,
        store_logo:  store.logo_url,
        store_id:    store.id,
        post_id:     postId,
      },
    }, { status: 201 })

  } catch (err: unknown) {
    console.error('[community/comments POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
