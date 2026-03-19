import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getAffiliateStats, createAffiliate } from '@/lib/affiliation/affiliate-service'

// ----------------------------------------------------------------
// API : PROFIL AFFILIÉ (GET/PATCH)
// ----------------------------------------------------------------

/**
 * GET /api/affiliation/profile
 * Récupère les stats de l'affilié connecté (ou crée le profil si absent)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Récupérer le store_id
    const { data: store, error: storeError } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // 2. Vérifier l'existence du profil affilié, sinon le créer
    const { data: affiliate } = await supabaseAdmin
      .from('Affiliate')
      .select('id')
      .eq('store_id', store.id)
      .single()

    if (!affiliate) {
      await createAffiliate(store.id)
    }

    // 3. Récupérer les statistiques complètes via le service
    const stats = await getAffiliateStats(store.id)

    if (!stats) {
      return NextResponse.json({ error: 'Impossible de charger les statistiques' }, { status: 500 })
    }

    return NextResponse.json(stats)

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Affiliate Profile GET Error]:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * PATCH /api/affiliation/profile
 * Met à jour les préférences de l'affilié
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { isActive } = await request.json()
    const supabaseAdmin = createAdminClient()

    // 1. Récupérer le store_id
    const { data: store } = await supabaseAdmin
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // 2. Mise à jour
    const updateData: { is_active?: boolean } = {}
    if (typeof isActive === 'boolean') updateData.is_active = isActive

    const { error } = await supabaseAdmin
      .from('Affiliate')
      .update(updateData)
      .eq('store_id', store.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Affiliate Profile PATCH Error]:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
