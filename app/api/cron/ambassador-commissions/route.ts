import { verifyCronSecret, cronResponse } from '@/lib/cron/cron-helpers'
import { processMonthlyAmbassadorCommissions } from '@/lib/ambassador/ambassador-service'

// ─── POST /api/cron/ambassador-commissions ────────────────────────────────────

export async function POST(req: Request) {
  // 1. Vérifier le secret CRON
  if (!verifyCronSecret(req)) {
    return cronResponse({ error: 'Unauthorized' }, 401)
  }

  // 2. Lire le body optionnel
  let bodyMonth: string | undefined
  try {
    const body = (await req.json()) as { month?: string }
    bodyMonth = body.month
  } catch {
    // Body absent ou invalide → on utilisera le mois précédent
    bodyMonth = undefined
  }

  // 3. Déterminer le mois à traiter
  let month: string
  if (bodyMonth && /^\d{4}-\d{2}$/.test(bodyMonth)) {
    month = bodyMonth
  } else {
    // Mois précédent par défaut (cron = 1er du mois courant)
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  }

  console.log(`[CRON ambassador-commissions] Traitement du mois : ${month}`)

  // 4. Traiter les commissions ambassadeurs du mois
  try {
    const { processed, paid, totalAmount } = await processMonthlyAmbassadorCommissions(month)

    console.log(
      `[CRON ambassador-commissions] ✅ processed: ${processed}, paid: ${paid}, totalAmount: ${totalAmount} FCFA`
    )

    return cronResponse({ processed, paid, totalAmount, month })
  } catch (error: unknown) {

    console.error('[CRON ambassador-commissions] ❌ Erreur:', error)
    return cronResponse({ error: error instanceof Error ? error.message : 'Erreur interne', month }, 500)
  }
}
