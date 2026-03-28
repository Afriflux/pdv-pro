'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getAmbassadorDetails(ambassadorId: string) {
  const supabase = createAdminClient()

  // 1. Récupérer les filleuls
  const { data: referrals, error: refError } = await supabase
    .from('AmbassadorReferral')
    .select(`
      id,
      vendor_store_id,
      registration_month,
      ca_in_registration_month,
      is_qualified,
      commission_paid,
      commission_amount,
      created_at,
      Store:vendor_store_id ( name, slug, kyc_status )
    `)
    .eq('ambassador_id', ambassadorId)
    .order('created_at', { ascending: false })

  // 2. Récupérer les transactions (paiements/commissions)
  const { data: transactions, error: txError } = await supabase
    .from('AmbassadorTransaction')
    .select('*')
    .eq('ambassador_id', ambassadorId)
    .order('created_at', { ascending: false })

  if (refError || txError) {
    console.error('Erreur getAmbassadorDetails:', refError || txError)
    throw new Error('Impossible de charger les détails de l\'ambassadeur.')
  }

  return {
    referrals: referrals || [],
    transactions: transactions || []
  }
}

export async function payAmbassador(ambassadorId: string) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // 1. Vérifier l'admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: adminUser } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminUser || !['super_admin', 'gestionnaire'].includes(adminUser.role)) {
    throw new Error('Action non autorisée')
  }

  // 2. Récupérer l'ambassadeur, son solde, son KYC, et son numéro de tel
  const { data: amb, error: errAmb } = await supabaseAdmin
    .from('Ambassador')
    .select('id, balance, contract_accepted, code, user_id, Store(kyc_status, name, whatsapp, User(phone))')
    .eq('id', ambassadorId)
    .single()

  if (errAmb || !amb) throw new Error('Ambassadeur introuvable')

  // 3. Vérifications des règles strictes
  if (amb.balance <= 0) {
    throw new Error('Le solde de cet ambassadeur est déjà à 0.')
  }
  if (!amb.contract_accepted) {
    throw new Error('Impossible de payer : Le contrat n\'a pas encore été signé par l\'ambassadeur.')
  }
  // Le kyc de l'ambassadeur = Store.kyc_status
  // @ts-expect-error : type inféré non strict
  if (amb.Store?.kyc_status !== 'verified') {
    throw new Error('Impossible de payer : La pièce d\'identité (KYC) de l\'ambassadeur n\'est pas validée.')
  }

  const payoutAmount = amb.balance
  // @ts-expect-error : type inféré non strict
  const ambassadorName = amb.Store?.name ?? amb.code

  // 4. Déterminer le numéro de téléphone pour le paiement
  // @ts-expect-error : typage de Store
  let phone = amb.Store?.User?.[0]?.phone || amb.Store?.User?.phone || amb.Store?.whatsapp
  
  if (!phone) {
     // Chercher le tel de l'utilisateur directement
     const { data: uInfo } = await supabaseAdmin.from('User').select('phone').eq('id', amb.user_id).single()
     phone = uInfo?.phone
  }

  if (!phone) {
    throw new Error('Impossible de payer : Aucun numéro de téléphone trouvé pour cet ambassadeur.')
  }

  // 5. Exécuter le paiement via Wave/Orange Money 
  // (Module executePayout / Wave API)
  const txIdRef = `AMB_PAY_${Date.now()}_${amb.code}`
  
  const { executePayout } = await import('@/lib/payouts/payout-service')
  const payoutResult = await executePayout({
    phone: phone,
    amount: payoutAmount,
    reference: txIdRef,
    method: 'wave' // Default Wave, on pourrait lire depuis le profil vendeur
  })

  // Si refusé par la passerelle de paiement
  if (!payoutResult.success) {
    console.error(`[Ambassador Payout] Échec API pour ${amb.id}:`, payoutResult.error)
    throw new Error(`Le paiement automatique a échoué (API refusée). Motif : ${payoutResult.error}`)
  }

  // 6. Insérer la transaction (Retrait validé)
  const { error: errTx } = await supabaseAdmin
    .from('AmbassadorTransaction')
    .insert({
      ambassador_id: ambassadorId,
      type: 'withdrawal',
      amount: payoutAmount,
      description: `Paiement via Wave/Mobile Money (Réf: ${payoutResult.transactionId || txIdRef})`,
      status: 'completed'
    })

  if (errTx) throw new Error('Erreur lors de la création de la transaction')

  // 5. Réduire le solde à Zéro
  const { error: errUpdate } = await supabaseAdmin
    .from('Ambassador')
    .update({ balance: 0 })
    .eq('id', ambassadorId)

  if (errUpdate) {
    // Théoriquement il faudrait un rollback manuel, mais Supabase on Edge 
    // ou RPC c'est mieux. Si ça échoue on log.
    console.error('Erreur MAJ Solde:', errUpdate)
  }

  // 8. Log d'Audit
  await supabaseAdmin.from('AdminLog').insert({
    admin_id: user.id,
    action: 'PAY_AMBASSADOR',
    target_type: 'AMBASSADOR',
    target_id: ambassadorId,
    details: {
      amount: payoutAmount,
      trx_id: payoutResult.transactionId || txIdRef,
      reason: `Paiement automatisé Wave des commissions de l'ambassadeur ${ambassadorName} / Code: ${amb.code}`
    }
  })

  return { success: true, amount: payoutAmount }
}
