import { prisma } from '@/lib/prisma'

export async function confirmB2BAssetPurchase(intentId: string) {
  // intentId == 'B2B_transctionuuid'
  const txId = intentId.replace('B2B_', '')
  
  const transaction = await prisma.transaction.findUnique({
    where: { id: txId }
  })

  if (!transaction) {
    throw new Error(`Transaction B2B introuvable : ${txId}`)
  }

  if (transaction.status === 'completed') {
    console.log(`[B2B] Transaction ${txId} déjà validée.`)
    return
  }

  const payload = JSON.parse(transaction.label || '{}')
  const { assetId, assetType, storeId } = payload

  await prisma.$transaction(async (tx) => {
    // 1. Marquer la transaction Webhook comme réussie et vérifier l'atomicité
    const updateResult = await tx.transaction.updateMany({
      where: { id: transaction.id, status: 'pending' },
      data: { status: 'completed' }
    })

    if (updateResult.count === 0) {
      console.log(`[B2B Race Condition] Transaction ${txId} déjà validée par une autre requête.`)
      return
    }

    // 2. Livrer le produit
    if (assetType === 'SMS') {
       // Le payload de SMS a assetId = "sms_200" ou similaire.
       // On doit retrouver le count.
       // On peut extraire depuis le packCode
       // Wait, on n'a pas count dans le JSON. On n'a mis que: { assetId, assetType, assetName, storeId }
       // assetId c'est le "code". Ex: 'sms_200', count=200
       const parts = assetId.split('_')
       const count = parseInt(parts[1]) || 0
       
       const existingCredit = await tx.smsCredit.findFirst({ where: { store_id: storeId } })
       if (existingCredit) {
         await tx.smsCredit.update({
            where: { id: existingCredit.id },
            data: { credits: { increment: count } }
         })
       } else {
         await tx.smsCredit.create({
            data: { store_id: storeId, credits: count, used: 0 }
         })
       }

       await tx.assetPurchase.create({
         data: {
           store_id: storeId,
           asset_id: `SMS_${assetId}`,
           asset_type: 'SMS',
           amount_paid: transaction.amount
         }
       })

    } else if (assetType === 'APP' || assetType === 'TEMPLATE' || assetType === 'WORKFLOW') {
       await tx.installedApp.create({
         data: {
           store_id: storeId,
           app_id: assetId,
           status: 'active'
         }
       })

       await tx.assetPurchase.create({
         data: {
           store_id: storeId,
           asset_id: assetId,
           asset_type: assetType,
           amount_paid: transaction.amount
         }
       })
    } else if (assetType === 'AI') {
       const parts = assetId.split('_')
       const count = parseInt(parts[1]) || 0
       
       await tx.store.update({
         where: { id: storeId },
         data: { ai_credits: { increment: count } }
       })

       await tx.assetPurchase.create({
         data: {
           store_id: storeId,
           asset_id: `AI_${assetId}`,
           asset_type: 'AI',
           amount_paid: transaction.amount
         }
       })
    } else {
      // Cours ou autre asset
      await tx.assetPurchase.create({
        data: {
           store_id: storeId,
           asset_id: assetId,
           asset_type: assetType,
           amount_paid: transaction.amount
        }
      })
    }
  })
}
