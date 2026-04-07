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
          label: `Achat de la ressource premium : ${assetName}`
        }
      })

      // Grant access
      await tx.assetPurchase.create({
        data: {
          store_id: store.id,
          asset_id: assetId,
          asset_type: assetType,
          amount_paid: amount
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
  if (!userData?.user) return { success: false, purchases: [], installedApps: [] }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id },
    include: { installedApps: true, assetPurchases: true }
  })

  if (!store) return { success: false, purchases: [], installedApps: [] }

  const purchases = store.assetPurchases.map((p: any) => p.asset_id)
  const installedApps = store.installedApps.map((a: any) => a.app_id)

  return { success: true, purchases, installedApps }
}

export async function installAppAction(appId: string, amount: number, appName: string) {
  const supabase = await createClient()
  const { data: userData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !userData?.user) return { success: false, error: 'Non autorisé' }

  const store = await prisma.store.findUnique({
    where: { user_id: userData.user.id },
    include: { wallet: true }
  })

  if (!store) return { success: false, error: 'Boutique introuvable' }
  const wallet = store.wallet

  const alreadyInstalled = await prisma.installedApp.findUnique({
    where: { store_id_app_id: { store_id: store.id, app_id: appId } }
  })

  if (alreadyInstalled) {
    return { success: true, message: 'Déjà installée' }
  }

  if (amount > 0) {
    if (!wallet) {
      return { success: false, error: 'Portefeuille introuvable. Veuillez configurer votre wallet.' }
    }
    if (wallet.balance < amount) {
      return { 
        success: false, 
        error: 'Solde insuffisant.', 
        details: `Il vous manque ${amount - wallet.balance} FCFA.` 
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (amount > 0 && wallet) {
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
            label: `Achat de la fonctionnalité : ${appName}`
          }
        })

        // Log asset purchase history as well for logs, even if it's an app
        await tx.assetPurchase.create({
          data: {
            store_id: store.id,
            asset_id: appId,
            asset_type: 'APP',
            amount_paid: amount
          }
        })
      }

      await tx.installedApp.create({
        data: {
          store_id: store.id,
          app_id: appId,
          status: 'active'
        }
      })
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/marketplace')
    
    return { success: true }
  } catch (err: any) {
    console.error('App install error', err)
    return { success: false, error: 'Erreur lors de l\'installation. Veuillez réessayer.' }
  }
}
