import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// ----------------------------------------------------------------
// TYPES INTERNES
// ----------------------------------------------------------------

type WithdrawalMethod = 'wave' | 'orange_money' | 'bank'

interface WithdrawalBody {
  amount: number
  method: WithdrawalMethod
  phoneOrIban: string
}

// ----------------------------------------------------------------
// API : DEMANDE DE RETRAIT AFFILIATION
// POST /api/affiliation/withdrawal
// ----------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const supabaseContext = await createClient()
    const { data: { user } } = await supabaseContext.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body: WithdrawalBody = await request.json()
    const { amount, method, phoneOrIban } = body

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

    // 2. Récupérer le profil affilié
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('Affiliate')
      .select('*')
      .eq('store_id', store.id)
      .single()

    if (affError || !affiliate) {
      return NextResponse.json({ error: 'Profil affilié introuvable' }, { status: 404 })
    }

    // 3. Validations métier
    if (!amount || amount < 5000) {
      return NextResponse.json(
        { error: 'Le montant minimum de retrait est de 5 000 FCFA' },
        { status: 400 }
      )
    }

    if (affiliate.balance < amount) {
      return NextResponse.json(
        { error: 'Solde insuffisant pour ce retrait' },
        { status: 400 }
      )
    }

    const validMethods: WithdrawalMethod[] = ['wave', 'orange_money', 'bank']
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: 'Méthode de retrait invalide' }, { status: 400 })
    }

    if (!phoneOrIban || phoneOrIban.trim() === '') {
      return NextResponse.json({ error: 'Coordonnées de paiement (téléphone ou IBAN) requises' }, { status: 400 })
    }

    // 4. INSERT AffiliateTransaction (type withdrawal)
    const { data: _transaction, error: txError } = await supabaseAdmin
      .from('AffiliateTransaction')
      .insert({
        affiliate_id: affiliate.id,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        description: `Retrait vers ${method.toUpperCase()} - ${phoneOrIban}`
      })
      .select()
      .single()

    if (txError) throw txError

    // 5. UPDATE Affiliate balance
    const newBalance = affiliate.balance - amount
    const { error: balError } = await supabaseAdmin
      .from('Affiliate')
      .update({ balance: newBalance })
      .eq('id', affiliate.id)

    if (balError) throw balError

    // 6. INSERT WithdrawalRequest pour l'admin
    const { error: reqError } = await supabaseAdmin
      .from('WithdrawalRequest')
      .insert({
        store_id: store.id,
        wallet_id: affiliate.id, // ID Affilié lié pour traçabilité
        amount: amount,
        method: method,
        phone_or_iban: phoneOrIban,
        status: 'pending'
      })

    if (reqError) throw reqError

    return NextResponse.json({
      success: true,
      newBalance,
      message: 'Votre demande de retrait a été enregistrée avec succès'
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Affiliate Withdrawal Error]:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
