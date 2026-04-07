import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { validateAmbassadorCode, linkVendorToAmbassador } from '@/lib/ambassador/ambassador-service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { ambassadorCode } = body

    if (!ambassadorCode || !ambassadorCode.trim()) {
      return NextResponse.json(
        { success: false, error: 'Code ambassadeur manquant' },
        { status: 400 }
      )
    }

    const code = ambassadorCode.trim().toUpperCase()

    // 1. Valider le code ambassadeur
    const ambassador = await validateAmbassadorCode(code)
    if (!ambassador) {
      return NextResponse.json(
        { success: false, error: 'Code ambassadeur invalide ou inactif' },
        { status: 400 }
      )
    }

    // Client Admin — SERVICE_ROLE_KEY — bypass RLS pour la création DB
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Vérifier que l'utilisateur n'a pas déjà de Store
    const { data: existingStore } = await supabase
      .from('Store')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingStore) {
      return NextResponse.json(
        { success: false, error: 'Boutique déjà existante' },
        { status: 400 }
      )
    }

    // S'assurer que le user a un record dans la table User (créé par trigger auth ou actions.ts)
    // Au pire, le trigger `public.handle_new_user()` s'en est chargé, 
    // ou bien il n'existe pas encore si l'OAuth n'a pas triggeré correctement.
    // On peut faire un upsert sécurisé pour garantir son existence.
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Vendeur'
    
    await supabaseAdmin.from('User').upsert(
      { 
        id: user.id, 
        email: user.email!, 
        name: userName,
        role: 'vendeur'
      },
      { onConflict: 'id' }
    )

    // 3. Créer Store + Wallet
    const storeId = randomUUID()
    const walletId = randomUUID()
    const slug =
      userName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 25) +
      '-' +
      randomUUID().slice(0, 4)

    // Insérer le Store
    const { error: storeError } = await supabaseAdmin.from('Store').insert({
      id: storeId,
      user_id: user.id,
      name: userName,
      slug: slug,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (storeError) {
      throw new Error('Store insert: ' + storeError.message)
    }

    // Créer le Wallet
    const { error: walletError } = await supabaseAdmin
      .from('Wallet')
      .insert({
        id: walletId,
        vendor_id: storeId,
        balance: 0,
        pending: 0,
        total_earned: 0,
        updated_at: new Date().toISOString(),
      })

    if (walletError && walletError.code !== '23505') {
      throw new Error('Wallet insert: ' + walletError.message)
    }

    // 4. Lier le vendeur à l'ambassadeur
    const registrationMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    try {
      await linkVendorToAmbassador(code, storeId, registrationMonth)
    } catch (ambassadorError: unknown) {
      console.error('[OAUTH GOOGLE] Erreur linkVendorToAmbassador:', ambassadorError)
      // Ne pas throw l'erreur, la boutique est créée
    }

    return NextResponse.json({ success: true, redirectTo: '/dashboard' })

  } catch (error: unknown) {
    console.error('[OAUTH GOOGLE COMPLETE] Erreur interne:', error)

    return NextResponse.json({ success: false, error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
