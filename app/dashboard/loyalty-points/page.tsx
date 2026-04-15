import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LoyaltyClient from './LoyaltyClient'

interface LoyaltyAccountRow {
  id: string
  phone: string
  total_earned: number
  balance: number
  tier: string
  created_at: string
}

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const store = await prisma.store.findUnique({
    where: { user_id: user.id },
    select: { id: true }
  })

  if (!store) {
    return (
      <div className="p-8 text-center text-slate-500">
        Veuillez configurer votre boutique avant d'accéder à ce volet.
      </div>
    )
  }

  // Obtenir la configuration
  let config = await prisma.loyaltyConfig.findUnique({
    where: { store_id: store.id }
  })

  if (!config) {
    config = await prisma.loyaltyConfig.create({
      data: {
        store_id: store.id,
        enabled: false,
        points_per_100: 1,
        max_redeem_pct: 20
      }
    })
  }

  // Obtenir les clients ayant cumulé des points via cette boutique.
  // Note: LoyaltyAccount est global par Phone, mais LoyaltyTransaction est par store
  // Pour le leaderboard du vendeur, on prend les comptes qui ont au moins une transaction dans ce store.
  const accountsWithTx = await prisma.loyaltyAccount.findMany({
    where: {
      transactions: {
        some: { store_id: store.id }
      }
    },
    orderBy: { balance: 'desc' },
    take: 50
  })

  // Pour les présenter au vendeur, on filtre et map.
  const serializedAccounts: LoyaltyAccountRow[] = accountsWithTx.map(acc => ({
    id: acc.id,
    phone: acc.phone,
    total_earned: acc.total_earned,
    balance: acc.balance,
    tier: acc.tier,
    created_at: acc.created_at.toISOString()
  }))

  return (
    <div className="animate-in fade-in duration-500">
      <LoyaltyClient 
        storeId={store.id} 
        config={config} 
        accounts={serializedAccounts} 
      />
    </div>
  )
}
