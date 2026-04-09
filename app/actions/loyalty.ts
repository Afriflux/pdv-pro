'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'

/**
 * Rétablit ou crée la configuration de fidélité pour une boutique
 */
export async function getLoyaltyConfig(storeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const config = await prisma.loyaltyConfig.upsert({
    where: { store_id: storeId },
    update: {},
    create: { store_id: storeId, enabled: false }
  })
  
  return { success: true, config }
}

/**
 * Met à jour la configuration de fidélité
 */
export async function updateLoyaltyConfig(storeId: string, enabled: boolean, points100: number, maxPct: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  // Vérification
  const store = await prisma.store.findUnique({ where: { id: storeId, user_id: user.id } })
  if (!store) throw new Error("Non autorisé")

  const config = await prisma.loyaltyConfig.upsert({
    where: { store_id: storeId },
    update: { enabled, points_per_100: points100, max_redeem_pct: maxPct },
    create: { store_id: storeId, enabled, points_per_100: points100, max_redeem_pct: maxPct }
  })

  return { success: true, config }
}

/**
 * (Logic interne) - Gagne des points après un achat validé
 */
export async function earnLoyaltyPoints(phone: string, storeId: string, amountSpent: number, orderId: string) {
  const account = await prisma.loyaltyAccount.upsert({
    where: { phone },
    update: {},
    create: { phone }
  })

  const config = await prisma.loyaltyConfig.findUnique({ where: { store_id: storeId } })
  if (!config || !config.enabled) return { success: false, reason: "Store loyalty disabled" }

  // Calcul basique: X points = montant/100 * config.points_per_100
  const pointsBase = Math.floor(amountSpent / 100) * config.points_per_100

  // Multiplicateur selon le niveau
  const tier = account.tier
  let multiplier = 1.0
  if (tier === 'silver') multiplier = 1.10
  else if (tier === 'gold') multiplier = 1.25
  else if (tier === 'diamond') multiplier = 1.50

  const pointsEarned = Math.floor(pointsBase * multiplier)
  if (pointsEarned <= 0) return { success: true, points: 0 }

  // Maj de l'account
  const newAccount = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: {
      total_earned: { increment: pointsEarned },
      balance: { increment: pointsEarned }
    }
  })

  // Recalcul du statut (tier)
  let newTier = 'bronze'
  if (newAccount.total_earned >= 5000) newTier = 'diamond'
  else if (newAccount.total_earned >= 2000) newTier = 'gold'
  else if (newAccount.total_earned >= 500) newTier = 'silver'

  if (newTier !== newAccount.tier) {
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier: newTier }
    })
    
    // Log bonus tier change if needed
    await prisma.loyaltyTransaction.create({
      data: {
        account_id: account.id,
        type: 'bonus',
        points: 0,
        description: `Passage au niveau ${newTier.toUpperCase()} !`,
        store_id: storeId
      }
    })
  }

  // Log de la transaction
  await prisma.loyaltyTransaction.create({
    data: {
      account_id: account.id,
      type: 'earn',
      points: pointsEarned,
      description: `Achat (${amountSpent} FCFA)`,
      order_id: orderId,
      store_id: storeId
    }
  })

  // Envoi notification WhatsApp
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    const storeName = store?.name || 'Notre Boutique'
    
    let msg = `🎁 *Fidélité récompensée !*\n\n`
    msg += `Merci pour votre achat sur *${storeName}*.\n`
    msg += `Vous venez de gagner *${pointsEarned} points* !\n\n`
    
    if (newTier !== account.tier) {
      msg += `🎉 Félicitations, vous passez au niveau *${newTier.toUpperCase()}* !\n`
      msg += `Vos futurs achats généreront plus de points.\n\n`
    }
    
    msg += `💳 Solde actuel : *${newAccount.balance} points* (${newAccount.balance} FCFA de réduction sur votre prochain achat).\n\n`
    msg += `À très vite ! 🙏`

    await sendWhatsApp({ to: phone, body: msg })
  } catch (err) {
    console.error('[Loyalty WhatsApp Error]:', err)
  }

  return { success: true, points: pointsEarned }
}

/**
 * (Logic interne) - Dépense des points lors du checkout
 * DOIT APPELER CECI AVANT L'ENREGISTREMENT DE LA COMMANDE
 */
export async function redeemLoyaltyPoints(phone: string, storeId: string, pointsToRedeem: number, orderId: string) {
  const account = await prisma.loyaltyAccount.findUnique({ where: { phone } })
  if (!account || account.balance < pointsToRedeem) {
    throw new Error("Solde insuffisant")
  }

  // Débit
  await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: { balance: { decrement: pointsToRedeem } }
  })

  // Log
  await prisma.loyaltyTransaction.create({
    data: {
      account_id: account.id,
      type: 'redeem',
      points: -Math.abs(pointsToRedeem),
      description: `Paiement utilisé`,
      order_id: orderId,
      store_id: storeId
    }
  })

  return { success: true }
}

/**
 * (Public API Call) - Permet au checkout de chercher les points par numero
 */
export async function checkLoyaltyAccount(phone: string, storeId: string) {
  // on normalise le numero si besoin
  const cleanPhone = phone.replace(/\s+/g, '')

  const config = await prisma.loyaltyConfig.findUnique({ where: { store_id: storeId } })
  if (!config || !config.enabled) return { enabled: false }

  const account = await prisma.loyaltyAccount.findUnique({ where: { phone: cleanPhone } })
  
  return {
    enabled: true,
    config: { maxPerc: config.max_redeem_pct },
    account: account ? {
      balance: account.balance,
      tier: account.tier
    } : null
  }
}
