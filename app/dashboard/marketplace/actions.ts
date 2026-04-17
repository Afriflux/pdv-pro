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

  // Check balance and Pay Later eligibility
  const postPurchaseBalance = wallet.balance - amount;

  if (postPurchaseBalance < 0) {
    // Si Total Earned < 100000, ils n'ont pas droit au découvert
    if (wallet.total_earned < 100000) {
      return { 
        success: false, 
        error: 'Solde insuffisant.', 
        details: `Solde actuel: ${wallet.balance} FCFA. Un Chiffre d'Affaire Global >= 100 000 FCFA est requis pour débloquer le crédit vendeur.` 
      }
    }
    
    // Si ça dépasse le plafond rouge de -10 000 FCFA
    if (postPurchaseBalance < -10000) {
      return {
        success: false,
        error: 'Plafond de Découvert Atteint.',
        details: `Cette transaction ( ${amount} FCFA ) porterait votre dette à ${postPurchaseBalance} FCFA, dépassant la limite autorisée de -10 000 FCFA.`
      }
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
    const postPurchaseBalance = wallet.balance - amount;

    if (postPurchaseBalance < 0) {
      if (wallet.total_earned < 100000) {
        return { 
          success: false, 
          error: 'Solde insuffisant.', 
          details: `Un Chiffre d'Affaire Global >= 100 000 FCFA est requis pour débloquer l'Achat à Découvert.` 
        }
      }
      
      if (postPurchaseBalance < -10000) {
        return {
          success: false,
          error: 'Plafond de Découvert Atteint.',
          details: `Cette transaction ( ${amount} FCFA ) porterait votre dette à ${postPurchaseBalance} FCFA, dépassant la limite autorisée de -10 000 FCFA.`
        }
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
