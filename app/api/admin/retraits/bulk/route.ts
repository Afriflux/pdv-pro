import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { triggerPaymentTelegram } from '@/lib/telegram/notify-hooks'
import { sendWhatsApp, msgWithdrawalApproved } from '@/lib/whatsapp/sendWhatsApp'

// ----------------------------------------------------------------
// API : BULK ACTIONS ADMIN SUR RETRAITS
// POST /api/admin/retraits/bulk
// ----------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 1. Vérifier le rôle super_admin
    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { ids, action } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0 || action !== 'approve') {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    // Récupérer tous les retraits valides en une fois
    const { data: withdrawals, error: fetchError } = await supabaseAdmin
      .from('Withdrawal')
      .select('*, Store (name, user_id, whatsapp, User (phone))')
      .in('id', ids)
      .eq('status', 'pending')

    if (fetchError || !withdrawals || withdrawals.length === 0) {
      return NextResponse.json({ error: 'Aucune demande valide trouvée' }, { status: 404 })
    }

    const results = []
    let totalApprovedAmount = 0
    let approvedCount = 0

    // Traitement séquentiel pour des questions de sécurité du solde Wallet
    // ou parallèle si on gère bien la concurrence. Le séquentiel est plus sûr pour les wallets de la même boutique.
    for (const withdrawal of withdrawals) {
      try {
        const withdrawalId = withdrawal.id
        // 3a. Vérifier le solde du Wallet
        const { data: wallet } = await supabaseAdmin
          .from('Wallet')
          .select('balance')
          .eq('id', withdrawal.wallet_id)
          .single()

        if (!wallet || wallet.balance < withdrawal.amount) {
          await supabaseAdmin
            .from('Withdrawal')
            .update({ status: 'insufficient_funds' })
            .eq('id', withdrawalId)
          
          results.push({ id: withdrawalId, status: 'failed', reason: 'Fonds insuffisants' })
          continue
        }

        // 3b. Débiter le wallet et approuver
        const { error: debitError } = await supabaseAdmin
          .from('Wallet')
          .update({ balance: wallet.balance - withdrawal.amount })
          .eq('id', withdrawal.wallet_id)

        if (debitError) throw debitError

        await supabaseAdmin
          .from('Withdrawal')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('id', withdrawalId)

        // Payout automatique via Wave/CinetPay
        try {
          const { executePayout } = await import('@/lib/payouts/payout-service')
          
          let vendorPhone = withdrawal.phone_or_iban
          if (!vendorPhone) {
            const storeData = withdrawal.Store as any
            vendorPhone = storeData?.whatsapp || (storeData?.User && storeData.User[0]?.phone) || storeData?.User?.phone
          }

          if (!vendorPhone) throw new Error('Aucun numéro')

          const payoutResult = await executePayout({
            phone: vendorPhone,
            amount: withdrawal.amount,
            reference: withdrawalId,
            method: withdrawal.payment_method
          })

          if (payoutResult.success) {
            await supabaseAdmin
              .from('Withdrawal')
              .update({ status: 'paid', processed_at: new Date().toISOString(), notes: payoutResult.transactionId })
              .eq('id', withdrawalId)
              
            totalApprovedAmount += withdrawal.amount
            approvedCount++
            results.push({ id: withdrawalId, status: 'paid' })

            // Notifications
            try {
              await triggerPaymentTelegram(
                (withdrawal.Store as any).user_id,
                withdrawal.amount,
                withdrawal.payment_method
              )
              await sendWhatsApp({
                to: vendorPhone,
                body: msgWithdrawalApproved({ amount: withdrawal.amount, method: withdrawal.payment_method })
              })
            } catch (notifyError) {
              console.warn('[Admin Bulk] Erreur notification:', notifyError)
            }
          } else {
            // Échec du payout → Rejeter et recréditer
            await supabaseAdmin
              .from('Withdrawal')
              .update({ status: 'rejected', processed_at: new Date().toISOString(), notes: payoutResult.error })
              .eq('id', withdrawalId)

            await supabaseAdmin
              .from('Wallet')
              .update({ balance: wallet.balance }) 
              .eq('id', withdrawal.wallet_id)
              
            results.push({ id: withdrawalId, status: 'failed', reason: 'Erreur Payout' })
          }

        } catch (payoutError: any) {
          await supabaseAdmin
            .from('Withdrawal')
            .update({ status: 'rejected', notes: payoutError.message })
            .eq('id', withdrawalId)
          await supabaseAdmin
            .from('Wallet')
            .update({ balance: wallet.balance })
            .eq('id', withdrawal.wallet_id)
            
          results.push({ id: withdrawalId, status: 'failed', reason: payoutError.message })
        }

      } catch (error: unknown) {
        results.push({ id: withdrawal.id, status: 'failed', reason: (error instanceof Error ? error.message : String(error)) })
      }
    }

    // 5. Audit Log (Un seul regroupant tous)
    if (approvedCount > 0) {
       await supabaseAdmin
        .from('AdminLog')
        .insert({
          admin_id: user.id,
          action: 'BULK_APPROVE_WITHDRAWALS',
          target_type: 'withdrawal_batch',
          target_id: 'batch_' + new Date().getTime(),
          details: { 
            processed_count: approvedCount,
            total_amount: totalApprovedAmount,
            ids: results.filter(r => r.status === 'paid').map(r => r.id)
          }
        })
    }

    return NextResponse.json({ success: true, processed: withdrawals.length, approved: approvedCount, results })

  } catch (error: unknown) {
    console.error('[Admin Bulk Withdrawal Error]:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
