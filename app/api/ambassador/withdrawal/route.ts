import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── POST /api/ambassador/withdrawal ────────────────────────────────────────

interface WithdrawBody {
  ambassadorId: string
  method: 'wave' | 'orange_money'
  phone: string
  amount: number
}

export async function POST(req: Request): Promise<Response> {
  // 1. Vérifier l'authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 2. Parser et valider le body
  let body: WithdrawBody
  try {
    body = (await req.json()) as WithdrawBody
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { ambassadorId, method, phone, amount } = body

  if (!ambassadorId || !method || !phone || !amount) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  if (!['wave', 'orange_money'].includes(method)) {
    return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 })
  }

  if (amount < 5000) {
    return NextResponse.json({ error: 'Montant minimum : 5 000 FCFA' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 3. Récupérer l'ambassadeur et vérifier qu'il appartient à l'user connecté
    const { data: ambRow, error: ambError } = await supabaseAdmin
      .from('Ambassador')
      .select('id, user_id, balance, is_active')
      .eq('id', ambassadorId)
      .single()

    if (ambError || !ambRow) {
      return NextResponse.json({ error: 'Ambassadeur introuvable' }, { status: 404 })
    }

    const amb = ambRow as { id: string; user_id: string; balance: number; is_active: boolean }

    // Vérifier que l'ambassadeur appartient à l'user connecté
    if (amb.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    if (!amb.is_active) {
      return NextResponse.json({ error: 'Compte ambassadeur désactivé' }, { status: 403 })
    }

    // 4. Vérifier le solde
    if (amb.balance < amount) {
      return NextResponse.json(
        { error: `Solde insuffisant. Disponible : ${amb.balance.toLocaleString('fr-FR')} FCFA` },
        { status: 400 }
      )
    }

    // 5. Déduire le montant du solde ambassadeur
    const newBalance = amb.balance - amount

    const { error: updateError } = await supabaseAdmin
      .from('Ambassador')
      .update({ balance: newBalance })
      .eq('id', ambassadorId)

    if (updateError) {
      console.error('[Ambassador Withdrawal] Erreur update balance:', updateError.message)
      throw new Error('Erreur lors de la mise à jour du solde.')
    }

    // 6. Enregistrer la transaction de retrait (en statut pending d'abord)
    const { error: txError, data: newTx } = await supabaseAdmin
      .from('AmbassadorTransaction')
      .insert({
        ambassador_id: ambassadorId,
        referral_id:   null,
        type:          'withdrawal',
        amount:        amount,
        description:   `Retrait via ${method === 'wave' ? 'Wave' : 'Orange Money'} — ${phone}`,
        status:        'pending',
      })
      .select('id')
      .single()

    if (txError) {
      console.error('[Ambassador Withdrawal] Erreur insert transaction:', txError.message)
    }

    // Payout automatique via Wave/CinetPay
    const { executePayout } = await import('@/lib/payouts/payout-service')
    const payoutResult = await executePayout({
      phone,
      amount,
      reference: newTx?.id || `${ambassadorId}-${Date.now()}`,
      method
    })

    if (!payoutResult.success) {
      // Échec du payout : on annule
      await supabaseAdmin.from('Ambassador').update({ balance: amb.balance }).eq('id', ambassadorId)
      if (newTx) {
        await supabaseAdmin.from('AmbassadorTransaction').update({ status: 'failed' }).eq('id', newTx.id)
      }
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // Succès
    if (newTx) {
      await supabaseAdmin.from('AmbassadorTransaction').update({ status: 'completed' }).eq('id', newTx.id)
    }

    return NextResponse.json(
      { message: `Retrait de ${amount.toLocaleString('fr-FR')} FCFA initié avec succès.` },
      { status: 200 }
    )

  } catch (error: unknown) {

    console.error('[Ambassador Withdrawal] ❌', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
