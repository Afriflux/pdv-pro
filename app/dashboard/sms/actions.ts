'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function purchaseSmsAction(packCode: string, smsCount: number, price: number) {
  const supabase = await createClient()
  const { data: userData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id },
    include: { wallet: true, sms_credits: true }
  })

  if (!store || !store.wallet) return { success: false, error: 'Boutique ou portefeuille introuvable' }
  const wallet = store.wallet

  const postPurchaseBalance = wallet.balance - price;

  if (postPurchaseBalance < 0) {
    if (wallet.total_earned < 100000) {
      return { 
        success: false, 
        error: 'Solde insuffisant.', 
        details: `Solde actuel: ${wallet.balance} FCFA. Un Chiffre d'Affaire Global >= 100 000 FCFA est requis pour débloquer le crédit vendeur.` 
      }
    }
    
    if (postPurchaseBalance < -10000) {
      return {
        success: false,
        error: 'Plafond de Découvert Atteint.',
        details: `Cette transaction porterait votre dette à ${postPurchaseBalance} FCFA, dépassant la limite stricte de -10 000 FCFA.`
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: price } }
      })

      // Log transaction
      await tx.transaction.create({
        data: {
          wallet_id: wallet.id,
          type: 'asset_purchase',
          amount: price,
          status: 'completed',
          label: `Achat Pack SMS : ${packCode} (${smsCount} SMS)`
        }
      })

      // Log Asset Purchase
      await tx.assetPurchase.create({
        data: {
          store_id: store.id,
          asset_id: `SMS_${packCode}`,
          asset_type: 'SMS',
          amount_paid: price
        }
      })

      // Give SMS
      const existingCredit = await tx.smsCredit.findFirst({ where: { store_id: store.id } })
      if (existingCredit) {
         await tx.smsCredit.update({
            where: { id: existingCredit.id },
            data: { credits: { increment: smsCount } }
         })
      } else {
         await tx.smsCredit.create({
            data: { store_id: store.id, credits: smsCount, used: 0 }
         })
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/sms')
    
    return { success: true }
  } catch (err: any) {
    console.error('Purchase SMS error', err)
    return { success: false, error: 'Erreur technique lors de la recharge SMS.' }
  }
}
