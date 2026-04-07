'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function purchaseAssetAction(
  assetId: string, assetType: 'TEMPLATE' | 'WORKFLOW' | 'MASTERCLASS', 
  
  amount: number,
  assetName: string
) {
  const supabase = await createClient()
  const { data: userData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

  // Check store
  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id },
    include: { wallet: true }
  })

  if (!store) return { success: false, error: 'Boutique introuvable' }
  const wallet = store.wallet

  if (!wallet) {
    return { success: false, error: 'Portefeuille introuvable. Veuillez configurer votre wallet.' }
  }

  // Verification if already purchased
  const alreadyPurchased = await prisma.assetPurchase.findFirst({
    where: { store_id: store.id, asset_id: assetId }
  })

  if (alreadyPurchased) {
    return { success: true, message: 'Déjà acheté' }
  }

  // Check balance
  if (wallet.balance < amount) {
    return { 
      success: false, 
      error: 'Solde insuffisant.', 
      details: `Votre solde est de ${wallet.balance} FCFA. Il vous manque ${amount - wallet.balance} FCFA.` 
    }
  }

  // Transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } }
      })

      // Log transaction
      await tx.transaction.create({
        data: {
          wallet_id: wallet.id,
          type: 'asset_purchase',
          amount: amount,
          status: 'completed',
          description: `Achat de la ressource premium : ${assetName}`,
          reference: `PURCHASE-${Date.now()}`
        }
      })

      // Grant access
      await tx.assetPurchase.create({
        data: {
          store_id: store.id,
          asset_id: assetId,
          asset_type: assetType,
          price: amount
        }
      })
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/pages/new')
    revalidatePath('/dashboard/tips')
    revalidatePath('/dashboard/workflows')
    
    return { success: true }
  } catch (err: any) {
    console.error('Purchase error', err)
    return { success: false, error: 'Erreur lors de la transaction. Veuillez réessayer.' }
  }
}

export async function getVendorPurchasedAssetsAction() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { success: false, purchases: [] }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id }
  })

  if (!store) return { success: false, purchases: [] }

  const purchases = await prisma.assetPurchase.findMany({
    where: { store_id: store.id },
    select: { asset_id: true }
  })

  return { success: true, purchases: purchases.map(p => p.asset_id) }
}
