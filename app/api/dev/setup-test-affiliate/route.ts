import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()

    // 1. Trouver la boutique (Store) rattachée au vrai compte vendeur "afriflux@gmail.com"
    const { data: vendorUser, error: vendorErr } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', 'afriflux@gmail.com')
      .single()

    if (!vendorUser || vendorErr) {
      return NextResponse.json({ error: "Compte vendeur afriflux@gmail.com introuvable." }, { status: 404 })
    }

    const { data: store, error: storeErr } = await supabaseAdmin
      .from('Store')
      .select('id, name')
      .eq('user_id', vendorUser.id)
      .single()

    if (!store || storeErr) {
      return NextResponse.json({ error: "Boutique du vendeur afriflux@gmail.com introuvable." }, { status: 404 })
    }

    // 2. Trouver l'utilisateur test (qui deviendra l'affilié)
    const testEmail = 'testvendor1@example.com'
    const { data: testUser, error: testUserErr } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', testEmail)
      .single()

    if (!testUser || testUserErr) {
      return NextResponse.json({ error: `Compte test ${testEmail} introuvable.` }, { status: 404 })
    }

    // 3. Mettre à jour le rôle de l'utilisateur test en "affilie"
    await supabaseAdmin
      .from('User')
      .update({ role: 'affilie' })
      .eq('id', testUser.id)

    // 4. Créer la liaison d'affiliation dans la table 'Affiliate'
    // La table Affiliate associe un store_id (vendeur) et un user_id (l'affilié)
    const token = 'TEST_REF_' + Math.floor(Math.random() * 10000)
    
    // Vérifier si la liaison existe déjà
    const { data: existingAffiliate } = await supabaseAdmin
      .from('Affiliate')
      .select('id')
      .eq('store_id', store.id) // Note: Il se peut que la colonne s'appelle vendor_id ou store_id selon la db
      .eq('user_id', testUser.id)
      .maybeSingle()

    if (existingAffiliate) {
      return NextResponse.json({ message: "Le compte de test est DÉJÀ un affilié pour Afriflux !", data: existingAffiliate })
    }

    // Tentative d'insertion (avec store_id)
    const { data: newAffiliate, error: insertErr } = await supabaseAdmin
      .from('Affiliate')
      .insert({
        store_id: store.id,
        user_id: testUser.id,
        token: token,
        code: token,
        status: 'active',
        commission_rate: 15.0,
        clicks: 42,
        total_earned: 12500
      })
      .select()
      .single()

    if (insertErr) {
       return NextResponse.json({ error: "Echec insertion", details: insertErr }, { status: 500 })
    }

    return NextResponse.json({ message: `Affilié rattaché avec succès pour la boutique ${store.name} !`, data: newAffiliate })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
