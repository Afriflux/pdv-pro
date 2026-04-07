import { prisma } from '@/lib/prisma'

export const AI_PRICING = {
  COACH_MESSAGE: 10,     // 10 FCFA par message pour le Coach IA
  COPYWRITING_SHORT: 15, // 15 FCFA pour de la copie courte (description de produit)
  COPYWRITING_LONG: 25   // 25 FCFA pour scripts, emails longs
}

/**
 * Débite le portefeuille lors d'un appel API Intelligence Artificielle.
 * Lance une erreur si le fond est insuffisant.
 */
export async function chargeForAI(
  ownerType: 'vendor' | 'affiliate' | 'closer',
  ownerId: string, 
  amountFCFA: number, 
  reason: string
) {
  // 1. Vérification et Déduction atomique
  if (amountFCFA <= 0) return true;

  try {
    switch (ownerType) {
      case 'vendor': {
        const wallet = await prisma.wallet.findUnique({ where: { id: ownerId } })
        if (!wallet || wallet.balance < amountFCFA) {
          throw new Error('Fonds insuffisants pour cet outil IA. Veuillez recharger votre solde.')
        }

        await prisma.$transaction([
          prisma.wallet.update({
             where: { id: ownerId },
             data: { balance: { decrement: amountFCFA } }
          }),
          prisma.withdrawal.create({
             data: {
                wallet_id: ownerId,
                amount: amountFCFA,
                payment_method: 'internal_ai',
                status: 'paid',
                notes: `Service IA : ${reason}`
             }
          })
        ])
        break;
      }
      // On peut ajouter la logique pour 'affiliate' ou 'closer' s'ils ont le droit d'utiliser l'IA
    }
    return true;

  } catch (error: any) {
    console.error('Erreur Pay-as-you-go IA:', error)
    if (error.message.includes('Fonds insuffisants')) {
      throw error;
    }
    throw new Error('Erreur système de facturation IA.');
  }
}
