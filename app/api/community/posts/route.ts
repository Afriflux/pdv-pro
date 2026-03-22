// ─── app/api/community/posts/route.ts ────────────────────────────────────────
// GET  ?category=all|general|...&limit=20&offset=0 → liste posts enrichie
// POST { content, category?, imageUrl? }           → créer un post (auth requise)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['general', 'question', 'success', 'tip', 'mode', 'digital', 'food'] as const
type Category = typeof VALID_CATEGORIES[number]

interface PostRow {
  id:          string
  store_id:    string
  content:     string
  image_url:   string | null
  category:    string
  likes_count: number
  created_at:  string
  updated_at:  string
  store: {
    name:     string
    logo_url: string | null
  } | null
}


interface LikeRow {
  post_id: string
}

interface PostBody {
  content:   string
  category?: string
  imageUrl?: string
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const categoryParam = searchParams.get('category') ?? 'all'
    const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0)

    // Auth optionnelle sur GET — utilisée pour calculer user_liked
    const { data: { user } } = await supabase.auth.getUser()

    // Récupérer le storeId du vendeur connecté (si connecté)
    let currentStoreId: string | null = null
    if (user) {
      const { data: storeRow } = await supabase
        .from('Store')
        .select('id')
        .eq('user_id', user.id)
        .single()
      currentStoreId = (storeRow as { id: string } | null)?.id ?? null
    }

    // ── Requête posts + store join ────────────────────────────────────────────
    let query = supabase
      .from('CommunityPost')
      .select(`
        id, store_id, content, image_url, category, likes_count, created_at, updated_at,
        store:Store(name, logo_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categoryParam !== 'all' && VALID_CATEGORIES.includes(categoryParam as Category)) {
      query = query.eq('category', categoryParam)
    }

    const { data: postsRaw, error: postsError } = await query

    if (postsError) {
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    const posts = (postsRaw as unknown) as PostRow[]
    const postIds = posts.map(p => p.id)

    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], total: 0 })
    }

    // ── Compter les commentaires par post ────────────────────────────────────
    const { data: commentCountsRaw } = await supabase
      .from('CommunityComment')
      .select('post_id')
      .in('post_id', postIds)

    const commentCounts: Record<string, number> = {}
    ;(commentCountsRaw ?? []).forEach((row: { post_id: string }) => {
      commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1
    })

    // ── Récupérer les likes du vendeur connecté ───────────────────────────────
    const likedPostIds = new Set<string>()
    if (currentStoreId) {
      const { data: likesRaw } = await supabase
        .from('CommunityLike')
        .select('post_id')
        .eq('store_id', currentStoreId)
        .in('post_id', postIds)

      ;(likesRaw ?? []).forEach((row: LikeRow) => {
        likedPostIds.add(row.post_id)
      })
    }

    // ── Assembler la réponse ──────────────────────────────────────────────────
    const enriched = posts.map(p => ({
      id:             p.id,
      store_id:       p.store_id,
      content:        p.content,
      image_url:      p.image_url,
      category:       p.category,
      likes_count:    p.likes_count,
      comments_count: commentCounts[p.id] ?? 0,
      user_liked:     likedPostIds.has(p.id),
      created_at:     p.created_at,
      store_name:     p.store?.name    ?? 'Boutique inconnue',
      store_logo:     p.store?.logo_url ?? null,
    }))

    return NextResponse.json({ posts: enriched, total: enriched.length })

  } catch (err: unknown) {
    console.error('[community/posts GET]', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth obligatoire
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le store du vendeur
    const { data: storeRaw } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!storeRaw) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 403 })
    }

    const store = storeRaw as { id: string }

    // Parser le body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
    }

    const { content, category = 'general', imageUrl } = body as PostBody

    // Validation
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 })
    }
    if (content.trim().length === 0 || content.length > 1000) {
      return NextResponse.json({ error: 'Contenu invalide (1-1000 caractères)' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category as Category)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
    }

    // Insérer le post
    const { data: newPost, error: insertError } = await supabase
      .from('CommunityPost')
      .insert({
        store_id:  store.id,
        content:   content.trim(),
        category,
        image_url: imageUrl ?? null,
      })
      .select('id, content, category, created_at, likes_count')
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: newPost }, { status: 201 })

  } catch (err: unknown) {
    console.error('[community/posts POST]', err)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
