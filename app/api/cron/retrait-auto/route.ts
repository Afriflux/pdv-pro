import { verifyCronSecret, cronResponse, isOlderThan } from '@/lib/cron/cron-helpers'
import { createAdminClient } from '@/lib/supabase/admin'

interface StuckWithdrawal {
  id: string
  created_at: string
  amount: number
  vendor_id: string
}

export async function POST(req: Request) {
  // 1. Vérifier le secret CRON
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()

  // 2. Récupérer tous les retraits en status 'processing'
  const { data: stuckWithdrawals, error: fetchError } = await supabase
    .from('Withdrawal')
    .select('id, created_at, amount, vendor_id')
    .eq('status', 'processing')

  if (fetchError) {
    console.error('[CRON retrait-auto] Erreur lors de la récupération des retraits :', fetchError.message)
    return cronResponse({ error: fetchError.message }, 500)
  }

  const withdrawals = (stuckWithdrawals ?? []) as StuckWithdrawal[]
  let fixed = 0

  // 3. Filtrer ceux bloqués depuis plus d'1h et les débloquer
  for (const withdrawal of withdrawals) {
    if (!isOlderThan(withdrawal.created_at, 1)) continue

    const { error: updateError } = await supabase
      .from('Withdrawal')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawal.id)

    if (updateError) {
      console.error(
        `[CRON retrait-auto] Échec mise à jour retrait ${withdrawal.id} :`,
        updateError.message
      )
      continue
    }

    console.warn(
      `[CRON retrait-auto] ⚠️ Retrait bloqué débloqué — id: ${withdrawal.id}, montant: ${withdrawal.amount} FCFA, vendor: ${withdrawal.vendor_id}`
    )
    fixed++
  }

  // 4. Retourner le résultat
  return cronResponse({ checked: withdrawals.length, fixed })
}
