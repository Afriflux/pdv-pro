import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

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

    // 4. SÉCURISATION TRANSACTIONNELLE PRISMA (Anti Double-Spend / Hack)
    // Sécurise la déduction asynchrone contre l'envoi massif de la même requête
    let newTxId: string | null = null

    try {
      await prisma.$transaction(async (tx) => {
        // Déduction stricte et atomique (Lock gte: amount)
        const updateResult = await tx.ambassador.updateMany({
          where: { id: ambassadorId, balance: { gte: amount } },
          data: { balance: { decrement: amount } }
        })
        
        if (updateResult.count === 0) {
          throw new Error('INSUFFICIENT_BALANCE')
        }

        // Enregistrer la transaction de retrait
        const createdTx = await tx.ambassadorTransaction.create({
          data: {
             ambassador_id: ambassadorId,
             type: 'withdrawal',
             amount: amount,
             status: 'pending',
             description: `Retrait via ${method === 'wave' ? 'Wave' : 'Orange Money'} — ${phone}`
          }
        })
        newTxId = createdTx.id
      })
    } catch (txError: any) {
      if (txError.message === 'INSUFFICIENT_BALANCE') {
        return NextResponse.json(
          { error: `Solde insuffisant ou traitement déjà en cours.` },
          { status: 400 }
        )
      }
      throw txError
    }

    // Payout automatique via Wave/CinetPay
    const { executePayout } = await import('@/lib/payouts/payout-service')
    const payoutResult = await executePayout({
      phone,
      amount,
      reference: newTxId || `${ambassadorId}-${Date.now()}`,
      method
    })

    if (!payoutResult.success) {
      // Échec du payout : on restitue le solde (rollback manuel post-API)
      await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: { balance: { increment: amount } }
      })
      if (newTxId) {
        await prisma.ambassadorTransaction.update({
           where: { id: newTxId },
           data: { status: 'failed' }
        })
      }
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // Succès total
    if (newTxId) {
      await prisma.ambassadorTransaction.update({
         where: { id: newTxId },
         data: { status: 'completed' }
      })
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
