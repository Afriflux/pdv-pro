'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function purchaseAssetAction(
  assetType: 'app' | 'theme' | 'workflow',
  assetId: string,
  amount: number,
  paymentMethod: 'wallet' | 'gateway'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non autorisé" }

  const { data: store } = await supabase
    .from('Store')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) return { success: false, error: "Boutique non trouvée" }

  try {
    // 1. Vérification si déjà acheté
    const existing = await prisma.assetPurchase.findFirst({
      where: { store_id: store.id, asset_type: assetType, asset_id: assetId }
    })

    if (existing) {
      return { success: false, error: "Cet élément est déjà débloqué sur votre boutique." }
    }

    if (paymentMethod === 'wallet') {
      const wallet = await prisma.wallet.findUnique({ where: { vendor_id: store.id } })
      
      if (!wallet || wallet.balance < amount) {
        return { success: false, error: "Solde Wallet insuffisant pour cet achat." }
      }

      // -- Transaction Atomique --
      await prisma.$transaction([
        // 1. Débit du compte
        prisma.wallet.update({
          where: { vendor_id: store.id },
          data: { balance: { decrement: amount } }
        }),
        
        // 2. Historique des transactions
        prisma.transaction.create({
          data: {
            wallet_id: wallet.id,
            amount: -amount,
            type: 'withdrawal',
            status: 'completed',
            label: `Achat ${assetType.toUpperCase()} - ${assetId}`
          }
        }),

        // 3. Preuve d'achat de la propriété
        prisma.assetPurchase.create({
          data: {
            store_id: store.id,
            asset_type: assetType,
            asset_id: assetId,
            amount_paid: amount
          }
        })
      ])

      // 4. Si c'est une App, on l'installe direct
      if (assetType === 'app') {
        await prisma.installedApp.upsert({
          where: { store_id_app_id: { store_id: store.id, app_id: assetId } },
          update: { status: 'active' },
          create: { store_id: store.id, app_id: assetId, status: 'active' }
        })
      }

      revalidatePath('/dashboard', 'layout')
      return { success: true, method: 'wallet' }
    } else {
      // paymentMethod === 'gateway' (Wave ou CinetPay)
      // Ici on va devoir créer un PaymentLink interne pour rediriger vers la caisse standard
      
      const paymentLink = await prisma.paymentLink.create({
        data: {
          store_id: store.id,
          title: `Achat Asset Yayyam: ${assetType}-${assetId}`,
          amount: amount,
          description: `purchase_asset:${assetType}:${assetId}`,
        }
      })

      // Le Frontend devra rediriger vers /pay-link/[id]
      return { success: true, method: 'gateway', checkoutUrl: `/pay-link/${paymentLink.id}` }
    }

  } catch (error: any) {
    console.error("Erreur à l'achat :", error)
    return { success: false, error: error.message || "Erreur interne" }
  }
}
