import { prisma } from '@/lib/prisma'
import React from 'react'
import MonetizationClient from './MonetizationClient'

export const dynamic = 'force-dynamic'

export default async function MonetizationAdminPage() {
  // Récupération des boutiques
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      store_name: true,
      user: { select: { name: true, phone: true } },
      ai_credits: true,
      sms_credits: { select: { credits: true, used: true } },
      subscriptions: { select: { plan: true } }
    } as any,
    orderBy: { updated_at: 'desc' }
  }) as any

  // Récupération des configs de monétisation SaaS
  const configs = await prisma.platformConfig.findMany({
    where: {
      key: {
        in: [
          'PRICE_SMS_PACK', 'PRICE_SMS_PACK_1000', 'VOLUME_SMS_PACK', 
          'PRICE_AI_PACK', 'PRICE_AI_PACK_100', 'VOLUME_AI_PACK', 
          'PRICE_CLOUD_EXTENSION'
        ]
      }
    },
    select: { key: true, value: true }
  })

  // Récupération de l'historique des paiements / transactions SaaS
  const purchases = await prisma.assetPurchase.findMany({
    include: {
      store: { select: { store_name: true, user: { select: { name: true } } } }
    },
    orderBy: { purchased_at: 'desc' },
    take: 50
  })

  return <MonetizationClient initialStores={stores} configs={configs} initialPurchases={purchases} />
}
