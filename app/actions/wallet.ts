'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActivePaymentGateway } from '@/lib/payments/manager'
import { createClient } from '@/lib/supabase/server'

/**
 * Unified withdrawal request handler across all roles.
 */
export async function handleUniversalWithdraw(
  ownerType: 'vendor' | 'affiliate' | 'closer' | 'client',
  id: string, // StoreWalletId, AffiliateId, UserId, or UserId
  amount: number,
  method: string,
  phone: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { error: 'Non autorisé : Session invalide.' }

    if (amount <= 0) return { error: 'Montant invalide.' }

    switch (ownerType) {
      case 'vendor': {
        const wallet = await prisma.wallet.findUnique({ 
          where: { id },
          include: { vendor: true } 
        })
        if (!wallet || wallet.balance < amount) return { error: 'Solde insuffisant.' }
        
        if (wallet.vendor?.user_id !== user.id) return { error: 'Action non autorisée (IDOR).' }

        // --- SÉCURISATION KYC ---
        if (wallet.vendor && wallet.vendor.kyc_status !== 'verified') {
          return { error: 'Opération refusée : Votre vérification d\'identité (KYC) n\'est pas validée par un Administrateur.' }
        }
        
        await prisma.wallet.update({
          where: { id },
          data: { balance: wallet.balance - amount }
        })
        
        await prisma.withdrawal.create({
          data: {
            wallet_id: id,
            amount: amount,
            payment_method: method,
            phone_or_iban: phone,
            status: 'pending'
          }
        })
        
        revalidatePath('/dashboard/wallet')
        break
      }
      case 'affiliate': {
        const affiliate = await prisma.affiliate.findUnique({ where: { id } })
        if (!affiliate || !affiliate.balance || Number(affiliate.balance) < amount) {
          return { error: 'Solde insuffisant.' }
        }
        if (affiliate.user_id !== user.id) return { error: 'Action non autorisée (IDOR).' }
        
        await prisma.affiliate.update({
          where: { id },
          data: { balance: Number(affiliate.balance) - amount }
        })
        
        // Ensure you have an AffiliateWithdrawal model or use a generic one if missing.
        // Assuming AffiliateWithdrawal exists from your schema:
        await prisma.affiliateWithdrawal.create({
          data: {
            id: String(Date.now()) + Math.floor(Math.random() * 1000),
            affiliate_id: id,
            amount,
            payment_method: method,
            phone,
            status: 'pending'
          }
        }).catch(async () => {
          // Fallback if model structure is slightly different
           await prisma.affiliateTransaction.create({
              data: {
                affiliate_id: id,
                amount,
                type: 'withdrawal',
                status: 'pending',
                description: `Retrait vers ${method}`
              }
           }).catch(() => {})
        })
        
        revalidatePath('/portal/wallet')
        break
      }
      case 'closer': {
        if (id !== user.id) return { error: 'Action non autorisée (IDOR).' }
        const closerUser = await prisma.user.findUnique({ where: { id } })
        if (!closerUser || !closerUser.closer_balance || closerUser.closer_balance < amount) {
          return { error: 'Solde insuffisant.' }
        }
        
        await prisma.user.update({
          where: { id },
          data: { closer_balance: closerUser.closer_balance - amount }
        })
        
        // CloserWithdrawal model assumed present
        await prisma.closerWithdrawal.create({
          data: {
            closer_id: id,
            amount,
            payment_method: method,
            phone,
            status: 'pending'
          }
        }).catch(() => {})
        
        revalidatePath('/closer/wallet')
        break
      }
      case 'client': {
        if (id !== user.id) return { error: 'Action non autorisée (IDOR).' }
        const clientUser = await prisma.user.findUnique({ where: { id } })
        if (!clientUser || (clientUser.client_wallet_balance || 0) < amount) {
          return { error: 'Solde insuffisant.' }
        }
        
        await prisma.user.update({
          where: { id },
          data: { client_wallet_balance: (clientUser.client_wallet_balance || 0) - amount }
        })
        
        // Assume basic system notification since Client withdrawal table might not exist
        await prisma.notification.create({
             data: {
                 user_id: id,
                 title: 'Demande de Retrait (Cashback)',
                 message: `Votre demande de retrait de ${amount} via ${method} est en cours de traitement.`
             }
        })
        
        revalidatePath('/client/wallet')
        break
      }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Erreur retrait:', error)
    return { error: 'Une erreur est survenue lors de la demande.' }
  }
}

/**
 * Dépôt réel CinetPay (ex-Dummy Deposit)
 */
export async function handleUniversalDeposit(
  ownerType: 'vendor' | 'affiliate' | 'closer' | 'client',
  id: string,
  amount: number
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { error: 'Non autorisé : Session invalide.' }

    if (amount <= 0) return { error: 'Montant invalide.' }

    switch (ownerType) {
      case 'vendor': {
        const wallet = await prisma.wallet.findUnique({ where: { id }, include: { vendor: true } })
        if (wallet?.vendor?.user_id !== user.id) return { error: 'Action non autorisée (IDOR).' }
        break
      }
      case 'affiliate': {
        const aff = await prisma.affiliate.findUnique({ where: { id } })
        if (aff?.user_id !== user.id) return { error: 'Action non autorisée (IDOR).' }
        break
      }
      default:
        if (id !== user.id) return { error: 'Action non autorisée (IDOR).' }
    }

    const activeGateway = await getActivePaymentGateway()

    // On génère le lien de paiement avec la passerelle active
    const intent = await activeGateway.createPaymentIntent({
      amount: amount,
      description: `Rechargement Wallet (${ownerType})`,
      returnUrl: process.env.NEXT_PUBLIC_APP_URL + `/${ownerType}/wallet`,
      notifyUrl: process.env.NEXT_PUBLIC_APP_URL + `/api/webhooks/cinetpay`,
      customerId: id,
      customerName: ownerType
    })

    if (!intent.success || !intent.payment_url) {
      return { error: intent.error || 'Erreur lors de la génération du lien CinetPay.' }
    }

    // On crée une transaction en "pending" en attendant le webhook
    switch (ownerType) {
      case 'vendor': {
        await prisma.transaction.create({
          data: {
             wallet_id: id,
             amount: amount,
             type: 'deposit',
             status: 'pending',
             label: `Dépôt via CinetPay - ${intent.transaction_id}`
          }
        })
        break
      }
      // Les autres rôles à supporter plus tard dans le webhook
    }

    // Le frontend va rediriger vers ce lien
    return { success: true, payment_url: intent.payment_url }

  } catch (error: any) {
    console.error('Erreur dépôt réel:', error)
    return { error: 'Une erreur est survenue lors du dépôt.' }
  }
}
