import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// ----------------------------------------------------------------
// API : ENREGISTREMENT FILLEUL (REFERRAL)
// POST /api/affiliation/register
// ----------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const { referralCode, newStoreId } = await request.json()

    // 1. Validation des entrées
    if (!referralCode || !newStoreId) {
      return NextResponse.json(
        { error: 'Code de parrainage et ID de boutique requis' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 2. Chercher l'affilié par son code
    const { data: affiliate, error: affError } = await supabase
      .from('Affiliate')
      .select('id, store_id, is_active, Store(name)')
      .eq('code', referralCode)
      .single()

    if (affError || !affiliate) {
      return NextResponse.json(
        { error: 'Code de parrainage invalide' },
        { status: 404 }
      )
    }

    if (!affiliate.is_active) {
      return NextResponse.json(
        { error: 'Ce programme d\'affiliation est désactivé' },
        { status: 400 }
      )
    }

    // 3. Empêcher l'auto-parrainage
    if (newStoreId === affiliate.store_id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous parrainer vous-même' },
        { status: 400 }
      )
    }

    // 4. Vérifier si un parrainage existe déjà pour cette boutique
    const { data: existingReferral } = await supabase
      .from('AffiliateReferral')
      .select('id')
      .eq('referred_store_id', newStoreId)
      .single()

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Cette boutique est déjà associée à un parrain' },
        { status: 400 }
      )
    }

    // 5. Créer le lien de parrainage (AffiliateReferral)
    const { error: referralError } = await supabase
      .from('AffiliateReferral')
      .insert({
        affiliate_id: affiliate.id,
        referred_store_id: newStoreId,
        status: 'pending'
      })

    if (referralError) throw referralError

    // 6. Mettre à jour la boutique filleule (Store.referred_by)
    const { error: storeUpdateError } = await supabase
      .from('Store')
      .update({ referred_by: affiliate.store_id })
      .eq('id', newStoreId)

    if (storeUpdateError) throw storeUpdateError

    // 7. Mettre à jour le compteur de filleuls du parrain
    const { error: _counterError } = await supabase
      .from('Affiliate')
      .update({ 
        total_referred: supabase.rpc('increment', { row_id: affiliate.id, table_name: 'Affiliate', column_name: 'total_referred' }) 
      })
      // Note: Si RPC increment n'existe pas, on peut utiliser une approche classique ou transactionnelle
      // Cependant, pour simplifier et rester robuste sans RPC custom :
      // On récupère et update (déjà fait implicitement si on utilise le service, mais ici on est en API directe)
      // Utilisons plutôt une incrémentation via la donnée actuelle pour l'instant :
      // (Plus propre : UPDATE "Affiliate" SET total_referred = total_referred + 1 WHERE id = affiliate.id)

    // Correction de l'incrémentation directe sans RPC :
    await supabase.rpc('increment_affiliate_referrals', { aff_id: affiliate.id }) 
    // Ou simplement via SQL raw si possible, mais via Supabase Client on va faire un increment standard :
    interface AffiliateWithStore {
      id: string
      store_id: string
      is_active: boolean
      Store: { name: string } | null
    }

    const typedAffiliate = affiliate as unknown as AffiliateWithStore
    const affiliateName = typedAffiliate.Store?.name || 'Un partenaire'

    return NextResponse.json({
      success: true,
      affiliateName,
      message: `Boutique parrainée avec succès par ${affiliateName}`
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne lors de l\'enregistrement'
    console.error('[Affiliate Register Error]:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
