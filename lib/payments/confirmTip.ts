import { prisma } from '@/lib/prisma'
import { calculateVendorAmount, type PaymentMethod } from '@/lib/payments/payment-service'

export async function confirmTip(clientReference: string) {
  const transactionId = clientReference.replace('TIP_', '')
  // 1. Récupérer la Transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId }
  })

  if (!transaction) {
    console.error('[confirmTip] Transaction introuvable :', transactionId)
    return
  }

  if (transaction.status === 'completed') {
    console.log('[confirmTip] Transaction déjà confirmée :', transactionId)
    return
  }

  // 2. Extraire la méthode depuis le label
  let method: PaymentMethod = 'wave'
  try {
    if (transaction.label) {
      const parsed = JSON.parse(transaction.label)
      if (parsed.method) method = parsed.method
    }
  } catch (e) {
    // Si parsing échoue on garde la méthode fallback
  }

  const vendorAmount = calculateVendorAmount(transaction.amount, method)

  // 3. Mettre à jour la transaction avec verrouillage en base
  const updateResult = await prisma.transaction.updateMany({
    where: { id: transactionId, status: 'pending' },
    data: { status: 'completed' }
  })

  if (updateResult.count === 0) {
    console.log('[confirmTip] Race condition évitée: Transaction déjà traitée :', transactionId)
    return
  }

  // 4. Créditer le Wallet via Prisma (Incrément Atomique)
  const wallet = await prisma.wallet.findUnique({
    where: { id: transaction.wallet_id },
    select: { id: true, vendor_id: true }
  })

  if (wallet) {
    await prisma.wallet.update({
      where: { id: transaction.wallet_id },
      data: {
        balance: { increment: vendorAmount },
        total_earned: { increment: vendorAmount }
      }
    })

    // 5. Récupérer le user_id rattaché au vendor_id (Store.id)
    const store = await prisma.store.findUnique({
      where: { id: wallet.vendor_id },
      select: { user_id: true }
    })

    if (store?.user_id) {
      // Envoyer une notification au vrai user_id (Propriétaire / Créateur)
      await prisma.notification.create({
        data: {
          user_id: store.user_id,
          type: 'tip',
          title: '☕️ Nouveau Don reçu !',
          message: `Vous venez de recevoir un don de ${transaction.amount} FCFA (Net: ${vendorAmount} FCFA) déposé dans votre portefeuille.`
        }
      })
    }
  }

  console.log('[confirmTip] Don traité avec succès pour la transaction :', transactionId)
}
