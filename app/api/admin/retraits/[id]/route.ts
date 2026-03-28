import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { triggerPaymentTelegram } from '@/lib/telegram/notify-hooks'
import { sendWhatsApp, msgWithdrawalApproved, msgWithdrawalRejected } from '@/lib/whatsapp/sendWhatsApp'

// ----------------------------------------------------------------
// API : ACTIONS ADMIN SUR RETRAITS
// PATCH /api/admin/retraits/[id]
// ----------------------------------------------------------------
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { status, reason } = await request.json()
    const withdrawalId = params.id

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    // 2. Récupérer la demande de retrait
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('Withdrawal')
      .select('*, Store (name, user_id, whatsapp, User (phone))')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 400 })
    }

    // 3. Logique spécifique Approuvé
    if (status === 'approved') {
      // 3a. Vérifier le solde du Wallet
      const { data: wallet } = await supabaseAdmin
        .from('Wallet')
        .select('balance')
        .eq('id', withdrawal.wallet_id)
        .single()

      if (!wallet || wallet.balance < withdrawal.amount) {
        // Optionnel : marquer comme insufficient_funds automatiquement ?
        await supabaseAdmin
          .from('Withdrawal')
          .update({ status: 'insufficient_funds' })
          .eq('id', withdrawalId)
          
        return NextResponse.json({ error: 'Fonds insuffisants dans le wallet vendeur' }, { status: 400 })
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

        if (!vendorPhone) {
          throw new Error('Aucun numéro de téléphone trouvé pour le vendeur')
        }

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
            
          // Notification Telegram & WhatsApp
          try {
            await triggerPaymentTelegram(
              (withdrawal.Store as any).user_id,
              withdrawal.amount,
              withdrawal.payment_method
            )
            if (vendorPhone) {
              await sendWhatsApp({
                to: vendorPhone,
                body: msgWithdrawalApproved({ amount: withdrawal.amount, method: withdrawal.payment_method })
              })
            }
          } catch (notifyError) {
            console.warn('[Admin Withdrawal] Erreur notification:', notifyError)
          }
        } else {
          // Échec du payout → Rejeter et recréditer
          await supabaseAdmin
            .from('Withdrawal')
            .update({ status: 'rejected', processed_at: new Date().toISOString(), notes: payoutResult.error })
            .eq('id', withdrawalId)

          // Recréditer le wallet: On remet l'ancien solde (wallet.balance était l'ancien solde)
          await supabaseAdmin
            .from('Wallet')
            .update({ balance: wallet.balance }) 
            .eq('id', withdrawal.wallet_id)
        }

      } catch (payoutError: unknown) {
        const errMessage = payoutError instanceof Error ? payoutError.message : 'Erreur réseau payout'
        console.error('[Admin Withdrawal] Erreur Payout:', errMessage)
        await supabaseAdmin
          .from('Withdrawal')
          .update({ status: 'rejected', notes: errMessage })
          .eq('id', withdrawalId)

        // Recréditer le wallet
        await supabaseAdmin
          .from('Wallet')
          .update({ balance: wallet.balance })
          .eq('id', withdrawal.wallet_id)
      }

    } else {
      // 4. Logique Rejeté
      await supabaseAdmin
        .from('Withdrawal')
        .update({ status: 'rejected' })
        .eq('id', withdrawalId)

      try {
        let vendorPhone = withdrawal.phone_or_iban
        if (!vendorPhone) {
          const storeData = withdrawal.Store as any
          vendorPhone = storeData?.whatsapp || (storeData?.User && storeData.User[0]?.phone) || storeData?.User?.phone
        }
        if (vendorPhone) {
           await sendWhatsApp({
             to: vendorPhone,
             body: msgWithdrawalRejected({ amount: withdrawal.amount, reason: reason || 'Motif non précisé par l\'administration.' })
           })
        }
      } catch (notifyError) {
        console.warn('[Admin Withdrawal] Erreur notification rejet:', notifyError)
      }
    }

    // 5. Audit Log
    await supabaseAdmin
      .from('AdminLog')
      .insert({
        admin_id: user.id,
        action: status === 'approved' ? 'APPROVE_WITHDRAWAL' : 'REJECT_WITHDRAWAL',
        target_type: 'withdrawal',
        target_id: withdrawalId,
        details: { 
          reason: reason || null,
          vendor_id: withdrawal.store_id,
          amount: withdrawal.amount 
        }
      })

    return NextResponse.json({ success: true, status })

  } catch (error: unknown) {

    console.error('[Admin Withdrawal Action Error]:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
