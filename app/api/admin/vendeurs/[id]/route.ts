import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// ----------------------------------------------------------------
// API : ACTIONS ADMIN SUR VENDEUR
// PATCH /api/admin/vendeurs/[id]
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

    const supabaseAdmin = createAdminClient()
    const { data: adminUser } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser?.role || !['super_admin', 'gestionnaire', 'support'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body
    const vendorId = params.id

    // ── ÉDITION COMPLÈTE ──────────────────────────────────────────
    if (action === 'edit_info') {
      const { userId, updates } = body

      // Update User table (nom, email, téléphone, rôle)
      const userUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) userUpdates.name = updates.name
      if (updates.email !== undefined) userUpdates.email = updates.email
      if (updates.phone !== undefined) userUpdates.phone = updates.phone || null
      if (updates.role !== undefined) userUpdates.role = updates.role

      if (Object.keys(userUpdates).length > 0) {
        const { error: userErr } = await supabaseAdmin
          .from('User')
          .update(userUpdates)
          .eq('id', userId)
        if (userErr) throw userErr
      }

      // Update Store table (nom boutique, slug, description, whatsapp, onboarding, kyc)
      const storeUpdates: Record<string, unknown> = {}
      if (updates.store_name !== undefined) storeUpdates.name = updates.store_name
      if (updates.slug !== undefined) storeUpdates.slug = updates.slug
      if (updates.description !== undefined) storeUpdates.description = updates.description || null
      if (updates.whatsapp !== undefined) storeUpdates.whatsapp = updates.whatsapp || null
      if (updates.onboarding_completed !== undefined) storeUpdates.onboarding_completed = updates.onboarding_completed
      if (updates.kyc_status !== undefined) storeUpdates.kyc_status = updates.kyc_status

      // Soft Delete Opérationnel : on met en quarantaine (is_active = false) si le rôle principal n'est plus vendeur
      if (updates.role && updates.role !== 'vendeur') {
        storeUpdates.is_active = false
      }

      if (Object.keys(storeUpdates).length > 0) {
        const { error: storeErr } = await supabaseAdmin
          .from('Store')
          .update(storeUpdates)
          .eq('id', vendorId)
        if (storeErr) throw storeErr
      }

      // Sync Supabase Auth email if changed
      if (updates.email) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { email: updates.email })
      }

      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'EDIT_VENDOR_INFO',
        target_type: 'vendor',
        target_id: vendorId,
        details: { fields_updated: Object.keys(updates), updates }
      })

      return NextResponse.json({ success: true })
    }

    // ── RÉINITIALISATION MOT DE PASSE ─────────────────────────────
    if (action === 'reset_password') {
      const { userId } = body

      // Récupérer l'email de l'utilisateur
      const { data: targetUser } = await supabaseAdmin
        .from('User')
        .select('email')
        .eq('id', userId)
        .single()

      if (!targetUser?.email) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      }

      // Générer le lien de réinitialisation
      const { error: resetErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetUser.email,
      })

      if (resetErr) throw resetErr

      // Log
      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'RESET_PASSWORD_LINK',
        target_type: 'vendor',
        target_id: vendorId,
        details: { email: targetUser.email }
      })

      return NextResponse.json({ success: true, email: targetUser.email })
    }

    // ── CRÉDIT WALLET ─────────────────────────────────────────────
    if (action === 'credit_wallet') {
      const { amount, reason } = body
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
      }

      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from('Wallet')
        .select('id, balance, total_earned')
        .eq('vendor_id', vendorId)
        .single()

      if (walletErr || !wallet) {
        return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 })
      }

      const { error: updateErr } = await supabaseAdmin
        .from('Wallet')
        .update({
          balance: Number(wallet.balance) + amount,
          total_earned: Number(wallet.total_earned) + amount,
        })
        .eq('id', wallet.id)

      if (updateErr) throw updateErr

      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'CREDIT_WALLET',
        target_type: 'vendor',
        target_id: vendorId,
        details: { amount, reason: reason || 'Crédit manuel admin', new_balance: Number(wallet.balance) + amount }
      })

      return NextResponse.json({ success: true, new_balance: Number(wallet.balance) + amount })
    }

    // ── DÉBIT WALLET ──────────────────────────────────────────────
    if (action === 'debit_wallet') {
      const { amount, reason } = body
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
      }

      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from('Wallet')
        .select('id, balance')
        .eq('vendor_id', vendorId)
        .single()

      if (walletErr || !wallet) {
        return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 })
      }

      if (Number(wallet.balance) < amount) {
        return NextResponse.json({ error: `Solde insuffisant (${wallet.balance} FCFA disponible)` }, { status: 400 })
      }

      const { error: updateErr } = await supabaseAdmin
        .from('Wallet')
        .update({ balance: Number(wallet.balance) - amount })
        .eq('id', wallet.id)

      if (updateErr) throw updateErr

      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'DEBIT_WALLET',
        target_type: 'vendor',
        target_id: vendorId,
        details: { amount, reason: reason || 'Débit manuel admin', new_balance: Number(wallet.balance) - amount }
      })

      return NextResponse.json({ success: true, new_balance: Number(wallet.balance) - amount })
    }

    // ── REMBOURSEMENT COMMANDE ────────────────────────────────────
    if (action === 'refund_order') {
      const { orderId, reason, confirmAmount, refundRule = 'A' } = body

      // 1. Charger la commande
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('Order')
        .select('id, status, total, vendor_amount, platform_fee, delivery_fee, delivery_commission, store_id, closer_id, closer_commission, affiliate_commission')
        .eq('id', orderId)
        .single()

      if (orderErr || !order) {
        return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
      }

      if (order.status === 'refunded' || order.status === 'cancelled') {
        return NextResponse.json({ error: 'Commande déjà remboursée/annulée' }, { status: 400 })
      }

      // 2. Double validation montant (Adaptation Règle A ou B)
      const isRuleA = refundRule === 'A'
      const deliveryFee = Number(order.delivery_fee || 0)
      const expectedConfirm = isRuleA ? Number(order.total) - deliveryFee : Number(order.total)

      if (confirmAmount !== expectedConfirm) {
        return NextResponse.json({ error: `Le montant de confirmation doit être exactement de ${expectedConfirm} FCFA pour cette règle` }, { status: 400 })
      }

      // 3. Restituer les fonds — Vendeur
      let vendorDeduction = Number(order.vendor_amount || 0)
      if (!isRuleA) {
        // En Règle B, c'est le vendeur qui absorbe la course du livreur !
        vendorDeduction += Number(order.delivery_commission || 0)
      }

      if (vendorDeduction > 0) {
        const { data: vendorWallet } = await supabaseAdmin
          .from('Wallet')
          .select('id, balance')
          .eq('vendor_id', order.store_id)
          .single()

        if (vendorWallet) {
          const newBalance = Number(vendorWallet.balance) - vendorDeduction
          
          await supabaseAdmin
            .from('Wallet')
            .update({ balance: newBalance })
            .eq('id', vendorWallet.id)

          // Plafond rouge : si dette dépasse 10 000 FCFA (-10 000), on restreint la boutique
          if (newBalance < -10000) {
              await supabaseAdmin
                 .from('Store')
                 .update({ is_active: false })
                 .eq('id', order.store_id)
                 
              await supabaseAdmin.from('AdminLog').insert({
                 admin_id: user.id,
                 action: 'AUTO_SUSPEND_VENDOR_DEBT',
                 target_type: 'vendor',
                 target_id: order.store_id,
                 details: { reason: 'Plafond de dette atteint suite au remboursement', balance: newBalance }
              })
          }
        }
      }

      // 4. Restituer — Closer (si applicable)
      const closerAmount = Number(order.closer_commission || 0)
      if (closerAmount > 0 && order.closer_id) {
        const { data: closerWallet } = await supabaseAdmin
          .from('Wallet')
          .select('id, balance')
          .eq('vendor_id', order.closer_id)
          .maybeSingle()

        if (closerWallet) {
          const newCloserBalance = Number(closerWallet.balance) - closerAmount
          await supabaseAdmin
            .from('Wallet')
            .update({ balance: newCloserBalance })
            .eq('id', closerWallet.id)
            
          // Si le closer avait un Store, le bloquer s'il descend à < -10000
          if (newCloserBalance < -10000) {
               await supabaseAdmin
                 .from('Store')
                 .update({ is_active: false })
                 .eq('id', order.closer_id)
          }
        }
      }

      // 5. Marquer les commissions affilié comme annulées (si applicable)
      const affiliateAmount = Number(order.affiliate_commission || 0)
      if (affiliateAmount > 0) {
        try {
          await supabaseAdmin
            .from('AffiliateEarning')
            .update({ status: 'cancelled' })
            .eq('order_id', orderId)
        } catch { /* non-bloquant si la table n'existe pas */ }
      }

      // 6. Marquer la commande comme remboursée
      await supabaseAdmin
        .from('Order')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // 7. Log d'audit détaillé
      await supabaseAdmin.from('AdminLog').insert({
        admin_id: user.id,
        action: 'REFUND_ORDER',
        target_type: 'order',
        target_id: orderId,
        details: {
          reason: reason || 'Remboursement admin',
          total: Number(order.total),
          vendor_amount: vendorDeduction,
          platform_fee: Number(order.platform_fee || 0),
          closer_commission: closerAmount,
          affiliate_commission: affiliateAmount,
          store_id: order.store_id,
        }
      })

      return NextResponse.json({ success: true, refunded: Number(order.total) })
    }

    // ── ACTIONS RAPIDES (suspend, activate, verify, reject) ───────
    let updateData = {}
    let logAction = ''

    switch (action) {
      case 'suspend':
        updateData = { is_active: false }
        logAction = 'SUSPEND_VENDOR'
        break
      case 'activate':
        updateData = { is_active: true }
        logAction = 'ACTIVATE_VENDOR'
        break
      case 'verify':
        updateData = { kyc_status: 'verified' }
        logAction = 'APPROVE_KYC'
        break
      case 'reject':
        updateData = { kyc_status: 'rejected' }
        logAction = 'REJECT_KYC'
        break
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('Store')
      .update(updateData)
      .eq('id', vendorId)

    if (updateError) throw updateError

    await supabaseAdmin
      .from('AdminLog')
      .insert({
        admin_id: user.id,
        action: logAction,
        target_type: 'vendor',
        target_id: vendorId,
        details: { reason: body.reason || null }
      })

    return NextResponse.json({ success: true, action, vendorId })

  } catch (error: unknown) {
    console.error('[Admin Vendor Action Error]:', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
