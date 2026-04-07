'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { randomUUID } from 'crypto'
export async function requestWithdrawal(affiliateId: string, amount: number, paymentMethod: string, phone: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Non autorisé.' }
    }

    // Vérifier l'affilié
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        user_id: user.id
      }
    })

    if (!affiliate) {
      return { error: "Compte affilié introuvable ou non autorisé." }
    }

    // Vérifier le KYC
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kyc_status: true }
    })

    if (!userProfile || userProfile.kyc_status !== 'verified') {
      return { error: "Action non autorisée. Votre identité doit être vérifiée (KYC) pour effectuer un retrait." }
    }

    if (amount > Number(affiliate.balance || 0)) {
      return { error: "Solde insuffisant pour ce retrait." }
    }

    if (amount < 10000) {
      return { error: "Le montant minimum de retrait est de 10 000 FCFA." }
    }

    if (!phone || phone.length < 9) {
      return { error: "Numéro de téléphone invalide." }
    }

    // Créer la transaction de retrait avec Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Déduire le montant de la balance de l'affilié
      await tx.affiliate.update({
        where: { id: affiliateId },
        data: {
          balance: { decrement: amount }
        }
      })

      // 2. Créer l'historique de retrait
      await tx.affiliateWithdrawal.create({
        data: {
          id: randomUUID(),
          affiliate_id: affiliateId,
          amount,
          payment_method: paymentMethod,
          phone,
          status: 'pending'
        }
      })
    })

    revalidatePath('/portal/wallet')
    return { success: true }
  } catch (err: any) {
    console.error("Withdrawal error:", err)
    return { error: "Une erreur est survenue lors de la demande." }
  }
}
