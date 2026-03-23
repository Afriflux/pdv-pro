import { verifyCronSecret, cronResponse } from '@/lib/cron/cron-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // 1. Secret vérification
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()

  // 2. Fetch min_withdrawal config (Fallback: 5000)
  const { data: configAll } = await supabase.from('PlatformConfig').select('*').limit(1).single()
  const minWithdrawal = (configAll as any)?.min_withdrawal ?? 5000

  // 3. Fetch ONLY pending withdrawals (Idempotency: don't touch processing/paid)
  const { data: pendingWithdrawals, error: fetchError } = await supabase
    .from('Withdrawal')
    .select('id, amount, vendor_id, wallet_id, store_id, payment_method, phone_or_iban, notes, Store (user_id, whatsapp, User (phone))')
    .eq('status', 'pending')

  if (fetchError) {
    console.error('[CRON retrait-auto] Erreur fetch withdrawals:', fetchError.message)
    return cronResponse({ error: fetchError.message }, 500)
  }

  const withdrawals = pendingWithdrawals ?? []
  let processed = 0
  let failed = 0

  // 4. Process each pending withdrawal
  for (const w of withdrawals) {
    // A. Validation du montant minimum
    if (w.amount < minWithdrawal) {
      console.error(`[CRON] Retrait ${w.id} rejeté: Montant (${w.amount}) < minimum (${minWithdrawal})`)
      await supabase.from('Withdrawal').update({ status: 'rejected', notes: 'Montant inférieur au minimum' }).eq('id', w.id)
      
      // Restauration atomique: Balance +, Pending -
      await supabase.rpc('unfreeze_commission', { p_vendor_id: w.store_id, p_commission: w.amount })
      failed++
      continue
    }

    // B. Verrouillage Optimiste (Atomic row lock)
    // Sélection avec UPDATE pour s'assurer que personne d'autre n'a pris ce retrait (double-retrait)
    const { data: locked, error: lockErr } = await supabase
      .from('Withdrawal')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', w.id)
      .eq('status', 'pending')
      .select('id')

    if (lockErr || !locked || locked.length === 0) {
      console.error(`[CRON] Retrait ${w.id} ignoré: Déjà verrouillé.`)
      continue
    }

    // C. Configuration du Payout
    const storeData = w.Store as any
    const vendorPhone = w.phone_or_iban || storeData?.whatsapp || storeData?.User?.[0]?.phone || storeData?.User?.phone

    if (!vendorPhone) {
      console.error(`[CRON] Retrait ${w.id} échoué: phone_or_iban introuvable.`)
      await supabase.from('Withdrawal').update({ status: 'rejected', notes: 'Téléphone introuvable' }).eq('id', w.id)
      await supabase.rpc('unfreeze_commission', { p_vendor_id: w.store_id, p_commission: w.amount })
      failed++
      continue
    }

    // D. Exécution du Payout avec Catch
    try {
      const { executePayout } = await import('@/lib/payouts/payout-service')
      const payoutResult = await executePayout({
        phone: vendorPhone,
        amount: w.amount,
        reference: w.id,
        method: w.payment_method
      })

      if (payoutResult.success) {
        // Succès: Statut paid
        await supabase.from('Withdrawal').update({ status: 'paid', notes: payoutResult.transactionId }).eq('id', w.id)
        
        // Nettoyage: la demande de retrait a déjà débité la balance pour geler dans 'pending'. Il faut déduire 'pending'
        await supabase.rpc('release_commission', { p_vendor_id: w.store_id, p_commission: w.amount })
        processed++
      } else {
        // Réfus API (CinetPay / Wave error / Insufficient Balance)
        console.error(`[CRON] Payout refusé pr ${w.id}: ${payoutResult.error}`)
        const alertMsg = 'ALERT: ' + payoutResult.error
        
        // On remet en state 'pending', on ne débloque pas l'argent
        await supabase.from('Withdrawal').update({ status: 'pending', notes: alertMsg }).eq('id', w.id)
        
        // On notifie le vendeur uniquement si ce n'était pas DÉJÀ en alerte (pour éviter le spam toutes les 5 min)
        if (!(w as any).notes?.startsWith('ALERT:')) {
          await supabase.from('Notification').insert({
            user_id: storeData.user_id,
            type: 'wallet_alert',
            title: '⚠️ Retard de Retrait Automatique',
            message: `Votre transfert de ${w.amount.toLocaleString()} FCFA est mis en attente suite à un problème de réseau fournisseur (${payoutResult.error}). Il sera relancé automatiquement.`,
            link: '/dashboard/wallet'
          })
        }
        failed++
      }
    } catch (error: any) {
      // Timeout / Crash Critique
      console.error(`[CRON] Exception réseau sur ${w.id}:`, error)
      const alertMsg = 'ALERT: Exception - ' + error.message
      
      await supabase.from('Withdrawal').update({ status: 'pending', notes: alertMsg }).eq('id', w.id)
      
      if (!w.notes?.startsWith('ALERT:')) {
        await supabase.from('Notification').insert({
          user_id: storeData.user_id,
          type: 'wallet_alert',
          title: '⚠️ Retard de Retrait Automatique',
          message: `Votre transfert de ${w.amount.toLocaleString()} FCFA est retardé à cause d'un délai réseau. Il sera traité sous peu.`,
          link: '/dashboard/wallet'
        })
      }
      failed++
    }
  }

  return cronResponse({ checked: withdrawals.length, processed, failed })
}
